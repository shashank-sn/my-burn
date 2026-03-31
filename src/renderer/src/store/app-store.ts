import { create } from 'zustand'
import type { Subscription, AppSettings } from '../types'
import type { SidebarFilter, SortOrder } from '../types'
import { nextBillingDate } from '../utils'

interface AppStore {
  // Data
  subscriptions: Subscription[]
  paymentMethods: string[]
  settings: AppSettings

  // UI state
  sidebarFilter: SidebarFilter
  sortOrder: SortOrder
  searchQuery: string
  showAddModal: boolean
  editingSub: Subscription | null
  currentView: 'subscriptions' | 'settings'
  modalPrefill: Partial<Pick<Subscription, 'name' | 'cost' | 'costCurrency' | 'cycle'>> | null

  // Actions
  loadAll: () => Promise<void>
  addSubscription: (sub: Omit<Subscription, 'id' | 'createdAt' | 'nextBilling'>) => Promise<void>
  updateSubscription: (sub: Subscription) => Promise<void>
  deleteSubscription: (id: string) => Promise<void>
  toggleCanceled: (id: string) => Promise<void>
  markLastUsed: (id: string) => Promise<void>
  updateSettings: (s: Partial<AppSettings>) => Promise<void>
  addPaymentMethod: (method: string) => Promise<void>
  exportCSV: () => Promise<void>

  setSidebarFilter: (f: SidebarFilter) => void
  setSortOrder: (o: SortOrder) => void
  setSearchQuery: (q: string) => void
  setShowAddModal: (v: boolean) => void
  setEditingSub: (s: Subscription | null) => void
  setCurrentView: (v: 'subscriptions' | 'settings') => void
  setModalPrefill: (p: Partial<Pick<Subscription, 'name' | 'cost' | 'costCurrency' | 'cycle'>> | null) => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  subscriptions: [],
  paymentMethods: [],
  settings: { currency: 'USD', theme: 'dark', notificationsEnabled: true, designTheme: 'glass' },
  sidebarFilter: 'all',
  sortOrder: 'nextBilling',
  searchQuery: '',
  showAddModal: false,
  editingSub: null,
  currentView: 'subscriptions',
  modalPrefill: null,

  loadAll: async () => {
    const [subscriptions, settings, paymentMethods] = await Promise.all([
      window.api.subscriptions.getAll(),
      window.api.settings.get(),
      window.api.paymentMethods.get()
    ])
    set({ subscriptions, settings, paymentMethods })
  },

  addSubscription: async (data) => {
    const now = new Date().toISOString()
    const sub: Subscription = {
      ...data,
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      nextBilling: nextBillingDate(data.startDate, data.cycle, data.customDays),
      createdAt: now
    }
    await window.api.subscriptions.add(sub)
    set((s) => ({ subscriptions: [...s.subscriptions, sub] }))
  },

  updateSubscription: async (sub) => {
    const existing = get().subscriptions.find((x) => x.id === sub.id)
    const today = new Date().toISOString().slice(0, 10)
    const history = sub.costHistory ?? []
    const updatedHistory =
      existing && existing.cost !== sub.cost
        ? [...history, { date: today, cost: existing.cost, currency: existing.costCurrency }]
        : history
    const updated = {
      ...sub,
      costHistory: updatedHistory,
      nextBilling: nextBillingDate(sub.startDate, sub.cycle, sub.customDays)
    }
    await window.api.subscriptions.update(updated)
    set((s) => ({
      subscriptions: s.subscriptions.map((x) => (x.id === updated.id ? updated : x))
    }))
  },

  deleteSubscription: async (id) => {
    await window.api.subscriptions.delete(id)
    set((s) => ({ subscriptions: s.subscriptions.filter((x) => x.id !== id) }))
  },

  toggleCanceled: async (id) => {
    const sub = get().subscriptions.find((s) => s.id === id)
    if (!sub) return
    const updated = { ...sub, isCanceled: !sub.isCanceled }
    await window.api.subscriptions.update(updated)
    set((s) => ({ subscriptions: s.subscriptions.map((x) => (x.id === id ? updated : x)) }))
  },

  markLastUsed: async (id) => {
    const sub = get().subscriptions.find((s) => s.id === id)
    if (!sub) return
    const updated = { ...sub, lastUsed: new Date().toISOString().slice(0, 10) }
    await window.api.subscriptions.update(updated)
    set((s) => ({ subscriptions: s.subscriptions.map((x) => (x.id === id ? updated : x)) }))
  },

  updateSettings: async (partial) => {
    const settings = { ...get().settings, ...partial }
    await window.api.settings.save(settings)
    set({ settings })
  },

  addPaymentMethod: async (method) => {
    const methods = await window.api.paymentMethods.add(method)
    set({ paymentMethods: methods })
  },

  exportCSV: async () => {
    await window.api.export.csv(get().subscriptions)
  },

  setSidebarFilter: (sidebarFilter) => set({ sidebarFilter }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setShowAddModal: (showAddModal) => set({ showAddModal }),
  setEditingSub: (editingSub) => set({ editingSub }),
  setCurrentView: (currentView) => set({ currentView }),
  setModalPrefill: (modalPrefill) => set({ modalPrefill })
}))
