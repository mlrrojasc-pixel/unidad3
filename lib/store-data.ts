export type Category =
  | 'Higiene y Limpieza'
  | 'Abarrotes'
  | 'Congelados'
  | 'Electro'
  | 'Cuidado del Hogar'

export const CATEGORIES: ('Todo' | Category)[] = [
  'Todo',
  'Higiene y Limpieza',
  'Abarrotes',
  'Congelados',
  'Electro',
  'Cuidado del Hogar',
]

export const SEDES = [
  'Sede Norte',
  'Sede Sur',
  'Sede Centro',
  'Sede Este',
  'Sede Oeste',
] as const

export type Sede = (typeof SEDES)[number]

export interface Product {
  id: string
  name: string
  brand: string
  unit: string
  category: Category
  price: number
  oldPrice?: number
  image: string
  stock: Record<Sede, boolean>
}

export function sedeShort(sede: Sede) {
  return sede.split(' (')[0]
}

function stockExcept(...agotadoEn: Sede[]): Record<Sede, boolean> {
  return Object.fromEntries(SEDES.map((s) => [s, !agotadoEn.includes(s)])) as Record<Sede, boolean>
}

export function isAvailable(product: Product, sede: Sede) {
  return product.stock[sede]
}

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Shampoo Control Caspa', brand: 'Head & Shoulders', unit: 'Frasco 375 ml', category: 'Higiene y Limpieza', price: 18.9, oldPrice: 23.9, image: '/productos/p1.png', stock: stockExcept() },
  { id: 'p2', name: 'Detergente en Polvo Floral', brand: 'Bolívar', unit: 'Bolsa 2.6 kg', category: 'Cuidado del Hogar', price: 32.5, oldPrice: 38.9, image: '/productos/p2.png', stock: stockExcept() },
  { id: 'p3', name: 'Jabón Líquido Antibacterial', brand: 'Protex', unit: 'Doypack 900 ml', category: 'Higiene y Limpieza', price: 14.9, image: '/productos/p3.png', stock: stockExcept() },
  { id: 'p4', name: 'Helado Sublime Clásico', brand: "D'Onofrio", unit: 'Pote 1 L', category: 'Congelados', price: 16.9, oldPrice: 19.9, image: '/productos/p4.png', stock: stockExcept('Sede Norte (Av. Canta Callao)') },
  { id: 'p5', name: 'Licuadora Clásica 10 Velocidades', brand: 'Oster', unit: 'Unidad', category: 'Electro', price: 189.0, oldPrice: 249.0, image: '/productos/p5.png', stock: stockExcept('Sede Norte (Av. Canta Callao)', 'Sede Sur') },
  { id: 'p6', name: 'Arroz Extra Añejo', brand: 'Costeño', unit: 'Bolsa 5 kg', category: 'Abarrotes', price: 24.9, image: '/productos/p6.png', stock: stockExcept() },
  { id: 'p7', name: 'Pollo Entero Fresco', brand: 'San Fernando', unit: 'Aprox. 2.2 kg', category: 'Congelados', price: 22.4, oldPrice: 26.0, image: '/productos/p7.png', stock: stockExcept('Sede Centro') },
  { id: 'p8', name: 'Fideos Spaghetti', brand: 'Don Vittorio', unit: 'Paquete 950 g', category: 'Abarrotes', price: 6.2, image: '/productos/p8.png', stock: stockExcept() },
  { id: 'p9', name: 'Aceite Vegetal', brand: 'Primor', unit: 'Botella 900 ml', category: 'Abarrotes', price: 9.9, oldPrice: 11.5, image: '/productos/p9.png', stock: stockExcept() },
  { id: 'p10', name: 'Leche Evaporada Entera', brand: 'Gloria', unit: 'Pack 6 latas x 400 g', category: 'Abarrotes', price: 22.8, image: '/productos/p10.png', stock: stockExcept(...SEDES) },
  { id: 'p11', name: 'Papel Higiénico Doble Hoja', brand: 'Elite', unit: 'Paquete 24 rollos', category: 'Higiene y Limpieza', price: 28.9, oldPrice: 34.9, image: '/productos/p11.png', stock: stockExcept() },
  { id: 'p12', name: 'Lejía Tradicional', brand: 'Clorox', unit: 'Galonera 4 L', category: 'Cuidado del Hogar', price: 12.5, image: '/productos/p12.png', stock: stockExcept() },
  { id: 'p13', name: 'Hamburguesas de Res', brand: 'Razzeto', unit: 'Caja 8 unid.', category: 'Congelados', price: 19.9, image: '/productos/p13.png', stock: stockExcept('Sede Este', 'Sede Oeste') },
  { id: 'p14', name: 'Hervidor Eléctrico 1.7 L', brand: 'Imaco', unit: 'Unidad', category: 'Electro', price: 69.9, oldPrice: 89.9, image: '/productos/p14.png', stock: stockExcept() },
  { id: 'p15', name: 'Lavavajilla en Pasta Limón', brand: 'Ayudín', unit: 'Pote 900 g', category: 'Cuidado del Hogar', price: 8.9, image: '/productos/p15.png', stock: stockExcept() },
  { id: 'p16', name: 'Pasta Dental Triple Acción', brand: 'Colgate', unit: 'Pack 3 x 75 ml', category: 'Higiene y Limpieza', price: 12.9, oldPrice: 15.9, image: '/productos/p16.png', stock: stockExcept('Sede Norte (Av. Canta Callao)') },
  { id: 'p17', name: 'Azúcar Rubia', brand: 'Cartavio', unit: 'Bolsa 2 kg', category: 'Abarrotes', price: 8.5, image: '/productos/p17.png', stock: stockExcept() },
  { id: 'p18', name: 'Arrocera 1.8 L', brand: 'Record', unit: 'Unidad', category: 'Electro', price: 119.0, image: '/productos/p18.png', stock: stockExcept() },
]

