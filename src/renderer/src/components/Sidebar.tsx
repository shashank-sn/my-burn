import { useAppStore } from '../store/app-store'
import { monthlyCost, formatCurrency, isZombie, isActiveTrial } from '../utils'
import type { SidebarFilter } from '../types'

export default function Sidebar() {
  const {
    subscriptions,
    settings,
    sidebarFilter,
    setSidebarFilter,
    setShowAddModal,
    exportCSV,
    currentView,
    setCurrentView
  } = useAppStore()

  const active = subscriptions.filter((s) => !s.isCanceled)
  const monthlyTotal = active.reduce((sum, s) => sum + monthlyCost(s, settings.currency), 0)

  const allTags = [...new Set(subscriptions.flatMap((s) => s.tags))].sort()
  const upcomingCount = active.filter((s) => {
    const days = Math.ceil((new Date(s.nextBilling).getTime() - Date.now()) / 86400000)
    return days >= 0 && days <= 30
  }).length
  const trialCount = active.filter(isActiveTrial).length
  const zombieCount = active.filter(isZombie).length
  const canceledCount = subscriptions.filter((s) => s.isCanceled).length

  function navItem(filter: SidebarFilter, label: string, icon: string, count?: number) {
    const active = sidebarFilter === filter && currentView === 'subscriptions'
    return (
      <button
        key={filter}
        onClick={() => { setSidebarFilter(filter); setCurrentView('subscriptions') }}
        className={`no-drag flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors ${
          active
            ? 'glass-elevated text-text-primary'
            : 'text-text-secondary hover:text-text-primary'
        }`}
        style={{ borderRadius: 'var(--btn-radius)' }}
      >
        <span>{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        {count !== undefined && count > 0 && (
          <span
            className="text-xs text-text-muted px-1.5 py-0.5"
            style={{ background: 'var(--card-bg)', borderRadius: 6 }}
          >
            {count}
          </span>
        )}
      </button>
    )
  }

  return (
    <aside
      className="w-52 flex-shrink-0 glass-panel border-r border-border flex flex-col overflow-hidden"
      style={{ borderRight: '1px solid var(--panel-border)' }}
    >
      {/* Header */}
      <div
        className="pt-10 px-4 pb-4 theme-divider border-b"
        style={{ borderBottom: '1px solid var(--panel-border)' }}
      >
        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Monthly Burn</div>
        <div className="text-2xl font-bold text-text-primary">
          {formatCurrency(monthlyTotal, settings.currency)}
        </div>
        <div className="text-xs text-text-muted mt-0.5">{active.length} active</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <div className="text-xs text-text-muted uppercase tracking-wider px-3 py-2">Library</div>
        {navItem('all', 'All Subscriptions', '▦', active.length)}
        {navItem('upcoming', 'Upcoming', '📅', upcomingCount)}
        {navItem('trials', 'Free Trials', '⭐', trialCount || undefined)}
        {navItem('zombies', 'Zombies 🧟', '💤', zombieCount || undefined)}
        {navItem('canceled', 'Canceled', '✕', canceledCount || undefined)}

        {allTags.length > 0 && (
          <>
            <div className="text-xs text-text-muted uppercase tracking-wider px-3 py-2 mt-2">Tags</div>
            {allTags.map((tag) => navItem(`tag:${tag}` as SidebarFilter, tag, '🏷'))}
          </>
        )}
      </nav>

      {/* Footer actions */}
      <div
        className="p-2 space-y-1"
        style={{ borderTop: '1px solid var(--panel-border)' }}
      >
        <button
          onClick={() => setShowAddModal(true)}
          className="no-drag btn-accent flex items-center gap-2 w-full px-3 py-2 text-sm bg-accent text-white font-medium transition-colors"
          style={{ borderRadius: 'var(--btn-radius)' }}
        >
          <span>+</span> Add Subscription
        </button>
        <button
          onClick={exportCSV}
          className="no-drag flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          style={{ borderRadius: 'var(--btn-radius)' }}
        >
          <span>↓</span> Export CSV
        </button>
        <button
          onClick={() => setCurrentView(currentView === 'settings' ? 'subscriptions' : 'settings')}
          className={`no-drag flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
            currentView === 'settings'
              ? 'glass-elevated text-text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          style={{ borderRadius: 'var(--btn-radius)' }}
        >
          <span>⚙</span> Settings
        </button>
      </div>
    </aside>
  )
}
