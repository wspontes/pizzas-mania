import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { OrderItem } from '@/types'

interface CartState {
  items: OrderItem[]
  couponCode?: string
  couponDiscount: number
  couponType?: 'percentage' | 'fixed'
  couponValue?: number
  deliveryFee: number
  orderNotes?: string
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: OrderItem }
  | { type: 'REMOVE_ITEM'; payload: { key: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { key: string; quantity: number } }
  | { type: 'UPDATE_BORDER'; payload: { key: string; border?: string; borderPrice?: number } }
  | { type: 'UPDATE_NOTES'; payload: { key: string; notes?: string } }
  | { type: 'SET_ORDER_NOTES'; payload: string }
  | { type: 'APPLY_COUPON'; payload: { code: string; type: 'percentage' | 'fixed'; value: number } }
  | { type: 'SET_DELIVERY_FEE'; payload: number }
  | { type: 'CLEAR_CART' }

interface CartContextType {
  state: CartState
  addItem: (item: OrderItem) => void
  removeItem: (key: string) => void
  updateQuantity: (key: string, quantity: number) => void
  updateBorder: (key: string, border?: string, borderPrice?: number) => void
  updateNotes: (key: string, notes?: string) => void
  setOrderNotes: (notes: string) => void
  applyCoupon: (code: string, type: 'percentage' | 'fixed', value: number) => void
  setDeliveryFee: (fee: number) => void
  clearCart: () => void
  subtotal: number
  discount: number
  total: number
}

const STORAGE_KEY = 'pizzamania_cart'

function loadCart(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* silent */ }
  return { items: [], couponDiscount: 0, deliveryFee: 0 }
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function itemsMatch(a: OrderItem, b: OrderItem): boolean {
  if (a.isSplit || b.isSplit) {
    if (!a.isSplit || !b.isSplit) return false
    const keyA = [...(a.flavors ?? [])].map((f) => f.productId).sort().join(',')
    const keyB = [...(b.flavors ?? [])].map((f) => f.productId).sort().join(',')
    return keyA === keyB
  }
  return a.productId === b.productId
}

export function itemKey(item: OrderItem): string {
  if (item.isSplit) {
    return `split:${[...(item.flavors ?? [])].map((f) => f.productId).sort().join(',')}`
  }
  return `whole:${item.productId}`
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(
        (i) => itemsMatch(i, action.payload)
      )
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            itemsMatch(i, action.payload)
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        }
      }
      return { ...state, items: [...state.items, action.payload] }
    }
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter((i) => itemKey(i) !== action.payload.key)
      if (newItems.length === 0) return { items: [], couponDiscount: 0, couponType: undefined, couponValue: undefined, couponCode: undefined, deliveryFee: 0 }
      return { ...state, items: newItems }
    }
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map((i) =>
          itemKey(i) === action.payload.key
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      }
    case 'UPDATE_BORDER':
      return {
        ...state,
        items: state.items.map((i) =>
          itemKey(i) === action.payload.key
            ? { ...i, border: action.payload.border, borderPrice: action.payload.borderPrice }
            : i
        ),
      }
    case 'UPDATE_NOTES':
      return {
        ...state,
        items: state.items.map((i) =>
          itemKey(i) === action.payload.key
            ? { ...i, notes: action.payload.notes?.trim() ? action.payload.notes.trim() : undefined }
            : i
        ),
      }
    case 'SET_ORDER_NOTES':
      return { ...state, orderNotes: action.payload }
    case 'APPLY_COUPON':
      return {
        ...state,
        couponCode: action.payload.code,
        couponType: action.payload.type,
        couponValue: action.payload.value,
        couponDiscount: action.payload.type === 'percentage' ? 0 : action.payload.value,
      }
    case 'SET_DELIVERY_FEE':
      return { ...state, deliveryFee: action.payload }
    case 'CLEAR_CART':
      return { items: [], couponDiscount: 0, deliveryFee: 0 }
    default:
      return state
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const subtotal = state.items.reduce(
    (acc, item) => acc + (item.price + (item.borderPrice || 0)) * item.quantity,
    0
  )

  let calculatedDiscount = 0
  if (state.couponCode && state.couponType && state.couponValue !== undefined) {
    calculatedDiscount = state.couponType === 'percentage'
      ? (subtotal * state.couponValue) / 100
      : state.couponValue
  }

  const total = subtotal - calculatedDiscount + state.deliveryFee

  const addItem = (item: OrderItem) =>
    dispatch({ type: 'ADD_ITEM', payload: item })
  const removeItem = (key: string) =>
    dispatch({ type: 'REMOVE_ITEM', payload: { key } })
  const updateQuantity = (key: string, quantity: number) =>
    dispatch({ type: 'UPDATE_QUANTITY', payload: { key, quantity } })
  const updateBorder = (key: string, border?: string, borderPrice?: number) =>
    dispatch({ type: 'UPDATE_BORDER', payload: { key, border, borderPrice } })
  const updateNotes = (key: string, notes?: string) =>
    dispatch({ type: 'UPDATE_NOTES', payload: { key, notes } })
  const setOrderNotes = (notes: string) =>
    dispatch({ type: 'SET_ORDER_NOTES', payload: notes })
  const applyCoupon = (code: string, type: 'percentage' | 'fixed', value: number) =>
    dispatch({ type: 'APPLY_COUPON', payload: { code, type, value } })
  const setDeliveryFee = (fee: number) =>
    dispatch({ type: 'SET_DELIVERY_FEE', payload: fee })
  const clearCart = () => dispatch({ type: 'CLEAR_CART' })

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        updateBorder,
        updateNotes,
        setOrderNotes,
        applyCoupon,
        setDeliveryFee,
        clearCart,
        subtotal,
        discount: calculatedDiscount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