export interface OrderItem {
  name: string
  qty: number
  price: number
  substitute?: boolean
}

export interface Order {
  id: string
  customer: string
  sede: Sede
  payment: 'Tarjeta' | 'Yape' | 'Plin'
  items: OrderItem[]
  slaSeconds: number
  deadline: number | null
  substitution: boolean
}

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'LC-10482',
    customer: 'María Quispe',
    sede: 'Sede Norte (Av. Canta Callao)',
    payment: 'Yape',
    slaSeconds: 9 * 60 + 40,
    deadline: null,
    substitution: true,
    items: [
      { name: 'Arroz Extra Añejo 5 kg', qty: 2, price: 24.9 },
      { name: 'Aceite Vegetal 900 ml', qty: 1, price: 9.9 },
      { name: "Helado Sublime Clásico D'Onofrio 1 L", qty: 1, price: 16.9 },
    ],
  },
  {
    id: 'LC-10483',
    customer: 'Jorge Ramírez',
    sede: 'Sede Norte (Av. Canta Callao)',
    payment: 'Tarjeta',
    slaSeconds: 14 * 60 + 5,
    deadline: null,
    substitution: false,
    items: [
      { name: 'Licuadora Oster 10 Velocidades', qty: 1, price: 189.0 },
      { name: 'Detergente Bolívar 2.6 kg', qty: 1, price: 32.5 },
    ],
  },
  {
    id: 'LC-10484',
    customer: 'Lucía Fernández',
    sede: 'Sede Norte (Av. Canta Callao)',
    payment: 'Plin',
    slaSeconds: 21 * 60 + 30,
    deadline: null,
    substitution: true,
    items: [
      { name: 'Pollo Entero San Fernando', qty: 1, price: 22.4 },
      { name: 'Fideos Spaghetti Don Vittorio', qty: 3, price: 6.2 },
      { name: 'Papel Higiénico Elite x24', qty: 1, price: 28.9 },
      { name: 'Jabón Líquido Protex 900 ml', qty: 2, price: 14.9 },
    ],
  },
  {
    id: 'LC-10485',
    customer: 'Carlos Mendoza',
    sede: 'Sede Norte (Av. Canta Callao)',
    payment: 'Yape',
    slaSeconds: 28 * 60,
    deadline: null,
    substitution: false,
    items: [
      { name: 'Shampoo Head & Shoulders 375 ml', qty: 1, price: 18.9 },
      { name: 'Pasta Dental Colgate x3', qty: 1, price: 12.9 },
    ],
  },
]

export function formatPrice(value: number) {
  return `S/ ${value.toFixed(2)}`
}

export function discountPercent(product: Product) {
  if (!product.oldPrice) return 0
  return Math.round((1 - product.price / product.oldPrice) * 100)
}

