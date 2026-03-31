import SwiftUI
import SwiftData
import UserNotifications

@main
struct MyBurnApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var currency = CurrencyService()

    let modelContainer: ModelContainer

    init() {
        let schema = Schema([Subscription.self, PaymentMethod.self])
        let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
        do {
            modelContainer = try ModelContainer(for: schema, configurations: [config])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }

        // Request notification permission on launch
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }

        // Start the embedded MCP HTTP server
        Task {
            await MCPHTTPServer.shared.start()
        }
    }

    var body: some Scene {
        // Main window
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .environmentObject(currency)
                .modelContainer(modelContainer)
        }
        .windowStyle(.automatic)
        .windowResizability(.contentMinSize)
        .commands {
            CommandGroup(after: .newItem) {
                Button("New Subscription") {
                    appState.showAddSheet = true
                }
                .keyboardShortcut("n", modifiers: .command)

                Divider()

                Button("Toggle Currency") {
                    currency.toggle()
                }
                .keyboardShortcut("t", modifiers: [.command, .shift])
            }
        }

        // Menu bar widget
        MenuBarExtra {
            MenuBarView()
                .environmentObject(appState)
                .environmentObject(currency)
                .modelContainer(modelContainer)
        } label: {
            HStack(spacing: 4) {
                Image(systemName: "flame.fill")
                Text(currency.displayCurrency == "USD" ? "$" : "₹")
            }
        }
        .menuBarExtraStyle(.window)
    }
}
