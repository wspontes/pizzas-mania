import { useEffect, type DependencyList } from 'react'

const MAX_RETRY_DELAY = 30000
const RESYNC_AFTER_HIDDEN_MS = 5000

type Unsubscribe = () => void

interface SyncHandlers {
  /** Repasse este callback como handler de erro do onSnapshot. */
  onError: (err: unknown) => void
  /** Chame quando um snapshot chegar com sucesso (reseta o backoff). */
  onHealthy: () => void
}

/**
 * Mantém uma assinatura do Firestore sempre viva:
 * - Reconecta automaticamente com backoff exponencial se o listener falhar
 *   (WebSocket morto após aba em segundo plano, queda de rede etc.)
 * - Recria a assinatura quando o usuário volta para a aba (visibilitychange)
 *   ou quando a conexão volta (evento online), garantindo estado fresco.
 *
 * O `attach` deve criar o onSnapshot repassando os handlers recebidos e
 * retornar a função de unsubscribe.
 */
export function useFirestoreSync(attach: (h: SyncHandlers) => Unsubscribe, deps: DependencyList) {
  useEffect(() => {
    let stopped = false
    let unsub: Unsubscribe | null = null
    let attempt = 0
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let hiddenAt = 0

    const teardown = () => {
      if (retryTimer) { clearTimeout(retryTimer); retryTimer = null }
      if (unsub) {
        try { unsub() } catch { /* listener já encerrado */ }
        unsub = null
      }
    }

    const start = () => {
      if (stopped) return
      unsub = attach({
        onError: () => {
          if (stopped) return
          teardown()
          const delay = Math.min(MAX_RETRY_DELAY, 1000 * 2 ** attempt)
          attempt += 1
          retryTimer = setTimeout(start, delay)
        },
        onHealthy: () => { attempt = 0 },
      })
    }

    const restart = () => {
      if (stopped) return
      teardown()
      attempt = 0
      start()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
        return
      }
      if (!hiddenAt) return
      const wasHiddenFor = Date.now() - hiddenAt
      hiddenAt = 0
      if (wasHiddenFor >= RESYNC_AFTER_HIDDEN_MS) restart()
    }

    const onOnline = () => {
      if (document.visibilityState === 'visible') restart()
    }

    start()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', onOnline)

    return () => {
      stopped = true
      teardown()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onOnline)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
