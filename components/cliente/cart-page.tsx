'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, CheckCircle2, MapPin, Minus, Plus, ShoppingBasket, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, sedeShort } from '@/lib/store-data'
import { useStore } from '@/components/store-provider'
import { PaymentSection, type ConfirmedOrder } from '@/components/cliente/payment-section'

export function CartPage() {
  const { cart, cartCount, cartTotal, updateQty, clearCart, sede, unavailableCount } = useStore()
  const [confirmed, setConfirmed] = useState<ConfirmedOrder | null>(null)

  const procesarYGuardarPedido = async (orden: ConfirmedOrder) => {
    // 1. Mostrar la pantalla de éxito en la web
    setConfirmed(orden)

    // 2. Enviar TODOS los datos a tu Google Sheet (vía SheetDB)
    try {
      await fetch('https://sheetdb.io/api/v1/5f2glnefammpr', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: [
            {
              'ID de Pedido': orden.orderId,
              'Cliente': orden.customer,
              'Celular': orden.phoneNumber, 
              'Horario de Recojo': orden.pickupTime,
              'Estado': 'Compra confirmada',
              'Sustitución': orden.substituted > 0 ? 'Aprobada' : 'Ninguna',
              'Reembolso': '-',
              'Calificación 1-5': '',
              'Código QR': ''
            }
          ]
        })
      })
    } catch (error) {
      console.error('Error al conectar con Excel', error)
    }
  }

  if (confirmed) {
    // AQUÍ PONES TU NÚMERO POR MIENTRAS (Mantén el 51 al inicio)
    const numeroBot = '51987654321' 
    
    // El sistema redacta todo el mensaje por el cliente automáticamente
    const mensajeAutomatico = `Hola La Cosmina, acabo de realizar una compra en la web.
ID del pedido: ${confirmed.orderId}
A nombre de: ${confirmed.customer}
Horario de recojo: ${confirmed.pickupTime}

Solicito mi código de seguridad, por favor.`

    const enlaceWhatsApp = `https://wa.me/${numeroBot}?text=${encodeURIComponent(mensajeAutomatico)}`

    return (
      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center">
        <div className="flex size-24 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="size-12 text-success" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-black">¡Gracias por tu compra, {confirmed.customer.split(' ')[0]}!</h1>
        <p className="mt-2 font-medium text-foreground">Tu pedido <span className="font-bold text-primary">{confirmed.orderId}</span> se registró exitosamente.</p>
        <dl className="mt-6 w-full space-y-2 rounded-2xl border border-border p-5 text-left text-sm">
          <Row label="N.° de pedido" value={confirmed.orderId} strong />
          <Row label="A nombre de" value={confirmed.customer} />
          <Row label="Recojo en" value={confirmed.sede} />
          <Row label="Método de pago" value={confirmed.payment} />
          {confirmed.substituted > 0 && (
            <Row
              label="Sustituciones"
              value={`${confirmed.substituted} ${confirmed.substituted === 1 ? 'producto' : 'productos'}`}
            />
          )}
          <div className="flex justify-between border-t border-border pt-2 text-base">
            <dt className="font-bold">Total pagado</dt>
            <dd className="font-black text-primary">{formatPrice(confirmed.total)}</dd>
          </div>
        </dl>
        
        <div className="mt-8 flex flex-col gap-4 w-full px-4 sm:px-0">
          <p className="text-sm font-bold text-muted-foreground">Último paso:</p>
          <a 
            href={enlaceWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-14 w-full items-center justify-center rounded-xl bg-[#25D366] px-8 text-lg font-black text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Recibir código por WhatsApp
          </a>
          <Link href="/" className="inline-flex h-12 w-full items-center justify-center rounded-xl border-2 border-border font-bold text-muted-foreground hover:border-primary hover:text-primary">
            Volver a la tienda
          </Link>
        </div>
      </main>
    )
  }

  if (cart.length === 0) {
    return (
      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center animate-in fade-in zoom-in-95">
        <div className="flex size-36 items-center justify-center rounded-full bg-brand-yellow/30">
          <div className="flex size-24 items-center justify-center rounded-full bg-brand-yellow/60">
            <ShoppingBasket className="size-14 text-primary" strokeWidth={1.5} aria-hidden="true" />
          </div>
        </div>
        <h1 className="mt-6 text-3xl font-black">Tu carrito está vacío</h1>
        <p className="mt-2 text-muted-foreground">Explora nuestras ofertas y agrega tus productos favoritos.</p>
        <Link
          href="/"
          className="mt-8 inline-flex h-12 items-center rounded-full bg-primary px-8 font-bold text-primary-foreground hover:opacity-90"
        >
          Seguir comprando
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Seguir comprando
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-black">
          Mi carrito <span className="text-muted-foreground">({cartCount})</span>
        </h1>
        <button
          type="button"
          onClick={clearCart}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-bold hover:border-primary hover:text-primary"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Vaciar carrito
        </button>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="size-4 text-primary" aria-hidden="true" />
        Disponibilidad según <span className="font-semibold text-foreground">{sede}</span>. Puedes cambiar la sede en
        “Recoger en”.
      </p>

      {unavailableCount > 0 && (
        <div role="status" className="mt-4 flex gap-3 rounded-xl border border-brand-yellow bg-brand-yellow/15 p-4 text-sm">
          <AlertTriangle className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <p>
            <span className="font-bold">
              {unavailableCount} {unavailableCount === 1 ? 'producto está agotado' : 'productos están agotados'} en{' '}
              {sedeShort(sede)}.
            </span>{' '}
            Para continuar, acepta la sustitución automática, elimínalos o cambia de sede.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
        <section aria-label="Productos en el carrito" className="rounded-2xl border border-border">
          <ul className="divide-y divide-border">
            {cart.map(({ product, qty, available }) => (
              <li key={product.id} className={cn('flex gap-4 p-4', !available && 'bg-primary/5')}>
                <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-white">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={160}
                    height={160}
                    className={cn('size-full object-contain p-1', !available && 'opacity-50 grayscale')}
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase text-muted-foreground">{product.brand}</p>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.unit} · {formatPrice(product.price)} c/u
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateQty(product.id, -qty)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary"
                      aria-label={`Eliminar ${product.name} del carrito`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  {!available && (
                    <span className="mt-1.5 w-fit rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                      Agotado en {sedeShort(sede)}
                    </span>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-border">
                      <button
                        type="button"
                        onClick={() => updateQty(product.id, -1)}
                        className="flex size-9 items-center justify-center rounded-full hover:bg-muted"
                        aria-label={`Disminuir ${product.name}`}
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="w-8 text-center font-bold">{qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(product.id, 1)}
                        disabled={!available}
                        className="flex size-9 items-center justify-center rounded-full hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Aumentar ${product.name}`}
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                    <span className="text-lg font-black">{formatPrice(product.price * qty)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-36 lg:self-start">
          <div className="rounded-2xl border border-border">
            <h2 className="border-b border-border px-5 py-4 text-lg font-black">Resumen y pago</h2>
            <dl className="mx-5 mt-5 space-y-1.5 rounded-xl bg-muted p-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal ({cartCount} productos)</dt>
                <dd className="font-semibold">{formatPrice(cartTotal)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Recojo en {sedeShort(sede)}</dt>
                <dd className="font-semibold text-success">Gratis</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base">
                <dt className="font-bold">Total</dt>
                <dd className="font-black text-primary">{formatPrice(cartTotal)}</dd>
              </div>
            </dl>
            <PaymentSection onPaid={procesarYGuardarPedido} />
          </div>
        </aside>
      </div>
    </main>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('text-right font-semibold', strong && 'font-black')}>{value}</dd>
    </div>
  )
}
