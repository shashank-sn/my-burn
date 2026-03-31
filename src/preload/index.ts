import { contextBridge, ipcRenderer } from 'electron'
import type { Subscription, AppSettings } from '../types'

const api = {
  subscriptions: {
    getAll: (): Promise<Subscription[]> => ipcRenderer.invoke('subscriptions:get-all'),
    saveAll: (subs: Subscription[]): Promise<{ ok: boolean }> => ipcRenderer.invoke('subscriptions:save-all', subs),
    add: (sub: Subscription): Promise<Subscription> => ipcRenderer.invoke('subscriptions:add', sub),
    update: (sub: Subscription): Promise<Subscription> => ipcRenderer.invoke('subscriptions:update', sub),
    delete: (id: string): Promise<{ ok: boolean }> => ipcRenderer.invoke('subscriptions:delete', id)
  },
  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
    save: (s: AppSettings): Promise<{ ok: boolean }> => ipcRenderer.invoke('settings:save', s)
  },
  paymentMethods: {
    get: (): Promise<string[]> => ipcRenderer.invoke('payment-methods:get'),
    add: (method: string): Promise<string[]> => ipcRenderer.invoke('payment-methods:add', method)
  },
  export: {
    csv: (subs: Subscription[]): Promise<{ ok: boolean; filePath?: string }> =>
      ipcRenderer.invoke('export:csv', subs)
  },
  on: (channel: string, cb: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_e, ...args) => cb(...args))
  },
  off: (channel: string, cb: (...args: unknown[]) => void) => {
    ipcRenderer.removeListener(channel, cb as never)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
