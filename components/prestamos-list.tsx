'use client'

import { FileText, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PrestamoCard } from './prestamo-card'
import { getPrestamos } from '@/lib/prestamos-store'
import type { Prestamo } from '@/lib/types'

export function PrestamosList() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [filteredPrestamos, setFilteredPrestamos] = useState<Prestamo[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const data = getPrestamos()
    setPrestamos(data)
    setFilteredPrestamos(data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let filtered = prestamos

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.nombreCliente.toLowerCase().includes(term) ||
          p.telefono.includes(term) ||
          p.domicilio.toLowerCase().includes(term)
      )
    }

    if (filterEstado !== 'todos') {
      filtered = filtered.filter((p) => p.estado === filterEstado)
    }

    setFilteredPrestamos(filtered)
  }, [searchTerm, filterEstado, prestamos])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o dirección..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="activo">Activos</SelectItem>
              <SelectItem value="pagado">Pagados</SelectItem>
              <SelectItem value="vencido">Vencidos</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href="/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo
            </Link>
          </Button>
        </div>
      </div>

      {filteredPrestamos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-16">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-1 text-lg font-semibold text-foreground">
            {prestamos.length === 0 ? 'No hay préstamos registrados' : 'No se encontraron resultados'}
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {prestamos.length === 0
              ? 'Comienza registrando tu primer préstamo'
              : 'Intenta con otros términos de búsqueda'}
          </p>
          {prestamos.length === 0 && (
            <Button asChild>
              <Link href="/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Registrar Préstamo
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPrestamos.map((prestamo) => (
            <PrestamoCard key={prestamo.id} prestamo={prestamo} />
          ))}
        </div>
      )}
    </div>
  )
}
