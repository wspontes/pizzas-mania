import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { categoriesService } from '@/services'
import type { Category } from '@/types'

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategory, setNewCategory] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const load = async () => {
    try {
      const data = await categoriesService.getActiveCategories()
      setCategories(data)
    } catch {
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    const name = newCategory.trim()
    if (!name) return
    const created = await categoriesService.create({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      order: categories.length + 1,
      active: true,
    })
    setCategories((prev) => [...prev, created])
    setNewCategory('')
  }

  const startEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditingName(cat.name)
  }

  const confirmEdit = async () => {
    const name = editingName.trim()
    if (!name || !editingId) return
    await categoriesService.update(editingId, { name })
    setCategories((prev) => prev.map((c) => (c.id === editingId ? { ...c, name } : c)))
    setEditingId(null)
  }

  const cancelEdit = () => setEditingId(null)

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      await categoriesService.delete(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    }
  }

  const toggleActive = async (id: string) => {
    const cat = categories.find((c) => c.id === id)
    if (!cat) return
    await categoriesService.update(id, { active: !cat.active })
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Categorias</h1>
        <p className="text-sm text-muted">{categories.length} categorias</p>
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

      {categories.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="text-lg text-muted">Nenhuma categoria cadastrada</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface">
          <div className="divide-y divide-border">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-3 px-4 py-3">
                {editingId === category.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && confirmEdit()}
                      className="h-8"
                      autoFocus
                    />
                    <button onClick={confirmEdit} className="flex h-8 w-8 items-center justify-center rounded-lg text-green-400 hover:bg-green-500/10 transition-colors">
                      <Check size={16} />
                    </button>
                    <button onClick={cancelEdit} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-white transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{category.name}</p>
                    </div>
                    <button
                      onClick={() => toggleActive(category.id)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                        category.active
                          ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                          : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      }`}
                    >
                      {category.active ? 'Ativo' : 'Inativo'}
                    </button>
                    <button onClick={() => startEdit(category)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-white transition-colors" title="Editar">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(category.id, category.name)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors" title="Excluir">
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
