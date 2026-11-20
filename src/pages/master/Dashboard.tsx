import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Store as StoreIcon, CheckCircle, XCircle, Search, ExternalLink, Power, Pencil, Users, Settings } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { storesService } from '@/services'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { Store } from '@/types'

interface StoreStats { orders: number; revenue: number }

export default function MasterDashboard() {
  const [stores, setStores] = useState<(Store & { id: string })[]>([])
  const [stats, setStats] = useState<Record<string, StoreStats>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await storesService.getAll()
      setStores(data)
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

  const toggleActive = async (st: Store & { id: string }) => {
    await updateDoc(doc(db, 'stores', st.id), { active: !st.active, updatedAt: new Date().toISOString() })
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
          <h1 className="text-xl md:text-2xl font-bold text-white">Painel Master</h1>
          <p className="text-xs md:text-sm text-muted mt-0.5">Gerencie todas as pizzarias</p>
        </div>
        <Link to="/cadastro" className="shrink-0">
          <Button size="sm">
            <Plus size={14} />
            Nova loja
          </Button>
        </Link>
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

      {/* Busca */}
      <div className="mb-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Buscar loja por nome ou slug..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface divide-y divide-border">
        {filtered.length === 0 && <div className="p-8 text-center text-muted">Nenhuma loja encontrada</div>}
        {filtered.map((s) => (
          <div key={s.id} className="flex flex-col gap-2 p-3 md:p-4 md:flex-row md:items-center md:justify-between hover:bg-surface-hover transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0">
                <StoreIcon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{s.name}</p>
                <p className="text-xs text-muted">/{s.slug} • {stats[s.id]?.orders || 0} pedidos • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats[s.id]?.revenue || 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {s.active ? <CheckCircle size={18} className="text-green-400" /> : <XCircle size={18} className="text-red-400" />}
              <button onClick={() => toggleActive(s)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-white transition-colors" title={s.active ? 'Desativar' : 'Ativar'}>
                <Power size={15} />
              </button>
              <a href={`/${s.slug}/admin`} rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-white transition-colors" title="Abrir painel">
                <ExternalLink size={15} />
              </a>
              <Link to={`/master/lojas/${s.id}/editar`} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-white transition-colors" title="Editar">
                <Settings size={15} />
              </Link>
              <Link to={`/master/lojas/${s.id}/usuarios`} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-white transition-colors" title="Usuários">
                <Users size={15} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}