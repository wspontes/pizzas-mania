import { useState, useMemo, useRef, useEffect } from 'react'
import { X, ShoppingCart, Star, Search, ArrowLeft, Check } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/contexts/ToastContext'
import { useSettings, useBusinessStatus, useProducts, useCategories } from '@/hooks'
import { formatCurrency } from '@/utils'
import { resolveImageUrl } from '@/utils/resolveImageUrl'
import { calcularPrecoMeioAMeio, productPrice, isAllowedCombination, resolveMeiaMeiaGroup } from '@/utils/meiaMeia'
import { Button } from '@/components/ui'
import { OperatingHoursModal } from './OperatingHoursModal'
import type { Product, Category } from '@/types'

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
  const [secondFlavor, setSecondFlavor] = useState<Product | null>(null)
  const [showFlavorPicker, setShowFlavorPicker] = useState(false)
  const [flavorSearch, setFlavorSearch] = useState('')
  const [flavorCategory, setFlavorCategory] = useState<string | null>(null)

  const price = productPrice(product)

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const firstCategory = categoryMap.get(product.categoryId)
  const firstGroup = resolveMeiaMeiaGroup(firstCategory, categories)
  const canSplit = firstCategory?.allowsMeiaMeia === true && !!firstGroup

  const eligibleFlavors = useMemo(() => {
    if (!canSplit || !firstGroup) return []
    const group1 = firstGroup
    return products.filter((p) => {
      if (p.id === product.id) return false
      if (!p.active) return false
      const cat = categoryMap.get(p.categoryId)
      const g2 = resolveMeiaMeiaGroup(cat, categories)
      if (!cat?.allowsMeiaMeia || !g2) return false
      if (!isAllowedCombination(group1, g2)) return false
      const pPrice = productPrice(p)
      // permite qualquer preço; o preço final é o maior
      void pPrice
      return true
    })
  }, [products, categoryMap, canSplit, product.id, firstCategory])

  const splitAvailable = canSplit && eligibleFlavors.length > 0
  const mode: 'whole' | 'split' = splitAvailable ? 'split' : 'whole'

  const filteredFlavors = useMemo(() => {
    let list = eligibleFlavors
    if (flavorCategory) {
      list = list.filter((p) => p.categoryId === flavorCategory)
    }
    const term = flavorSearch.trim().toLowerCase()
    if (term) {
      list = list.filter((p) => p.name.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term))
    }
    return list
  }, [eligibleFlavors, flavorCategory, flavorSearch])

  const flavorCategories = useMemo(() => {
    const ids = new Set(eligibleFlavors.map((p) => p.categoryId))
    return categories.filter((c) => ids.has(c.id) && c.active)
  }, [eligibleFlavors, categories])

  const splitPrice = secondFlavor
    ? calcularPrecoMeioAMeio(price, productPrice(secondFlavor))
    : price

  const crustOptions = settings?.crustOptions || []
  const hasCrust = product.hasCrust && crustOptions.length > 0
  const borderPrice = crustOptions.find((c) => c.name === selectedBorder)?.price || 0
  const finalPrice = (mode === 'split' && secondFlavor ? splitPrice : price) + (selectedBorder ? borderPrice : 0)

  const handleAddToCart = () => {
    if (!status.isOpen) {
      setShowHoursModal(true)
      return
    }
    if (mode === 'split') {
      if (!secondFlavor) return
      const g1 = firstGroup
      const g2 = resolveMeiaMeiaGroup(categoryMap.get(secondFlavor.categoryId), categories)
      if (!g1 || !g2 || !isAllowedCombination(g1, g2)) {
        showToast('Combinação de sabores não permitida', 'error')
        return
      }
      addItem({
        productId: product.id,
        productName: `Pizza: ½ ${product.name} + ½ ${secondFlavor.name}`,
        quantity: 1,
        price: splitPrice,
        hasCrust: product.hasCrust,
        border: selectedBorder || undefined,
        borderPrice: selectedBorder ? borderPrice : undefined,
        notes: notes.trim() || undefined,
        isSplit: true,
        flavors: [
          { productId: product.id, name: product.name, price, categoryId: product.categoryId, group: firstGroup },
          { productId: secondFlavor.id, name: secondFlavor.name, price: productPrice(secondFlavor), categoryId: secondFlavor.categoryId, group: resolveMeiaMeiaGroup(categoryMap.get(secondFlavor.categoryId), categories) },
        ],
      })
      showToast('Adicionado no carrinho!', 'cart', `Pizza: ½ ${product.name} + ½ ${secondFlavor.name}`)
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
      showToast('Adicionado no carrinho!', 'cart', product.name)
    }
    onClose()
  }

  // fechar picker com ESC
  useEffect(() => {
    if (!showFlavorPicker) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowFlavorPicker(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showFlavorPicker])

  const canAdd = mode === 'whole' || !!secondFlavor

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
              <div className="rounded-xl border border-border bg-surface-hover p-3">
                  <p className="mb-2 text-xs font-medium text-muted uppercase tracking-wider">Escolha o 2º sabor</p>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Slot 1 */}
                    <div className="flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-2 py-2">
                      {product.image ? (
                        <img src={resolveImageUrl(product.image)} alt="" className="h-10 w-10 rounded-md object-cover shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-surface-hover flex items-center justify-center shrink-0">
                          <Star size={16} className="text-muted" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted">½</p>
                        <p className="text-xs font-medium text-white truncate">{product.name}</p>
                        <p className="text-[10px] text-accent">✓</p>
                      </div>
                    </div>

                    {/* Slot 2 */}
                    <button
                      type="button"
                      onClick={() => setShowFlavorPicker(true)}
                      className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors ${secondFlavor ? 'border-accent/40 bg-accent/10' : 'border-dashed border-border hover:border-accent/50'}`}
                    >
                      {secondFlavor ? (
                        <>
                          {secondFlavor.image ? (
                            <img src={resolveImageUrl(secondFlavor.image)} alt="" className="h-10 w-10 rounded-md object-cover shrink-0" />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-surface-hover flex items-center justify-center shrink-0">
                              <Star size={16} className="text-muted" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[10px] text-muted">½</p>
                            <p className="text-xs font-medium text-white truncate">{secondFlavor.name}</p>
                            <p className="text-[10px] text-accent">Toque para trocar</p>
                          </div>
                        </>
                      ) : (
                        <div className="flex w-full items-center justify-center gap-1.5 py-2">
                          <span className="text-lg text-muted">+</span>
                          <span className="text-xs text-muted">Escolha o 2º sabor</span>
                        </div>
                      )}
                    </button>
                  </div>

                  {secondFlavor && (
                    <p className="mt-2 text-xs text-muted">
                      Preço: {formatCurrency(splitPrice)} (maior dos dois sabores)
                    </p>
                  )}
                </div>
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
            disabled={!canAdd}
          >
            <ShoppingCart size={18} />
            {mode === 'split'
              ? secondFlavor
                ? `Adicionar ao carrinho · ${formatCurrency(finalPrice)}`
                : 'Selecione o 2º sabor'
              : `Adicionar ao carrinho · ${formatCurrency(finalPrice)}`}
          </Button>
        </div>
      </div>

      {/* Sheet/modal de escolha do 2º sabor */}
      {showFlavorPicker && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4" onClick={() => setShowFlavorPicker(false)}>
          <div className="w-full sm:max-w-2xl h-[92vh] sm:h-auto sm:max-h-[85vh] overflow-hidden rounded-t-2xl sm:rounded-2xl border border-border bg-surface shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 border-b border-border px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowFlavorPicker(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-white">
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-white">Escolha o 2º sabor</h3>
              <p className="text-xs text-muted">½ {product.name} + ½ ?</p>
            </div>
            <button onClick={() => setShowFlavorPicker(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="px-4 py-3 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Buscar sabor..."
                value={flavorSearch}
                onChange={(e) => setFlavorSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none"
                autoFocus
              />
            </div>
            {flavorCategories.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  onClick={() => setFlavorCategory(null)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${flavorCategory === null ? 'bg-accent text-white' : 'bg-surface-hover text-muted hover:text-white'}`}
                >
                  Todos
                </button>
                {flavorCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setFlavorCategory(c.id)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${flavorCategory === c.id ? 'bg-accent text-white' : 'bg-surface-hover text-muted hover:text-white'}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6" onClick={(e) => e.stopPropagation()}>
            {filteredFlavors.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-8 text-center mt-4">
                <p className="text-muted">Nenhum sabor disponível para combinar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredFlavors.map((flavor) => {
                  const fPrice = productPrice(flavor)
                  const active = secondFlavor?.id === flavor.id
                  return (
                    <button
                      key={flavor.id}
                      type="button"
                      onClick={() => { setSecondFlavor(flavor); setShowFlavorPicker(false) }}
                      className={`overflow-hidden rounded-xl border text-left transition-colors ${active ? 'border-accent bg-accent/10' : 'border-border bg-surface hover:border-accent/50'}`}
                    >
                      {flavor.image ? (
                        <img src={resolveImageUrl(flavor.image)} alt={flavor.name} className="h-28 w-full object-cover" />
                      ) : (
                        <div className="flex h-28 w-full items-center justify-center bg-surface-hover">
                          <Star size={24} className="text-muted" />
                        </div>
                      )}
                      <div className="p-2.5">
                        <p className="text-sm font-medium text-white truncate">{flavor.name}</p>
                        {flavor.description && <p className="mt-0.5 text-xs text-muted line-clamp-2">{flavor.description}</p>}
                        <p className="mt-1 text-sm font-semibold text-accent">{formatCurrency(fPrice)}</p>
                        {active && <Check size={14} className="mt-1 text-accent" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      <OperatingHoursModal isOpen={showHoursModal} onClose={() => setShowHoursModal(false)} message={status.message} />
    </div>
  )
}

