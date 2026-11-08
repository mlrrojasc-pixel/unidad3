import { TiendaShell } from '@/components/cliente/tienda-shell'

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return <TiendaShell>{children}</TiendaShell>
}
