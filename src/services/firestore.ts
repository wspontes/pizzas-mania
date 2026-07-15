import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  type QueryConstraint,
  type FirestoreError,
} from 'firebase/firestore'
import { db } from '@/firebase/config'

type WithId = { id: string }

export class FirestoreService<T> {
  private collectionRef

  constructor(collectionName: string) {
    this.collectionRef = collection(db, collectionName)
  }

  async getAll(constraints?: QueryConstraint[]): Promise<(T & WithId)[]> {
    try {
      const q = constraints ? query(this.collectionRef, ...constraints) : query(this.collectionRef)
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T & WithId))
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getById(id: string): Promise<(T & WithId) | null> {
    try {
      const docRef = doc(this.collectionRef, id)
      const snapshot = await getDoc(docRef)
      if (!snapshot.exists()) return null
      return { id: snapshot.id, ...snapshot.data() } as T & WithId
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async create(data: Partial<T>): Promise<T & WithId> {
    try {
      const docRef = await addDoc(this.collectionRef, data as Record<string, unknown>)
      return { id: docRef.id, ...data } as T & WithId
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(this.collectionRef, id)
      await updateDoc(docRef, data as Record<string, unknown>)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(this.collectionRef, id)
      await deleteDoc(docRef)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async queryByField(field: string, value: unknown): Promise<(T & WithId)[]> {
    return this.getAll([where(field, '==', value)])
  }

  async getActive(): Promise<(T & WithId)[]> {
    return this.getAll([where('active', '==', true)])
  }

  protected handleError(error: unknown): Error {
    const firestoreError = error as FirestoreError
    return new Error(firestoreError.message || 'Erro ao acessar o banco de dados')
  }
}
