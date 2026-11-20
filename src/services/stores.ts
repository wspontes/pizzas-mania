import { where } from 'firebase/firestore'
import { FirestoreService } from './firestore'
import type { Store } from '@/types'

class StoresService extends FirestoreService<Store> {
  constructor() {
    super('stores', false)
  }

  async getBySlug(slug: string): Promise<(Store & { id: string }) | null> {
    const list = await this.getAll([where('slug', '==', slug), where('active', '==', true)], { skipStoreId: true })
    return list.length ? list[0] : null
  }

  async slugExists(slug: string): Promise<boolean> {
    const list = await this.getAll([where('slug', '==', slug)])
    return list.length > 0
  }

  async getActiveStores() {
    return this.getAll([where('active', '==', true)])
  }
}

export const storesService = new StoresService()