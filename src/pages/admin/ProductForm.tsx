import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useState } from 'react'

export default function ProductForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    active: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/admin/produtos')
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => navigate('/admin/produtos')} className="text-muted hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Novo Produto</h1>
          <p className="text-sm text-muted">Adicione um novo item ao cardápio</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-surface p-6">
        <Input
          label="Nome do produto"
          placeholder="Ex: Pizza Margherita"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white">Descrição</label>
          <textarea
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-white placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            rows={3}
            placeholder="Descrição do produto"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Preço"
            type="number"
            step="0.01"
            placeholder="39.90"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white">Categoria</label>
            <select
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-white transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Selecione</option>
              <option value="1">Pizzas</option>
              <option value="2">Bebidas</option>
              <option value="3">Sobremesas</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent"
            />
            <span className="text-sm text-white">Produto ativo</span>
          </label>
        </div>

        <div className="flex gap-3">
          <Button type="submit">Salvar</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/admin/produtos')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
