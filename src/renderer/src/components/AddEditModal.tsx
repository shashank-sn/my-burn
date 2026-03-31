import { useState, useEffect } from 'react'
import { useAppStore } from '../store/app-store'
import type { Subscription } from '../types'
import { nextBillingDate, shortDate } from '../utils'

interface Props {
  subscription: Subscription | null
  onClose: () => void
  prefill?: Partial<Pick<Subscription, 'name' | 'cost' | 'costCurrency' | 'cycle'>> | null
}

const CYCLES = ['monthly', 'yearly', 'custom'] as const

export default function AddEditModal({ subscription, onClose, prefill }: Props) {
  const { addSubscription, updateSubscription, paymentMethods, addPaymentMethod, settings } = useAppStore()
  const isEdit = !!subscription

  const [name, setName] = useState('')
  const [cost, setCost] = useState('')
  const [costCurrency, setCostCurrency] = useState<'USD' | 'INR'>(settings.currency)
  const [cycle, setCycle] = useState<'monthly' | 'yearly' | 'custom'>('monthly')
  const [customDays, setCustomDays] = useState('30')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [notes, setNotes] = useState('')
  const [hasTrial, setHasTrial] = useState(false)
  const [trialDays, setTrialDays] = useState('')
  const [trialStartDate, setTrialStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [trackUsage, setTrackUsage] = useState(false)
  const [lastUsed, setLastUsed] = useState(new Date().toISOString().slice(0, 10))
  const [hasAnnual, setHasAnnual] = useState(false)
  const [annualCost, setAnnualCost] = useState('')
  const [newMethod, setNewMethod] = useState('')
  const [addingMethod, setAddingMethod] = useState(false)
  const [saving, setSaving] = useState(false)

  // Populate from existing subscription (edit mode)
  useEffect(() => {
    if (!subscription) return
    setName(subscription.name)
    setCost(String(subscription.cost))
    setCostCurrency(subscription.costCurrency)
    setCycle(subscription.cycle)
    setCustomDays(String(subscription.customDays ?? 30))
    setStartDate(subscription.startDate.slice(0, 10))
    setPaymentMethod(subscription.paymentMethod)
    setTagsInput(subscription.tags.join(', '))
    setNotes(subscription.notes)
    setHasTrial(!!subscription.trialDays)
    setTrialDays(subscription.trialDays ? String(subscription.trialDays) : '')
    setTrialStartDate(subscription.trialStartDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10))
    setTrackUsage(!!subscription.lastUsed)
    setLastUsed(subscription.lastUsed?.slice(0, 10) ?? new Date().toISOString().slice(0, 10))
    setHasAnnual(!!subscription.annualCost)
    setAnnualCost(subscription.annualCost ? String(subscription.annualCost) : '')
  }, [subscription])

  // Populate from receipt import prefill
  useEffect(() => {
    if (!prefill || subscription) return
    if (prefill.name) setName(prefill.name)
    if (prefill.cost) setCost(String(prefill.cost))
    if (prefill.costCurrency) setCostCurrency(prefill.costCurrency)
    if (prefill.cycle) setCycle(prefill.cycle)
  }, [prefill])

  const parsedCost = parseFloat(cost) || 0
  const parsedAnnual = parseFloat(annualCost) || 0
  const annualSavings = parsedAnnual > 0 ? (parsedCost * 12) - parsedAnnual : 0
  const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)

  const costHistory = subscription?.costHistory ?? []

  async function handleSave() {
    if (!name.trim() || !parsedCost) return
    setSaving(true)

    const data = {
      name: name.trim(),
      cost: parsedCost,
      costCurrency,
      cycle,
      customDays: parseInt(customDays) || 30,
      startDate,
      paymentMethod,
      tags,
      notes,
      isCanceled: subscription?.isCanceled ?? false,
      isPaid: subscription?.isPaid ?? false,
      trialDays: hasTrial ? parseInt(trialDays) || 0 : undefined,
      trialStartDate: hasTrial ? trialStartDate : undefined,
      lastUsed: trackUsage ? lastUsed : undefined,
      annualCost: hasAnnual ? parsedAnnual : undefined,
      previousCost: subscription?.previousCost,
      costHistory,
      sharedWith: subscription?.sharedWith ?? []
    }

    if (isEdit && subscription) {
      await updateSubscription({ ...subscription, ...data, nextBilling: nextBillingDate(startDate, cycle, parseInt(customDays) || 30) })
    } else {
      await addSubscription(data)
    }

    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
      <div
        className="glass-card w-[540px] max-h-[85vh] overflow-y-auto fade-in"
        style={{ background: 'var(--panel-bg)', backdropFilter: 'var(--panel-blur)', WebkitBackdropFilter: 'var(--panel-blur)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0"
          style={{
            borderBottom: '1px solid var(--panel-border)',
            background: 'var(--panel-bg)',
            backdropFilter: 'var(--panel-blur)',
            WebkitBackdropFilter: 'var(--panel-blur)',
            borderRadius: 'var(--panel-radius) var(--panel-radius) 0 0'
          }}
        >
          <h2 className="text-base font-semibold">{isEdit ? 'Edit Subscription' : 'New Subscription'}</h2>
          <button onClick={onClose} className="no-drag text-text-muted hover:text-text-primary text-xl leading-none">×</button>
        </div>

        {/* Price history notice */}
        {isEdit && costHistory.length > 0 && (
          <div className="mx-6 mt-4 px-3 py-2 glass-section text-xs text-text-muted flex items-center gap-2">
            <span>📈</span>
            <span>
              Previously {costHistory[costHistory.length - 1].currency === 'INR' ? '₹' : '$'}{costHistory[costHistory.length - 1].cost} on {shortDate(costHistory[costHistory.length - 1].date)}
            </span>
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* Name */}
          <Field label="Service Name">
            <input
              autoFocus
              type="text"
              placeholder="Netflix, Figma, Linear..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="theme-input w-full"
            />
          </Field>

          {/* Cost + Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="Cost">
                <input
                  type="number"
                  placeholder="9.99"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="theme-input w-full"
                  min="0"
                  step="0.01"
                />
              </Field>
            </div>
            <Field label="Currency">
              <select value={costCurrency} onChange={(e) => setCostCurrency(e.target.value as never)} className="theme-input w-full">
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </Field>
          </div>

          {/* Billing Cycle */}
          <Field label="Billing Cycle">
            <div className="flex gap-2">
              {CYCLES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCycle(c)}
                  className={`flex-1 py-2 text-sm transition-colors capitalize ${
                    cycle === c
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-secondary hover:text-text-muted'
                  }`}
                  style={{
                    border: `1px solid ${cycle === c ? '#FF4D00' : 'var(--panel-border)'}`,
                    borderRadius: 'var(--btn-radius)'
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            {cycle === 'custom' && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-text-secondary">Every</span>
                <input type="number" value={customDays} onChange={(e) => setCustomDays(e.target.value)} className="theme-input w-20" min="1" />
                <span className="text-sm text-text-secondary">days</span>
              </div>
            )}
          </Field>

          {/* Start Date */}
          <Field label="Start Date">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="theme-input w-full" />
          </Field>

          {/* Payment Method */}
          <Field label="Payment Method">
            <div className="flex gap-2">
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="theme-input flex-1">
                <option value="">None</option>
                {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <button
                onClick={() => setAddingMethod(true)}
                className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                style={{ border: '1px solid var(--panel-border)', borderRadius: 'var(--btn-radius)' }}
              >
                +
              </button>
            </div>
            {addingMethod && (
              <div className="flex gap-2 mt-2">
                <input placeholder="New payment method" value={newMethod} onChange={(e) => setNewMethod(e.target.value)} className="theme-input flex-1" />
                <button
                  onClick={async () => {
                    if (newMethod.trim()) {
                      await addPaymentMethod(newMethod.trim())
                      setPaymentMethod(newMethod.trim())
                      setNewMethod('')
                      setAddingMethod(false)
                    }
                  }}
                  className="px-3 py-2 bg-accent text-white text-sm"
                  style={{ borderRadius: 'var(--btn-radius)' }}
                >
                  Add
                </button>
              </div>
            )}
          </Field>

          {/* Tags */}
          <Field label="Tags" hint="Comma-separated: Work, SaaS, Design">
            <input type="text" placeholder="Work, Productivity, Design..." value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="theme-input w-full" />
          </Field>

          {/* Notes */}
          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="theme-input w-full resize-none" />
          </Field>

          {/* Free Trial */}
          <div className="glass-section p-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={hasTrial} onChange={(e) => setHasTrial(e.target.checked)} className="accent-accent" />
              <span className="text-sm font-medium">Free Trial</span>
            </label>
            {hasTrial && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Field label="Trial Days">
                  <input type="number" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} className="theme-input w-full" min="1" />
                </Field>
                <Field label="Trial Started">
                  <input type="date" value={trialStartDate} onChange={(e) => setTrialStartDate(e.target.value)} className="theme-input w-full" />
                </Field>
              </div>
            )}
          </div>

          {/* Annual Option */}
          <div className="glass-section p-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={hasAnnual} onChange={(e) => setHasAnnual(e.target.checked)} className="accent-accent" />
              <span className="text-sm font-medium">Annual Plan Available</span>
            </label>
            {hasAnnual && (
              <div>
                <Field label={`Annual price (${costCurrency})`}>
                  <input type="number" value={annualCost} onChange={(e) => setAnnualCost(e.target.value)} className="theme-input w-full" min="0" step="0.01" />
                </Field>
                {annualSavings > 0 && (
                  <p className="text-xs text-green-soft mt-2">
                    Save {costCurrency === 'USD' ? '$' : '₹'}{annualSavings.toFixed(2)}/year vs monthly
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Last Used */}
          <div className="glass-section p-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={trackUsage} onChange={(e) => setTrackUsage(e.target.checked)} className="accent-accent" />
              <span className="text-sm font-medium">Track Last Used</span>
            </label>
            {trackUsage && (
              <Field label="Last Used">
                <input type="date" value={lastUsed} onChange={(e) => setLastUsed(e.target.value)} className="theme-input w-full" />
              </Field>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 sticky bottom-0"
          style={{
            borderTop: '1px solid var(--panel-border)',
            background: 'var(--panel-bg)',
            backdropFilter: 'var(--panel-blur)',
            WebkitBackdropFilter: 'var(--panel-blur)',
            borderRadius: '0 0 var(--panel-radius) var(--panel-radius)'
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            style={{ border: '1px solid var(--panel-border)', borderRadius: 'var(--btn-radius)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !parsedCost || saving}
            className="btn-accent px-5 py-2 bg-accent text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderRadius: 'var(--btn-radius)' }}
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Subscription'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1.5">
        {label} {hint && <span className="text-text-muted font-normal">— {hint}</span>}
      </label>
      {children}
    </div>
  )
}
