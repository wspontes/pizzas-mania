import { useState } from 'react'
import { ShoppingBag, DollarSign, Users, TrendingUp, Clock, Receipt } from 'lucide-react'

const stats = [
  { label: 'Pedidos Hoje', value: '12', icon: ShoppingBag, change: '+3', changeType: 'positive' as const },
  { label: 'Faturamento Hoje', value: 'R$ 587,00', icon: DollarSign, change: '+22%', changeType: 'positive' as const },
  { label: 'Ticket Médio', value: 'R$ 48,90', icon: TrendingUp, change: '+5%', changeType: 'positive' as const },
  { label: 'Pedidos no Mês', value: '284', icon: Receipt, change: '+18%', changeType: 'positive' as const },
  { label: 'Clientes', value: '156', icon: Users, change: '+12%', changeType: 'positive' as const },
  { label: 'Tempo Médio', value: '28 min', icon: Clock, change: '-2 min', changeType: 'positive' as const },
]

const recentOrders = [
  { id: '#001', customer: 'João Silva', items: 2, total: 89.90, status: 'Preparando', time: '5 min' },
  { id: '#002', customer: 'Maria Santos', items: 1, total: 45.00, status: 'Recebido', time: '2 min' },
  { id: '#003', customer: 'Pedro Alves', items: 3, total: 127.50, status: 'Saiu para entrega', time: '15 min' },
  { id: '#004', customer: 'Ana Costa', items: 2, total: 68.00, status: 'Entregue', time: '42 min' },
]

export default function Dashboard() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-muted">Visão geral do seu negócio</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon size={20} />
                </div>
                <span className={`text-xs font-medium ${
                  stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stat.change}
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-muted">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold text-white">Pedidos Recentes</h2>
        </div>
        <div className="divide-y divide-border">
          {recentOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{order.customer}</p>
                  <p className="text-xs text-muted">{order.id} • {order.items} itens</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">R$ {order.total.toFixed(2)}</p>
                <p className="text-xs text-muted">{order.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
