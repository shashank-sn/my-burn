// Shared utility functions (used in main process and MCP server)
import type { Subscription } from './types'

const USD_TO_INR = 83.5

export function nextBillingDate(startDate: string, cycle: string, customDays = 30): string {
  let next = new Date(startDate)
  const today = new Date()

  while (next <= today) {
    if (cycle === 'monthly') {
      next.setMonth(next.getMonth() + 1)
    } else if (cycle === 'yearly') {
      next.setFullYear(next.getFullYear() + 1)
    } else {
      next.setDate(next.getDate() + (customDays || 30))
    }
  }

  return next.toISOString()
}

export function monthlyCost(sub: Subscription, displayCurrency: 'USD' | 'INR' = 'USD'): number {
  let cost = sub.cost
  if (sub.costCurrency !== displayCurrency) {
    cost = displayCurrency === 'INR' ? cost * USD_TO_INR : cost / USD_TO_INR
  }
  switch (sub.cycle) {
    case 'monthly': return cost
    case 'yearly':  return cost / 12
    case 'custom':  return (cost / (sub.customDays ?? 30)) * 30
    default:        return cost
  }
}

export function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

export function formatCurrency(amount: number, currency: 'USD' | 'INR'): string {
  if (currency === 'USD') {
    return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }
  const parts = amount.toFixed(2).split('.')
  const int = parts[0]
  const last3 = int.slice(-3)
  const rest = int.slice(0, -3)
  const formatted = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3
  return `₹${formatted}.${parts[1]}`
}
