import Foundation
import SwiftData

@Model
final class Subscription {
    var id: UUID
    var name: String
    var cost: Double
    var costCurrency: String       // "USD" | "INR"
    var billingCycle: String       // "monthly" | "yearly" | "custom"
    var customDays: Int
    var startDate: Date
    var nextBilling: Date
    var paymentMethod: String
    var tagsJSON: String           // JSON-encoded [String]
    var notes: String
    var isCanceled: Bool
    var isPaid: Bool
    var trialDays: Int             // 0 = no trial
    var trialStartDate: Date?
    var lastUsed: Date?
    var sharedWithJSON: String     // JSON-encoded [SharedUser]
    var annualCost: Double         // 0 = not available
    var previousCost: Double       // 0 = no history
    var costHistoryJSON: String    // JSON-encoded [CostHistoryEntry]
    var createdAt: Date

    init(
        id: UUID = UUID(),
        name: String = "",
        cost: Double = 0,
        costCurrency: String = "USD",
        billingCycle: String = "monthly",
        customDays: Int = 30,
        startDate: Date = Date(),
        nextBilling: Date = Date(),
        paymentMethod: String = "",
        tags: [String] = [],
        notes: String = "",
        isCanceled: Bool = false,
        isPaid: Bool = false,
        trialDays: Int = 0,
        trialStartDate: Date? = nil,
        lastUsed: Date? = nil,
        sharedWith: [SharedUser] = [],
        annualCost: Double = 0,
        previousCost: Double = 0,
        costHistory: [CostHistoryEntry] = [],
        createdAt: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.cost = cost
        self.costCurrency = costCurrency
        self.billingCycle = billingCycle
        self.customDays = customDays
        self.startDate = startDate
        self.nextBilling = nextBilling
        self.paymentMethod = paymentMethod
        self.tagsJSON = (try? JSONEncoder().encode(tags)).flatMap { String(data: $0, encoding: .utf8) } ?? "[]"
        self.notes = notes
        self.isCanceled = isCanceled
        self.isPaid = isPaid
        self.trialDays = trialDays
        self.trialStartDate = trialStartDate
        self.lastUsed = lastUsed
        self.sharedWithJSON = (try? JSONEncoder().encode(sharedWith)).flatMap { String(data: $0, encoding: .utf8) } ?? "[]"
        self.annualCost = annualCost
        self.previousCost = previousCost
        self.costHistoryJSON = (try? JSONEncoder().encode(costHistory)).flatMap { String(data: $0, encoding: .utf8) } ?? "[]"
        self.createdAt = createdAt
    }

    // MARK: - Computed helpers

    var tags: [String] {
        get {
            guard let data = tagsJSON.data(using: .utf8),
                  let decoded = try? JSONDecoder().decode([String].self, from: data) else { return [] }
            return decoded
        }
        set {
            tagsJSON = (try? JSONEncoder().encode(newValue)).flatMap { String(data: $0, encoding: .utf8) } ?? "[]"
        }
    }

    var sharedWith: [SharedUser] {
        get {
            guard let data = sharedWithJSON.data(using: .utf8),
                  let decoded = try? JSONDecoder().decode([SharedUser].self, from: data) else { return [] }
            return decoded
        }
        set {
            sharedWithJSON = (try? JSONEncoder().encode(newValue)).flatMap { String(data: $0, encoding: .utf8) } ?? "[]"
        }
    }

    var costHistory: [CostHistoryEntry] {
        get {
            guard let data = costHistoryJSON.data(using: .utf8),
                  let decoded = try? JSONDecoder().decode([CostHistoryEntry].self, from: data) else { return [] }
            return decoded
        }
        set {
            costHistoryJSON = (try? JSONEncoder().encode(newValue)).flatMap { String(data: $0, encoding: .utf8) } ?? "[]"
        }
    }

    var isActiveTrial: Bool {
        guard trialDays > 0, let trialStart = trialStartDate else { return false }
        let trialEnd = Calendar.current.date(byAdding: .day, value: trialDays, to: trialStart) ?? trialStart
        return Date() < trialEnd
    }

    var trialDaysRemaining: Int {
        guard trialDays > 0, let trialStart = trialStartDate else { return 0 }
        let trialEnd = Calendar.current.date(byAdding: .day, value: trialDays, to: trialStart) ?? trialStart
        return max(0, Calendar.current.dateComponents([.day], from: Date(), to: trialEnd).day ?? 0)
    }

    var daysUntilRenewal: Int {
        let today = Calendar.current.startOfDay(for: Date())
        let next = Calendar.current.startOfDay(for: nextBilling)
        return Calendar.current.dateComponents([.day], from: today, to: next).day ?? 0
    }

    var isZombie: Bool {
        guard !isCanceled, let last = lastUsed else { return false }
        return Calendar.current.dateComponents([.day], from: last, to: Date()).day ?? 0 > 30
    }

    var monthlyCost: Double {
        switch billingCycle {
        case "monthly": return cost
        case "yearly":  return cost / 12.0
        case "custom":  return customDays > 0 ? (cost / Double(customDays)) * 30.0 : cost
        default:        return cost
        }
    }

    var effectiveSharableSavings: Double {
        sharedWith.reduce(0) { $0 + $1.amount }
    }

    var annualSavingsVsMonthly: Double {
        guard annualCost > 0 else { return 0 }
        return (monthlyCost * 12) - annualCost
    }
}

// MARK: - Supporting types

struct SharedUser: Codable, Identifiable {
    var id: UUID = UUID()
    var name: String
    var amount: Double
    var currency: String
}

struct CostHistoryEntry: Codable {
    var date: Date
    var cost: Double
    var currency: String
}
