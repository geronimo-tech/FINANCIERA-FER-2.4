import { Header } from '@/components/header'
import { PrestamoDetail } from '@/components/prestamo-detail'

export const metadata = {
  title: 'Detalle de Préstamo - SOFiN Fernández Y Asociados',
  description: 'Información detallada del préstamo',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PrestamoDetailPage({ params }: PageProps) {
  const { id } = await params
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <PrestamoDetail id={id} />
      </main>
    </div>
  )
}
