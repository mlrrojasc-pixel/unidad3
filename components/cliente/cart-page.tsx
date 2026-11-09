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
  MessageSquareWarning,
  Minus,
  PackageCheck,
  Plus,
  ShoppingBasket,
  Trash2,
  ImageIcon,
  UserRound,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, sedeShort } from '@/lib/store-data'
import { useStore, type Complaint } from '@/components/store-provider'
import { PaymentSection, type ConfirmedOrder } from '@/components/cliente/payment-section'

// CAMBIA AQUÍ TU NÚMERO PERSONAL CON EL 51 DELANTE
const NUMERO_WHATSAPP = '51987654321'

export function CartPage() {
  const { cart, cartCount, cartTotal, updateQty, clearCart, sede, unavailableCount } = useStore()
  const [confirmed, setConfirmed] = useState<ConfirmedOrder | null>(null)

  const procesarYGuardarPedido = async (orden: ConfirmedOrder) => {
    setConfirmed(orden)

    try {
      await fetch('https://sheetdb.io/api/v1/5f2glnefammpr', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
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
              'Código QR': '',
            },
          ],
        }),
      })
    } catch (error) {
      console.error('Error al conectar con Excel', error)
    }
  }

  if (confirmed) {
    // SOLO ENVÍA EL ID PORQUE EL EXCEL YA TIENE SU NOMBRE Y HORARIO
    const mensajeCorto = `Hola La Cosmina, mi ID de pedido es ${confirmed.orderId}. Solicito mi código de seguridad.`
    const enlaceWhatsApp = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensajeCorto)}`

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
            Envía únicamente tu ID por WhatsApp para recibir tu código QR de recojo:
          </p>
          <a
            href={enlaceWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-14 w-full items-center justify-center rounded-xl bg-[#25D366] px-8 text-lg font-black text-white shadow-lg transition-transform hover:scale-[1.01]"
          >
            Enviar mi ID ({confirmed.orderId}) por WhatsApp
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
  const { user, orders, completedOrders, deliveredOrders, addComplaint, complaints, openAuth } = useStore()
  const [complaintOrderId, setComplaintOrderId] = useState('')
  const [complaintType, setComplaintType] = useState<Complaint['type']>('Reembolso')
  const [complaintDetail, setComplaintDetail] = useState('')
  const [complaintImage, setComplaintImage] = useState<string>('')
  const [sentSuccess, setSentSuccess] = useState(false)

  // Unimos todos los pedidos con su estado actual
  const allOrders = [
    ...orders.map((o) => ({ ...o, statusLabel: 'En preparación en tienda', statusTone: 'bg-brand-yellow/20 text-foreground', substitutionNote: undefined })),
    ...completedOrders.map((o) => ({ ...o, statusLabel: 'Listo para recoger', statusTone: 'bg-success/15 text-success' })),
    ...deliveredOrders.map((o) => ({ ...o, statusLabel: 'Entregado al cliente', statusTone: 'bg-primary/15 text-primary' })),
  ]

  // Solo cargar los pedidos si el usuario inició sesión
  const myOrders = user
    ? allOrders.filter((o) => o.customer.toLowerCase() === `${user.firstName} ${user.lastName}`.toLowerCase())
    : []

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setComplaintImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!complaintDetail.trim() || !user) return
    const targetOrder = complaintOrderId.trim() || myOrders[0]?.id || 'Sin ID'
    addComplaint({
      orderId: targetOrder,
      customer: `${user.firstName} ${user.lastName}`,
      email: user.email,
      type: complaintType,
      detail: complaintDetail.trim(),
      image: complaintImage,
    })
    setComplaintDetail('')
    setComplaintImage('')
    setSentSuccess(true)
    setTimeout(() => setSentSuccess(false), 4000)
  }

  const wspQuejaMsg = `Hola La Cosmina, deseo presentar un reclamo / solicitar reembolso sobre mi pedido ${complaintOrderId || myOrders[0]?.id || ''}.`
  const wspQuejaUrl = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(wspQuejaMsg)}`

  return (
    <div className="mt-12 grid w-full gap-8 border-t border-border pt-10 text-left lg:grid-cols-2">
      {/* 1. SEGUIMIENTO DE PEDIDOS */}
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
            {myOrders.map((o) => (
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
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {o.items.map((item, idx) => (
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
            ))}
          </ul>
        )}
      </section>

      {/* 2. LIBRO DE RECLAMACIONES Y REEMBOLSOS (WEB + WHATSAPP) */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2.5">
          <BookOpen className="size-6 text-primary" />
          <h2 className="text-xl font-black">Libro de Reclamaciones y Reembolsos</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          ¿Inconformidad con un producto? Solicita tu reembolso y adjunta evidencia fotográfica.
        </p>

        {!user ? (
          <div className="mt-6 rounded-xl border border-border bg-muted/30 p-6 text-center">
            <ShieldAlert className="mx-auto size-8 text-muted-foreground opacity-50" />
            <p className="mt-3 text-sm font-bold text-foreground">Inicia sesión para presentar un reclamo</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Por normativa de seguridad, los reclamos y reembolsos deben estar asociados a la cuenta del titular.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => openAuth('login')}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground hover:opacity-90"
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => openAuth('register')}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-bold hover:border-primary hover:text-primary"
              >
                Crear cuenta
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleComplaintSubmit} className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold">ID de Pedido</label>
                <input
                  type="text"
                  placeholder={myOrders[0]?.id ?? 'Ej: LC-12345'}
                  value={complaintOrderId}
                  onChange={(e) => setComplaintOrderId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold">Motivo</label>
                <select
                  value={complaintType}
                  onChange={(e) => setComplaintType(e.target.value as Complaint['type'])}
                  className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="Reembolso">Solicitar Reembolso</option>
                  <option value="Producto en mal estado">Producto o sustitución incorrecta</option>
                  <option value="Queja de servicio">Demora o atención en tienda</option>
                  <option value="Sugerencia">Sugerencia de mejora</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold">Detalle del reclamo o reembolso</label>
              <textarea
                required
                rows={3}
                placeholder="Describe el motivo de tu solicitud de reembolso o queja..."
                value={complaintDetail}
                onChange={(e) => setComplaintDetail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background p-3 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold">Evidencia fotográfica (Opcional)</label>
              <div className="mt-1 flex items-center gap-3">
                <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 text-sm font-semibold hover:bg-muted/50">
                  <ImageIcon className="size-4" />
                  {complaintImage ? 'Cambiar foto' : 'Subir imagen'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                {complaintImage && (
                  <span className="text-xs font-bold text-success flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Foto adjunta
                  </span>
                )}
              </div>
            </div>

            {sentSuccess && (
              <p className="rounded-lg bg-success/15 px-3 py-2 text-xs font-bold text-success">
                ✓ Tu solicitud y evidencia fueron enviadas al área de Administración.
              </p>
            )}

            <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90"
              >
                <BookOpen className="size-4" />
                Enviar Reclamo en Web
              </button>
              <a
                href={wspQuejaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white hover:opacity-90"
              >
                <MessageSquareWarning className="size-4" />
                Reclamar por WhatsApp
              </a>
            </div>
          </form>
        )}

        {user && complaints.length > 0 && (
          <div className="mt-6 border-t border-border pt-5">
            <p className="text-xs font-bold uppercase text-muted-foreground">Estado de Mis Tickets</p>
            <ul className="mt-3 space-y-3">
              {complaints.filter(c => c.customer.toLowerCase() === `${user.firstName} ${user.lastName}`.toLowerCase()).map((c) => (
                <li key={c.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-black text-primary">{c.id}</span> · Pedido <strong>{c.orderId}</strong>
                    </div>
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                      {c.type}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{c.detail}</p>
                  
                  {/* Respuesta del Administrador visible para el cliente */}
                  {c.resolutionStatus && (
                    <div className={cn("mt-3 rounded-lg border p-3 text-xs", c.resolutionStatus === 'Aprobado' ? 'border-success/30 bg-success/10 text-success-foreground' : 'border-destructive/30 bg-destructive/10 text-destructive-foreground')}>
                      <p className={cn("font-black uppercase", c.resolutionStatus === 'Aprobado' ? 'text-success' : 'text-destructive')}>
                        {c.resolutionStatus === 'Aprobado' ? 'Reembolso Aprobado' : 'Reclamo Rechazado'}
                      </p>
                      <p className="mt-1 font-medium">{c.resolutionText}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
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
