'use client'

import { CheckCircle2, ImageIcon, Lock } from 'lucide-react'
import { useStore } from '@/components/store-provider'

export function ReclamosView() {
  const { complaints } = useStore()

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between rounded-xl border border-brand-yellow/40 bg-brand-yellow/10 p-5">
        <div className="flex items-center gap-3">
          <Lock className="size-6 text-brand-yellow" />
          <div>
            <h2 className="text-base font-black uppercase">Bandeja de Reclamos y Reembolsos (Solo Lectura)</h2>
            <p className="text-sm text-muted-foreground">
              El personal de tienda solo puede visualizar las quejas. La resolución, extornos y revisión de evidencias fotográficas corresponde a la Vista Administrador.
            </p>
          </div>
        </div>
      </div>

      {complaints.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
          <CheckCircle2 className="size-12 text-success" />
          <p className="mt-2 font-bold text-foreground">No existen quejas ni solicitudes de reembolso activas</p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {complaints.map((c) => (
            <li key={c.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
                <div>
                  <span className="text-lg font-black">{c.id}</span>
                  <p className="text-xs text-muted-foreground">Pedido: <strong className="text-foreground">{c.orderId}</strong></p>
                </div>
                <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                  {c.type}
                </span>
              </div>
              
              <div className="flex-1 py-3">
                <p className="text-sm font-semibold">{c.customer}</p>
                <p className="text-xs text-muted-foreground">{c.email}</p>
                <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3 text-sm">
                  {c.detail}
                </div>
                
                {/* Espacio preparado para la foto adjunta */}
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-2.5 text-xs text-muted-foreground">
                  <ImageIcon className="size-4 opacity-50" />
                  Evidencia adjunta (Revise en panel Admin)
                </div>
              </div>
              
              <div className="mt-auto border-t border-border pt-3 text-xs text-muted-foreground">
                Registrado: {c.createdAt}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
