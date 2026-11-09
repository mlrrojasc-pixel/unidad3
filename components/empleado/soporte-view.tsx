'use client'

import { useState } from 'react'
import { AlertTriangle, Phone, Send, Wrench, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/components/store-provider'

const TOPICS = ['Equipo / Hardware', 'Pedido de cliente', 'Inventario', 'Otro']

export function SoporteView() {
  const { showToast, addTicket, tickets } = useStore()
  const [topic, setTopic] = useState(TOPICS[0])
  const [message, setMessage] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    addTicket(topic, message, isUrgent)
    setMessage('')
    setIsUrgent(false)
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
                'rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors',
                topic === t ? 'border-brand-yellow bg-brand-yellow text-brand-yellow-foreground' : 'border-border hover:bg-accent',
              )}
            >
              {t}
            </button>
          ))}
        </fieldset>
        
        <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer w-fit mt-2">
          <input 
            type="checkbox" 
            checked={isUrgent} 
            onChange={(e) => setIsUrgent(e.target.checked)} 
            className="size-4 accent-primary"
          />
          <span className="text-primary flex items-center gap-1.5">
            <AlertTriangle className="size-4" /> Marcar como urgente
          </span>
        </label>

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
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground hover:opacity-90 transition-transform active:scale-95"
        >
          <Send className="size-4" aria-hidden="true" />
          Enviar ticket
        </button>
      </form>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-card p-5 h-full flex flex-col">
          <h2 className="text-lg font-black">Mis Tickets Recientes</h2>
          
          {tickets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground mt-4 border-2 border-dashed border-border rounded-xl p-6">
              <CheckCircle2 className="size-8 opacity-50 mb-2" />
              <p className="text-sm font-medium">No has enviado tickets recientemente</p>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-border overflow-y-auto flex-1">
              {tickets.map((t) => (
                <li key={t.id} className="flex flex-col gap-2 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      {t.urgent && <AlertTriangle className="size-4 shrink-0 text-primary mt-0.5" />}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">{t.topic}</p>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">{t.id} · {t.createdAt}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider',
                        t.status === 'Resuelto' ? 'bg-success/20 text-success' 
                        : t.status === 'En revisión' ? 'bg-brand-yellow/20 text-brand-yellow' 
                        : 'bg-secondary text-secondary-foreground',
                      )}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 ml-6">{t.detail}</p>
                  
                  {/* AQUÍ SE ARREGLÓ EL COLOR DE LA LETRA (text-white/90) */}
                  {t.resolutionText && (
                    <div className="ml-6 mt-2 rounded-lg bg-success/10 border border-success/20 p-3 text-sm text-white/90">
                      <span className="font-bold block mb-1 text-success">Respuesta de Soporte:</span>
                      {t.resolutionText}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="flex shrink-0 items-center gap-4 rounded-xl bg-brand-yellow p-5 text-brand-yellow-foreground">
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
