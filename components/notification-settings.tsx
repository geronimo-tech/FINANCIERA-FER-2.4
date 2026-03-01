'use client'

import { Bell, BellOff, BellRing, Check, Clock } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  isNotificationSupported,
  requestNotificationPermission,
  getNotificationPermission,
  sendPaymentNotifications,
  checkAndNotifyPayments,
  playNotificationSound,
  sendNotification,
} from '@/lib/notifications'
import {
  getConfiguracionRecordatorio,
  saveConfiguracionRecordatorio,
  getPrestamos,
} from '@/lib/prestamos-store'
import type { ConfiguracionRecordatorio } from '@/lib/types'
import { cn } from '@/lib/utils'

export function NotificationSettings() {
  const [config, setConfig] = useState<ConfiguracionRecordatorio>({ hora: '09:00', activo: false })
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [isLoading, setIsLoading] = useState(true)
  const [testSent, setTestSent] = useState(false)
  const [paymentSummary, setPaymentSummary] = useState({ vencidos: 0, proximos: 0 })

  useEffect(() => {
    const savedConfig = getConfiguracionRecordatorio()
    setConfig(savedConfig)
    setPermission(getNotificationPermission())
    
    // Get payment summary
    const prestamos = getPrestamos()
    const { vencidos, proximos } = checkAndNotifyPayments(prestamos)
    setPaymentSummary({ vencidos: vencidos.length, proximos: proximos.length })
    
    setIsLoading(false)
  }, [])

  const handlePermissionRequest = useCallback(async () => {
    const granted = await requestNotificationPermission()
    setPermission(granted ? 'granted' : 'denied')
    if (granted) {
      setConfig(prev => ({ ...prev, activo: true }))
      saveConfiguracionRecordatorio({ ...config, activo: true })
    }
  }, [config])

  const handleToggle = useCallback((activo: boolean) => {
    const newConfig = { ...config, activo }
    setConfig(newConfig)
    saveConfiguracionRecordatorio(newConfig)
  }, [config])

  const handleTimeChange = useCallback((hora: string) => {
    const newConfig = { ...config, hora }
    setConfig(newConfig)
    saveConfiguracionRecordatorio(newConfig)
  }, [config])

  const handleTestNotification = useCallback(() => {
    const prestamos = getPrestamos()
    sendPaymentNotifications(prestamos)
    setTestSent(true)
    setTimeout(() => setTestSent(false), 3000)
  }, [])

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
          <Bell className="h-5 w-5 text-primary" />
          Notificaciones de Recordatorio
        </CardTitle>
        <CardDescription>
          Recibe notificaciones en tu dispositivo cuando tengas pagos vencidos o proximos a vencer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment summary */}
        {(paymentSummary.vencidos > 0 || paymentSummary.proximos > 0) && (
          <div className="flex flex-wrap gap-3">
            {paymentSummary.vencidos > 0 && (
              <div className="flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm text-red-700">
                <Clock className="h-4 w-4" />
                {paymentSummary.vencidos} pago{paymentSummary.vencidos > 1 ? 's' : ''} vencido{paymentSummary.vencidos > 1 ? 's' : ''}
              </div>
            )}
            {paymentSummary.proximos > 0 && (
              <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                <BellRing className="h-4 w-4" />
                {paymentSummary.proximos} pago{paymentSummary.proximos > 1 ? 's' : ''} proximo{paymentSummary.proximos > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {!isSupported ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
            <BellOff className="mx-auto mb-2 h-8 w-8 text-destructive" />
            <p className="font-medium text-destructive">Notificaciones no soportadas</p>
            <p className="text-sm text-muted-foreground">
              Tu navegador no soporta notificaciones push.
            </p>
          </div>
        ) : isDenied ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
            <BellOff className="mx-auto mb-2 h-8 w-8 text-destructive" />
            <p className="font-medium text-destructive">Notificaciones bloqueadas</p>
            <p className="text-sm text-muted-foreground">
              Debes habilitar las notificaciones desde la configuracion de tu navegador.
            </p>
          </div>
        ) : !isGranted ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
            <Bell className="mx-auto mb-2 h-8 w-8 text-primary" />
            <p className="mb-3 font-medium text-foreground">Activa las notificaciones</p>
            <p className="mb-4 text-sm text-muted-foreground">
              Recibe alertas cuando tengas pagos pendientes o vencidos.
            </p>
            <Button onClick={handlePermissionRequest}>
              <Bell className="mr-2 h-4 w-4" />
              Activar Notificaciones
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Toggle notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications-toggle" className="text-base">
                  Recordatorios activos
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recibir notificaciones de pagos
                </p>
              </div>
              <Switch
                id="notifications-toggle"
                checked={config.activo}
                onCheckedChange={handleToggle}
              />
            </div>

            {/* Time selector */}
            <div className={cn(
              "space-y-2 transition-opacity",
              !config.activo && "opacity-50 pointer-events-none"
            )}>
              <Label htmlFor="notification-time">Hora del recordatorio</Label>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="notification-time"
                  type="time"
                  value={config.hora}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-auto"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Recibiras una notificacion a esta hora si tienes pagos pendientes.
              </p>
            </div>

            {/* Test buttons */}
            <div className="pt-4 border-t space-y-4">
              <p className="text-sm font-medium text-foreground">Probar notificaciones</p>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    sendNotification('Recordatorio de Cobro', {
                      body: 'Tienes pagos proximos a vencer. No olvides cobrar.',
                      playSound: true,
                      soundType: 'recordatorio',
                    })
                  }}
                  className="bg-transparent"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Recordatorio
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    sendNotification('URGENTE: Pago Vencido', {
                      body: 'Tienes pagos vencidos que requieren atencion inmediata.',
                      playSound: true,
                      soundType: 'urgente',
                    })
                  }}
                  className="bg-transparent border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Urgente
                </Button>
              </div>
              
              <Button
                variant="outline"
                onClick={handleTestNotification}
                disabled={testSent}
                className="w-full bg-transparent"
              >
                {testSent ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    Notificacion enviada
                  </>
                ) : (
                  <>
                    <BellRing className="mr-2 h-4 w-4" />
                    Enviar resumen de pagos pendientes
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Prueba los diferentes tipos de notificacion y sonidos.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
