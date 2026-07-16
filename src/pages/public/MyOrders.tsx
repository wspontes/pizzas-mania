import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { ArrowLeft, ShoppingBag, Clock, CheckCircle, Bike, ChefHat, QrCode, LogIn, LogOut, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui'
import { useCustomer } from '@/contexts/CustomerContext'
import { useCart } from '@/contexts/CartContext'
import { formatCurrency } from '@/utils'
import { CustomerLoginModal } from '@/components/shared/CustomerLoginModal'
import type { Order } from '@/types'

const statusMap: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  waitingPayment: { label: 'Aguardando Pagamento', color: 'text-yellow-400', icon: QrCode },
  received: { label: 'Recebido', color: 'text-blue-400', icon: CheckCircle },
  accepted: { label: 'Aceito', color: 'text-green-400', icon: ChefHat },
  preparing: { label: 'Preparando', color: 'text-orange-400', icon: ChefHat },
  outForDelivery: { label: 'Saiu para entrega', color: 'text-purple-400', icon: Bike },
  delivered: { label: 'Entregue', color: 'text-green-400', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'text-red-400', icon: CheckCircle },
}

export default function MyOrders() {
  const { customer, isLoggedIn, logout } = useCustomer()
  const [showLogin, setShowLogin] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn || !customer) { setLoading(false); return }

    const phoneQuery = query(
      collection(db, 'orders'),
      where('customerPhone', '==', customer.phone),
    )

    const nameQuery = query(
      collection(db, 'orders'),
      where('customerName', '==', customer.name),
    )

    const allOrders = new Map<string, Order>()

    const unsub1 = onSnapshot(phoneQuery, (snap) => {
      snap.docs.forEach((d) => {
        allOrders.set(d.id, { id: d.id, ...d.data() } as Order)
      })
      setOrders([...allOrders.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      setLoading(false)
    })

    const unsub2 = onSnapshot(nameQuery, (snap) => {
      snap.docs.forEach((d) => {
        allOrders.set(d.id, { id: d.id, ...d.data() } as Order)
      })
      setOrders([...allOrders.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      setLoading(false)
    })

    return () => { unsub1(); unsub2() }
  }, [customer, isLoggedIn])

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface">
            <LogIn size={36} className="text-muted" />
          </div>
          <h1 className="text-2xl font-bold text-white">Faça login para ver seus pedidos</h1>
          <p className="mt-2 text-muted">Entre com seu WhatsApp para acompanhar seus pedidos.</p>
          <Button className="mt-6" onClick={() => setShowLogin(true)}>
            <LogIn size={16} />
            Entrar
          </Button>
          {showLogin && <CustomerLoginModal onClose={() => setShowLogin(false)} />}
        </div>
      </div>
    )
  }

  const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status))
  const pastOrders = orders.filter((o) => ['delivered', 'cancelled'].includes(o.status))

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/" className="text-muted transition-colors hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-white">Meus Pedidos</h1>
          <p className="text-xs md:text-sm text-muted">Olá, {customer?.name}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <ShoppingBag size={40} className="mx-auto mb-4 text-muted" />
          <p className="text-muted">Você ainda não fez nenhum pedido.</p>
          <Link to="/cardapio"><Button className="mt-4">Fazer pedido</Button></Link>
        </div>
      ) : (
        <div className="space-y-6">
          {activeOrders.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-accent">Pedido em Andamento</h2>
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <OrderItem key={order.id} order={order} />
                ))}
              </div>
            </div>
          )}
          {pastOrders.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-muted">Pedidos Anteriores</h2>
              <div className="space-y-3">
                {pastOrders.map((order) => (
                  <OrderItem key={order.id} order={order} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function OrderItem({ order }: { order: Order }) {
  const { addItem } = useCart()
  const navigate = useNavigate()
  const st = statusMap[order.status] || statusMap.received
  const Icon = st.icon
  const created = new Date(order.createdAt)
  const dateStr = created.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const timeStr = created.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const isCompleted = order.status === 'delivered' || order.status === 'cancelled'

  const reorder = () => {
    order.items.forEach((item) => {
      addItem({
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
      })
    })
    navigate('/carrinho')
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <span className={`flex items-center gap-1.5 text-xs font-medium ${st.color}`}>
          <Icon size={13} />
          {st.label}
        </span>
        <span className="text-xs text-muted">{dateStr} • {timeStr}</span>
      </div>
      <div className="space-y-0.5 mb-2">
        {order.items.map((item, i) => (
          <p key={i} className="text-sm text-muted">{item.quantity}x {item.productName}</p>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">#{order.id.slice(0, 8)}</span>
          {isCompleted && (
            <button
              onClick={reorder}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-accent transition-colors hover:bg-accent/10"
            >
              <RotateCcw size={11} />
              Pedir novamente
            </button>
          )}
        </div>
        <span className="text-sm font-semibold text-white">{formatCurrency(order.total)}</span>
      </div>
    </div>
  )
}
