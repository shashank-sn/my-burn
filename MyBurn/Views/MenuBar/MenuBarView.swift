import SwiftUI
import SwiftData

struct MenuBarView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var currency: CurrencyService
    @Query private var subscriptions: [Subscription]
    @Environment(\.openWindow) private var openWindow

    private var active: [Subscription] { subscriptions.filter { !$0.isCanceled } }

    private var monthlyTotal: Double {
        active.reduce(0) { $0 + currency.convert($1.monthlyCost, from: $1.costCurrency) }
    }

    private var upcoming: [Subscription] {
        active
            .filter { $0.daysUntilRenewal >= 0 }
            .sorted { $0.daysUntilRenewal < $1.daysUntilRenewal }
            .prefix(5)
            .map { $0 }
    }

    private var trials: [Subscription] {
        active.filter { $0.isActiveTrial }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("My Burn 🔥")
                        .font(.headline)
                    Text(currency.format(monthlyTotal) + " / month")
                        .font(.title3.bold().monospacedDigit())
                }
                Spacer()
                Button {
                    currency.toggle()
                } label: {
                    Text(currency.displayCurrency)
                        .font(.caption.weight(.medium))
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
            }
            .padding()

            Divider()

            if upcoming.isEmpty {
                Text("No upcoming renewals")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding()
            } else {
                VStack(alignment: .leading, spacing: 0) {
                    Text("UPCOMING")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .padding(.horizontal)
                        .padding(.top, 8)
                        .padding(.bottom, 4)

                    ForEach(upcoming) { sub in
                        HStack {
                            VStack(alignment: .leading, spacing: 1) {
                                Text(sub.name)
                                    .font(.subheadline.weight(.medium))
                                Text(DateHelpers.relativeDate(sub.nextBilling))
                                    .font(.caption)
                                    .foregroundStyle(urgencyColor(for: sub))
                            }
                            Spacer()
                            Text(currency.format(sub.cost, from: sub.costCurrency))
                                .font(.subheadline.monospacedDigit())
                        }
                        .padding(.horizontal)
                        .padding(.vertical, 6)
                        .background(sub.daysUntilRenewal <= 3 ? Color.red.opacity(0.06) : Color.clear)
                    }
                }
            }

            if !trials.isEmpty {
                Divider()
                VStack(alignment: .leading, spacing: 0) {
                    Text("TRIALS EXPIRING")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .padding(.horizontal)
                        .padding(.top, 8)
                        .padding(.bottom, 4)

                    ForEach(trials) { sub in
                        HStack {
                            Text(sub.name)
                                .font(.subheadline)
                            Spacer()
                            Text("\(sub.trialDaysRemaining)d left")
                                .font(.caption.monospacedDigit())
                                .foregroundStyle(.purple)
                        }
                        .padding(.horizontal)
                        .padding(.vertical, 5)
                    }
                }
            }

            Divider()

            // Footer actions
            HStack {
                Button("Open App") {
                    openWindow(id: "main")
                }
                .buttonStyle(.plain)
                .font(.subheadline)

                Spacer()

                Button {
                    appState.showAddSheet = true
                    openWindow(id: "main")
                } label: {
                    Image(systemName: "plus.circle.fill")
                }
                .buttonStyle(.plain)
                .font(.title3)
            }
            .padding()
        }
        .frame(width: 300)
    }

    private func urgencyColor(for sub: Subscription) -> Color {
        switch sub.daysUntilRenewal {
        case ..<0:   return .red
        case 0...3:  return .red
        case 4...7:  return .orange
        default:     return .secondary
        }
    }
}
