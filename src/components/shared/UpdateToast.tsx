import { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'

/** Tempo de carencia antes de recarregar sozinho. */
const AUTO_UPDATE_MS = 45000

/** De quanto em quanto tempo forçar a checagem de versao do service worker. */
const CHECK_INTERVAL_MS = 15 * 60 * 1000

export function UpdateToast() {
  const [show, setShow] = useState(false)
  const checkTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const applyUpdate = useCallback(() => {
    if (!('serviceWorker' in navigator)) {
      window.location.reload()
      return
    }
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' })
      } else {
        // Ja foi atualizado: recarrega para pegar os arquivos novos.
        window.location.reload()
      }
    })
  }, [])

  useEffect(() => {
    let refreshing = false

    const onControllerChange = () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

      navigator.serviceWorker.ready.then((reg) => {
        // A versao nova pode ter terminado de instalar antes deste
        // componente montar. Sem esta checagem o evento 'updatefound' ja
        // passou e a equipe ficava na versao antiga sem nenhum aviso.
        if (reg.waiting && navigator.serviceWorker.controller) {
          setShow(true)
        }

        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing
          if (!newSW) return
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              setShow(true)
            }
          })
        })

        // O navegador so checa versao nova do service worker ao navegar ou
        // uma vez por dia. O notebook da pizzaria fica aberto o dia inteiro,
        // entao forcamos a checagem de tempos em tempos.
        checkTimer.current = setInterval(() => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(() => {})
          }
        }, CHECK_INTERVAL_MS)
      })
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      }
      if (checkTimer.current) {
        clearInterval(checkTimer.current)
        checkTimer.current = null
      }
    }
  }, [])

  /**
   * Atualiza sozinho depois de um tempo. Depender de alguem clicar no
   * aviso deixa a equipe rodando codigo antigo ate o proximo
   * recarregamento da pagina.
   */
  useEffect(() => {
    if (!show) return
    const timer = setTimeout(applyUpdate, AUTO_UPDATE_MS)
    return () => clearTimeout(timer)
  }, [show, applyUpdate])

  if (!show) return null

  const handleUpdate = () => {
    applyUpdate()
    setShow(false)
  }

  return (
    <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-[fadeIn_0.3s_ease-out] md:bottom-6">
      <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-surface px-4 py-3 shadow-xl">
        <RefreshCw size={16} className="text-accent shrink-0" />
        <span className="text-sm text-white whitespace-nowrap">Nova versão disponível</span>
        <Button size="sm" onClick={handleUpdate} className="ml-1 h-7 text-xs">
          Atualizar
        </Button>
      </div>
    </div>
  )
}
