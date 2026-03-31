import { app } from 'electron'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import type { Subscription, AppSettings } from '../types'

interface StoreSchema {
  subscriptions: Subscription[]
  settings: AppSettings
  paymentMethods: string[]
}

const DEFAULTS: StoreSchema = {
  subscriptions: [],
  settings: {
    currency: 'USD',
    theme: 'dark',
    notificationsEnabled: true,
    designTheme: 'glass'
  },
  paymentMethods: ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'PayPal', 'Bank Transfer']
}

class JsonStore {
  private filePath!: string
  private data!: StoreSchema

  init(): void {
    const dir = app.getPath('userData')
    mkdirSync(dir, { recursive: true })
    this.filePath = join(dir, 'store.json')
    this.data = this.load()
  }

  private load(): StoreSchema {
    try {
      if (existsSync(this.filePath)) {
        const parsed = JSON.parse(readFileSync(this.filePath, 'utf-8')) as Partial<StoreSchema>
        return {
          subscriptions: parsed.subscriptions ?? DEFAULTS.subscriptions,
          settings: { ...DEFAULTS.settings, ...(parsed.settings ?? {}) },
          paymentMethods: parsed.paymentMethods ?? DEFAULTS.paymentMethods
        }
      }
    } catch {
      // corrupted file → fall back to defaults
    }
    return { ...DEFAULTS, settings: { ...DEFAULTS.settings } }
  }

  private save(): void {
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8')
  }

  get<K extends keyof StoreSchema>(key: K): StoreSchema[K] {
    return this.data[key]
  }

  set<K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void {
    this.data[key] = value
    this.save()
  }
}

export const store = new JsonStore()
