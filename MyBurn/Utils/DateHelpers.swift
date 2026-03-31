import Foundation

enum DateHelpers {
    static func nextBilling(from start: Date, cycle: String, customDays: Int) -> Date {
        var next = start
        let today = Date()
        let cal = Calendar.current

        switch cycle {
        case "monthly":
            while next <= today {
                next = cal.date(byAdding: .month, value: 1, to: next) ?? next
            }
        case "yearly":
            while next <= today {
                next = cal.date(byAdding: .year, value: 1, to: next) ?? next
            }
        case "custom":
            let days = customDays > 0 ? customDays : 30
            while next <= today {
                next = cal.date(byAdding: .day, value: days, to: next) ?? next
            }
        default:
            break
        }

        return next
    }

    static func daysUntil(_ date: Date) -> Int {
        let today = Calendar.current.startOfDay(for: Date())
        let target = Calendar.current.startOfDay(for: date)
        return Calendar.current.dateComponents([.day], from: today, to: target).day ?? 0
    }

    static func shortDate(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .none
        return f.string(from: date)
    }

    static func relativeDate(_ date: Date) -> String {
        let days = daysUntil(date)
        switch days {
        case 0:         return "Today"
        case 1:         return "Tomorrow"
        case 2...6:     return "In \(days) days"
        case 7:         return "In 1 week"
        default:        return shortDate(date)
        }
    }

    static func urgencyLevel(daysUntil days: Int) -> UrgencyLevel {
        switch days {
        case ..<0:   return .overdue
        case 0...3:  return .critical
        case 4...7:  return .warning
        default:     return .normal
        }
    }
}

enum UrgencyLevel {
    case overdue, critical, warning, normal
}
