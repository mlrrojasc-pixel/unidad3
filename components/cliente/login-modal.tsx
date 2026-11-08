'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/shared'
import { useStore, type AuthMode } from '@/components/store-provider'

const inputClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const NAME_RE = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]{2,40}$/

export function LoginModal() {
  const { authMode, closeAuth, openAuth } = useStore()
  const open = authMode !== null
  const mode: AuthMode = authMode ?? 'login'

  return (
    <Modal open={open} onClose={closeAuth} title={mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}>
      <div className="p-6 pt-8">
        <div role="tablist" aria-label="Acceso" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => openAuth(m)}
              className={cn(
                'rounded-lg py-2 text-sm font-bold transition-colors',
                mode === m ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          ))}
        </div>
        {mode === 'login' ? <LoginForm key="login" /> : <RegisterForm key="register" />}
      </div>
    </Modal>
  )
}

function LoginForm() {
  const { login, closeAuth, showToast, openAuth } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = login(email, password)
    if (err) return setError(err)
    showToast('¡Bienvenido de vuelta a La Cosmina!')
    closeAuth()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4" noValidate>
      <p className="text-sm text-muted-foreground">Ingresa con tu correo para continuar con tu compra.</p>
      <Field id="login-correo" label="Correo electrónico">
        <input
          id="login-correo"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@ejemplo.com"
          className={inputClass}
        />
      </Field>
      <Field id="login-clave" label="Contraseña">
        <input
          id="login-clave"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className={inputClass}
        />
      </Field>
      {error && <ErrorMsg>{error}</ErrorMsg>}
      <button type="submit" className="h-12 rounded-lg bg-primary font-bold text-primary-foreground hover:opacity-90">
        Ingresar
      </button>
      <p className="text-center text-sm text-muted-foreground">
        ¿Aún no tienes cuenta?{' '}
        <button type="button" onClick={() => openAuth('register')} className="font-bold text-primary hover:underline">
          Regístrate
        </button>
      </p>
    </form>
  )
}

function RegisterForm() {
  const { register, closeAuth, showToast } = useStore()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' })
  const [terms, setTerms] = useState(false)
  const [error, setError] = useState('')
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: k === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 9) : e.target.value })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!NAME_RE.test(form.firstName.trim())) return setError('Ingresa un nombre válido.')
    if (!NAME_RE.test(form.lastName.trim())) return setError('Ingresa un apellido válido.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('Ingresa un correo válido.')
    if (!/^9\d{8}$/.test(form.phone)) return setError('El celular debe tener 9 dígitos y empezar con 9.')
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (!terms) return setError('Debes aceptar los términos y condiciones.')
    const err = register(form)
    if (err) return setError(err)
    showToast(`¡Cuenta creada! Hola, ${form.firstName.trim()}`)
    closeAuth()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4" noValidate>
      <p className="text-sm text-muted-foreground">Tu pedido se registrará a nombre de los datos que ingreses.</p>
      <div className="grid grid-cols-2 gap-3">
        <Field id="reg-nombre" label="Nombre">
          <input id="reg-nombre" autoComplete="given-name" value={form.firstName} onChange={set('firstName')} placeholder="María" className={inputClass} />
        </Field>
        <Field id="reg-apellido" label="Apellido">
          <input id="reg-apellido" autoComplete="family-name" value={form.lastName} onChange={set('lastName')} placeholder="Quispe" className={inputClass} />
        </Field>
      </div>
      <Field id="reg-correo" label="Correo electrónico">
        <input id="reg-correo" type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="tucorreo@ejemplo.com" className={inputClass} />
      </Field>
      <Field id="reg-celular" label="Celular">
        <div className="flex">
          <span className="flex items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">+51</span>
          <input id="reg-celular" type="tel" inputMode="numeric" autoComplete="tel-national" value={form.phone} onChange={set('phone')} placeholder="987654321" className={cn(inputClass, 'rounded-l-none')} />
        </div>
      </Field>
      <Field id="reg-clave" label="Contraseña">
        <input id="reg-clave" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="Mínimo 8 caracteres" className={inputClass} />
      </Field>
      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 size-4 accent-[var(--primary)]" />
        Acepto los términos y condiciones y la política de privacidad de La Cosmina.
      </label>
      {error && <ErrorMsg>{error}</ErrorMsg>}
      <button type="submit" className="h-12 rounded-lg bg-primary font-bold text-primary-foreground hover:opacity-90">
        Crear cuenta
      </button>
    </form>
  )
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold">
        {label}
      </label>
      {children}
    </div>
  )
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
      {children}
    </p>
  )
}

