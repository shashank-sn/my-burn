import Foundation
import SwiftUI

/// Shared app-wide state passed through the environment.
@MainActor
final class AppState: ObservableObject {
    @Published var showAddSheet = false
    @Published var editingSubscription: Subscription? = nil
    @Published var selectedSidebarItem: SidebarItem = .all
    @Published var searchQuery = ""
    @Published var sortOrder: SortOrder = .nextBilling
    @Published var showAnalytics = false

    enum SidebarItem: Hashable {
        case all
        case upcoming
        case trials
        case zombies
        case tag(String)
        case canceled
    }

    enum SortOrder: String, CaseIterable, Identifiable {
        case nextBilling = "Next Renewal"
        case name = "Name"
        case cost = "Cost"
        case createdAt = "Date Added"

        var id: String { rawValue }
    }
}
