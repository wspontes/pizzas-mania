import { useState } from 'react'
import { Printer, Copy, Check, XCircle } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import type { Order } from '@/types'
import { buildKitchenText, buildDeliveryText, buildBothRawBtUrl, printBothViaRawBt } from '@/utils'

interface Props {
  order: Order | null
  initialMotoboy?: string
  onClose: () => void
}

type Tab = 'both' | 'kitchen' | 'delivery'

export function PrintOrderModal({ order, initialMotoboy = '', onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const [motoboy, setMotoboy] = useState(initialMotoboy)
  const [tab, setTab] = useState<Tab>('both')

  if (!order) return null

  const kitchen = buildKitchenText(order)
  const delivery = buildDeliveryText(order, 'Pizzas Mania', motoboy)
  const text = tab === 'kitchen' ? kitchen : tab === 'delivery' ? delivery : `${kitchen}${delivery}`
  const rawBtUrl = buildBothRawBtUrl(order, 'Pizzas Mania', motoboy)

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <Printer size={18} className="text-accent" />
            Imprimir #{order.id.slice(0, 8)}
          </h3>
          <button onClick={onClose} className="text-muted transition-colors hover:text-white">
            <XCircle size={18} />
          </button>
        </div>

        <div className="mb-3 flex gap-2">
          {(['both', 'kitchen', 'delivery'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                tab === t ? 'bg-accent text-white' : 'bg-surface-hover text-muted hover:text-white'
              }`}
            >
              {t === 'both' ? 'Os 2' : t === 'kitchen' ? 'Cozinha' : 'Entrega'}
            </button>
          ))}
        </div>

        {order.deliveryType !== 'pickup' && (
          <div className="mb-3">
            <Input placeholder="Motoboy (opcional)" value={motoboy} onChange={(e) => setMotoboy(e.target.value)} />
          </div>
        )}

        <pre className="mb-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-black p-3 font-mono text-xs leading-5 text-white">
          {text}
        </pre>

        <div className="flex flex-col gap-2">
          <Button onClick={() => printBothViaRawBt(order, 'Pizzas Mania', motoboy)} className="w-full text-sm">
            <Printer size={16} />
            Abrir no RawBT e imprimir
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyText} className="flex-1 text-sm">
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Copiado!' : 'Copiar texto'}
            </Button>
            <Button variant="ghost" onClick={() => window.print()} className="flex-1 text-sm">
              Via navegador
            </Button>
          </div>
          <p className="mt-1 text-[10px] text-muted">
            Sem impressora? Confira o preview acima. Com impressora pareada no RawBT, use o primeiro botão. Os 2 cupons saem em sequência — rasgar no meio.
          </p>
        </div>
      </div>
    </div>
  )
}
