import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { StoreProvider } from '@/contexts/StoreContext'
import { Header } from '@/components/layout'
import { Footer } from '@/components/layout'
import { UpdateToast } from '@/components/shared'
import { trackVisit } from '@/utils/analytics'

export function PublicLayout() {
  useEffect(() => { trackVisit() }, [])

  return (
    <StoreProvider>
      <div className="flex min-h-screen flex-col bg-brand-black">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <UpdateToast />
      </div>
    </StoreProvider>
  )
}
