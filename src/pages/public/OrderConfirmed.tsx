import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { CheckCircle, Clock, Bike, ChefHat, ShoppingBag, QrCode, AlertTriangle, Copy, Bell } from 'lucide-react'
import { Button } from '@/components/ui'
import { useSettings } from '@/hooks'
import { formatCurrency } from '@/utils'

const allSteps = [
  { key: 'waitingPayment', icon: QrCode, label: 'Aguardando pagamento' },
  { key: 'received', icon: CheckCircle, label: 'Pedido recebido' },
  { key: 'preparing', icon: ChefHat, label: 'Preparando' },
  { key: 'outForDelivery', icon: Bike, label: 'Saiu para entrega' },
  { key: 'delivered', icon: Clock, label: 'Entregue' },
]

const stepOrder = ['waitingPayment', 'received', 'preparing', 'outForDelivery', 'delivered']

function playStatusBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 600
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  } catch { /* Audio not available */ }
}

export default function OrderConfirmed() {
  const location = useLocation()
  const { settings } = useSettings()
  const initialOrder = (location.state as { order?: Record<string, unknown> })?.order
  const [order, setOrder] = useState<Record<string, unknown> | null>(initialOrder || null)
  const [toast, setToast] = useState<string | null>(null)
  const prevStatus = useRef<string>((initialOrder?.status as string) || '')

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    playStatusBeep()
    setTimeout(() => setToast(null), 5000)
  }, [])

  useEffect(() => {
    if (!order?.id) return
    const unsub = onSnapshot(doc(db, 'orders', order.id as string), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Record<string, unknown>
        const newStatus = (data.status as string) || ''
        if (prevStatus.current && prevStatus.current !== newStatus) {
          const statusLabels: Record<string, string> = {
            received: 'Recebido',
            preparing: 'Saiu para produção',
            outForDelivery: 'Saiu para entrega',
            delivered: 'Entregue',
            cancelled: 'Cancelado',
          }
          showToast(statusLabels[newStatus] || newStatus)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Pizzas Mania', { body: `Seu pedido: ${statusLabels[newStatus] || newStatus}` })
          }
        }
        prevStatus.current = newStatus
        setOrder(data as Record<string, unknown>)
      }
    })
    return () => unsub()
  }, [initialOrder?.id, showToast])

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
    : currentStatus === 'preparing' ? 'Preparando'
    : currentStatus === 'outForDelivery' ? 'Saiu para entrega'
    : currentStatus === 'delivered' ? 'Entregue'
    : currentStatus === 'cancelled' ? 'Cancelado' : ''

  const paymentLabels: Record<string, string> = {
    pix: 'PIX', credit: 'Cartão de Crédito', debit: 'Cartão de Débito',
    cash: 'Dinheiro', delivery: 'Pagar na Entrega',
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 shadow-lg backdrop-blur-sm">
            <Bell size={16} className="text-accent shrink-0" />
            <span className="text-sm font-medium text-white">{toast}</span>
          </div>
        </div>
      )}

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

        {isPix && currentStatus === 'waitingPayment' && settings?.paymentMethods?.pix && (
          <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/5 p-4 text-left">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-400">
              <QrCode size={16} />
              Pagamento PIX
            </h4>
            {settings.paymentMethods.pix.qrCode && (
              <div className="mb-3 flex justify-center">
                <img
                  src={settings.paymentMethods.pix.qrCode}
                  alt="QR Code PIX"
                  className="h-48 w-48 rounded-xl border border-border object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            )}
            <p className="mb-2 text-xs text-muted">Faça o PIX para a chave abaixo:</p>
            <div className="flex items-center gap-2 rounded-lg bg-surface-hover px-3 py-2">
              <p className="flex-1 text-sm font-mono text-white select-all break-all">{settings?.paymentMethods?.pix?.key}</p>
              <button
                onClick={() => navigator.clipboard.writeText(settings?.paymentMethods?.pix?.key || '')}
                className="shrink-0 rounded-lg p-2 text-muted hover:bg-surface hover:text-white transition-colors"
                title="Copiar chave"
              >
                <Copy size={14} />
              </button>
            </div>
            <p className="mt-2 text-xs text-muted">O pedido será processado assim que o pagamento for confirmado.</p>
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
            <p className="flex justify-between text-muted"><span>Pagamento</span><span className="text-white">
              {paymentLabels[order.paymentMethod as string] || (order.paymentMethod as string)}
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
