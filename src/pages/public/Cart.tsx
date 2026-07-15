import { Link } from 'react-router-dom'
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, Ticket } from 'lucide-react'
import { useState } from 'react'
import { Button, Input } from '@/components/ui'
import { useCart } from '@/contexts/CartContext'
import { formatCurrency } from '@/utils'

export default function Cart() {
  const { state, removeItem, updateQuantity, applyCoupon, subtotal, total } = useCart()
  const [couponInput, setCouponInput] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return
    applyCoupon(couponInput, 10)
    setCouponApplied(true)
  }

  if (state.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface">
            <ShoppingBag size={36} className="text-muted" />
          </div>
          <h1 className="text-2xl font-bold text-white">Carrinho vazio</h1>
          <p className="mt-2 text-muted">
            Adicione produtos do cardápio para começar seu pedido.
          </p>
          <Link to="/cardapio">
            <Button className="mt-6">
              Ver Cardápio
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/cardapio" className="text-muted transition-colors hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Carrinho</h1>
          <p className="text-sm text-muted">{state.items.length} itens</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {state.items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{item.productName}</h3>
                {item.size && (
                  <p className="text-sm text-muted">Tamanho: {item.size}</p>
                )}
                {item.notes && (
                  <p className="text-sm text-muted truncate">Obs: {item.notes}</p>
                )}
                <p className="mt-1 font-semibold text-accent">
                  {formatCurrency(item.price)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-hover hover:text-white transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm font-medium text-white">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-hover hover:text-white transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>

              <p className="w-20 text-right font-medium text-white">
                {formatCurrency(item.price * item.quantity)}
              </p>

              <button
                onClick={() => removeItem(item.productId)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-3 font-semibold text-white">Cupom de desconto</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Digite o cupom"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                icon={<Ticket size={16} />}
              />
              <Button variant="outline" size="md" onClick={handleApplyCoupon}>
                Aplicar
              </Button>
            </div>
            {couponApplied && (
              <p className="mt-2 text-xs text-green-400">Cupom aplicado com sucesso!</p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-3 font-semibold text-white">Resumo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {state.couponDiscount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Desconto</span>
                  <span>-{formatCurrency(state.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>Taxa de entrega</span>
                <span>{formatCurrency(state.deliveryFee)}</span>
              </div>
              <div className="border-t border-border pt-2">
                <div className="flex justify-between font-semibold text-white">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <Link to="/checkout" className="mt-4 block">
              <Button className="w-full" size="lg">
                Continuar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
