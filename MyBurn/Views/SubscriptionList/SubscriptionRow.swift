import SwiftUI

struct SubscriptionRow: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var currency: CurrencyService
    @Environment(\.modelContext) private var context
    let subscription: Subscription

    private var urgency: UrgencyLevel {
        DateHelpers.urgencyLevel(daysUntil: subscription.daysUntilRenewal)
    }

    private var urgencyColor: Color {
        switch urgency {
        case .overdue:  return .red
        case .critical: return .red
        case .warning:  return .orange
        case .normal:   return .secondary
        }
    }

    var body: some View {
        HStack(spacing: 12) {
            // Urgency indicator
            RoundedRectangle(cornerRadius: 3)
                .fill(urgencyColor)
                .frame(width: 4)
                .opacity(subscription.isCanceled ? 0 : 1)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(subscription.name)
                        .font(.body.weight(.medium))
                        .strikethrough(subscription.isCanceled)
                        .foregroundStyle(subscription.isCanceled ? .secondary : .primary)

                    if subscription.isActiveTrial {
                        trialBadge
                    }

                    if subscription.isZombie {
                        Text("🧟")
                            .font(.caption)
                    }

                    Spacer()

                    Text(currency.format(subscription.monthlyCost, from: subscription.costCurrency) + "/mo")
                        .font(.body.monospacedDigit())
                        .foregroundStyle(subscription.isCanceled ? .secondary : .primary)
                }

                HStack {
                    if !subscription.tags.isEmpty {
                        ForEach(subscription.tags.prefix(3), id: \.self) { tag in
                            Text(tag)
                                .font(.caption2)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(.quaternary)
                                .clipShape(Capsule())
                        }
                    }

                    Spacer()

                    Text(renewalText)
                        .font(.caption)
                        .foregroundStyle(urgencyColor)
                }
            }
        }
        .padding(.vertical, 6)
        .contentShape(Rectangle())
        .contextMenu {
            contextMenuItems
        }
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            Button(role: .destructive) {
                context.delete(subscription)
            } label: {
                Label("Delete", systemImage: "trash")
            }

            Button {
                appState.editingSubscription = subscription
            } label: {
                Label("Edit", systemImage: "pencil")
            }
            .tint(.blue)
        }
        .swipeActions(edge: .leading) {
            Button {
                subscription.isCanceled.toggle()
            } label: {
                Label(subscription.isCanceled ? "Reactivate" : "Cancel", systemImage: subscription.isCanceled ? "arrow.counterclockwise" : "xmark")
            }
            .tint(subscription.isCanceled ? .green : .orange)
        }
    }

    private var renewalText: String {
        guard !subscription.isCanceled else { return "Canceled" }
        let days = subscription.daysUntilRenewal
        switch days {
        case ..<0:  return "Overdue"
        case 0:     return "Due Today"
        case 1:     return "Due Tomorrow"
        default:    return "In \(days) days · \(DateHelpers.shortDate(subscription.nextBilling))"
        }
    }

    private var trialBadge: some View {
        Text("\(subscription.trialDaysRemaining)d trial")
            .font(.caption2.weight(.semibold))
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .foregroundStyle(.white)
            .background(.purple)
            .clipShape(Capsule())
    }

    @ViewBuilder
    private var contextMenuItems: some View {
        Button("Edit") { appState.editingSubscription = subscription }
        Button(subscription.isCanceled ? "Reactivate" : "Cancel") {
            subscription.isCanceled.toggle()
        }
        if subscription.annualSavingsVsMonthly > 0 {
            Divider()
            Button("Switch to Annual (save \(currency.format(subscription.annualSavingsVsMonthly, from: subscription.costCurrency))/yr)") {
                switchToAnnual()
            }
        }
        Divider()
        Button("Mark Last Used Today") {
            subscription.lastUsed = Date()
        }
        Divider()
        Button("Delete", role: .destructive) {
            context.delete(subscription)
        }
    }

    private func switchToAnnual() {
        subscription.billingCycle = "yearly"
        subscription.cost = subscription.annualCost
        subscription.nextBilling = DateHelpers.nextBilling(
            from: subscription.startDate,
            cycle: "yearly",
            customDays: 0
        )
    }
}
