import Foundation
import AppKit

final class CSVExportService {
    static let shared = CSVExportService()
    private init() {}

    func export(subscriptions: [Subscription]) {
        let headers = [
            "Name", "Cost", "Currency", "Billing Cycle", "Next Billing",
            "Payment Method", "Tags", "Status", "Trial Days", "Last Used",
            "Annual Cost", "Notes"
        ]

        let rows: [[String]] = subscriptions.map { sub in
            [
                sub.name,
                String(format: "%.2f", sub.cost),
                sub.costCurrency,
                sub.billingCycle == "custom" ? "every \(sub.customDays) days" : sub.billingCycle,
                DateHelpers.shortDate(sub.nextBilling),
                sub.paymentMethod,
                sub.tags.joined(separator: "; "),
                sub.isCanceled ? "Canceled" : (sub.isActiveTrial ? "Trial" : "Active"),
                sub.trialDays > 0 ? String(sub.trialDays) : "",
                sub.lastUsed.map { DateHelpers.shortDate($0) } ?? "",
                sub.annualCost > 0 ? String(format: "%.2f", sub.annualCost) : "",
                sub.notes
            ]
        }

        let csvString = ([headers] + rows)
            .map { row in row.map { "\"\($0.replacingOccurrences(of: "\"", with: "\"\""))\"" }.joined(separator: ",") }
            .joined(separator: "\n")

        let panel = NSSavePanel()
        panel.allowedContentTypes = [.commaSeparatedText]
        panel.nameFieldStringValue = "subscriptions-\(ISO8601DateFormatter().string(from: Date()).prefix(10)).csv"
        panel.title = "Export Subscriptions"

        panel.begin { response in
            guard response == .OK, let url = panel.url else { return }
            try? csvString.write(to: url, atomically: true, encoding: .utf8)
        }
    }
}
