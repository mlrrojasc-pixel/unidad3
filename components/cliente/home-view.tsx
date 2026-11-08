import { Clock, ShieldCheck, Store, Truck } from 'lucide-react'
import { CategoryFilters, ProductGrid } from '@/components/cliente/catalog'
import Image from 'next/image'

const BENEFITS = [
  { icon: Truck, title: 'Delivery en 90 min', text: 'En Lima Metropolitana' },
  { icon: Store, title: 'Recojo gratis', text: 'En cualquiera de nuestras 5 sedes' },
  { icon: ShieldCheck, title: 'Pago seguro', text: 'Tarjeta, Yape o Plin' },
  { icon: Clock, title: 'Abierto todos los días', text: 'De 7:00 a. m. a 11:00 p. m.' },
]

export function HomeView() {
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6">
      <section id="ofertas" className="grid scroll-mt-32 gap-4 lg:grid-cols-3" aria-label="Ofertas destacadas">
        <div className="flex flex-col justify-between gap-6 overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground md:flex-row md:items-center md:p-8 lg:col-span-2">
          <div className="max-w-sm">
            <span className="inline-block rounded-full bg-brand-yellow px-3 py-1 text-xs font-black uppercase text-brand-yellow-foreground">
              Solo por esta semana
            </span>
            <h1 className="mt-3 text-3xl font-black leading-tight text-balance md:text-4xl">
              Ofertas que llenan tu canasta
            </h1>
            <p className="mt-2 text-white/85">Hasta 40% de descuento en abarrotes, limpieza y electro.</p>
            <a
              href="#titulo-productos"
              className="mt-5 inline-flex h-11 items-center rounded-full bg-brand-yellow px-6 font-bold text-brand-yellow-foreground hover:brightness-95"
            >
              Ver ofertas
            </a>
          </div>
          <Image
            src="/banners/hero.png"
            alt="Canasta con productos de supermercado en oferta"
            width={520}
            height={390}
            priority
            className="aspect-[4/3] w-full rounded-xl object-cover md:w-72"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="flex items-center gap-4 rounded-2xl bg-brand-yellow p-5 text-brand-yellow-foreground">
            <div className="flex-1">
              <p className="text-xs font-bold uppercase">Congelados</p>
              <p className="text-xl font-black leading-tight">2x1 en helados</p>
            </div>
            <Image src="/banners/helados.png" alt="Helados en promoción" width={160} height={160} className="size-20 rounded-xl object-cover" />
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-muted p-5">
            <div className="flex-1">
              <p className="text-xs font-bold uppercase text-primary">Electro</p>
              <p className="text-xl font-black leading-tight">Hasta 24% dscto.</p>
            </div>
            <Image src="/banners/electro.png" alt="Electrodomésticos con descuento" width={160} height={160} className="size-20 rounded-xl object-cover" />
          </div>
        </div>
      </section>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {BENEFITS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-center gap-3 rounded-xl border border-border p-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight">{title}</p>
              <p className="truncate text-xs text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ul>

      <CategoryFilters />
      <ProductGrid />
    </main>
  )
}
