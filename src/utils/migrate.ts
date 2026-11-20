import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

const COLLECTIONS = ['products', 'categories', 'orders', 'coupons', 'motoboys', 'users']

export async function migrateStoreId() {
  const key = 'pizzamania_migrated_storeId_v1'
  if (localStorage.getItem(key)) return
  try {
    for (const col of COLLECTIONS) {
      const snap = await getDocs(collection(db, col))
      await Promise.all(snap.docs.map(async (d) => {
        const data = d.data()
        if (!data.storeId) {
          await updateDoc(doc(db, col, d.id), { storeId: 'default' })
        }
      }))
    }
    try {
      const snap = await getDocs(collection(db, 'settings'))
      await Promise.all(snap.docs.map(async (d) => {
        const data = d.data()
        if (!data.storeId) await updateDoc(doc(db, 'settings', d.id), { storeId: 'default' })
      }))
    } catch { /* silent */ }
    localStorage.setItem(key, '1')
  } catch (e) {
    console.error('migrateStoreId error', e)
  }
}

export async function migrateToSubcollections() {
  const key = 'pizzamania_migrated_subcols_v1'
  if (localStorage.getItem(key)) return
  try {
    const sid = 'default'
    for (const col of COLLECTIONS) {
      const snap = await getDocs(collection(db, col))
      await Promise.all(snap.docs.map(async (d) => {
        const data = d.data()
        await setDoc(doc(db, 'stores', sid, col, d.id), { ...data, storeId: sid })
      }))
    }
    // settings
    try {
      const snap = await getDocs(collection(db, 'settings'))
      await Promise.all(snap.docs.map(async (d) => {
        const data = d.data()
        await setDoc(doc(db, 'stores', sid, 'settings', d.id), { ...data, storeId: sid })
      }))
    } catch { /* silent */ }
    localStorage.setItem(key, '1')
  } catch (e) {
    console.error('migrateToSubcollections error', e)
  }
}