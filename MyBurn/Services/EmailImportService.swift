import Foundation

/// Phase 3: Parse subscription receipts from .eml files or Gmail API responses.
/// Drag-drop an .eml file onto the app window to auto-detect subscription name, cost, and billing date.
final class EmailImportService {
    static let shared = EmailImportService()
    private init() {}

    struct ParsedSubscription {
        var name: String
        var cost: Double
        var currency: String
        var billingDate: Date?
    }

    /// Parse a .eml file at the given URL and attempt to extract subscription info.
    func parse(emlURL: URL) -> ParsedSubscription? {
        guard let content = try? String(contentsOf: emlURL, encoding: .utf8) else { return nil }
        return extract(from: content)
    }

    /// Parse raw email body text.
    func parse(emailBody: String) -> ParsedSubscription? {
        extract(from: emailBody)
    }

    // MARK: - Extraction

    private func extract(from text: String) -> ParsedSubscription? {
        let name = extractServiceName(from: text)
        guard let (cost, currency) = extractCost(from: text) else { return nil }
        let date = extractDate(from: text)
        return ParsedSubscription(name: name ?? "Unknown Service", cost: cost, currency: currency, billingDate: date)
    }

    private func extractServiceName(from text: String) -> String? {
        // Common patterns: "Your Netflix receipt", "Thank you for your Spotify subscription"
        let patterns = [
            #"(?:your|from|receipt for)\s+([A-Z][a-zA-Z0-9\s]+?)(?:\s+subscription|\s+receipt|\s+invoice|\s+plan|\.|,)"#,
            #"(?:charged by|payment to|billed by)\s+([A-Z][a-zA-Z0-9\s]+?)(?:\s|\.|,)"#
        ]
        for pattern in patterns {
            if let match = text.range(of: pattern, options: [.regularExpression, .caseInsensitive]) {
                let matched = String(text[match])
                // Clean up common prefixes
                for prefix in ["your ", "from ", "receipt for ", "charged by ", "payment to ", "billed by "] {
                    if matched.lowercased().hasPrefix(prefix) {
                        return String(matched.dropFirst(prefix.count)).trimmingCharacters(in: .whitespaces)
                    }
                }
                return matched.trimmingCharacters(in: .whitespaces)
            }
        }
        return nil
    }

    private func extractCost(from text: String) -> (Double, String)? {
        // Match: $9.99, USD 9.99, ₹499, INR 499
        let patterns = [
            (#"\$\s*(\d+(?:\.\d{1,2})?)"#, "USD"),
            (#"USD\s*(\d+(?:\.\d{1,2})?)"#, "USD"),
            (#"₹\s*(\d+(?:\.\d{1,2})?)"#, "INR"),
            (#"INR\s*(\d+(?:\.\d{1,2})?)"#, "INR")
        ]

        for (pattern, currency) in patterns {
            let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive)
            let range = NSRange(text.startIndex..., in: text)
            if let match = regex?.firstMatch(in: text, range: range),
               let costRange = Range(match.range(at: 1), in: text),
               let cost = Double(text[costRange]) {
                return (cost, currency)
            }
        }
        return nil
    }

    private func extractDate(from text: String) -> Date? {
        let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.date.rawValue)
        let range = NSRange(text.startIndex..., in: text)
        return detector?.firstMatch(in: text, range: range)?.date
    }
}
