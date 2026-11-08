'use client'

import Link from 'next/link'
import { Navbar } from '@/components/cliente/navbar'
import { LoginModal } from '@/components/cliente/login-modal'

export function TiendaShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex-1">{children}</div>

      <footer className="mt-10 bg-foreground text-background">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-4">
          <div>
            <p className="text-xl font-black">
              La <span className="text-brand-yellow">Cosmina</span>
            </p>
            <p className="mt-2 text-sm opacity-70">Tu supermercado de confianza, cerca de casa.</p>
          </div>
          <nav aria-label="Tienda" className="flex flex-col gap-1 text-sm">
            <p className="font-bold">Tienda</p>
            <Link href="/" className="opacity-70 hover:opacity-100">
              Inicio
            </Link>
            <Link href="/#titulo-productos" className="opacity-70 hover:opacity-100">
              Productos
            </Link>
            <Link href="/carrito" className="opacity-70 hover:opacity-100">
              Mi carrito
            </Link>
          </nav>
          <div className="text-sm">
            <p className="font-bold">Atención al cliente</p>
            <p className="mt-1 opacity-70">Central: (01) 615-0000</p>
            <p className="opacity-70">ayuda@lacosmina.pe</p>
          </div>
          <div className="text-sm">
            <p className="font-bold">Información</p>
            <p className="mt-1 opacity-70">Libro de reclamaciones</p>
            <p className="opacity-70">Términos y condiciones</p>
          </div>
        </div>
        <p className="border-t border-background/10 py-4 text-center text-xs opacity-60">
          © 2026 La Cosmina S.A.C. Todos los derechos reservados.
        </p>
      </footer>

      <LoginModal />
    </div>
  )
}
