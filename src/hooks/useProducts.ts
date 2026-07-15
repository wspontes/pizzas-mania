import { useState, useEffect } from 'react'
import { productsService } from '@/services'
import type { Product } from '@/types'

interface UseProductsResult {
  products: Product[]
  loading: boolean
  error: string | null
}

export function useProducts(categoryId?: string): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetch() {
      try {
        setLoading(true)
        const data = categoryId
          ? await productsService.getByCategory(categoryId)
          : await productsService.getActiveProducts()
        if (mounted) {
          setProducts(data)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetch()
    return () => { mounted = false }
  }, [categoryId])

  return { products, loading, error }
}

export function useFeaturedProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetch() {
      try {
        setLoading(true)
        const data = await productsService.getFeatured()
        if (mounted) {
          setProducts(data)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetch()
    return () => { mounted = false }
  }, [])

  return { products, loading, error }
}
