import { useState, useEffect, useMemo } from 'react'
import { ShoppingBag, DollarSign, TrendingUp, XCircle, Users, Trophy, CalendarRange, Truck, ChefHat } from 'lucide-react'
import { ordersService } from '@/services'
import type { Order } from '@/types'
import { formatCurrency, formatTime, formatDate } from '@/utils'
import { getAnalytics, type AnalyticsData } from '@/utils/analytics'

type PeriodPreset = 'today' | 'week' | 'month' | 'lastMonth' | 'custom'
interface Period { preset: PeriodPreset; start: string; end: string }
const PERIOD_PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'lastMonth', label: 'Mês passado' },
  { key: 'custom', label: 'Período' },
]

function resolveRange(period: Period): { start: string; end: string } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (period.preset) {
    case 'today': return { start: today.toISOString(), end: new Date(today.getTime() + 86400000).toISOString() }
    case 'week': { const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()); return { start: start.toISOString(), end: new Date(start.getTime() + 7 * 86400000).toISOString() } }
    case 'month': return { start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), end: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString() }
    case 'lastMonth': return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(), end: new Date(now.getFullYear(), now.getMonth(), 1).toISOString() }
    case 'custom': return { start: period.start ? new Date(`${period.start}T00:00:00`).toISOString() : '', end: period.end ? new Date(`${period.end}T23:59:59`).toISOString() : '' }
  }
}

const dateInputClass = 'rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-white [color-scheme:dark] focus:border-accent focus:outline-none'

function PeriodFilter({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap gap-1 self-start sm:self-auto rounded-lg border border-border bg-surface p-1">
        {PERIOD_PRESETS.map((opt) => (
          <button key={opt.key} onClick={() => onChange({ ...value, preset: opt.key })} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${value.preset === opt.key ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}>{opt.label}</button>
        ))}
      </div>
      {value.preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <CalendarRange size={14} className="text-muted" />
          <input type="date" value={value.start} max={value.end || undefined} onChange={(e) => onChange({ ...value, start: e.target.value })} className={dateInputClass} />
          <span className="text-xs text-muted">até</span>
          <input type="date" value={value.end} min={value.start || undefined} onChange={(e) => onChange({ ...value, end: e.target.value })} className={dateInputClass} />
        </div>
      )}
    </div>
  )
}

