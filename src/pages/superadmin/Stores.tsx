import { useState, useEffect, useMemo } from 'react'
import { Plus, Store as StoreIcon, CheckCircle, XCircle, Search, ExternalLink, Power, Pencil } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { storesService } from '@/services'
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { Store } from '@/types'

interface StoreStats { orders: number; revenue: number }

export default function SuperAdminStores() {
  const [stores, setStores] = useState<(Store & { id: string })[]>([])
  const [stats, setStats] = useState<Record<string, StoreStats>>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', adminEmail: '', adminPassword: '', adminName: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingSlug, setEditingSlug] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await storesService.getAll()
      setStores(data)
      // contar pedidos por loja
      const s: Record<string, StoreStats> = {}
      await Promise.all(data.map(async (st) => {
        try {
          const snap = await getDocs(collection(db, 'stores', st.id, 'orders'))
          let orders = 0, revenue = 0
          snap.docs.forEach((d) => {
            const o = d.data()
            if (o.status !== 'cancelled') { orders++; revenue += (o.total || 0) }
          })
          s[st.id] = { orders, revenue }
        } catch { s[st.id] = { orders: 0, revenue: 0 } }
      }))
      setStats(s)
    } catch { setStores([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const toSlug = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const slug = toSlug(form.slug.trim() || form.name)
      const now = new Date().toISOString()
      const store = await storesService.create({
        name: form.name.trim(),
        slug,
        active: true,
        createdAt: now,
        updatedAt: now,
      })
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')
      const { auth } = await import('@/firebase/config')
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
      await setDoc(doc(db, 'stores', store.id, 'settings', 'business'), { storeId: store.id, active: true, createdAt: now, updatedAt: now })
      setShowForm(false)
      setForm({ name: '', slug: '', adminEmail: '', adminPassword: '', adminName: '' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar loja')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (st: Store & { id: string }) => {
    await updateDoc(doc(db, 'stores', st.id), { active: !st.active, updatedAt: new Date().toISOString() })
    await load()
  }

  const saveName = async (id: string) => {
    if (!editingName.trim()) { setEditingId(null); return }
    const slug = toSlug(editingSlug.trim() || editingName)
    await updateDoc(doc(db, 'stores', id), { name: editingName.trim(), slug, updatedAt: new Date().toISOString() })
    setEditingId(null)
    await load()
  }

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase()
    if (!t) return stores
    return stores.filter((s) => s.name.toLowerCase().includes(t) || s.slug.toLowerCase().includes(t))
  }, [stores, search])

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const newThisMonth = stores.filter((s) => s.createdAt >= monthStart).length
  const totalOrders = Object.values(stats).reduce((a, b) => a + b.orders, 0)
  const totalRevenue = Object.values(stats).reduce((a, b) => a + b.revenue, 0)
  const activeCount = stores.filter((s) => s.active).length

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>
  }

  return (
    <div className="pb-20">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Lojas (Pizzarias)</h1>
          <p className="text-xs md:text-sm text-muted mt-0.5">{stores.length} lojas cadastradas</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus size={16} /> Nova Loja
        </Button>
      </div>

      {/* Metricas globais */}
      <div className="mb-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-3 md:p-4">
          <p className="text-xs text-muted">Lojas ativas</p>
          <p className="mt-1 text-xl md:text-2xl font-bold text-white">{activeCount}</p>
          <p className="text-[10px] text-muted/60">de {stores.length} total</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 md:p-4">
          <p className="text-xs text-muted">Novas este mês</p>
          <p className="mt-1 text-xl md:text-2xl font-bold text-white">{newThisMonth}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 md:p-4">
          <p className="text-xs text-muted">Pedidos (total)</p>
          <p className="mt-1 text-xl md:text-2xl font-bold text-white">{totalOrders}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 md:p-4">
          <p className="text-xs text-muted">Faturamento (total)</p>
          <p className="mt-1 text-xl md:text-2xl font-bold text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}</p>
        </div>
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

      <div className="mb-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Buscar loja por nome ou slug..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>
      ) : (
        <div className="rounded-xl border border-border bg-surface divide-y divide-border">
          {filtered.length === 0 && <div className="p-8 text-center text-muted">Nenhuma loja encontrada</div>}
          {filtered.map((s) => (
            <div key={s.id} className="flex flex-col gap-2 p-3 md:p-4 md:flex-row md:items-center md:justify-between hover:bg-surface-hover transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0">
                  <StoreIcon size={18} />
                </div>
                <div className="min-w-0">
                  {editingId === s.id ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="rounded-lg border border-border bg-surface-hover px-2 py-1 text-sm text-white focus:border-accent focus:outline-none" autoFocus placeholder="Nome" />
                        <input value={editingSlug} onChange={(e) => setEditingSlug(e.target.value)} className="mt-1 rounded-lg border border-border bg-surface-hover px-2 py-1 text-xs text-white focus:border-accent focus:outline-none" placeholder="Slug" />
                      </div>
                      <Button size="sm" onClick={() => saveName(s.id)}>Salvar</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>X</Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-white truncate">{s.name}</p>
                      <p className="text-xs text-muted">/{s.slug} • {stats[s.id]?.orders || 0} pedidos • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats[s.id]?.revenue || 0)}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {s.active ? <CheckCircle size={18} className="text-green-400" /> : <XCircle size={18} className="text-red-400" />}
                <button onClick={() => { setEditingId(s.id); setEditingName(s.name); setEditingSlug(s.slug) }} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-white transition-colors" title="Editar nome">
                  <Pencil size={15} />
                </button>
                <button onClick={() => toggleActive(s)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-white transition-colors" title={s.active ? 'Desativar' : 'Ativar'}>
                  <Power size={15} />
                </button>
                <a href={`/admin/${s.slug}`} rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-white transition-colors" title="Abrir painel">
                  <ExternalLink size={15} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}