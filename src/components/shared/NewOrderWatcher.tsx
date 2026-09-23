import { useEffect, useRef } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { ensurePushToken, onForegroundPush } from '@/services/fcm'
import type { Order } from '@/types'

const STAFF_ROLES = ['admin', 'manager', 'attendant', 'kitchen']

function beep(times = 3) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    for (let i = 0; i < times; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      osc.type = 'sine'
      const t = ctx.currentTime + i * 0.5
      gain.gain.setValueAtTime(0.3, t)
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4)
      osc.start(t)
      osc.stop(t + 0.4)
    }
  } catch {
    // Audio indisponível
  }
  try {
    navigator.vibrate?.([300, 100, 300, 100, 300])
  } catch {
    // Vibrar indisponível
  }
}

/**
 * Vigia global de novos pedidos para a equipe.
 * Funciona em qualquer menu do admin/cozinha com o app aberto.
 */
export function NewOrderWatcher() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const knownIds = useRef<Set<string> | null>(null)

  const isStaff = !!user && STAFF_ROLES.includes(user.role)

  useEffect(() => {
    if (!isStaff) return
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [isStaff])

  // Push na nuvem (FCM): cobre app em segundo plano e tela bloqueada.
  useEffect(() => {
    if (!isStaff || !user) return
    let cancel: (() => void) | undefined
    ;(async () => {
      if (!('Notification' in window)) return
      if (Notification.permission === 'default') {
        try {
          await Notification.requestPermission()
        } catch {
          return
        }
      }
      if (Notification.permission !== 'granted') return
      await ensurePushToken(user.id, user.role)
      cancel = await onForegroundPush((payload) => {
        // Com o app visível o snapshot já avisa; aqui cobre aba oculta.
        if (!document.hidden) return
        beep()
        const title = payload.notification?.title || 'Novo pedido — Pizzas Mania'
        const body = payload.notification?.body || 'Chegou um pedido novo!'
        try {
          new Notification(title, { body })
        } catch {
          // Notificação bloqueada
        }
      })
    })()
    return () => cancel?.()
  }, [isStaff, user])

  useEffect(() => {
    if (!isStaff) return
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
      const currentIds = new Set(data.map((o) => o.id))
      if (knownIds.current) {
        const fresh = data.filter((o) => !knownIds.current!.has(o.id))
        fresh.forEach((o) => {
          beep()
          showToast(`Novo pedido de ${o.customerName}!`, 'success')
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('Novo pedido — Pizzas Mania', { body: `${o.customerName} • ${o.items.length} ${o.items.length === 1 ? 'item' : 'itens'}` })
            } catch {
              // Notificação bloqueada
            }
          }
        })
      }
      knownIds.current = currentIds
    })
    return () => unsub()
  }, [isStaff, showToast])

  return null
}
