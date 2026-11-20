import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '@/firebase/config'
import { storesService } from '@/services'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { Button } from '@/components/ui'
import { UtensilsCrossed, Loader2 } from 'lucide-react'

function toSlug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function RegisterStore() {
  const navigate = useNavigate()
  const [storeName, setStoreName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleStoreNameChange = (value: string) => {
    setStoreName(value)
    if (!slugEdited) {
      setSlug(toSlug(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setSlugEdited(true)
    setSlug(toSlug(value))
  }

  const checkSlug = async () => {
    if (!slug) return
    setCheckingSlug(true)
    try {
      const exists = await storesService.slugExists(slug)
      setSlugAvailable(!exists)
    } catch {
      setSlugAvailable(null)
    }
    setCheckingSlug(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!storeName || !slug || !whatsapp || !name || !email || !password) {
      setError('Preencha todos os campos')
      return
    }
    if (slugAvailable === false) {
      setError('Este slug já está em uso')
      return
    }
    setSubmitting(true)
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName: name })

      const now = new Date().toISOString()
      const store = await storesService.create({
        name: storeName.trim(),
        slug,
        whatsapp: whatsapp.trim(),
        active: true,
        createdAt: now,
        updatedAt: now,
      })

      // Configurações iniciais da pizzaria
      await setDoc(doc(db, 'stores', store.id, 'settings', 'business'), {
        storeId: store.id,
        active: true,
        whatsapp: whatsapp.trim(),
        neighborhoods: [],
        crustOptions: [],
        createdAt: now,
        updatedAt: now,
      })

      // Categorias iniciais para pizzaria (meio a meio)
      const categorias = [
        { name: 'Pizzas Tradicionais', order: 1, allowsMeiaMeia: true, meiaMeiaGroup: 'tradicional' },
        { name: 'Pizzas Premium', order: 2, allowsMeiaMeia: true, meiaMeiaGroup: 'premium' },
        { name: 'Pizzas Doces', order: 3, allowsMeiaMeia: true, meiaMeiaGroup: 'doce' },
      ]
      for (const cat of categorias) {
        await setDoc(doc(db, 'stores', store.id, 'categories', cat.name.toLowerCase().replace(/\s+/g, '-')), {
          ...cat,
          slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
          storeId: store.id,
          createdAt: now,
          updatedAt: now,
        })
      }

      // Usuário admin da loja
      await setDoc(doc(db, 'users', result.user.uid), {
        storeId: store.id,
        name,
        username: email.split('@')[0],
        email,
        role: 'admin',
        active: true,
        createdAt: now,
        updatedAt: now,
      })

      navigate(`/${slug}/admin`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar cadastro'
      if (message.includes('email-already-in-use')) {
        setError('Este email já está cadastrado')
      } else {
        setError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold text-brand-white mb-6">
            <UtensilsCrossed className="text-accent" size={24} />
            Pizzas Mania
          </Link>
          <h1 className="text-2xl font-bold text-brand-white">Criar sua pizzaria</h1>
          <p className="text-muted text-sm mt-1">Cadastre uma nova pizzaria no Pizzas Mania</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-white">Nome da pizzaria</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => handleStoreNameChange(e.target.value)}
              placeholder="Ex: Pizzaria do Zé"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-brand-white placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-white">Link da pizzaria</label>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 focus-within:border-accent">
              <span className="text-muted text-sm shrink-0">minha-pizza.vercel.app/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                onBlur={checkSlug}
                placeholder="minha-pizzaria"
                className="flex-1 bg-transparent text-brand-white placeholder:text-muted focus:outline-none"
              />
              {checkingSlug ? (
                <Loader2 size={16} className="animate-spin text-muted" />
              ) : slugAvailable === true ? (
                <span className="text-green-400 text-xs">Disponível</span>
              ) : slugAvailable === false ? (
                <span className="text-red-500 text-xs">Em uso</span>
              ) : null}
            </div>
            {slugAvailable === false && (
              <p className="text-xs text-red-400">Este link já está em uso</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-white">WhatsApp</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 99999-8888"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-brand-white placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <hr className="border-border" />

          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-white">Seu nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-brand-white placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-white">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-brand-white placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-white">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-brand-white placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full gap-2" disabled={submitting}>
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? 'Criando...' : 'Criar pizzaria'}
          </Button>

          <p className="text-center text-sm text-muted">
            Já tem conta?{' '}
            <Link to="/auth/login" className="text-accent hover:underline">Entrar</Link>
          </p>
        </form>
      </div>
    </div>
  )
}