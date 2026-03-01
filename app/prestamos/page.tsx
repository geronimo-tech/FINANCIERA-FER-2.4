import Image from 'next/image'
import { Header } from '@/components/header'
import { PrestamosList } from '@/components/prestamos-list'

export const metadata = {
  title: 'Préstamos - FINANCIERA FERNÁNDEZ Y ASOCIADOS',
  description: 'Lista de todos los préstamos registrados',
}

export default function PrestamosPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="FINANCIERA FERNÁNDEZ Y ASOCIADOS"
            width={60}
            height={60}
            className="h-14 w-14 object-contain"
          />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Préstamos</h1>
            <p className="text-muted-foreground">
              Gestiona todos los préstamos de tus clientes
            </p>
          </div>
        </div>
        <PrestamosList />
      </main>
    </div>
  )
}
