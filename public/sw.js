/// <reference lib="webworker" />

// ═══════════════════════════════════════════════════════════════════════════
// Cubalove — Service Worker optimizado para Cuba (offline-first)
//
// Estrategias:
//   STATIC  → Cache-first (JS, CSS, fonts, images, icons)
//   PAGES   → Network-first con fallback a cache (HTML, RSC)
//   API GET → Stale-while-revalidate (datos frescos cuando hay red)
//   API MUT → Network-only con background-sync retry
//   IMAGES  → Cache-first con límite de tamaño
// ═══════════════════════════════════════════════════════════════════════════

const CACHE_VERSION = 2;
const STATIC_CACHE = `cubalove-static-v${CACHE_VERSION}`;
const PAGES_CACHE = `cubalove-pages-v${CACHE_VERSION}`;
const API_CACHE = `cubalove-api-v${CACHE_VERSION}`;
const IMAGE_CACHE = `cubalove-images-v${CACHE_VERSION}`;
const ALL_CACHES = [STATIC_CACHE, PAGES_CACHE, API_CACHE, IMAGE_CACHE];

// Max entries per cache to avoid filling up storage on low-end devices
const MAX_IMAGE_ENTRIES = 150;
const MAX_API_ENTRIES = 80;

// App shell — precached on install for instant startup
const APP_SHELL = [
  "/discover",
  "/matches",
  "/profile",
  "/premium",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json",
];

// ─── Install: precache app shell ─────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        cache.addAll(APP_SHELL).catch((err) => {
          // Don't fail install if one resource is unavailable
          console.warn("[SW] Precache partial failure:", err);
        }),
      )
      .then(() => self.skipWaiting()),
  );
});

// ─── Activate: purge old caches ──────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !ALL_CACHES.includes(k))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ─── Fetch: route requests to the right strategy ─────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin + GET (mutations go network-only with sync)
  if (url.origin !== self.location.origin) return;

  // POST/PUT/DELETE → network-only, queue for retry if offline
  if (request.method !== "GET") {
    event.respondWith(networkWithBackgroundSync(request));
    return;
  }

  // ── Static assets (JS, CSS, fonts, manifest) → Cache-first ──
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── Images (user photos, profile pics) → Cache-first with limit ──
  if (isImage(url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, MAX_IMAGE_ENTRIES));
    return;
  }

  // ── API routes (data) → Stale-while-revalidate ──
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE, MAX_API_ENTRIES));
    return;
  }

  // ── Pages (HTML, RSC) → Network-first with cache fallback ──
  event.respondWith(networkFirst(request, PAGES_CACHE));
});

// ═══════════════════════════════════════════════════════════════════════════
// Caching Strategies
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Cache-first: serve from cache instantly, only go to network on miss.
 * Best for static assets that change with new deploys (hashed filenames).
 */
async function cacheFirst(request, cacheName, maxEntries) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      if (maxEntries) trimCache(cacheName, maxEntries);
    }
    return response;
  } catch {
    // Offline with no cache — return a minimal fallback
    return new Response("Offline", { status: 503 });
  }
}

/**
 * Stale-while-revalidate: return cache immediately, update in background.
 * Best for API data — user sees instant (possibly stale) content while
 * a fresh copy downloads. Perfect for Cuba's slow/intermittent connections.
 */
