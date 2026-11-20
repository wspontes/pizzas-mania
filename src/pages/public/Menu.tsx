import { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChefHat, Clock, Bike } from 'lucide-react'
import { CategoryCard, ProductCard } from '@/components/shared'
import { ProductCardSkeleton, CategorySkeleton } from '@/components/shared'
import { useCategories, useProducts, useSettings } from '@/hooks'
import { resolveImageUrl } from '@/utils/resolveImageUrl'
import type { Category, Product } from '@/types'

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const { categories, loading: catLoading } = useCategories()
  const { products: allProducts, loading: prodLoading } = useProducts()
  const { settings, loading: settingsLoading } = useSettings()
  const filterRef = useRef<HTMLDivElement>(null)

  const banner = settings?.banner
  const showBanner = settingsLoading || (banner?.active ?? true)
  const textColor = banner?.textColor || '#ffffff'
  const hasImage = !!banner?.image
  const alignClass = banner?.align === 'center' ? 'items-center text-center' : banner?.align === 'right' ? 'items-end text-right' : 'items-start text-left'
  const benefitIcons = [ChefHat, Clock, Bike]
  const benefits = banner?.benefits?.length
    ? banner.benefits.map((text: string, i: number) => ({ icon: benefitIcons[i % benefitIcons.length], text }))
    : [
        { icon: ChefHat, text: 'Ingredientes selecionados' },
        { icon: Clock, text: 'Pronto em até 30 min' },
        { icon: Bike, text: 'Entrega gratuita*' },
      ]

  const grouped = useMemo(() => {
    return categories
      .map((category: Category) => ({
        ...category,
        items: allProducts.filter((p: Product) => p.categoryId === category.id),
      }))
      .filter((group) => group.items.length > 0)
  }, [categories, allProducts])

  const searching = false
  const getScrollOffset = () =>
    (filterRef.current?.offsetHeight ?? 0) + 76

  useEffect(() => {
    if (searching || grouped.length === 0) return
    const onScroll = () => {
      const threshold = getScrollOffset() + 12
      let current: string | null = null
      for (const group of grouped) {
        const el = document.getElementById(`menu-section-${group.id}`)
        if (el && el.getBoundingClientRect().top <= threshold) current = group.id
      }
      setActiveCategory(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [grouped, searching])

  const chipsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeCategory || searching) return
    const container = chipsRef.current
    const chip = container?.querySelector<HTMLElement>(`[data-cat-id="${activeCategory}"]`)
    if (!container || !chip) return
    const target = chip.offsetLeft - container.clientWidth / 2 + chip.offsetWidth / 2
    container.scrollTo({ left: Math.max(target, 0), behavior: 'smooth' })
  }, [activeCategory, searching])

  useEffect(() => {
    if (!searching && !activeCategory && grouped.length > 0) {
      setActiveCategory(grouped[0].id)
    }
  }, [grouped, searching, activeCategory])

  const handleCategoryClick = (categoryId: string) => {
    const isFirst = grouped[0]?.id === categoryId
    const el = document.getElementById(`menu-section-${categoryId}`)
    if (isFirst || !el) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const y = el.getBoundingClientRect().top + window.scrollY - getScrollOffset()
    window.scrollTo({ top: Math.max(y, 0), behavior: 'smooth' })
    return
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-6">
      {showBanner && (
      <section className={`relative mb-10 overflow-hidden rounded-2xl bg-gradient-to-br from-accent/20 via-surface to-surface p-6 md:p-12 flex flex-col ${settingsLoading ? '' : alignClass}`}>
        {settingsLoading ? (
          <div className="relative z-10 min-h-[200px] animate-pulse">
            <div className="h-6 w-32 rounded bg-surface-hover mb-4" />
            <div className="h-10 w-3/4 rounded bg-surface-hover mb-2" />
            <div className="h-10 w-1/2 rounded bg-surface-hover mb-4" />
            <div className="h-4 w-2/3 rounded bg-surface-hover" />
          </div>
        ) : (
          <>
            <div className="absolute right-0 top-0 h-48 w-48 md:h-64 md:w-64 translate-x-12 -translate-y-12 rounded-full bg-accent/10 blur-3xl" />
            {banner?.image && (() => {
              const pos = banner.imagePosition || 'center'
              const pct = banner.opacity ?? 20
              const maskGradient = pos === 'left'
                ? `linear-gradient(to right, black 0%, black ${pct}%, transparent 100%)`
                : pos === 'right'
                  ? `linear-gradient(to left, black 0%, black ${pct}%, transparent 100%)`
                  : `linear-gradient(to right, transparent 0%, black ${50 - pct / 2}%, black ${50 + pct / 2}%, transparent 100%)`
              return (
                <img
                  src={resolveImageUrl(banner.image)}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{
                    WebkitMaskImage: maskGradient,
                    maskImage: maskGradient,
                  }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )
            })()}
            <div className={`relative z-10 ${banner?.align === 'center' ? '' : 'max-w-xl'}`}>
              <h1 className="text-xl md:text-5xl font-bold leading-tight" style={{ color: textColor, textShadow: hasImage ? '0 2px 8px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.5)' : 'none' }}>
                {banner?.title || 'A melhor pizza\nda cidade'}
              </h1>
              <p className="mt-2 md:mt-4 text-sm md:text-lg" style={{ color: textColor, opacity: 0.8, textShadow: hasImage ? '0 1px 4px rgba(0,0,0,0.6)' : 'none' }}>
                {banner?.subtitle || 'Massa artesanal, ingredientes frescos e o sabor que só a Pizzas Mania tem.'}
              </p>
            </div>
            <div className={`mt-6 md:mt-8 flex gap-4 md:gap-6 ${banner?.align === 'center' ? 'justify-center' : banner?.align === 'right' ? 'justify-end' : ''}`}>
              {benefits.map((benefit) => (
                <div key={benefit.text} className="flex items-center gap-1.5 text-xs md:text-sm" style={{ color: textColor, opacity: 0.7, textShadow: hasImage ? '0 1px 3px rgba(0,0,0,0.5)' : 'none' }}>
                  <benefit.icon size={14} className="text-accent" />
                  {benefit.text}
                </div>
              ))}
            </div>
          </>
        )}
      </section>
      )}

      <div ref={filterRef} className="sticky top-16 z-30 -mx-4 bg-brand-black px-4 pt-3 pb-3 md:pt-4 md:pb-4 border-b border-border/50">
        <div>
          {catLoading ? (
            <CategorySkeleton />
          ) : categories.length > 0 ? (
            <div ref={chipsRef} className="relative flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {grouped.map((group) => (
                <div key={group.id} data-cat-id={group.id}>
                  <CategoryCard
                    category={group}
                    active={!searching && activeCategory === group.id}
                    onClick={handleCategoryClick}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {prodLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : grouped.length > 0 ? (
        <div className="space-y-10">
          {grouped.map((group) => (
            <section key={group.id} id={`menu-section-${group.id}`}>
              <div className="mb-4 flex items-center gap-3">
                {group.image ? (
                  <img src={group.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : null}
                <div>
                  <h2 className="text-xl font-bold text-white">{group.name}</h2>
                  <p className="text-xs text-muted">{group.items.length} itens</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {group.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="text-lg text-muted">Nenhum produto disponível no momento</p>
        </div>
      )}
    </div>
  )
}
