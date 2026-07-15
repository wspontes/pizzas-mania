import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

export interface BusinessSettings {
  businessHours: {
    dayOfWeek: number
    open: string
    close: string
    closed: boolean
  }[]
  minOrder: number
  freeDeliveryFrom: number
  neighborhoods: {
    name: string
    fee: number
    estimatedTime: number
    active: boolean
  }[]
  paymentMethods?: {
    pix?: { enabled: boolean; key?: string }
    credit?: { enabled: boolean; installments?: number }
    debit?: { enabled: boolean }
    cash?: { enabled: boolean }
    delivery?: { enabled: boolean }
  }
  banner?: {
    title: string
    subtitle: string
    image?: string
    active: boolean
  }
}

const SETTINGS_DOC = 'business'

export const settingsService = {
  async get(): Promise<BusinessSettings | null> {
    const snapshot = await getDoc(doc(db, 'settings', SETTINGS_DOC))
    if (!snapshot.exists()) return null
    return snapshot.data() as BusinessSettings
  },

  async save(data: BusinessSettings): Promise<void> {
    await setDoc(doc(db, 'settings', SETTINGS_DOC), data)
  },
}
