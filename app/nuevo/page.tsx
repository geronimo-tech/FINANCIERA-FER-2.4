import Image from 'next/image'
import { Header } from '@/components/header'
import { PrestamoForm } from '@/components/prestamo-form'

export const metadata = {
  title: 'Nuevo Préstamo - FINANCIERA FERNÁNDEZ Y ASOCIADOS',
  description: 'Registrar un nuevo préstamo',
}

export default function NuevoPrestamoPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="FINANCIERA FERNÁNDEZ Y ASOCIADOS"
            width={60}
            height={60}
            className="h-14 w-14 object-contain"
          />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Nuevo Préstamo</h1>
            <p className="text-muted-foreground">
              Completa el formulario para registrar un nuevo préstamo
            </p>
          </div>
        </div>
        <PrestamoForm />
      </main>
    </div>
  )
}
