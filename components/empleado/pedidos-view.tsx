'use client'

import { useEffect, useRef, useState, memo } from 'react'
import {
  Check,
  CheckCircle2,
  Inbox,
  QrCode,
  RefreshCw,
  Timer,
  Edit3,
  PackageCheck,
  AlertTriangle,
  Keyboard,
  Camera,
  Loader2,
  ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, type Order } from '@/lib/store-data'
import { useStore } from '@/components/store-provider'
import { Modal } from '@/components/shared'
import dynamic from 'next/dynamic'

const QrReader = dynamic(
  // @ts-ignore
  () => import('react-qr-reader').then((mod) => mod.QrReader),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-black"><Loader2 className="size-8 animate-spin text-white/50" /></div> }
)

type AppOrder = Order & { pickupTime?: string; securityCode?: string; evidencePhoto?: string }

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

const OrderTimer = memo(({ order, large = false }: { order: Order; large?: boolean }) => {
  const now = useNow()
  const secs = remaining(order, now)
  
  if (large) {
    return (
      <p className={cn('font-mono text-3xl font-black tabular-nums', timerTone(secs))}>
        {formatTime(secs)}
      </p>
    )
  }

  return (
    <span className={cn('flex items-center gap-1 font-mono text-lg font-bold tabular-nums', timerTone(secs))}>
      <Timer className="size-4" />
      {secs < 0 ? 'Vencido' : formatTime(secs)}
    </span>
  )
})
OrderTimer.displayName = 'OrderTimer'

type EmployeeTab = 'pendientes' | 'listos' | 'entregados'

