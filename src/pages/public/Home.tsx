import { Link } from 'react-router-dom'
import { ArrowRight, ChefHat, Clock, Bike, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'
import { ProductCard, ProductCardSkeleton } from '@/components/shared'
import { useFeaturedProducts, useSettings } from '@/hooks'
import { formatCurrency } from '@/utils'

const benefits = [
  { icon: ChefHat, text: 'Ingredientes selecionados' },
  { icon: Clock, text: 'Pronto em até 30 min' },
  { icon: Bike, text: 'Entrega gratuita*' },
]

export default function Home() {
  const { products: featured, loading: featuredLoading } = useFeaturedProducts()
  const { settings } = useSettings()

  const banner = settings?.banner
  const minOrder = settings?.minOrder ?? 25
  const alignClass = banner?.align === 'center' ? 'items-center text-center' : banner?.align === 'right' ? 'items-end text-right' : 'items-start text-left'

  return (
    <div className="container mx-auto px-4 py-6">
      <section className={`relative mb-10 overflow-hidden rounded-2xl bg-gradient-to-br from-accent/20 via-surface to-surface p-6 md:p-12 flex flex-col ${alignClass}`}>
        <div className="absolute right-0 top-0 h-48 w-48 md:h-64 md:w-64 translate-x-12 -translate-y-12 rounded-full bg-accent/10 blur-3xl" />
        {banner?.image && (
          <img src={banner.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        )}
        <div className={`relative z-10 ${banner?.align === 'center' ? '' : 'max-w-xl'}`}>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] md:text-xs font-medium text-accent mb-3">
            <Sparkles size={12} />
            Pedido mínimo {formatCurrency(minOrder)}
          </div>
          <h1 className="text-xl md:text-5xl font-bold leading-tight text-white">
            {banner?.title || 'A melhor pizza\nda cidade'}
          </h1>
          <p className="mt-2 md:mt-4 text-sm md:text-lg text-muted">
            {banner?.subtitle || 'Massa artesanal, ingredientes frescos e o sabor que só a Pizzas Mania tem.'}
          </p>
          <div className={`mt-4 md:mt-6 flex flex-wrap gap-3 ${banner?.align === 'center' ? 'justify-center' : banner?.align === 'right' ? 'justify-end' : ''}`}>
            <Link to="/cardapio">
              <Button size="lg">
                Ver Cardápio
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
        <div className={`mt-6 md:mt-8 flex gap-4 md:gap-6 ${banner?.align === 'center' ? 'justify-center' : banner?.align === 'right' ? 'justify-end' : ''}`}>
          {benefits.map((benefit) => (
            <div key={benefit.text} className="flex items-center gap-1.5 text-xs md:text-sm text-muted">
              <benefit.icon size={14} className="text-accent" />
              {benefit.text}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold text-white">Mais Pedidos</h2>
          <Link to="/cardapio" className="flex items-center gap-1 text-xs md:text-sm text-accent transition-colors hover:text-red-400">
            Ver tudo <ArrowRight size={14} />
          </Link>
        </div>

        {featuredLoading ? (
          <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
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
