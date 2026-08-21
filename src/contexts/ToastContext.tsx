import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import { Check, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui'
import { router } from '@/routes'

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'cart', detail?: string) => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'cart'; detail?: string } | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'cart' = 'success', detail?: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ message, type, detail })
    timerRef.current = setTimeout(() => setToast(null), type === 'cart' ? 3000 : 2000)
  }, [])

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast(null)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {toast?.type === 'cart' ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-simple" onClick={dismiss}>
          <div className="w-full max-w-xs rounded-2xl border border-border bg-surface p-6 text-center shadow-2xl animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 animate-check-pop">
              <Check size={34} strokeWidth={3} className="text-green-400" />
            </div>
            <h3 className="text-base font-bold text-white">{toast.message}</h3>
            {toast.detail && <p className="mt-1 truncate text-sm text-muted">{toast.detail}</p>}
            <div className="mt-5 flex flex-col gap-2">
              <Button className="h-10" onClick={() => { dismiss(); router.navigate('/carrinho') }}>
                <ShoppingCart size={16} />
                Ver Carrinho
              </Button>
              <Button variant="ghost" className="h-9 text-sm" onClick={dismiss}>
                Continuar comprando
              </Button>
            </div>
          </div>
        </div>
      ) : toast ? (
        <div className={`fixed left-1/2 top-4 z-[100] -translate-x-1/2 animate-fade-in rounded-lg px-6 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.message}
        </div>
      ) : null}
      {children}
    </ToastContext.Provider>
  )
}
