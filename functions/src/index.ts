import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

initializeApp()

function money(value: unknown): string {
  return `R$ ${Number(value || 0)
    .toFixed(2)
    .replace('.', ',')}`
}

/**
 * A cada pedido criado, envia push de alta prioridade
 * para todos os aparelhos da equipe (coleção `fcmTokens`).
 * Chega mesmo com o app fechado ou a tela bloqueada.
 */
export const notifyNewOrder = onDocumentCreated('orders/{orderId}', async (event) => {
  const snap = event.data
  if (!snap) return
  const order = snap.data() as Record<string, unknown>
  const orderId = event.params.orderId as string

  const items = Array.isArray(order.items) ? (order.items as Array<{ quantity?: unknown }>) : []
  const count = items.reduce((n, i) => n + Number(i?.quantity || 0), 0)
  const title = `Novo pedido — ${(order.customerName as string) || 'Pizzas Mania'}`
  const body = `${count} ${count === 1 ? 'item' : 'itens'} • Total ${money(order.total)}`

  const db = getFirestore()
  const tokensSnap = await db.collection('fcmTokens').get()
  const tokens = tokensSnap.docs.map((d) => d.get('token')).filter((t): t is string => typeof t === 'string' && t.length > 0)
  if (tokens.length === 0) return

  const res = await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    webpush: {
      headers: { Urgency: 'high' },
      notification: {
        icon: '/icons.svg',
        badge: '/icons.svg',
        tag: `order-${orderId}`,
        renotify: true,
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300],
      },
      fcmOptions: { link: '/admin/pedidos' },
    },
    android: { priority: 'high' },
    data: { orderId, url: '/admin/pedidos' },
  })

  // Remove tokens inválidos/desregistrados para não acumular lixo
  const batch = db.batch()
  res.responses.forEach((r, i) => {
    const code = r.error?.code
    if (!r.success && (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token')) {
      batch.delete(db.collection('fcmTokens').doc(tokens[i]))
    }
  })
  await batch.commit()
})
