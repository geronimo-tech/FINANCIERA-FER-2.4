'use client'

import { LogOut, Menu, Settings, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/auth'

export function Header() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="FINANCIERA FERNANDEZ Y ASOCIADOS"
            width={50}
            height={50}
            className="h-12 w-12 object-contain"
          />
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-foreground">FINANCIERA</h1>
            <p className="text-xs text-muted-foreground">FERNANDEZ Y ASOCIADOS</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" asChild>
            <Link href="/">Inicio</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/prestamos">Prestamos</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/nuevo">Nuevo Prestamo</Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/configuracion">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-card md:hidden">
          <nav className="flex flex-col p-4">
            <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
              <Link href="/">Inicio</Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
              <Link href="/prestamos">Prestamos</Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
              <Link href="/nuevo">Nuevo Prestamo</Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
              <Link href="/configuracion">
                <Settings className="mr-2 h-4 w-4" />
                Configuracion
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                setMobileMenuOpen(false)
                handleLogout()
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesion
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
