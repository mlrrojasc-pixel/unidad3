'use client'

import { useState } from 'react'
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Headphones,
  Shield,
  ShieldAlert,
  TrendingUp,
  Users,
  PackageCheck,
  RefreshCw,
  Search,
  AlertTriangle,
  Wallet,
  ExternalLink,
  PieChart,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/components/store-provider'
import { ModeToggle } from '@/components/shared'
import { formatPrice } from '@/lib/store-data'

type AdminTab = 'kpis' | 'control' | 'reclamos' | 'soporte' | 'clientes'

export function AdminView() {
  const { orders, completedOrders, deliveredOrders, complaints, tickets, resolveTicket, sede } = useStore()
  const [activeTab, setActiveTab] = useState<AdminTab>('kpis')
  
  const [ticketReplies, setTicketReplies] = useState<Record<string, string>>({})

  const allOrders = [...orders, ...completedOrders, ...deliveredOrders]
  const totalOrders = allOrders.length || 1
  const totalSales = deliveredOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.qty, 0), 0)
  
  const totalItemsSold = allOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0) || 1;
  const totalItemsSubstituted = allOrders.reduce((sum, o) => sum + o.items.filter((i: any) => i.substitute).reduce((s, i) => s + i.qty, 0), 0);
  const substitutionRate = Math.round((totalItemsSubstituted / totalItemsSold) * 100);

  const refundRate = Math.round((complaints.filter(c => c.type === 'Reembolso').length / totalOrders) * 100)
  
  const avgItemsPerOrder = deliveredOrders.length > 0 
    ? deliveredOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0) / deliveredOrders.length 
    : 0
  
  const packTimeMins = deliveredOrders.length > 0 ? Math.max(2, Math.round(avgItemsPerOrder * 1.5)) : 0
  const deliveryTimeMins = deliveredOrders.length > 0 ? Math.max(1, Math.round(avgItemsPerOrder * 0.8)) : 0
  
  const uniqueCustomers = Array.from(new Set(allOrders.map(o => o.customer)))
  const pendingTickets = tickets.filter(t => t.status !== 'Resuelto').length

  // ==========================================
  // LÓGICA DE NEGOCIO B2B: FUGA DE CAPITAL Y ROI
  // ==========================================
  const approvedRefunds = complaints.filter(c => c.resolutionStatus === 'Aprobado');
  const capitalPerdido = approvedRefunds.reduce((total, c) => {
    const relatedOrder = allOrders.find(o => o.id === c.orderId);
    if (!relatedOrder) return total;
    return total + relatedOrder.items.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0);
  }, 0);

  const capitalEnRiesgo = allOrders
    .filter(o => o.items.some((i: any) => i.substitute))
    .reduce((total, o) => total + o.items.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0), 0);

  // ==========================================
  // ANALÍTICA PRESCRIPTIVA (ALERTAS AUTOMÁTICAS)
  // ==========================================
  const alerts = [];
  if (substitutionRate > 15) {
    alerts.push({ type: 'warning', text: 'Alerta: Alta discrepancia de inventario físico vs web. Se sugiere auditoría en góndolas.' });
  }
  if (refundRate > 5) {
    alerts.push({ type: 'destructive', text: 'Alerta: Picos de reembolsos solicitados. Posibles fallas en el empaquetado.' });
  }
  if (packTimeMins > 5) {
    alerts.push({ type: 'warning', text: 'Alerta: Tiempo de preparación elevado. Posible cuello de botella operativo.' });
  }

  const handleResolveTicket = (id: string, status: 'En revisión' | 'Resuelto') => {
    const text = ticketReplies[id]
    resolveTicket(id, status, text?.trim())
  }

  return (
    <div className="dark flex h-dvh flex-col bg-background text-foreground md:flex-row">
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
          <TabButton active={activeTab === 'kpis'} onClick={() => setActiveTab('kpis')} icon={BarChart3} label="Dashboard General" />
          <TabButton active={activeTab === 'control'} onClick={() => setActiveTab('control')} icon={Clock} label="Control Empleado" />
          <TabButton active={activeTab === 'reclamos'} onClick={() => setActiveTab('reclamos')} icon={ShieldAlert} label="Reclamos y Extornos" />
          <TabButton active={activeTab === 'soporte'} onClick={() => setActiveTab('soporte')} icon={Headphones} label="Soporte Interno" badge={pendingTickets} />
          <TabButton active={activeTab === 'clientes'} onClick={() => setActiveTab('clientes')} icon={Users} label="Base de Clientes" />
        </nav>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col bg-[#0f0f13]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 bg-[#0a0a0a] px-4 py-3 md:px-8">
          <div>
            <h1 className="text-xl font-black text-white">
              {activeTab === 'kpis' && 'Reporte Gerencial Consolidado'}
              {activeTab === 'control' && 'Métricas de Productividad Operativa'}
              {activeTab === 'reclamos' && 'Panel Analítico de Calidad'}
              {activeTab === 'soporte' && 'Tickets de Empleados'}
              {activeTab === 'clientes' && 'Directorio de Clientes'}
            </h1>
            <p className="text-xs font-semibold text-muted-foreground">Sucursal: {sede}</p>
          </div>
          <ModeToggle dark />
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
          
          {/* ======================================================== */}
          {/* PESTAÑA 1: DASHBOARD GERENCIAL (VISIÓN 360)              */}
          {/* ======================================================== */}
          {activeTab === 'kpis' && (
            <div className="space-y-6 animate-in fade-in">
              
              {alerts.length > 0 && (
                <div className="grid gap-3">
                  {alerts.map((alert, idx) => (
                    <div key={idx} className={cn("flex items-center gap-3 p-4 rounded-xl border font-bold text-sm shadow-sm", alert.type === 'warning' ? 'bg-brand-yellow/10 border-brand-yellow/20 text-brand-yellow' : 'bg-destructive/10 border-destructive/20 text-destructive-foreground')}>
                      <AlertTriangle className="size-5" />
                      {alert.text}
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard icon={TrendingUp} title="Ventas Netas" value={formatPrice(totalSales - capitalPerdido)} trend="Real" />
                <MetricCard icon={RefreshCw} title="Sustituciones" value={`${substitutionRate}%`} trend={substitutionRate > 15 ? 'Riesgo' : 'Óptimo'} />
                <MetricCard icon={AlertCircle} title="Fuga (Reembolsos)" value={formatPrice(capitalPerdido)} trend="Pérdida" />
                <MetricCard icon={Wallet} title="Capital en Riesgo" value={formatPrice(capitalEnRiesgo)} trend="Por Stock" />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[#141419] p-6 shadow-xl flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Retorno de Inversión (SaaS)</h3>
                    <p className="mt-2 text-3xl font-black text-white">S/ 149.00 <span className="text-base font-medium text-muted-foreground">/ mes</span></p>
                    <p className="mt-2 text-xs font-semibold text-success">El sistema te ha alertado de una fuga potencial de {formatPrice(capitalEnRiesgo)} por quiebres de stock este mes.</p>
                  </div>
                  <div className="h-16 w-16 shrink-0 rounded-full bg-success/20 flex items-center justify-center">
                    <Shield className="size-8 text-success" />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#141419] p-6 shadow-xl">
                  <h3 className="mb-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Flujo del embudo de hoy</h3>
                  <div className="flex items-center gap-3 text-center text-sm font-black">
                    <div className="flex-1 rounded-xl border border-white/5 bg-black/40 py-4 text-white transition-colors hover:bg-white/5">Pendientes<br/><span className="mt-1 block text-3xl text-primary">{orders.length}</span></div>
                    <div className="flex-1 rounded-xl border border-white/5 bg-black/40 py-4 text-white transition-colors hover:bg-white/5">Listos<br/><span className="mt-1 block text-3xl text-brand-yellow">{completedOrders.length}</span></div>
                    <div className="flex-1 rounded-xl border border-white/5 bg-black/40 py-4 text-white transition-colors hover:bg-white/5">Entregados<br/><span className="mt-1 block text-3xl text-success">{deliveredOrders.length}</span></div>
                  </div>
                </div>
              </div>
              
              <section className="mt-8 rounded-2xl border border-white/10 bg-[#141419] p-6 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <BarChart3 className="size-5" />
                    </span>
                    <div>
                      <h2 className="text-xl font-black text-white">Dashboard Gerencial 360°</h2>
                      <p className="text-sm text-muted-foreground">Monitoreo general de ventas y operaciones comerciales.</p>
                    </div>
                  </div>
                  <a 
                    href="https://docs.google.com/spreadsheets/d/e/2PACX-1vSSYutG8VGZ6vHtTU1H3KEF7sVBPxwdmVW8cImrqviRoxEHUCXcifCUsHm4AKZ30N4B_U51MPwBsit2/pubhtml?gid=239313023&single=true" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                  >
                    Pantalla Completa <ExternalLink className="size-4" />
                  </a>
                </div>
                <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-black/40">
                  <iframe 
                    src="https://docs.google.com/spreadsheets/d/e/2PACX-1vSSYutG8VGZ6vHtTU1H3KEF7sVBPxwdmVW8cImrqviRoxEHUCXcifCUsHm4AKZ30N4B_U51MPwBsit2/htmlembed?gid=239313023&single=true&widget=true&headers=false" 
                    className="w-full min-h-[650px] border-0"
                    title="Dashboard Gerencial"
                  ></iframe>
                </div>
              </section>
            </div>
          )}

          {/* ======================================================== */}
          {/* PESTAÑA 2: CONTROL EMPLEADO Y TIEMPOS                    */}
          {/* ======================================================== */}
          {activeTab === 'control' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#141419] p-6 shadow-xl">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-brand-yellow/10 text-brand-yellow">
                    <Clock className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-black text-white">Control de Tiempos y SLA</h2>
                    <p className="text-sm text-muted-foreground">Métricas logísticas de picking y cumplimiento del equipo de tienda.</p>
                  </div>
                </div>
                <a 
                  href="https://docs.google.com/spreadsheets/d/e/2PACX-1vSSYutG8VGZ6vHtTU1H3KEF7sVBPxwdmVW8cImrqviRoxEHUCXcifCUsHm4AKZ30N4B_U51MPwBsit2/pubhtml?gid=914724&single=true" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-yellow/10 px-4 py-2 text-sm font-bold text-brand-yellow hover:bg-brand-yellow/20 transition-colors whitespace-nowrap"
                >
                  Pantalla Completa <ExternalLink className="size-4" />
                </a>
              </div>

              <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-xl">
                <iframe 
                  src="https://docs.google.com/spreadsheets/d/e/2PACX-1vSSYutG8VGZ6vHtTU1H3KEF7sVBPxwdmVW8cImrqviRoxEHUCXcifCUsHm4AKZ30N4B_U51MPwBsit2/htmlembed?gid=914724&single=true&widget=true&headers=false" 
                  className="w-full min-h-[700px] border-0"
                  title="Control de Tiempos"
                ></iframe>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* PESTAÑA 3: RECLAMOS Y EXTORNOS                           */}
          {/* ======================================================== */}
          {activeTab === 'reclamos' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#141419] p-6 shadow-xl">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <ShieldAlert className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-black text-white">CRM de Atención Postventa</h2>
                    <p className="text-sm text-muted-foreground">
                      Análisis de calidad de servicio, incidencias y gestión de devoluciones.
                    </p>
                  </div>
                </div>
                <a 
                  href="https://docs.google.com/spreadsheets/d/e/2PACX-1vSSYutG8VGZ6vHtTU1H3KEF7sVBPxwdmVW8cImrqviRoxEHUCXcifCUsHm4AKZ30N4B_U51MPwBsit2/pubhtml?gid=593959324&single=true" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive-foreground hover:bg-destructive/20 transition-colors whitespace-nowrap"
                >
                  Abrir Data Cruda <ExternalLink className="size-4" />
                </a>
              </div>

              <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-xl">
                <iframe 
                  src="https://docs.google.com/spreadsheets/d/e/2PACX-1vSSYutG8VGZ6vHtTU1H3KEF7sVBPxwdmVW8cImrqviRoxEHUCXcifCUsHm4AKZ30N4B_U51MPwBsit2/htmlembed?gid=593959324&single=true&widget=true&headers=false" 
                  className="w-full min-h-[750px] border-0"
                  title="Dashboard de Reclamos"
                ></iframe>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* PESTAÑA 4: SOPORTE INTERNO                               */}
          {/* ======================================================== */}
          {activeTab === 'soporte' && (
            <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-[#141419] to-[#0a0a0a] p-6 shadow-lg">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Headphones className="size-6 text-brand-yellow" />
                    Mesa de Ayuda Interna
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">Resolución de incidencias operativas del personal de tienda.</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-white">{tickets.length}</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Tickets Totales</p>
                </div>
              </div>

              {tickets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-16 text-center text-muted-foreground">
                  <CheckCircle2 className="mx-auto size-16 text-success/50 mb-4" />
                  <p className="text-lg font-bold text-white">Todo funciona correctamente</p>
                  <p className="text-sm">El personal no ha reportado incidencias.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {tickets.map(t => (
                    <div key={t.id} className="rounded-2xl border border-white/10 bg-[#141419] p-5 shadow-sm transition-colors hover:border-white/20">
                      <div className="flex flex-wrap gap-4 items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            {t.urgent && <AlertTriangle className="size-5 text-primary animate-pulse" />}
                            <h3 className="text-lg font-black text-white truncate">{t.topic}</h3>
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                              t.status === 'Resuelto' ? 'bg-success/10 text-success border-success/20' 
                              : t.status === 'En revisión' ? 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20' 
                              : 'bg-white/5 text-white border-white/10'
                            )}>
                              {t.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground font-mono">{t.id} · Reportado: {t.createdAt}</p>
                          <div className="mt-3 text-sm text-white/90 bg-black/30 p-4 rounded-xl border border-white/5">
                            {t.detail}
                          </div>
                        </div>
                        
                        <div className="w-full sm:w-72 shrink-0">
                          {t.status === 'Resuelto' ? (
                            <div className="h-full rounded-xl bg-success/10 border border-success/20 p-4 text-sm text-success-foreground">
                              <span className="font-bold flex items-center gap-1.5 mb-1"><CheckCircle2 className="size-4" /> Solución Aplicada:</span>
                              {t.resolutionText || "Ticket cerrado por el administrador."}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <textarea
                                value={ticketReplies[t.id] || ''}
                                onChange={(e) => setTicketReplies(prev => ({ ...prev, [t.id]: e.target.value }))}
                                placeholder="Escribe una respuesta para el empleado..."
                                className="w-full rounded-xl border border-white/10 bg-black/60 p-3 text-xs text-white focus:border-primary focus:outline-none"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                {t.status === 'Abierto' && (
                                  <button onClick={() => handleResolveTicket(t.id, 'En revisión')} className="flex-1 rounded-lg border border-brand-yellow/50 bg-brand-yellow/10 py-2 text-xs font-bold text-brand-yellow hover:bg-brand-yellow/20 transition-colors">
                                    En revisión
                                  </button>
                                )}
                                <button onClick={() => handleResolveTicket(t.id, 'Resuelto')} className="flex-1 rounded-lg bg-success py-2 text-xs font-bold text-success-foreground hover:brightness-110 transition-colors">
                                  Marcar Resuelto
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* PESTAÑA 5: CLIENTES                                      */}
          {/* ======================================================== */}
          {activeTab === 'clientes' && (
            <div className="rounded-2xl border border-white/10 bg-[#141419] overflow-hidden shadow-xl animate-in fade-in">
              <div className="bg-black/40 p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2"><Users className="size-5 text-primary" /> Directorio Activo</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input type="text" placeholder="Buscar cliente..." className="bg-[#141419] border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-primary" />
                </div>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-black/20 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4">Nombre del Cliente</th>
                    <th className="px-6 py-4">Estado de Cuenta</th>
                    <th className="px-6 py-4">Última Actividad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {uniqueCustomers.map((name, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black">{name.charAt(0)}</div>
                        {name}
                      </td>
                      <td className="px-6 py-4"><span className="rounded-full bg-success/10 border border-success/20 px-3 py-1 text-[10px] font-black text-success uppercase tracking-wider">Verificada</span></td>
                      <td className="px-6 py-4 text-muted-foreground text-xs font-medium">Compra exitosa registrada</td>
                    </tr>
                  ))}
                  {uniqueCustomers.length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-16 text-center text-muted-foreground font-medium">La base de datos está vacía.</td></tr>
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
        <span className={cn('ml-auto hidden rounded-full px-2.5 py-0.5 text-[10px] md:block shadow-sm', active ? 'bg-black/30 text-white' : 'bg-brand-yellow text-brand-yellow-foreground font-black')}>
          {badge}
        </span>
      )}
    </button>
  )
}

function MetricCard({ icon: Icon, title, value, trend }: any) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#141419] p-5 shadow-lg transition-transform hover:-translate-y-1">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="p-2 rounded-lg bg-white/5"><Icon className="size-4 text-white" /></div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider">{title}</h3>
      </div>
      <div className="mt-5 flex items-end justify-between">
        <p className="text-2xl font-black text-white">{value}</p>
        {trend && (
          <span className={cn(
            "text-[10px] font-black uppercase px-2 py-1 rounded-md", 
            trend === 'Óptimo' || trend === 'Real' ? 'bg-success/20 text-success' : 
            trend === 'Pérdida' || trend === 'Riesgo' ? 'bg-destructive/20 text-destructive-foreground' : 
            'bg-brand-yellow/20 text-brand-yellow'
          )}>
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}
