import { useLocation, Link } from 'react-router-dom'
import { CheckCircle, Clock, Bike, ChefHat, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui'
import { formatCurrency } from '@/utils'

export default function OrderConfirmed() {
  const location = useLocation()
  const order = (location.state as { order?: Record<string, unknown> })?.order

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag size={48} className="mx-auto mb-4 text-muted" />
        <p className="text-muted">Nenhum pedido encontrado.</p>
        <Link to="/cardapio">
          <Button className="mt-4">Fazer um pedido</Button>
        </Link>
      </div>
    )
  }

  const steps = [
    { icon: CheckCircle, label: 'Pedido recebido', time: 'Agora', done: true },
    { icon: ChefHat, label: 'Preparando', time: '10-20 min', done: false },
    { icon: Bike, label: 'Saiu para entrega', time: '20-30 min', done: false },
    { icon: Clock, label: 'Entregue', time: '30-45 min', done: false },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle size={48} className="text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-white">Pedido Confirmado!</h1>
        <p className="mt-2 text-muted">
          Em breve entraremos em contato com mais detalhes do seu pedido.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-surface p-6 text-left">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-muted">Status do pedido</span>
            <span className="text-xs text-green-400">Em andamento</span>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  step.done ? 'bg-green-500/20 text-green-500' : 'bg-surface-hover text-muted'
                }`}>
                  <step.icon size={16} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${step.done ? 'text-white font-medium' : 'text-muted'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted">{step.time}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`ml-4 h-6 w-0.5 ${step.done ? 'bg-green-500/30' : 'bg-surface-hover'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-3 font-semibold text-white">Detalhes do Pedido</h3>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between text-muted">
              <span>Cliente</span>
              <span className="text-white">{order.customerName as string}</span>
            </p>
            <p className="flex justify-between text-muted">
              <span>Total</span>
              <span className="text-accent font-semibold">
                {formatCurrency(order.total as number)}
              </span>
            </p>
            <p className="flex justify-between text-muted">
              <span>Pagamento</span>
              <span className="text-white capitalize">
                {(order.paymentMethod as string) === 'pix' ? 'PIX' :
                 (order.paymentMethod as string) === 'credit' ? 'Cartão de Crédito' :
                 (order.paymentMethod as string) === 'debit' ? 'Cartão de Débito' :
                 (order.paymentMethod as string) === 'cash' ? 'Dinheiro' : 'Pagar na Entrega'}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link to="/cardapio">
            <Button variant="primary" className="w-full">
              Fazer novo pedido
            </Button>
          </Link>
          <Link to="/">
            <Button variant="ghost" className="w-full">
              Voltar ao início
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
