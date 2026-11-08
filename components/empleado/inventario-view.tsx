'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MapPin, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SEDES, formatPrice, sedeShort, type Sede } from '@/lib/store-data'
import { useStore } from '@/components/store-provider'
import { Switch } from '@/components/shared'

export function InventarioView() {
  const { products, setStock, setStockAllSedes, sede: defaultSede } = useStore()
  const [sede, setSede] = useState<Sede>(defaultSede)
  const [query, setQuery] = useState('')
  const term = query.trim().toLowerCase()
  const rows = products.filter((p) => !term || `${p.name} ${p.brand}`.toLowerCase().includes(term))
  const outCount = products.filter((p) => !p.stock[sede]).length

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <MapPin className="size-4 text-primary" aria-hidden="true" />
          Inventario por sede
        </p>
        <div role="tablist" aria-label="Sede del inventario" className="flex flex-wrap gap-2">
          {SEDES.map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={sede === s}
              onClick={() => setSede(s)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                sede === s
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card hover:border-primary hover:text-primary',
              )}
            >
              {sedeShort(s)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total productos" value={products.length} />
        <Stat label={`Disponibles en ${sedeShort(sede)}`} value={products.length - outCount} tone="text-success" />
        <Stat label={`Agotados en ${sedeShort(sede)}`} value={outCount} tone="text-primary" />
      </div>

      <div className="relative max-w-sm">
        <label htmlFor="buscar-inventario" className="sr-only">
          Buscar en inventario
        </label>
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          id="buscar-inventario"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto o marca"
          className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-card text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Producto</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Precio</th>
              <th scope="col" className="px-4 py-3 font-semibold">Estado en {sedeShort(sede)}</th>
              <th scope="col" className="px-4 py-3 font-semibold">Todas las sedes</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Disponible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((p) => {
              const available = p.stock[sede]
              const allOut = SEDES.every((s) => !p.stock[s])
              return (
                <tr key={p.id} className="hover:bg-card/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Image src={p.image} alt="" width={40} height={40} className="size-10 rounded-md bg-white object-contain" />
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.brand} · {p.unit}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold',
                        available ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary',
                      )}
                    >
                      {available ? 'Disponible' : 'Agotado'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {SEDES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStock(p.id, s, !p.stock[s])}
                          title={`${s}: ${p.stock[s] ? 'Disponible' : 'Agotado'}`}
                          aria-label={`${p.name} en ${s}: ${p.stock[s] ? 'Disponible' : 'Agotado'}. Cambiar`}
                          className={cn(
                            'flex size-7 items-center justify-center rounded-md text-[11px] font-black transition-colors',
                            p.stock[s] ? 'bg-success/15 text-success hover:bg-success/25' : 'bg-primary/15 text-primary hover:bg-primary/25',
                            s === sede && 'ring-2 ring-foreground/40',
                          )}
                        >
                          {sedeShort(s).replace('Sede ', '')[0]}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setStockAllSedes(p.id, allOut)}
                        className="ml-1 whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        {allOut ? 'Reponer todas' : 'Agotar todas'}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Switch
                      checked={available}
                      onChange={(v) => setStock(p.id, sede, v)}
                      label={`${p.name} en ${sede}: ${available ? 'Disponible' : 'Agotado'}`}
                      className={cn(!available && 'bg-primary/50')}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        N = Norte, S = Sur, C = Centro, E = Este, O = Oeste. Haz clic en cada sede para alternar su disponibilidad.
      </p>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-2xl font-black tabular-nums', tone)}>{value}</p>
    </div>
  )
}
