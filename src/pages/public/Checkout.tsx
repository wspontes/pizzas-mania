import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, CreditCard, Banknote, QrCode, Bike, MapPin, User, AlertTriangle } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useCart } from '@/contexts/CartContext'
import { useSettings } from '@/hooks'
import { ordersService } from '@/services'
import { formatCurrency } from '@/utils'

const paymentIcons = {
  pix: QrCode,
  credit: CreditCard,
  debit: CreditCard,
  cash: Banknote,
  delivery: Bike,
} as const

const paymentDescriptions: Record<string, string> = {
  pix: 'Pagamento via QR Code',
  credit: 'Pagamento com cartão de crédito',
  debit: 'Pagamento com cartão de débito',
  cash: 'Pague com dinheiro',
  delivery: 'Pague ao receber',
}

export default function Checkout() {
  const navigate = useNavigate()
  const { state, subtotal, total, clearCart } = useCart()
  const { settings } = useSettings()
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    whatsappDigits: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'São Paulo',
    reference: '',
  })

  if (state.items.length === 0 && !submitted) {
    navigate('/carrinho', { replace: true })
    return null
  }

  const minOrder = settings?.minOrder ?? 25
  const belowMin = subtotal > 0 && subtotal < minOrder
  const pm = settings?.paymentMethods

  const availableMethods = [
    pm?.pix?.enabled && { id: 'pix', label: 'PIX', desc: pm.pix.key ? `Chave: ${pm.pix.key}` : paymentDescriptions.pix } as const,
    pm?.credit?.enabled && { id: 'credit', label: 'Cartão de Crédito', desc: `Parcelamos em até ${pm.credit?.installments || 12}x` } as const,
    pm?.debit?.enabled && { id: 'debit', label: 'Cartão de Débito', desc: paymentDescriptions.debit } as const,
    pm?.cash?.enabled && { id: 'cash', label: 'Dinheiro', desc: paymentDescriptions.cash } as const,
    pm?.delivery?.enabled && { id: 'delivery', label: 'Pagar na Entrega', desc: paymentDescriptions.delivery } as const,
  ].filter(Boolean) as { id: string; label: string; desc: string }[]

  if (availableMethods.length === 0) {
    availableMethods.push(
      { id: 'pix', label: 'PIX', desc: paymentDescriptions.pix },
      { id: 'credit', label: 'Cartão de Crédito', desc: 'Parcelamos em até 12x' },
      { id: 'debit', label: 'Cartão de Débito', desc: paymentDescriptions.debit },
      { id: 'cash', label: 'Dinheiro', desc: paymentDescriptions.cash },
      { id: 'delivery', label: 'Pagar na Entrega', desc: paymentDescriptions.delivery },
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!paymentMethod) { setError('Selecione uma forma de pagamento'); return }
    setSubmitting(true)

    setSubmitted(true)
    try {
      const orderData = {
        customerName: form.name,
        customerPhone: '+55' + form.whatsappDigits,
        deliveryAddress: {
          street: form.street,
          number: form.number,
          complement: form.complement || '',
          neighborhood: form.neighborhood,
          city: form.city,
          reference: form.reference || '',
        },
        items: state.items,
        subtotal,
        deliveryFee: state.deliveryFee,
        discount: state.couponDiscount,
        total,
        paymentMethod: paymentMethod as 'pix' | 'credit' | 'debit' | 'cash' | 'delivery',
        paymentStatus: 'pending' as const,
        status: 'received' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const firestoreData: Record<string, unknown> = { ...orderData }
      if (state.couponCode) firestoreData.couponCode = state.couponCode

      const saved = await ordersService.create(firestoreData)
      clearCart()
      navigate('/pedido/confirmacao', { state: { order: { ...orderData, couponCode: state.couponCode, id: saved.id } } })
    } catch (err) {
      console.error('Erro ao criar pedido:', err)
      setError(err instanceof Error ? err.message : 'Erro ao finalizar pedido. Tente novamente.')
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/carrinho" className="text-muted transition-colors hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">Finalizar Pedido</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <User size={18} className="text-accent" />
                Seus Dados
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Nome completo" name="name" placeholder="Seu nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <Input label="WhatsApp" name="whatsapp" placeholder="11999999999" value={form.whatsappDigits} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setForm({ ...form, whatsappDigits: v }) }} required />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <MapPin size={18} className="text-accent" />
                Endereço de Entrega
              </h2>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <Input label="Rua" name="street" placeholder="Nome da rua" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required />
                  </div>
                  <Input label="Número" name="number" placeholder="N°" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input label="Complemento" name="complement" placeholder="Apto, Bloco..." value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} />
                  <Input label="Bairro" name="neighborhood" placeholder="Seu bairro" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} required />
                  <Input label="Cidade" name="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                </div>
                <Input label="Ponto de referência" name="reference" placeholder="Próximo a..." value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Banknote size={18} className="text-accent" />
                Forma de Pagamento
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {availableMethods.length === 0 ? (
                  <p className="text-sm text-muted col-span-2">Nenhuma forma de pagamento disponível</p>
                ) : (
                  availableMethods.map((method) => {
                    const Icon = paymentIcons[method.id as keyof typeof paymentIcons]
                    const selected = paymentMethod === method.id
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                          selected ? 'border-accent bg-accent/10' : 'border-border bg-surface-hover hover:border-accent/50'
                        }`}
                      >
                        <Icon size={24} className={selected ? 'text-accent' : 'text-muted'} />
                        <div>
                          <p className={`text-sm font-medium ${selected ? 'text-white' : 'text-muted'}`}>{method.label}</p>
                          <p className="text-xs text-muted">{method.desc}</p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="mb-3 font-semibold text-white">Resumo do Pedido</h3>
              <div className="mb-3 max-h-48 space-y-2 overflow-y-auto scrollbar-thin">
                {state.items.map((item) => (
                  <div key={`${item.productId}-${item.size}`} className="flex justify-between text-sm">
                    <span className="text-muted truncate mr-2">{item.quantity}x {item.productName}</span>
                    <span className="text-white shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-border pt-3 text-sm">
                <div className="flex justify-between text-muted"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {state.couponDiscount > 0 && <div className="flex justify-between text-green-400"><span>Desconto</span><span>-{formatCurrency(state.couponDiscount)}</span></div>}
                <div className="flex justify-between text-muted"><span>Entrega</span><span>{formatCurrency(state.deliveryFee)}</span></div>
                <div className="flex justify-between font-semibold text-white text-base pt-2 border-t border-border"><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {belowMin && (
              <div className="flex items-start gap-2 rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-400">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>Pedido mínimo de {formatCurrency(minOrder)}. Adicione mais {formatCurrency(minOrder - subtotal)} em produtos.</span>
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={belowMin || !paymentMethod || !form.name || form.whatsappDigits.length < 10 || !form.street || !form.number || !form.neighborhood} loading={submitting}>
              {submitting ? 'Finalizando...' : `Confirmar Pedido - ${formatCurrency(total)}`}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
