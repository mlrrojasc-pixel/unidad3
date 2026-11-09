'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, CheckCircle2, Inbox, QrCode, RefreshCw, ScanLine, Timer, Edit3 } from 'lucide-react'
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

// Interfaz extendida para guardar la nota de sustitución
interface CompletedOrder extends Order {
  substitutionNote?: string
}

export function PedidosView() {
  const { orders, completeOrder } = useStore()
  const now = useNow()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [validated, setValidated] = useState<Record<string, boolean>>({})
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  
  // Nuevos estados para pestañas y sustituciones
  const [activeTab, setActiveTab] = useState<'pendientes' | 'listos'>('pendientes')
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([])
  const [substitutionNote, setSubstitutionNote] = useState('')

  const sorted = [...orders].sort((a, b) => remaining(a, now) - remaining(b, now))
  const selected = activeTab === 'pendientes' 
    ? (orders.find((o) => o.id === selectedId) ?? sorted[0])
    : completedOrders.find((o) => o.id === selectedId)

  const handleReady = (order: Order) => {
    // Guardar en la lista de completados con su nota
    const completedOrder: CompletedOrder = {
      ...order,
      substitutionNote: substitutionNote.trim()
    }
    setCompletedOrders(prev => [completedOrder, ...prev])
    
    // Limpiar la nota para el siguiente pedido
    setSubstitutionNote('')

    // Pasar al siguiente pedido
    const index = sorted.findIndex((o) => o.id === order.id)
    const next = sorted[index + 1] ?? sorted[index - 1]
    setSelectedId(next?.id ?? null)
    completeOrder(order.id)
  }

  // Verifica si el pedido actual tiene algún producto por sustituir
  const hasSubstitutions = selected?.items.some(item => item.substitute)

  return (
    <div className="grid h-full min-h-0 md:grid-cols-[minmax(260px,360px)_1fr]">
      <section aria-label="Cola de pedidos" className="flex min-h-0 flex-col border-border md:border-r">
        {/* Pestañas (Tabs) */}
        <div className="flex border-b border-border">
          <button
            onClick={() => { setActiveTab('pendientes'); setSelectedId(null) }}
            className={cn(
              "flex-1 py-3 text-sm font-bold uppercase tracking-wide",
              activeTab === 'pendientes' ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Pendientes ({orders.length})
          </button>
          <button
            onClick={() => { setActiveTab('listos'); setSelectedId(null) }}
            className={cn(
              "flex-1 py-3 text-sm font-bold uppercase tracking-wide",
              activeTab === 'listos' ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Listos ({completedOrders.length})
          </button>
        </div>

        <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto px-3 py-3 md:max-h-none md:flex-1">
          {activeTab === 'pendientes' ? (
            <>
              {sorted.map((order) => {
                const secs = remaining(order, now)
                const active = selected?.id === order.id
                return (
                  <li key={order.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(order.id)}
                      aria-pressed={active}
                      className={cn(
                        'w-full rounded-xl border p-4 text-left transition-colors',
                        active ? 'border-brand-yellow bg-brand-yellow/10' : 'border-border bg-card hover:bg-accent',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black">{order.id}</span>
                        <span className={cn('flex items-center gap-1 font-mono text-lg font-bold tabular-nums', timerTone(secs))}>
                          <Timer className="size-4" aria-hidden="true" />
                          {secs < 0 ? 'Vencido' : formatTime(secs)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                        <span>{order.customer}</span>
                        <span>
                          {order.items.reduce((n, i) => n + i.qty, 0)} items · {order.payment}
                        </span>
                      </div>
                    </button>
                  </li>
                )
              })}
              {orders.length === 0 && (
                <li className="flex flex-col items-center py-12 text-center text-muted-foreground">
                  <Inbox className="size-10" aria-hidden="true" />
                  <p className="mt-2 font-semibold">No hay pedidos pendientes</p>
                  <p className="text-xs">Los nuevos pedidos aparecerán aquí.</p>
                </li>
              )}
            </>
          ) : (
            <>
              {completedOrders.map((order) => {
                const active = selected?.id === order.id
                return (
                  <li key={order.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(order.id)}
                      aria-pressed={active}
                      className={cn(
                        'w-full rounded-xl border p-4 text-left transition-colors',
                        active ? 'border-success bg-success/10' : 'border-border bg-card hover:bg-accent',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black">{order.id}</span>
                        <span className="flex items-center gap-1 text-sm font-bold text-success">
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                          Listo
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
              {completedOrders.length === 0 && (
                <li className="flex flex-col items-center py-12 text-center text-muted-foreground">
                  <CheckCircle2 className="size-10" aria-hidden="true" />
                  <p className="mt-2 font-semibold">No hay pedidos listos aún</p>
                </li>
              )}
            </>
          )}
        </ul>
      </section>

      <section aria-label="Detalle del pedido" className="flex min-h-0 flex-col overflow-y-auto border-t border-border md:border-t-0">
        {selected ? (
          <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">
                  {activeTab === 'pendientes' ? 'Pedido activo' : 'Pedido completado'}
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
                  <RefreshCw className="size-3.5" aria-hidden="true" />
                  Acepta sustitución
                </span>
              )}
              {(validated[selected.id] || activeTab === 'listos') && (
                <span className="flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  QR validado
                </span>
              )}
            </div>

            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {selected.items.map((item, i) => {
                const key = `${selected.id}-${i}`
                const done = activeTab === 'listos' ? true : picked[key]
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => activeTab === 'pendientes' && setPicked((p) => ({ ...p, [key]: !p[key] }))}
                      aria-pressed={done}
                      disabled={activeTab === 'listos'}
                      className={cn(
                        "flex w-full items-center gap-4 p-4 text-left",
                        activeTab === 'pendientes' && "hover:bg-accent"
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-md border-2',
                          done ? 'border-success bg-success text-success-foreground' : 'border-muted-foreground/40',
                        )}
                      >
                        {done && <Check className="size-4" aria-hidden="true" />}
                      </span>
                      <span className={cn('flex-1 font-semibold', done && activeTab === 'pendientes' && 'text-muted-foreground line-through')}>
                        {item.name}
                        {item.substitute && (
                          <span className="ml-2 rounded-md bg-brand-yellow px-2 py-0.5 text-xs font-bold text-brand-yellow-foreground no-underline">
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

            {/* Panel de Sustitución */}
            {hasSubstitutions && activeTab === 'pendientes' && (
              <div className="rounded-xl border border-brand-yellow bg-brand-yellow/5 p-4">
                <label htmlFor="substitution-note" className="flex items-center gap-2 text-sm font-bold text-brand-yellow mb-2">
                  <Edit3 className="size-4" />
                  Registro de Sustitución
                </label>
                <textarea
                  id="substitution-note"
                  placeholder="Ej: Se cambió Inka Chips 130g por Lays 150g..."
                  value={substitutionNote}
                  onChange={(e) => setSubstitutionNote(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow min-h-[80px]"
                />
              </div>
            )}

            {activeTab === 'listos' && 'substitutionNote' in selected && selected.substitutionNote && (
               <div className="rounded-xl border border-border bg-muted p-4">
               <p className="text-sm font-bold text-muted-foreground mb-1">Nota de sustitución:</p>
               <p className="text-sm">{selected.substitutionNote}</p>
             </div>
            )}

            {activeTab === 'pendientes' && (
              <div className="mt-auto grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="flex h-16 items-center justify-center gap-2 rounded-xl bg-brand-yellow text-lg font-black text-brand-yellow-foreground hover:brightness-95"
                >
                  <QrCode className="size-6" aria-hidden="true" />
                  Escanear QR
                </button>
                <button
                  type="button"
                  onClick={() => handleReady(selected)}
                  className="flex h-16 items-center justify-center gap-2 rounded-xl bg-success text-lg font-black text-success-foreground hover:brightness-95"
                >
                  <CheckCircle2 className="size-6" aria-hidden="true" />
                  Marcar como Listo
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
            {activeTab === 'pendientes' ? (
              <>
                <CheckCircle2 className="size-14 text-success" aria-hidden="true" />
                <p className="mt-3 text-lg font-bold text-foreground">¡Todo al día!</p>
                <p className="text-sm">No hay pedidos por preparar en este momento.</p>
              </>
            ) : (
              <>
                <Inbox className="size-14 text-muted-foreground/50" aria-hidden="true" />
                <p className="mt-3 text-lg font-bold text-foreground">Historial vacío</p>
                <p className="text-sm">Aquí aparecerán los pedidos que marques como listos.</p>
              </>
            )}
          </div>
        )}
      </section>

      {scannerOpen && selected && activeTab === 'pendientes' && (
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
            {['left-4 top-4 border-l-4 border-t-4', 'right-4 top-4 border-r-4 border-t-4', 'bottom-4 left-4 border-b-4 border-l-4', 'bottom-4 right-4 border-b-4 border-r-4'].map(
              (pos) => (
                <span key={pos} className={cn('absolute size-10 rounded-sm border-brand-yellow', pos)} />
              ),
            )}
            {status === 'scanning' ? (
              <>
                <QrCode className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 text-white/25" aria-hidden="true" />
                <span className="absolute inset-x-6 h-0.5 animate-scan bg-brand-yellow shadow-[0_0_16px_4px] shadow-brand-yellow/60" />
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-success/90 text-success-foreground animate-in fade-in zoom-in-90">
                <CheckCircle2 className="size-20" aria-hidden="true" />
                <p className="mt-2 text-2xl font-black">QR Validado</p>
              </div>
            )}
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
            {status === 'scanning' ? (
              <>
                <ScanLine className="size-4 animate-pulse" aria-hidden="true" />
                Escaneando código del pedido {orderId}...
              </>
            ) : (
              <span className="font-semibold text-success">Pedido {orderId} verificado correctamente</span>
            )}
          </p>
        </div>
      </Modal>
    </div>
  )
}
