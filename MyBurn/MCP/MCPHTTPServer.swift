import Foundation
import Network
import SwiftData

/// Embedded HTTP server that exposes the subscription data store to the MCP Node.js wrapper.
/// Listens on a random port and writes it to ~/.myburnport so the MCP server can connect.
@MainActor
final class MCPHTTPServer {
    static let shared = MCPHTTPServer()
    private init() {}

    private var listener: NWListener?
    private(set) var port: UInt16 = 0

    // We keep a reference to the SwiftData context set from the app
    var modelContext: ModelContext?

    func start() async {
        do {
            let params = NWParameters.tcp
            listener = try NWListener(using: params)
            listener?.newConnectionHandler = { [weak self] connection in
                self?.handleConnection(connection)
            }
            listener?.stateUpdateHandler = { [weak self] state in
                if case .ready = state {
                    self?.port = self?.listener?.port?.rawValue ?? 0
                    self?.writePortFile()
                }
            }
            listener?.start(queue: .global(qos: .background))
        } catch {
            print("[MCPHTTPServer] Failed to start: \(error)")
        }
    }

    func stop() {
        listener?.cancel()
        try? FileManager.default.removeItem(at: portFileURL)
    }

    // MARK: - Port file

    private var portFileURL: URL {
        FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent(".myburnport")
    }

    private func writePortFile() {
        try? String(port).write(to: portFileURL, atomically: true, encoding: .utf8)
    }

    // MARK: - Connection handling

    private func handleConnection(_ connection: NWConnection) {
        connection.start(queue: .global(qos: .background))
        receiveRequest(on: connection)
    }

