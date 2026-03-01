'use client'

import { Bell, BellOff, BellRing, Clock, Plus, Trash2, Calendar } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  isNotificationSupported,
  requestNotificationPermission,
  getNotificationPermission,
  sendNotification,
  registerServiceWorker,
} from '@/lib/notifications'
import {
  getRecordatorios,
  createRecordatorio,
  deleteRecordatorio,
  toggleRecordatorio,
  getPrestamos,
} from '@/lib/prestamos-store'
import type { Recordatorio } from '@/lib/types'
import { cn } from '@/lib/utils'

const DIAS_SEMANA = [
  { value: 0, label: 'Dom', fullLabel: 'Domingo' },
  { value: 1, label: 'Lun', fullLabel: 'Lunes' },
  { value: 2, label: 'Mar', fullLabel: 'Martes' },
  { value: 3, label: 'Mie', fullLabel: 'Miercoles' },
  { value: 4, label: 'Jue', fullLabel: 'Jueves' },
  { value: 5, label: 'Vie', fullLabel: 'Viernes' },
  { value: 6, label: 'Sab', fullLabel: 'Sabado' },
]

const TIPOS_RECORDATORIO = [
  { value: 'general', label: 'General - Todos los pagos pendientes' },
  { value: 'vencidos', label: 'Urgente - Solo pagos vencidos' },
  { value: 'proximos', label: 'Proximo - Pagos por vencer' },
]

