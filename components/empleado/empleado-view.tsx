'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Headphones, Package, PackageCheck, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/components/store-provider'
import { ModeToggle } from '@/components/shared'

const TABS = [
  { href: '/empleado', label: 'Pedidos', icon: ClipboardList },
  { href: '/empleado/inventario', label: 'Inventario', icon: Package },
  { href: '/empleado/reclamos', label: 'Reclamos', icon: ShieldAlert },
  { href: '/empleado/soporte', label: 'Soporte', icon: Headphones },
]

export function EmpleadoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { orders, readyCount, complaints, sede, startShift } = useStore()
  const current = TABS.find((t) => t.href === pathname) ?? TABS[0]

  useEffect(() => {
    startShift()
  }, [startShift])

  return (
    <div className="dark flex h-dvh flex-col bg-background text-foreground md:flex-row">
      <aside className="flex shrink-0 border-sidebar-border bg-sidebar md:w-56 md:flex-col md:border-r">
        <Link href="/empleado" className="hidden items-center gap-2 px-5 py-5 md:flex">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-lg font-black text-brand-yellow">
            C
          </span>
          <span className="leading-tight">
            <span className="block font-black">La Cosmina</span>
            <span className="block text-xs text-muted-foreground">Panel de tienda</span>
          </span>
        </Link>
        <nav aria-label="Secciones del panel" className="flex flex-1 gap-1 p-2 md:flex-col md:p-3">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = current.href === href
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-1 items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors md:flex-none md:justify-start',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
                
                {/* Globo contador de Pedidos */}
                {label === 'Pedidos' && orders.length > 0 && (
                  <span
                    className={cn(
                      'ml-auto rounded-full px-2 py-0.5 text-xs font-bold',
                      active ? 'bg-black/15' : 'bg-primary text-primary-foreground',
                    )}
                  >
                    {orders.length}
                  </span>
                )}
                
                {/* Globo contador de Reclamos */}
                {label === 'Reclamos' && complaints.length > 0 && (
                  <span
                    className={cn(
                      'ml-auto rounded-full px-2 py-0.5 text-xs font-bold',
                      active ? 'bg-black/15' : 'bg-brand-yellow text-brand-yellow-foreground',
                    )}
                  >
                    {complaints.length}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="hidden p-4 md:block">
          <div className="rounded-xl bg-secondary p-3 text-xs">
            <p className="text-muted-foreground">Sesión activa</p>
            <p className="font-semibold">Rosa Huamán · Picker</p>
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 md:px-6">
          <div>
            <h1 className="text-lg font-black">{current.label}</h1>
            <p className="text-xs text-muted-foreground">{sede}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-success/15 px-3 py-2 text-success">
              <PackageCheck className="size-5" aria-hidden="true" />
              <span className="text-sm font-semibold">
                Pedidos Listos: <span className="text-lg font-black tabular-nums">{readyCount}</span>
              </span>
            </div>
            <ModeToggle dark />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
