import type { Subscription } from './types'

const USD_TO_INR = 83.5

export function nextBillingDate(startDate: string, cycle: string, customDays = 30): string {
  let next = new Date(startDate)
  const today = new Date()
  while (next <= today) {
    if (cycle === 'monthly') next.setMonth(next.getMonth() + 1)
    else if (cycle === 'yearly') next.setFullYear(next.getFullYear() + 1)
    else next.setDate(next.getDate() + (customDays || 30))
  }
  return next.toISOString()
}

export function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

export function monthlyCost(sub: Subscription, displayCurrency: 'USD' | 'INR'): number {
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

export function formatCurrency(amount: number, currency: 'USD' | 'INR'): string {
  if (currency === 'USD') {
    return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }
  const [int, dec] = amount.toFixed(2).split('.')
  const last3 = int.slice(-3)
  const rest = int.slice(0, -3)
  const formatted = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3
  return `₹${formatted}.${dec}`
}

export function urgencyColor(days: number): string {
  if (days < 0)  return 'text-red-soft'
  if (days <= 3) return 'text-red-soft'
  if (days <= 7) return 'text-orange-soft'
  return 'text-text-secondary'
}

export function urgencyBg(days: number): string {
  if (days < 0)  return 'bg-red-soft/10'
  if (days <= 3) return 'bg-red-soft/8'
  if (days <= 7) return 'bg-orange-soft/8'
  return ''
}

export function isZombie(sub: Subscription): boolean {
  if (!sub.lastUsed) return false
  return daysUntil(sub.lastUsed) < -30
}

export function isActiveTrial(sub: Subscription): boolean {
  if (!sub.trialDays || !sub.trialStartDate) return false
  const end = new Date(sub.trialStartDate)
  end.setDate(end.getDate() + sub.trialDays)
  return new Date() < end
}

export function trialDaysRemaining(sub: Subscription): number {
  if (!sub.trialDays || !sub.trialStartDate) return 0
  const end = new Date(sub.trialStartDate)
  end.setDate(end.getDate() + sub.trialDays)
  return Math.max(0, daysUntil(end.toISOString()))
}

export function shortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function relativeDate(dateStr: string): string {
  const days = daysUntil(dateStr)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days > 1 && days < 7) return `In ${days} days`
  return shortDate(dateStr)
}
