import { doc, setDoc } from 'firebase/firestore'
import { getMessaging, getToken, isSupported, onMessage, type MessagePayload } from 'firebase/messaging'
import app, { db } from '@/firebase/config'

const SW_URL = '/firebase-messaging-sw.js'

function firebaseWebConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  }
}

/** Registra o SW de mensagens passando a config pública via query string. */
async function messagingRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  const cfg = firebaseWebConfig()
  if (!cfg.apiKey || !cfg.projectId || !cfg.messagingSenderId || !cfg.appId) return null
  const params = new URLSearchParams({
    apiKey: cfg.apiKey,
    authDomain: cfg.authDomain || '',
    projectId: cfg.projectId,
    storageBucket: cfg.storageBucket || '',
    messagingSenderId: cfg.messagingSenderId,
    appId: cfg.appId,
  })
  // Escopo próprio para não disputar o controle das páginas com o SW do PWA.
  return navigator.serviceWorker.register(`${SW_URL}?${params.toString()}`, { scope: '/firebase-messaging/' })
}

/**
 * Obtém o token FCM deste aparelho e salva em `fcmTokens`.
 * Retorna o token ou null (sem suporte, sem permissão ou sem VAPID).
 */
export async function ensurePushToken(userId: string, role: string): Promise<string | null> {
  try {
    if (!(await isSupported())) return null
    if (!('Notification' in window) || Notification.permission !== 'granted') return null
    const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY as string | undefined
    if (!vapidKey) return null
    const registration = await messagingRegistration()
    if (!registration) return null
    const messaging = getMessaging(app)
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration })
    if (!token) return null
    await setDoc(
      doc(db, 'fcmTokens', token),
      { token, userId, role, platform: 'web', updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
      { merge: true }
    )
    return token
  } catch {
    return null
  }
}

/** Ouve mensagens com o app aberto. Retorna função para cancelar. */
export async function onForegroundPush(cb: (payload: MessagePayload) => void): Promise<() => void> {
  try {
    if (!(await isSupported())) return () => {}
    return onMessage(getMessaging(app), cb)
  } catch {
    return () => {}
  }
}
