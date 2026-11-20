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
import { getCurrentStoreId } from './storeContext'

type WithId = { id: string }

export class FirestoreService<T> {
  private collectionName: string
  private tenantScoped: boolean

  constructor(collectionName: string, tenantScoped = true) {
    this.collectionName = collectionName
    this.tenantScoped = tenantScoped
  }

  private collectionRef() {
    const sid = this.storeId()
    if (sid && this.tenantScoped) {
      return collection(db, 'stores', sid, this.collectionName)
    }
    return collection(db, this.collectionName)
  }

  private storeId() {
    return this.tenantScoped ? getCurrentStoreId() : null
  }

  async getAll(constraints?: QueryConstraint[], options?: { skipStoreId?: boolean }): Promise<(T & WithId)[]> {
    try {
      const sid = options?.skipStoreId ? null : this.storeId()
      const cons = [...(constraints || [])]
      if (sid) cons.push(where('storeId', '==', sid))
      const ref = this.collectionRef()
      const q = cons.length ? query(ref, ...cons) : query(ref)
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T & WithId))
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getById(id: string): Promise<(T & WithId) | null> {
    try {
      const ref = this.collectionRef()
      const docRef = doc(ref, id)
      const snapshot = await getDoc(docRef)
      if (!snapshot.exists()) return null
      return { id: snapshot.id, ...snapshot.data() } as T & WithId
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async create(data: Partial<T>): Promise<T & WithId> {
    try {
      const ref = this.collectionRef()
      const sid = this.storeId()
      const payload: Record<string, unknown> = { ...(data as Record<string, unknown>) }
      if (sid) payload.storeId = sid
      const docRef = await addDoc(ref, payload)
      return { id: docRef.id, ...payload } as T & WithId
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      const ref = this.collectionRef()
      const docRef = doc(ref, id)
      await updateDoc(docRef, data as Record<string, unknown>)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const ref = this.collectionRef()
      const docRef = doc(ref, id)
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
