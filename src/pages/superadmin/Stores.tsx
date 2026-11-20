import { useState, useEffect } from 'react'
import { Plus, Store as StoreIcon, CheckCircle, XCircle } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { storesService } from '@/services'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth, db } from '@/firebase/config'
import { doc, setDoc } from 'firebase/firestore'
import type { Store } from '@/types'

export default function SuperAdminStores() {
  const [stores, setStores] = useState<(Store & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', adminEmail: '', adminPassword: '', adminName: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await storesService.getAll()
      setStores(data)
    } catch { setStores([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const slug = form.slug.trim().toLowerCase().replace(/\s+/g, '-')
      const now = new Date().toISOString()
      const store = await storesService.create({
        name: form.name.trim(),
        slug,
        active: true,
        createdAt: now,
        updatedAt: now,
      })
      // cria admin user
      const cred = await createUserWithEmailAndPassword(auth, form.adminEmail, form.adminPassword)
      await updateProfile(cred.user, { displayName: form.adminName || form.name })
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: form.adminName || form.name,
        username: form.adminEmail.split('@')[0],
        email: form.adminEmail,
        role: 'admin',
        storeId: store.id,
        active: true,
        createdAt: now,
        updatedAt: now,
      })
      // settings default
      await setDoc(doc(db, 'stores', store.id, 'settings', 'main'), {
        storeId: store.id,
        active: true,
        createdAt: now,
        updatedAt: now,
      })
      setShowForm(false)
      setForm({ name: '', slug: '', adminEmail: '', adminPassword: '', adminName: '' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar loja')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pb-20">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Lojas (Pizzarias)</h1>
          <p className="text-xs md:text-sm text-muted mt-0.5">{stores.length} lojas cadastradas</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus size={16} /> Nova Loja
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-border bg-surface p-4 md:p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Cadastrar nova pizzaria</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Nome da pizzaria" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Slug (URL)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="minha-pizzaria" required />
            <Input label="Nome do admin" value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} />
            <Input label="Email do admin" type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} required />
            <Input label="Senha do admin" type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} required />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" loading={saving}>Criar Loja</Button>
            <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>
      ) : (
        <div className="rounded-xl border border-border bg-surface divide-y divide-border">
          {stores.length === 0 && <div className="p-8 text-center text-muted">Nenhuma loja cadastrada</div>}
          {stores.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 md:p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <StoreIcon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{s.name}</p>
                  <p className="text-xs text-muted">/{s.slug} • {s.id}</p>
                </div>
              </div>
              {s.active ? <CheckCircle size={18} className="text-green-400 shrink-0" /> : <XCircle size={18} className="text-red-400 shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}