// Service Worker for Dock Gamerz Mobile Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for messages from web application to display mobile status bar notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, badge, data, tag } = event.data;
    
    const options = {
      body: body || 'You have a new update from Dock Gamerz',
      icon: icon || '/icon.svg',
      badge: badge || '/icon.svg',
      vibrate: [200, 100, 200, 100, 200],
      tag: tag || 'dock-gamerz-' + Date.now(),
      renotify: true,
      requireInteraction: false,
      data: data || {},
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };

    self.registration.showNotification(title || 'Dock Gamerz Alert', options);
  }
});

// Handle push events (for background push notifications)
self.addEventListener('push', (event) => {
  let notifData = {
    title: 'Dock Gamerz Notification',
    body: 'New match update available',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: {}
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      notifData = { ...notifData, ...parsed };
    } catch (e) {
      notifData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notifData.title, {
      body: notifData.body,
      icon: notifData.icon || '/icon.svg',
      badge: notifData.badge || '/icon.svg',
      vibrate: [200, 100, 200],
      tag: notifData.tag || 'dock-gamerz-push',
      renotify: true,
      data: notifData.data || {}
    })
  );
});

// Notification click behavior: brings app to front and focuses match if present
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetMatchId = event.notification.data?.targetMatchId;
  const actionPage = event.notification.data?.actionPage;

  let targetUrl = '/';
  if (targetMatchId) {
    targetUrl = `/match/${targetMatchId}`;
  } else if (actionPage === 'wallet') {
    targetUrl = '/wallet';
  } else if (actionPage === 'referral') {
    targetUrl = '/referral';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If an existing app window is open, focus it and navigate
      for (let client of windowClients) {
        if ('focus' in client) {
          if (client.url && !client.url.includes(targetUrl)) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // If no window is open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
