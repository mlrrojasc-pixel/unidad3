'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  ShoppingBasket,
  Trash2,
  UserRound,
  CalendarDays,
  Snowflake
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, sedeShort } from '@/lib/store-data'
import { useStore } from '@/components/store-provider'
import { PaymentSection, type ConfirmedOrder } from '@/components/cliente/payment-section'
import { Modal } from '@/components/shared'

export function CartPage() {
  const { cart, cartCount, cartTotal, updateQty, clearCart, sede, unavailableCount } = useStore()
  const [confirmed, setConfirmed] = useState<ConfirmedOrder | null>(null)

  const procesarYGuardarPedido = async (orden: ConfirmedOrder) => {
    setConfirmed(orden)
  }
          
  if (confirmed) {
    const enlaceTypebot = `https://typebot.co/la-cosmina-bot-8f1rul7`

    return (
      <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-12 text-center">
        <div className="flex size-24 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="size-12 text-success" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-black">¡Gracias por tu compra, {confirmed.customer.split(' ')[0]}!</h1>
        <p className="mt-2 font-medium text-foreground">
          Tu pedido <span className="font-bold text-primary">{confirmed.orderId}</span> se registró exitosamente.
        </p>
        <dl className="mt-6 w-full space-y-2 rounded-2xl border border-border p-5 text-left text-sm">
          <Row label="N.° de pedido" value={confirmed.orderId} strong />
          <Row label="A nombre de" value={confirmed.customer} />
          <Row label="Recojo en" value={confirmed.sede} />
          <Row label="Horario de recojo" value={confirmed.pickupTime} />
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

        <div className="mt-8 flex w-full flex-col gap-3">
          <p className="text-sm font-bold text-muted-foreground">
            Envía únicamente tu ID de tu pedido por Typebot para recibir tu código QR de recojo:
          </p>
          <a
            href={enlaceTypebot}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-14 w-full items-center justify-center rounded-xl bg-[#FF6B00] px-8 text-lg font-black text-white shadow-lg transition-transform hover:scale-[1.01]"
          >
            Enviar mi ID ({confirmed.orderId}) por Typebot
          </a>
          <Link
            href="/"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border-2 border-border font-bold text-muted-foreground hover:border-primary hover:text-primary"
          >
            Volver a la tienda
          </Link>
        </div>

        <CustomerOrdersAndComplaints />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Seguir comprando
      </Link>

      {cart.length === 0 ? (
        <div className="mx-auto flex max-w-xl flex-col items-center py-12 text-center">
          <div className="flex size-28 items-center justify-center rounded-full bg-brand-yellow/30">
            <ShoppingBasket className="size-12 text-primary" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-black">Tu carrito está vacío</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Explora nuestras ofertas o revisa el seguimiento de tus pedidos abajo.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-7 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            Ver catálogo de productos
          </Link>
        </div>
      ) : (
        <>
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
            Disponibilidad según <span className="font-semibold text-foreground">{sede}</span>.
          </p>

          {unavailableCount > 0 && (
            <div role="status" className="mt-4 flex gap-3 rounded-xl border border-brand-yellow bg-brand-yellow/15 p-4 text-sm">
              <AlertTriangle className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <p>
                <span className="font-bold">
                  {unavailableCount} {unavailableCount === 1 ? 'producto está agotado' : 'productos están agotados'} en{' '}
                  {sedeShort(sede)}.
                </span>{' '}
                Acepta la sustitución automática, elimínalos o cambia de sede.
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
                          >
                            <Minus className="size-4" />
                          </button>
                          <span className="w-8 text-center font-bold">{qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(product.id, 1)}
                            disabled={!available}
                            className="flex size-9 items-center justify-center rounded-full hover:bg-muted disabled:opacity-40"
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
        </>
      )}

      <CustomerOrdersAndComplaints />
    </main>
  )
}

function CustomerOrdersAndComplaints() {
  const { user, orders, completedOrders, deliveredOrders, showToast } = useStore()

  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [orderToReschedule, setOrderToReschedule] = useState<any>(null)
  const [newTime, setNewTime] = useState('')

  const allOrders = [
    ...orders.map((o) => ({ ...o, statusLabel: 'En preparación en tienda', statusTone: 'bg-brand-yellow/20 text-foreground', substitutionNote: undefined })),
    ...completedOrders.map((o) => ({ ...o, statusLabel: 'Listo para recoger', statusTone: 'bg-success/15 text-success' })),
    ...deliveredOrders.map((o) => ({ ...o, statusLabel: 'Entregado al cliente', statusTone: 'bg-primary/15 text-primary' })),
  ]

  const myOrders = user
    ? allOrders.filter((o) => o.customer.toLowerCase() === `${user.firstName} ${user.lastName}`.toLowerCase())
    : []

  const openRescheduleModal = (order: any) => {
    setOrderToReschedule(order)
    setIsRescheduleModalOpen(true)
    setNewTime('')
  }

  const submitReschedule = async () => {
    if (!orderToReschedule || !newTime) return;

    try {
      await fetch(`https://sheetdb.io/api/v1/212ws65v1sffv/ID%20de%20Pedido/${orderToReschedule.id}`, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            'Horario de Recojo': newTime
          }
        })
      });
      showToast(`El pedido ${orderToReschedule.id} fue reprogramado con éxito.`);
      setIsRescheduleModalOpen(false);
    } catch (error) {
      console.error('Error reprogramando', error);
      showToast('Error al conectar con la base de datos.');
    }
  }

  return (
    <div className="mt-12 grid w-full gap-8 border-t border-border pt-10 text-left lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2.5">
          <PackageCheck className="size-6 text-primary" />
          <h2 className="text-xl font-black">Seguimiento de Mis Pedidos</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Consulta en tiempo real si tu pedido está en preparación, listo en tienda o ya fue entregado.
        </p>

        {!user ? (
          <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            <UserRound className="mx-auto size-8 opacity-50" />
            <p className="mt-2 font-semibold">Inicia sesión para ver tus pedidos</p>
          </div>
        ) : myOrders.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            <Clock className="mx-auto size-8 opacity-50" />
            <p className="mt-2 font-semibold">Aún no tienes pedidos registrados</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {myOrders.map((o) => {
              const hasFrozenItems = o.items.some((item: any) => 
                item.name.toLowerCase().includes('congelado') || 
                item.name.toLowerCase().includes('helado') ||
                item.name.toLowerCase().includes('hielo') ||
                item.name.toLowerCase().includes('carne')
              );

              return (
                <li key={o.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-lg font-black text-primary">{o.id}</span>
                      <span className="ml-2 text-xs text-muted-foreground">· {o.sede}</span>
                    </div>
                    <span className={cn('rounded-full px-3 py-1 text-xs font-bold', o.statusTone)}>
                      {o.statusLabel}
                    </span>
                  </div>
                  
                  <div className="mt-2 mb-3 flex items-center justify-between border-b border-border pb-3">
                    <p className="text-sm font-semibold text-foreground">
                      Horario actual: <span className="text-primary">{o.pickupTime || 'No especificado'}</span>
                    </p>
                    {o.statusLabel === 'En preparación en tienda' && (
                      <button 
                        onClick={() => openRescheduleModal({ ...o, hasFrozenItems })}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        <CalendarDays className="size-3.5" /> Reprogramar
                      </button>
                    )}
                  </div>

                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {o.items.map((item: any, idx: number) => (
                      <li key={idx}>
                        {item.qty}x {item.name} — {formatPrice(item.price * item.qty)}
                      </li>
                    ))}
                  </ul>
                  {o.substitutionNote && (
                    <p className="mt-2 rounded-lg bg-brand-yellow/15 px-3 py-1.5 text-xs font-medium">
                      <strong>Sustitución realizada:</strong> {o.substitutionNote}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2.5">
          <BookOpen className="size-6 text-primary" />
          <h2 className="text-xl font-black">Libro de Reclamaciones y Reembolsos</h2>
        </div>
        <p className="mb-6 mt-1 text-xs text-muted-foreground">
          ¿Inconformidad con un producto? Solicita tu reembolso y adjunta evidencia fotográfica para procesar tu caso.
        </p>

        <div className="w-full overflow-hidden rounded-xl border border-border bg-muted/10">
          <iframe 
            src="https://docs.google.com/forms/d/e/1FAIpQLSfvna-5SzBK5PVUmqPcL5r0F6DyASLLI1mN9UHjWYrO7pvznw/viewform?embedded=true" 
            width="100%" 
            height="900" 
            frameBorder="0"
            marginHeight={0}
            marginWidth={0}
          >
            Cargando Libro de Reclamaciones...
          </iframe>
        </div>
      </section>

      {isRescheduleModalOpen && orderToReschedule && (
        <Modal 
          open={isRescheduleModalOpen} 
          onClose={() => setIsRescheduleModalOpen(false)} 
          title={`Reprogramar Pedido ${orderToReschedule.id}`}
          className="max-w-md bg-card"
        >
          <div className="p-6">
            <p className="mb-4 text-sm text-muted-foreground">
              Seleccione el nuevo horario en el que desea recoger su pedido. 
              <br/>Horario original: <strong>{orderToReschedule.pickupTime}</strong>
            </p>

            {orderToReschedule.hasFrozenItems && (
              <div className="mb-5 rounded-xl border border-destructive/50 bg-destructive/10 p-4">
                <p className="flex items-center gap-2 text-sm font-black text-destructive">
                  <Snowflake className="size-5" /> ¡Atención! Contiene productos congelados
                </p>
                <p className="mt-1 text-xs font-medium text-destructive-foreground">
                  Su pedido contiene alimentos perecibles (carnes, helados). Al retrasar su recojo, nuestro personal deberá retornar sus productos a las cámaras frigoríficas. Asegúrese de llegar en su nuevo horario para no perder la cadena de frío.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted">
                <span className="text-sm font-bold">Mañana (08:00 - 12:00)</span>
                <input 
                  type="radio" 
                  name="schedule" 
                  value="Mañana (08:00 - 12:00)"
                  checked={newTime === "Mañana (08:00 - 12:00)"}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="size-4 accent-primary" 
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted">
                <span className="text-sm font-bold">Tarde (13:00 - 17:00)</span>
                <input 
                  type="radio" 
                  name="schedule" 
                  value="Tarde (13:00 - 17:00)"
                  checked={newTime === "Tarde (13:00 - 17:00)"}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="size-4 accent-primary" 
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted">
                <span className="text-sm font-bold">Noche (18:00 - 22:00)</span>
                <input 
                  type="radio" 
                  name="schedule" 
                  value="Noche (18:00 - 22:00)"
                  checked={newTime === "Noche (18:00 - 22:00)"}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="size-4 accent-primary" 
                />
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setIsRescheduleModalOpen(false)}
                className="flex-1 rounded-xl border border-border bg-transparent py-3 text-sm font-bold text-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={submitReschedule}
                disabled={!newTime || newTime === orderToReschedule.pickupTime}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50 transition-opacity"
              >
                Confirmar Horario
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
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
