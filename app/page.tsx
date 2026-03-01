import Image from 'next/image'
import { Header } from '@/components/header'
import { Dashboard } from '@/components/dashboard'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="FINANCIERA FERNÁNDEZ Y ASOCIADOS"
            width={70}
            height={70}
            className="h-16 w-16 object-contain"
          />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Panel de Control</h1>
            <p className="text-muted-foreground">
              FINANCIERA FERNÁNDEZ Y ASOCIADOS
            </p>
          </div>
        </div>
        <Dashboard />
      </main>
    </div>
  )
}
