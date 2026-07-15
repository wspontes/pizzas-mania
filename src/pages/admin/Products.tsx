import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Copy, ChevronUp, ChevronDown } from 'lucide-react'
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
      active: false,
      featured: false,
      customizable: product.customizable,
      order: products.length + 1,
    })
    setProducts((prev) => [...prev, cloned])
  }

  const updateOrder = async (id: string, newOrder: number) => {
    await productsService.update(id, { order: newOrder } as Partial<Product>)
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, order: newOrder } : p)))
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const arr = [...displayed]
    const temp = arr[index].order ?? index + 1
    arr[index] = { ...arr[index], order: arr[index - 1].order ?? index }
    arr[index - 1] = { ...arr[index - 1], order: temp }
    const reordered = arr.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
    const updated = products.map((p) => {
      const found = reordered.find((r) => r.id === p.id)
      return found || p
    })
    setProducts(updated)
    Promise.all(arr.map((p, i) => productsService.update(p.id, { order: i + 1 } as Partial<Product>)))
  }

  const moveDown = (index: number) => {
    if (index === displayed.length - 1) return
    const arr = [...displayed]
    const temp = arr[index].order ?? index + 1
    arr[index] = { ...arr[index], order: arr[index + 1].order ?? index + 2 }
    arr[index + 1] = { ...arr[index + 1], order: temp }
    const reordered = arr.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
    const updated = products.map((p) => {
      const found = reordered.find((r) => r.id === p.id)
      return found || p
    })
    setProducts(updated)
    Promise.all(arr.map((p, i) => productsService.update(p.id, { order: i + 1 } as Partial<Product>)))
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
        <button
          onClick={() => setFilterCat('all')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filterCat === 'all' ? 'bg-accent text-white' : 'bg-surface text-muted hover:text-white border border-border'}`}
        >
          Todas
        </button>
        {categories.filter((c) => c.active).map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCat(cat.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filterCat === cat.id ? 'bg-accent text-white' : 'bg-surface text-muted hover:text-white border border-border'}`}
          >
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
                  <th className="p-4 w-10">#</th>
                  <th className="p-4 font-medium">Produto</th>
                  <th className="p-4 font-medium">Categoria</th>
                  <th className="p-4 font-medium">Preço</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Ordem</th>
                  <th className="p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayed.map((product, index) => (
                  <tr key={product.id} className="hover:bg-surface-hover transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveUp(index)} disabled={index === 0} className="flex h-4 w-4 items-center justify-center rounded text-muted hover:text-white hover:bg-surface-hover transition-colors disabled:opacity-20 disabled:cursor-not-allowed">
                          <ChevronUp size={12} />
                        </button>
                        <button onClick={() => moveDown(index)} disabled={index === displayed.length - 1} className="flex h-4 w-4 items-center justify-center rounded text-muted hover:text-white hover:bg-surface-hover transition-colors disabled:opacity-20 disabled:cursor-not-allowed">
                          <ChevronDown size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-xs text-muted">{product.description.slice(0, 40)}</p>
                    </td>
                    <td className="p-4 text-muted">{getCategoryName(product.categoryId)}</td>
                    <td className="p-4 text-white">
                      R$ {(product.discountPrice ?? product.price).toFixed(2)}
                      {product.discountPrice && <span className="ml-1 text-xs text-muted line-through">R$ {product.price.toFixed(2)}</span>}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${product.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {product.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted">{product.order ?? index + 1}</td>
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
