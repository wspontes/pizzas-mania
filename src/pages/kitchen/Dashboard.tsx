import { useState, useEffect } from 'react'
import { Clock, ChefHat, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui'

type OrderStatus = 'received' | 'accepted' | 'preparing' | 'ready' | 'cancelled'

interface KitchenOrder {
  id: string
  customer: string
  items: { name: string; quantity: number; notes?: string }[]
  total: number
  status: OrderStatus
  receivedAt: Date
  notes?: string
}

const mockOrders: KitchenOrder[] = [
  {
    id: '#001',
    customer: 'João Silva',
    items: [
      { name: 'Pizza Margherita Grande', quantity: 1, notes: 'Sem cebola' },
      { name: 'Coca-Cola 2L', quantity: 2 },
    ],
    total: 89.90,
    status: 'received',
    receivedAt: new Date(Date.now() - 2 * 60000),
  },
  {
    id: '#002',
    customer: 'Maria Santos',
    items: [
      { name: 'Pizza Calabresa Média', quantity: 1 },
      { name: 'Suco de Laranja', quantity: 1 },
    ],
    total: 55.00,
    status: 'received',
    receivedAt: new Date(Date.now() - 15 * 60000),
  },
  {
    id: '#003',
    customer: 'Pedro Alves',
    items: [
      { name: 'Pizza Portuguesa Grande', quantity: 1 },
      { name: 'Pizza Frango Média', quantity: 1 },
      { name: 'Guaraná 2L', quantity: 2 },
    ],
    total: 127.50,
    status: 'preparing',
    receivedAt: new Date(Date.now() - 25 * 60000),
  },
]

const statusFlow: OrderStatus[] = ['received', 'accepted', 'preparing', 'ready']

function getTimeSince(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return 'Agora'
  return `${minutes} min`
}

function isDelayed(date: Date, threshold = 20): boolean {
  return Date.now() - date.getTime() > threshold * 60000
}

export default function KitchenDashboard() {
  const [orders, setOrders] = useState(mockOrders)
  const [audioAlert, setAudioAlert] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setOrders((prev) => [...prev])
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  const advanceStatus = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order
        const currentIndex = statusFlow.indexOf(order.status)
        if (currentIndex >= statusFlow.length - 1 || currentIndex === -1) return order
        return { ...order, status: statusFlow[currentIndex + 1] }
      })
    )
  }

  const cancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' as const } : o))
    )
  }

  const activeOrders = orders.filter((o) => o.status !== 'ready' && o.status !== 'cancelled')
  const readyOrders = orders.filter((o) => o.status === 'ready')

  const statusLabel: Record<OrderStatus, string> = {
    received: 'Recebido',
    accepted: 'Aceito',
    preparing: 'Preparando',
    ready: 'Pronto',
    cancelled: 'Cancelado',
  }

  const statusColor: Record<OrderStatus, string> = {
    received: 'border-blue-500',
    accepted: 'border-green-500',
    preparing: 'border-orange-500',
    ready: 'border-green-500',
    cancelled: 'border-red-500',
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pedidos</h1>
          <p className="text-sm text-muted">{activeOrders.length} pedidos ativos</p>
        </div>
        <div className="flex gap-2">
          {audioAlert && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAudioAlert(false)}
            >
              <AlertTriangle size={14} className="text-yellow-400" />
              Silenciar alerta
            </Button>
          )}
          <div className="rounded-lg bg-surface px-3 py-2 text-sm text-muted">
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {activeOrders.length === 0 && readyOrders.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <ChefHat size={48} className="mx-auto mb-4 text-muted" />
          <p className="text-lg text-muted">Nenhum pedido no momento</p>
          <p className="text-sm text-muted">Aguardando novos pedidos...</p>
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeOrders.map((order) => {
              const delayed = isDelayed(order.receivedAt)
              return (
                <div
                  key={order.id}
                  className={`rounded-xl border-l-4 bg-surface p-5 transition-all ${
                    statusColor[order.status]
                  } ${delayed ? 'ring-2 ring-red-500/30' : ''}`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{order.customer}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <span>{order.id}</span>
                        <span>•</span>
                        <Clock size={14} />
                        <span className={delayed ? 'text-red-400 font-medium' : ''}>
                          {getTimeSince(order.receivedAt)}
                        </span>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      order.status === 'preparing'
                        ? 'bg-orange-500/20 text-orange-400'
                        : order.status === 'accepted'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {statusLabel[order.status]}
                    </span>
                  </div>

                  <div className="mb-4 space-y-1.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-white">
                          {item.quantity}x {item.name}
                        </span>
                      </div>
                    ))}
                    {order.notes && (
                      <p className="text-xs text-yellow-400 mt-2">
                        Obs: {order.notes}
                      </p>
                    )}
                    {order.items.some((i) => i.notes) && (
                      <div className="mt-2 space-y-0.5">
                        {order.items.filter((i) => i.notes).map((item, idx) => (
                          <p key={idx} className="text-xs text-yellow-400">
                            {item.name}: {item.notes}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {order.status !== 'ready' && (
                      <Button
                        size="lg"
                        className="flex-1 text-base"
                        onClick={() => advanceStatus(order.id)}
                      >
                        <ChefHat size={18} />
                        {order.status === 'received' ? 'Aceitar' :
                         order.status === 'accepted' ? 'Iniciar Preparo' :
                         'Finalizar'}
                      </Button>
                    )}
                    {(order.status === 'received' || order.status === 'accepted') && (
                      <Button
                        size="lg"
                        variant="ghost"
                        onClick={() => cancelOrder(order.id)}
                      >
                        <XCircle size={18} />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {readyOrders.length > 0 && (
            <>
              <h2 className="mb-4 text-lg font-bold text-green-400">
                Prontos para Entrega ({readyOrders.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {readyOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-green-500/30 bg-surface p-5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-white">{order.customer}</h3>
                      <CheckCircle size={20} className="text-green-400" />
                    </div>
                    <p className="text-sm text-muted">{order.id}</p>
                    <div className="mt-3 space-y-1">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-white">
                          {item.quantity}x {item.name}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
