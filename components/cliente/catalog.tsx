'use client'

import Image from 'next/image'
import { Minus, Plus, SearchX } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CATEGORIES,
  SEDES,
  discountPercent,
  formatPrice,
  isAvailable,
  sedeShort,
  type Product,
} from '@/lib/store-data'
import { useStore } from '@/components/store-provider'

export function CategoryFilters() {
  const { category, setCategory } = useStore()
  return (
    <nav aria-label="Categorías" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
      <ul className="flex w-max gap-2">
        {CATEGORIES.map((c) => {
          const active = category === c
          return (
            <li key={c}>
              <button
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={active}
                className={cn(
                  'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card hover:border-primary hover:text-primary',
                )}
              >
                {c}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function ProductCard({ product }: { product: Product }) {
  const { addToCart, updateQty, qtyInCart, sede } = useStore()
  const qty = qtyInCart(product.id)
  const discount = discountPercent(product)
  const soldOut = !isAvailable(product, sede)
  const otherSedes = SEDES.filter((s) => s !== sede && product.stock[s]).length

  return (
    <article className="group flex flex-col rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-lg">
      <div className="relative overflow-hidden rounded-lg bg-white">
        <Image
          src={product.image}
          alt={`${product.name} ${product.brand}, ${product.unit}`}
          width={400}
          height={400}
          className={cn(
            'aspect-square w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105',
            soldOut && 'opacity-40 grayscale',
          )}
        />
        {discount > 0 && !soldOut && (
          <span className="absolute left-2 top-2 rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
            -{discount}%
          </span>
        )}
        {soldOut && (
          <span className="absolute left-2 top-2 rounded-md bg-foreground px-2 py-0.5 text-xs font-bold text-background">
            Agotado en {sedeShort(sede)}
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{product.brand}</p>
        <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-pretty">{product.name}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{product.unit}</p>
        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-primary">{formatPrice(product.price)}</span>
            {product.oldPrice && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.oldPrice)}</span>
            )}
          </div>
          {soldOut ? (
            <>
              <button
                type="button"
                disabled
                className="mt-2 h-10 w-full cursor-not-allowed rounded-lg bg-muted text-sm font-bold text-muted-foreground"
              >
                {qty > 0 ? `${qty} en carrito · Agotado` : 'Agotado'}
              </button>
              <p className="mt-1.5 text-center text-xs text-muted-foreground">
                {otherSedes > 0
                  ? `Disponible en ${otherSedes} ${otherSedes === 1 ? 'otra sede' : 'otras sedes'}`
                  : 'Sin stock en ninguna sede'}
              </p>
            </>
          ) : qty > 0 ? (
            <div className="mt-2 flex h-10 items-center justify-between rounded-lg bg-brand-yellow text-brand-yellow-foreground">
              <button
                type="button"
                onClick={() => updateQty(product.id, -1)}
                className="flex h-full w-10 items-center justify-center rounded-l-lg hover:bg-black/10"
                aria-label={`Quitar una unidad de ${product.name}`}
              >
                <Minus className="size-4" />
              </button>
              <span className="text-sm font-bold" aria-live="polite">
                {qty} en carrito
              </span>
              <button
                type="button"
                onClick={() => updateQty(product.id, 1)}
                className="flex h-full w-10 items-center justify-center rounded-r-lg hover:bg-black/10"
                aria-label={`Agregar una unidad de ${product.name}`}
              >
                <Plus className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => addToCart(product.id)}
              className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-brand-yellow text-sm font-bold text-brand-yellow-foreground transition-colors hover:brightness-95"
            >
              <Plus className="size-4" aria-hidden="true" />
              Agregar
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export function ProductGrid() {
  const { products, search, category, setSearch, setCategory } = useStore()
  const term = search.trim().toLowerCase()
  const filtered = products.filter(
    (p) =>
      (category === 'Todo' || p.category === category) &&
      (!term || p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term)),
  )

  return (
    <section aria-labelledby="titulo-productos">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 id="titulo-productos" className="text-xl font-black md:text-2xl">
          {category === 'Todo' ? 'Todos los productos' : category}
        </h2>
        <p className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
        </p>
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
          <SearchX className="size-10 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 font-semibold">No encontramos productos para “{search}”</p>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setCategory('Todo')
            }}
            className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground"
          >
            Ver todos los productos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  )
}
