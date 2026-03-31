# My Burn 🔥

A native macOS subscription tracker built with SwiftUI + SwiftData.

## Getting Started

### Prerequisites
- macOS 14 (Sonoma) or later
- Xcode 15 or later
- [xcodegen](https://github.com/yonaskolb/XcodeGen) (`brew install xcodegen`)

### Build the Xcode project

```bash
cd "My Burn"
brew install xcodegen   # if not already installed
xcodegen
open MyBurn.xcodeproj
```

Then press **⌘R** in Xcode to build and run.

---

## MCP Server (Claude Integration)

The MCP server lets Claude talk to My Burn — add subscriptions by voice, analyze your budget, detect zombies.

### Setup

```bash
cd mcp-server
npm install
```

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "myburn": {
      "command": "node",
      "args": ["/Users/shasha/Documents/My Burn/mcp-server/src/index.js"]
    }
  }
}
```

### Available Claude commands

| Say to Claude... | What happens |
|---|---|
| "What am I spending on subscriptions?" | Calls `get_analytics` |
| "I just signed up for Linear, $8/month" | Calls `add_subscription` |
| "Which subscriptions are zombies?" | Calls `analyze_budget` |
| "What's renewing this week?" | Calls `get_upcoming_renewals` |
| "Cancel my Audible subscription" | Calls `cancel_subscription` |
| "Analyze my budget and find savings" | Calls `analyze_budget` |

---

## Project Structure

```
MyBurn/
├── MyBurnApp.swift           App entry + menu bar setup
├── AppState.swift            Shared observable state
├── Models/
│   ├── Subscription.swift    SwiftData model (all fields)
│   └── PaymentMethod.swift   SwiftData model
├── Views/
│   ├── ContentView.swift     NavigationSplitView (sidebar + list)
│   ├── SubscriptionList/     List + row views
│   ├── AddEdit/              Add/edit form sheet
│   ├── Analytics/            Charts + insights view
│   └── MenuBar/              Menu bar widget
├── Services/
│   ├── NotificationService   Renewal reminders (7d + 1d before)
│   ├── CurrencyService       USD ↔ INR conversion
│   ├── CSVExportService      Export to CSV via NSSavePanel
│   └── EmailImportService    Parse .eml receipts (Phase 3)
├── MCP/
│   └── MCPHTTPServer         Embedded HTTP API for Claude
└── Utils/
    └── DateHelpers           Billing date calculations

mcp-server/
└── src/index.js              Node.js MCP server (Claude ↔ App bridge)
```

## Features

- **Phase 1:** Subscription CRUD, billing cycle tracking, tags, analytics, CSV export, dark mode
- **Phase 2:** Menu bar widget, system notifications (7d + 1d), iCloud sync, free trial tracking
- **Phase 3:** Email receipt import (.eml drag-drop), zombie detector, annual upgrade prompts, price history
- **Phase 4:** MCP integration — Claude can read, add, update, and analyze your subscriptions

## iCloud Sync

To enable iCloud sync, set your Team ID in Xcode's Signing & Capabilities tab and enable the CloudKit capability. SwiftData handles the rest automatically.