export function RecordatoriosManager() {
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([])
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  // Form state
  const [nombre, setNombre] = useState('')
  const [hora, setHora] = useState('09:00')
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([1, 2, 3, 4, 5]) // Lun-Vie por defecto
  const [tipo, setTipo] = useState<'general' | 'vencidos' | 'proximos'>('general')

  useEffect(() => {
    setRecordatorios(getRecordatorios())
    setPermission(getNotificationPermission())
    registerServiceWorker()
    setIsLoading(false)
  }, [])

  // Programar notificaciones
  useEffect(() => {
    if (permission !== 'granted' || recordatorios.length === 0) return

    const checkAndNotify = () => {
      const ahora = new Date()
      const diaActual = ahora.getDay()
      const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`
      
      recordatorios.forEach((rec) => {
        if (!rec.activo) return
        if (!rec.diasSemana.includes(diaActual)) return
        if (rec.hora !== horaActual) return
        
        // Verificar que no se haya enviado ya esta notificacion hoy
        const lastSentKey = `recordatorio_sent_${rec.id}_${ahora.toDateString()}`
        if (localStorage.getItem(lastSentKey)) return
        
        const prestamos = getPrestamos()
        const activos = prestamos.filter(p => p.estado === 'activo')
        
        let pagosVencidos = 0
        let pagosPorVencer = 0
        
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)
        
        activos.forEach((prestamo) => {
          prestamo.pagosMensuales.forEach((pago) => {
            if (pago.pagado) return
            const [year, month, day] = pago.fechaCobro.split('-').map(Number)
            const fechaPago = new Date(year, month - 1, day)
            
            if (fechaPago < hoy) {
              pagosVencidos++
            } else {
              const diffDays = Math.ceil((fechaPago.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
              if (diffDays <= 3) {
                pagosPorVencer++
              }
            }
          })
        })
        
        let shouldSend = false
        let titulo = ''
        let cuerpo = ''
        let soundType: 'urgente' | 'recordatorio' = 'recordatorio'
        
        if (rec.tipo === 'vencidos' && pagosVencidos > 0) {
          shouldSend = true
          titulo = `URGENTE: ${pagosVencidos} pago${pagosVencidos > 1 ? 's' : ''} vencido${pagosVencidos > 1 ? 's' : ''}`
          cuerpo = 'Tienes pagos atrasados que requieren atencion inmediata.'
          soundType = 'urgente'
        } else if (rec.tipo === 'proximos' && pagosPorVencer > 0) {
          shouldSend = true
          titulo = `Recordatorio: ${pagosPorVencer} pago${pagosPorVencer > 1 ? 's' : ''} proximo${pagosPorVencer > 1 ? 's' : ''}`
          cuerpo = 'Tienes pagos por vencer en los proximos dias.'
        } else if (rec.tipo === 'general' && (pagosVencidos > 0 || pagosPorVencer > 0)) {
          shouldSend = true
          if (pagosVencidos > 0) {
            titulo = `${pagosVencidos} vencido${pagosVencidos > 1 ? 's' : ''}, ${pagosPorVencer} proximo${pagosPorVencer > 1 ? 's' : ''}`
            soundType = 'urgente'
          } else {
            titulo = `${pagosPorVencer} pago${pagosPorVencer > 1 ? 's' : ''} proximo${pagosPorVencer > 1 ? 's' : ''}`
          }
          cuerpo = rec.nombre || 'Revisa tu panel de control para mas detalles.'
        }
        
        if (shouldSend) {
          sendNotification(titulo, {
            body: cuerpo,
            playSound: true,
            soundType,
            tag: `recordatorio-${rec.id}`,
          })
          localStorage.setItem(lastSentKey, 'true')
        }
      })
    }

    // Verificar cada minuto
    const interval = setInterval(checkAndNotify, 60000)
    checkAndNotify() // Verificar inmediatamente
    
    return () => clearInterval(interval)
  }, [recordatorios, permission])

  const handlePermissionRequest = useCallback(async () => {
    const granted = await requestNotificationPermission()
    setPermission(granted ? 'granted' : 'denied')
  }, [])

  const handleToggleDia = (dia: number) => {
    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    )
  }

  const handleCreateRecordatorio = () => {
    if (diasSeleccionados.length === 0) return
    
    const nuevoRecordatorio = createRecordatorio({
      nombre: nombre || `Recordatorio ${hora}`,
      diasSemana: diasSeleccionados.sort((a, b) => a - b),
      hora,
      activo: true,
      tipo,
    })
    
    setRecordatorios([...recordatorios, nuevoRecordatorio])
    setDialogOpen(false)
    
    // Reset form
    setNombre('')
    setHora('09:00')
    setDiasSeleccionados([1, 2, 3, 4, 5])
    setTipo('general')
  }

  const handleDeleteRecordatorio = (id: string) => {
    deleteRecordatorio(id)
    setRecordatorios(recordatorios.filter((r) => r.id !== id))
  }

  const handleToggleRecordatorio = (id: string) => {
    const updated = toggleRecordatorio(id)
    if (updated) {
      setRecordatorios(recordatorios.map((r) => (r.id === id ? updated : r)))
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const isSupported = isNotificationSupported()
  const isGranted = permission === 'granted'
  const isDenied = permission === 'denied'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Recordatorios Programados
        </CardTitle>
        <CardDescription>
          Configura recordatorios para dias y horas especificas. Las notificaciones se enviaran automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isSupported ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
            <BellOff className="mx-auto mb-2 h-8 w-8 text-destructive" />
            <p className="font-medium text-destructive">Notificaciones no soportadas</p>
            <p className="text-sm text-muted-foreground">
              Tu navegador no soporta notificaciones push. Intenta agregar esta pagina a tu pantalla de inicio.
            </p>
          </div>
        ) : isDenied ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
            <BellOff className="mx-auto mb-2 h-8 w-8 text-destructive" />
            <p className="font-medium text-destructive">Notificaciones bloqueadas</p>
            <p className="text-sm text-muted-foreground">
              Debes habilitar las notificaciones desde la configuracion de tu navegador o dispositivo.
            </p>
          </div>
        ) : !isGranted ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
            <Bell className="mx-auto mb-2 h-8 w-8 text-primary" />
            <p className="mb-3 font-medium text-foreground">Activa las notificaciones</p>
            <p className="mb-4 text-sm text-muted-foreground">
              Para recibir recordatorios, primero debes activar las notificaciones.
            </p>
            <Button onClick={handlePermissionRequest}>
              <Bell className="mr-2 h-4 w-4" />
              Activar Notificaciones
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Lista de recordatorios */}
            {recordatorios.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <Clock className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No tienes recordatorios configurados. Agrega uno para recibir notificaciones.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recordatorios.map((rec) => (
                  <div
                    key={rec.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-4 transition-colors",
                      rec.activo ? "bg-background" : "bg-muted/50"
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <BellRing className={cn(
                          "h-4 w-4",
                          rec.tipo === 'vencidos' ? "text-red-500" : 
                          rec.tipo === 'proximos' ? "text-amber-500" : "text-primary"
                        )} />
                        <span className="font-medium">{rec.nombre}</span>
                        <Badge variant={rec.activo ? "default" : "secondary"} className="text-xs">
                          {rec.hora}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {DIAS_SEMANA.filter((d) => rec.diasSemana.includes(d.value)).map((dia) => (
                          <Badge key={dia.value} variant="outline" className="text-xs">
                            {dia.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rec.activo}
                        onCheckedChange={() => handleToggleRecordatorio(rec.id)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRecordatorio(rec.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Boton para agregar */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Recordatorio
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Nuevo Recordatorio</DialogTitle>
                  <DialogDescription>
                    Configura cuando quieres recibir notificaciones de cobro.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre (opcional)</Label>
                    <Input
                      id="nombre"
                      placeholder="Ej: Recordatorio matutino"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="hora">Hora</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="hora"
                        type="time"
                        value={hora}
                        onChange={(e) => setHora(e.target.value)}
                        className="w-auto"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Dias de la semana</Label>
                    <div className="flex flex-wrap gap-2">
                      {DIAS_SEMANA.map((dia) => (
                        <Button
                          key={dia.value}
                          type="button"
                          variant={diasSeleccionados.includes(dia.value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleDia(dia.value)}
                          className={cn(
                            "w-12",
                            !diasSeleccionados.includes(dia.value) && "bg-transparent"
                          )}
                        >
                          {dia.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de recordatorio</Label>
                    <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_RECORDATORIO.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="bg-transparent"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateRecordatorio}
                    disabled={diasSeleccionados.length === 0}
                  >
                    Guardar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Instrucciones para PWA */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium text-foreground mb-2">
                Para mejores resultados:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Android: Toca el menu (3 puntos) y selecciona "Agregar a pantalla de inicio"</li>
                <li>iPhone: Toca el boton compartir y selecciona "Agregar a inicio"</li>
                <li>Mantener la app abierta en segundo plano para notificaciones</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
