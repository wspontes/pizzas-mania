import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { Product } from '@/types'

interface UseProductsResult {
  products: Product[]
  loading: boolean
  error: string | null
}

function useLiveProducts(filter: (all: Product[]) => Product[], deps: unknown[]): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'products'), where('active', '==', true))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product)
        setProducts(filter(all))
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
        setLoading(false)
      }
    )
    return () => unsub()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { products, loading, error }
}

export function useProducts(categoryId?: string): UseProductsResult {
  return useLiveProducts(
    (all) => {
      const filtered = categoryId ? all.filter((p) => p.categoryId === categoryId) : all
      return filtered.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name))
    },
    [categoryId]
  )
}

export function useFeaturedProducts(): UseProductsResult {
  return useLiveProducts((all) => all.filter((p) => p.featured).slice(0, 8), [])
}
