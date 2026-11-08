'use client'

import { useState } from 'react'
import { AlertTriangle, Phone, Send, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/components/store-provider'

const TICKETS = [
  { id: 'T-231', title: 'Balanza de la sección carnes descalibrada', status: 'En revisión', urgent: true },
  { id: 'T-228', title: 'Impresora de etiquetas sin papel', status: 'Resuelto', urgent: false },
  { id: 'T-225', title: 'Tablet de picking 03 no sincroniza', status: 'Abierto', urgent: false },
]

const TOPICS = ['Equipo / Hardware', 'Pedido de cliente', 'Inventario', 'Otro']

export function SoporteView() {
  const { showToast } = useStore()
  const [topic, setTopic] = useState(TOPICS[0])
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setMessage('')
    showToast('Ticket enviado a soporte')
  }

  return (
    <div className="grid h-full gap-4 overflow-y-auto p-4 md:grid-cols-2 md:p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-lg font-black">
          <Wrench className="size-5 text-brand-yellow" aria-hidden="true" />
          Reportar un problema
        </h2>
        <fieldset className="flex flex-wrap gap-2">
          <legend className="mb-2 text-sm font-semibold">Tema</legend>
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={topic === t}
              onClick={() => setTopic(t)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-semibold',
                topic === t ? 'border-brand-yellow bg-brand-yellow text-brand-yellow-foreground' : 'border-border hover:bg-accent',
              )}
            >
              {t}
            </button>
          ))}
        </fieldset>
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="mensaje" className="text-sm font-semibold">
            Descripción
          </label>
          <textarea
            id="mensaje"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Describe brevemente lo que ocurre..."
            className="flex-1 rounded-xl border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground hover:opacity-90"
        >
          <Send className="size-4" aria-hidden="true" />
          Enviar ticket
        </button>
      </form>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-black">Tickets recientes</h2>
          <ul className="mt-3 divide-y divide-border">
            {TICKETS.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3">
                {t.urgent && <AlertTriangle className="size-4 shrink-0 text-primary" aria-label="Urgente" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.id}</p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-bold',
                    t.status === 'Resuelto' ? 'bg-success/15 text-success' : 'bg-secondary',
                  )}
                >
                  {t.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-brand-yellow p-5 text-brand-yellow-foreground">
          <Phone className="size-8" aria-hidden="true" />
          <div>
            <p className="font-black">Mesa de ayuda 24/7</p>
            <p className="text-sm">Anexo 450 · soporte@lacosmina.pe</p>
          </div>
        </div>
      </div>
    </div>
  )
}
