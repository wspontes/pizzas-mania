import { useState, useEffect } from 'react'
import { Clock, MapPin, CreditCard, Image, Plus, Phone, Trash2, Sparkles, CircleDot } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { ImageUpload } from '@/components/shared'
import { settingsService, type BusinessSettings } from '@/services/settings'
import { resolveImageUrl } from '@/utils/resolveImageUrl'
import { formatCurrency } from '@/utils'

export default function Settings() {
  const [saving, setSaving] = useState(false)
  const [hours, setHours] = useState([
    { day: 'Domingo', open: '18:00', close: '22:00', closed: false },
    { day: 'Segunda-feira', open: '18:00', close: '23:00', closed: false },
    { day: 'Terça-feira', open: '18:00', close: '23:00', closed: false },
    { day: 'Quarta-feira', open: '18:00', close: '23:00', closed: false },
    { day: 'Quinta-feira', open: '18:00', close: '23:00', closed: false },
    { day: 'Sexta-feira', open: '18:00', close: '00:00', closed: false },
    { day: 'Sábado', open: '18:00', close: '00:00', closed: false },
  ])

  const [neighborhoods, setNeighborhoods] = useState<{ name: string; fee: number; estimatedTime: number; active: boolean }[]>([
    { name: 'Centro', fee: 5.00, estimatedTime: 25, active: true },
  ])
  const [newNb, setNewNb] = useState({ name: '', fee: '', time: '' })
  const [editingNb, setEditingNb] = useState<number | null>(null)
  const [editNb, setEditNb] = useState({ name: '', fee: '', time: '', active: true })
  const [nbCepLoading, setNbCepLoading] = useState(false)
  const [nbZipForLookup, setNbZipForLookup] = useState('')
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState('')
  const [pixKey, setPixKey] = useState('')
  const [pixQrCode, setPixQrCode] = useState('')
  const [acceptCard, setAcceptCard] = useState(true)
  const [acceptCash, setAcceptCash] = useState(true)
  const [bannerTitle, setBannerTitle] = useState('A melhor pizza da cidade')
  const [bannerSubtitle, setBannerSubtitle] = useState('Massa artesanal, ingredientes frescos e o sabor que só a Pizzas Mania tem.')
  const [bannerImage, setBannerImage] = useState('')
  const [bannerActive, setBannerActive] = useState(true)
  const [bannerAlign, setBannerAlign] = useState<'left' | 'center' | 'right'>('left')
  const [bannerOpacity, setBannerOpacity] = useState(20)
  const [bannerImagePos, setBannerImagePos] = useState<'left' | 'center' | 'right'>('center')
  const [bannerTextColor, setBannerTextColor] = useState('#ffffff')
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [businessHoursEnabled, setBusinessHoursEnabled] = useState(true)
  const [bannerBenefits, setBannerBenefits] = useState(['Ingredientes selecionados', 'Pronto em até 30 min', 'Entrega gratuita*'])
  const [crustOptions, setCrustOptions] = useState<{ name: string; price: number }[]>([])
  const [newCrust, setNewCrust] = useState({ name: '', price: '' })

  useEffect(() => {
    settingsService.get().then((data) => {
      if (data) {
        if (data.neighborhoods?.length) setNeighborhoods(data.neighborhoods)
        if (data.businessHours?.length) {
          const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
          setHours(data.businessHours.map((h) => ({
            day: dayNames[h.dayOfWeek] || `Dia ${h.dayOfWeek}`,
            open: h.open,
            close: h.close,
            closed: h.closed,
          })))
        }
        if (data.businessHoursEnabled !== undefined) setBusinessHoursEnabled(data.businessHoursEnabled)
        if (data.paymentMethods) {
          const pm = data.paymentMethods
          if (pm.pix) { setPixKey(pm.pix.key || ''); setPixQrCode(pm.pix.qrCode || '') }
          if (pm.credit) setAcceptCard(pm.credit.enabled)
          if (pm.cash) setAcceptCash(pm.cash.enabled)
        }
        if (data.banner) {
          setBannerTitle(data.banner.title || 'A melhor pizza da cidade')
          setBannerSubtitle(data.banner.subtitle || 'Massa artesanal, ingredientes frescos e o sabor que só a Pizzas Mania tem.')
          setBannerImage(data.banner.image || '')
          setBannerActive(data.banner.active ?? true)
          setBannerAlign(data.banner.align || 'left')
          setBannerOpacity(data.banner.opacity ?? 20)
          setBannerImagePos(data.banner.imagePosition || 'center')
          setBannerTextColor(data.banner.textColor || '#ffffff')
          if (data.banner.benefits?.length) setBannerBenefits(data.banner.benefits)
        }
        if (data.whatsapp) setWhatsapp(data.whatsapp)
        if (data.instagram) setInstagram(data.instagram)
        if (data.phone) setPhone(data.phone)
        if (data.address) setAddress(data.address)
        if (data.crustOptions?.length) setCrustOptions(data.crustOptions)
        if (data.defaultDeliveryFee !== undefined) setDefaultDeliveryFee(String(data.defaultDeliveryFee))
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
      businessHoursEnabled,
      neighborhoods,
      defaultDeliveryFee: defaultDeliveryFee !== '' ? Number(defaultDeliveryFee) : undefined,
      paymentMethods: {
        pix: { enabled: true, key: pixKey, qrCode: pixQrCode },
        credit: { enabled: acceptCard },
        cash: { enabled: acceptCash },
      },
      banner: {
        title: bannerTitle,
        subtitle: bannerSubtitle,
        image: bannerImage,
        active: bannerActive,
        align: bannerAlign,
        benefits: bannerBenefits,
        opacity: bannerOpacity,
        imagePosition: bannerImagePos,
        textColor: bannerTextColor,
      },
      crustOptions,
      whatsapp,
      instagram,
      phone,
      address,
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
    setNbZipForLookup('')
  }

  const startEditNb = (index: number) => {
    const n = neighborhoods[index]
    setEditNb({ name: n.name, fee: String(n.fee), time: String(n.estimatedTime), active: n.active })
    setEditingNb(index)
  }

  const saveEditNb = () => {
    if (editingNb === null) return
    setNeighborhoods((prev) => prev.map((n, i) => i === editingNb ? { ...n, name: editNb.name, fee: Number(editNb.fee), estimatedTime: Number(editNb.time), active: editNb.active } : n))
    setEditingNb(null)
  }

  const handleNbCepLookup = async (cep: string) => {
    const clean = cep.replace(/\D/g, '')
    setNbZipForLookup(cep)
    if (clean.length !== 8) return
    setNbCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await res.json()
      if (!data.erro && data.bairro) {
        setNewNb((prev) => ({ ...prev, name: data.bairro }))
      }
    } catch { /* silent */ } finally {
      setNbCepLoading(false)
    }
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
                <ImageUpload value={bannerImage} onChange={setBannerImage} label="Imagem do banner (opcional)" />
                <Input label="Ou cole uma URL" placeholder="Google Drive ou outro link" value={bannerImage.startsWith('data:') ? '' : bannerImage} onChange={(e) => setBannerImage(e.target.value)} />
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
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white">Cor do texto</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={bannerTextColor} onChange={(e) => setBannerTextColor(e.target.value)} className="h-9 w-9 cursor-pointer rounded-lg border border-border bg-transparent" />
                    <span className="text-xs text-muted">{bannerTextColor}</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white">Opacidade da imagem: {bannerOpacity}%</label>
                  <input type="range" min="5" max="60" value={bannerOpacity} onChange={(e) => setBannerOpacity(Number(e.target.value))} className="w-full accent-accent" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white">Posição da imagem</label>
                  <div className="flex gap-2">
                    {(['left', 'center', 'right'] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setBannerImagePos(pos)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                          bannerImagePos === pos ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface-hover text-muted hover:text-white'
                        }`}
                      >
                        {pos === 'left' ? 'Esquerda' : pos === 'center' ? 'Centro' : 'Direita'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-accent/20 via-surface to-surface p-6 md:p-8 min-h-[180px] flex flex-col items-${bannerAlign === 'center' ? 'center' : bannerAlign === 'right' ? 'end' : 'start'} justify-center`}>
                {bannerActive && (
                  <div className="absolute right-0 top-0 h-40 w-40 translate-x-8 -translate-y-8 rounded-full bg-accent/10 blur-3xl" />
                )}
                {bannerImage && (() => {
                  const maskGradient = bannerImagePos === 'left'
                    ? `linear-gradient(to right, black 0%, black ${bannerOpacity}%, transparent 100%)`
                    : bannerImagePos === 'right'
                      ? `linear-gradient(to left, black 0%, black ${bannerOpacity}%, transparent 100%)`
                      : `linear-gradient(to right, transparent 0%, black ${50 - bannerOpacity / 2}%, black ${50 + bannerOpacity / 2}%, transparent 100%)`
                  return (
                    <img
                      src={resolveImageUrl(bannerImage)}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{
                        WebkitMaskImage: maskGradient,
                        maskImage: maskGradient,
                      }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )
                })()}
                <div className={`relative z-10 ${bannerAlign === 'center' ? '' : 'max-w-xs'}`}>
                  <p className="text-lg font-bold" style={{ color: bannerTextColor, textShadow: bannerImage ? '0 1px 4px rgba(0,0,0,0.6)' : 'none' }}>{bannerTitle || 'Título do banner'}</p>
                  <p className="text-sm mt-1" style={{ color: bannerTextColor, opacity: 0.7, textShadow: bannerImage ? '0 1px 3px rgba(0,0,0,0.5)' : 'none' }}>{bannerSubtitle || 'Subtítulo do banner'}</p>
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
              <ImageUpload value={pixQrCode} onChange={setPixQrCode} label="QR Code PIX (opcional)" />
              <Input label="Ou cole uma URL" placeholder="Google Drive ou outro link" value={pixQrCode.startsWith('data:') ? '' : pixQrCode} onChange={(e) => setPixQrCode(e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-border bg-surface-hover p-3">
                <input type="checkbox" checked={acceptCard} onChange={(e) => setAcceptCard(e.target.checked)} className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent" />
                <span className="text-sm text-white">Cartão crédito/débito na entrega/retirada</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-border bg-surface-hover p-3">
                <input type="checkbox" checked={acceptCash} onChange={(e) => setAcceptCash(e.target.checked)} className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent" />
                <span className="text-sm text-white">Dinheiro</span>
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Clock size={18} className="text-accent" />
            Horários de Funcionamento
          </h2>
          <div className="flex items-center justify-between rounded-lg bg-surface-hover px-4 py-3 mb-4">
            <div>
              <p className="text-sm font-medium text-white">Restrição de horário</p>
              <p className="text-xs text-muted mt-0.5">{businessHoursEnabled ? 'Pedidos bloqueados fora do horário' : 'Pedidos aceitos em qualquer horário'}</p>
            </div>
            <button
              onClick={() => setBusinessHoursEnabled(!businessHoursEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${businessHoursEnabled ? 'bg-accent' : 'bg-surface-hover border border-border'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${businessHoursEnabled ? 'translate-x-5.5 mt-0.5 ml-0.5' : 'translate-x-0.5 mt-0.5 ml-0.5'}`} />
            </button>
          </div>
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
            <Input label="Endereço" placeholder="Rua, número - Bairro, Cidade" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <MapPin size={18} className="text-accent" />
            Bairros Atendidos
          </h2>
          <div className="mb-4 rounded-lg bg-surface-hover p-3">
            <Input label="Taxa padrão (bairros não cadastrados)" placeholder="R$ 0,00" type="number" step="0.50" value={defaultDeliveryFee} onChange={(e) => setDefaultDeliveryFee(e.target.value)} />
            <p className="mt-1 text-[11px] text-muted">Valor cobrado quando o bairro do cliente não está na lista acima</p>
          </div>
          <div className="mb-4 grid gap-3 grid-cols-2 sm:grid-cols-4">
            <Input placeholder="Bairro" value={newNb.name} onChange={(e) => setNewNb({ ...newNb, name: e.target.value })} className="col-span-2 sm:col-span-1" />
            <div className="relative">
              <Input placeholder="CEP (auto-preenche bairro)" value={nbZipForLookup} onChange={(e) => handleNbCepLookup(e.target.value)} />
              {nbCepLoading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-amber-400 animate-pulse">...</span>}
            </div>
            <Input placeholder="Taxa R$" type="number" value={newNb.fee} onChange={(e) => setNewNb({ ...newNb, fee: e.target.value })} />
            <Input placeholder="Tempo (min)" type="number" value={newNb.time} onChange={(e) => setNewNb({ ...newNb, time: e.target.value })} />
            <Button onClick={addNeighborhood} className="col-span-2 sm:col-span-1"><Plus size={16} />Adicionar</Button>
          </div>
          <div className="space-y-2">
            {neighborhoods.map((n, index) => (
              editingNb === index ? (
                <div key={index} className="rounded-lg bg-surface-hover border border-accent/30 p-3 space-y-2">
                  <input type="text" value={editNb.name} onChange={(e) => setEditNb({ ...editNb, name: e.target.value })} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white" placeholder="Bairro" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={editNb.fee} onChange={(e) => setEditNb({ ...editNb, fee: e.target.value })} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white" placeholder="Taxa R$" step="0.50" />
                    <input type="number" value={editNb.time} onChange={(e) => setEditNb({ ...editNb, time: e.target.value })} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white" placeholder="Tempo min" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditNb({ ...editNb, active: !editNb.active })} className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${editNb.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {editNb.active ? 'Ativo' : 'Inativo'}
                    </button>
                    <div className="ml-auto flex gap-2">
                      <button onClick={() => setEditingNb(null)} className="text-xs text-muted hover:text-white transition-colors px-2 py-1">Cancelar</button>
                      <button onClick={saveEditNb} className="text-xs text-accent hover:text-accent/80 font-medium transition-colors px-2 py-1">Salvar</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={index} className="flex items-center justify-between gap-2 rounded-lg bg-surface-hover px-3 md:px-4 py-2.5">
                  <div className="min-w-0">
                    <span className={`text-sm font-medium truncate block ${n.active ? 'text-white' : 'text-muted line-through'}`}>{n.name}</span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-muted shrink-0">
                    <span>R$ {n.fee.toFixed(2)}</span>
                    <span>~{n.estimatedTime}min</span>
                    <button onClick={() => startEditNb(index)} className="text-accent hover:text-accent/80 transition-colors text-xs">Editar</button>
                    <button onClick={() => removeNeighborhood(index)} className="text-red-400 hover:text-red-300 transition-colors text-xs">Remover</button>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <CircleDot size={18} className="text-accent" />
            Bordas da Pizza
          </h2>
          <p className="mb-3 text-xs text-muted">Opções de borda recheada que o cliente pode escolher ao pedir</p>
          <div className="space-y-3">
            {crustOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-surface-hover px-3 py-2.5">
                <span className="flex-1 text-sm text-white font-medium">{opt.name}</span>
                <span className="text-sm text-accent font-semibold">{formatCurrency(opt.price)}</span>
                <button onClick={() => setCrustOptions(crustOptions.filter((_, idx) => idx !== i))} className="ml-2 text-muted hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input placeholder="Nome da borda" value={newCrust.name} onChange={(e) => setNewCrust({ ...newCrust, name: e.target.value })} />
              <Input placeholder="Preço R$" type="number" step="0.01" value={newCrust.price} onChange={(e) => setNewCrust({ ...newCrust, price: e.target.value })} />
              <Button onClick={() => {
                if (!newCrust.name.trim() || !newCrust.price) return
                setCrustOptions([...crustOptions, { name: newCrust.name.trim(), price: Number(newCrust.price) }])
                setNewCrust({ name: '', price: '' })
              }}><Plus size={16} /></Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>Salvar Configurações</Button>
        </div>
      </div>
    </div>
  )
}
