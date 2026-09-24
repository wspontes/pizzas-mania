import { useEffect, useRef } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { itemKey, useCart } from '@/contexts/CartContext'
import { useToast } from '@/contexts/ToastContext'
import type { Product } from '@/types'

function effectivePrice(p: Product): number {
  return p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price
}

/**
 * Mantém o carrinho sincronizado com o cardápio em tempo real.
 * Preço alterado ou produto desativado reflete na hora,
 * mesmo com a página aberta — com aviso ao cliente.
 */
export function useCartPriceSync() {
  const { state, syncPrices } = useCart()
  const { showToast } = useToast()
  const itemsRef = useRef(state.items)
  itemsRef.current = state.items
  const syncRef = useRef(syncPrices)
  syncRef.current = syncPrices
  const toastRef = useRef(showToast)
  toastRef.current = showToast

  useEffect(() => {
    if (itemsRef.current.length === 0) return
    const unsub = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product)
        if (products.length === 0) return
        const byId = new Map(products.map((p) => [p.id, p]))
        const prices: Record<string, number> = {}
        const removeKeys: string[] = []
        let changed = false
        for (const item of itemsRef.current) {
          const prod = byId.get(item.productId)
          if (!prod || prod.active === false) {
            removeKeys.push(itemKey(item))
            changed = true
            continue
          }
          const current = effectivePrice(prod)
          prices[itemKey(item)] = current
          if (item.price !== current) changed = true
        }
        if (!changed && removeKeys.length === 0) return
        syncRef.current(prices, removeKeys)
        toastRef.current(
          removeKeys.length > 0
            ? 'Cardápio atualizado: alguns itens saíram e foram removidos.'
            : 'Preços atualizados conforme o cardápio atual.',
          'success'
        )
      },
      () => {
        // Sem conexão: mantém o carrinho como está
      }
    )
    return () => unsub()
  }, [])
}
