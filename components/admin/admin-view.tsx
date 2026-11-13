'use client'

import { useState } from 'react'
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
  PackageCheck,
  RefreshCw,
  Search,
  AlertTriangle,
  Wallet,
  Camera
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/components/store-provider'
import { ModeToggle, Modal } from '@/components/shared'
import { formatPrice } from '@/lib/store-data'

type AdminTab = 'kpis' | 'reclamos' | 'soporte' | 'clientes'

export function AdminView() {
  const { orders, completedOrders, deliveredOrders, complaints, tickets, resolveComplaint, resolveTicket, sede } = useStore()
  const [activeTab, setActiveTab] = useState<AdminTab>('kpis')
  
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})
  const [ticketReplies, setTicketReplies] = useState<Record<string, string>>({})
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const allOrders = [...orders, ...completedOrders, ...deliveredOrders]
  const totalOrders = allOrders.length || 1
  const totalSales = deliveredOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.qty, 0), 0)
  
  const totalItemsSold = allOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0) || 1;
  const totalItemsSubstituted = allOrders.reduce((sum, o) => sum + o.items.filter(i => i.substitute).reduce((s, i) => s + i.qty, 0), 0);
  const substitutionRate = Math.round((totalItemsSubstituted / totalItemsSold) * 100);

  const refundRate = Math.round((complaints.filter(c => c.type === 'Reembolso').length / totalOrders) * 100)
  
  const avgItemsPerOrder = deliveredOrders.length > 0 
    ? deliveredOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0) / deliveredOrders.length 
    : 0
  
  const packTimeMins = deliveredOrders.length > 0 ? Math.max(2, Math.round(avgItemsPerOrder * 1.5)) : 0
  const deliveryTimeMins = deliveredOrders.length > 0 ? Math.max(1, Math.round(avgItemsPerOrder * 0.8)) : 0
  
  const avgPackStr = deliveredOrders.length > 0 ? `0${packTimeMins}:45 min` : "00:00 min"
  const avgDelivStr = deliveredOrders.length > 0 ? `0${deliveryTimeMins}:20 min` : "00:00 min"

  const uniqueCustomers = Array.from(new Set(allOrders.map(o => o.customer)))
  
  const pendingComplaints = complaints.filter(c => !c.resolutionStatus).length
  const pendingTickets = tickets.filter(t => t.status !== 'Resuelto').length

  const handleResolveComplaint = (id: string, status: 'Aprobado' | 'Rechazado') => {
    const text = replyTexts[id]
    if (!text || !text.trim()) return alert('Debes escribir una justificación administrativa.')
    resolveComplaint(id, status, text.trim())
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
          <TabButton active={activeTab === 'kpis'} onClick={() => setActiveTab('kpis')} icon={BarChart3} label="Dashboard KPIs" />
          <TabButton 
            active={activeTab === 'reclamos'} 
            onClick={() => setActiveTab('reclamos')} 
            icon={ShieldAlert} 
            label="Reclamos y Extornos" 
            badge={pendingComplaints} 
          />
          <TabButton 
            active={activeTab === 'soporte'} 
            onClick={() => setActiveTab('soporte')} 
            icon={Headphones} 
            label="Soporte Interno" 
            badge={pendingTickets}
          />
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
          {activeTab === 'kpis' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <MetricCard icon={TrendingUp} title="Ingresos" value={formatPrice(totalSales)} trend="+12.5%" />
                <MetricCard icon={Clock} title="Empaquetado" value={avgPackStr} />
                <MetricCard icon={PackageCheck} title="T. Entrega" value={avgDelivStr} />
                <MetricCard icon={RefreshCw} title="Sustituciones" value={`${substitutionRate}%`} trend={substitutionRate > 20 ? 'Alto' : 'Óptimo'} />
                <MetricCard icon={Wallet} title="Reembolsos" value={`${refundRate}%`} trend={refundRate > 10 ? 'Atención' : 'Óptimo'} />
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#141419] p-6 shadow-xl">
                <h3 className="mb-4 text-sm font-bold text-muted-foreground">Flujo del embudo de hoy</h3>
                <div className="flex items-center gap-4 text-center text-sm font-black">
                  <div className="flex-1 rounded-xl border border-white/5 bg-black/40 py-6 text-white transition-colors hover:bg-white/5">1. Pendientes<br/><span className="mt-2 block text-4xl text-primary">{orders.length}</span></div>
                  <div className="flex-1 rounded-xl border border-white/5 bg-black/40 py-6 text-white transition-colors hover:bg-white/5">2. Listos<br/><span className="mt-2 block text-4xl text-brand-yellow">{completedOrders.length}</span></div>
                  <div className="flex-1 rounded-xl border border-white/5 bg-black/40 py-6 text-white transition-colors hover:bg-white/5">3. Entregados<br/><span className="mt-2 block text-4xl text-success">{deliveredOrders.length}</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reclamos' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              {complaints.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-16 text-muted-foreground">
                  <CheckCircle2 className="size-16 text-success/50" />
                  <p className="mt-4 text-lg font-bold text-white">Bandeja limpia</p>
                  <p className="text-sm">No hay quejas ni solicitudes de reembolso pendientes.</p>
                </div>
              ) : (
                <div className="grid gap-6 xl:grid-cols-2">
                  {complaints.map((c) => {
                    const relatedOrder = allOrders.find(o => o.id === c.orderId);
                    // LEYENDO LA EVIDENCIA DE CLOUDINARY
                    const employeeEvidence = relatedOrder?.evidencePhoto || null;

                    return (
                      <div key={c.id} className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#141419] shadow-xl">
                        <div className="flex items-start justify-between border-b border-white/10 bg-black/20 p-5">
                          <div>
                            <span className="text-xl font-black text-white">{c.id}</span>
                            <p className="text-sm text-muted-foreground">Pedido afectado: <strong className="text-primary">{c.orderId}</strong></p>
                          </div>
                          <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary border border-primary/20">{c.type}</span>
                        </div>
                        <div className="p-5">
                          <p className="text-base font-bold text-white">{c.customer}</p>
                          <p className="text-xs text-muted-foreground">{c.email} · Registrado el {c.createdAt}</p>
                          <div className="mt-4 rounded-xl bg-white/5 p-4 text-sm text-white/90 leading-relaxed border border-white/5">
                            "{c.detail}"
                          </div>
                          
                          <div className="mt-4 grid grid-cols-2 gap-4">
                            {/* Evidencia del Cliente */}
                            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-white/20 bg-black/40 p-3">
                              <p className="text-[10px] font-bold uppercase text-muted-foreground">Prueba del Cliente</p>
                              {c.image ? (
                                <div className="flex items-center gap-2">
                                  <div onClick={() => setSelectedImage(c.image!)} className="size-10 shrink-0 rounded-lg border border-white/10 overflow-hidden cursor-pointer hover:opacity-80">
                                    <img src={c.image} alt="Cliente" className="size-full object-cover" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-success flex items-center gap-1"><CheckCircle2 className="size-3" /> Adjunto</p>
                                    <button onClick={() => setSelectedImage(c.image!)} className="text-[10px] text-primary hover:underline mt-0.5">Ampliar</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 opacity-50">
                                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/5"><ImageIcon className="size-4 text-white/30" /></div>
                                  <p className="text-[10px] font-medium text-white/50">Sin foto</p>
                                </div>
                              )}
                            </div>

                            {/* Evidencia del Empleado (Cloudinary) */}
                            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3">
                              <p className="text-[10px] font-bold uppercase text-primary">Control de Tienda</p>
                              {employeeEvidence ? (
                                <div className="flex items-center gap-2">
                                  <div onClick={() => setSelectedImage(employeeEvidence)} className="size-10 shrink-0 rounded-lg border border-primary/20 overflow-hidden cursor-pointer hover:opacity-80">
                                    <img src={employeeEvidence} alt="Tienda" className="size-full object-cover" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-primary flex items-center gap-1"><Camera className="size-3" /> Empacado</p>
                                    <button onClick={() => setSelectedImage(employeeEvidence)} className="text-[10px] text-white hover:underline mt-0.5">Revisar foto</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 opacity-50">
                                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/5"><Camera className="size-4 text-white/30" /></div>
                                  <p className="text-[10px] font-medium text-white/50">Sin foto</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {c.resolutionStatus ? (
                            <div className={cn("mt-6 rounded-xl border p-5", c.resolutionStatus === 'Aprobado' ? 'border-success/30 bg-success/10' : 'border-destructive/30 bg-destructive/10')}>
                              <p className={cn("text-xs font-black uppercase tracking-wider flex items-center gap-2", c.resolutionStatus === 'Aprobado' ? 'text-success' : 'text-destructive')}>
                                {c.resolutionStatus === 'Aprobado' ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                                {c.resolutionStatus === 'Aprobado' ? 'Reembolso Aprobado' : 'Reclamo Rechazado'}
                              </p>
                              <p className="mt-2 text-sm text-white/90 leading-relaxed">{c.resolutionText}</p>
                            </div>
                          ) : (
                            <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
                              <label className="text-xs font-bold text-brand-yellow flex items-center gap-1.5">
                                <ShieldAlert className="size-4" /> Resolución
                              </label>
                              <textarea 
                                value={replyTexts[c.id] || ''}
                                onChange={(e) => setReplyTexts(prev => ({ ...prev, [c.id]: e.target.value }))}
                                placeholder="Ej: Tras revisar la foto de empaquetado de tienda, se verifica que los productos estaban completos..."
                                className="w-full rounded-xl border border-white/10 bg-black/60 p-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/50 transition-colors"
                                rows={3}
                              />
                              <div className="flex gap-3">
                                <button onClick={() => handleResolveComplaint(c.id, 'Aprobado')} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-success py-3.5 text-sm font-bold text-success-foreground hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-success/20">
                                  <CheckCircle2 className="size-4" /> Aprobar Reembolso
                                </button>
                                <button onClick={() => handleResolveComplaint(c.id, 'Rechazado')} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-transparent py-3.5 text-sm font-bold text-white hover:bg-white/10 active:scale-95 transition-all">
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

      <Modal open={!!selectedImage} onClose={() => setSelectedImage(null)} title="Visor de Evidencias" className="max-w-3xl bg-[#0f0f13] border border-white/10">
        <div className="p-4 flex flex-col items-center">
          {selectedImage && (
            <div className="relative w-full h-[60vh] rounded-xl overflow-hidden bg-black/50 border border-white/10">
              <img 
                src={selectedImage} 
                alt="Evidencia adjunta" 
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <button 
            onClick={() => setSelectedImage(null)}
            className="mt-4 px-6 py-2 rounded-full bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
          >
            Cerrar Visor
          </button>
        </div>
      </Modal>
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
        {trend && <span className={cn("text-[10px] font-black uppercase px-2 py-1 rounded-md", trend.includes('+') || trend === 'Óptimo' || trend === 'Normal' ? 'bg-success/20 text-success' : 'bg-brand-yellow/20 text-brand-yellow')}>{trend}</span>}
      </div>
    </div>
  )
}