async function staleWhileRevalidate(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
        if (maxEntries) trimCache(cacheName, maxEntries);
      }
      return response;
    })
    .catch(() => null);

  // Return cached instantly if available, otherwise wait for network
  if (cached) {
    // Still kick off the revalidation in background
    networkFetch;
    return cached;
  }

  // No cache — must wait for network
  const response = await networkFetch;
  if (response) return response;

  // Total offline with no cache
  return new Response(JSON.stringify({ error: "Sin conexión" }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Network-first: try network, fall back to cache.
 * Best for HTML pages — always show fresh content when online,
 * but degrade gracefully to last-visited version offline.
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    // Return offline fallback page
    return cache.match("/discover") || new Response(offlineHTML(), {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

/**
 * Network-only for mutations (POST/PUT/DELETE).
 * If offline, store in IndexedDB for background-sync retry.
 */
async function networkWithBackgroundSync(request) {
  try {
    return await fetch(request);
  } catch {
    // Try to queue for later if BackgroundSync is available
    if (self.registration.sync) {
      try {
        const body = await request.clone().text();
        await saveToRetryQueue({
          url: request.url,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          body,
          timestamp: Date.now(),
        });
        await self.registration.sync.register("retry-mutations");
      } catch (e) {
        console.warn("[SW] Failed to queue mutation:", e);
      }
    }

    return new Response(
      JSON.stringify({ error: "Sin conexión. Se reintentará automáticamente." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Background Sync — replay failed mutations when connectivity returns
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener("sync", (event) => {
  if (event.tag === "retry-mutations") {
    event.waitUntil(replayRetryQueue());
  }
});

async function replayRetryQueue() {
  const queue = await getRetryQueue();
  const remaining = [];

  for (const entry of queue) {
    try {
      await fetch(entry.url, {
        method: entry.method,
        headers: entry.headers,
        body: entry.body || undefined,
      });
    } catch {
      // Still offline — keep in queue
      remaining.push(entry);
    }
  }

  await saveRetryQueue(remaining);
}

// ─── IndexedDB helpers for retry queue ───────────────────────────────────

function openRetryDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("cubalove-sw", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("retry-queue")) {
        db.createObjectStore("retry-queue", { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveToRetryQueue(entry) {
  const db = await openRetryDB();
  const tx = db.transaction("retry-queue", "readwrite");
  tx.objectStore("retry-queue").add(entry);
  return new Promise((resolve) => { tx.oncomplete = resolve; });
}

async function getRetryQueue() {
  const db = await openRetryDB();
  const tx = db.transaction("retry-queue", "readonly");
  const req = tx.objectStore("retry-queue").getAll();
  return new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result || []);
  });
}

async function saveRetryQueue(entries) {
  const db = await openRetryDB();
  const tx = db.transaction("retry-queue", "readwrite");
  const store = tx.objectStore("retry-queue");
  store.clear();
  for (const entry of entries) {
    store.add(entry);
  }
  return new Promise((resolve) => { tx.oncomplete = resolve; });
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".json") ||
    url.pathname === "/manifest.json"
  );
}

function isImage(url) {
  return (
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".avif") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".gif") ||
    url.pathname.endsWith(".ico")
  );
}

/**
 * Trim cache to maxEntries (FIFO). Prevents filling up storage on
 * low-end devices common in Cuba.
 */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await cache.delete(keys[0]);
    trimCache(cacheName, maxEntries); // recursive trim
  }
}

/** Minimal offline fallback page (inline, no network needed) */
function offlineHTML() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Cubalove — Sin Conexión</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
           display: flex; flex-direction: column; align-items: center; justify-content: center;
           min-height: 100vh; background: #FFF5F5; color: #333; padding: 2rem; text-align: center; }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #DC143C; }
    p { color: #666; margin-bottom: 1.5rem; max-width: 280px; line-height: 1.5; }
    button { background: #DC143C; color: white; border: none; padding: 0.75rem 2rem;
             border-radius: 9999px; font-size: 1rem; font-weight: 600; cursor: pointer; }
    button:active { opacity: 0.8; }
  </style>
</head>
<body>
  <div class="icon">📡</div>
  <h1>Sin conexión</h1>
  <p>No hay conexión a internet. Revisa tu conexión y vuelve a intentar.</p>
  <button onclick="location.reload()">Reintentar</button>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Push Notifications (unchanged)
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const payload = event.data.json();

  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    tag: payload.tag || "cubalove-notification",
    data: {
      url: payload.url || "/discover",
    },
    vibrate: [200, 100, 200],
    renotify: true,
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/discover";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
