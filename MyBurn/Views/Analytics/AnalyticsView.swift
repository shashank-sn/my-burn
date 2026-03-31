import SwiftUI
import SwiftData
import Charts

struct AnalyticsView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var currency: CurrencyService
    @Query private var subscriptions: [Subscription]

    private var active: [Subscription] {
        subscriptions.filter { !$0.isCanceled }
    }

    private var monthlyTotal: Double {
        active.reduce(0) { $0 + currency.convert($1.monthlyCost, from: $1.costCurrency) }
    }

    private var yearlyTotal: Double { monthlyTotal * 12 }

    private var byTag: [(tag: String, amount: Double)] {
        var dict: [String: Double] = [:]
        for sub in active {
            let monthlyCost = currency.convert(sub.monthlyCost, from: sub.costCurrency)
            let tags = sub.tags.isEmpty ? ["Untagged"] : sub.tags
            for tag in tags {
                dict[tag, default: 0] += monthlyCost
            }
        }
        return dict.map { (tag: $0.key, amount: $0.value) }
            .sorted { $0.amount > $1.amount }
    }

    private var zombies: [Subscription] {
        active.filter { $0.isZombie }
    }

    private var zombieMonthlyCost: Double {
        zombies.reduce(0) { $0 + currency.convert($1.monthlyCost, from: $1.costCurrency) }
    }

    private var annualUpgrades: [Subscription] {
        active.filter { $0.annualSavingsVsMonthly > 0 && $0.billingCycle == "monthly" }
    }

    private var totalPotentialSavings: Double {
        annualUpgrades.reduce(0) { $0 + currency.convert($1.annualSavingsVsMonthly, from: $1.costCurrency) }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 20) {
                    // Top totals
                    HStack(spacing: 16) {
                        statCard("Monthly", value: currency.format(monthlyTotal), subtitle: "\(active.count) active")
                        statCard("Yearly", value: currency.format(yearlyTotal), subtitle: "projected")
                    }
                    .padding(.horizontal)

                    // Spending by tag chart
                    if !byTag.isEmpty {
                        GroupBox("Spending by Category") {
                            Chart(byTag, id: \.tag) { item in
                                SectorMark(
                                    angle: .value("Amount", item.amount),
                                    innerRadius: .ratio(0.6),
                                    angularInset: 2
                                )
                                .foregroundStyle(by: .value("Category", item.tag))
                                .annotation(position: .overlay) {
                                    if item.amount / monthlyTotal > 0.05 {
                                        Text(currency.format(item.amount))
                                            .font(.caption2.bold())
                                            .foregroundStyle(.white)
                                    }
                                }
                            }
                            .frame(height: 220)

                            Divider()

                            VStack(alignment: .leading, spacing: 6) {
                                ForEach(byTag, id: \.tag) { item in
                                    HStack {
                                        Text(item.tag)
                                            .font(.body)
                                        Spacer()
                                        Text(currency.format(item.amount) + "/mo")
                                            .font(.body.monospacedDigit())
                                            .foregroundStyle(.secondary)
                                        Text(String(format: "%.0f%%", (item.amount / monthlyTotal) * 100))
                                            .font(.caption.monospacedDigit())
                                            .foregroundStyle(.secondary)
                                            .frame(width: 36, alignment: .trailing)
                                    }
                                }
                            }
                            .padding(.top, 8)
                        }
                        .padding(.horizontal)
                    }

                    // Zombie detector
                    if !zombies.isEmpty {
                        GroupBox {
                            VStack(alignment: .leading, spacing: 10) {
                                Label("Zombie Subscriptions", systemImage: "zzz")
                                    .font(.headline)
                                Text("You're paying \(currency.format(zombieMonthlyCost))/mo for \(zombies.count) sub\(zombies.count == 1 ? "" : "s") you haven't used in 30+ days.")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)

                                ForEach(zombies) { sub in
                                    HStack {
                                        Text(sub.name)
                                        Spacer()
                                        if let lastUsed = sub.lastUsed {
                                            Text("Last used \(DateHelpers.shortDate(lastUsed))")
                                                .font(.caption)
                                                .foregroundStyle(.secondary)
                                        }
                                        Text(currency.format(sub.monthlyCost, from: sub.costCurrency) + "/mo")
                                            .font(.caption.monospacedDigit())
                                    }
                                }
                            }
                        }
                        .padding(.horizontal)
                    }

                    // Annual upgrade opportunities
                    if !annualUpgrades.isEmpty {
                        GroupBox {
                            VStack(alignment: .leading, spacing: 10) {
                                Label("Switch to Annual & Save", systemImage: "arrow.up.right.circle")
                                    .font(.headline)
                                Text("You could save \(currency.format(totalPotentialSavings))/year by switching these to annual billing.")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)

                                ForEach(annualUpgrades) { sub in
                                    HStack {
                                        Text(sub.name)
                                        Spacer()
                                        Text("Save \(currency.format(sub.annualSavingsVsMonthly, from: sub.costCurrency))/yr")
                                            .font(.caption)
                                            .foregroundStyle(.green)
                                    }
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Analytics")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .frame(minWidth: 500, minHeight: 600)
    }

    private func statCard(_ title: String, value: String, subtitle: String) -> some View {
        GroupBox {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.title2.bold().monospacedDigit())
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
