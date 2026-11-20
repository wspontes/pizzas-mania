import { Outlet, Link } from 'react-router-dom'
import { UtensilsCrossed, LogOut, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui'
import { UpdateToast } from '@/components/shared'

export function SuperAdminLayout() {
  const { user, logout } = useAuth()
  return (
    <div className="flex min-h-screen flex-col bg-brand-black">
      <header className="sticky top-0 z-50 border-b border-border bg-surface">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/superadmin" className="flex items-center gap-2 font-bold text-white">
            <Shield className="text-accent" size={20} />
            Super Admin
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">{user?.name || 'Super Admin'}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
      <UpdateToast />
    </div>
  )
}