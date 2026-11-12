'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from 'react'
import {
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  SEDES,
  isAvailable,
  type Category,
  type Order,
  type Product,
  type Sede,
} from '@/lib/store-data'

export type PaymentMethod = Order['payment']

export type AppOrder = Order & { pickupTime?: string }

export interface CartLine {
  product: Product
  qty: number
  available: boolean
}

export interface Customer {
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface Account extends Customer {
  password: string
}

export interface CompletedOrder extends AppOrder {
  substitutionNote?: string
  readyAt?: string
  deliveredAt?: string
}

export interface Complaint {
  id: string
  orderId: string
  customer: string
  email: string
  type: 'Reembolso' | 'Queja de servicio' | 'Producto en mal estado' | 'Sugerencia'
  detail: string
  image?: string
  resolutionStatus?: 'Aprobado' | 'Rechazado'
  resolutionText?: string
  createdAt: string
}

export interface SupportTicket {
  id: string
  topic: string
  detail: string
  status: 'Abierto' | 'En revisión' | 'Resuelto'
  urgent: boolean
  resolutionText?: string
  createdAt: string
}

export type AuthMode = 'login' | 'register'

export type PlaceOrderResult =
  | { ok: true; orderId: string; customer: string; total: number; substituted: number }
  | { ok: false; reason: 'auth' | 'substitution' | 'empty' }

interface StoreContextValue {
  startShift: () => void
  products: Product[]
  setStock: (id: string, sede: Sede, available: boolean) => void
  setStockAllSedes: (id: string, available: boolean) => void
  user: Customer | null
  register: (data: Account) => string | null
  login: (email: string, password: string) => string | null
  logout: () => void
  authMode: AuthMode | null
  openAuth: (mode: AuthMode) => void
  closeAuth: () => void
  unavailableCount: number
  cart: CartLine[]
  cartCount: number
  cartTotal: number
  qtyInCart: (id: string) => number
  addToCart: (id: string) => void
  updateQty: (id: string, delta: number) => void
  clearCart: () => void
  search: string
  setSearch: (value: string) => void
  category: 'Todo' | Category
  setCategory: (value: 'Todo' | Category) => void
  sede: Sede
  setSede: (value: Sede) => void
  orders: AppOrder[]
  completedOrders: CompletedOrder[]
  deliveredOrders: CompletedOrder[]
  complaints: Complaint[]
  tickets: SupportTicket[]
  readyCount: number
  completeOrder: (id: string, substitutionNote?: string) => void
  deliverOrder: (id: string) => void
  addComplaint: (data: Omit<Complaint, 'id' | 'createdAt'>) => void
  resolveComplaint: (id: string, status: 'Aprobado' | 'Rechazado', text: string) => void
  addTicket: (topic: string, detail: string, urgent: boolean) => void
  resolveTicket: (id: string, status: 'En revisión' | 'Resuelto', text?: string) => void
  placeOrder: (payment: PaymentMethod, substitution: boolean, pickupTime: string) => PlaceOrderResult
  toast: string | null
  showToast: (message: string) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

const MAX_QTY = 20

const VALID_DOMAINS = [
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'outlook.es',
  'icloud.com',
  'yahoo.com',
  'yahoo.es',
  'unac.edu.pe',
]

const getLocalData = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)

  const [cartQty, setCartQty] = useState<Record<string, number>>({})
  const [sede, setSede] = useState<Sede>(SEDES[0])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [user, setUser] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<AppOrder[]>([])
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([])
  const [deliveredOrders, setDeliveredOrders] = useState<CompletedOrder[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'Todo' | Category>('Todo')
  const [readyCount, setReadyCount] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setCartQty(getLocalData('lacosmina_cart', {}))
    setSede(getLocalData('lacosmina_sede', SEDES[0]))
    setAccounts(getLocalData('lacosmina_accounts', []))
    setUser(getLocalData('lacosmina_currentUser', null))
    setOrders(getLocalData('lacosmina_orders', INITIAL_ORDERS as AppOrder[]))
    setCompletedOrders(getLocalData('lacosmina_completed', []))
    setDeliveredOrders(getLocalData('lacosmina_delivered', []))
    setComplaints(getLocalData('lacosmina_complaints', []))
    setTickets(getLocalData('lacosmina_tickets', []))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) window.localStorage.setItem('lacosmina_cart', JSON.stringify(cartQty))
  }, [cartQty, hydrated])

  useEffect(() => {
    if (hydrated) window.localStorage.setItem('lacosmina_sede', JSON.stringify(sede))
  }, [sede, hydrated])

  useEffect(() => {
    if (hydrated) window.localStorage.setItem('lacosmina_accounts', JSON.stringify(accounts))
  }, [accounts, hydrated])

  useEffect(() => {
    if (hydrated) window.localStorage.setItem('lacosmina_currentUser', JSON.stringify(user))
  }, [user, hydrated])

  useEffect(() => {
    if (hydrated) window.localStorage.setItem('lacosmina_orders', JSON.stringify(orders))
  }, [orders, hydrated])

  useEffect(() => {
    if (hydrated) window.localStorage.setItem('lacosmina_completed', JSON.stringify(completedOrders))
  }, [completedOrders, hydrated])

  useEffect(() => {
    if (hydrated) window.localStorage.setItem('lacosmina_delivered', JSON.stringify(deliveredOrders))
  }, [deliveredOrders, hydrated])

  useEffect(() => {
    if (hydrated) window.localStorage.setItem('lacosmina_complaints', JSON.stringify(complaints))
  }, [complaints, hydrated])

  useEffect(() => {
    if (hydrated) window.localStorage.setItem('lacosmina_tickets', JSON.stringify(tickets))
  }, [tickets, hydrated])

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }, [])

  const startShift = useCallback(() => {
    const now = Date.now()
    setOrders((prev) => prev.map((o) => (o.deadline ? o : { ...o, deadline: now + o.slaSeconds * 1000 })))
  }, [])

  const setStock = useCallback((id: string, target: Sede, available: boolean) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: { ...p.stock, [target]: available } } : p)))
  }, [])

  const setStockAllSedes = useCallback((id: string, available: boolean) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, stock: Object.fromEntries(SEDES.map((s) => [s, available])) as Product['stock'] } : p,
      ),
    )
  }, [])

  const openAuth = useCallback((mode: AuthMode) => setAuthMode(mode), [])
  const closeAuth = useCallback(() => setAuthMode(null), [])

  const register = useCallback(
    (data: Account) => {
      const email = data.email.trim().toLowerCase()
      const domain = email.split('@')[1]
      if (!domain || !VALID_DOMAINS.includes(domain)) {
        return 'Usa un proveedor de correo válido (@gmail.com, @hotmail.com, @outlook.com, @icloud.com, @unac.edu.pe).'
      }
      if (accounts.some((a) => a.email.trim().toLowerCase() === email)) {
        return 'Ya existe una cuenta con este correo. Inicia sesión.'
      }
      const account: Account = {
        firstName:
