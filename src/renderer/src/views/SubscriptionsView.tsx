import { useState } from 'react'
import { useAppStore } from '../store/app-store'
import { monthlyCost, daysUntil, urgencyColor, urgencyBg, formatCurrency, isZombie, isActiveTrial, trialDaysRemaining, shortDate, relativeDate } from '../utils'
import type { Subscription, SidebarFilter } from '../types'
import AnalyticsPanel from './AnalyticsPanel'
import ReceiptImport from '../components/ReceiptImport'

export default function SubscriptionsView() {
  const {
    subscriptions,
    settings,
    sidebarFilter,
    sortOrder,
    searchQuery,
    setSortOrder,
    setSearchQuery,
    setEditingSub,
    deleteSubscription,
    toggleCanceled,
    markLastUsed,
    updateSettings,
    setShowAddModal,
    setModalPrefill
  } = useAppStore()
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showReceiptImport, setShowReceiptImport] = useState(false)

  const filtered = getFiltered(subscriptions, sidebarFilter, searchQuery, sortOrder, settings.currency)

  // Zombie savings for banner
  const activeZombies = subscriptions.filter((s) => !s.isCanceled && isZombie(s))
  const zombieSavings = activeZombies.reduce((sum, s) => sum + monthlyCost(s, settings.currency), 0)

  async function cancelAllZombies() {
    for (const z of activeZombies) await toggleCanceled(z.id)
  }

  function openReceiptModal(data: Partial<Pick<Subscription, 'name' | 'cost' | 'costCurrency' | 'cycle'>>) {
    setShowReceiptImport(false)
    setModalPrefill(data)
    setShowAddModal(true)
  }

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1 min-w-0">
        {/* Toolbar */}
        <div
          className="flex items-center gap-3 px-5 pt-11 pb-3"
          style={{ borderBottom: '1px solid var(--panel-border)' }}
        >
          <h1 className="text-sm font-semibold text-text-secondary flex-1">{filterLabel(sidebarFilter)}</h1>

          {/* Receipt import button */}
          <button
            onClick={() => setShowReceiptImport(true)}
            className="no-drag px-3 py-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
            style={{ border: '1px solid var(--panel-border)', borderRadius: 'var(--btn-radius)' }}
            title="Import from email receipt"
          >
            📧
          </button>

          {/* Search */}
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="no-drag theme-input w-44"
          />

          {/* Sort */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as never)}
            className="no-drag theme-input"
          >
            <option value="nextBilling">Next Renewal</option>
            <option value="name">Name</option>
            <option value="cost">Cost</option>
            <option value="createdAt">Date Added</option>
          </select>

          {/* Currency toggle */}
          <button
            onClick={() => updateSettings({ currency: settings.currency === 'USD' ? 'INR' : 'USD' })}
            className="no-drag px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
            style={{ border: '1px solid var(--panel-border)', borderRadius: 'var(--btn-radius)' }}
          >
            {settings.currency === 'USD' ? '$ USD' : '₹ INR'}
          </button>

          {/* Analytics toggle */}
          <button
            onClick={() => setShowAnalytics((v) => !v)}
            className={`no-drag px-3 py-1.5 text-sm transition-colors ${
              showAnalytics ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
            }`}
            style={{
              border: `1px solid ${showAnalytics ? '#FF4D00' : 'var(--panel-border)'}`,
              borderRadius: 'var(--btn-radius)'
            }}
          >
            Analytics
          </button>
        </div>

        {/* Zombie cancel-all banner */}
        {sidebarFilter === 'zombies' && activeZombies.length > 0 && (
          <div
            className="mx-4 mt-3 px-4 py-3 flex items-center gap-3 fade-in"
            style={{ background: 'rgba(255, 77, 0, 0.07)', border: '1px solid rgba(255,77,0,0.25)', borderRadius: 'var(--card-radius)' }}
          >
            <span className="text-2xl">🧟</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary">
                {activeZombies.length} zombie sub{activeZombies.length > 1 ? 's' : ''} — you could save <span className="text-accent">{formatCurrency(zombieSavings, settings.currency)}/mo</span>
              </div>
              <div className="text-xs text-text-muted">Not used in 30+ days</div>
            </div>
            <button
              onClick={cancelAllZombies}
              className="no-drag px-3 py-1.5 text-sm font-medium text-white bg-accent hover:bg-accent-soft transition-colors flex-shrink-0"
              style={{ borderRadius: 'var(--btn-radius)' }}
            >
              Cancel All
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <EmptyState filter={sidebarFilter} onImport={() => setShowReceiptImport(true)} />
          ) : (
            <div>
              {filtered.map((sub) => (
                <SubscriptionRow
                  key={sub.id}
                  sub={sub}
                  currency={settings.currency}
                  onEdit={() => setEditingSub(sub)}
                  onDelete={() => deleteSubscription(sub.id)}
                  onToggleCancel={() => toggleCanceled(sub.id)}
                  onMarkUsed={() => markLastUsed(sub.id)}
                  onAnnualUpgrade={() => setEditingSub({ ...sub, cycle: 'yearly' })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showAnalytics && (
        <AnalyticsPanel onClose={() => setShowAnalytics(false)} />
      )}

      {showReceiptImport && (
        <ReceiptImport
          onParsed={openReceiptModal}
          onClose={() => setShowReceiptImport(false)}
        />
      )}
    </div>
  )
}

// ── Row ───────────────────────────────────────────────────────────────────────

function SubscriptionRow({ sub, currency, onEdit, onDelete, onToggleCancel, onMarkUsed, onAnnualUpgrade }: {
  sub: Subscription
  currency: 'USD' | 'INR'
  onEdit: () => void
  onDelete: () => void
  onToggleCancel: () => void
  onMarkUsed: () => void
  onAnnualUpgrade: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const days = daysUntil(sub.nextBilling)
  const monthly = monthlyCost(sub, currency)
  const zombie = isZombie(sub)
  const trial = isActiveTrial(sub)
  const trialDays = trialDaysRemaining(sub)

  // Annual upgrade savings
  const hasAnnualUpgrade = sub.cycle === 'monthly' && sub.annualCost && sub.annualCost > 0
  const annualSavings = hasAnnualUpgrade
    ? Math.max(0, monthly * 12 - (currency === 'INR' && sub.costCurrency === 'USD' ? (sub.annualCost ?? 0) * 83.5 : (sub.annualCost ?? 0)))
    : 0
  const savingsPct = monthly * 12 > 0 && annualSavings > 0 ? Math.round((annualSavings / (monthly * 12)) * 100) : 0

  // Price history note
  const lastHistoryEntry = sub.costHistory && sub.costHistory.length > 0
    ? sub.costHistory[sub.costHistory.length - 1]
    : null

  return (
    <div
      className={`sub-row flex items-center gap-4 px-5 py-3.5 group cursor-pointer ${urgencyBg(days)}`}
      style={{ borderBottom: '1px solid var(--panel-border)' }}
      onDoubleClick={onEdit}
    >
      {/* Urgency bar */}
      <div className={`w-1 h-8 rounded-full flex-shrink-0 ${sub.isCanceled ? 'bg-border' : days <= 3 ? 'bg-red-soft' : days <= 7 ? 'bg-orange-soft' : 'bg-border'}`} />

      {/* Name + badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-sm font-medium truncate ${sub.isCanceled ? 'line-through text-text-muted' : 'text-text-primary'}`}>
            {sub.name}
          </span>
          {trial && (
            <span className="text-xs bg-purple-soft/20 text-purple-soft px-2 py-0.5 rounded-full flex-shrink-0">
              {trialDays}d trial
            </span>
          )}
          {zombie && !sub.isCanceled && (
            <span className="text-xs text-text-muted px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'var(--card-bg)' }}>
              🧟 zombie
            </span>
          )}
          {/* Annual upgrade nudge */}
          {hasAnnualUpgrade && annualSavings > 0 && !sub.isCanceled && (
            <button
              onClick={(e) => { e.stopPropagation(); onAnnualUpgrade() }}
              className="no-drag text-xs text-green-soft px-2 py-0.5 rounded-full flex-shrink-0 hover:opacity-80 transition-opacity"
              style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34,197,94,0.2)' }}
              title={`Save ${savingsPct}% by switching to annual`}
            >
              💡 Save {savingsPct}%
            </button>
          )}
          {/* Price change note */}
          {lastHistoryEntry && (
            <span className="text-xs text-text-muted flex-shrink-0">
              was {lastHistoryEntry.currency === 'INR' ? '₹' : '$'}{lastHistoryEntry.cost}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {sub.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs text-text-muted px-2 py-0.5 rounded-full" style={{ background: 'var(--card-bg)' }}>{tag}</span>
          ))}
          {sub.paymentMethod && (
            <span className="text-xs text-text-muted">{sub.paymentMethod}</span>
          )}
        </div>
      </div>

      {/* Cost */}
      <div className="text-right flex-shrink-0">
        <div className={`text-sm font-medium tabular-nums ${sub.isCanceled ? 'text-text-muted' : 'text-text-primary'}`}>
          {formatCurrency(monthly, currency)}<span className="text-text-muted font-normal">/mo</span>
        </div>
        {sub.cycle !== 'monthly' && (
          <div className="text-xs text-text-muted">{formatCurrency(sub.cost, sub.costCurrency)}/{sub.cycle === 'yearly' ? 'yr' : `${sub.customDays}d`}</div>
        )}
      </div>

      {/* Next renewal */}
      <div className={`text-right flex-shrink-0 w-28 ${urgencyColor(days)}`}>
        <div className="text-xs font-medium">{sub.isCanceled ? 'Canceled' : relativeDate(sub.nextBilling)}</div>
        {!sub.isCanceled && <div className="text-xs text-text-muted">{shortDate(sub.nextBilling)}</div>}
      </div>

      {/* Context menu */}
      <div className="relative flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="no-drag p-1.5 text-text-muted hover:text-text-primary transition-colors"
          style={{ borderRadius: 'var(--btn-radius)' }}
          onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v) }}
        >
          ···
        </button>
        {showMenu && (
          <ContextMenu
            sub={sub}
            onEdit={() => { onEdit(); setShowMenu(false) }}
            onToggleCancel={() => { onToggleCancel(); setShowMenu(false) }}
            onMarkUsed={() => { onMarkUsed(); setShowMenu(false) }}
            onDelete={() => { onDelete(); setShowMenu(false) }}
            onClose={() => setShowMenu(false)}
          />
        )}
      </div>
    </div>
  )
}

