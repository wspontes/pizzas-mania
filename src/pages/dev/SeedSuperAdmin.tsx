import { useState } from 'react'
import { Button } from '@/components/ui'
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/firebase/config'
import { doc, setDoc } from 'firebase/firestore'

const EMAIL = 'superadmin@pizzasmania.com'
const PASSWORD = 'super123'

export default function SeedSuperAdmin() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const ensureDoc = async (uid: string) => {
    const now = new Date().toISOString()
    await setDoc(doc(db, 'users', uid), {
      name: 'Super Admin',
      username: 'superadmin',
      email: EMAIL,
      role: 'superadmin',
      storeId: null,
      active: true,
      createdAt: now,
      updatedAt: now,
    }, { merge: true })
  }

  const run = async () => {
    setLoading(true)
    setStatus('Criando...')
    try {
      let uid: string
      try {
        const cred = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD)
        await updateProfile(cred.user, { displayName: 'Super Admin' })
        uid = cred.user.uid
      } catch (err) {
        const code = (err as { code?: string })?.code
        if (code === 'auth/email-already-in-use') {
          const cred = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD)
          uid = cred.user.uid
        } else {
          throw err
        }
      }
      await ensureDoc(uid)
      setStatus(`Pronto! UID: ${uid}\nEmail: ${EMAIL}\nSenha: ${PASSWORD}\nRedirecionando...`)
      setTimeout(() => { window.location.href = '/superadmin' }, 800)
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