import { useEffect } from 'react'
import { useAppStore } from './store/app-store'
import Sidebar from './components/Sidebar'
import SubscriptionsView from './views/SubscriptionsView'
import SettingsView from './views/SettingsView'
import AddEditModal from './components/AddEditModal'

export default function App() {
  const {
    loadAll,
    showAddModal,
    editingSub,
    modalPrefill,
    setShowAddModal,
    setEditingSub,
    setModalPrefill,
    settings,
    updateSettings,
    currentView
  } = useAppStore()

  useEffect(() => {
    loadAll()
    window.api.on('trigger:add-subscription', () => setShowAddModal(true))
    return () => window.api.off('trigger:add-subscription', () => setShowAddModal(true))
  }, [])

  const isGlass = settings.designTheme !== 'neo'

  return (
    <div
      className="flex h-full w-full overflow-hidden bg-base text-text-primary relative"
      data-theme={settings.designTheme ?? 'glass'}
    >
      {/* macOS drag region */}
      <div className="drag-region absolute top-0 left-0 right-0 h-10 z-10 pointer-events-none" />

      {/* Design theme toggle */}
      <button
        className="theme-toggle"
        onClick={() => updateSettings({ designTheme: isGlass ? 'neo' : 'glass' })}
        title={isGlass ? 'Switch to Neobrutalism' : 'Switch to Liquid Glass'}
      >
        {isGlass ? (
          <>
            <span style={{ fontSize: 13 }}>🫧</span>
            <span>GLASS</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 11 }}>◼</span>
            <span>NEO</span>
          </>
        )}
      </button>

      <Sidebar />

      <main className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {currentView === 'settings' ? <SettingsView /> : <SubscriptionsView />}
      </main>

      {(showAddModal || editingSub) && (
        <AddEditModal
          subscription={editingSub}
          prefill={modalPrefill}
          onClose={() => {
            setShowAddModal(false)
            setEditingSub(null)
            setModalPrefill(null)
          }}
        />
      )}
    </div>
  )
}
