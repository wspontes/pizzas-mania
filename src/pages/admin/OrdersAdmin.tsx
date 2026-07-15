import { useState, useEffect } from 'react'
import { ChefHat, XCircle, MessageCircle, X, ArrowLeft, MessageSquare, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui'
import { ordersService } from '@/services'
import type { Order } from '@/types'
import { formatCurrency, formatTime } from '@/utils'

const statusConfig: Record<string, { label: string; color: string }> = {
  waitingPayment: { label: 'Aguardando Pagamento', color: 'bg-yellow-500/10 text-yellow-400' },
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
    await ordersService.update(orderId, { status: nextStatus, paymentStatus: nextStatus === 'received' ? 'paid' : undefined } as Partial<Order>)
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

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

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
        <h1 className="text-2xl font-bold text-white">Pedidos</h1>
        <p className="text-sm text-muted">{orders.length} pedidos no total</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setFilter('all')} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filter === 'all' ? 'bg-accent text-white' : 'bg-surface text-muted hover:text-white border border-border'}`}>
          Todos ({orders.length})
        </button>
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <button key={key} onClick={() => setFilter(key)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filter === key ? 'bg-accent text-white' : 'bg-surface text-muted hover:text-white border border-border'}`}>
            {cfg.label} ({orders.filter((o) => o.status === key).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="text-lg text-muted">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const status = statusConfig[order.status] || statusConfig.waitingPayment
            return (
              <div key={order.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white">{order.customerName}</span>
                    <span className="text-xs text-muted break-all">#{order.id.slice(0, 8)}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-muted">
                  {order.items.map((item, idx) => (
                    <p key={idx}>{item.quantity}x {item.productName}</p>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3 flex-wrap gap-2">
                  <div className="flex gap-3 text-xs text-muted">
                    <span>{formatTime(new Date(order.createdAt))}</span>
                    <span>{order.paymentMethod === 'pix' ? 'PIX' : order.paymentMethod === 'credit' ? 'Cartão' : order.paymentMethod === 'cash' ? 'Dinheiro' : 'Entrega'}</span>
                  </div>
                  <span className="font-semibold text-white">{formatCurrency(order.total)}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                  {order.status === 'waitingPayment' && (
                    <Button size="sm" onClick={() => confirmPayment(order.id)} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle size={14} />
                      Confirmar Pagamento
                    </Button>
                  )}
                  {order.status !== 'waitingPayment' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <>
                      {order.status !== 'received' && (
                        <Button size="sm" variant="ghost" onClick={() => backStatus(order.id)}>
                          <ArrowLeft size={14} />
                          Voltar
                        </Button>
                      )}
                      <Button size="sm" onClick={() => advanceStatus(order.id)}>
                        <ChefHat size={14} />
                        Avançar
                      </Button>
                    </>
                  )}
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <Button size="sm" variant="ghost" onClick={() => cancelOrder(order.id)}>
                      <XCircle size={14} />
                      Cancelar
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setWhatsappModal({ phone: order.customerPhone, name: order.customerName, message: `Olá ${order.customerName}!` })} className="text-green-500 hover:text-green-400 hover:bg-green-500/10 ml-auto">
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
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <MessageCircle size={20} className="text-green-500" />
                WhatsApp
              </h3>
              <button onClick={() => setWhatsappModal(null)} className="text-muted hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted">Enviar mensagem para <span className="text-white font-medium">{whatsappModal.name}</span></p>
            <textarea className="mb-4 w-full rounded-lg border border-border bg-surface-hover px-3 py-2.5 text-sm text-white" rows={4} value={whatsappModal.message} onChange={(e) => setWhatsappModal({ ...whatsappModal, message: e.target.value })} />
            <div className="flex gap-2 flex-col sm:flex-row">
              <Button className="flex-1" onClick={() => { window.open(`https://wa.me/${whatsappModal.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappModal.message)}`, '_blank'); setWhatsappModal(null) }}>
                <MessageCircle size={16} />
                Enviar via WhatsApp
              </Button>
              <Button variant="ghost" onClick={() => setWhatsappModal(null)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
