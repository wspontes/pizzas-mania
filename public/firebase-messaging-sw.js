/* Service Worker do Firebase Cloud Messaging.
 * Recebe a config pública via query string (?apiKey=...&projectId=...).
 * Responsável pelo push com app fechado ou tela bloqueada. */

importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js')

const params = new URLSearchParams(self.location.search)

firebase.initializeApp({
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'Novo pedido — Pizzas Mania'
  const body =
    (payload.notification && payload.notification.body) || (payload.data && payload.data.body) || 'Chegou um pedido novo!'
  const url = (payload.data && payload.data.url) || '/admin/pedidos'
  const tag = (payload.data && payload.data.orderId) || 'pizzas-mania-order'
  self.registration.showNotification(title, {
    body,
    icon: '/icons.svg',
    badge: '/icons.svg',
    tag,
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 300],
    data: { url },
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/admin/pedidos'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
