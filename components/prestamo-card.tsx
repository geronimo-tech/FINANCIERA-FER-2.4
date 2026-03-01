'use client'

import { Calendar, MapPin, Phone, User, Bell, Check, Clock } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatCurrency, formatShortDate } from '@/lib/format'
import type { Prestamo } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PrestamoCardProps {
  prestamo: Prestamo
}

export function PrestamoCard({ prestamo }: PrestamoCardProps) {
  const estadoConfig = {
    activo: { label: 'Activo', className: 'bg-primary/10 text-primary border-primary/20' },
    pagado: { label: 'Pagado', className: 'bg-success/10 text-success border-success/20' },
  }

  const estado = estadoConfig[prestamo.estado]

  // Helper to parse date as local time
  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  // Calcular pagos pendientes y vencidos
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0) // Reset time for accurate comparison
  const pagosPendientes = prestamo.pagosMensuales.filter(p => !p.pagado)
  const pagosVencidos = pagosPendientes.filter(p => parseLocalDate(p.fechaCobro) < hoy)
  const pagosCompletados = prestamo.pagosMensuales.filter(p => p.pagado)
  
  // Proximo pago
  const proximoPago = pagosPendientes.sort((a, b) => 
    parseLocalDate(a.fechaCobro).getTime() - parseLocalDate(b.fechaCobro).getTime()
  )[0]

  return (
    <Link href={`/prestamos/${prestamo.id}`}>
      <Card className="group cursor-pointer transition-all duration-200 hover:border-primary/30 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {prestamo.fotoINE ? (
                <img
                  src={prestamo.fotoINE || "/placeholder.svg"}
                  alt={`INE de ${prestamo.nombreCliente}`}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {prestamo.nombreCliente}
                </h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {prestamo.telefono}
                </div>
              </div>
            </div>
            <Badge variant="outline" className={cn("shrink-0", estado.className)}>
              {estado.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Capital</p>
              <p className="font-semibold text-foreground">{formatCurrency(prestamo.montoCapital)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Interes Mensual ({prestamo.tasaInteres}%)</p>
              <p className="font-semibold text-primary">{formatCurrency(prestamo.montoInteresMensual)}</p>
            </div>
          </div>

          {/* Estado de pagos */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
              <Check className="h-3 w-3" />
              {pagosCompletados.length} pagados
            </div>
            {pagosVencidos.length > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                <Clock className="h-3 w-3" />
                {pagosVencidos.length} vencidos
              </div>
            )}
            {pagosPendientes.length > 0 && pagosVencidos.length === 0 && (
              <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                {pagosPendientes.length} pendientes
              </div>
            )}
          </div>

          {/* Proximo cobro */}
          {proximoPago && prestamo.estado === 'activo' && (
            <div className={cn(
              "rounded-lg p-3 bg-card",
              pagosVencidos.length > 0 ? "border-2 border-red-500" : "border-2 border-primary"
            )}>
              <div className="flex items-center gap-2 mb-1">
                <Bell className={cn("h-3 w-3", pagosVencidos.length > 0 ? "text-red-600" : "text-primary")} />
                <p className={cn("text-xs font-medium", pagosVencidos.length > 0 ? "text-red-600" : "text-primary")}>
                  {pagosVencidos.length > 0 ? 'Pago vencido' : 'Proximo cobro'}
                </p>
              </div>
              <p className={cn("text-lg font-bold", pagosVencidos.length > 0 ? "text-red-700" : "text-primary")}>
                {formatCurrency(proximoPago.montoCobro)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatShortDate(proximoPago.fechaCobro)}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Inicio: {formatShortDate(prestamo.fechaSolicitud)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{prestamo.domicilio}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
