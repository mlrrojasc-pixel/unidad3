import type { Metadata } from 'next'
import { CartPage } from '@/components/cliente/cart-page'

export const metadata: Metadata = { title: 'Mi carrito | La Cosmina' }

export default function Page() {
  return <CartPage />
}
