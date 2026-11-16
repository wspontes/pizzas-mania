import { useEffect, useRef } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useFirestoreSync } from '@/hooks'
import { ensurePushToken, onForegroundPush } from '@/services/fcm'
import type { Order } from '@/types'

const STAFF_ROLES = ['admin', 'manager', 'attendant', 'kitchen']

/**
 * Contexto de audio unico e reaproveitado.
 *
 * O navegador so libera audio depois de uma interacao do usuario, e um
 * contexto recem-criado nasce suspenso. Num notebook largado no balcao da
 * pizzaria ninguem clica na tela, entao criar um contexto a cada bip
 * deixaria o alerta mudo. Com um contexto so, ele e destravado na
 * primeira interacao e continua valendo.
 */
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    if (!audioCtx || audioCtx.state === 'closed') audioCtx = new Ctx()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    return audioCtx
  } catch {
    return null
  }
}

function beep(times = 3) {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
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

  // Destrava o audio na primeira interacao e ao voltar para a aba: sem isso
  // o bip do notebook largado no balcao sai mudo.
  useEffect(() => {
    const warm = () => { getAudioContext() }
    const onVisible = () => {
      if (document.visibilityState === 'visible') getAudioContext()
    }
    window.addEventListener('pointerdown', warm)
    window.addEventListener('keydown', warm)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('pointerdown', warm)
      window.removeEventListener('keydown', warm)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

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

  // Vigia com reconexao automatica: se a internet da pizzaria oscilar ou o
  // notebook dormir, a assinatura volta sozinha. Pedidos que chegaram
  // durante a queda ainda sao detectados, porque a comparacao e feita
  // contra o ultimo conjunto conhecido de ids.
  useFirestoreSync(({ onError, onHealthy }) => {
    if (!isStaff) return () => {}
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snapshot) => {
      onHealthy()
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
    }, (err) => onError(err))
  }, [isStaff, showToast])

  return null
}
