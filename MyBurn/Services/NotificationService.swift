import Foundation
import UserNotifications

final class NotificationService {
    static let shared = NotificationService()
    private init() {}

    /// Schedule 7-day and 1-day renewal reminders for a subscription.
    func scheduleRenewalNotifications(for sub: Subscription) {
        cancelNotifications(for: sub)
        guard !sub.isCanceled else { return }

        let notifDays = [7, 1]
        for days in notifDays {
            let triggerDate = Calendar.current.date(byAdding: .day, value: -days, to: sub.nextBilling) ?? sub.nextBilling
            guard triggerDate > Date() else { continue }

            let content = UNMutableNotificationContent()
            content.title = "\(sub.name) renews \(days == 1 ? "tomorrow" : "in \(days) days")"
            content.body = "You'll be charged \(sub.costCurrency == "USD" ? "$" : "₹")\(String(format: "%.2f", sub.cost)) on \(DateHelpers.shortDate(sub.nextBilling))"
            content.sound = .default
            content.categoryIdentifier = "RENEWAL"

            var dc = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: triggerDate)
            dc.hour = 9
            dc.minute = 0
            let trigger = UNCalendarNotificationTrigger(dateMatching: dc, repeats: false)

            let request = UNNotificationRequest(
                identifier: notificationID(for: sub, days: days),
                content: content,
                trigger: trigger
            )
            UNUserNotificationCenter.current().add(request)
        }
    }

    /// Cancel all pending notifications for this subscription.
    func cancelNotifications(for sub: Subscription) {
        let ids = [7, 1].map { notificationID(for: sub, days: $0) }
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ids)
    }

    /// Re-schedule all active subscriptions (call on app launch).
    func rescheduleAll(subscriptions: [Subscription]) {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        for sub in subscriptions where !sub.isCanceled {
            scheduleRenewalNotifications(for: sub)
        }
    }

    private func notificationID(for sub: Subscription, days: Int) -> String {
        "myburnrenewal-\(sub.id.uuidString)-\(days)d"
    }
}