function ContextMenu({ sub, onEdit, onToggleCancel, onMarkUsed, onDelete, onClose }: {
  sub: Subscription
  onEdit: () => void
  onToggleCancel: () => void
  onMarkUsed: () => void
  onDelete: () => void
  onClose: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div
        className="absolute right-0 top-8 z-20 py-1 w-44 text-sm shadow-xl fade-in"
        style={{
          background: 'var(--panel-bg)',
          backdropFilter: 'var(--panel-blur)',
          WebkitBackdropFilter: 'var(--panel-blur)',
          border: '1px solid var(--panel-border)',
          borderRadius: 'var(--card-radius)',
          boxShadow: 'var(--panel-shadow)',
        }}
      >
        <button onClick={onEdit} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-elevated text-text-primary">✏️ Edit</button>
        <button onClick={onToggleCancel} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-elevated text-text-primary">
          {sub.isCanceled ? '↩ Reactivate' : '✕ Cancel'}
        </button>
        <button onClick={onMarkUsed} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-elevated text-text-primary">✓ Mark Used Today</button>
        <div className="my-1" style={{ borderTop: '1px solid var(--panel-border)' }} />
        <button onClick={onDelete} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-elevated text-red-soft">🗑 Delete</button>
      </div>
    </>
  )
}

function EmptyState({ filter, onImport }: { filter: SidebarFilter; onImport: () => void }) {
  const { setShowAddModal } = useAppStore()
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-text-muted">
      <div className="text-5xl opacity-30">🔥</div>
      <div className="text-sm">
        {filter === 'all' ? 'No subscriptions yet' :
         filter === 'zombies' ? 'No zombie subscriptions — nice!' :
         filter === 'trials' ? 'No active trials' :
         'Nothing here'}
      </div>
      {filter === 'all' && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="no-drag px-4 py-2 bg-accent text-white text-sm font-medium hover:bg-accent-soft transition-colors"
            style={{ borderRadius: 'var(--btn-radius)' }}
          >
            Add Subscription
          </button>
          <button
            onClick={onImport}
            className="no-drag px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            style={{ border: '1px solid var(--panel-border)', borderRadius: 'var(--btn-radius)' }}
          >
            📧 Import Receipt
          </button>
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function filterLabel(f: SidebarFilter): string {
  if (f === 'all') return 'All Subscriptions'
  if (f === 'upcoming') return 'Upcoming Renewals'
  if (f === 'trials') return 'Free Trials'
  if (f === 'zombies') return 'Zombie Subscriptions'
  if (f === 'canceled') return 'Canceled'
  if (f.startsWith('tag:')) return `#${f.slice(4)}`
  return ''
}

function getFiltered(
  subs: Subscription[],
  filter: SidebarFilter,
  query: string,
  sort: string,
  currency: 'USD' | 'INR'
): Subscription[] {
  let result = [...subs]

  switch (filter) {
    case 'all':      result = result.filter((s) => !s.isCanceled); break
    case 'upcoming': result = result.filter((s) => !s.isCanceled && daysUntil(s.nextBilling) >= 0 && daysUntil(s.nextBilling) <= 30); break
    case 'trials':   result = result.filter(isActiveTrial); break
    case 'zombies':  result = result.filter((s) => !s.isCanceled && isZombie(s)); break
    case 'canceled': result = result.filter((s) => s.isCanceled); break
    default:
      if (filter.startsWith('tag:')) {
        const tag = filter.slice(4)
        result = result.filter((s) => !s.isCanceled && s.tags.includes(tag))
      }
  }

  if (query.trim()) {
    const q = query.toLowerCase()
    result = result.filter((s) =>
      s.name.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q))
    )
  }

  switch (sort) {
    case 'nextBilling': result.sort((a, b) => new Date(a.nextBilling).getTime() - new Date(b.nextBilling).getTime()); break
    case 'name':        result.sort((a, b) => a.name.localeCompare(b.name)); break
    case 'cost':        result.sort((a, b) => monthlyCost(b, currency) - monthlyCost(a, currency)); break
    case 'createdAt':   result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break
  }

  return result
}
