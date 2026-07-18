import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, CreditCard, Banknote, QrCode, MapPin, User, AlertTriangle, Coins, Hash } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useCart } from '@/contexts/CartContext'
import { useCustomer } from '@/contexts/CustomerContext'
import { useSettings } from '@/hooks'
import { ordersService, couponsService } from '@/services'
import { formatCurrency } from '@/utils'

const paymentIcons = {
  pix: QrCode,
  card: CreditCard,
  cash: Banknote,
} as const

const paymentDescriptions: Record<string, string> = {
  pix: 'Pagamento via QR Code',
  card: 'Pague com cartão na entrega',
  cash: 'Pague com dinheiro',
}

export default function Checkout() {
  const navigate = useNavigate()
  const { state, subtotal, total, clearCart, setDeliveryFee } = useCart()
  const { settings } = useSettings()
  const { customer, isLoggedIn, login } = useCustomer()
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [changeNeeded, setChangeNeeded] = useState(false)
  const [changeFor, setChangeFor] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: customer?.name || '',
    whatsappDigits: customer?.phone ? customer.phone.replace(/^\+?55/, '') : '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'São Paulo',
    reference: '',
  })
  const [cepLoading, setCepLoading] = useState(false)

  const handleCepLookup = async (cep: string) => {
    const clean = cep.replace(/\D/g, '')
    setForm((prev) => ({ ...prev, zipCode: cep }))
    if (clean.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
        }))
        const match = settings?.neighborhoods?.find((n) => n.name.toLowerCase() === (data.bairro || '').toLowerCase())
        if (match) {
          setDeliveryFee(match.fee)
        }
      }
    } catch { /* silent */ } finally {
      setCepLoading(false)
    }
  }

  if (state.items.length === 0 && !submitted) {
    navigate('/carrinho', { replace: true })
    return null
  }

  const pixKey = settings?.paymentMethods?.pix?.key
  const pm = settings?.paymentMethods

  const availableMethods = [
    pm?.pix?.enabled && { id: 'pix', label: 'PIX', desc: pm.pix.key ? `Chave: ${pm.pix.key}` : paymentDescriptions.pix } as const,
    pm?.credit?.enabled && { id: 'card', label: 'Cartão na Entrega', desc: paymentDescriptions.card } as const,
    pm?.cash?.enabled && { id: 'cash', label: 'Dinheiro', desc: paymentDescriptions.cash } as const,
  ].filter(Boolean) as { id: string; label: string; desc: string }[]

  if (availableMethods.length === 0) {
    availableMethods.push(
      { id: 'pix', label: 'PIX', desc: paymentDescriptions.pix },
      { id: 'card', label: 'Cartão na Entrega', desc: paymentDescriptions.card },
      { id: 'cash', label: 'Dinheiro', desc: paymentDescriptions.cash },
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
        paymentMethod: paymentMethod as 'pix' | 'card' | 'cash',
        paymentStatus: paymentMethod === 'pix' ? 'pending' as const : 'paid' as const,
        status: paymentMethod === 'pix' ? 'waitingPayment' as const : 'received' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const firestoreData: Record<string, unknown> = { ...orderData }
      if (paymentMethod === 'cash') {
        firestoreData.changeNeeded = changeNeeded
        if (changeNeeded && changeFor) firestoreData.changeFor = parseFloat(changeFor)
      }
      if (state.couponCode) firestoreData.couponCode = state.couponCode

      const saved = await ordersService.create(firestoreData)

      if (!isLoggedIn && form.name && form.whatsappDigits) {
        login(form.name, form.whatsappDigits)
      }

      if (state.couponCode) {
        try {
          const allCoupons = await couponsService.getAll()
          const coupon = allCoupons.find((c) => c.code === state.couponCode)
          if (coupon) {
            await couponsService.update(coupon.id, { usedCount: (coupon.usedCount || 0) + 1 })
          }
        } catch { /* silent */ }
      }

      clearCart()
      navigate('/pedido/confirmacao', { state: { order: { ...orderData, couponCode: state.couponCode, id: saved.id } } })
    } catch (err) {
      console.error('Erro ao criar pedido:', err)
      setError(err instanceof Error ? err.message : 'Erro ao finalizar pedido. Tente novamente.')
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/carrinho" className="text-muted transition-colors hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-white">Finalizar Pedido</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-border bg-surface p-4 md:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base md:text-lg font-semibold text-white">
                <User size={18} className="text-accent" />
                Seus Dados
              </h2>
              <div className="grid gap-4">
                <Input label="Nome completo" name="name" placeholder="Seu nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <Input label="WhatsApp" name="whatsapp" placeholder="11999999999" value={form.whatsappDigits} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setForm({ ...form, whatsappDigits: v }) }} required />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4 md:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base md:text-lg font-semibold text-white">
                <MapPin size={18} className="text-accent" />
                Endereço de Entrega
              </h2>
              <div className="space-y-4">
                <div className="relative">
                  <Input label="CEP" name="zipCode" placeholder="00000-000" value={form.zipCode} onChange={(e) => handleCepLookup(e.target.value)} icon={<Hash size={16} />} />
                  {cepLoading && <span className="absolute right-3 top-9 text-xs text-amber-400 animate-pulse">Buscando...</span>}
                </div>
                <div className="grid gap-4">
                  <Input label="Rua" name="street" placeholder="Nome da rua" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required />
                  <Input label="Número" name="number" placeholder="N°" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required />
                </div>
                <div className="grid gap-4">
                  <Input label="Complemento" name="complement" placeholder="Apto, Bloco..." value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} />
                  <Input label="Bairro" name="neighborhood" placeholder="Seu bairro" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} required />
                  <Input label="Cidade" name="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                </div>
                <Input label="Ponto de referência" name="reference" placeholder="Próximo a..." value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4 md:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base md:text-lg font-semibold text-white">
                <Banknote size={18} className="text-accent" />
                Forma de Pagamento
              </h2>
              <div className="grid gap-3">
                {availableMethods.length === 0 ? (
                  <p className="text-sm text-muted">Nenhuma forma de pagamento disponível</p>
                ) : (
                  availableMethods.map((method) => {
                    const Icon = paymentIcons[method.id as keyof typeof paymentIcons]
                    const selected = paymentMethod === method.id
                    return (
                      <button key={method.id} type="button" onClick={() => setPaymentMethod(method.id)} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${selected ? 'border-accent bg-accent/10' : 'border-border bg-surface-hover hover:border-accent/50'}`}>
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

              {paymentMethod === 'cash' && (
                <div className="mt-4 rounded-xl border border-border bg-surface-hover p-4">
                  <div className="flex items-center gap-3">
                    <Coins size={20} className="text-muted" />
                    <label className="flex cursor-pointer items-center gap-3">
                      <input type="checkbox" checked={changeNeeded} onChange={(e) => setChangeNeeded(e.target.checked)} className="h-4 w-4 accent-red-600" />
                      <span className="text-sm text-white">Vai precisar de troco?</span>
                    </label>
                  </div>
                  {changeNeeded && (
                    <div className="mt-3 ml-7">
                      <Input type="number" label="Troco para quanto?" placeholder="Ex: 100" value={changeFor} onChange={(e) => setChangeFor(e.target.value)} min={0} step="0.01" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="mb-3 font-semibold text-white text-sm">Resumo do Pedido</h3>
              <div className="mb-3 max-h-48 space-y-2 overflow-y-auto scrollbar-thin">
                {state.items.map((item) => (
                  <div key={`${item.productId}-${item.size}`} className="flex justify-between text-sm">
                    <span className="text-muted truncate mr-2">{item.quantity}x {item.productName}{item.border ? ` (${item.border})` : ''}</span>
                    <span className="text-white shrink-0">{formatCurrency((item.price + (item.borderPrice || 0)) * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-border pt-3 text-sm">
                <div className="flex justify-between text-muted"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {state.couponDiscount > 0 && <div className="flex justify-between text-green-400"><span>Desconto</span><span>-{formatCurrency(state.couponDiscount)}</span></div>}
                {state.deliveryFee > 0 && <div className="flex justify-between text-muted"><span>Entrega</span><span>{formatCurrency(state.deliveryFee)}</span></div>}
                <div className="flex justify-between font-semibold text-white pt-2 border-t border-border"><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>
            </div>

            {paymentMethod === 'pix' && pixKey && (
              <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-400"><QrCode size={16} />Pagamento PIX</h4>
                <p className="mb-2 text-xs text-muted">Após confirmar, faça o PIX para a chave abaixo:</p>
                <div className="rounded-lg bg-surface-hover px-3 py-2 text-center">
                  <p className="text-sm font-mono text-white select-all">{pixKey}</p>
                </div>
                <p className="mt-2 text-xs text-muted">Pedido processado após confirmação do pagamento.</p>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={!paymentMethod || !form.name || form.whatsappDigits.length < 10 || !form.street || !form.number || !form.neighborhood} loading={submitting}>
              {submitting ? 'Finalizando...' : `Confirmar Pedido - ${formatCurrency(total)}`}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
