import SwiftUI
import SwiftData

struct AddEditView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context
    @EnvironmentObject var currency: CurrencyService
    @Query(sort: \PaymentMethod.sortOrder) private var paymentMethods: [PaymentMethod]

    // Existing subscription (nil = add mode)
    var subscription: Subscription?

    // Form state
    @State private var name = ""
    @State private var cost = ""
    @State private var costCurrency = "USD"
    @State private var billingCycle = "monthly"
    @State private var customDays = "30"
    @State private var startDate = Date()
    @State private var paymentMethod = ""
    @State private var tagsInput = ""       // comma-separated
    @State private var notes = ""
    @State private var trialDays = ""
    @State private var trialStartDate = Date()
    @State private var hasTrial = false
    @State private var lastUsed = Date()
    @State private var trackUsage = false
    @State private var annualCost = ""
    @State private var hasAnnualOption = false
    @State private var newPaymentMethod = ""
    @State private var showAddPaymentMethod = false

    private var isEditing: Bool { subscription != nil }

    var body: some View {
        NavigationStack {
            Form {
                // MARK: Basic Info
                Section("Subscription") {
                    TextField("Name (e.g. Netflix, Figma)", text: $name)

                    HStack {
                        Picker("Currency", selection: $costCurrency) {
                            Text("USD ($)").tag("USD")
                            Text("INR (₹)").tag("INR")
                        }
                        .pickerStyle(.segmented)
                        .frame(maxWidth: 160)

                        TextField("Cost", text: $cost)
                            .textFieldStyle(.roundedBorder)
                    }

                    Picker("Billing Cycle", selection: $billingCycle) {
                        Text("Monthly").tag("monthly")
                        Text("Yearly").tag("yearly")
                        Text("Custom").tag("custom")
                    }
                    .pickerStyle(.segmented)

                    if billingCycle == "custom" {
                        HStack {
                            Text("Every")
                            TextField("Days", text: $customDays)
                                .frame(width: 60)
                                .textFieldStyle(.roundedBorder)
                            Text("days")
                            Spacer()
                        }
                    }

                    DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
                }

                // MARK: Payment
                Section("Payment") {
                    HStack {
                        Picker("Method", selection: $paymentMethod) {
                            Text("None").tag("")
                            ForEach(paymentMethods) { m in
                                Text(m.name).tag(m.name)
                            }
                        }

                        Button {
                            showAddPaymentMethod = true
                        } label: {
                            Image(systemName: "plus.circle")
                        }
                        .buttonStyle(.plain)
                    }

                    if showAddPaymentMethod {
                        HStack {
                            TextField("New payment method", text: $newPaymentMethod)
                            Button("Add") {
                                guard !newPaymentMethod.isEmpty else { return }
                                let m = PaymentMethod(name: newPaymentMethod, sortOrder: paymentMethods.count)
                                context.insert(m)
                                paymentMethod = newPaymentMethod
                                newPaymentMethod = ""
                                showAddPaymentMethod = false
                            }
                            .buttonStyle(.borderedProminent)
                        }
                    }
                }

                // MARK: Tags & Notes
                Section("Organization") {
                    TextField("Tags (comma-separated: Work, SaaS, Design)", text: $tagsInput)

                    TextField("Notes", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }

                // MARK: Free Trial
                Section("Free Trial") {
                    Toggle("Has Free Trial", isOn: $hasTrial)

                    if hasTrial {
                        HStack {
                            TextField("Trial days", text: $trialDays)
                                .frame(width: 80)
                                .textFieldStyle(.roundedBorder)
                            Text("days")
                            Spacer()
                        }
                        DatePicker("Trial started", selection: $trialStartDate, displayedComponents: .date)
                    }
                }

                // MARK: Usage Tracking
                Section("Usage") {
                    Toggle("Track Last Used", isOn: $trackUsage)
                    if trackUsage {
                        DatePicker("Last Used", selection: $lastUsed, displayedComponents: .date)
                    }
                }

                // MARK: Annual Option
                Section("Annual Plan") {
                    Toggle("Annual option available", isOn: $hasAnnualOption)
                    if hasAnnualOption {
                        HStack {
                            Text(costCurrency == "USD" ? "$" : "₹")
                            TextField("Annual price", text: $annualCost)
                        }
                        if let monthly = Double(cost), let annual = Double(annualCost), annual > 0 {
                            let savings = (monthly * 12) - annual
                            if savings > 0 {
                                Text("Save \(costCurrency == "USD" ? "$" : "₹")\(String(format: "%.2f", savings)) per year vs monthly")
                                    .font(.caption)
                                    .foregroundStyle(.green)
                            }
                        }
                    }
                }
            }
            .navigationTitle(isEditing ? "Edit Subscription" : "New Subscription")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isEditing ? "Save" : "Add") { save() }
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || Double(cost) == nil)
                }
            }
        }
        .frame(minWidth: 480, minHeight: 500)
        .onAppear { loadExisting() }
    }

    // MARK: - Load / Save

    private func loadExisting() {
        guard let sub = subscription else { return }
        name = sub.name
        cost = String(sub.cost)
        costCurrency = sub.costCurrency
        billingCycle = sub.billingCycle
        customDays = String(sub.customDays)
        startDate = sub.startDate
        paymentMethod = sub.paymentMethod
        tagsInput = sub.tags.joined(separator: ", ")
        notes = sub.notes
        hasTrial = sub.trialDays > 0
        trialDays = hasTrial ? String(sub.trialDays) : ""
        trialStartDate = sub.trialStartDate ?? Date()
        trackUsage = sub.lastUsed != nil
        lastUsed = sub.lastUsed ?? Date()
        hasAnnualOption = sub.annualCost > 0
        annualCost = hasAnnualOption ? String(sub.annualCost) : ""
    }

    private func save() {
        let parsedCost = Double(cost) ?? 0
        let parsedCustomDays = Int(customDays) ?? 30
        let parsedTrialDays = hasTrial ? (Int(trialDays) ?? 0) : 0
        let parsedAnnualCost = hasAnnualOption ? (Double(annualCost) ?? 0) : 0
        let parsedTags = tagsInput
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }

        let nextBill = DateHelpers.nextBilling(from: startDate, cycle: billingCycle, customDays: parsedCustomDays)

        if let sub = subscription {
            // Update existing
            if parsedCost != sub.cost {
                var history = sub.costHistory
                history.append(CostHistoryEntry(date: Date(), cost: sub.cost, currency: sub.costCurrency))
                sub.costHistory = history
                sub.previousCost = sub.cost
            }
            sub.name = name
            sub.cost = parsedCost
            sub.costCurrency = costCurrency
            sub.billingCycle = billingCycle
            sub.customDays = parsedCustomDays
            sub.startDate = startDate
            sub.nextBilling = nextBill
            sub.paymentMethod = paymentMethod
            sub.tags = parsedTags
            sub.notes = notes
            sub.trialDays = parsedTrialDays
            sub.trialStartDate = hasTrial ? trialStartDate : nil
            sub.lastUsed = trackUsage ? lastUsed : nil
            sub.annualCost = parsedAnnualCost

            NotificationService.shared.scheduleRenewalNotifications(for: sub)
        } else {
            // Create new
            let sub = Subscription(
                name: name,
                cost: parsedCost,
                costCurrency: costCurrency,
                billingCycle: billingCycle,
                customDays: parsedCustomDays,
                startDate: startDate,
                nextBilling: nextBill,
                paymentMethod: paymentMethod,
                tags: parsedTags,
                notes: notes,
                trialDays: parsedTrialDays,
                trialStartDate: hasTrial ? trialStartDate : nil,
                lastUsed: trackUsage ? lastUsed : nil,
                annualCost: parsedAnnualCost
            )
            context.insert(sub)
            NotificationService.shared.scheduleRenewalNotifications(for: sub)
        }

        dismiss()
    }
}
