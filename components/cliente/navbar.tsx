'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, MapPin, Search, ShoppingCart, User } from 'lucide-react'
import { SEDES, type Sede } from '@/lib/store-data'
import { useStore } from '@/components/store-provider'
import { ModeToggle } from '@/components/shared'

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/#ofertas', label: 'Ofertas' },
  { href: '/#titulo-productos', label: 'Productos' },
  { href: '/carrito', label: 'Mi carrito' },
]

export function Navbar() {
  const { search, setSearch, cartCount, sede, setSede, user, openAuth, logout, showToast } = useStore()
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSearch = (value: string) => {
    setSearch(value)
    if (pathname !== '/') router.push('/#titulo-productos')
  }

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 lg:flex-nowrap lg:gap-6">
        <Link href="/" className="flex items-center gap-2" aria-label="La Cosmina, inicio">
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand-yellow text-lg font-black text-primary">
            C
          </span>
          <span className="text-xl font-black tracking-tight">
            La <span className="text-brand-yellow">Cosmina</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2 lg:order-last">
          <ModeToggle />
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-full p-1.5 hover:bg-white/15"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-yellow text-sm font-black text-brand-yellow-foreground">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </span>
                <span className="hidden text-left text-sm font-medium leading-tight xl:block">
                  Hola,
                  <br />
                  <span className="font-bold">{user.firstName}</span>
                </span>
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-border bg-card p-2 text-card-foreground shadow-xl"
                >
                  <div className="border-b border-border px-3 pb-2 pt-1">
                    <p className="font-bold">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      logout()
                      setMenuOpen(false)
                      showToast('Sesión cerrada')
                    }}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-muted"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="flex items-center gap-2 rounded-full p-2 hover:bg-white/15"
              aria-label="Iniciar sesión o registrarse"
            >
              <User className="size-6" />
              <span className="hidden text-left text-sm font-medium leading-tight xl:block">
                Hola,
                <br />
                <span className="font-bold">Inicia sesión</span>
              </span>
            </button>
          )}
          <Link
            href="/carrito"
            className="relative rounded-full p-2 hover:bg-white/15"
            aria-label={`Ir al carrito, ${cartCount} productos`}
          >
            <ShoppingCart className="size-6" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-brand-yellow px-1 text-xs font-bold text-brand-yellow-foreground">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        <div className="relative order-last w-full lg:order-none lg:flex-1">
          <label htmlFor="buscar" className="sr-only">
            Buscar productos
          </label>
          <input
            id="buscar"
            type="search"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="¿Qué estás buscando hoy?"
            className="h-11 w-full rounded-full bg-white pl-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-yellow"
          />
          <span className="absolute right-1 top-1 flex size-9 items-center justify-center rounded-full bg-brand-yellow text-brand-yellow-foreground">
            <Search className="size-4" aria-hidden="true" />
          </span>
        </div>
      </div>

      <div className="bg-[oklch(0.48_0.2_27)]">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-sm">
          <nav aria-label="Principal" className="mr-4 hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? 'page' : undefined}
                className="rounded-md px-2.5 py-1 font-semibold hover:bg-white/15 aria-[current=page]:bg-white/20"
              >
                {label}
              </Link>
            ))}
          </nav>
          <MapPin className="size-4 text-brand-yellow" aria-hidden="true" />
          <label htmlFor="sede" className="hidden sm:inline">
            Recoger en:
          </label>
          <select
            id="sede"
            value={sede}
            onChange={(e) => setSede(e.target.value as Sede)}
            className="cursor-pointer rounded-md bg-transparent py-0.5 pr-1 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-yellow [&>option]:text-foreground"
          >
            {SEDES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className="ml-auto hidden text-white/85 xl:inline">Delivery gratis por compras mayores a S/ 99</span>
        </div>
      </div>
    </header>
  )
}
