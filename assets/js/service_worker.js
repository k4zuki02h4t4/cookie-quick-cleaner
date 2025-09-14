// Minimal worker: keeps extension lightweight. Actual cookie ops are done from popup (attached to user gesture).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
