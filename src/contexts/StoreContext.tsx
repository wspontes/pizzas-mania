import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { storesService } from '@/services'
import { setCurrentStoreId } from '@/services/storeContext'
import type { Store } from '@/types'

interface StoreContextValue {
  storeId: string
  storeSlug: string | null
  store: Store | null
  loading: boolean
}

const DEFAULT_STORE_ID = 'default'
const DEFAULT_STORE_SLUG = 'pizzas-mania'

const StoreContext = createContext<StoreContextValue | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const params = useParams<{ storeSlug?: string }>()
  const slug = params.storeSlug || null
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setCurrentStoreId(store?.id || DEFAULT_STORE_ID)
    let cancelled = false
    setLoading(true)
    const resolve = async () => {
      try {
        if (slug) {
          const found = await storesService.getBySlug(slug)
          if (!cancelled) setStore(found)
        } else {
          // default store: tenta slug default, senao null (usa default id)
          const found = await storesService.getBySlug(DEFAULT_STORE_SLUG)
          if (!cancelled) setStore(found)
        }
      } catch {
        if (!cancelled) setStore(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    resolve()
    return () => { cancelled = true }
  }, [slug])

  const storeId = store?.id || DEFAULT_STORE_ID

  useEffect(() => {
    setCurrentStoreId(storeId)
  }, [storeId])
  const storeSlug = store?.slug || slug || DEFAULT_STORE_SLUG

  return (
    <StoreContext.Provider value={{ storeId, storeSlug, store, loading }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}