import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { CheckCircle, Clock, Bike, ChefHat, ShoppingBag, QrCode, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui'
import { formatCurrency } from '@/utils'

const allSteps = [
  { key: 'waitingPayment', icon: QrCode, label: 'Aguardando pagamento' },
  { key: 'received', icon: CheckCircle, label: 'Pedido recebido' },
  { key: 'analyzing', icon: ChefHat, label: 'Em análise' },
  { key: 'accepted', icon: ChefHat, label: 'Aceito' },
  { key: 'preparing', icon: ChefHat, label: 'Preparando' },
  { key: 'outForDelivery', icon: Bike, label: 'Saiu para entrega' },
  { key: 'delivered', icon: Clock, label: 'Entregue' },
]

const doneStatuses = ['received', 'analyzing', 'accepted', 'preparing', 'outForDelivery', 'delivered']

const stepOrder = ['waitingPayment', 'received', 'analyzing', 'accepted', 'preparing', 'outForDelivery', 'delivered']

export default function OrderConfirmed() {
  const location = useLocation()
  const initialOrder = (location.state as { order?: Record<string, unknown> })?.order
  const [order, setOrder] = useState<Record<string, unknown> | null>(initialOrder || null)

  useEffect(() => {
    if (!order?.id) return
    const unsub = onSnapshot(doc(db, 'orders', order.id as string), (snap) => {
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() })
      }
    })
    return () => unsub()
  }, [initialOrder?.id])

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag size={48} className="mx-auto mb-4 text-muted" />
        <p className="text-muted">Nenhum pedido encontrado.</p>
        <Link to="/cardapio"><Button className="mt-4">Fazer um pedido</Button></Link>
      </div>
    )
  }

  const isPix = (order.paymentMethod as string) === 'pix'
  const currentStatus = (order.status as string) || (isPix ? 'waitingPayment' : 'received')
  const currentIdx = stepOrder.indexOf(currentStatus)
  const isPaidOrNotPix = !isPix || currentStatus !== 'waitingPayment'

  const visibleSteps = isPix ? allSteps : allSteps.filter((s) => s.key !== 'waitingPayment')

  const statusLabel = currentStatus === 'waitingPayment' ? 'Aguardando pagamento'
    : currentStatus === 'received' ? 'Recebido'
    : currentStatus === 'analyzing' ? 'Em análise'
    : currentStatus === 'accepted' ? 'Aceito'
    : currentStatus === 'preparing' ? 'Preparando'
    : currentStatus === 'outForDelivery' ? 'Saiu para entrega'
    : currentStatus === 'delivered' ? 'Entregue'
    : currentStatus === 'cancelled' ? 'Cancelado' : ''

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mx-auto max-w-lg text-center">
        <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${isPaidOrNotPix ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
          {isPaidOrNotPix ? <CheckCircle size={48} className="text-green-500" /> : <QrCode size={48} className="text-yellow-500" />}
        </div>

        <h1 className="text-xl md:text-2xl font-bold text-white">
          {currentStatus === 'waitingPayment' ? 'Pedido Registrado!' : 'Pedido Confirmado!'}
        </h1>
        <p className="mt-2 text-sm md:text-base text-muted">
          {currentStatus === 'waitingPayment'
            ? 'Seu pedido foi registrado e será processado após a confirmação do pagamento.'
            : 'Em breve entraremos em contato com mais detalhes do seu pedido.'}
        </p>

        {currentStatus === 'waitingPayment' && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-400 text-left">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>Pendente de pagamento. O pedido entra em produção assim que o pagamento for confirmado.</span>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-border bg-surface p-4 md:p-6 text-left">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs md:text-sm text-muted">Status do pedido</span>
            <span className={`text-xs font-medium ${currentStatus === 'waitingPayment' ? 'text-yellow-400' : currentStatus === 'cancelled' ? 'text-red-400' : 'text-green-400'}`}>
              {statusLabel}
            </span>
          </div>
          <div className="space-y-4">
            {visibleSteps.map((step) => {
              const stepIdx = stepOrder.indexOf(step.key)
              const done = stepIdx <= currentIdx && currentStatus !== 'waitingPayment'
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${done ? 'bg-green-500/20 text-green-500' : 'bg-surface-hover text-muted'}`}>
                    <step.icon size={16} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${done ? 'text-green-400 font-medium' : 'text-muted'}`}>{step.label}</p>
                  </div>
                  {done && <CheckCircle size={16} className="text-green-500 shrink-0" />}
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-3 font-semibold text-white text-sm">Detalhes do Pedido</h3>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between text-muted"><span>Cliente</span><span className="text-white">{order.customerName as string}</span></p>
            <p className="flex justify-between text-muted"><span>Total</span><span className="text-accent font-semibold">{formatCurrency(order.total as number)}</span></p>
            <p className="flex justify-between text-muted"><span>Pagamento</span><span className="text-white capitalize">
              {(order.paymentMethod as string) === 'pix' ? 'PIX' :
               (order.paymentMethod as string) === 'credit' ? 'Cartão de Crédito' :
               (order.paymentMethod as string) === 'debit' ? 'Cartão de Débito' :
               (order.paymentMethod as string) === 'cash' ? 'Dinheiro' : 'Pagar na Entrega'}
            </span></p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link to="/cardapio"><Button variant="primary" className="w-full">Fazer novo pedido</Button></Link>
          <Link to="/"><Button variant="ghost" className="w-full">Voltar ao início</Button></Link>
        </div>
      </div>
    </div>
  )
}
