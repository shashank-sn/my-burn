import net from 'net'
import { existsSync, unlinkSync } from 'fs'
import { app } from 'electron'
import { join } from 'path'
import { store } from './store'
import type { Subscription } from '../types'
import { nextBillingDate, monthlyCost } from '../utils'

export const SOCKET_PATH = join(app.getPath('userData'), 'myburn.sock')

let server: net.Server | null = null

export function startSocketServer(): void {
  if (existsSync(SOCKET_PATH)) unlinkSync(SOCKET_PATH)

  server = net.createServer((socket) => {
    let buffer = ''

    socket.on('data', (data) => {
      buffer += data.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const cmd = JSON.parse(line)
          const response = handleCommand(cmd)
          socket.write(JSON.stringify(response) + '\n')
        } catch (e) {
          socket.write(JSON.stringify({ ok: false, error: 'Parse error' }) + '\n')
        }
      }
    })

    socket.on('error', () => {})
  })

  server.listen(SOCKET_PATH)
}

export function stopSocketServer(): void {
  server?.close()
  if (existsSync(SOCKET_PATH)) unlinkSync(SOCKET_PATH)
}

// ── Command handlers ──────────────────────────────────────────────────────────

type Command =
  | { type: 'ping' }
  | { type: 'list_subscriptions' }
  | { type: 'get_analytics' }
  | { type: 'get_upcoming'; days?: number }
  | { type: 'add_subscription'; data: Partial<Subscription> }
  | { type: 'update_subscription'; id: string; data: Partial<Subscription> }
  | { type: 'cancel_subscription'; id: string }

function handleCommand(cmd: Command): unknown {
  const subs = store.get('subscriptions')

  switch (cmd.type) {
    case 'ping':
      return { ok: true, data: 'pong' }

    case 'list_subscriptions':
      return { ok: true, data: subs }

    case 'get_analytics': {
      const active = subs.filter((s) => !s.isCanceled)
      const monthly = active.reduce((sum, s) => sum + monthlyCost(s, 'USD'), 0)
      const byTag: Record<string, number> = {}
      for (const s of active) {
        const tags = s.tags.length ? s.tags : ['Untagged']
        for (const t of tags) byTag[t] = (byTag[t] ?? 0) + monthlyCost(s, 'USD')
      }
      return {
        ok: true,
        data: {
          monthly_total_usd: monthly,
          yearly_total_usd: monthly * 12,
          active_count: active.length,
          canceled_count: subs.filter((s) => s.isCanceled).length,
          zombie_count: active.filter(isZombie).length,
          by_category: byTag
        }
      }
    }

    case 'get_upcoming': {
      const days = cmd.days ?? 30
      const today = new Date()
      const active = subs
        .filter((s) => {
          if (s.isCanceled) return false
          const diff = daysUntil(new Date(s.nextBilling))
          return diff >= 0 && diff <= days
        })
        .sort((a, b) => new Date(a.nextBilling).getTime() - new Date(b.nextBilling).getTime())
      return { ok: true, data: active }
    }

    case 'add_subscription': {
      const now = new Date().toISOString()
      const start = cmd.data.startDate ?? now.slice(0, 10)
      const cycle = cmd.data.cycle ?? 'monthly'
      const newSub: Subscription = {
        id: `sub-${Date.now()}`,
        name: cmd.data.name ?? 'New Subscription',
        cost: cmd.data.cost ?? 0,
        costCurrency: cmd.data.costCurrency ?? 'USD',
        cycle,
        customDays: cmd.data.customDays ?? 30,
        startDate: start,
        nextBilling: nextBillingDate(start, cycle, cmd.data.customDays ?? 30),
        paymentMethod: cmd.data.paymentMethod ?? '',
        tags: cmd.data.tags ?? [],
        notes: cmd.data.notes ?? '',
        isCanceled: false,
        isPaid: false,
        createdAt: now
      }
      const all = store.get('subscriptions')
      all.push(newSub)
      store.set('subscriptions', all)
      return { ok: true, data: newSub }
    }

    case 'update_subscription': {
      const all = store.get('subscriptions')
      const idx = all.findIndex((s) => s.id === cmd.id)
      if (idx === -1) return { ok: false, error: 'Not found' }
      all[idx] = { ...all[idx], ...cmd.data }
      store.set('subscriptions', all)
      return { ok: true, data: all[idx] }
    }

    case 'cancel_subscription': {
      const all = store.get('subscriptions')
      const idx = all.findIndex((s) => s.id === cmd.id)
      if (idx === -1) return { ok: false, error: 'Not found' }
      all[idx].isCanceled = true
      store.set('subscriptions', all)
      return { ok: true, data: all[idx] }
    }

    default:
      return { ok: false, error: `Unknown command` }
  }
}

function daysUntil(date: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return Math.ceil((date.getTime() - today.getTime()) / 86400000)
}

function isZombie(s: Subscription): boolean {
  if (!s.lastUsed) return false
  return daysUntil(new Date(s.lastUsed)) < -30
}
