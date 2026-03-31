// Shared types between main, preload, renderer, and MCP

export interface Subscription {
  id: string
  name: string
  cost: number
  costCurrency: 'USD' | 'INR'
  cycle: 'monthly' | 'yearly' | 'custom'
  customDays?: number
  startDate: string        // ISO date string
  nextBilling: string      // ISO date string
  paymentMethod: string
  tags: string[]
  notes: string
  isCanceled: boolean
  isPaid: boolean
  trialDays?: number
  trialStartDate?: string
  lastUsed?: string
  sharedWith?: SharedUser[]
  annualCost?: number
  previousCost?: number
  costHistory?: CostHistoryEntry[]
  createdAt: string
}

export interface SharedUser {
  id: string
  name: string
  amount: number
  currency: string
}

export interface CostHistoryEntry {
  date: string
  cost: number
  currency: string
}

export interface AppSettings {
  currency: 'USD' | 'INR'
  theme: 'dark' | 'light'
  notificationsEnabled: boolean
  designTheme: 'glass' | 'neo'
}

export interface Analytics {
  monthlyTotal: number
  yearlyTotal: number
  activeCount: number
  canceledCount: number
  zombieCount: number
  trialCount: number
  byTag: Record<string, number>
  upcoming: Subscription[]
}
