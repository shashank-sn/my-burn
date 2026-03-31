import { useAppStore } from '../store/app-store'

export default function SettingsView() {
  const { settings, updateSettings } = useAppStore()

  return (
    <div className="flex-1 p-8 pt-16 overflow-y-auto">
      <div className="max-w-lg">
        <h1 className="text-xl font-semibold mb-7">Settings</h1>

        <div className="space-y-6">
          {/* Currency */}
          <SettingRow
            label="Currency"
            description="Default currency for displaying costs"
          >
            <div className="flex gap-2">
              {(['USD', 'INR'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => updateSettings({ currency: c })}
                  className={`px-4 py-2 text-sm transition-colors ${
                    settings.currency === c
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  style={{
                    border: `1px solid ${settings.currency === c ? '#FF4D00' : 'var(--panel-border)'}`,
                    borderRadius: 'var(--btn-radius)'
                  }}
                >
                  {c === 'USD' ? '$ USD' : '₹ INR'}
                </button>
              ))}
            </div>
          </SettingRow>

          {/* Notifications */}
          <SettingRow
            label="Renewal Reminders"
            description="Get notified 7 days and 1 day before a subscription renews"
          >
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className="relative w-10 h-6 transition-colors"
                style={{
                  background: settings.notificationsEnabled ? '#FF4D00' : 'var(--elevated-bg)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: 12
                }}
                onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                  style={{
                    transform: `translateX(${settings.notificationsEnabled ? '18px' : '2px'})`,
                    transition: 'transform 0.2s'
                  }}
                />
              </div>
              <span className="text-sm text-text-primary">
                {settings.notificationsEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </SettingRow>

          {/* Design theme */}
          <SettingRow
            label="Design Theme"
            description="Switch between Liquid Glass (Apple-inspired) and Neobrutalism"
          >
            <div className="flex gap-2">
              {([
                { value: 'glass', label: '🫧 Liquid Glass' },
                { value: 'neo',   label: '◼ Neobrutalism' }
              ] as const).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateSettings({ designTheme: value })}
                  className={`px-4 py-2 text-sm transition-colors ${
                    (settings.designTheme ?? 'glass') === value
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  style={{
                    border: `1px solid ${(settings.designTheme ?? 'glass') === value ? '#FF4D00' : 'var(--panel-border)'}`,
                    borderRadius: 'var(--btn-radius)'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </SettingRow>

          {/* MCP setup */}
          <SettingRow
            label="Claude MCP Integration"
            description="Add to your Claude Desktop config to let Claude manage subscriptions"
          >
            <div
              className="p-3 font-mono text-xs text-text-muted leading-relaxed"
              style={{ background: 'var(--card-bg)', borderRadius: 'var(--card-radius)', border: '1px solid var(--panel-border)' }}
            >
              <div className="text-green-soft mb-1">// ~/Library/Application Support/Claude/claude_desktop_config.json</div>
              {`{\n  "mcpServers": {\n    "myburn": {\n      "command": "/opt/homebrew/bin/node",\n      "args": ["${window.location.href.includes('localhost') ? '/path/to' : ''}/resources/mcp-server.js"]\n    }\n  }\n}`}
            </div>
          </SettingRow>
        </div>
      </div>
    </div>
  )
}

function SettingRow({ label, description, children }: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div
      className="p-4 space-y-3"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--panel-border)', borderRadius: 'var(--card-radius)' }}
    >
      <div>
        <div className="text-sm font-medium text-text-primary">{label}</div>
        <div className="text-xs text-text-muted mt-0.5">{description}</div>
      </div>
      {children}
    </div>
  )
}
