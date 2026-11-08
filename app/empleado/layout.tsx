import type { Metadata } from 'next'
import { EmpleadoShell } from '@/components/empleado/empleado-view'

export const metadata: Metadata = { title: 'Panel de tienda | La Cosmina' }

export default function EmpleadoLayout({ children }: { children: React.ReactNode }) {
  return <EmpleadoShell>{children}</EmpleadoShell>
}
