/**
 * Robô de push de novos pedidos (zero custo, sem Blaze).
 * Roda via GitHub Actions a cada 5 min:
 *  1. Busca pedidos criados após o último processado (doc meta/orderPush).
 *  2. Envia FCM de alta prioridade para os tokens em fcmTokens.
 *  3. Atualiza o marcador. Tokens inválidos são removidos.
 *
 * Env: FIREBASE_SERVICE_ACCOUNT (JSON da service account), PROJECT_ID.
 * Flags: DRY_RUN=1 (não envia, só lista o que enviaria).
 */
import { createSign } from 'node:crypto'

const PROJECT_ID = process.env.PROJECT_ID || 'pizzas-mania'
const DRY_RUN = process.env.DRY_RUN === '1'
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`
const FCM = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`

function b64url(input) {
  return Buffer.from(input).toString('base64url')
}

async function accessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: serviceAccount.private_key_id }))
  const claim = b64url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  )
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${claim}`)
  const signature = signer.sign(serviceAccount.private_key, 'base64url')
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claim}.${signature}`,
    }),
  })
  if (!res.ok) throw new Error(`OAuth falhou: ${res.status} ${await res.text()}`)
  return (await res.json()).access_token
}

async function fsGet(token, path) {
  const res = await fetch(`${BASE}/${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Firestore GET ${path}: ${res.status} ${await res.text()}`)
  return res.json()
}

async function fsPatch(token, path, fields) {
  const params = Object.keys(fields)
    .map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`)
    .join('&')
  const res = await fetch(`${BASE}/${path}?${params}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) throw new Error(`Firestore PATCH ${path}: ${res.status} ${await res.text()}`)
  return res.json()
}

async function fsCreate(token, collection, documentId, fields) {
  const res = await fetch(`${BASE}/${collection}?documentId=${encodeURIComponent(documentId)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) throw new Error(`Firestore POST ${collection}: ${res.status} ${await res.text()}`)
  return res.json()
}

function strVal(field) {
  if (!field) return ''
  if (typeof field.stringValue === 'string') return field.stringValue
  if (typeof field.integerValue === 'string') return field.integerValue
  if (typeof field.doubleValue === 'number') return String(field.doubleValue)
  return ''
}

function money(value) {
  return `R$ ${Number(value || 0)
    .toFixed(2)
    .replace('.', ',')}`
}

async function sendPush(token, access, fcmToken, title, body, orderId) {
  const res = await fetch(FCM, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        token: fcmToken,
        notification: { title, body },
        android: { priority: 'HIGH' },
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
        data: { orderId, url: '/admin/pedidos' },
      },
    }),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, error: data?.error?.status || data?.error?.message || '' }
}

async function main() {
  const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!saRaw) throw new Error('FIREBASE_SERVICE_ACCOUNT não definido')
  const serviceAccount = JSON.parse(saRaw)
  const access = await accessToken(serviceAccount)

  const now = Date.now()
  const meta = await fsGet(access, 'meta/orderPush')
  let lastTs = meta ? strVal(meta.fields?.lastTs) : ''
  if (!lastTs) lastTs = new Date(now - 12 * 60 * 1000).toISOString()

  const ordersRes = await fsGet(access, 'orders?pageSize=15&orderBy=createTime%20desc')
  const docs = ordersRes?.documents || []
  const fresh = docs
    .map((d) => ({ id: d.name.split('/').pop(), createTime: d.createTime || '', fields: d.fields || {} }))
    .filter((o) => o.createTime > lastTs && now - new Date(o.createTime).getTime() < 12 * 60 * 1000)
    .sort((a, b) => (a.createTime < b.createTime ? -1 : 1))

  console.log(`Pedidos novos desde ${lastTs}: ${fresh.length}`)
  if (fresh.length === 0) return

  const tokensRes = await fsGet(access, 'fcmTokens?pageSize=100')
  const tokens = (tokensRes?.documents || []).map((d) => ({ docId: d.name.split('/').pop(), token: strVal(d.fields?.token) })).filter((t) => t.token)
  console.log(`Aparelhos cadastrados: ${tokens.length}`)

  for (const order of fresh) {
    const f = order.fields
    const items = Array.isArray(f.items?.arrayValue?.values) ? f.items.arrayValue.values : []
    const count = items.reduce((n, it) => n + Number(strVal(it.mapValue?.fields?.quantity) || 0), 0)
    const title = `Novo pedido — ${strVal(f.customerName) || 'Pizzas Mania'}`
    const body = `${count} ${count === 1 ? 'item' : 'itens'} • Total ${money(strVal(f.total))}`
    console.log(`#${order.id.slice(0, 8)} ${title} | ${body}`)

    if (!DRY_RUN) {
      for (const t of tokens) {
        const r = await sendPush(access, t.token, title, body, order.id)
        console.log(`  -> ${t.docId.slice(0, 12)}... ${r.ok ? 'OK' : `FALHA ${r.status} ${r.error}`}`)
        if (!r.ok && (r.error === 'UNREGISTERED' || r.error === 'INVALID_ARGUMENT')) {
          await fetch(`${BASE}/fcmTokens/${t.docId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${access}` } })
          console.log('  token inválido removido')
        }
      }
    }
  }

  const maxTs = fresh[fresh.length - 1].createTime
  if (!DRY_RUN) {
    if (meta) await fsPatch(access, 'meta/orderPush', { lastTs: { stringValue: maxTs } })
    else await fsCreate(access, 'meta', 'orderPush', { lastTs: { stringValue: maxTs } })
    console.log(`Marcador atualizado: ${maxTs}`)
  }
}

main().catch((err) => {
  console.error(err?.message || err)
  process.exit(1)
})
