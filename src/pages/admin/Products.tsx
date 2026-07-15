import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui'

const mockProducts = [
  { id: '1', name: 'Pizza Margherita', category: 'Pizzas', price: 42.90, active: true },
  { id: '2', name: 'Pizza Calabresa', category: 'Pizzas', price: 45.00, active: true },
  { id: '3', name: 'Coca-Cola 2L', category: 'Bebidas', price: 10.00, active: true },
]

export default function Products() {
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
              {mockProducts.map((product) => (
                <tr key={product.id} className="hover:bg-surface-hover">
                  <td className="p-4 text-white">{product.name}</td>
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
                    <div className="flex items-center gap-2">
                      <button className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-white transition-colors">
                        <Pencil size={16} />
                      </button>
                      <button className="rounded-lg p-1.5 text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
