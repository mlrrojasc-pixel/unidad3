'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Check,
  CheckCircle2,
  Inbox,
  QrCode,
  RefreshCw,
  ScanLine,
  Timer,
  Edit3,
  PackageCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, type Order } from '@/lib/store-data'
import { useStore } from '@/components/store-provider'
import { Modal } from '@/components/shared'

function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function remaining(order: Order, now: number) {
  return Math.round(((order.deadline ?? now + order.slaSeconds * 1000) - now) / 1000)
}

function formatTime(seconds: number) {
  const s = Math.abs(seconds)
  return `${seconds < 0 ? '-' : ''}${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function timerTone(seconds: number) {
  if (seconds <= 5 * 60) return 'text-primary'
  if (seconds <= 12 * 60) return 'text-brand-yellow'
  return 'text-success'
}

type EmployeeTab = 'pendientes' | 'listos' | 'entregados'

export function PedidosView() {
  const { orders, completedOrders, deliveredOrders, completeOrder, deliverOrder } = useStore()
  const now = useNow()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [validated, setValidated] = useState<Record<string, boolean>>({})
  const [picked, setPicked] = useState<Record<string, boolean>>({})

  const [activeTab, setActiveTab] = useState<EmployeeTab>('pendientes')
  const [substitutionNote, setSubstitutionNote] = useState('')

  const sorted = [...orders].sort((a, b) => remaining(a, now) - remaining(b, now))

  const selected =
    activeTab === 'pendientes'
      ? (orders.find((o) => o.id === selectedId) ?? sorted[0])
      : activeTab === 'listos'
        ? (completedOrders.find((o) => o.id === selectedId) ?? completedOrders[0])
        : activeTab === 'entregados'
          ? (deliveredOrders.find((o) => o.id === selectedId) ?? deliveredOrders[0])
          : null

  const handleReady = (order: Order) => {
    completeOrder(order.id, substitutionNote.trim())
    setSubstitutionNote('')
    const index = sorted.findIndex((o) => o.id === order.id)
    const next = sorted[index + 1] ?? sorted[index - 1]
    setSelectedId(next?.id ?? null)
  }

  const handleDeliver = (orderId: string) => {
    deliverOrder(orderId)
    setSelectedId(null)
  }

  const hasSubstitutions = selected?.items.some((item) => item.substitute)

  return (
    <div className="grid h-full min-h-0 md:grid-cols-[minmax(300px,390px)_1fr]">
      <section aria-label="Cola de pedidos" className="flex min-h-0 flex-col border-border md:border-r">
        {/* 3 Pestañas operativas */}
        <div className="grid grid-cols-3 border-b border-border text-center">
          <button
            type="button"
            onClick={() => { setActiveTab('pendientes'); setSelectedId(null) }}
            className={cn(
              'py-3 text-[11px] font-bold uppercase tracking-tight',
              activeTab === 'pendientes' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Pendientes ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('listos'); setSelectedId(null) }}
            className={cn(
              'py-3 text-[11px] font-bold uppercase tracking-tight',
              activeTab === 'listos' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Listos ({completedOrders.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('entregados'); setSelectedId(null) }}
            className={cn(
              'py-3 text-[11px] font-bold uppercase tracking-tight',
              activeTab === 'entregados' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Entregados ({deliveredOrders.length})
          </button>
        </div>

        <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto px-3 py-3 md:max-h-none md:flex-1">
          {activeTab === 'pendientes' && (
            <>
              {sorted.map((order) => {
                const secs = remaining(order, now)
                const active = selected?.id === order.id
                return (
                  <li key={order.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(order.id)}
                      className={cn(
                        'w-full rounded-xl border p-4 text-left transition-colors',
                        active ? 'border-brand-yellow bg-brand-yellow/10' : 'border-border bg-card hover:bg-accent',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black">{order.id}</span>
                        <span className={cn('flex items-center gap-1 font-mono text-lg font-bold tabular-nums', timerTone(secs))}>
                          <Timer className="size-4" />
                          {secs < 0 ? 'Vencido' : formatTime(secs)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                        <span>{order.customer}</span>
                        <span>{order.items.reduce((n, i) => n + i.qty, 0)} items · {order.payment}</span>
                      </div>
                    </button>
                  </li>
                )
              })}
              {orders.length === 0 && (
                <li className="flex flex-col items-center py-12 text-center text-muted-foreground">
                  <Inbox className="size-10" />
                  <p className="mt-2 font-semibold">No hay pedidos pendientes</p>
                </li>
              )}
            </>
          )}

          {activeTab === 'listos' && (
            <>
              {completedOrders.map((order) => {
                const active = selected?.id === order.id
                return (
                  <li key={order.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(order.id)}
                      className={cn(
                        'w-full rounded-xl border p-4 text-left transition-colors',
                        active ? 'border-brand-yellow bg-brand-yellow/10' : 'border-border bg-card hover:bg-accent',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black">{order.id}</span>
                        <span className="rounded-full bg-brand-yellow/20 px-2.5 py-0.5 text-xs font-bold text-brand-yellow">
                          Por recoger
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                        <span>{order.customer}</span>
                        <span>Armado {order.readyAt ?? ''}</span>
                      </div>
                    </button>
                  </li>
                )
              })}
              {completedOrders.length === 0 && (
                <li className="flex flex-col items-center py-12 text-center text-muted-foreground">
                  <CheckCircle2 className="size-10" />
                  <p className="mt-2 font-semibold">Ningún pedido esperando recojo</p>
                </li>
              )}
            </>
          )}

          {activeTab === 'entregados' && (
            <>
              {deliveredOrders.map((order) => {
                const active = selected?.id === order.id
                return (
                  <li key={order.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(order.id)}
                      className={cn(
                        'w-full rounded-xl border p-4 text-left transition-colors',
                        active ? 'border-success bg-success/10' : 'border-border bg-card hover:bg-accent',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black">{order.id}</span>
                        <span className="flex items-center gap-1 text-xs font-bold text-success">
                          <PackageCheck className="size-4" />
                          Entregado {order.deliveredAt ?? ''}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                        <span>{order.customer}</span>
                        <span>{order.items.reduce((n, i) => n + i.qty, 0)} items</span>
                      </div>
                    </button>
                  </li>
                )
              })}
              {deliveredOrders.length === 0 && (
                <li className="flex flex-col items-center py-12 text-center text-muted-foreground">
                  <PackageCheck className="size-10" />
                  <p className="mt-2 font-semibold">Aún no hay pedidos entregados</p>
                </li>
              )}
            </>
          )}
        </ul>
      </section>

      {/* PANEL DERECHO */}
      <section aria-label="Detalle" className="flex min-h-0 flex-col overflow-y-auto border-t border-border md:border-t-0">
        {selected ? (
          <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">
                  {activeTab === 'pendientes'
                    ? '1. Armando pedido'
                    : activeTab === 'listos'
                      ? '2. Listo en estante (Esperando al cliente)'
                      : '3. Pedido entregado'}
                </p>
                <h2 className="text-3xl font-black">{selected.id}</h2>
                <p className="text-sm text-muted-foreground">
                  {selected.customer} · Pago con {selected.payment}
                </p>
              </div>

              {activeTab === 'pendientes' && (
                <div className="rounded-xl bg-card px-4 py-3 text-right">
                  <p className="text-xs text-muted-foreground">Tiempo restante</p>
                  <p className={cn('font-mono text-3xl font-black tabular-nums', timerTone(remaining(selected, now)))}>
                    {formatTime(remaining(selected, now))}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {selected.substitution && (
                <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                  <RefreshCw className="size-3.5" />
                  Acepta sustitución
                </span>
              )}
              {(validated[selected.id] || activeTab === 'entregados') && (
                <span className="flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                  <CheckCircle2 className="size-3.5" />
                  QR validado
                </span>
              )}
            </div>

            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {selected.items.map((item, i) => {
                const key = `${selected.id}-${i}`
                const done = activeTab !== 'pendientes' ? true : picked[key]
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => activeTab === 'pendientes' && setPicked((p) => ({ ...p, [key]: !p[key] }))}
                      disabled={activeTab !== 'pendientes'}
                      className={cn('flex w-full items-center gap-4 p-4 text-left', activeTab === 'pendientes' && 'hover:bg-accent')}
                    >
                      <span
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-md border-2',
                          done ? 'border-success bg-success text-success-foreground' : 'border-muted-foreground/40',
                        )}
                      >
                        {done && <Check className="size-4" />}
                      </span>
                      <span className={cn('flex-1 font-semibold', done && activeTab === 'pendientes' && 'text-muted-foreground line-through')}>
                        {item.name}
                        {item.substitute && (
                          <span className="ml-2 rounded-md bg-brand-yellow px-2 py-0.5 text-xs font-bold text-brand-yellow-foreground">
                            Sustituir
                          </span>
                        )}
                      </span>
                      <span className="rounded-md bg-secondary px-2.5 py-1 font-mono text-sm font-bold">x{item.qty}</span>
                      <span className="hidden w-24 text-right text-sm text-muted-foreground sm:block">
                        {formatPrice(item.price * item.qty)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="flex items-center justify-between rounded-xl bg-card px-4 py-3">
              <span className="text-muted-foreground">Total del pedido</span>
              <span className="text-xl font-black">
                {formatPrice(selected.items.reduce((s, i) => s + i.qty * i.price, 0))}
              </span>
            </div>

            {hasSubstitutions && activeTab === 'pendientes' && (
              <div className="rounded-xl border border-brand-yellow bg-brand-yellow/5 p-4">
                <label htmlFor="substitution-note" className="mb-2 flex items-center gap-2 text-sm font-bold text-brand-yellow">
                  <Edit3 className="size-4" />
                  Especificar con qué producto se está sustituyendo
                </label>
                <textarea
                  id="substitution-note"
                  placeholder="Ej: Se sustituyó Leche Gloria por Leche Ideal..."
                  value={substitutionNote}
                  onChange={(e) => setSubstitutionNote(e.target.value)}
                  className="min-h-[80px] w-full rounded-lg border border-input bg-background p-3 text-sm"
                />
              </div>
            )}

            {activeTab !== 'pendientes' && 'substitutionNote' in selected && selected.substitutionNote && (
              <div className="rounded-xl border border-border bg-muted p-4">
                <p className="mb-1 text-sm font-bold text-muted-foreground">Producto usado como sustituto:</p>
                <p className="text-sm">{selected.substitutionNote}</p>
              </div>
            )}

            {activeTab === 'pendientes' && (
              <div className="mt-auto">
                <button
                  type="button"
                  onClick={() => handleReady(selected)}
                  className="flex h-16 w-full items-center justify-center gap-2 rounded-xl bg-success text-lg font-black text-success-foreground hover:brightness-95"
                >
                  <CheckCircle2 className="size-6" />
                  1. Marcar Pedido como Listo (Terminado de armar)
                </button>
              </div>
            )}

            {activeTab === 'listos' && (
              <div className="mt-auto grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="flex h-16 items-center justify-center gap-2 rounded-xl bg-brand-yellow text-lg font-black text-brand-yellow-foreground hover:brightness-95"
                >
                  <QrCode className="size-6" />
                  Escanear QR del Cliente
                </button>
                <button
                  type="button"
                  onClick={() => handleDeliver(selected.id)}
                  className="flex h-16 items-center justify-center gap-2 rounded-xl bg-success text-lg font-black text-success-foreground hover:brightness-95"
                >
                  <PackageCheck className="size-6" />
                  2. Confirmar Entrega al Cliente
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <Inbox className="size-12 opacity-40" />
            <p className="mt-3 text-lg font-bold text-foreground">Sin pedidos seleccionados</p>
          </div>
        )}
      </section>

      {scannerOpen && selected && (
        <QrScannerModal
          orderId={selected.id}
          onValidated={() => setValidated((v) => ({ ...v, [selected.id]: true }))}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  )
}

function QrScannerModal({
  orderId,
  onValidated,
  onClose,
}: {
  orderId: string
  onValidated: () => void
  onClose: () => void
}) {
  const [status, setStatus] = useState<'scanning' | 'ok'>('scanning')
  const callbacks = useRef({ onValidated, onClose })
  callbacks.current = { onValidated, onClose }
  const close = useCallback(() => callbacks.current.onClose(), [])

  useEffect(() => {
    const scanTimer = setTimeout(() => {
      setStatus('ok')
      callbacks.current.onValidated()
    }, 2000)
    const closeTimer = setTimeout(() => callbacks.current.onClose(), 3300)
    return () => {
      clearTimeout(scanTimer)
      clearTimeout(closeTimer)
    }
  }, [])

  return (
    <div className="dark">
      <Modal open onClose={close} title="Escáner QR" className="max-w-sm bg-card">
        <div className="flex flex-col items-center gap-4 p-6 pt-10">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black">
            <div className="absolute inset-6 rounded-xl border-2 border-dashed border-white/20" />
            {status === 'scanning' ? (
              <>
                <QrCode className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 text-white/25" />
                <span className="absolute inset-x-6 h-0.5 animate-scan bg-brand-yellow shadow-[0_0_16px_4px] shadow-brand-yellow/60" />
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-success/90 text-success-foreground">
                <CheckCircle2 className="size-20" />
                <p className="mt-2 text-2xl font-black">QR Validado</p>
              </div>
            )}
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            {status === 'scanning' ? (
              <>
                <ScanLine className="size-4 animate-pulse" />
                Escaneando código del pedido {orderId}...
              </>
            ) : (
              <span className="font-semibold text-success">Pedido {orderId} verificado para entrega</span>
            )}
          </p>
        </div>
      </Modal>
    </div>
  )
}
