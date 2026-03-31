import { useAppStore } from '../store/app-store'
import { monthlyCost, formatCurrency, isZombie, isActiveTrial, daysUntil, shortDate } from '../utils'

export default function AnalyticsPanel({ onClose }: { onClose: () => void }) {
  const { subscriptions, settings } = useAppStore()
  const cur = settings.currency

  const active = subscriptions.filter((s) => !s.isCanceled)
  const monthly = active.reduce((sum, s) => sum + monthlyCost(s, cur), 0)
  const yearly = monthly * 12

  const byTag: Record<string, number> = {}
  for (const s of active) {
    const tags = s.tags.length ? s.tags : ['Untagged']
    for (const t of tags) byTag[t] = (byTag[t] ?? 0) + monthlyCost(s, cur)
  }
  const tagEntries = Object.entries(byTag).sort(([, a], [, b]) => b - a)

  const zombies = active.filter(isZombie)
  const zombieCost = zombies.reduce((sum, s) => sum + monthlyCost(s, cur), 0)

  const trials = active.filter(isActiveTrial)

  const annualOpps = active.filter((s) => s.annualCost && s.annualCost > 0 && s.cycle === 'monthly')
  const totalSavings = annualOpps.reduce((sum, s) => {
    const annualVsMonthly = monthlyCost(s, cur) * 12
    const annual = cur === 'INR' && s.costCurrency === 'USD' ? (s.annualCost ?? 0) * 83.5 : (s.annualCost ?? 0)
    return sum + Math.max(0, annualVsMonthly - annual)
  }, 0)

  const upcoming = active
    .filter((s) => daysUntil(s.nextBilling) >= 0 && daysUntil(s.nextBilling) <= 7)
    .sort((a, b) => new Date(a.nextBilling).getTime() - new Date(b.nextBilling).getTime())

  return (
    <aside
      className="w-72 flex-shrink-0 glass-panel flex flex-col overflow-hidden fade-in"
      style={{ borderLeft: '1px solid var(--panel-border)' }}
    >
      <div
        className="flex items-center justify-between px-4 pt-11 pb-3"
        style={{ borderBottom: '1px solid var(--panel-border)' }}
      >
        <h2 className="text-sm font-semibold">Analytics</h2>
        <button onClick={onClose} className="no-drag text-text-muted hover:text-text-primary text-lg leading-none">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Totals */}
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Monthly" value={formatCurrency(monthly, cur)} sub={`${active.length} active`} />
          <Stat label="Yearly" value={formatCurrency(yearly, cur)} sub="projected" />
        </div>

        {/* Upcoming this week */}
        {upcoming.length > 0 && (
          <Section title="⚡ Due This Week">
            {upcoming.map((s) => (
              <Row key={s.id} left={s.name} right={formatCurrency(s.cost, s.costCurrency)} sub={shortDate(s.nextBilling)} accent="text-orange-soft" />
            ))}
          </Section>
        )}

        {/* By category */}
        {tagEntries.length > 0 && (
          <Section title="By Category">
            {tagEntries.map(([tag, amount]) => (
              <div key={tag} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-secondary">{tag}</span>
                    <span className="text-text-primary tabular-nums">{formatCurrency(amount, cur)}/mo</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--elevated-bg)' }}>
                    <div className="h-full bg-accent rounded-full" style={{ width: `${(amount / monthly) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* Zombies */}
        {zombies.length > 0 && (
          <Section title={`🧟 Zombies (save ${formatCurrency(zombieCost, cur)}/mo)`}>
            {zombies.map((s) => (
              <Row key={s.id} left={s.name} right={formatCurrency(monthlyCost(s, cur), cur) + '/mo'} sub={s.lastUsed ? `Last used ${shortDate(s.lastUsed)}` : 'Never used'} accent="text-red-soft" />
            ))}
          </Section>
        )}

        {/* Annual upgrade opps */}
        {annualOpps.length > 0 && totalSavings > 0 && (
          <Section title={`💡 Switch Annual → Save ${formatCurrency(totalSavings, cur)}/yr`}>
            {annualOpps.map((s) => {
              const savings = monthlyCost(s, cur) * 12 - (cur === 'INR' && s.costCurrency === 'USD' ? (s.annualCost ?? 0) * 83.5 : (s.annualCost ?? 0))
              return savings > 0 ? (
                <Row key={s.id} left={s.name} right={`Save ${formatCurrency(savings, cur)}/yr`} accent="text-green-soft" />
              ) : null
            })}
          </Section>
        )}

        {/* Trials */}
        {trials.length > 0 && (
          <Section title="⭐ Active Trials">
            {trials.map((s) => {
              const end = new Date(s.trialStartDate!)
              end.setDate(end.getDate() + (s.trialDays ?? 0))
              return (
                <Row key={s.id} left={s.name} right={`${daysUntil(end.toISOString())}d left`} accent="text-purple-soft" />
              )
            })}
          </Section>
        )}
      </div>
    </aside>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="glass-elevated p-3">
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className="text-base font-bold tabular-nums text-text-primary">{value}</div>
      <div className="text-xs text-text-muted mt-0.5">{sub}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ left, right, sub, accent }: { left: string; right: string; sub?: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-text-primary truncate">{left}</div>
        {sub && <div className="text-xs text-text-muted">{sub}</div>}
      </div>
      <div className={`text-xs tabular-nums flex-shrink-0 ${accent ?? 'text-text-secondary'}`}>{right}</div>
    </div>
  )
}
