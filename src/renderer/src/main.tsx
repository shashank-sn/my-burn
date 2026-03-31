import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

declare global {
  interface Window {
    api: import('../../preload/index').ElectronAPI
  }
}

// ── Browser preview mock (only active outside Electron) ──────────────────────
if (!window.api) {
  const SAMPLE_SUBS = [
    {
      id: 'sub-1', name: 'Figma', cost: 15, costCurrency: 'USD', cycle: 'monthly',
      startDate: '2024-01-01', nextBilling: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      paymentMethod: 'Credit Card', tags: ['Design', 'Work'], notes: '', isCanceled: false,
      isPaid: false, createdAt: '2024-01-01T00:00:00Z', costHistory: []
    },
    {
      id: 'sub-2', name: 'Notion', cost: 16, costCurrency: 'USD', cycle: 'monthly',
      startDate: '2024-02-01', nextBilling: new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10),
      paymentMethod: 'Credit Card', tags: ['Productivity', 'Work'], notes: '', isCanceled: false,
      isPaid: false, annualCost: 144, createdAt: '2024-02-01T00:00:00Z', costHistory: []
    },
    {
      id: 'sub-3', name: 'Spotify', cost: 9.99, costCurrency: 'USD', cycle: 'monthly',
      startDate: '2023-06-01', nextBilling: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10),
      paymentMethod: 'Debit Card', tags: ['Personal'], notes: '', isCanceled: false,
      isPaid: false, lastUsed: new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10),
      createdAt: '2023-06-01T00:00:00Z', costHistory: [{ date: '2024-01-01', cost: 7.99, currency: 'USD' }]
    },
    {
      id: 'sub-4', name: 'Adobe CC', cost: 599.99, costCurrency: 'USD', cycle: 'yearly',
      startDate: '2024-03-01', nextBilling: new Date(Date.now() + 200 * 86400000).toISOString().slice(0, 10),
      paymentMethod: 'Credit Card', tags: ['Design', 'Work'], notes: 'Team license', isCanceled: false,
      isPaid: true, createdAt: '2024-03-01T00:00:00Z', costHistory: []
    },
    {
      id: 'sub-5', name: 'Linear', cost: 8, costCurrency: 'USD', cycle: 'monthly',
      startDate: '2024-05-01', nextBilling: new Date(Date.now() + 1 * 86400000).toISOString().slice(0, 10),
      paymentMethod: 'Credit Card', tags: ['Work', 'Dev'], notes: '', isCanceled: false,
      isPaid: false, trialDays: 14, trialStartDate: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
      createdAt: '2024-05-01T00:00:00Z', costHistory: []
    }
  ]
  const SAMPLE_SETTINGS = { currency: 'USD' as const, theme: 'dark' as const, notificationsEnabled: true, designTheme: 'glass' as const }
  const SAMPLE_METHODS = ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'PayPal']

  let subs = [...SAMPLE_SUBS] as typeof SAMPLE_SUBS
  let settings = { ...SAMPLE_SETTINGS }
  let methods = [...SAMPLE_METHODS]

  ;(window as unknown as Record<string, unknown>)['api'] = {
    subscriptions: {
      getAll: () => Promise.resolve(subs),
      saveAll: (s: typeof subs) => { subs = s; return Promise.resolve({ ok: true }) },
      add: (s: (typeof subs)[0]) => { subs.push(s); return Promise.resolve(s) },
      update: (s: (typeof subs)[0]) => { subs = subs.map((x) => x.id === s.id ? s : x); return Promise.resolve(s) },
      delete: (id: string) => { subs = subs.filter((x) => x.id !== id); return Promise.resolve({ ok: true }) }
    },
    settings: {
      get: () => Promise.resolve(settings),
      save: (s: typeof settings) => { settings = s; return Promise.resolve({ ok: true }) }
    },
    paymentMethods: {
      get: () => Promise.resolve(methods),
      add: (m: string) => { if (!methods.includes(m)) methods.push(m); return Promise.resolve(methods) }
    },
    export: { csv: () => Promise.resolve({ ok: true }) },
    on: () => {},
    off: () => {}
  }
}
// ─────────────────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