export function PedidosView() {
  const { orders, completedOrders, deliveredOrders, completeOrder, deliverOrder, saveEvidence } = useStore()
  
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [validated, setValidated] = useState<Record<string, boolean>>({})
  const [picked, setPicked] = useState<Record<string, boolean>>({})

  const [activeTab, setActiveTab] = useState<EmployeeTab>('pendientes')
  const [substitutionNote, setSubstitutionNote] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [localPhoto, setLocalPhoto] = useState<string | null>(null)

  useEffect(() => {
    setLocalPhoto(null)
  }, [selectedId, activeTab])

  const sorted = [...(orders as AppOrder[])].sort((a, b) => {
    const aUrgent = a.pickupTime === 'Lo antes posible (30 min)'
    const bUrgent = b.pickupTime === 'Lo antes posible (30 min)'
    if (aUrgent && !bUrgent) return -1
    if (!aUrgent && bUrgent) return 1
    return (a.deadline ?? 0) - (b.deadline ?? 0)
  })

  const selected = (
    activeTab === 'pendientes'
      ? (orders.find((o) => o.id === selectedId) ?? sorted[0])
      : activeTab === 'listos'
        ? (completedOrders.find((o) => o.id === selectedId) ?? completedOrders[0])
        : activeTab === 'entregados'
          ? (deliveredOrders.find((o) => o.id === selectedId) ?? deliveredOrders[0])
          : null
  ) as AppOrder | null

  // CARGA REAL A TU CUENTA DE CLOUDINARY
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, orderId: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    
    // TUS CREDENCIALES EXACTAS
    formData.append('upload_preset', 'lacosmina') 
    const cloudName = 'oa8smyy9' 

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      
      if (data.secure_url) {
        if (activeTab === 'pendientes') {
          setLocalPhoto(data.secure_url)
        } else {
          saveEvidence(orderId, data.secure_url)
        }
      } else {
        alert('Hubo un error subiendo la foto. Verifica tu Cloud Name y Upload Preset.')
      }
    } catch (error) {
      console.error('Error Cloudinary', error)
      alert('Error de conexión con Cloudinary.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleReady = (order: Order) => {
    completeOrder(order.id, substitutionNote.trim(), localPhoto || undefined)
    setSubstitutionNote('')
    setLocalPhoto(null)
    const index = sorted.findIndex((o) => o.id === order.id)
    const next = sorted[index + 1] ?? sorted[index - 1]
    setSelectedId(next?.id ?? null)
  }

  const handleDeliver = (orderId: string) => {
    deliverOrder(orderId)
    setSelectedId(null)
  }

  const hasSubstitutions = selected?.items.some((item) => item.substitute)
  const allPicked = selected?.items.every((_, i) => picked[`${selected.id}-${i}`])
  const currentPhoto = activeTab === 'pendientes' ? localPhoto : selected?.evidencePhoto;

  return (
    <div className="grid h-full min-h-0 md:grid-cols-[minmax(300px,390px)_1fr]">
      <section aria-label="Cola de pedidos" className="flex min-h-0 flex-col border-border md:border-r">
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
                const active = selected?.id === order.id
                const isUrgent = order.pickupTime === 'Lo antes posible (30 min)'

                return (
                  <li key={order.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(order.id)}
                      className={cn(
                        'w-full rounded-xl border p-4 text-left transition-colors',
                        active 
                          ? isUrgent ? 'border-destructive bg-destructive/10' : 'border-brand-yellow bg-brand-yellow/10' 
                          : 'border-border bg-card hover:bg-accent',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-black">{order.id}</span>
                          {isUrgent && (
                            <span className="flex items-center gap-1 rounded-md bg-destructive/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-destructive">
                              <AlertTriangle className="size-3" /> Urgente
                            </span>
                          )}
                        </div>
                        <OrderTimer order={order} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
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
                          Entregado {order.deliveredAt ? `a las ${order.deliveredAt}` : ''}
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
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-black">{selected.id}</h2>
                  {selected.pickupTime === 'Lo antes posible (30 min)' && activeTab === 'pendientes' && (
                    <span className="flex items-center gap-1.5 rounded-lg bg-destructive/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-destructive">
                      <AlertTriangle className="size-4" /> Prioridad Alta
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.customer} · Pago con {selected.payment} · Recojo: <strong className="text-foreground">{selected.pickupTime || 'No especificado'}</strong>
                </p>
              </div>

              {activeTab === 'pendientes' && (
                <div className="rounded-xl bg-card px-4 py-3 text-right">
                  <p className="text-xs text-muted-foreground">Tiempo restante</p>
                  <OrderTimer order={selected} large />
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

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
                <Camera className="size-4" />
                Control Anti-Fraude: Evidencia Fotográfica
              </p>
              
              {isUploading ? (
                <div className="flex h-12 items-center justify-center rounded-lg border border-dashed border-primary/30 bg-primary/10">
                  <Loader2 className="size-5 animate-spin text-primary" />
                  <span className="ml-2 text-xs font-bold text-primary">Subiendo a Cloudinary...</span>
                </div>
              ) : currentPhoto ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={currentPhoto} alt="Evidencia" className="size-10 rounded-md object-cover border border-success/20 shadow-sm" />
                    <span className="flex items-center gap-1.5 text-xs font-bold text-success">
                      <CheckCircle2 className="size-4" /> Foto guardada en la nube
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <a href={currentPhoto} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:underline">Ver Foto</a>
                    {activeTab === 'pendientes' && (
                      <button onClick={() => setLocalPhoto(null)} className="text-xs font-bold text-muted-foreground hover:underline">Eliminar</button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-3 text-xs text-muted-foreground">Sube una foto del pedido empaquetado para protegerte ante reclamos falsos.</p>
                  <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-primary/50 bg-primary/10 text-sm font-bold text-primary hover:bg-primary/20 transition-colors">
                    <Camera className="size-4" />
                    Tomar foto del paquete
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoUpload(e, selected.id)} />
                  </label>
                </>
              )}
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
                  disabled={!allPicked || !currentPhoto}
                  className={cn(
                    "flex h-16 w-full items-center justify-center gap-2 rounded-xl text-lg font-black transition-all",
                    allPicked && currentPhoto
                      ? "bg-success text-success-foreground hover:brightness-95 shadow-lg shadow-success/20"
                      : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                  )}
                >
                  <CheckCircle2 className="size-6" />
                  1. Marcar Pedido como Listo
                </button>
                {(!allPicked || !currentPhoto) && (
                  <p className="mt-2 text-center text-xs font-semibold text-destructive">
                    {!allPicked ? "Falta marcar productos." : "Falta adjuntar evidencia fotográfica."}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'listos' && (
              <div className="mt-auto grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="flex h-16 items-center justify-center gap-2 rounded-xl bg-brand-yellow text-lg font-black text-brand-yellow-foreground hover:brightness-95 shadow-lg shadow-brand-yellow/20"
                >
                  <QrCode className="size-6" />
                  Escanear / Ingresar Código
                </button>
                <button
                  type="button"
                  onClick={() => handleDeliver(selected.id)}
                  disabled={!validated[selected.id]}
                  className={cn(
                    "flex h-16 items-center justify-center gap-2 rounded-xl text-lg font-black transition-all",
                    validated[selected.id] 
                      ? "bg-success text-success-foreground hover:brightness-95 shadow-lg shadow-success/20" 
                      : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                  )}
                >
                  <PackageCheck className="size-6" />
                  2. Confirmar Entrega
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
          securityCode={selected.securityCode || ''}
          onValidated={() => {
            setValidated((v) => ({ ...v, [selected.id]: true }))
            setScannerOpen(false)
          }}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  )
}

function QrScannerModal({
  orderId,
  securityCode,
  onValidated,
  onClose,
}: {
  orderId: string
  securityCode: string
  onValidated: () => void
  onClose: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  const handleManualValidation = () => {
    const manualCode = inputRef.current?.value.trim() || ''
    if (securityCode === '') {
      setError('Aún no hay código en el Excel. Vuelva a intentar.')
      return
    }
    
    if (manualCode === securityCode) {
      onValidated()
    } else {
      setError('Código incorrecto. Verifique los 4 dígitos del cliente.')
    }
  }

  const handleScan = (data: string | null) => {
    if (data) {
      if (securityCode !== '' && data.includes(securityCode)) {
        onValidated()
      } else {
        setError('El código QR escaneado no es válido para este pedido.')
      }
    }
  }

  return (
    <div className="dark">
      <Modal open onClose={onClose} title="Validar Entrega" className="max-w-md bg-card">
        <div className="flex flex-col gap-6 p-6">
          
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black border border-white/10 flex flex-col items-center justify-center">
             <QrReader
                onResult={(result: any) => {
                  if (!!result) {
                    handleScan(result?.getText())
                  }
                }}
                constraints={{ facingMode: 'environment' }}
                containerStyle={{ width: '100%', height: '100%' }}
                videoStyle={{ objectFit: 'cover' }}
             />
             <div className="absolute inset-x-6 h-0.5 animate-scan bg-brand-yellow shadow-[0_0_16px_4px] shadow-brand-yellow/60" />
          </div>

          <div className="space-y-4 border-t border-border pt-6">
             <p className="text-center text-sm font-bold text-muted-foreground flex items-center justify-center gap-2">
               <Keyboard className="size-4" /> Validación Alternativa (Código Typebot)
             </p>
             <div className="flex gap-2">
               <input 
                 ref={inputRef}
                 type="text" 
                 inputMode="numeric"
                 placeholder="Ej: 1234"
                 maxLength={4}
                 onChange={() => setError('')}
                 className="flex-1 rounded-xl border border-input bg-background px-4 text-center text-2xl tracking-widest font-black text-white focus:border-primary focus:outline-none"
               />
               <button 
                 onClick={handleManualValidation}
                 className="rounded-xl bg-brand-yellow px-6 font-bold text-brand-yellow-foreground hover:brightness-110 transition-all"
               >
                 Validar
               </button>
             </div>
             {error && <p className="text-center text-sm font-bold text-destructive">{error}</p>}
          </div>
        </div>
      </Modal>
    </div>
  )
}
