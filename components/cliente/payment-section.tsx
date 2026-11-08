'use client'

import { useState } from 'react'
import { AlertTriangle, CreditCard, Lock, QrCode, Smartphone, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, sedeShort, type Sede } from '@/lib/store-data'
import { useStore, type PaymentMethod } from '@/components/store-provider'
import { Switch } from '@/components/shared'

const METHODS: { value: PaymentMethod; icon: typeof CreditCard }[] = [
  { value: 'Tarjeta', icon: CreditCard },
  { value: 'Yape', icon: Smartphone },
  { value: 'Plin', icon: Smartphone },
]

export interface ConfirmedOrder {
  orderId: string
  customer: string
  total: number
  substituted: number
  sede: Sede
  payment: PaymentMethod
}

const inputClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export function PaymentSection({ onPaid }: { onPaid: (order: ConfirmedOrder) => void }) {
  const { cartTotal, placeOrder, user, openAuth, unavailableCount, sede } = useStore()
  const [method, setMethod] = useState<PaymentMethod>('Tarjeta')
  const [substitution, setSubstitution] = useState(true)
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '' })
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const formatCard = (v: string) =>
    v
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(.{4})/g, '$1 ')
      .trim()
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4)
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
  }

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault()
    if (method === 'Tarjeta') {
      if (card.number.replace(/\s/g, '').length !== 16) return setError('Ingresa un número de tarjeta válido de 16 dígitos.')
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) return setError('Ingresa una fecha de vencimiento válida (MM/AA).')
      if (!/^\d{3,4}$/.test(card.cvv)) return setError('Ingresa un CVV válido.')
    } else if (!/^9\d{8}$/.test(phone)) {
      return setError('Ingresa un número de celular válido de 9 dígitos que empiece con 9.')
    }
    setError('')
    const result = placeOrder(method, substitution)
    if (!result.ok) {
      if (result.reason === 'auth') return openAuth('login')
      if (result.reason === 'substitution')
        return setError('Hay productos agotados. Acepta la sustitución automática para poder pagar.')
      return setError('Tu carrito está vacío.')
    }
    onPaid({ ...result, sede, payment: method })
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-3 p-5">
        <div className="flex gap-3 rounded-xl border border-border bg-muted/50 p-4">
          <UserRound className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold">Inicia sesión para comprar</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Necesitamos tu nombre y apellido para registrar el pedido y entregártelo en tienda.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openAuth('register')}
          className="h-12 rounded-xl bg-primary font-bold text-primary-foreground hover:opacity-90"
        >
          Crear cuenta y continuar
        </button>
        <button
          type="button"
          onClick={() => openAuth('login')}
          className="h-12 rounded-xl border border-border font-bold hover:border-primary hover:text-primary"
        >
          Ya tengo cuenta
        </button>
      </div>
    )
  }

  const blocked = unavailableCount > 0 && !substitution

  return (
    <form onSubmit={handlePay} className="flex flex-col gap-5 p-5" noValidate>
      <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3 text-sm">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-xs font-black text-brand-yellow-foreground">
          {user.firstName[0]}
          {user.lastName[0]}
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Pedido a nombre de</p>
          <p className="truncate font-bold">
            {user.firstName} {user.lastName}
          </p>
        </div>
      </div>

      <div
        className={cn(
          'flex items-center justify-between gap-4 rounded-xl border p-4',
          blocked ? 'border-primary bg-primary/5' : 'border-border',
        )}
      >
        <div>
          <p className="text-sm font-semibold" id="label-sustitucion">
            Aceptar sustitución automática si se agota
          </p>
          <p className="text-xs text-muted-foreground">Te enviaremos un producto similar de igual o menor precio.</p>
        </div>
        <Switch checked={substitution} onChange={setSubstitution} label="Aceptar sustitución automática si se agota" />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-bold">Método de pago</legend>
        <div role="tablist" aria-label="Métodos de pago" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          {METHODS.map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={method === value}
              onClick={() => {
                setMethod(value)
                setError('')
              }}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors',
                method === value ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {value}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="mt-4">
          {method === 'Tarjeta' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <label htmlFor="tarjeta" className="text-xs font-semibold">
                  Número de tarjeta
                </label>
                <input
                  id="tarjeta"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="0000 0000 0000 0000"
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="vencimiento" className="text-xs font-semibold">
                  Vencimiento
                </label>
                <input
                  id="vencimiento"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/AA"
                  value={card.expiry}
                  onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="cvv" className="text-xs font-semibold">
                  CVV
                </label>
                <input
                  id="cvv"
                  type="password"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  value={card.cvv}
                  onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  className={inputClass}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-border p-4">
              <div
                className={cn(
                  'flex size-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed',
                  method === 'Yape' ? 'border-[#742284]/40 text-[#742284]' : 'border-[#00b4c5]/50 text-[#008a97]',
                )}
                role="img"
                aria-label={`Espacio para código QR de ${method}`}
              >
                <QrCode className="size-14 opacity-60" aria-hidden="true" />
                <span className="text-xs font-semibold">QR de {method}</span>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Escanea el código desde tu app {method} o ingresa tu número para recibir la solicitud de pago.
              </p>
              <div className="flex w-full flex-col gap-1.5">
                <label htmlFor="celular" className="text-xs font-semibold">
                  Número de celular {method}
                </label>
                <div className="flex">
                  <span className="flex items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                    +51
                  </span>
                  <input
                    id="celular"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="987 654 321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    className={cn(inputClass, 'rounded-l-none')}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </fieldset>

      {blocked && (
        <p role="alert" className="-mt-2 flex gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {unavailableCount === 1 ? 'Un producto está agotado' : `${unavailableCount} productos están agotados`} en{' '}
          {sedeShort(sede)}. Activa la sustitución automática para poder pagar.
        </p>
      )}

      {error && !blocked && (
        <p role="alert" className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={blocked}
        className="flex h-16 items-center justify-center gap-2 rounded-xl bg-primary text-xl font-black text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
      >
        <Lock className="size-5" aria-hidden="true" />
        Pagar {formatPrice(cartTotal)}
      </button>
      <p className="-mt-2 text-center text-xs text-muted-foreground">Pago 100% seguro y encriptado</p>
    </form>
  )
}

