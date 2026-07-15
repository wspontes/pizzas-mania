import { Link } from 'react-router-dom'
import { ShoppingCart, Menu, X, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/utils'

const navLinks = [
  { to: '/', label: 'Início' },
  { to: '/cardapio', label: 'Cardápio' },
  { to: '/contato', label: 'Contato' },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { state } = useCart()
  const { user } = useAuth()

  const itemCount = state.items.reduce((acc, i) => acc + i.quantity, 0)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-brand-black/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
          <UtensilsCrossed className="text-accent" size={24} />
          Pizzas Mania
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-muted transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/carrinho"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:text-white"
          >
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <Link to="/perfil">
              <Button variant="ghost" size="sm">
                {user.name}
              </Button>
            </Link>
          ) : (
            <Link to="/auth/login">
              <Button variant="primary" size="sm">
                Entrar
              </Button>
            </Link>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:text-white md:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          'overflow-hidden border-t border-border transition-all duration-300 md:hidden',
          mobileOpen ? 'max-h-60' : 'max-h-0'
        )}
      >
        <nav className="flex flex-col gap-1 px-4 pb-4 pt-2">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
