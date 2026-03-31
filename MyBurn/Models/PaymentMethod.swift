import Foundation
import SwiftData

@Model
final class PaymentMethod {
    var id: UUID
    var name: String
    var sortOrder: Int

    init(id: UUID = UUID(), name: String, sortOrder: Int = 0) {
        self.id = id
        self.name = name
        self.sortOrder = sortOrder
    }

    static let defaults = [
        "Credit Card",
        "Debit Card",
        "UPI",
        "Net Banking",
        "PayPal",
        "Bank Transfer"
    ]
}
