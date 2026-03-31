import Foundation

/// Handles USD ↔ INR conversion and formatting.
/// Rate is hardcoded for now — can be replaced with a live API call later.
final class CurrencyService: ObservableObject {
    @Published var displayCurrency: String = "USD"

    private let usdToInr: Double = 83.5

    func convert(_ amount: Double, from sourceCurrency: String) -> Double {
        guard sourceCurrency != displayCurrency else { return amount }

        if displayCurrency == "INR" && sourceCurrency == "USD" {
            return amount * usdToInr
        } else if displayCurrency == "USD" && sourceCurrency == "INR" {
            return amount / usdToInr
        }
        return amount
    }

    func format(_ amount: Double, from sourceCurrency: String = "USD") -> String {
        let converted = convert(amount, from: sourceCurrency)
        return format(converted)
    }

    func format(_ amount: Double) -> String {
        if displayCurrency == "USD" {
            let parts = String(format: "%.2f", amount).split(separator: ".")
            let integer = parts[0]
            let decimal = parts.count > 1 ? parts[1] : "00"
            let formatted = formatWithCommas(String(integer), style: .us)
            return "$\(formatted).\(decimal)"
        } else {
            let parts = String(format: "%.2f", amount).split(separator: ".")
            let integer = String(parts[0])
            let decimal = parts.count > 1 ? String(parts[1]) : "00"
            let formatted = formatWithCommas(integer, style: .indian)
            return "₹\(formatted).\(decimal)"
        }
    }

    func toggle() {
        displayCurrency = displayCurrency == "USD" ? "INR" : "USD"
    }

    private enum CommaStyle { case us, indian }

    private func formatWithCommas(_ intStr: String, style: CommaStyle) -> String {
        guard intStr.count > 3 else { return intStr }
        var result = ""
        let chars = Array(intStr)

        switch style {
        case .us:
            for (i, c) in chars.reversed().enumerated() {
                if i > 0 && i % 3 == 0 { result = "," + result }
                result = String(c) + result
            }
        case .indian:
            // Last 3 digits, then groups of 2
            let last3 = String(chars.suffix(3))
            let remaining = String(chars.dropLast(3))
            var prefix = ""
            for (i, c) in remaining.reversed().enumerated() {
                if i > 0 && i % 2 == 0 { prefix = "," + prefix }
                prefix = String(c) + prefix
            }
            result = prefix.isEmpty ? last3 : "\(prefix),\(last3)"
        }
        return result
    }
}
