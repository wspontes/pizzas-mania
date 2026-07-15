import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui'

interface Product {
  id: string
  name: string
  category: string
  price: number
  active: boolean
}

export default function Products() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'Pizza Margherita', category: 'Pizzas', price: 42.90, active: true },
    { id: '2', name: 'Pizza Calabresa', category: 'Pizzas', price: 45.00, active: true },
    { id: '3', name: 'Coca-Cola 2L', category: 'Bebidas', price: 10.00, active: true },
  ])

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      setProducts((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const handleEdit = (id: string) => {
    navigate(`/admin/produtos/${id}/editar`)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Produtos</h1>
          <p className="text-sm text-muted">Gerencie seu cardápio</p>
        </div>
        <Link to="/admin/produtos/novo">
          <Button>
            <Plus size={16} />
            Novo Produto
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="text-lg text-muted">Nenhum produto cadastrado</p>
          <p className="text-sm text-muted mt-1">Clique em "Novo Produto" para adicionar</p>
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
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-surface-hover transition-colors">
                    <td className="p-4 font-medium text-white">{product.name}</td>
                    <td className="p-4 text-muted">{product.category}</td>
                    <td className="p-4 text-white">R$ {product.price.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        product.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {product.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(product.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-white transition-colors"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          title="Excluir"
                        >
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
