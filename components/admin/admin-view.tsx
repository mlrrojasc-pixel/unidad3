'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Headphones,
  ImageIcon,
  Shield,
  ShieldAlert,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/components/store-provider'
import { ModeToggle } from '@/components/shared'
import { formatPrice } from '@/lib/store-data'

type AdminTab = 'kpis' | 'reclamos' | 'soporte' | 'clientes'

export function AdminView() {
  const { orders, completedOrders, deliveredOrders, complaints, sede } = useStore()
  const [activeTab, setActiveTab] = useState<AdminTab>('kpis')
  
  // Estados locales temporales para la demo de justificaciones y fotos
  const [resolutions, setResolutions] = useState<Record<string, { status: 'Aprobado' | 'Rechazado', text: string }>>({})
  const [replyText, setReplyText] = useState('')

  // Cálculos rápidos para KPIs
  const allOrders = [...orders, ...completedOrders, ...deliveredOrders]
  const totalSales = deliveredOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.qty, 0), 0)
  const substitutionRate = allOrders.length > 0 
    ? Math.round((allOrders.filter(o => o.substitution).length / allOrders.length) * 100) 
    : 0

  // Extraer clientes únicos de los pedidos para el directorio
  const uniqueCustomers = Array.from(new Set(allOrders.map(o => o.customer)))

  const handleResolve = (id: string, status: 'Aprobado' | 'Rechazado') => {
    if (!replyText.trim()) return alert('Debes escribir una justificación administrativa.')
    setResolutions(prev => ({ ...prev, [id]: { status, text: replyText } }))
    setReplyText('')
  }

  return (
    <div className="dark flex h-dvh flex-col bg-background text-foreground md:flex-row">
      {/* Menú Lateral Admin */}
      <aside className="flex shrink-0 border-sidebar-border bg-[#0a0a0a] md:w-64 md:flex-col md:border-r">
        <div className="hidden items-center gap-3 px-6 py-6 md:flex">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-xl font-black text-brand-yellow">
            <Shield className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-black tracking-wide text-primary">ADMINISTRACIÓN</span>
            <span className="block text-xs font-medium text-muted-foreground">Centro de Operaciones</span>
          </span>
        </div>
        <nav aria-label="Secciones Admin" className="flex flex-1 gap-2 p-3 md:flex-col md:p-4">
          <TabButton active={activeTab === 'kpis'} onClick={() => setActiveTab('kpis')} icon={BarChart3} label="Dashboard KPIs" />
          <TabButton 
            active={activeTab === 'reclamos'} 
            onClick={() => setActiveTab('reclamos')} 
            icon={ShieldAlert} 
            label="Reclamos y Extornos" 
            badge={complaints.length} 
          />
          <TabButton active={activeTab === 'soporte'} onClick={() => setActiveTab('soporte')} icon={Headphones} label="Soporte Interno" />
          <TabButton active={activeTab === 'clientes'} onClick={() => setActiveTab('clientes')} icon={Users} label="Base de Clientes" />
        </nav>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col bg-[#0f0f13]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 bg-[#0a0a0a] px-4 py-3 md:px-8">
          <div>
            <h1 className="text-xl font-black text-white">
              {activeTab === 'kpis' && 'Métricas de Rendimiento'}
              {activeTab === 'reclamos' && 'Gestión de Reembolsos'}
              {activeTab === 'soporte' && 'Tickets de Empleados'}
              {activeTab === 'clientes' && 'Directorio de Clientes'}
            </h1>
            <p className="text-xs font-semibold text-muted-foreground">Sucursal: {sede}</p>
          </div>
          <ModeToggle dark />
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
          {/* 1. DASHBOARD KPIs */}
          {activeTab === 'kpis' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard icon={TrendingUp} title="Ingresos Totales (Entregados)" value={formatPrice(totalSales)} trend="+12.5%" />
                <MetricCard icon={Clock} title="T. Promedio Empaquetado" value="08:45 min" />
                <MetricCard icon={PackageCheck} title="T. Promedio Entrega" value="03:20 min" />
                <MetricCard icon={RefreshCw} title="Tasa de Sustituciones" value={`${substitutionRate}%`} trend={substitutionRate > 20 ? 'Alto' : 'Normal'} />
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#141419] p-6">
                <h3 className="mb-4 text-sm font-bold text-muted-foreground">Flujo del embudo de hoy</h3>
                <div className="flex items-center gap-2 text-center text-sm font-black">
                  <div className="flex-1 rounded-xl bg-white/5 py-4 text-white">1. Pendientes<br/><span className="text-2xl text-primary">{orders.length}</span></div>
                  <div className="flex-1 rounded-xl bg-white/5 py-4 text-white">2. Listos<br/><span className="text-2xl text-brand-yellow">{completedOrders.length}</span></div>
                  <div className="flex-1 rounded-xl bg-white/5 py-4 text-white">3. Entregados<br/><span className="text-2xl text-success">{deliveredOrders.length}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* 2. GESTIÓN DE RECLAMOS */}
          {activeTab === 'reclamos' && (
            <div className="space-y-6">
              {complaints.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-12 text-muted-foreground">
                  <CheckCircle2 className="size-12 text-success/50" />
                  <p className="mt-4 font-bold">Bandeja limpia. No hay reclamos pendientes.</p>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  {complaints.map((c) => {
                    const res = resolutions[c.id]
                    return (
                      <div key={c.id} className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#141419]">
                        <div className="flex items-start justify-between border-b border-white/10 bg-black/20 p-5">
                          <div>
                            <span className="text-xl font-black text-white">{c.id}</span>
                            <p className="text-sm text-muted-foreground">Pedido: <strong className="text-primary">{c.orderId}</strong></p>
                          </div>
                          <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary">{c.type}</span>
                        </div>
                        <div className="p-5">
                          <p className="text-sm font-bold text-white">{c.customer}</p>
                          <p className="text-xs text-muted-foreground">{c.email} · {c.createdAt}</p>
                          <div className="mt-4 rounded-xl bg-white/5 p-4 text-sm text-white/90">
                            "{c.detail}"
                          </div>
                          
                          {/* Evidencia Fotográfica */}
                          <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-white/20 bg-black/20 p-4">
                            <div className="flex size-12 items-center justify-center rounded-lg bg-white/10">
                              <ImageIcon className="size-6 text-white/50" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">Evidencia adjunta por el cliente</p>
                              <a href="#" className="text-xs font-semibold text-primary hover:underline">Ver fotografía en pantalla completa</a>
                            </div>
                          </div>

                          {/* Resolución */}
                          {res ? (
                            <div className={cn("mt-6 rounded-xl border p-4", res.status === 'Aprobado' ? 'border-success/30 bg-success/10' : 'border-destructive/30 bg-destructive/10')}>
                              <p className={cn("text-xs font-black uppercase", res.status === 'Aprobado' ? 'text-success' : 'text-destructive')}>
                                {res.status === 'Aprobado' ? 'Reembolso Aprobado' : 'Reclamo Rechazado'}
                              </p>
                              <p className="mt-1 text-sm text-white/90">{res.text}</p>
                            </div>
                          ) : (
                            <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
                              <label className="text-xs font-bold text-muted-foreground">Justificación de Administración (Visible para Cliente/Empleado)</label>
                              <textarea 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Ej: Se procederá con el extorno de S/ 25.00 a la cuenta original..."
                                className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white focus:border-primary focus:outline-none"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <button onClick={() => handleResolve(c.id, 'Aprobado')} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-success py-3 text-sm font-bold text-success-foreground hover:brightness-95">
                                  <CheckCircle2 className="size-4" /> Aprobar Reembolso
                                </button>
                                <button onClick={() => handleResolve(c.id, 'Rechazado')} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-transparent py-3 text-sm font-bold text-white hover:bg-white/10">
                                  <XCircle className="size-4" /> Rechazar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. SOPORTE INTERNO */}
          {activeTab === 'soporte' && (
            <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#141419] p-6">
              <h2 className="mb-4 text-lg font-black text-white">Tickets de Empleados (Mesa de Ayuda)</h2>
              <p className="text-sm text-muted-foreground mb-6">Administra las incidencias operativas reportadas por el personal de tienda.</p>
              <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
                <Headphones className="mx-auto size-12 text-white/20" />
                <p className="mt-4 text-sm font-semibold text-muted-foreground">Los tickets enviados desde la vista de empleado aparecerán aquí.</p>
              </div>
            </div>
          )}

          {/* 4. BASE DE CLIENTES */}
          {activeTab === 'clientes' && (
            <div className="rounded-2xl border border-white/10 bg-[#141419] overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-black/40 text-xs font-bold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4">Nombre del Cliente</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Última Actividad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {uniqueCustomers.map((name, i) => (
                    <tr key={i} className="hover:bg-white/5">
                      <td className="px-6 py-4 font-semibold text-white">{name}</td>
                      <td className="px-6 py-4"><span className="rounded-full bg-success/20 px-2.5 py-1 text-[10px] font-black text-success">Cuenta Activa</span></td>
                      <td className="px-6 py-4 text-muted-foreground">Compra registrada</td>
                    </tr>
                  ))}
                  {uniqueCustomers.length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">No hay clientes con pedidos registrados aún.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// Subcomponentes visuales
function TabButton({ active, onClick, icon: Icon, label, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all',
        active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-white/5 hover:text-white'
      )}
    >
      <Icon className="size-5" />
      <span className="hidden md:block">{label}</span>
      {badge > 0 && (
        <span className={cn('ml-auto hidden rounded-full px-2 py-0.5 text-[10px] md:block', active ? 'bg-black/20' : 'bg-brand-yellow text-brand-yellow-foreground')}>
          {badge}
        </span>
      )}
    </button>
  )
}

function MetricCard({ icon: Icon, title, value, trend }: any) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#141419] p-5">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Icon className="size-5" />
        <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <p className="text-3xl font-black text-white">{value}</p>
        {trend && <span className="text-sm font-bold text-brand-yellow">{trend}</span>}
      </div>
    </div>
  )
}
