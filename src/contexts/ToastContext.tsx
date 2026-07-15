import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface ToastContextType {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {toast && (
        <div className="fixed left-1/2 top-4 z-[100] -translate-x-1/2 animate-fade-in rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
      {children}
    </ToastContext.Provider>
  )
}