    private func receiveRequest(on connection: NWConnection) {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 65536) { [weak self] data, _, isComplete, error in
            guard let self, let data, !data.isEmpty else {
                connection.cancel()
                return
            }

            let request = String(data: data, encoding: .utf8) ?? ""
            let responseData = self.route(request: request)
            self.sendResponse(data: responseData, on: connection)
        }
    }

    private func sendResponse(data: Data, on connection: NWConnection) {
        let header = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: \(data.count)\r\nAccess-Control-Allow-Origin: *\r\n\r\n"
        var response = Data(header.utf8)
        response.append(data)
        connection.send(content: response, completion: .contentProcessed { _ in
            connection.cancel()
        })
    }

    // MARK: - Routing

    private func route(request: String) -> Data {
        // Parse first line: "GET /path HTTP/1.1"
        let lines = request.components(separatedBy: "\r\n")
        guard let firstLine = lines.first else { return errorJSON("Bad request") }
        let parts = firstLine.components(separatedBy: " ")
        guard parts.count >= 2 else { return errorJSON("Bad request") }

        let method = parts[0]
        let path = parts[1]

        // Find body (after double CRLF)
        let bodyString = request.components(separatedBy: "\r\n\r\n").dropFirst().joined(separator: "\r\n\r\n")
        let bodyData = bodyString.data(using: .utf8) ?? Data()

        switch (method, path) {
        case ("GET", "/subscriptions"):    return handleListSubscriptions()
        case ("GET", "/analytics"):        return handleAnalytics()
        case ("GET", "/upcoming"):         return handleUpcoming(query: path)
        case ("POST", "/subscriptions"):   return handleAddSubscription(body: bodyData)
        case ("PATCH", _) where path.hasPrefix("/subscriptions/"):
            let id = path.replacingOccurrences(of: "/subscriptions/", with: "")
            return handleUpdateSubscription(id: id, body: bodyData)
        case ("DELETE", _) where path.hasPrefix("/subscriptions/"):
            let id = path.replacingOccurrences(of: "/subscriptions/", with: "")
            return handleCancelSubscription(id: id)
        default:
            return errorJSON("Not found")
        }
    }

    // MARK: - Handlers

    private func handleListSubscriptions() -> Data {
        guard let context = modelContext else { return errorJSON("No context") }
        let subs = (try? context.fetch(FetchDescriptor<Subscription>())) ?? []
        let json = subs.map { subToDict($0) }
        return (try? JSONSerialization.data(withJSONObject: ["subscriptions": json])) ?? errorJSON("Encode error")
    }

    private func handleAnalytics() -> Data {
        guard let context = modelContext else { return errorJSON("No context") }
        let subs = ((try? context.fetch(FetchDescriptor<Subscription>())) ?? []).filter { !$0.isCanceled }
        let monthlyTotal = subs.reduce(0.0) { $0 + $1.monthlyCost }
        var byTag: [String: Double] = [:]
        for sub in subs {
            let tags = sub.tags.isEmpty ? ["Untagged"] : sub.tags
            for tag in tags { byTag[tag, default: 0] += sub.monthlyCost }
        }
        let json: [String: Any] = [
            "monthly_total_usd": monthlyTotal,
            "yearly_total_usd": monthlyTotal * 12,
            "active_count": subs.count,
            "zombie_count": subs.filter { $0.isZombie }.count,
            "by_category": byTag
        ]
        return (try? JSONSerialization.data(withJSONObject: json)) ?? errorJSON("Encode error")
    }

    private func handleUpcoming(query: String) -> Data {
        guard let context = modelContext else { return errorJSON("No context") }
        let allSubs = (try? context.fetch(FetchDescriptor<Subscription>())) ?? []
        let days = 30
        let upcoming = allSubs
            .filter { !$0.isCanceled && $0.daysUntilRenewal >= 0 && $0.daysUntilRenewal <= days }
            .sorted { $0.daysUntilRenewal < $1.daysUntilRenewal }
            .map { subToDict($0) }
        return (try? JSONSerialization.data(withJSONObject: ["upcoming": upcoming, "within_days": days])) ?? errorJSON("Encode error")
    }

    private func handleAddSubscription(body: Data) -> Data {
        guard let context = modelContext,
              let dict = try? JSONSerialization.jsonObject(with: body) as? [String: Any] else {
            return errorJSON("Invalid body")
        }

        let name = dict["name"] as? String ?? "New Subscription"
        let cost = dict["cost"] as? Double ?? 0
        let currency = dict["currency"] as? String ?? "USD"
        let cycle = dict["cycle"] as? String ?? "monthly"
        let tags = dict["tags"] as? [String] ?? []

        let startDate = Date()
        let nextBill = DateHelpers.nextBilling(from: startDate, cycle: cycle, customDays: 30)

        let sub = Subscription(
            name: name, cost: cost, costCurrency: currency,
            billingCycle: cycle, startDate: startDate, nextBilling: nextBill, tags: tags
        )
        context.insert(sub)
        return (try? JSONSerialization.data(withJSONObject: ["created": subToDict(sub)])) ?? errorJSON("Encode error")
    }

    private func handleUpdateSubscription(id: String, body: Data) -> Data {
        guard let context = modelContext,
              let uuid = UUID(uuidString: id) else { return errorJSON("Invalid ID") }
        let subs = (try? context.fetch(FetchDescriptor<Subscription>())) ?? []
        guard let sub = subs.first(where: { $0.id == uuid }) else { return errorJSON("Not found") }

        if let dict = try? JSONSerialization.jsonObject(with: body) as? [String: Any] {
            if let name = dict["name"] as? String { sub.name = name }
            if let cost = dict["cost"] as? Double { sub.cost = cost }
            if let cycle = dict["cycle"] as? String { sub.billingCycle = cycle }
            if let tags = dict["tags"] as? [String] { sub.tags = tags }
            if let notes = dict["notes"] as? String { sub.notes = notes }
        }
        return (try? JSONSerialization.data(withJSONObject: ["updated": subToDict(sub)])) ?? errorJSON("Encode error")
    }

    private func handleCancelSubscription(id: String) -> Data {
        guard let context = modelContext,
              let uuid = UUID(uuidString: id) else { return errorJSON("Invalid ID") }
        let subs = (try? context.fetch(FetchDescriptor<Subscription>())) ?? []
        guard let sub = subs.first(where: { $0.id == uuid }) else { return errorJSON("Not found") }
        sub.isCanceled = true
        return (try? JSONSerialization.data(withJSONObject: ["canceled": subToDict(sub)])) ?? errorJSON("Encode error")
    }

    // MARK: - Helpers

    private func subToDict(_ sub: Subscription) -> [String: Any] {
        var d: [String: Any] = [
            "id": sub.id.uuidString,
            "name": sub.name,
            "cost": sub.cost,
            "currency": sub.costCurrency,
            "cycle": sub.billingCycle,
            "next_billing": ISO8601DateFormatter().string(from: sub.nextBilling),
            "days_until_renewal": sub.daysUntilRenewal,
            "monthly_cost_usd": sub.monthlyCost,
            "payment_method": sub.paymentMethod,
            "tags": sub.tags,
            "notes": sub.notes,
            "is_canceled": sub.isCanceled,
            "is_zombie": sub.isZombie,
            "is_trial": sub.isActiveTrial,
            "trial_days_remaining": sub.trialDaysRemaining
        ]
        if let lastUsed = sub.lastUsed {
            d["last_used"] = ISO8601DateFormatter().string(from: lastUsed)
        }
        return d
    }

    private func errorJSON(_ message: String) -> Data {
        (try? JSONSerialization.data(withJSONObject: ["error": message])) ?? Data()
    }
}
