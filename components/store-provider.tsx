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
  orders: Order[]
  readyCount: number
  completeOrder: (id: string) => void
  placeOrder: (payment: PaymentMethod, substitution: boolean) => PlaceOrderResult
  toast: string | null
  showToast: (message: string) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

const MAX_QTY = 20

// Funciones auxiliares para Local Storage
const getLocalData = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    return defaultValue
  }
}

const setLocalData = (key: string, value: any) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(value))
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  
  // Estados con Local Storage
  const [cartQty, setCartQty] = useState<Record<string, number>>({})
  const [sede, setSede] = useState<Sede>(SEDES[0])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [user, setUser] = useState<Customer | null>(null)
  
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'Todo' | Category>('Todo')
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS)
  const [readyCount, setReadyCount] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cargar datos al montar el componente
  useEffect(() => {
    setCartQty(getLocalData('lacosmina_cart', {}))
    setSede(getLocalData('lacosmina_sede', SEDES[0]))
    setAccounts(getLocalData('lacosmina_accounts', []))
    setUser(getLocalData('lacosmina_currentUser', null))
  }, [])

  // Guardar datos cuando cambian
  useEffect(() => {
    setLocalData('lacosmina_cart', cartQty)
  }, [cartQty])

  useEffect(() => {
    setLocalData('lacosmina_sede', sede)
  }, [sede])

  useEffect(() => {
    setLocalData('lacosmina_accounts', accounts)
  }, [accounts])

  useEffect(() => {
    setLocalData('lacosmina_currentUser', user)
  }, [user])

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
      if (accounts.some((a) => a.email === email)) return 'Ya existe una cuenta con este correo. Inicia sesión.'
      const account = { ...data, email, firstName: data.firstName.trim(), lastName: data.lastName.trim() }
      setAccounts((prev) => [...prev, account])
      const { password: _password, ...customer } = account
      setUser(customer)
      return null
    },
    [accounts],
  )

  const login = useCallback(
    (email: string, password: string) => {
      const account = accounts.find((a) => a.email === email.trim().toLowerCase())
      if (!account || account.password !== password) return 'Correo o contraseña incorrectos.'
      const { password: _password, ...customer } = account
      setUser(customer)
      return null
    },
    [accounts],
  )

  const logout = useCallback(() => setUser(null), [])

  const addToCart = useCallback(
    (id: string) => {
      const product = products.find((p) => p.id === id)
      if (!product || !isAvailable(product, sede)) return
      setCartQty((prev) => ({ ...prev, [id]: Math.min((prev[id] ?? 0) + 1, MAX_QTY) }))
    },
    [products, sede],
  )

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

  const cart = useMemo<CartLine[]>(
    () =>
      Object.entries(cartQty)
        .map(([id, qty]) => {
          const product = products.find((p) => p.id === id)!
          return { product, qty, available: product ? isAvailable(product, sede) : false }
        })
        .filter((line) => line.product),
    [cartQty, products, sede],
  )

  const cartCount = cart.reduce((sum, l) => sum + l.qty, 0)
  const cartTotal = cart.reduce((sum, l) => sum + l.qty * l.product.price, 0)
  const unavailableCount = cart.filter((l) => !l.available).length
  const qtyInCart = useCallback((id: string) => cartQty[id] ?? 0, [cartQty])

  const completeOrder = useCallback(
    (id: string) => {
      setOrders((prev) => prev.filter((o) => o.id !== id))
      setReadyCount((n) => n + 1)
      showToast(`Pedido ${id} marcado como listo`)
    },
    [showToast],
  )

  const placeOrder = useCallback(
    (payment: PaymentMethod, substitution: boolean): PlaceOrderResult => {
      if (!user) return { ok: false, reason: 'auth' }
      if (cart.length === 0) return { ok: false, reason: 'empty' }
      const substituted = cart.filter((l) => !l.available).length
      if (substituted > 0 && !substitution) return { ok: false, reason: 'substitution' }
      const customer = `${user.firstName} ${user.lastName}`
      const id = `LC-${Math.floor(10500 + Math.random() * 8999)}`
      const slaSeconds = 30 * 60
      setOrders((prev) => [
        ...prev,
        {
          id,
          customer,
          sede,
          payment,
          slaSeconds,
          deadline: Date.now() + slaSeconds * 1000,
          substitution,
          items: cart.map((l) => ({
            name: `${l.product.name} ${l.product.brand}`,
            qty: l.qty,
            price: l.product.price,
            substitute: !l.available,
          })),
        },
      ])
      setCartQty({})
      return { ok: true, orderId: id, customer, total: cartTotal, substituted }
    },
    [cart, cartTotal, sede, user],
  )

  const value: StoreContextValue = {
    startShift,
    products,
    setStock,
    setStockAllSedes,
    user,
    register,
    login,
    logout,
    authMode,
    openAuth,
    closeAuth,
    unavailableCount,
    cart,
    cartCount,
    cartTotal,
    qtyInCart,
    addToCart,
    updateQty,
    clearCart,
    search,
    setSearch,
    category,
    setCategory,
    sede,
    setSede,
    orders,
    readyCount,
    completeOrder,
    placeOrder,
    toast,
    showToast,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore debe usarse dentro de StoreProvider')
  return ctx
}
