import type { Order } from '@/types'

export const RECEIPT_COLS = 32

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function line(text = ''): string {
  return `${text.slice(0, RECEIPT_COLS)}\n`
}

function sep(char = '-'): string {
  return `${char.repeat(RECEIPT_COLS)}\n`
}

function center(text: string): string {
  const t = text.slice(0, RECEIPT_COLS)
  const pad = Math.max(0, Math.floor((RECEIPT_COLS - t.length) / 2))
  return `${' '.repeat(pad)}${t}\n`
}

function leftRight(left: string, right: string): string {
  const r = right.slice(0, RECEIPT_COLS)
  const space = Math.max(1, RECEIPT_COLS - left.length - r.length)
  return `${left.slice(0, RECEIPT_COLS - r.length - 1)}${' '.repeat(space)}${r}\n`
}

function wrap(text: string, prefix = ''): string {
  const width = RECEIPT_COLS - prefix.length
  const words = text.split(' ')
  let out = ''
  let current = ''
  for (const w of words) {
    const next = current ? `${current} ${w}` : w
    if (next.length > width) {
      out += `${prefix}${current}\n`
      current = w
    } else {
      current = next
    }
  }
  if (current) out += `${prefix}${current}\n`
  return out
}

function money(v: number): string {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

function paymentLabel(method: string): string {
  if (method === 'pix') return 'PIX'
  if (method === 'cash') return 'Dinheiro'
  if (method === 'credit') return 'Credito'
  if (method === 'debit') return 'Debito'
  if (method === 'card') return 'Cartao'
  if (method === 'delivery') return 'Na entrega'
  return method
}

/** Pix é pré-pago. Cartão/dinheiro pagam na entrega ou retirada. */
function deliveryPaymentLine(order: Order): string {
  if (order.paymentMethod === 'pix') return 'PIX - PAGO'
  const where = order.deliveryType === 'pickup' ? 'NA RETIRADA' : 'NA ENTREGA'
  return `${paymentLabel(order.paymentMethod)} - PAGAR ${where}`
}

function formatShortDate(d: Date): string {
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

function itemsBlock(order: Order, withDetails: boolean): string {
  let out = ''
  for (const item of order.items) {
    out += line(`${item.quantity}x ${item.productName}`.slice(0, RECEIPT_COLS))
    if (!withDetails) continue
    if (item.size) out += line(`  Tam: ${item.size}`.slice(0, RECEIPT_COLS))
    if (item.flavors?.length) out += wrap(item.flavors.join(' + '), '  ')
    if (item.border) out += line(`  Borda: ${item.border}`.slice(0, RECEIPT_COLS))
    if (item.extras?.length) out += line(`  Extra: ${item.extras.join(', ')}`.slice(0, RECEIPT_COLS))
    if (item.removedIngredients?.length) out += line(`  S/ ${item.removedIngredients.join(', ')}`.slice(0, RECEIPT_COLS))
    if (item.notes) out += wrap(`Obs: ${item.notes}`, '  ')
  }
  return out
}

/** Cupom 1 — cozinha: sem endereço, sem valores. Foco no preparo. */
export function buildKitchenText(order: Order, storeName = 'Pizzas Mania'): string {
  const dt = new Date(order.createdAt)
  const kind = order.deliveryType === 'pickup' ? 'RETIRADA' : 'ENTREGA'
  const count = order.items.reduce((n, i) => n + i.quantity, 0)
  let out = ''
  out += center(storeName.toUpperCase())
  out += sep()
  out += center(`CUPOM COZINHA - ${kind}`)
  out += sep()
  out += line(`Pedido #${order.id.slice(0, 8)}`)
  out += line(formatShortDate(dt))
  out += line(`Cliente: ${order.customerName}`.slice(0, RECEIPT_COLS))
  out += sep()
  out += itemsBlock(order, true)
  out += sep()
  out += center(`*** ${count} ${count === 1 ? 'item' : 'itens'} ***`)
  out += line('')
  out += line('')
  return out
}

/** Cupom 2 — entrega/motoboy: endereço, pagamento e total. */
export function buildDeliveryText(order: Order, storeName = 'Pizzas Mania', motoboy = ''): string {
  const dt = new Date(order.createdAt)
  const isPickup = order.deliveryType === 'pickup'
  let out = ''
  out += center(storeName.toUpperCase())
  out += sep()
  out += center(isPickup ? 'DADOS DE RETIRADA' : 'DADOS DE ENTREGA')
  out += sep()
  out += line(`Pedido #${order.id.slice(0, 8)}`)
  out += line(formatShortDate(dt))
  out += line(`Cliente: ${order.customerName}`.slice(0, RECEIPT_COLS))
  out += line(`Fone: ${order.customerPhone}`.slice(0, RECEIPT_COLS))
  if (!isPickup && motoboy.trim()) out += line(`Motoboy: ${motoboy.trim()}`.slice(0, RECEIPT_COLS))
  if (!isPickup && order.deliveryAddress) {
    const a = order.deliveryAddress
    out += sep()
    out += wrap(`${a.street}, ${a.number}`, '')
    if (a.complement) out += wrap(`Ponto de referencia: ${a.complement}`, '')
    if (a.reference) out += wrap(`Ref: ${a.reference}`, '')
    out += wrap(`${a.neighborhood} - ${a.city}`, '')
  }
  out += sep()
  out += itemsBlock(order, false)
  out += sep()
  out += line(deliveryPaymentLine(order))
  out += leftRight('TOTAL', money(order.total))
  if (order.paymentMethod === 'cash' && order.changeNeeded && order.changeFor) {
    out += line(`Troco p/ ${money(order.changeFor)}`)
  }
  if (order.couponCode) out += line(`Cupom: ${order.couponCode}`)
  if (order.notes) out += wrap(`Obs: ${order.notes}`, '')
  out += line('')
  out += center('Bom apetite!')
  out += line('')
  out += line('')
  return out
}

/** Os dois cupons em sequência para uma única impressão (rasgar no meio). */
export function buildBothText(order: Order, storeName = 'Pizzas Mania', motoboy = ''): string {
  return buildKitchenText(order, storeName) + buildDeliveryText(order, storeName, motoboy)
}

export function buildBothAscii(order: Order, storeName = 'Pizzas Mania', motoboy = ''): string {
  return stripAccents(buildBothText(order, storeName, motoboy)).replace(/[^ -~\n]/g, '')
}

export function buildBothEscPosBase64(order: Order, storeName = 'Pizzas Mania', motoboy = ''): string {
  const bytes = [0x1b, 0x40, ...asciiBytes(buildBothAscii(order, storeName, motoboy)), 0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x00]
  return bytesToBase64(bytes)
}

export function buildBothRawBtUrl(order: Order, storeName = 'Pizzas Mania', motoboy = ''): string {
  return `rawbt:base64,${buildBothEscPosBase64(order, storeName, motoboy)}`
}

/** Imprime os dois cupons via RawBT. Precisa ser chamado de um clique. */
export function printBothViaRawBt(order: Order, storeName = 'Pizzas Mania', motoboy = ''): string {
  const url = buildBothRawBtUrl(order, storeName, motoboy)
  window.location.href = url
  return url
}

export function buildReceiptText(order: Order, storeName = 'Pizzas Mania'): string {
  let out = ''
  out += center(storeName.toUpperCase())
  out += center(`Pedido #${order.id.slice(0, 8)}`)
  out += sep()
  const dt = new Date(order.createdAt)
  const dateStr = `${dt.toLocaleDateString('pt-BR')} ${dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  out += leftRight(order.deliveryType === 'pickup' ? 'RETIRADA' : 'DELIVERY', dateStr.slice(0, 16))
  out += line(order.customerName.slice(0, RECEIPT_COLS))
  out += line(order.customerPhone)
  if (order.deliveryType !== 'pickup' && order.deliveryAddress) {
    const a = order.deliveryAddress
    out += wrap(`${a.street}, ${a.number}${a.complement ? ` ${a.complement}` : ''}`, '')
    out += wrap(`${a.neighborhood} - ${a.city}`, '')
  }
  out += sep()
  for (const item of order.items) {
    out += leftRight(`${item.quantity}x ${item.productName}`.slice(0, 22), money(item.price * item.quantity).slice(0, 9))
    if (item.size) out += line(`  Tam: ${item.size}`.slice(0, RECEIPT_COLS))
    if (item.flavors?.length) out += wrap(item.flavors.join(' + '), '  ')
    if (item.border) out += line(`  Borda: ${item.border}`.slice(0, RECEIPT_COLS))
    if (item.extras?.length) out += line(`  Extra: ${item.extras.join(', ')}`.slice(0, RECEIPT_COLS))
    if (item.removedIngredients?.length) out += line(`  S/ ${item.removedIngredients.join(', ')}`.slice(0, RECEIPT_COLS))
    if (item.notes) out += wrap(`Obs: ${item.notes}`, '  ')
  }
  out += sep()
  out += leftRight('Subtotal', money(order.subtotal))
  if (order.deliveryType !== 'pickup') out += leftRight('Entrega', money(order.deliveryFee))
  if (order.discount > 0) out += leftRight('Desconto', `-${money(order.discount)}`)
  out += leftRight('TOTAL', money(order.total))
  out += sep()
  out += line(`Pagto: ${paymentLabel(order.paymentMethod)}`)
  if (order.paymentMethod === 'cash' && order.changeNeeded && order.changeFor) {
    out += line(`Troco p/ ${money(order.changeFor)}`)
  }
  if (order.couponCode) out += line(`Cupom: ${order.couponCode}`)
  if (order.notes) out += wrap(`Obs: ${order.notes}`, '')
  out += sep()
  out += center('Obrigado pela preferencia!')
  out += line('')
  out += line('')
  return out
}

/** Texto sem acentos: mais seguro para impressora SPP barata via base64. */
export function buildReceiptAscii(order: Order, storeName = 'Pizzas Mania'): string {
  return stripAccents(buildReceiptText(order, storeName)).replace(/[^ -~\n]/g, '')
}

function asciiBytes(s: string): number[] {
  const bytes: number[] = []
  for (const ch of s) bytes.push(ch.charCodeAt(0) & 0xff)
  return bytes
}

function bytesToBase64(bytes: number[]): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

/** Pacote ESC/POS minimo: INIT + texto + avanco + corte. */
export function buildEscPosBase64(order: Order, storeName = 'Pizzas Mania'): string {
  const text = buildReceiptAscii(order, storeName)
  const bytes = [0x1b, 0x40, ...asciiBytes(text), 0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x00]
  return bytesToBase64(bytes)
}

export function buildRawBtUrl(order: Order, storeName = 'Pizzas Mania'): string {
  return `rawbt:base64,${buildEscPosBase64(order, storeName)}`
}

/** Abre o RawBT. Precisa ser chamado de um clique do usuario. */
export function printViaRawBt(order: Order, storeName = 'Pizzas Mania'): string {
  const url = buildRawBtUrl(order, storeName)
  window.location.href = url
  return url
}
