import { where, orderBy } from 'firebase/firestore'
import { FirestoreService } from './firestore'
import type { Category } from '@/types'

class CategoriesService extends FirestoreService<Category> {
  constructor() {
    super('categories')
  }

  async getActiveCategories() {
    return this.getAll([
      where('active', '==', true),
      orderBy('order', 'asc'),
    ])
  }
}

export const categoriesService = new CategoriesService()
