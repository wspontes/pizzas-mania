import { useState, useMemo } from 'react'
import { X, ShoppingCart, Star, Pizza } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/contexts/ToastContext'
import { useSettings, useBusinessStatus, useProducts, useCategories } from '@/hooks'
import { formatCurrency } from '@/utils'
import { resolveImageUrl } from '@/utils/resolveImageUrl'
import { Button } from '@/components/ui'
import { OperatingHoursModal } from './OperatingHoursModal'
import type { Product } from '@/types'

interface ProductModalProps {
  product: Product
  onClose: () => void
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const { addItem } = useCart()
  const { showToast } = useToast()
  const { settings } = useSettings()
  const { status } = useBusinessStatus()
  const { products } = useProducts()
  const { categories } = useCategories()
  const [selectedBorder, setSelectedBorder] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [showHoursModal, setShowHoursModal] = useState(false)
  const [mode, setMode] = useState<'whole' | 'split'>('whole')
  const [secondFlavor, setSecondFlavor] = useState<Product | null>(null)

  const price = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const canSplit = categoryMap.get(product.categoryId)?.allowsMeiaMeia === true

  const eligibleFlavors = useMemo(() => {
    if (!canSplit) return []
    return products.filter((p) => {
      if (p.id === product.id) return false
      const cat = categoryMap.get(p.categoryId)
      if (!cat?.allowsMeiaMeia) return false
      const pPrice = p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price
      return pPrice === price
    })
  }, [products, categoryMap, canSplit, product.id, price])

  const splitAvailable = canSplit && eligibleFlavors.length > 0

  const crustOptions = settings?.crustOptions || []
  const hasCrust = product.hasCrust && crustOptions.length > 0
  const borderPrice = crustOptions.find((c) => c.name === selectedBorder)?.price || 0

  const handleAddToCart = () => {
    if (!status.isOpen) {
      setShowHoursModal(true)
      return
    }
    if (mode === 'split' && secondFlavor) {
      addItem({
        productId: product.id,
        productName: `1/2 ${product.name} + 1/2 ${secondFlavor.name}`,
        quantity: 1,
        price,
        hasCrust: product.hasCrust,
        border: selectedBorder || undefined,
        borderPrice: selectedBorder ? borderPrice : undefined,
        notes: notes.trim() || undefined,
        isSplit: true,
        flavors: [
          { productId: product.id, name: product.name, price },
          { productId: secondFlavor.id, name: secondFlavor.name, price },
        ],
      })
    } else {
      addItem({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price,
        hasCrust: product.hasCrust,
        border: selectedBorder || undefined,
        borderPrice: selectedBorder ? borderPrice : undefined,
        notes: notes.trim() || undefined,
      })
    }
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
            src={resolveImageUrl(product.image)}
            alt={product.name}
            className="w-full max-h-[350px] object-contain bg-surface-hover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="flex h-56 w-full items-center justify-center bg-surface-hover">
            <Star size={48} className="text-muted" />
          </div>
        )}

        <div className="p-5 max-h-[60vh] overflow-y-auto scrollbar-thin">
          <h2 className="text-lg font-bold text-white">{product.name}</h2>
          <p className="mt-2 text-sm text-muted leading-relaxed">{product.description}</p>

          <div className="mt-4 flex items-end gap-2">
            {(product.discountPrice ?? 0) > 0 && (
              <span className="text-sm text-muted line-through">{formatCurrency(product.price)}</span>
            )}
            <span className="text-2xl font-bold text-accent">{formatCurrency(price)}</span>
          </div>

          {splitAvailable && (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface-hover p-1">
                <button
                  type="button"
                  onClick={() => setMode('whole')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${mode === 'whole' ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}
                >
                  Pizza Inteira
                </button>
                <button
                  type="button"
                  onClick={() => setMode('split')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${mode === 'split' ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}
                >
                  <Pizza size={15} />
                  Meia-Meia
                </button>
              </div>

              {mode === 'split' && (
                <div className="mt-3 rounded-xl border border-border bg-surface-hover p-3">
                  <p className="mb-2 text-xs font-medium text-muted uppercase tracking-wider">Escolha o 2º sabor (mesmo valor)</p>
                  {secondFlavor ? (
                    <div className="mb-2 flex items-center justify-between rounded-lg bg-accent/10 px-3 py-2">
                      <span className="text-sm font-medium text-white">1/2 {product.name} + 1/2 {secondFlavor.name}</span>
                      <button
                        type="button"
                        onClick={() => setSecondFlavor(null)}
                        className="ml-2 shrink-0 text-xs text-muted hover:text-white transition-colors"
                      >
                        Trocar
                      </button>
                    </div>
                  ) : (
                    <p className="mb-2 text-xs text-muted">Selecione o sabor para completar sua pizza.</p>
                  )}
                  <div className="max-h-40 space-y-1.5 overflow-y-auto scrollbar-thin pr-1">
                    {eligibleFlavors.map((flavor) => {
                      const active = secondFlavor?.id === flavor.id
                      const fPrice = flavor.discountPrice && flavor.discountPrice > 0 ? flavor.discountPrice : flavor.price
                      return (
                        <label
                          key={flavor.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${active ? 'bg-accent/10' : 'hover:bg-surface'}`}
                        >
                          <input
                            type="radio"
                            name="secondFlavor"
                            checked={active}
                            onChange={() => setSecondFlavor(flavor)}
                            className="h-4 w-4 accent-accent shrink-0"
                          />
                          <span className="flex-1 text-sm text-white truncate">{flavor.name}</span>
                          <span className="text-sm text-accent font-medium shrink-0">{formatCurrency(fPrice)}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {hasCrust && (
            <div className="mt-4 rounded-xl border border-border bg-surface-hover p-3">
              <p className="mb-2 text-xs font-medium text-muted uppercase tracking-wider">Borda recheada</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer rounded-lg px-3 py-2 transition-colors hover:bg-surface">
                  <input
                    type="radio"
                    name="crust"
                    checked={selectedBorder === ''}
                    onChange={() => setSelectedBorder('')}
                    className="h-4 w-4 accent-accent"
                  />
                  <span className="text-sm text-white">Sem borda recheada</span>
                </label>
                {crustOptions.map((opt) => (
                  <label key={opt.name} className="flex items-center gap-2 cursor-pointer rounded-lg px-3 py-2 transition-colors hover:bg-surface">
                    <input
                      type="radio"
                      name="crust"
                      checked={selectedBorder === opt.name}
                      onChange={() => setSelectedBorder(opt.name)}
                      className="h-4 w-4 accent-accent"
                    />
                    <span className="flex-1 text-sm text-white">{opt.name}</span>
                    <span className="text-sm text-accent font-medium">+{formatCurrency(opt.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-muted uppercase tracking-wider">Observações (opcional)</label>
            <textarea
              rows={2}
              placeholder="Ex.: sem cebola, ponto da massa, retirar ingrediente..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-none rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-white placeholder:text-muted transition-colors focus:border-accent focus:outline-none"
            />
          </div>

          <Button
            onClick={handleAddToCart}
            className="mt-5 w-full"
            size="lg"
            disabled={mode === 'split' && !secondFlavor}
          >
            <ShoppingCart size={18} />
            {mode === 'split'
              ? secondFlavor
                ? `Adicionar Meia-Meia - ${formatCurrency(price + (selectedBorder ? borderPrice : 0))}`
                : 'Selecione o 2º sabor'
              : 'Adicionar ao Carrinho'}
          </Button>
        </div>
      </div>
      <OperatingHoursModal isOpen={showHoursModal} onClose={() => setShowHoursModal(false)} message={status.message} />
    </div>
  )
}
