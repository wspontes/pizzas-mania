import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Copy } from 'lucide-react'
import { Button } from '@/components/ui'
import { productsService, categoriesService } from '@/services'
import type { Product, Category } from '@/types'

export default function Products() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState<string>('all')

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

  const displayed = filterCat === 'all'
    ? [...products].sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
    : [...products].filter((p) => p.categoryId === filterCat).sort((a, b) => (a.order ?? 99) - (b.order ?? 99))

  const getCategoryName = (catId: string) => categories.find((c) => c.id === catId)?.name || catId

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Produtos</h1>
          <p className="text-sm text-muted">{products.length} produtos cadastrados</p>
        </div>
        <Link to="/admin/produtos/novo">
          <Button>
            <Plus size={16} />
            Novo Produto
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setFilterCat('all')} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filterCat === 'all' ? 'bg-accent text-white' : 'bg-surface text-muted hover:text-white border border-border'}`}>
          Todas
        </button>
        {categories.filter((c) => c.active).map((cat) => (
          <button key={cat.id} onClick={() => setFilterCat(cat.id)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filterCat === cat.id ? 'bg-accent text-white' : 'bg-surface text-muted hover:text-white border border-border'}`}>
            {cat.name}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="text-lg text-muted">Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="p-4 font-medium">Produto</th>
                  <th className="p-4 font-medium">Categoria</th>
                  <th className="p-4 font-medium">Preço</th>
                  <th className="p-4 font-medium">Ordem</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayed.map((product) => (
                  <tr key={product.id} className="hover:bg-surface-hover transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {product.image && (
                          <img src={product.image} alt="" className="h-10 w-10 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        )}
                        <div>
                          <p className="font-medium text-white">{product.name}</p>
                          <p className="text-xs text-muted">{product.description.slice(0, 40)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted">{getCategoryName(product.categoryId)}</td>
                    <td className="p-4 text-white">
                      R$ {((product.discountPrice ?? 0) > 0 ? (product.discountPrice as number) : product.price).toFixed(2)}
                      {(product.discountPrice ?? 0) > 0 && <span className="ml-1 text-xs text-muted line-through">R$ {product.price.toFixed(2)}</span>}
                    </td>
                    <td className="p-4 text-xs text-muted">{product.order || '-'}</td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${product.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {product.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/admin/produtos/${product.id}/editar`)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-white transition-colors" title="Editar">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleClone(product)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-white transition-colors" title="Clonar">
                          <Copy size={15} />
                        </button>
                        <button onClick={() => handleDelete(product.id, product.name)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors" title="Excluir">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
