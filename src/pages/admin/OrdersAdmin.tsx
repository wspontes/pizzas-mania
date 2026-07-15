import { useState, useEffect } from 'react'
import { ChefHat, XCircle, ArrowLeft, MessageSquare, CheckCircle, Search } from 'lucide-react'
import { Button } from '@/components/ui'
import { ordersService } from '@/services'
import type { Order } from '@/types'
import { formatCurrency, formatTime } from '@/utils'

const statusConfig: Record<string, { label: string; color: string }> = {
  waitingPayment: { label: 'Aguard. Pagamento', color: 'bg-yellow-500/10 text-yellow-400' },
  received: { label: 'Recebido', color: 'bg-blue-500/10 text-blue-400' },
  analyzing: { label: 'Em análise', color: 'bg-yellow-500/10 text-yellow-400' },
  accepted: { label: 'Aceito', color: 'bg-green-500/10 text-green-400' },
  preparing: { label: 'Preparando', color: 'bg-orange-500/10 text-orange-400' },
  outForDelivery: { label: 'Saiu para entrega', color: 'bg-purple-500/10 text-purple-400' },
  delivered: { label: 'Entregue', color: 'bg-green-500/10 text-green-400' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/10 text-red-400' },
}

const statuses = ['waitingPayment', 'received', 'analyzing', 'accepted', 'preparing', 'outForDelivery', 'delivered'] as const

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [whatsappModal, setWhatsappModal] = useState<{ phone: string; name: string; message: string } | null>(null)

  const load = async () => {
    try {
      const data = await ordersService.getAll()
      setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const advanceStatus = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return
    const currentIndex = statuses.indexOf(order.status as typeof statuses[number])
    if (currentIndex >= statuses.length - 1) return
    const nextStatus = statuses[currentIndex + 1]
    const updateData: Record<string, unknown> = { status: nextStatus }
    if (nextStatus === 'received') updateData.paymentStatus = 'paid'
    await ordersService.update(orderId, updateData as Partial<Order>)
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus, paymentStatus: nextStatus === 'received' ? 'paid' : o.paymentStatus } : o)))

    if (nextStatus === 'accepted') {
      setWhatsappModal({ phone: order.customerPhone, name: order.customerName, message: `Olá ${order.customerName}! Seu pedido foi ACEITO e já está em preparação. Obrigado por escolher a Pizzas Mania! 🍕` })
    } else if (nextStatus === 'outForDelivery') {
      setWhatsappModal({ phone: order.customerPhone, name: order.customerName, message: `Olá ${order.customerName}! Seu pedido SAIU PARA ENTREGA. Fique atento ao seu celular! 🛵🍕` })
    }
  }

  const confirmPayment = async (orderId: string) => {
    await ordersService.update(orderId, { status: 'received', paymentStatus: 'paid' } as Partial<Order>)
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'received', paymentStatus: 'paid' } : o)))
  }

  const backStatus = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return
    const currentIndex = statuses.indexOf(order.status as typeof statuses[number])
    if (currentIndex <= 0) return
    const prevStatus = statuses[currentIndex - 1]
    await ordersService.update(orderId, { status: prevStatus } as Partial<Order>)
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: prevStatus } : o)))
  }

  const cancelOrder = async (orderId: string) => {
    await ordersService.update(orderId, { status: 'cancelled' } as Partial<Order>)
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)))
  }

  const getPaymentLabel = (method: string) => {
    if (method === 'pix') return 'PIX'
    if (method === 'credit') return 'Cartão Crédito'
    if (method === 'debit') return 'Cartão Débito'
    if (method === 'cash') return 'Dinheiro'
    if (method === 'delivery') return 'Pagar na Entrega'
    return method
  }

  const filtered = (filter === 'all' ? orders : orders.filter((o) => o.status === filter))
    .filter((o) => !search || o.customerName.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search))

  const filters = [
    { key: 'all', label: 'Todos', count: orders.length },
    ...Object.entries(statusConfig).map(([key, cfg]) => ({
      key,
      label: cfg.label,
      count: orders.filter((o) => o.status === key).length,
    })),
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="pb-20">
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-white">Pedidos</h1>
        <p className="text-xs md:text-sm text-muted mt-0.5">{orders.length} pedidos no total</p>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Buscar por nome ou ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>
      </div>

      <div className="mb-5 -mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
          {filters.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-medium transition-colors ${filter === f.key ? 'bg-accent text-white shadow-sm' : 'bg-surface text-muted hover:text-white border border-border'}`}>
              {f.label} <span className={`${filter === f.key ? 'text-white/70' : 'text-muted/60'}`}>({f.count})</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center mt-4">
          <p className="text-sm md:text-base text-muted">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const status = statusConfig[order.status] || statusConfig.waitingPayment
            return (
              <div key={order.id} className="rounded-xl border border-border bg-surface">
                <div className="p-3.5 md:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white truncate">{order.customerName}</span>
                        {order.changeNeeded && order.changeFor && (
                          <span className="shrink-0 rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-400 font-medium">Troco p/ {formatCurrency(order.changeFor)}</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted">#{order.id.slice(0, 8)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] md:text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1">
                    {order.items.map((item, idx) => (
                      <p key={idx} className="text-xs text-muted leading-relaxed">
                        {item.quantity}x {item.productName}
                      </p>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>{formatTime(new Date(order.createdAt))}</span>
                      <span>{getPaymentLabel(order.paymentMethod)}</span>
                      {order.paymentMethod === 'cash' && order.changeNeeded && order.changeFor && (
                        <span className="text-green-400">Troco: {formatCurrency(order.changeFor - order.total)}</span>
                      )}
                    </div>
                    <span className="shrink-0 font-semibold text-white text-sm">{formatCurrency(order.total)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-border px-3.5 py-3 md:px-4 md:flex md:flex-wrap md:gap-1.5">
                  {order.status === 'waitingPayment' && (
                    <Button onClick={() => confirmPayment(order.id)} className="bg-green-600 hover:bg-green-700 text-xs h-10 md:h-8 col-span-2 md:col-span-1">
                      <CheckCircle size={14} />
                      Confirmar Pagamento
                    </Button>
                  )}
                  {order.status !== 'waitingPayment' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <>
                      {order.status !== 'received' && (
                        <Button variant="ghost" onClick={() => backStatus(order.id)} className="text-xs h-10 md:h-8 order-2 md:order-none">
                          <ArrowLeft size={14} />
                          Voltar
                        </Button>
                      )}
                      <Button onClick={() => advanceStatus(order.id)} className="text-xs h-10 md:h-8 col-span-2 md:col-span-1 order-1 md:order-none">
                        <ChefHat size={14} />
                        Avançar
                      </Button>
                    </>
                  )}
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <Button variant="ghost" onClick={() => cancelOrder(order.id)} className="text-xs h-10 md:h-8">
                      <XCircle size={14} />
                      Cancelar
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setWhatsappModal({ phone: order.customerPhone, name: order.customerName, message: `Olá ${order.customerName}!` })} className="text-xs h-10 md:h-8 text-green-500 hover:text-green-400 hover:bg-green-500/10">
                    <MessageSquare size={14} />
                    Falar
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {whatsappModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setWhatsappModal(null)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 md:p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base md:text-lg font-semibold text-white">
                <MessageSquare size={18} className="text-green-500" />
                WhatsApp
              </h3>
              <button onClick={() => setWhatsappModal(null)} className="text-muted hover:text-white transition-colors">
                <XCircle size={18} />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted">Enviar mensagem para <span className="text-white font-medium">{whatsappModal.name}</span></p>
            <textarea className="mb-4 w-full rounded-lg border border-border bg-surface-hover px-3 py-2.5 text-sm text-white" rows={4} value={whatsappModal.message} onChange={(e) => setWhatsappModal({ ...whatsappModal, message: e.target.value })} />
            <div className="flex gap-2 flex-col sm:flex-row">
              <Button className="flex-1 text-sm h-10" onClick={() => { window.open(`https://wa.me/${whatsappModal.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappModal.message)}`, '_blank'); setWhatsappModal(null) }}>
                <MessageSquare size={16} />
                Enviar via WhatsApp
              </Button>
              <Button variant="ghost" className="text-sm h-10" onClick={() => setWhatsappModal(null)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
