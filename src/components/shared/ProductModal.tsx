import { X, ShoppingCart, Star } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency } from '@/utils'
import { Button } from '@/components/ui'
import type { Product } from '@/types'

interface ProductModalProps {
  product: Product
  onClose: () => void
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const { addItem } = useCart()
  const { showToast } = useToast()
  const price = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price,
    })
    showToast('Adicionado no carrinho!')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <X size={18} />
        </button>

        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-56 w-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="flex h-56 w-full items-center justify-center bg-surface-hover">
            <Star size={48} className="text-muted" />
          </div>
        )}

        <div className="p-5">
          <h2 className="text-lg font-bold text-white">{product.name}</h2>
          <p className="mt-2 text-sm text-muted leading-relaxed">{product.description}</p>

          <div className="mt-4 flex items-end gap-2">
            {(product.discountPrice ?? 0) > 0 && (
              <span className="text-sm text-muted line-through">{formatCurrency(product.price)}</span>
            )}
            <span className="text-2xl font-bold text-accent">{formatCurrency(price)}</span>
          </div>

          <Button onClick={handleAddToCart} className="mt-5 w-full" size="lg">
            <ShoppingCart size={18} />
            Adicionar ao Carrinho
          </Button>
        </div>
      </div>
    </div>
  )
}
