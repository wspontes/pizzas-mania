import { where, orderBy, limit } from 'firebase/firestore'
import { FirestoreService } from './firestore'
import type { Product } from '@/types'

class ProductsService extends FirestoreService<Product> {
  constructor() {
    super('products')
  }

  async getActiveProducts() {
    return this.getAll([
      where('active', '==', true),
      orderBy('name', 'asc'),
    ])
  }

  async getByCategory(categoryId: string) {
    return this.getAll([
      where('categoryId', '==', categoryId),
      where('active', '==', true),
      orderBy('name', 'asc'),
    ])
  }

  async getFeatured() {
    return this.getAll([
      where('featured', '==', true),
      where('active', '==', true),
      limit(8),
    ])
  }

  async searchByName(term: string) {
    const products = await this.getActiveProducts()
    const lowerTerm = term.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerTerm) ||
        p.description.toLowerCase().includes(lowerTerm)
    )
  }
}

export const productsService = new ProductsService()
