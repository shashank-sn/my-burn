import { app, BrowserWindow, Tray, Menu, nativeImage, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc-handlers'
import { startSocketServer, stopSocketServer } from './socket-server'
import { store } from './store'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 560,
    show: false,
    title: 'My Burn',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0D0D0D',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

function createTray(): void {
  // Flame icon as a simple template image (16x16 monochrome)
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADRSURBVDiNpZMxDoIwFIa/YmJiYmJiYjIxMTExMTExMTGRiYmJCQkJCQkJCZ+hJVAo7UsI/En77+v7X3sPkiRJkiRJkiRJku3LiAhERNy2bUdEFBG3bVsREUXEbVsWEVFE3LZlERFFxG1bFhFRRNy2ZRERRcRtWxYRUUTctmUREUXEbVsWEVFE3LZlERFFxG1bFhFRRNy2ZRERRcRtWxYRUUTctmUREUXEbVsWEVFE3LZlERFFxG1bFhFRRNy2ZRERRcRtWxYRUUTctmUREUXEbVsWEVFE3LZlERFF9AEK3RqnAAAAAElFTkSuQmCC'
  )
  icon.setTemplateImage(true)

  tray = new Tray(icon)
  updateTrayMenu()
}

function updateTrayMenu(): void {
  if (!tray) return

  const subs = store.get('subscriptions')
  const active = subs.filter((s) => !s.isCanceled)
  const monthly = active.reduce((sum, s) => {
    const cost = s.cycle === 'monthly' ? s.cost : s.cycle === 'yearly' ? s.cost / 12 : (s.cost / (s.customDays ?? 30)) * 30
    return sum + (s.costCurrency === 'INR' ? cost / 83.5 : cost)
  }, 0)

  const upcoming = active
    .sort((a, b) => new Date(a.nextBilling).getTime() - new Date(b.nextBilling).getTime())
    .slice(0, 3)

  const upcomingItems = upcoming.map((s) => {
    const days = Math.ceil((new Date(s.nextBilling).getTime() - Date.now()) / 86400000)
    return { label: `  ${s.name} — ${days}d  $${s.cost}`, enabled: false }
  })

  const menu = Menu.buildFromTemplate([
    { label: `🔥 My Burn`, enabled: false },
    { label: `$${monthly.toFixed(2)}/month · ${active.length} active`, enabled: false },
    { type: 'separator' },
    ...(upcomingItems.length ? [{ label: 'Upcoming:', enabled: false }, ...upcomingItems, { type: 'separator' as const }] : []),
    { label: 'Open My Burn', click: () => { mainWindow?.show(); mainWindow?.focus() } },
    { label: 'Add Subscription', click: () => { mainWindow?.show(); mainWindow?.webContents.send('trigger:add-subscription') } },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])

  tray.setContextMenu(menu)
  tray.setToolTip(`My Burn — $${monthly.toFixed(2)}/mo`)
}

// ── App lifecycle ──────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.shasha.MyBurn')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Must init before any store.get/set calls
  store.init()

  registerIpcHandlers()
  createWindow()
  createTray()
  startSocketServer()

  // Refresh tray every minute
  setInterval(updateTrayMenu, 60_000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    else mainWindow?.show()
  })
})

app.on('window-all-closed', () => {
  // On macOS keep app running in tray when window is closed
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  stopSocketServer()
})
