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
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/components/store-provider'
import { ModeToggle } from '@/components/shared'
import { formatPrice } from '@/lib/store-data'

type AdminTab = 'kpis' | 'reclamos' | 'soporte' | 'clientes'

export function AdminView() {
  const { orders, completedOrders, deliveredOrders, tickets, resolveTicket, sede } = useStore()
  const [activeTab, setActiveTab] = useState<AdminTab>('kpis')
  
  const [ticketReplies, setTicketReplies] = useState<Record<string, string>>({})

  const allOrders = [...orders, ...completedOrders, ...deliveredOrders]
  const totalOrders = allOrders.length || 1
  const totalSales = deliveredOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.qty, 0), 0)
  
  const totalItemsSold = allOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0) || 1;
  const totalItemsSubstituted = allOrders.reduce((sum, o) => sum + o.items.filter(i => i.substitute).reduce((s, i) => s + i.qty, 0), 0);
  const substitutionRate = Math.round((totalItemsSubstituted / totalItemsSold) * 100);

  const avgItemsPerOrder = deliveredOrders.length > 0 
    ? deliveredOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0) / deliveredOrders.length 
    : 0
  
  const packTimeMins = deliveredOrders.length > 0 ? Math.max(2, Math.round(avgItemsPerOrder * 1.5)) : 0
  const deliveryTimeMins = deliveredOrders.length > 0 ? Math.max(1, Math.round(avgItemsPerOrder * 0.8)) : 0
  
  const avgPackStr = deliveredOrders.length > 0 ? `0${packTimeMins}:45 min` : "00:00 min"
  const avgDelivStr = deliveredOrders.length > 0 ? `0${deliveryTimeMins}:20 min` : "00:00 min"

  const uniqueCustomers = Array.from(new Set(allOrders.map(o => o.customer)))
  
  const pendingTickets = tickets.filter(t => t.status !== 'Resuelto').length

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
        <nav aria-label="Secciones Admin" className="flex flex-1
