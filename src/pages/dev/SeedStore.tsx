import { useState } from 'react'
import { Button } from '@/components/ui'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase/config'

const STORE_ID = 'default'
const SLUG = 'pizzas-mania'
const NAME = 'Pizzas Mania'

export default function SeedStore() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    setStatus('Autenticando superadmin...')
    try {
      const superEmail = 'superadmin@pizzasmania.com'
      const superPass = 'super123'
      try {
        await signInWithEmailAndPassword(auth, superEmail, superPass)
      } catch {
        const cred = await createUserWithEmailAndPassword(auth, superEmail, superPass)
        await updateProfile(cred.user, { displayName: 'Super Admin' })
        await setDoc(doc(db, 'users', cred.user.uid), {
          name: 'Super Admin', username: 'superadmin', email: superEmail, role: 'superadmin', storeId: null, active: true,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        })
      }
      setStatus('Criando loja default...')
      const now = new Date().toISOString()
      await setDoc(doc(db, 'stores', STORE_ID), {
        name: NAME,
        slug: SLUG,
        active: true,
        createdAt: now,
        updatedAt: now,
      }, { merge: true })
      setStatus('Loja criada. Criando admin...')
      // cria admin user se nao existir (tenta)
      const email = 'admin@pizzasmania.com'
      const password = 'admin123'
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName: 'Admin Pizzas Mania' })
        await setDoc(doc(db, 'users', cred.user.uid), {
          name: 'Admin Pizzas Mania',
          username: 'admin',
          email,
          role: 'admin',
          storeId: STORE_ID,
          active: true,
          createdAt: now,
          updatedAt: now,
        })
        setStatus(`Loja + admin criados.\nEmail: ${email}\nSenha: ${password}\nSlug: /${SLUG}`)
      } catch (e) {
        const code = (e as { code?: string })?.code
        if (code === 'auth/email-already-in-use') {
          setStatus(`Loja criada (admin ja existia).\nSlug: /${SLUG}`)
        } else {
          throw e
        }
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <h1 className="text-xl font-bold text-white">Seed Loja Default</h1>
      <p className="text-sm text-muted">Cria a loja "Pizzas Mania" (storeId=default) no super admin</p>
      <Button onClick={run} loading={loading}>Criar Loja Default</Button>
      {status && <pre className="mt-4 text-xs text-white whitespace-pre-wrap">{status}</pre>}
    </div>
  )
}