// Re-export from shared types for renderer use
export type { Subscription, SharedUser, CostHistoryEntry, AppSettings, Analytics } from '../../../types'

export type ViewType = 'subscriptions' | 'analytics' | 'settings'
export type SortOrder = 'nextBilling' | 'name' | 'cost' | 'createdAt'
export type SidebarFilter = 'all' | 'upcoming' | 'trials' | 'zombies' | 'canceled' | `tag:${string}`