const PAY_COLORS: Record<string, string> = { pix: '#f97316', card: '#3b82f6', cash: '#22c55e', credit: '#8b5cf6', debit: '#06b6d4', delivery: '#eab308' }
const PAY_LABELS: Record<string, string> = { pix: 'PIX', card: 'Cartão', cash: 'Dinheiro', credit: 'Crédito', debit: 'Débito', delivery: 'Na entrega' }

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>({ preset: 'today', start: '', end: '' })
  const [topPeriod, setTopPeriod] = useState<Period>({ preset: 'month', start: '', end: '' })
  const [analytics, setAnalytics] = useState<AnalyticsData>({ totalVisits: 0, monthlyVisits: 0, todayVisits: 0, currentMonth: '', currentDay: '' })

  useEffect(() => {
    const load = async () => {
      try {
        const [o, a] = await Promise.all([ordersService.getAll(), getAnalytics()])
        setOrders(o); setAnalytics(a)
      } catch { setOrders([]) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const range = resolveRange(period)
  const topRange = resolveRange(topPeriod)

  const filteredOrders = useMemo(() => orders.filter((o) => {
    if (o.status === 'cancelled') return false
    if (range.start && o.createdAt < range.start) return false
    if (range.end && o.createdAt >= range.end) return false
    return true
  }), [orders, range.start, range.end])

  const deliveredOrders = filteredOrders.filter((o) => o.status === 'delivered')
  const totalOrders = filteredOrders.length
  const totalRevenue = deliveredOrders.reduce((s, o) => s + o.total, 0)
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const inProgress = orders.filter((o) => ['received', 'accepted', 'preparing', 'outForDelivery'].includes(o.status))
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length
  const distinctCustomers = new Set(orders.map((o) => o.customerPhone)).size

  const stats = [
    { label: 'Faturamento', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10', sub: `${deliveredOrders.length} concluídos` },
    { label: 'Pedidos', value: String(totalOrders), icon: ShoppingBag, color: 'text-accent', bg: 'bg-accent/10', sub: `${filteredOrders.filter((o) => o.status === 'preparing').length} em preparo` },
    { label: 'Ticket Médio', value: formatCurrency(avgOrder), icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10', sub: 'por pedido' },
    { label: 'Em Andamento', value: String(inProgress.length), icon: Truck, color: 'text-yellow-400', bg: 'bg-yellow-500/10', sub: `${inProgress.filter((o) => o.status === 'preparing').length} em preparo` },
    { label: 'Cancelados', value: String(cancelledCount), icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', sub: 'total' },
    { label: 'Clientes', value: String(distinctCustomers), icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10', sub: 'únicos' },
  ]

  // top products
  const topOrders = useMemo(() => orders.filter((o) => {
    if (o.status === 'cancelled') return false
    if (topRange.start && o.createdAt < topRange.start) return false
    if (topRange.end && o.createdAt >= topRange.end) return false
    return true
  }), [orders, topRange.start, topRange.end])
  const productCount: Record<string, { name: string; qty: number; revenue: number }> = {}
  for (const order of topOrders) {
    for (const item of order.items) {
      const key = item.productId
      if (!productCount[key]) productCount[key] = { name: item.productName, qty: 0, revenue: 0 }
      productCount[key].qty += item.quantity
      productCount[key].revenue += item.price * item.quantity
    }
  }
  const topProducts = Object.values(productCount).sort((a, b) => b.qty - a.qty).slice(0, 8)

  const recentOrders = [...filteredOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8)

  // vendas por dia (últimos 7 dias do período ou do mês)
  const salesByDay = useMemo(() => {
    const map: Record<string, number> = {}
    for (const o of filteredOrders) {
      const d = new Date(o.createdAt)
      const key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
      map[key] = (map[key] || 0) + o.total
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-10)
  }, [filteredOrders])
  const maxDay = Math.max(1, ...salesByDay.map(([, v]) => v))

  // vendas por mês
  const salesByMonth = useMemo(() => {
    const map: Record<string, number> = {}
    for (const o of orders.filter((o) => o.status !== 'cancelled')) {
      const d = new Date(o.createdAt)
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`
      map[key] = (map[key] || 0) + o.total
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-6)
  }, [orders])
  const maxMonth = Math.max(1, ...salesByMonth.map(([, v]) => v))

  // forma de pagamento
  const payCounts: Record<string, number> = {}
  for (const o of filteredOrders) payCounts[o.paymentMethod] = (payCounts[o.paymentMethod] || 0) + 1
  const payEntries = Object.entries(payCounts)
  const payTotal = payEntries.reduce((s, [, v]) => s + v, 0) || 1
  let acc = 0
  const conicStops = payEntries.map(([k, v]) => {
    const pct = (v / payTotal) * 100
    const start = acc
    acc += pct
    return { key: k, pct, start, color: PAY_COLORS[k] || '#999' }
  })

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-xs md:text-sm text-muted mt-0.5">{analytics.todayVisits} acessos hoje, {analytics.monthlyVisits} acessos este mês</p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <div className="mb-8 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-xl border border-border bg-surface p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className={`flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <p className="mt-2 text-xl md:text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs md:text-sm text-muted">{stat.label}</p>
              <p className="text-[10px] md:text-xs text-muted/60">{stat.sub}</p>
            </div>
          )
        })}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-3 md:p-4">
          <h2 className="mb-3 text-sm md:text-base font-semibold text-white">Vendas por Dia</h2>
          {salesByDay.length === 0 ? <div className="p-6 text-center text-xs text-muted">Sem dados</div> : (
            <div className="flex items-end gap-1.5 h-40">
              {salesByDay.map(([d, v]) => (
                <div key={d} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-accent/70 hover:bg-accent transition-colors" style={{ height: `${(v / maxDay) * 100}%`, minHeight: '4px' }} title={formatCurrency(v)} />
                  <span className="text-[9px] text-muted truncate w-full text-center">{d}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 md:p-4">
          <h2 className="mb-3 text-sm md:text-base font-semibold text-white">Vendas por Mês</h2>
          {salesByMonth.length === 0 ? <div className="p-6 text-center text-xs text-muted">Sem dados</div> : (
            <div className="flex items-end gap-2 h-40">
              {salesByMonth.map(([m, v]) => (
                <div key={m} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-blue-500/70 hover:bg-blue-500 transition-colors" style={{ height: `${(v / maxMonth) * 100}%`, minHeight: '4px' }} title={formatCurrency(v)} />
                  <span className="text-[9px] text-muted truncate w-full text-center">{m.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-3 md:p-4">
          <h2 className="mb-3 text-sm md:text-base font-semibold text-white">Forma de Pagamento</h2>
          {payEntries.length === 0 ? <div className="p-6 text-center text-xs text-muted">Sem dados</div> : (
            <div className="flex items-center gap-6 justify-center py-2">
              <div className="h-32 w-32 rounded-full shrink-0" style={{ background: `conic-gradient(${conicStops.map((s) => `${s.color} ${s.start}% ${s.start + s.pct}%`).join(', ')})` }} />
              <div className="flex flex-col gap-2">
                {conicStops.map((s) => (
                  <div key={s.key} className="flex items-center gap-2 text-xs">
                    <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                    <span className="text-muted">{PAY_LABELS[s.key] || s.key}</span>
                    <span className="text-white font-medium">{s.pct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-surface">
          <div className="border-b border-border p-3 md:p-4 flex items-center gap-2">
            <ChefHat size={16} className="text-accent" />
            <h2 className="text-sm md:text-base font-semibold text-white">Pedidos em Andamento</h2>
          </div>
          {inProgress.length === 0 ? <div className="p-6 text-center text-xs text-muted">Nenhum pedido em andamento</div> : (
            <div className="divide-y divide-border max-h-64 overflow-y-auto">
              {inProgress.slice(0, 8).map((o) => (
                <div key={o.id} className="flex items-center gap-3 p-3 hover:bg-surface-hover transition-colors">
                  <span className="text-lg">🍕</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">#{o.id.slice(0, 6)} {o.customerName}</p>
                    <p className="text-xs text-muted">{o.status === 'preparing' ? 'Preparando' : o.status === 'received' ? 'Recebido' : o.status === 'accepted' ? 'Aceito' : 'Saiu'}</p>
                  </div>
                  <span className="text-xs text-white font-medium">{formatCurrency(o.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-surface">
        <div className="flex flex-col items-start gap-2 border-b border-border p-3 md:p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-accent" />
            <h2 className="text-sm md:text-base font-semibold text-white">Mais Pedidos</h2>
          </div>
          <PeriodFilter value={topPeriod} onChange={setTopPeriod} />
        </div>
        {topProducts.length === 0 ? (
          <div className="p-8 text-center text-xs md:text-sm text-muted">Nenhum pedido neste período</div>
        ) : (
          <div className="divide-y divide-border">
            {topProducts.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 md:p-4 hover:bg-surface-hover transition-colors">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${i === 0 ? 'bg-yellow-500/15 text-yellow-400' : i === 1 ? 'bg-gray-300/10 text-gray-300' : i === 2 ? 'bg-orange-500/10 text-orange-400' : 'bg-surface-hover text-muted'}`}>{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium leading-snug text-white line-clamp-2">{item.name}</p>
                  <p className="mt-0.5 text-xs text-muted">{item.qty} un. vendidas</p>
                </div>
                <div className="text-right shrink-0"><p className="text-sm font-medium text-white">{formatCurrency(item.revenue)}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border p-3 md:p-4"><h2 className="text-sm md:text-base font-semibold text-white">Últimos Pedidos</h2></div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-xs md:text-sm text-muted">Nenhum pedido neste período</div>
        ) : (
          <div className="divide-y divide-border">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 md:p-4 hover:bg-surface-hover transition-colors">
                <div className="min-w-0 flex-1 mr-3">
                  <p className="text-sm font-medium text-white truncate">{order.customerName}</p>
                  <p className="text-xs text-muted">{formatDate(new Date(order.createdAt))} • {formatTime(new Date(order.createdAt))} • {order.items.reduce((s, i) => s + i.quantity, 0)} itens</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-white">{formatCurrency(order.total)}</p>
                  <p className="text-xs text-muted capitalize">{order.status === 'delivered' ? 'Entregue' : order.status === 'preparing' ? 'Preparando' : order.status === 'received' ? 'Recebido' : order.status === 'outForDelivery' ? (order.deliveryType === 'pickup' ? 'Pronto' : 'Saiu') : order.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}