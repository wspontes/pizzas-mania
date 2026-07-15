import { useState, useMemo, useEffect } from 'react'
import { SearchBar, CategoryCard, ProductCard } from '@/components/shared'
import { ProductCardSkeleton, CategorySkeleton } from '@/components/shared'
import { useCategories, useProducts } from '@/hooks'

export default function Menu() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const { categories, loading: catLoading } = useCategories()

  useEffect(() => {
    if (!catLoading && categories.length > 0 && activeCategory === null) {
      setActiveCategory(categories[0].id)
    }
  }, [categories, catLoading, activeCategory])
  const { products, loading: prodLoading } = useProducts(activeCategory ?? undefined)

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products
    const term = search.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
    )
  }, [products, search])

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory((prev) => (prev === categoryId ? null : categoryId))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Cardápio</h1>
        <p className="mt-1 text-sm text-muted">Escolha seu sabor favorito</p>
      </div>

      <div className="mb-6">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      <div className="mb-8">
        {catLoading ? (
          <CategorySkeleton />
        ) : categories.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                active={activeCategory === category.id}
                onClick={handleCategoryClick}
              />
            ))}
          </div>
        ) : null}
      </div>

      {prodLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="text-lg text-muted">
            {search
              ? 'Nenhum produto encontrado para essa busca'
              : 'Nenhum produto disponível nesta categoria'}
          </p>
        </div>
      )}
    </div>
  )
}
