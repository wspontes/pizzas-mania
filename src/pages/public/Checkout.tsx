import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, CreditCard, Banknote, QrCode, Bike, MapPin, User, Phone } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useCart } from '@/contexts/CartContext'
import { formatCurrency } from '@/utils'

const paymentMethods = [
  { id: 'pix', label: 'PIX', icon: QrCode, description: 'Pagamento via QR Code' },
  { id: 'credit', label: 'Cartão de Crédito', icon: CreditCard, description: 'Parcelamos em até 12x' },
  { id: 'debit', label: 'Cartão de Débito', icon: CreditCard, description: 'Pagamento na hora' },
  { id: 'cash', label: 'Dinheiro', icon: Banknote, description: 'Troco disponível' },
  { id: 'delivery', label: 'Pagar na Entrega', icon: Bike, description: 'Pague ao receber' },
] as const

export default function Checkout() {
  const navigate = useNavigate()
  const { state, subtotal, total, setDeliveryFee } = useCart()
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'São Paulo',
    reference: '',
  })
  const [changeFor, setChangeFor] = useState('')

  if (state.items.length === 0) {
    navigate('/carrinho', { replace: true })
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentMethod) return

    setSubmitting(true)

    const orderData = {
      customerName: form.name,
      customerPhone: form.phone,
      deliveryAddress: {
        street: form.street,
        number: form.number,
        complement: form.complement,
        neighborhood: form.neighborhood,
        city: form.city,
        reference: form.reference,
      },
      items: state.items,
      subtotal,
      deliveryFee: state.deliveryFee,
      discount: state.couponDiscount,
      total,
      paymentMethod,
      paymentStatus: 'pending' as const,
      status: 'received' as const,
      couponCode: state.couponCode,
      changeFor: paymentMethod === 'cash' ? changeFor : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await new Promise((r) => setTimeout(r, 1500))
    setSubmitting(false)
    navigate('/pedido/confirmacao', { state: { order: orderData } })
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
                <Input
                  label="Nome completo"
                  name="name"
                  placeholder="Seu nome"
                  value={form.name}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="Telefone"
                  name="phone"
                  placeholder="(11) 99999-9999"
                  value={form.phone}
                  onChange={handleInputChange}
                  required
                />
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
                    <Input
                      label="Rua"
                      name="street"
                      placeholder="Nome da rua"
                      value={form.street}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <Input
                    label="Número"
                    name="number"
                    placeholder="N°"
                    value={form.number}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input
                    label="Complemento"
                    name="complement"
                    placeholder="Apto, Bloco..."
                    value={form.complement}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Bairro"
                    name="neighborhood"
                    placeholder="Seu bairro"
                    value={form.neighborhood}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    label="Cidade"
                    name="city"
                    value={form.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <Input
                  label="Ponto de referência"
                  name="reference"
                  placeholder="Próximo a..."
                  value={form.reference}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Banknote size={18} className="text-accent" />
                Forma de Pagamento
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon
                  const selected = paymentMethod === method.id
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                        selected
                          ? 'border-accent bg-accent/10'
                          : 'border-border bg-surface-hover hover:border-accent/50'
                      }`}
                    >
                      <Icon size={24} className={selected ? 'text-accent' : 'text-muted'} />
                      <div>
                        <p className={`text-sm font-medium ${selected ? 'text-white' : 'text-muted'}`}>
                          {method.label}
                        </p>
                        <p className="text-xs text-muted">{method.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              {paymentMethod === 'cash' && (
                <div className="mt-4">
                  <Input
                    label="Troco para quanto?"
                    name="changeFor"
                    placeholder="Ex: 100"
                    value={changeFor}
                    onChange={(e) => setChangeFor(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="mb-3 font-semibold text-white">Resumo do Pedido</h3>
              <div className="mb-3 max-h-48 space-y-2 overflow-y-auto scrollbar-thin">
                {state.items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-muted truncate mr-2">
                      {item.quantity}x {item.productName}
                    </span>
                    <span className="text-white shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-border pt-3 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {state.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Desconto</span>
                    <span>-{formatCurrency(state.couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted">
                  <span>Entrega</span>
                  <span>{formatCurrency(state.deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-semibold text-white text-base pt-2 border-t border-border">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!paymentMethod || !form.name || !form.phone || !form.street || !form.number || !form.neighborhood}
              loading={submitting}
            >
              {submitting ? 'Finalizando...' : `Confirmar Pedido - ${formatCurrency(total)}`}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
