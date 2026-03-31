import SwiftUI
import SwiftData

struct SubscriptionListView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var currency: CurrencyService
    @Query private var allSubscriptions: [Subscription]
    @Environment(\.modelContext) private var context

    private var filtered: [Subscription] {
        var subs = allSubscriptions

        // Sidebar filter
        switch appState.selectedSidebarItem {
        case .all:
            subs = subs.filter { !$0.isCanceled }
        case .upcoming:
            subs = subs.filter { !$0.isCanceled && $0.daysUntilRenewal <= 30 }
        case .trials:
            subs = subs.filter { $0.isActiveTrial }
        case .zombies:
            subs = subs.filter { $0.isZombie }
        case .canceled:
            subs = subs.filter { $0.isCanceled }
        case .tag(let tag):
            subs = subs.filter { !$0.isCanceled && $0.tags.contains(tag) }
        }

        // Search
        if !appState.searchQuery.isEmpty {
            subs = subs.filter {
                $0.name.localizedCaseInsensitiveContains(appState.searchQuery) ||
                $0.tags.contains { $0.localizedCaseInsensitiveContains(appState.searchQuery) }
            }
        }

        // Sort
        switch appState.sortOrder {
        case .nextBilling:
            subs.sort { $0.nextBilling < $1.nextBilling }
        case .name:
            subs.sort { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
        case .cost:
            subs.sort { currency.convert($0.monthlyCost, from: $0.costCurrency) > currency.convert($1.monthlyCost, from: $1.costCurrency) }
        case .createdAt:
            subs.sort { $0.createdAt > $1.createdAt }
        }

        return subs
    }

    var body: some View {
        Group {
            if filtered.isEmpty {
                emptyState
            } else {
                List {
                    ForEach(filtered) { sub in
                        SubscriptionRow(subscription: sub)
                            .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
                    }
                }
                .listStyle(.inset)
            }
        }
        .navigationTitle(sidebarTitle)
    }

    private var sidebarTitle: String {
        switch appState.selectedSidebarItem {
        case .all:         return "All Subscriptions"
        case .upcoming:    return "Upcoming Renewals"
        case .trials:      return "Free Trials"
        case .zombies:     return "Zombies"
        case .canceled:    return "Canceled"
        case .tag(let t):  return "#\(t)"
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "tray")
                .font(.system(size: 48))
                .foregroundStyle(.tertiary)
            Text("No subscriptions here")
                .font(.title3.weight(.medium))
                .foregroundStyle(.secondary)
            if appState.selectedSidebarItem == .all {
                Button("Add Subscription") {
                    appState.showAddSheet = true
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
