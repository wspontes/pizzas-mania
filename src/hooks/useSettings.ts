import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { BusinessSettings } from '@/services/settings'

export function useSettings() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'business'), (snap) => {
      setSettings(snap.exists() ? (snap.data() as BusinessSettings) : null)
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [])

  return { settings, loading }
}
