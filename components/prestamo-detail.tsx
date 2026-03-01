'use client'

import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  MapPin,
  Phone,
  Trash2,
  User,
  XCircle,
  Plus,
  Edit3,
  Bell,
  Check,
  X,
  Clock,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDate } from '@/lib/format'
import { 
  deletePrestamo, 
  getPrestamoById, 
  updatePrestamo, 
  marcarPagoMensual,
  agregarMesesPago,
  modificarMontoPago,
  modificarFechaPago,
  modificarDiaCobroTodos,
} from '@/lib/prestamos-store'
import type { Prestamo, PagoMensual } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PrestamoDetailProps {
  id: string
}

export function PrestamoDetail({ id }: PrestamoDetailProps) {
  const router = useRouter()
  const [prestamo, setPrestamo] = useState<Prestamo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [agregarMesesDialogOpen, setAgregarMesesDialogOpen] = useState(false)
  const [editPagoDialogOpen, setEditPagoDialogOpen] = useState(false)
  const [selectedPago, setSelectedPago] = useState<PagoMensual | null>(null)
  const [editFechaDialogOpen, setEditFechaDialogOpen] = useState(false)
  const [nuevaFechaCobro, setNuevaFechaCobro] = useState('')
  const [editDiaGlobalDialogOpen, setEditDiaGlobalDialogOpen] = useState(false)
  const [nuevoDiaCobro, setNuevoDiaCobro] = useState(1)
  
  const [editForm, setEditForm] = useState({
    nombreCliente: '',
    telefono: '',
    domicilio: '',
    montoCapital: 0,
    tasaInteres: 0,
    fechaSolicitud: '',
  })
  const [mesesAgregar, setMesesAgregar] = useState(1)
  const [nuevoMontoPago, setNuevoMontoPago] = useState(0)

  useEffect(() => {
    const data = getPrestamoById(id)
    setPrestamo(data)
    if (data) {
      setEditForm({
        nombreCliente: data.nombreCliente,
        telefono: data.telefono,
        domicilio: data.domicilio,
        montoCapital: data.montoCapital,
        tasaInteres: data.tasaInteres,
        fechaSolicitud: data.fechaSolicitud,
      })
    }
    setIsLoading(false)
  }, [id])

  const handleEstadoChange = useCallback(
    (estado: Prestamo['estado']) => {
      if (!prestamo) return
      const updated = updatePrestamo(id, { estado })
      if (updated) setPrestamo(updated)
    },
    [id, prestamo]
  )

  const handleDelete = useCallback(() => {
    deletePrestamo(id)
    router.push('/prestamos')
  }, [id, router])

  const handleMarcarPago = useCallback((pagoId: string, pagado: boolean) => {
    if (!prestamo) return
    const updated = marcarPagoMensual(id, pagoId, pagado)
    if (updated) setPrestamo(updated)
  }, [id, prestamo])

  const handleEditPrestamo = useCallback(() => {
    if (!prestamo) return
    const updated = updatePrestamo(id, editForm)
    if (updated) {
      setPrestamo(updated)
      setEditDialogOpen(false)
    }
  }, [id, prestamo, editForm])

  const handleAgregarMeses = useCallback(() => {
    if (!prestamo || mesesAgregar <= 0) return
    const updated = agregarMesesPago(id, mesesAgregar)
    if (updated) {
      setPrestamo(updated)
      setAgregarMesesDialogOpen(false)
      setMesesAgregar(1)
    }
  }, [id, prestamo, mesesAgregar])

  const handleEditarMontoPago = useCallback(() => {
    if (!prestamo || !selectedPago || nuevoMontoPago <= 0) return
    const updated = modificarMontoPago(id, selectedPago.id, nuevoMontoPago)
    if (updated) {
      setPrestamo(updated)
      setEditPagoDialogOpen(false)
      setSelectedPago(null)
      setNuevoMontoPago(0)
    }
  }, [id, prestamo, selectedPago, nuevoMontoPago])

  const openEditPagoDialog = (pago: PagoMensual) => {
    setSelectedPago(pago)
    setNuevoMontoPago(pago.montoCobro)
    setEditPagoDialogOpen(true)
  }

  const openEditFechaDialog = (pago: PagoMensual) => {
    setSelectedPago(pago)
    setNuevaFechaCobro(pago.fechaCobro)
    setEditFechaDialogOpen(true)
  }

  const handleEditarFechaPago = useCallback(() => {
    if (!prestamo || !selectedPago || !nuevaFechaCobro) return
    const updated = modificarFechaPago(id, selectedPago.id, nuevaFechaCobro)
    if (updated) {
      setPrestamo(updated)
      setEditFechaDialogOpen(false)
      setSelectedPago(null)
      setNuevaFechaCobro('')
    }
  }, [id, prestamo, selectedPago, nuevaFechaCobro])

  const handleCambiarDiaGlobal = useCallback(() => {
    if (!prestamo || nuevoDiaCobro < 1 || nuevoDiaCobro > 31) return
    const updated = modificarDiaCobroTodos(id, nuevoDiaCobro)
    if (updated) {
      setPrestamo(updated)
      setEditDiaGlobalDialogOpen(false)
    }
  }, [id, prestamo, nuevoDiaCobro])

  // Calcular estadisticas
  const pagosPendientes = prestamo?.pagosMensuales.filter(p => !p.pagado) || []
  const pagosCompletados = prestamo?.pagosMensuales.filter(p => p.pagado) || []
  const totalInteresesCobrados = pagosCompletados.reduce((sum, p) => sum + p.montoCobro, 0)
  const totalInteresesPendientes = pagosPendientes.reduce((sum, p) => sum + p.montoCobro, 0)

  // Helper to parse date as local time
  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  // Obtener proximo pago pendiente
  const proximoPago = pagosPendientes.sort((a, b) =>
  parseLocalDate(a.fechaCobro).getTime() - parseLocalDate(b.fechaCobro).getTime()
  )[0]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!prestamo) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircle className="mb-4 h-12 w-12 text-destructive" />
        <h2 className="mb-2 text-xl font-semibold text-foreground">Prestamo no encontrado</h2>
        <p className="mb-4 text-muted-foreground">El prestamo que buscas no existe o fue eliminado.</p>
        <Button asChild>
          <Link href="/prestamos">Volver a Prestamos</Link>
        </Button>
      </div>
    )
  }

  const estadoConfig = {
    activo: { label: 'Activo', className: 'bg-primary/10 text-primary border-primary/20' },
    pagado: { label: 'Pagado', className: 'bg-success/10 text-success border-success/20' },
  }

  const estado = estadoConfig[prestamo.estado]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/prestamos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Image
          src="/logo.png"
          alt="FINANCIERA FERNÁNDEZ Y ASOCIADOS"
          width={50}
          height={50}
          className="h-12 w-12 object-contain"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{prestamo.nombreCliente}</h1>
          <p className="text-sm text-muted-foreground">
            Registrado el {formatDate(prestamo.createdAt)}
          </p>
        </div>
        <Badge variant="outline" className={cn("text-sm", estado.className)}>
          {estado.label}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Informacion del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informacion del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                {prestamo.fotoINE ? (
                  <img
                    src={prestamo.fotoINE || "/placeholder.svg"}
                    alt={`INE de ${prestamo.nombreCliente}`}
                    className="w-32 rounded-lg object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-24 w-32 items-center justify-center rounded-lg bg-muted">
                    <User className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre Completo</p>
                    <p className="font-semibold text-foreground">{prestamo.nombreCliente}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${prestamo.telefono}`}
                      className="text-primary hover:underline"
                    >
                      {prestamo.telefono}
                    </a>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <p className="text-foreground">{prestamo.domicilio}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendario de Pagos Mensuales */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Pagos Mensuales
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-transparent"
                  onClick={() => {
                    // Get current day from first payment
                    if (prestamo.pagosMensuales.length > 0) {
                      const [, , day] = prestamo.pagosMensuales[0].fechaCobro.split('-').map(Number)
                      setNuevoDiaCobro(day)
                    }
                    setEditDiaGlobalDialogOpen(true)
                  }}
                >
                  <Calendar className="mr-1 h-3 w-3" />
                  Cambiar Dia
                </Button>
                <Dialog open={agregarMesesDialogOpen} onOpenChange={setAgregarMesesDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="bg-transparent">
                      <Plus className="mr-1 h-3 w-3" />
                      Agregar Meses
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Agregar Meses de Pago</DialogTitle>
                      <DialogDescription>
                        Agrega mas meses de cobro al prestamo.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="meses">Cantidad de meses a agregar</Label>
                        <Input
                          id="meses"
                          type="number"
                          min="1"
                          max="24"
                          value={mesesAgregar}
                          onChange={(e) => setMesesAgregar(parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAgregarMesesDialogOpen(false)} className="bg-transparent">
                        Cancelar
                      </Button>
                      <Button onClick={handleAgregarMeses}>
                        Agregar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {prestamo.pagosMensuales.map((pago) => {
                  // Parse date as local time to avoid timezone issues
                  const [year, month, day] = pago.fechaCobro.split('-').map(Number)
                  const fechaCobro = new Date(year, month - 1, day)
                  const hoy = new Date()
                  hoy.setHours(0, 0, 0, 0) // Reset time for accurate comparison
                  const esVencido = !pago.pagado && fechaCobro < hoy
                  const esProximo = proximoPago?.id === pago.id
                  
                  return (
                    <div
                      key={pago.id}
                      className={cn(
                        "flex items-center justify-between rounded-lg border-2 p-3 transition-colors bg-card",
                        pago.pagado 
                          ? "border-green-500" 
                          : esVencido 
                            ? "border-red-500" 
                            : esProximo
                              ? "border-primary"
                              : "border-border"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                          pago.pagado 
                            ? "bg-green-500/10 text-green-600" 
                            : esVencido 
                              ? "bg-red-500/10 text-red-600"
                              : "bg-muted text-muted-foreground"
                        )}>
                          {pago.pagado ? <Check className="h-5 w-5" /> : pago.mes}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            Mes {pago.mes} - {formatCurrency(pago.montoCobro)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Cobro: {formatDate(pago.fechaCobro)}
                            {pago.pagado && pago.fechaPago && ` | Pagado: ${formatDate(pago.fechaPago)}`}
                          </p>
                          {esVencido && !pago.pagado && (
                            <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Pago vencido
                            </p>
                          )}
                          {esProximo && !pago.pagado && !esVencido && (
                            <p className="text-xs text-primary font-medium flex items-center gap-1">
                              <Bell className="h-3 w-3" /> Proximo cobro
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditPagoDialog(pago)}>
                              Editar Monto
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditFechaDialog(pago)}>
                              Editar Fecha de Cobro
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {pago.pagado ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarcarPago(pago.id, false)}
                            className="bg-transparent border-orange-300 text-orange-600 hover:bg-orange-50"
                          >
                            <X className="mr-1 h-3 w-3" />
                            Desmarcar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleMarcarPago(pago.id, true)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Pagado
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Resumen del Prestamo */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Resumen del Prestamo</CardTitle>
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Modificar Prestamo</DialogTitle>
                    <DialogDescription>
                      Edita los datos del prestamo y del cliente.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2">
                      <Label htmlFor="edit-nombre">Nombre del Cliente</Label>
                      <Input
                        id="edit-nombre"
                        value={editForm.nombreCliente}
                        onChange={(e) => setEditForm(prev => ({ ...prev, nombreCliente: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-telefono">Telefono</Label>
                      <Input
                        id="edit-telefono"
                        type="tel"
                        value={editForm.telefono}
                        onChange={(e) => setEditForm(prev => ({ ...prev, telefono: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-domicilio">Domicilio</Label>
                      <Textarea
                        id="edit-domicilio"
                        value={editForm.domicilio}
                        onChange={(e) => setEditForm(prev => ({ ...prev, domicilio: e.target.value }))}
                        className="min-h-[80px]"
                      />
                    </div>
                    <div className="border-t pt-4 space-y-4">
                      <p className="text-sm font-medium text-foreground">Datos del Prestamo</p>
                      <div className="space-y-2">
                        <Label htmlFor="edit-fecha">Fecha del Prestamo</Label>
                        <Input
                          id="edit-fecha"
                          type="date"
                          value={editForm.fechaSolicitud}
                          onChange={(e) => setEditForm(prev => ({ ...prev, fechaSolicitud: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Cambiar la fecha del prestamo (dia en que se realizo)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-capital">Monto del Capital</Label>
                        <Input
                          id="edit-capital"
                          type="number"
                          min="0"
                          value={editForm.montoCapital}
                          onChange={(e) => setEditForm(prev => ({ ...prev, montoCapital: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-tasa">Tasa de Interes (%)</Label>
                        <Input
                          id="edit-tasa"
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.tasaInteres}
                          onChange={(e) => setEditForm(prev => ({ ...prev, tasaInteres: parseFloat(e.target.value) || 0 }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Nuevo interes mensual: {formatCurrency(editForm.montoCapital * (editForm.tasaInteres / 100))}
                        </p>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="bg-transparent">
                      Cancelar
                    </Button>
                    <Button onClick={handleEditPrestamo}>
                      Guardar Cambios
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fecha del Prestamo:</span>
                  <span className="font-semibold text-foreground">
                    {formatDate(prestamo.fechaSolicitud)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Frecuencia:</span>
                  <span className="font-semibold text-foreground capitalize">
                    {prestamo.frecuenciaPago}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Capital:</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(prestamo.montoCapital)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Tasa de Interes:
                  </span>
                  <span className="font-semibold text-foreground">
                    {prestamo.tasaInteres}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Interes Mensual:</span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(prestamo.montoInteresMensual)}
                  </span>
                </div>
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pagos completados:</span>
                    <span className="font-semibold text-green-600">
                      {pagosCompletados.length} de {prestamo.pagosMensuales.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Intereses cobrados:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(totalInteresesCobrados)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Pendiente de intereses:</span>
                    <span className={cn(
                      "text-lg font-bold",
                      totalInteresesPendientes > 0 ? "text-destructive" : "text-green-600"
                    )}>
                      {formatCurrency(totalInteresesPendientes)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proximo Cobro */}
          {proximoPago && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Bell className="h-5 w-5" />
                  Proximo Cobro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{formatCurrency(proximoPago.montoCobro)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Fecha: {formatDate(proximoPago.fechaCobro)}
                </p>
                <Button 
                  className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  onClick={() => handleMarcarPago(proximoPago.id, true)}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Marcar como Pagado
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Acciones */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {prestamo.estado !== 'pagado' && (
                <Button
                  className="w-full bg-success hover:bg-success/90 text-success-foreground"
                  onClick={() => handleEstadoChange('pagado')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marcar Prestamo como Liquidado
                </Button>
              )}
              {prestamo.estado === 'pagado' && (
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => handleEstadoChange('activo')}
                >
                  Reactivar Prestamo
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar Prestamo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar Prestamo</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta accion no se puede deshacer. Se eliminara permanentemente el prestamo de{' '}
                      <strong>{prestamo.nombreCliente}</strong>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog para editar monto de pago */}
      <Dialog open={editPagoDialogOpen} onOpenChange={setEditPagoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modificar Monto del Pago</DialogTitle>
            <DialogDescription>
              Cambia el monto a cobrar para este mes. Util para agregar cargos por atraso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nuevo-monto">Nuevo Monto</Label>
              <Input
                id="nuevo-monto"
                type="number"
                min="0"
                step="0.01"
                value={nuevoMontoPago || ''}
                onChange={(e) => setNuevoMontoPago(parseFloat(e.target.value) || 0)}
              />
              {selectedPago && (
                <p className="text-xs text-muted-foreground">
                  Monto original: {formatCurrency(prestamo?.montoInteresMensual || 0)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPagoDialogOpen(false)} className="bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handleEditarMontoPago}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar fecha de cobro */}
      <Dialog open={editFechaDialogOpen} onOpenChange={setEditFechaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modificar Fecha de Cobro</DialogTitle>
            <DialogDescription>
              Cambia la fecha de cobro para este pago. Util si cometiste un error al guardarlo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nueva-fecha">Nueva Fecha de Cobro</Label>
              <Input
                id="nueva-fecha"
                type="date"
                value={nuevaFechaCobro}
                onChange={(e) => setNuevaFechaCobro(e.target.value)}
              />
              {selectedPago && (
                <p className="text-xs text-muted-foreground">
                  Fecha actual: {formatDate(selectedPago.fechaCobro)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFechaDialogOpen(false)} className="bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handleEditarFechaPago}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para cambiar dia de cobro de TODOS los pagos */}
      <Dialog open={editDiaGlobalDialogOpen} onOpenChange={setEditDiaGlobalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Dia de Cobro</DialogTitle>
            <DialogDescription>
              Cambia el dia de cobro de TODOS los pagos de este prestamo. Por ejemplo, si cambias del dia 2 al dia 15, todos los pagos se moveran al dia 15 de cada mes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nuevo-dia">Nuevo Dia de Cobro (1-31)</Label>
              <Input
                id="nuevo-dia"
                type="number"
                min="1"
                max="31"
                value={nuevoDiaCobro}
                onChange={(e) => setNuevoDiaCobro(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                Se ajustara automaticamente para meses con menos dias (ej: febrero).
              </p>
            </div>
            <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3">
              <p className="text-sm text-foreground">
                <strong>Nota:</strong> Este cambio afectara a <strong>todos los {prestamo?.pagosMensuales.length || 0} pagos</strong> de este prestamo.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDiaGlobalDialogOpen(false)} className="bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handleCambiarDiaGlobal}>
              Cambiar Todos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
