import { useState } from 'react'
import { Clock, MapPin, DollarSign, Plus } from 'lucide-react'
import { Button, Input } from '@/components/ui'

interface BusinessHour {
  day: string
  open: string
  close: string
  closed: boolean
}

interface Neighborhood {
  name: string
  fee: number
  estimatedTime: number
  active: boolean
}

export default function Settings() {
  const [hours, setHours] = useState<BusinessHour[]>([
    { day: 'Segunda-feira', open: '18:00', close: '23:00', closed: false },
    { day: 'Terça-feira', open: '18:00', close: '23:00', closed: false },
    { day: 'Quarta-feira', open: '18:00', close: '23:00', closed: false },
    { day: 'Quinta-feira', open: '18:00', close: '23:00', closed: false },
    { day: 'Sexta-feira', open: '18:00', close: '00:00', closed: false },
    { day: 'Sábado', open: '18:00', close: '00:00', closed: false },
    { day: 'Domingo', open: '18:00', close: '22:00', closed: false },
  ])

  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([
    { name: 'Centro', fee: 5.00, estimatedTime: 25, active: true },
    { name: 'Jardim América', fee: 8.00, estimatedTime: 35, active: true },
    { name: 'Vila Nova', fee: 10.00, estimatedTime: 40, active: true },
  ])

  const [newNeighborhood, setNewNeighborhood] = useState('')
  const [newFee, setNewFee] = useState('')
  const [newTime, setNewTime] = useState('')
  const [minOrder, setMinOrder] = useState('25.00')
  const [freeDelivery, setFreeDelivery] = useState('80.00')

  const toggleDay = (index: number) => {
    setHours((prev) => prev.map((d, i) => i === index ? { ...d, closed: !d.closed } : d))
  }

  const addNeighborhood = () => {
    if (!newNeighborhood.trim() || !newFee || !newTime) return
    setNeighborhoods((prev) => [
      ...prev,
      { name: newNeighborhood, fee: Number(newFee), estimatedTime: Number(newTime), active: true },
    ])
    setNewNeighborhood('')
    setNewFee('')
    setNewTime('')
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
            <Clock size={18} className="text-accent" />
            Horários de Funcionamento
          </h2>
          <div className="space-y-2">
            {hours.map((day, index) => (
              <div key={day.day} className="flex items-center gap-3">
                <span className="w-36 text-sm text-white">{day.day}</span>
                {day.closed ? (
                  <span className="text-sm text-red-400 font-medium">Fechado</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={day.open}
                      onChange={(e) => setHours((prev) => prev.map((d, i) => i === index ? { ...d, open: e.target.value } : d))}
                      className="rounded-lg border border-border bg-surface-hover px-3 py-1.5 text-sm text-white"
                    />
                    <span className="text-muted">às</span>
                    <input
                      type="time"
                      value={day.close}
                      onChange={(e) => setHours((prev) => prev.map((d, i) => i === index ? { ...d, close: e.target.value } : d))}
                      className="rounded-lg border border-border bg-surface-hover px-3 py-1.5 text-sm text-white"
                    />
                  </div>
                )}
                <button
                  onClick={() => toggleDay(index)}
                  className={`ml-auto rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    day.closed
                      ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  }`}
                >
                  {day.closed ? 'Abrir' : 'Fechar'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <DollarSign size={18} className="text-accent" />
            Valores
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Pedido mínimo"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
            />
            <Input
              label="Frete grátis acima de"
              value={freeDelivery}
              onChange={(e) => setFreeDelivery(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <MapPin size={18} className="text-accent" />
            Bairros Atendidos
          </h2>
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            <Input
              placeholder="Bairro"
              value={newNeighborhood}
              onChange={(e) => setNewNeighborhood(e.target.value)}
            />
            <Input
              placeholder="Taxa R$"
              type="number"
              value={newFee}
              onChange={(e) => setNewFee(e.target.value)}
            />
            <Input
              placeholder="Tempo (min)"
              type="number"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
            <Button onClick={addNeighborhood}>
              <Plus size={16} />
              Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {neighborhoods.map((n, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg bg-surface-hover px-4 py-2.5">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-white font-medium">{n.name}</span>
                  <span className="text-muted">R$ {n.fee.toFixed(2)}</span>
                  <span className="text-muted">~{n.estimatedTime} min</span>
                </div>
                <button
                  onClick={() => removeNeighborhood(index)}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button>Salvar Configurações</Button>
        </div>
      </div>
    </div>
  )
}
