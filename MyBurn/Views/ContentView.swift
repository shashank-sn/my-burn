import SwiftUI
import SwiftData

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var currency: CurrencyService
    @Query private var subscriptions: [Subscription]
    @Query private var paymentMethods: [PaymentMethod]
    @Environment(\.modelContext) private var context

    var body: some View {
        NavigationSplitView {
            SidebarView()
                .navigationSplitViewColumnWidth(min: 180, ideal: 200, max: 240)
        } detail: {
            SubscriptionListView()
        }
        .navigationTitle("My Burn")
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                Button {
                    currency.toggle()
                } label: {
                    Text(currency.displayCurrency == "USD" ? "$ USD" : "₹ INR")
                        .font(.system(size: 12, weight: .medium))
                }
                .buttonStyle(.bordered)

                Button {
                    appState.showAddSheet = true
                } label: {
                    Image(systemName: "plus")
                }
                .keyboardShortcut("n", modifiers: .command)
            }

            ToolbarItemGroup(placement: .secondaryAction) {
                Menu {
                    ForEach(AppState.SortOrder.allCases) { order in
                        Button(order.rawValue) {
                            appState.sortOrder = order
                        }
                    }
                } label: {
                    Label("Sort", systemImage: "arrow.up.arrow.down")
                }

                Button {
                    appState.showAnalytics.toggle()
                } label: {
                    Label("Analytics", systemImage: "chart.bar")
                }
            }
        }
        .sheet(isPresented: $appState.showAddSheet) {
            AddEditView(subscription: nil)
                .environmentObject(currency)
        }
        .sheet(item: $appState.editingSubscription) { sub in
            AddEditView(subscription: sub)
                .environmentObject(currency)
        }
        .sheet(isPresented: $appState.showAnalytics) {
            AnalyticsView()
                .environmentObject(currency)
        }
        .onAppear {
            seedPaymentMethodsIfNeeded()
        }
        .searchable(text: $appState.searchQuery, prompt: "Search subscriptions")
    }

    private func seedPaymentMethodsIfNeeded() {
        guard paymentMethods.isEmpty else { return }
        PaymentMethod.defaults.enumerated().forEach { i, name in
            context.insert(PaymentMethod(name: name, sortOrder: i))
        }
    }
}

// MARK: - Sidebar

struct SidebarView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var currency: CurrencyService
    @Query private var subscriptions: [Subscription]

    private var allTags: [String] {
        Array(Set(subscriptions.flatMap { $0.tags })).sorted()
    }

    private var monthlyTotal: Double {
        subscriptions
            .filter { !$0.isCanceled }
            .reduce(0) { $0 + currency.convert($1.monthlyCost, from: $1.costCurrency) }
    }

    var body: some View {
        List(selection: $appState.selectedSidebarItem) {
            // Total spend header
            VStack(alignment: .leading, spacing: 2) {
                Text("Monthly Spend")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(currency.format(monthlyTotal))
                    .font(.title2.bold())
            }
            .padding(.vertical, 6)
            .listRowSeparator(.hidden)

            Section("Library") {
                Label("All Subscriptions", systemImage: "square.grid.2x2")
                    .tag(AppState.SidebarItem.all)
                Label("Upcoming Renewals", systemImage: "calendar.badge.clock")
                    .tag(AppState.SidebarItem.upcoming)
                Label("Free Trials", systemImage: "star.circle")
                    .tag(AppState.SidebarItem.trials)
                Label("Zombies 🧟", systemImage: "zzz")
                    .tag(AppState.SidebarItem.zombies)
                Label("Canceled", systemImage: "xmark.circle")
                    .tag(AppState.SidebarItem.canceled)
            }

            if !allTags.isEmpty {
                Section("Tags") {
                    ForEach(allTags, id: \.self) { tag in
                        Label(tag, systemImage: "tag")
                            .tag(AppState.SidebarItem.tag(tag))
                    }
                }
            }
        }
        .listStyle(.sidebar)
    }
}
