import type { UserRole, OrderStatus } from '@/config'

export interface Store {
  id: string
  name: string
  slug: string
  logo?: string
  accentColor?: string
  whatsapp?: string
  instagram?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  storeId?: string | null
  photoURL?: string
  createdAt: string
  updatedAt: string
  active: boolean
}

export interface Address {
  id: string
  userId: string
  label: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  reference?: string
  isDefault: boolean
}

export type MeiaMeiaGroup = 'tradicional' | 'premium' | 'doce'

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  order: number
  active: boolean
  allowsMeiaMeia?: boolean
  meiaMeiaGroup?: MeiaMeiaGroup
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  categoryId: string
  image: string
  price: number
  discountPrice?: number
  active: boolean
  featured: boolean
  customizable: boolean
  hasCrust?: boolean
  order?: number
  sizes?: Size[]
  ingredients?: ProductIngredient[]
  createdAt: Date
  updatedAt: Date
}

export interface Size {
  id: string
  name: string
  price: number
  maxFlavors: number
}

export interface ProductIngredient {
  ingredientId: string
  name: string
  removable: boolean
  extraPrice: number
}

export interface Ingredient {
  id: string
  name: string
  category: string
  active: boolean
}

export interface Border {
  id: string
  name: string
  price: number
  active: boolean
}

export interface Flavor {
  id: string
  name: string
  description?: string
  image?: string
  price: number
  categoryId: string
  active: boolean
}

export interface Order {
  id: string
  customerId?: string
  customerName: string
  customerPhone: string
  deliveryAddress?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    reference?: string
  }
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  status: OrderStatus
  notes?: string
  couponCode?: string
  changeNeeded?: boolean
  changeFor?: number
  deliveryType?: 'delivery' | 'pickup'
  preparationTime?: number
  deliveryTime?: number
  motoboyId?: string
  motoboyName?: string
  createdAt: string
  updatedAt: string
}

export interface Motoboy {
  id: string
  name: string
  phone: string
  active: boolean
  createdAt?: string
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  size?: string
  flavors?: { productId: string; name: string; price: number; categoryId?: string; group?: MeiaMeiaGroup }[]
  isSplit?: boolean
  border?: string
  borderPrice?: number
  hasCrust?: boolean
  extras?: string[]
  removedIngredients?: string[]
  notes?: string
}

export type PaymentMethod = 'pix' | 'card' | 'cash' | 'credit' | 'debit' | 'delivery'
export type PaymentStatus = 'pending' | 'paid' | 'approved' | 'rejected' | 'refunded'

export interface Coupon {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minOrder?: number
  maxUses?: number
  usedCount: number
  expiresAt: Date
  active: boolean
}

export interface Promotion {
  id: string
  title: string
  description: string
  image?: string
  type: 'product' | 'category' | 'order'
  discount: number
  startsAt: string
  endsAt: string
  active: boolean
}

export interface DeliveryConfig {
  neighborhoods: DeliveryNeighborhood[]
  baseFee: number
  freeDeliveryMinOrder?: number
}

export interface DeliveryNeighborhood {
  name: string
  fee: number
  estimatedTime: number
  active: boolean
}

export interface BusinessHours {
  dayOfWeek: number
  open: string
  close: string
  closed: boolean
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  read: boolean
  type: 'order' | 'system' | 'promotion'
  createdAt: string
}
