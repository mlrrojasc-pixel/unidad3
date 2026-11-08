'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckCircle2, ImageIcon, Monitor, ShoppingBag, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/components/store-provider'

export function Switch({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        checked ? 'bg-success' : 'bg-input',
        className,
      )}
    >
      <span
        className={cn(
          'inline-block size-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5.5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export function ImagePlaceholder({ className, label = 'Imagen' }: { className?: string; label?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/60 text-muted-foreground',
        className,
      )}
      role="img"
      aria-label={`Espacio para ${label.toLowerCase()}`}
    >
      <ImageIcon className="size-6 opacity-50" aria-hidden="true" />
      <span className="text-[11px] font-medium opacity-70">{label}</span>
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-in fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full max-w-md rounded-2xl bg-card text-card-foreground shadow-2xl outline-none animate-in fade-in zoom-in-95',
          className,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="size-5" />
        </button>
        {children}
      </div>
    </div>
  )
}

export function ModeToggle({ dark = false }: { dark?: boolean }) {
  const pathname = usePathname()
  const mode = pathname.startsWith('/empleado') ? 'empleado' : 'cliente'
  const options = [
    { value: 'cliente' as const, href: '/', label: 'Vista Cliente', icon: ShoppingBag },
    { value: 'empleado' as const, href: '/empleado', label: 'Vista Empleado', icon: Monitor },
  ]
  return (
    <nav
      aria-label="Cambiar vista"
      className={cn('inline-flex rounded-full p-1 text-xs font-semibold', dark ? 'bg-secondary' : 'bg-black/20')}
    >
      {options.map(({ value, href, label, icon: Icon }) => {
        const active = mode === value
        return (
          <Link
            key={value}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors',
              active
                ? 'bg-brand-yellow text-brand-yellow-foreground shadow-sm'
                : dark
                  ? 'text-muted-foreground hover:text-foreground'
                  : 'text-white/90 hover:text-white',
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{value === 'cliente' ? 'Cliente' : 'Empleado'}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function Toast() {
  const { toast } = useStore()
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
      {toast && (
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-success px-4 py-3 text-sm font-semibold text-success-foreground shadow-xl animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="size-5" aria-hidden="true" />
          {toast}
        </div>
      )}
    </div>
  )
}
