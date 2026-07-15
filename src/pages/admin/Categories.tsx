import { useState } from 'react'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import { Button, Input } from '@/components/ui'

export default function Categories() {
  const [categories, setCategories] = useState([
    { id: '1', name: 'Pizzas', order: 1, active: true, productCount: 8 },
    { id: '2', name: 'Bebidas', order: 2, active: true, productCount: 12 },
    { id: '3', name: 'Sobremesas', order: 3, active: true, productCount: 5 },
    { id: '4', name: 'Combos', order: 4, active: false, productCount: 3 },
  ])
  const [newCategory, setNewCategory] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleAdd = () => {
    if (!newCategory.trim()) return
    setCategories((prev) => [
      ...prev,
      { id: String(Date.now()), name: newCategory, order: prev.length + 1, active: true, productCount: 0 },
    ])
    setNewCategory('')
  }

  const handleEdit = (id: string) => {
    if (!editingName.trim()) return
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name: editingName } : c)))
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  const toggleActive = (id: string) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)))
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Categorias</h1>
        <p className="text-sm text-muted">Organize as categorias do cardápio</p>
      </div>

      <div className="mb-6 flex gap-2">
        <Input
          placeholder="Nome da nova categoria"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd}>
          <Plus size={16} />
          Adicionar
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="divide-y divide-border">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-3 p-4">
              <GripVertical size={16} className="text-muted shrink-0" />
              <div className="flex-1 min-w-0">
                {editingId === category.id ? (
                  <div className="flex gap-2">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEdit(category.id)}
                      className="h-8"
                    />
                    <Button size="sm" onClick={() => handleEdit(category.id)}>Salvar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-white">{category.name}</p>
                    <p className="text-xs text-muted">{category.productCount} produtos</p>
                  </>
                )}
              </div>
              <button
                onClick={() => toggleActive(category.id)}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  category.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}
              >
                {category.active ? 'Ativo' : 'Inativo'}
              </button>
              <button
                onClick={() => { setEditingId(category.id); setEditingName(category.name) }}
                className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-white transition-colors"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="rounded-lg p-1.5 text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
