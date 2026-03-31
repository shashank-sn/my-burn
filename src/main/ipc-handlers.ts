import { ipcMain, Notification, dialog, app } from 'electron'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { store } from './store'
import type { Subscription, AppSettings } from '../types'

export function registerIpcHandlers(): void {
  // ── Subscriptions ──────────────────────────────────────────────────────────

  ipcMain.handle('subscriptions:get-all', () => {
    return store.get('subscriptions')
  })

  ipcMain.handle('subscriptions:save-all', (_e, subscriptions: Subscription[]) => {
    store.set('subscriptions', subscriptions)
    return { ok: true }
  })

  ipcMain.handle('subscriptions:add', (_e, sub: Subscription) => {
    const subs = store.get('subscriptions')
    subs.push(sub)
    store.set('subscriptions', subs)
    scheduleNotifications(sub)
    return sub
  })

  ipcMain.handle('subscriptions:update', (_e, updated: Subscription) => {
    const subs = store.get('subscriptions').map((s) => (s.id === updated.id ? updated : s))
    store.set('subscriptions', subs)
    cancelNotifications(updated.id)
    if (!updated.isCanceled) scheduleNotifications(updated)
    return updated
  })

  ipcMain.handle('subscriptions:delete', (_e, id: string) => {
    const subs = store.get('subscriptions').filter((s) => s.id !== id)
    store.set('subscriptions', subs)
    cancelNotifications(id)
    return { ok: true }
  })

  // ── Settings ───────────────────────────────────────────────────────────────

  ipcMain.handle('settings:get', () => store.get('settings'))

  ipcMain.handle('settings:save', (_e, settings: AppSettings) => {
    store.set('settings', settings)
    return { ok: true }
  })

  // ── Payment methods ────────────────────────────────────────────────────────

  ipcMain.handle('payment-methods:get', () => store.get('paymentMethods'))

  ipcMain.handle('payment-methods:add', (_e, method: string) => {
    const methods = store.get('paymentMethods')
    if (!methods.includes(method)) {
      methods.push(method)
      store.set('paymentMethods', methods)
    }
    return store.get('paymentMethods')
  })

  // ── Export ─────────────────────────────────────────────────────────────────

  ipcMain.handle('export:csv', async (_e, subscriptions: Subscription[]) => {
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Export Subscriptions',
      defaultPath: join(
        app.getPath('downloads'),
        `subscriptions-${new Date().toISOString().slice(0, 10)}.csv`
      ),
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    })
    if (canceled || !filePath) return { ok: false }

    const headers = ['Name', 'Cost', 'Currency', 'Cycle', 'Next Billing', 'Payment Method', 'Tags', 'Status', 'Notes']
    const rows = subscriptions.map((s) => [
      s.name,
      s.cost,
      s.costCurrency,
      s.cycle === 'custom' ? `every ${s.customDays}d` : s.cycle,
      s.nextBilling.slice(0, 10),
      s.paymentMethod,
      s.tags.join('; '),
      s.isCanceled ? 'Canceled' : s.trialDays ? 'Trial' : 'Active',
      s.notes
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    writeFileSync(filePath, csv, 'utf-8')
    return { ok: true, filePath }
  })
}

// ── Notification helpers ───────────────────────────────────────────────────────

const scheduledTimers = new Map<string, NodeJS.Timeout[]>()

function scheduleNotifications(sub: Subscription): void {
  if (!Notification.isSupported()) return

  const timers: NodeJS.Timeout[] = []
  const nextBilling = new Date(sub.nextBilling)

  for (const daysBefore of [7, 1]) {
    const triggerAt = new Date(nextBilling)
    triggerAt.setDate(triggerAt.getDate() - daysBefore)
    triggerAt.setHours(9, 0, 0, 0)

    const msUntil = triggerAt.getTime() - Date.now()
    if (msUntil <= 0) continue

    const t = setTimeout(() => {
      new Notification({
        title: `${sub.name} renews ${daysBefore === 1 ? 'tomorrow' : 'in 7 days'}`,
        body: `You'll be charged ${sub.costCurrency === 'USD' ? '$' : '₹'}${sub.cost.toFixed(2)} on ${nextBilling.toLocaleDateString()}`
      }).show()
    }, msUntil)

    timers.push(t)
  }

  scheduledTimers.set(sub.id, timers)
}

function cancelNotifications(id: string): void {
  scheduledTimers.get(id)?.forEach(clearTimeout)
  scheduledTimers.delete(id)
}
