import { UtensilsCrossed } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold text-white">
              <UtensilsCrossed className="text-accent" size={20} />
              Pizzas Mania
            </div>
            <p className="mt-2 text-sm text-muted">
              A melhor pizza da cidade, feita com ingredientes selecionados e muito amor.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Horários</h4>
            <div className="space-y-1 text-sm text-muted">
              <p>Seg - Qui: 18h às 23h</p>
              <p>Sex - Sáb: 18h às 00h</p>
              <p>Dom: 18h às 22h</p>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Contato</h4>
            <div className="space-y-1 text-sm text-muted">
              <p>WhatsApp: (11) 99999-9999</p>
              <p>contato@pizzasmania.com.br</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted">
          &copy; {new Date().getFullYear()} Pizzas Mania. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
