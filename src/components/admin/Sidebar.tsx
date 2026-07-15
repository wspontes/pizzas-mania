import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, ListTree, ClipboardList, Settings, UtensilsCrossed, X, Users, Ticket } from 'lucide-react'
import { cn } from '@/utils'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: '/admin/produtos', label: 'Produtos', icon: Package },
  { to: '/admin/categorias', label: 'Categorias', icon: ListTree },
  { to: '/admin/cupons', label: 'Cupons', icon: Ticket },
  { to: '/admin/usuarios', label: 'Usuários', icon: Users },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-border bg-surface transition-transform duration-300 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2 text-lg font-bold text-white">
            <UtensilsCrossed className="text-accent" size={20} />
            Pizzas Mania
          </div>
          <button onClick={onClose} className="text-muted hover:text-white lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-1',
                    isActive
                      ? 'bg-accent text-white'
                      : 'text-muted hover:bg-surface-hover hover:text-white'
                  )
                }
              >
                <Icon size={18} />
                {link.label}
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
