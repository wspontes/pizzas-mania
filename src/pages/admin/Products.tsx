import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Copy, Search } from 'lucide-react'
import { Button } from '@/components/ui'
import { productsService, categoriesService } from '@/services'
import type { Product, Category } from '@/types'
import { formatCurrency } from '@/utils'

export default function Products() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [search, setSearch] = useState('')

  const load = async () => {
    try {
      const [prods, cats] = await Promise.all([
        productsService.getActiveProducts(),
        categoriesService.getAllOrdered(),
      ])
      setProducts(prods)
      setCategories(cats)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      await productsService.delete(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const handleClone = async (product: Product) => {
    const cloned = await productsService.create({
      name: `${product.name} (cópia)`,
      slug: `${product.slug}-copia`,
      description: product.description,
      categoryId: product.categoryId,
      price: product.price,
      discountPrice: product.discountPrice,
      image: product.image,
      order: products.length + 1,
      active: false,
      featured: false,
      customizable: product.customizable,
    })
    setProducts((prev) => [...prev, cloned])
  }

  const base = filterCat === 'all'
    ? [...products].sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
    : [...products].filter((p) => p.categoryId === filterCat).sort((a, b) => (a.order ?? 99) - (b.order ?? 99))

  const displayed = base.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()))

  const getCategoryName = (catId: string) => categories.find((c) => c.id === catId)?.name || catId

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="pb-20">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Produtos</h1>
          <p className="text-xs md:text-sm text-muted mt-0.5">{products.length} produtos cadastrados</p>
        </div>
        <Link to="/admin/produtos/novo">
          <Button>
            <Plus size={16} />
            Novo Produto
          </Button>
        </Link>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>
      </div>

      <div className="mb-5">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterCat('all')} className={`rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${filterCat === 'all' ? 'bg-accent text-white' : 'bg-surface text-muted hover:text-white border border-border'}`}>
            Todas
          </button>
          {categories.filter((c) => c.active).map((cat) => (
            <button key={cat.id} onClick={() => setFilterCat(cat.id)} className={`rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${filterCat === cat.id ? 'bg-accent text-white' : 'bg-surface text-muted hover:text-white border border-border'}`}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center mt-4">
          <p className="text-sm md:text-base text-muted">Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((product) => (
            <div key={product.id} className="rounded-xl border border-border bg-surface p-3.5 md:p-4">
              <div className="flex items-start gap-3">
                {product.image && (
                  <img src={product.image} alt="" className="h-12 w-12 md:h-14 md:w-14 shrink-0 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{product.name}</p>
                      <p className="text-xs text-muted mt-0.5 truncate">{getCategoryName(product.categoryId)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${product.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {product.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="mt-1.5 text-sm">
                    <span className="text-white font-medium">{formatCurrency((product.discountPrice ?? 0) > 0 ? (product.discountPrice as number) : product.price)}</span>
                    {(product.discountPrice ?? 0) > 0 && <span className="ml-1.5 text-xs text-muted line-through">{formatCurrency(product.price)}</span>}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                <button onClick={() => navigate(`/admin/produtos/${product.id}/editar`)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-white transition-colors" title="Editar">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleClone(product)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-white transition-colors" title="Clonar">
                  <Copy size={15} />
                </button>
                <button onClick={() => handleDelete(product.id, product.name)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors" title="Excluir">
                  <Trash2 size={15} />
                </button>
                <span className="ml-auto text-[10px] text-muted">Ordem: {product.order || '-'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
