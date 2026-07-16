// Service worker mínimo de OpaBiz Connect — SOLO push notifications.
// El MVP de la PWA (2026-07-14) se hizo a propósito sin service worker (solo
// "Add to Home Screen", sin caché offline). Este archivo no agrega caché ni
// intercepta fetch — únicamente escucha 'push' y 'notificationclick'.

self.addEventListener('push', function (event) {
  var data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {}

  var title = data.title || 'OpaBiz Connect'
  var options = {
    body: data.body || '',
    icon: '/opabiz-icon-192.png',
    badge: '/opabiz-icon-192.png',
    data: { url: data.url || '/opabiz/dashboard' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  var url = (event.notification.data && event.notification.data.url) || '/opabiz/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i]
        if (client.url.indexOf(url) !== -1 && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
