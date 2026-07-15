import { useState, useEffect } from 'react'
import { settingsService, type BusinessSettings } from '@/services/settings'

export function useSettings() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    settingsService.get().then((data) => {
      setSettings(data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return { settings, loading }
}
