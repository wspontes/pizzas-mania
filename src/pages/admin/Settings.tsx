import { useState, useEffect } from 'react'
import { Clock, MapPin, DollarSign, CreditCard, Image, Plus, QrCode, Phone, Trash2, Sparkles } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { settingsService, type BusinessSettings } from '@/services/settings'
import { resolveImageUrl } from '@/utils/resolveImageUrl'

export default function Settings() {
  const [saving, setSaving] = useState(false)
  const [hours, setHours] = useState([
    { day: 'Segunda-feira', open: '18:00', close: '23:00', closed: false },
    { day: 'Terça-feira', open: '18:00', close: '23:00', closed: false },
    { day: 'Quarta-feira', open: '18:00', close: '23:00', closed: false },
    { day: 'Quinta-feira', open: '18:00', close: '23:00', closed: false },
    { day: 'Sexta-feira', open: '18:00', close: '00:00', closed: false },
    { day: 'Sábado', open: '18:00', close: '00:00', closed: false },
    { day: 'Domingo', open: '18:00', close: '22:00', closed: false },
  ])

  const [neighborhoods, setNeighborhoods] = useState([
    { name: 'Centro', fee: 5.00, estimatedTime: 25, active: true },
  ])
  const [minOrder, setMinOrder] = useState('25.00')
  const [freeDelivery, setFreeDelivery] = useState('80.00')
  const [newNb, setNewNb] = useState({ name: '', fee: '', time: '' })
  const [pixKey, setPixKey] = useState('')
  const [pixQrCode, setPixQrCode] = useState('')
  const [acceptCredit, setAcceptCredit] = useState(true)
  const [acceptDebit, setAcceptDebit] = useState(true)
  const [acceptCash, setAcceptCash] = useState(true)
  const [acceptDelivery, setAcceptDelivery] = useState(true)
  const [installments, setInstallments] = useState('12')
  const [bannerTitle, setBannerTitle] = useState('A melhor pizza da cidade')
  const [bannerSubtitle, setBannerSubtitle] = useState('Massa artesanal, ingredientes frescos e o sabor que só a Pizzas Mania tem.')
  const [bannerImage, setBannerImage] = useState('')
  const [bannerActive, setBannerActive] = useState(true)
  const [bannerAlign, setBannerAlign] = useState<'left' | 'center' | 'right'>('left')
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')
  const [phone, setPhone] = useState('')
  const [bannerBenefits, setBannerBenefits] = useState(['Ingredientes selecionados', 'Pronto em até 30 min', 'Entrega gratuita*'])

  useEffect(() => {
    settingsService.get().then((data) => {
      if (data) {
        setMinOrder(String(data.minOrder || 25))
        setFreeDelivery(String(data.freeDeliveryFrom || 80))
        if (data.neighborhoods?.length) setNeighborhoods(data.neighborhoods)
        if (data.businessHours?.length) {
          const dayNames = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo']
          setHours(data.businessHours.map((h) => ({
            day: dayNames[h.dayOfWeek] || `Dia ${h.dayOfWeek}`,
            open: h.open,
            close: h.close,
            closed: h.closed,
          })))
        }
        if (data.paymentMethods) {
          const pm = data.paymentMethods
          if (pm.pix) { setPixKey(pm.pix.key || ''); setPixQrCode(pm.pix.qrCode || '') }
          if (pm.credit) { setAcceptCredit(pm.credit.enabled); setInstallments(String(pm.credit.installments || 12)) }
          if (pm.debit) setAcceptDebit(pm.debit.enabled)
          if (pm.cash) setAcceptCash(pm.cash.enabled)
          if (pm.delivery) setAcceptDelivery(pm.delivery.enabled)
        }
        if (data.banner) {
          setBannerTitle(data.banner.title || 'A melhor pizza da cidade')
          setBannerSubtitle(data.banner.subtitle || 'Massa artesanal, ingredientes frescos e o sabor que só a Pizzas Mania tem.')
          setBannerImage(data.banner.image || '')
          setBannerActive(data.banner.active ?? true)
          setBannerAlign(data.banner.align || 'left')
          if (data.banner.benefits?.length) setBannerBenefits(data.banner.benefits)
        }
        if (data.whatsapp) setWhatsapp(data.whatsapp)
        if (data.instagram) setInstagram(data.instagram)
        if (data.phone) setPhone(data.phone)
      }
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const data: BusinessSettings = {
      businessHours: hours.map((h, i) => ({
        dayOfWeek: i,
        open: h.open,
        close: h.close,
        closed: h.closed,
      })),
      minOrder: Number(minOrder),
      freeDeliveryFrom: Number(freeDelivery),
      neighborhoods,
      paymentMethods: {
        pix: { enabled: true, key: pixKey, qrCode: pixQrCode },
        credit: { enabled: acceptCredit, installments: Number(installments) },
        debit: { enabled: acceptDebit },
        cash: { enabled: acceptCash },
        delivery: { enabled: acceptDelivery },
      },
      banner: {
        title: bannerTitle,
        subtitle: bannerSubtitle,
        image: bannerImage,
        active: bannerActive,
        align: bannerAlign,
        benefits: bannerBenefits,
      },
      whatsapp,
      instagram,
      phone,
    }
    await settingsService.save(data)
    setSaving(false)
  }

  const toggleDay = (index: number) => {
    setHours((prev) => prev.map((d, i) => i === index ? { ...d, closed: !d.closed } : d))
  }

  const addNeighborhood = () => {
    if (!newNb.name.trim() || !newNb.fee || !newNb.time) return
    setNeighborhoods((prev) => [...prev, { name: newNb.name, fee: Number(newNb.fee), estimatedTime: Number(newNb.time), active: true }])
    setNewNb({ name: '', fee: '', time: '' })
  }

  const removeNeighborhood = (index: number) => {
    setNeighborhoods((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-sm text-muted">Gerencie as configurações da pizzaria</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Image size={18} className="text-accent" />
            Banner Principal
          </h2>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <Input label="Título" value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} />
                <Input label="Subtítulo" value={bannerSubtitle} onChange={(e) => setBannerSubtitle(e.target.value)} />
                <Input label="URL da imagem (opcional)" placeholder="Cole link do Google Drive ou URL" value={bannerImage} onChange={(e) => setBannerImage(e.target.value)} />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white">Alinhamento do texto</label>
                  <div className="flex gap-2">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => setBannerAlign(align)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                          bannerAlign === align ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface-hover text-muted hover:text-white'
                        }`}
                      >
                        {align === 'left' ? 'Esquerda' : align === 'center' ? 'Centro' : 'Direita'}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={bannerActive} onChange={(e) => setBannerActive(e.target.checked)} className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent" />
                  <span className="text-sm text-white">Banner ativo na página inicial</span>
                </label>
              </div>
              <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-accent/20 via-surface to-surface p-6 md:p-8 min-h-[180px] flex flex-col items-${bannerAlign === 'center' ? 'center' : bannerAlign === 'right' ? 'end' : 'start'} justify-center`}>
                {bannerActive && (
                  <div className="absolute right-0 top-0 h-40 w-40 translate-x-8 -translate-y-8 rounded-full bg-accent/10 blur-3xl" />
                )}
                {bannerImage && (
                  <img src={resolveImageUrl(bannerImage)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                )}
                <div className={`relative z-10 ${bannerAlign === 'center' ? '' : 'max-w-xs'}`}>
                  <p className="text-lg font-bold text-white">{bannerTitle || 'Título do banner'}</p>
                  <p className="text-sm text-muted mt-1">{bannerSubtitle || 'Subtítulo do banner'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Sparkles size={18} className="text-accent" />
            Textos do Banner (Benefícios)
          </h2>
          <p className="mb-3 text-xs text-muted">Textos que aparecem abaixo do banner na página inicial</p>
          <div className="space-y-3">
            {bannerBenefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={benefit}
                  onChange={(e) => {
                    const updated = [...bannerBenefits]
                    updated[i] = e.target.value
                    setBannerBenefits(updated)
                  }}
                  className="flex-1 rounded-lg border border-border bg-surface-hover px-3 py-2.5 text-sm text-white placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                  onClick={() => setBannerBenefits(bannerBenefits.filter((_, idx) => idx !== i))}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setBannerBenefits([...bannerBenefits, ''])}>
              <Plus size={14} />
              Adicionar texto
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <CreditCard size={18} className="text-accent" />
            Métodos de Pagamento
          </h2>
          <div className="space-y-4">
            <div className="space-y-3">
              <Input label="Chave PIX" placeholder="CNPJ, CPF, email ou telefone" value={pixKey} onChange={(e) => setPixKey(e.target.value)} />
              <Input label="URL do QR Code PIX (opcional)" placeholder="Cole link do Google Drive ou URL" value={pixQrCode} onChange={(e) => setPixQrCode(e.target.value)} icon={<QrCode size={16} />} />
              {pixQrCode && (
                <div className="flex justify-center">
                  <img src={resolveImageUrl(pixQrCode)} alt="QR Code PIX" className="h-32 w-32 rounded-xl border border-border object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-border bg-surface-hover p-3">
                <input type="checkbox" checked={acceptCredit} onChange={(e) => setAcceptCredit(e.target.checked)} className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent" />
                <span className="text-sm text-white">Cartão de Crédito</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-border bg-surface-hover p-3">
                <input type="checkbox" checked={acceptDebit} onChange={(e) => setAcceptDebit(e.target.checked)} className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent" />
                <span className="text-sm text-white">Cartão de Débito</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-border bg-surface-hover p-3">
                <input type="checkbox" checked={acceptCash} onChange={(e) => setAcceptCash(e.target.checked)} className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent" />
                <span className="text-sm text-white">Dinheiro</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-border bg-surface-hover p-3">
                <input type="checkbox" checked={acceptDelivery} onChange={(e) => setAcceptDelivery(e.target.checked)} className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent" />
                <span className="text-sm text-white">Pagar na Entrega</span>
              </label>
            </div>
            {acceptCredit && (
              <Input label="Parcelamento máximo" type="number" value={installments} onChange={(e) => setInstallments(e.target.value)} />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Clock size={18} className="text-accent" />
            Horários de Funcionamento
          </h2>
          <div className="space-y-2">
            {hours.map((day, index) => (
              <div key={day.day} className="flex flex-wrap items-center gap-2 md:gap-3">
                <span className="w-20 md:w-28 text-xs md:text-sm text-white shrink-0">{day.day}</span>
                {day.closed ? (
                  <span className="text-xs md:text-sm text-red-400 font-medium">Fechado</span>
                ) : (
                  <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0">
                    <input type="time" value={day.open} onChange={(e) => setHours((prev) => prev.map((d, i) => i === index ? { ...d, open: e.target.value } : d))} className="w-24 md:w-auto rounded-lg border border-border bg-surface-hover px-2 md:px-3 py-1.5 text-xs md:text-sm text-white" />
                    <span className="text-muted text-xs md:text-sm">às</span>
                    <input type="time" value={day.close} onChange={(e) => setHours((prev) => prev.map((d, i) => i === index ? { ...d, close: e.target.value } : d))} className="w-24 md:w-auto rounded-lg border border-border bg-surface-hover px-2 md:px-3 py-1.5 text-xs md:text-sm text-white" />
                  </div>
                )}
                <button onClick={() => toggleDay(index)} className={`ml-auto shrink-0 rounded-full px-2.5 md:px-3 py-1 text-[10px] md:text-xs font-medium transition-colors ${day.closed ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}>
                  {day.closed ? 'Abrir' : 'Fechar'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Phone size={18} className="text-accent" />
            Contato da Pizzaria
          </h2>
          <div className="space-y-4">
            <Input label="WhatsApp" placeholder="5511999999999" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))} />
            <Input label="Telefone" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="Instagram" placeholder="@pizzamania" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            <p className="text-xs text-muted">URL ou @ do Instagram que aparece no rodapé do site</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <DollarSign size={18} className="text-accent" />
            Valores
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Pedido mínimo (R$)" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
            <Input label="Frete grátis acima de (R$)" value={freeDelivery} onChange={(e) => setFreeDelivery(e.target.value)} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <MapPin size={18} className="text-accent" />
            Bairros Atendidos
          </h2>
          <div className="mb-4 grid gap-3 grid-cols-2 sm:grid-cols-4">
            <Input placeholder="Bairro" value={newNb.name} onChange={(e) => setNewNb({ ...newNb, name: e.target.value })} className="col-span-2 sm:col-span-1" />
            <Input placeholder="Taxa R$" type="number" value={newNb.fee} onChange={(e) => setNewNb({ ...newNb, fee: e.target.value })} />
            <Input placeholder="Tempo (min)" type="number" value={newNb.time} onChange={(e) => setNewNb({ ...newNb, time: e.target.value })} />
            <Button onClick={addNeighborhood} className="col-span-2 sm:col-span-1"><Plus size={16} />Adicionar</Button>
          </div>
          <div className="space-y-2">
            {neighborhoods.map((n, index) => (
              <div key={index} className="flex items-center justify-between gap-2 rounded-lg bg-surface-hover px-3 md:px-4 py-2.5">
                <span className="text-sm text-white font-medium truncate min-w-0">{n.name}</span>
                <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-muted shrink-0">
                  <span>R$ {n.fee.toFixed(2)}</span>
                  <span>~{n.estimatedTime}min</span>
                  <button onClick={() => removeNeighborhood(index)} className="text-red-400 hover:text-red-300 transition-colors text-xs">Remover</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>Salvar Configurações</Button>
        </div>
      </div>
    </div>
  )
}
