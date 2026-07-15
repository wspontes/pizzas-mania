import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { OrderItem } from '@/types'

interface CartState {
  items: OrderItem[]
  couponCode?: string
  couponDiscount: number
  deliveryFee: number
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: OrderItem }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'APPLY_COUPON'; payload: { code: string; discount: number } }
  | { type: 'SET_DELIVERY_FEE'; payload: number }
  | { type: 'CLEAR_CART' }

interface CartContextType {
  state: CartState
  addItem: (item: OrderItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  applyCoupon: (code: string, discount: number) => void
  setDeliveryFee: (fee: number) => void
  clearCart: () => void
  subtotal: number
  total: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(
        (i) => i.productId === action.payload.productId
      )
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === action.payload.productId
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        }
      }
      return { ...state, items: [...state.items, action.payload] }
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((i) => i.productId !== action.payload.productId),
      }
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.payload.productId
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      }
    case 'APPLY_COUPON':
      return {
        ...state,
        couponCode: action.payload.code,
        couponDiscount: action.payload.discount,
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
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    couponDiscount: 0,
    deliveryFee: 0,
  })

  const subtotal = state.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  )
  const total = subtotal - state.couponDiscount + state.deliveryFee

  const addItem = (item: OrderItem) =>
    dispatch({ type: 'ADD_ITEM', payload: item })
  const removeItem = (productId: string) =>
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } })
  const updateQuantity = (productId: string, quantity: number) =>
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } })
  const applyCoupon = (code: string, discount: number) =>
    dispatch({ type: 'APPLY_COUPON', payload: { code, discount } })
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
        applyCoupon,
        setDeliveryFee,
        clearCart,
        subtotal,
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
