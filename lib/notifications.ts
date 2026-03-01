'use client'

import type { Prestamo, PagoMensual } from './types'

// Check if notifications are supported
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

// Register Service Worker for push notifications on mobile
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('[v0] Service Worker registered:', registration.scope)
    return registration
  } catch (error) {
    console.error('[v0] Service Worker registration failed:', error)
    return null
  }
}

// Request permission for notifications
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false
  
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

// Get current notification permission status
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

// Play notification sound
export function playNotificationSound(type: 'urgente' | 'recordatorio' = 'recordatorio'): void {
  if (typeof window === 'undefined') return
  
  // Create audio context for notification sound
  try {
    const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    if (type === 'urgente') {
      // Urgent sound: higher pitch, repeated beeps (for overdue payments)
      oscillator.frequency.value = 880 // A5 note
      gainNode.gain.value = 0.3
      oscillator.type = 'sine'
      
      oscillator.start()
      
      // Create repeating beep pattern
      let currentTime = audioContext.currentTime
      for (let i = 0; i < 3; i++) {
        gainNode.gain.setValueAtTime(0.3, currentTime)
        gainNode.gain.setValueAtTime(0, currentTime + 0.15)
        currentTime += 0.25
      }
      
      oscillator.stop(currentTime)
    } else {
      // Reminder sound: pleasant chime (for upcoming payments)
      oscillator.frequency.value = 523.25 // C5 note
      gainNode.gain.value = 0.2
      oscillator.type = 'sine'
      
      oscillator.start()
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      oscillator.stop(audioContext.currentTime + 0.5)
    }
  } catch (error) {
    console.log('Audio not supported:', error)
  }
}

// Send a notification with optional sound
export function sendNotification(
  title: string, 
  options?: NotificationOptions & { playSound?: boolean; soundType?: 'urgente' | 'recordatorio' }
): Notification | null {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null
  }
  
  const { playSound = true, soundType = 'recordatorio', ...notificationOptions } = options || {}
  
  // Play sound if enabled
  if (playSound) {
    playNotificationSound(soundType)
  }
  
  // Vibrate on mobile devices
  if ('vibrate' in navigator) {
    if (soundType === 'urgente') {
      navigator.vibrate([200, 100, 200, 100, 200]) // SOS pattern for urgent
    } else {
      navigator.vibrate([200, 100, 200]) // Simple pattern for reminder
    }
  }
  
  return new Notification(title, {
    icon: '/logo.png',
    badge: '/logo.png',
    ...notificationOptions,
  })
}

// Format currency for notifications
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

// Check and send notifications for overdue and upcoming payments
export function checkAndNotifyPayments(prestamos: Prestamo[]): {
  vencidos: { prestamo: Prestamo; pago: PagoMensual }[]
  proximos: { prestamo: Prestamo; pago: PagoMensual }[]
} {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  
  const manana = new Date(hoy)
  manana.setDate(manana.getDate() + 1)
  
  const vencidos: { prestamo: Prestamo; pago: PagoMensual }[] = []
  const proximos: { prestamo: Prestamo; pago: PagoMensual }[] = []
  
  prestamos.filter(p => p.estado === 'activo').forEach((prestamo) => {
    prestamo.pagosMensuales.forEach((pago) => {
      if (pago.pagado) return
      
      const [year, month, day] = pago.fechaCobro.split('-').map(Number)
      const fechaPago = new Date(year, month - 1, day)
      
      // Check if overdue (before today)
      if (fechaPago < hoy) {
        vencidos.push({ prestamo, pago })
      }
      // Check if due today or tomorrow
      else if (fechaPago.getTime() === hoy.getTime() || fechaPago.getTime() === manana.getTime()) {
        proximos.push({ prestamo, pago })
      }
    })
  })
  
  return { vencidos, proximos }
}

// Send payment notifications
export function sendPaymentNotifications(prestamos: Prestamo[]): void {
  const { vencidos, proximos } = checkAndNotifyPayments(prestamos)
  
  // Notify about overdue payments with urgent sound
  if (vencidos.length > 0) {
    const totalVencido = vencidos.reduce((sum, v) => sum + v.pago.montoCobro, 0)
    sendNotification(
      `URGENTE: ${vencidos.length} pago${vencidos.length > 1 ? 's' : ''} VENCIDO${vencidos.length > 1 ? 'S' : ''}`,
      {
        body: `Total atrasado: ${formatCurrency(totalVencido)}. Clientes: ${vencidos.map(v => v.prestamo.nombreCliente).slice(0, 3).join(', ')}${vencidos.length > 3 ? '...' : ''}`,
        tag: 'pagos-vencidos',
        requireInteraction: true,
        playSound: true,
        soundType: 'urgente',
      }
    )
  }
  
  // Notify about upcoming payments with reminder sound
  if (proximos.length > 0) {
    const totalProximo = proximos.reduce((sum, p) => sum + p.pago.montoCobro, 0)
    // Small delay if there were overdue notifications to not overlap sounds
    setTimeout(() => {
      sendNotification(
        `Recordatorio: ${proximos.length} pago${proximos.length > 1 ? 's' : ''} por cobrar`,
        {
          body: `Total: ${formatCurrency(totalProximo)}. Clientes: ${proximos.map(p => p.prestamo.nombreCliente).slice(0, 3).join(', ')}${proximos.length > 3 ? '...' : ''}`,
          tag: 'pagos-proximos',
          playSound: true,
          soundType: 'recordatorio',
        }
      )
    }, vencidos.length > 0 ? 2000 : 0)
  }
}

// Schedule notification check based on configured time
export function scheduleNotificationCheck(
  hora: string, 
  prestamos: Prestamo[],
  callback?: () => void
): NodeJS.Timeout | null {
  if (typeof window === 'undefined') return null
  
  const [hours, minutes] = hora.split(':').map(Number)
  const now = new Date()
  const scheduledTime = new Date()
  scheduledTime.setHours(hours, minutes, 0, 0)
  
  // If the time has already passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1)
  }
  
  const msUntilNotification = scheduledTime.getTime() - now.getTime()
  
  return setTimeout(() => {
    sendPaymentNotifications(prestamos)
    callback?.()
  }, msUntilNotification)
}
