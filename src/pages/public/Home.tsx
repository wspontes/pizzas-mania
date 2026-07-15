import { Link } from 'react-router-dom'
import { ArrowRight, ChefHat, Clock, Bike, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'
import { ProductCard, ProductCardSkeleton, BannerSkeleton } from '@/components/shared'
import { useFeaturedProducts, useSettings } from '@/hooks'
import { formatCurrency } from '@/utils'

const benefits = [
  { icon: ChefHat, text: 'Ingredientes selecionados' },
  { icon: Clock, text: 'Pronto em até 30 min' },
  { icon: Bike, text: 'Entrega gratuita*' },
]

export default function Home() {
  const { products: featured, loading: featuredLoading } = useFeaturedProducts()
  const { settings, loading: settingsLoading } = useSettings()

  const banner = settings?.banner
  const minOrder = settings?.minOrder ?? 25

  const alignClass = banner?.align === 'center' ? 'items-center text-center' : banner?.align === 'right' ? 'items-end text-right' : 'items-start text-left'

  if (settingsLoading) return (
    <div className="container mx-auto px-4 py-8">
      <BannerSkeleton />
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <section className={`relative mb-12 overflow-hidden rounded-2xl bg-gradient-to-br from-accent/20 via-surface to-surface p-8 md:p-12 flex flex-col ${alignClass}`}>
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-16 -translate-y-16 rounded-full bg-accent/10 blur-3xl" />
        {banner?.image && (
          <img src={banner.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        )}
        <div className={`relative z-10 ${banner?.align === 'center' ? '' : 'max-w-xl'}`}>
          {banner?.active !== false && (
            <div className={`mb-4 inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent ${banner?.align === 'center' ? 'mx-auto' : ''}`}>
              <Sparkles size={14} />
              Pedido mínimo {formatCurrency(minOrder)}
            </div>
          )}
          <h1 className="text-3xl font-bold leading-tight text-white md:text-5xl">
            {banner?.title || 'A melhor pizza\nda cidade'}
          </h1>
          <p className="mt-4 text-base text-muted md:text-lg">
            {banner?.subtitle || 'Massa artesanal, ingredientes frescos e o sabor que só a Pizzas Mania tem.'}
          </p>
          <div className={`mt-6 flex flex-wrap gap-3 ${banner?.align === 'center' ? 'justify-center' : banner?.align === 'right' ? 'justify-end' : ''}`}>
            <Link to="/cardapio">
              <Button size="lg">
                Ver Cardápio
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
        <div className={`mt-8 flex gap-6 ${banner?.align === 'center' ? 'justify-center' : banner?.align === 'right' ? 'justify-end' : ''}`}>
          {benefits.map((benefit) => (
            <div key={benefit.text} className="flex items-center gap-2 text-sm text-muted">
              <benefit.icon size={16} className="text-accent" />
              {benefit.text}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Mais Pedidos</h2>
          <Link
            to="/cardapio"
            className="flex items-center gap-1 text-sm text-accent transition-colors hover:text-red-400"
          >
            Ver tudo <ArrowRight size={14} />
          </Link>
        </div>

        {featuredLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-muted">Em breve novidades no cardápio!</p>
          </div>
        )}
      </section>
    </div>
  )
}
