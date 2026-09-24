import { useEffect, useRef } from 'react'
import { itemKey, useCart } from '@/contexts/CartContext'
import { useToast } from '@/contexts/ToastContext'
import { productsService } from '@/services'
import type { Product } from '@/types'

function effectivePrice(p: Product): number {
  return p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price
}

/**
 * Ao abrir carrinho/checkout, confere os preços com o cardápio atual.
 * Atualiza valores alterados e remove itens desativados,
 * para o cliente nunca finalizar com preço antigo.
 */
export function useCartPriceSync() {
  const { state, syncPrices } = useCart()
  const { showToast } = useToast()
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current || state.items.length === 0) return
    didRun.current = true
    ;(async () => {
      try {
        const products = await productsService.getAll()
        if (products.length === 0) return
        const byId = new Map(products.map((p) => [p.id, p]))
        const prices: Record<string, number> = {}
        const removeKeys: string[] = []
        let changed = false
        for (const item of state.items) {
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
        syncPrices(prices, removeKeys)
        showToast(
          removeKeys.length > 0 ? 'Cardápio atualizado: alguns itens saíram e foram removidos.' : 'Preços atualizados conforme o cardápio atual.',
          'success'
        )
      } catch {
        // Sem conexão: mantém o carrinho como está
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
