import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import { Button } from '@/components/ui'

const testUser = {
  name: 'Admin Teste',
  username: 'teste',
  email: 'admin@pizzasmania.com.br',
  password: 'Teste@123',
  role: 'admin' as const,
}

export default function Seed() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const createSeedData = async () => {
    setStatus('loading')
    setMessage('')

    try {
      const result = await createUserWithEmailAndPassword(auth, testUser.email, testUser.password)

      await setDoc(doc(db, 'users', result.user.uid), {
        name: testUser.name,
        username: testUser.username,
        email: testUser.email,
        role: testUser.role,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      await setDoc(doc(db, 'categories', 'pizzas'), {
        name: 'Pizzas',
        slug: 'pizzas',
        order: 1,
        active: true,
      })

      await setDoc(doc(db, 'categories', 'bebidas'), {
        name: 'Bebidas',
        slug: 'bebidas',
        order: 2,
        active: true,
      })

      await setDoc(doc(db, 'categories', 'sobremesas'), {
        name: 'Sobremesas',
        slug: 'sobremesas',
        order: 3,
        active: true,
      })

      await setDoc(doc(db, 'products', 'pizza-margherita'), {
        name: 'Pizza Margherita',
        slug: 'pizza-margherita',
        description: 'Molho de tomate, muçarela, manjericão fresco',
        categoryId: 'pizzas',
        price: 42.90,
        active: true,
        featured: true,
        customizable: true,
      })

      await setDoc(doc(db, 'products', 'pizza-calabresa'), {
        name: 'Pizza Calabresa',
        slug: 'pizza-calabresa',
        description: 'Calabresa, cebola, muçarela, azeitona',
        categoryId: 'pizzas',
        price: 45.00,
        active: true,
        featured: true,
        customizable: true,
      })

      await setDoc(doc(db, 'products', 'coca-cola-2l'), {
        name: 'Coca-Cola 2L',
        slug: 'coca-cola-2l',
        description: 'Refrigerante Coca-Cola 2 litros',
        categoryId: 'bebidas',
        price: 10.00,
        active: true,
        featured: false,
        customizable: false,
      })

      setStatus('success')
      setMessage('Dados criados com sucesso!')
    } catch (err) {
      setStatus('error')
      const message = err instanceof Error ? err.message : ''
      if (message.includes('email-already-in-use')) {
        setMessage('Usuário já existe! Faça login com: teste / Teste@123')
      } else {
        setMessage('Erro: ' + message)
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-black px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 text-center">
        <h1 className="mb-2 text-xl font-bold text-white">Seed - Dados Iniciais</h1>
        <p className="mb-6 text-sm text-muted">
          Cria usuário admin + dados de exemplo no Firestore
        </p>

        <div className="mb-6 rounded-lg bg-surface-hover p-4 text-left text-sm">
          <p className="text-white font-medium mb-2">Conta que será criada:</p>
          <p className="text-muted">Usuário: <span className="text-white">teste</span></p>
          <p className="text-muted">Senha: <span className="text-white">Teste@123</span></p>
          <p className="text-muted">Email: <span className="text-white">{testUser.email}</span></p>
          <p className="text-muted mt-2">+ Categorias e produtos de exemplo</p>
        </div>

        <Button
          onClick={createSeedData}
          loading={status === 'loading'}
          className="w-full"
          size="lg"
        >
          {status === 'loading' ? 'Criando...' : 'Criar Dados Iniciais'}
        </Button>

        {message && (
          <p className={`mt-4 text-sm ${
            status === 'success' ? 'text-green-400' : 'text-yellow-400'
          }`}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
