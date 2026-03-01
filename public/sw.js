// Service Worker for Loan Payment Notifications
// Financiera Fernandez y Asociados

const CACHE_NAME = 'prestamos-cache-v1'
const CACHE_URLS = [
  '/',
  '/logo.png',
  '/manifest.json'
]

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_URLS)
    })
  )
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => clients.claim())
  )
})

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')
  
  let data = {
    title: 'Recordatorio de Cobro',
    body: 'Tienes pagos pendientes por cobrar',
    icon: '/logo.png',
    badge: '/logo.png'
  }
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch (e) {
      data.body = event.data.text()
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    tag: data.tag || 'payment-notification',
    data: data.data || {}
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Message event for scheduling local notifications
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, data } = event.data
    self.registration.showNotification(title, {
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      tag: tag || 'scheduled-notification',
      data: data || {}
    })
  }
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked')
  event.notification.close()
  
  const notificationData = event.notification.data || {}
  const urlToOpen = notificationData.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Fetch event with cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request)
    })
  )
})
