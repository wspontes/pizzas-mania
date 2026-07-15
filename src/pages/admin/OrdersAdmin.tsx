import { useState } from 'react'
import { Clock, ChefHat, Bike, CheckCircle, XCircle, Eye } from 'lucide-react'
import { Button } from '@/components/ui'

const statusConfig = {
  received: { label: 'Recebido', color: 'bg-blue-500/10 text-blue-400' },
  analyzing: { label: 'Em análise', color: 'bg-yellow-500/10 text-yellow-400' },
  accepted: { label: 'Aceito', color: 'bg-green-500/10 text-green-400' },
  preparing: { label: 'Preparando', color: 'bg-orange-500/10 text-orange-400' },
  outForDelivery: { label: 'Saiu para entrega', color: 'bg-purple-500/10 text-purple-400' },
  delivered: { label: 'Entregue', color: 'bg-green-500/10 text-green-400' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/10 text-red-400' },
} as const

type OrderStatus = keyof typeof statusConfig

interface Order {
  id: string
  customer: string
  items: number
  total: number
  status: OrderStatus
  time: string
  payment: string
}

const mockOrders: Order[] = [
  { id: '#001', customer: 'João Silva', items: 2, total: 89.90, status: 'preparing', time: '10 min', payment: 'PIX' },
  { id: '#002', customer: 'Maria Santos', items: 1, total: 45.00, status: 'received', time: '2 min', payment: 'Dinheiro' },
  { id: '#003', customer: 'Pedro Alves', items: 3, total: 127.50, status: 'outForDelivery', time: '15 min', payment: 'Cartão' },
  { id: '#004', customer: 'Ana Costa', items: 2, total: 68.00, status: 'delivered', time: '42 min', payment: 'PIX' },
  { id: '#005', customer: 'Carlos Lima', items: 1, total: 39.90, status: 'cancelled', time: '20 min', payment: 'Cartão' },
]

const statuses: OrderStatus[] = ['received', 'analyzing', 'accepted', 'preparing', 'outForDelivery', 'delivered']

export default function OrdersAdmin() {
  const [orders, setOrders] = useState(mockOrders)
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  const advanceStatus = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order
        const currentIndex = statuses.indexOf(order.status)
        if (currentIndex >= statuses.length - 1) return order
        return { ...order, status: statuses[currentIndex + 1] }
      })
    )
  }

  const cancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' as const } : o))
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Pedidos</h1>
        <p className="text-sm text-muted">Gerencie os pedidos do dia</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(['all', ...statuses] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === s
                ? 'bg-accent text-white'
                : 'bg-surface text-muted hover:text-white border border-border'
            }`}
          >
            {s === 'all' ? 'Todos' : statusConfig[s].label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((order) => {
          const status = statusConfig[order.status]
          return (
            <div key={order.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white">{order.customer}</span>
                  <span className="text-xs text-muted">{order.id}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-4 text-muted">
                  <span>{order.items} itens</span>
                  <span>{order.payment}</span>
                  <span>Há {order.time}</span>
                </div>
                <span className="font-medium text-white">R$ {order.total.toFixed(2)}</span>
              </div>
              <div className="mt-3 flex gap-2 border-t border-border pt-3">
                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <Button size="sm" onClick={() => advanceStatus(order.id)}>
                    <ChefHat size={14} />
                    Avançar
                  </Button>
                )}
                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <Button size="sm" variant="ghost" onClick={() => cancelOrder(order.id)}>
                    <XCircle size={14} />
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-muted">Nenhum pedido encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}
