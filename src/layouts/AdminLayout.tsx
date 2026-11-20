import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { StoreProvider } from '@/contexts/StoreContext'
import { Sidebar } from '@/components/admin'
import { AdminHeader } from '@/components/admin'
import { NewOrderWatcher, UpdateToast } from '@/components/shared'

const ADMIN_MANIFEST = '/manifest-admin.webmanifest'

/** Troca o manifesto nas telas do admin para instalar o app abrindo direto em /admin. */
function useAdminManifest() {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    if (!link) return
    const previous = link.getAttribute('href')
    link.setAttribute('href', ADMIN_MANIFEST)
    return () => {
      if (previous) link.setAttribute('href', previous)
    }
  }, [])
}

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useAdminManifest()

  return (
    <StoreProvider>
      <div className="flex min-h-screen bg-brand-black">
        <NewOrderWatcher />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col">
          <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
        <UpdateToast />
      </div>
    </StoreProvider>
  )
}
