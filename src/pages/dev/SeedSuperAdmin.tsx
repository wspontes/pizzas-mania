import { useState } from 'react'
import { Button } from '@/components/ui'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth, db } from '@/firebase/config'
import { doc, setDoc } from 'firebase/firestore'

const EMAIL = 'superadmin@pizzasmania.com'
const PASSWORD = 'super123'

export default function SeedSuperAdmin() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    setStatus('Criando...')
    try {
      const cred = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD)
      await updateProfile(cred.user, { displayName: 'Super Admin' })
      const now = new Date().toISOString()
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: 'Super Admin',
        username: 'superadmin',
        email: EMAIL,
        role: 'superadmin',
        storeId: null,
        active: true,
        createdAt: now,
        updatedAt: now,
      })
      setStatus(`Criado! UID: ${cred.user.uid}\nEmail: ${EMAIL}\nSenha: ${PASSWORD}`)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <h1 className="text-xl font-bold text-white">Seed Super Admin</h1>
      <p className="text-sm text-muted">Cria usuário superadmin (dev only)</p>
      <Button onClick={run} loading={loading}>Criar Super Admin</Button>
      {status && <pre className="mt-4 text-xs text-white whitespace-pre-wrap">{status}</pre>}
    </div>
  )
}