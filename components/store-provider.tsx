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

// NUEVO: Agregamos securityCode a la interfaz
export type AppOrder = Order & { pickupTime?: string; securityCode?: string }

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
    setUser(getLocalData('lacosmina_currentUser', null))
    setOrders(getLocalData('lacosmina_orders', INITIAL_ORDERS as AppOrder[]))
    setCompletedOrders(getLocalData('lacosmina_completed', []))
    setDeliveredOrders(getLocalData('lacosmina_delivered', []))
    setComplaints(getLocalData('lacosmina_complaints', []))
    setTickets(getLocalData('lacosmina_tickets', []))
    
    const cuentasLocales = getLocalData('lacosmina_accounts', [])
    setAccounts(cuentasLocales)
    setHydrated(true)

    fetch('https://sheetdb.io/api/v1/0793nb34hurdw')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const cuentasSincronizadas = data.map((fila: any) => ({
            firstName: fila['Nombre'] || '',
            lastName: fila['Apellido'] || '',
            phone: fila['celular'] || '',
            email: fila['correo electrónico'] || '',
            password: fila['contraseña'] || ''
          }))
          setAccounts(cuentasSincronizadas)
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('lacosmina_accounts', JSON.stringify(cuentasSincronizadas))
          }
        }
      })
      .catch(error => console.error('Error al sincronizar cuentas:', error))
  }, [])

  useEffect(() => {
    if (user && user.phone) {
      fetch(`https://sheetdb.io/api/v1/5f2glnefammpr/search?Celular=${user.phone}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const activos: AppOrder[] = []
            const completados: CompletedOrder[] = []
            const entregados: CompletedOrder[] = []

            data.forEach((fila: any) => {
              let itemsParsed = []
              try { 
                itemsParsed = fila['Detalle'] ? JSON.parse(fila['Detalle']) : [] 
              } catch(e) {}

              // NUEVO: Agregamos el securityCode leyendo "Código QR"
              const baseOrder: AppOrder = {
                id: fila['ID de Pedido'],
                customer: fila['Cliente'],
                sede: SEDES[0],
                payment: 'Tarjeta',
                pickupTime: fila['Horario de Recojo'],
                slaSeconds: 1800,
                deadline: Date.now() + 1800000,
                substitution: fila['Sustitución'] !== 'Ninguna',
                items: itemsParsed,
                securityCode: fila['Código QR'] || '', 
              }

              if (fila['Estado'] === 'Entregado') {
                // NUEVO: Extraemos la hora real para evitar "Entregado Entregado"
                entregados.push({ ...baseOrder, deliveredAt: fila['Hora de Entrega'] || '' } as CompletedOrder)
              } else if (fila['Estado'] === 'Listo para recoger') {
                completados.push({ ...baseOrder, readyAt: 'Listo' } as CompletedOrder)
              } else {
                activos.push(baseOrder as AppOrder)
              }
            })

            setOrders(activos)
            setCompletedOrders(completados)
            setDeliveredOrders(entregados)
          }
        })
        .catch(error => console.error('Error al sincronizar pedidos:', error))
    }
  }, [user])

  useEffect(() => { if (hydrated) window.localStorage.setItem('lacosmina_cart', JSON.stringify(cartQty)) }, [cartQty, hydrated])
  useEffect(() => { if (hydrated) window.localStorage.setItem('lacosmina_sede', JSON.stringify(sede)) }, [sede, hydrated])
  useEffect(() => { if (hydrated) window.localStorage.setItem('lacosmina_accounts', JSON.stringify(accounts)) }, [accounts, hydrated])
  useEffect(() => { if (hydrated) window.localStorage.setItem('lacosmina_currentUser', JSON.stringify(user)) }, [user, hydrated])
  useEffect(() => { if (hydrated) window.localStorage.setItem('lacosmina_orders', JSON.stringify(orders)) }, [orders, hydrated])
  useEffect(() => { if (hydrated) window.localStorage.setItem('lacosmina_completed', JSON.stringify(completedOrders)) }, [completedOrders, hydrated])
  useEffect(() => { if (hydrated) window.localStorage.setItem('lacosmina_delivered', JSON.stringify(deliveredOrders)) }, [deliveredOrders, hydrated])
  useEffect(() => { if (hydrated) window.localStorage.setItem('lacosmina_complaints', JSON.stringify(complaints)) }, [complaints, hydrated])
  useEffect(() => { if (hydrated) window.localStorage.setItem('lacosmina_tickets', JSON.stringify(tickets)) }, [tickets, hydrated])

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
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, stock: Object.fromEntries(SEDES.map((s) => [s, available])) as Product['stock'] } : p))
  }, [])

  const openAuth = useCallback((mode: AuthMode) => setAuthMode(mode), [])
  const closeAuth = useCallback(() => setAuthMode(null), [])

  const register = useCallback((data: Account) => {
    const email = data.email.trim().toLowerCase()
    const domain = email.split('@')[1]
    if (!domain || !VALID_DOMAINS.includes(domain)) return 'Usa un proveedor de correo válido.'
    if (accounts.some((a) => a.email.trim().toLowerCase() === email)) return 'Ya existe una cuenta con este correo. Inicia sesión.'
    
    const account: Account = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email,
      phone: data.phone.trim(),
      password: data.password.trim(),
    }
    setAccounts((prev) => [...prev, account])
    const { password: _password, ...customer } = account
    setUser(customer)

    fetch('https://sheetdb.io/api/v1/0793nb34hurdw', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [{
          'Nombre': account.firstName,
          'Apellido': account.lastName,
          'celular': account.phone,
          'correo electrónico': account.email,
          'contraseña': account.password,
        }],
      }),
    }).catch(() => {})

    return null
  }, [accounts])

  const login = useCallback((email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = password.trim()
    const account = accounts.find((a) => a.email.trim().toLowerCase() === cleanEmail)
    
    if (!account) return 'No existe ninguna cuenta registrada con este correo.'
    if (account.password.trim() !== cleanPassword) return 'Contraseña incorrecta.'
    
    const { password: _password, ...customer } = account
    setUser(customer)

    if (typeof window !== 'undefined') window.localStorage.setItem('celular_cliente_actual', account.phone)
    return null
  }, [accounts])

  const logout = useCallback(() => {
    setUser(null)
    if (typeof window !== 'undefined') window.localStorage.removeItem('celular_cliente_actual')
  }, [])

  const addToCart = useCallback((id: string) => {
    const product = products.find((p) => p.id === id)
    if (!product || !isAvailable(product, sede)) return
    setCartQty((prev) => ({ ...prev, [id]: Math.min((prev[id] ?? 0) + 1, MAX_QTY) }))
  }, [products, sede])

  const updateQty = useCallback((id: string, delta: number) => {
    setCartQty((prev) => {
      const next = Math.min((prev[id] ?? 0) + delta, MAX_QTY)
      const copy = { ...prev }
      if (next <= 0) delete copy[id]
      else copy[id] = next
      return copy
    })
  }, [])

  const clearCart = useCallback(() => setCartQty({}), [])

  const cart = useMemo<CartLine[]>(() =>
    Object.entries(cartQty)
      .map(([id, qty]) => {
        const product = products.find((p) => p.id === id)!
        return { product, qty, available: product ? isAvailable(product, sede) : false }
      })
      .filter((line) => line.product),
  [cartQty, products, sede])

  const cartCount = cart.reduce((sum, l) => sum + l.qty, 0)
  const cartTotal = cart.reduce((sum, l) => sum + l.qty * l.product.price, 0)
  const unavailableCount = cart.filter((l) => !l.available).length
  const qtyInCart = useCallback((id: string) => cartQty[id] ?? 0, [cartQty])

  const completeOrder = useCallback((id: string, substitutionNote?: string) => {
    setOrders((prev) => {
      const orderToComplete = prev.find((o) => o.id === id)
      if (orderToComplete) {
        const nowStr = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
        setCompletedOrders((cPrev) => [{ ...orderToComplete, substitutionNote, readyAt: nowStr }, ...cPrev.filter((item) => item.id !== id)])
      }
      return prev.filter((o) => o.id !== id)
    })
    setReadyCount((n) => n + 1)
    showToast(`Pedido ${id} listo para recojo`)

    fetch(`https://sheetdb.io/api/v1/5f2glnefammpr/ID%20de%20Pedido/${id}`, {
      method: 'PATCH',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { 'Estado': 'Listo para recoger' } })
    }).catch(() => {})
  }, [showToast])

  const deliverOrder = useCallback((id: string) => {
    setCompletedOrders((prev) => {
      const orderToDeliver = prev.find((o) => o.id === id)
      if (orderToDeliver) {
        // NUEVO: Calculamos la hora exacta de la entrega
        const nowStr = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })
        
        setDeliveredOrders((dPrev) => [{ ...orderToDeliver, deliveredAt: nowStr }, ...dPrev.filter((item) => item.id !== id)])
        
        // Enviamos la hora exacta a SheetDB para que quede registrada
        fetch(`https://sheetdb.io/api/v1/5f2glnefammpr/ID%20de%20Pedido/${id}`, {
          method: 'PATCH',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { 'Estado': 'Entregado', 'Hora de Entrega': nowStr } })
        }).catch(() => {})
      }
      return prev.filter((o) => o.id !== id)
    })
    showToast(`Pedido ${id} entregado al cliente`)
  }, [showToast])

  const addComplaint = useCallback((data: Omit<Complaint, 'id' | 'createdAt'>) => {
    const newComplaint: Complaint = {
      ...data,
      id: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }),
    }
    setComplaints((prev) => [newComplaint, ...prev])
    showToast('Reclamo registrado exitosamente')
  }, [showToast])

  const resolveComplaint = useCallback((id: string, status: 'Aprobado' | 'Rechazado', text: string) => {
    setComplaints((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, resolutionStatus: status, resolutionText: text } : c));
      const target = next.find(c => c.id === id);
      
      if (target && target.orderId) {
        fetch(`https://sheetdb.io/api/v1/5f2glnefammpr/ID%20de%20Pedido/${target.orderId}`, {
          method: 'PATCH',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { 'Reembolso': status === 'Aprobado' ? 'Reembolso procesado' : 'Rechazado' } })
        }).catch(() => {})
      }
      return next;
    })
    showToast(`Reclamo ${id} marcado como ${status}`)
  }, [showToast])

  const addTicket = useCallback((topic: string, detail: string, urgent: boolean) => {
    const newTicket: SupportTicket = {
      id: `T-${Math.floor(100 + Math.random() * 900)}`,
      topic,
      detail,
      status: 'Abierto',
      urgent,
      createdAt: new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }),
    }
    setTickets((prev) => [newTicket, ...prev])
    showToast('Ticket de soporte enviado')
  }, [showToast])

  const resolveTicket = useCallback((id: string, status: 'En revisión' | 'Resuelto', text?: string) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status, resolutionText: text } : t)))
    showToast(`Ticket ${id} actualizado a ${status}`)
  }, [showToast])

  const placeOrder = useCallback((payment: PaymentMethod, substitution: boolean, pickupTime: string): PlaceOrderResult => {
    if (!user) return { ok: false, reason: 'auth' }
    if (cart.length === 0) return { ok: false, reason: 'empty' }
    
    const substituted = cart.filter((l) => !l.available).length
    if (substituted > 0 && !substitution) return { ok: false, reason: 'substitution' }
    
    const customer = `${user.firstName} ${user.lastName}`
    const id = `LC-${Math.floor(10500 + Math.random() * 8999)}`
    const slaSeconds = 30 * 60
    
    const itemsToSave = cart.map((l) => ({
      name: `${l.product.name} ${l.product.brand}`,
      qty: l.qty,
      price: l.product.price,
      substitute: !l.available,
    }))

    const newOrder: AppOrder = {
      id, customer, sede, payment, pickupTime, slaSeconds,
      deadline: Date.now() + slaSeconds * 1000,
      substitution, items: itemsToSave,
    }

    setOrders((prev) => [...prev, newOrder])
    setCartQty({})

    fetch('https://sheetdb.io/api/v1/5f2glnefammpr', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [{
          'ID de Pedido': id,
          'Cliente': customer,
          'Celular': user.phone,
          'Horario de Recojo': pickupTime,
          'Estado': 'Compra confirmada',
          'Sustitución': substitution ? 'Sí' : 'Ninguna',
          'Reembolso': '-',
          'Detalle': JSON.stringify(itemsToSave),
          'Hora de Entrega': '',
        }]
      })
    }).catch(console.error)

    return { ok: true, orderId: id, customer, total: cartTotal, substituted }
  }, [cart, cartTotal, sede, user])

  const value: StoreContextValue = {
    startShift, products, setStock, setStockAllSedes, user, register, login, logout, authMode, openAuth,
    closeAuth, unavailableCount, cart, cartCount, cartTotal, qtyInCart, addToCart, updateQty, clearCart,
    search, setSearch, category, setCategory, sede, setSede, orders, completedOrders, deliveredOrders,
    complaints, tickets, readyCount, completeOrder, deliverOrder, addComplaint, resolveComplaint, addTicket,
    resolveTicket, placeOrder, toast, showToast,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore debe usarse dentro de StoreProvider')
  return ctx
}
