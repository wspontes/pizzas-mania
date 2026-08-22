import { useState, useMemo, useEffect, useRef } from 'react'
import { SearchBar, CategoryCard, ProductCard } from '@/components/shared'
import { ProductCardSkeleton, CategorySkeleton } from '@/components/shared'
import { useCategories, useProducts } from '@/hooks'
import type { Category, Product } from '@/types'

export default function Menu() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const { categories, loading: catLoading } = useCategories()
  const { products: allProducts, loading: prodLoading } = useProducts()
  const filterRef = useRef<HTMLDivElement>(null)

  const grouped = useMemo(() => {
    return categories
      .map((category: Category) => ({
        ...category,
        items: allProducts.filter((p: Product) => p.categoryId === category.id),
      }))
      .filter((group) => group.items.length > 0)
  }, [categories, allProducts])

  const searching = search.trim().length > 0

  const searchResults = useMemo(() => {
    if (!searching) return []
    const term = search.toLowerCase().trim()
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
    )
  }, [allProducts, search, searching])

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
    if (searching) {
      setSearch('')
      requestAnimationFrame(() => {
        const el = document.getElementById(`menu-section-${categoryId}`)
        if (!el) return
        const y = el.getBoundingClientRect().top + window.scrollY - getScrollOffset()
        window.scrollTo({ top: Math.max(y, 0), behavior: 'auto' })
      })
      return
    }
    const isFirst = grouped[0]?.id === categoryId
    const el = document.getElementById(`menu-section-${categoryId}`)
    if (isFirst || !el) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const y = el.getBoundingClientRect().top + window.scrollY - getScrollOffset()
    window.scrollTo({ top: Math.max(y, 0), behavior: 'smooth' })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div ref={filterRef} className="sticky top-16 z-30 -mx-4 bg-brand-black px-4 pt-3 pb-3 md:pt-8 md:pb-4 border-b border-border/50">
        <div className="mb-3">
          <h1 className="text-xl font-bold text-white md:text-2xl">Cardápio</h1>
          <p className="mt-0.5 text-sm text-muted">Escolha seu sabor favorito</p>
        </div>

        <div className="mb-3">
          <SearchBar value={search} onChange={setSearch} />
        </div>

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
      ) : searching ? (
        searchResults.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-muted">
              {searchResults.length} resultado{searchResults.length > 1 ? 's' : ''} para "{search}"
            </p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {searchResults.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-12 text-center">
            <p className="text-lg text-muted">Nenhum produto encontrado para essa busca</p>
          </div>
        )
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
