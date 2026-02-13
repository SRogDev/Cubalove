# CLAUDE.md — Empatando

## Proyecto

**Empatando** es una aplicación de citas diseñada específicamente para el mercado cubano.
El producto se inspira directamente en **Tinder** — imitamos sus elementos de UI, flujos de
interacción y lógicas de matching. El stack es **Next.js 16 (App Router)** + **Supabase**
(auth, database, storage, realtime) + **Tailwind CSS** + **shadcn/ui**.

Contacto: empatando@datingcuba.com

## Referencia Principal: Tinder

Debemos estudiar y replicar las siguientes características clave de Tinder:

### UI/UX a Imitar
- **Card Stack**: Las tarjetas de perfil se apilan y se deslizan (swipe left/right)
- **Swipe Gestures**: Soporte completo para gestos táctiles en móvil y drag en desktop
- **Like / Nope / Super Like**: Los tres estados visuales al interactuar con un perfil
- **Match Screen**: La pantalla de "¡Empataste!" con animación cuando hay match mutuo
- **Chat Interface**: Mensajería en tiempo real similar a la de Tinder
- **Profile Cards**: Fotos grandes, nombre, edad, bio corta, distancia
- **Discovery Settings**: Filtros de edad, distancia, género
- **Perfil Editable**: Fotos (hasta 6), bio, prompts, intereses, información básica

### Lógicas de Tinder a Implementar
- **Matching bilateral**: Solo se crea match cuando ambos usuarios se dan like
- **Cola de perfiles**: Algoritmo que presenta perfiles relevantes uno a uno
- **Sistema de likes limitados**: Gestión de cuota diaria de swipes
- **Boost/Super Like**: Funcionalidades premium
- **Deshacer último swipe**: Feature premium
- **Geolocalización**: Filtrado por proximidad con distancia tipo Tinder (km/metros)

## Stack Técnico

### Frontend
- **Next.js 16** con App Router y React Server Components
- **TypeScript** estricto en todo el proyecto
- **Tailwind CSS v3** para estilos utilitarios
- **shadcn/ui** como sistema de componentes base
- **Framer Motion** para animaciones de swipe y transiciones
- **Lucide React** para iconografía
- **geolib** para cálculos de distancia geográfica

### Backend (Supabase — Self-hosted en Digital Ocean)
- **Supabase Auth**: OAuth con Google exclusivamente (no email/password)
- **Supabase Database (PostgreSQL + PostGIS)**: Todas las tablas con RLS
- **Supabase Storage**: Apuntado a Digital Ocean Spaces (S3 compatible)
- **Supabase Realtime**: Chat en tiempo real y notificaciones de match
- **Supabase Edge Functions**: Lógica de servidor (matching algorithm, etc.)

### Infraestructura
- **Digital Ocean**: Droplet para Next.js + Supabase self-hosted
- **Digital Ocean Spaces**: Storage S3-compatible para fotos y assets
- **Cloudflare**: CDN, DNS, SSL, WAF, Image Resizing
- **Dokploy**: Orquestación de deploy automático desde GitHub
- Ver `INFRA.md` para detalles completos de la arquitectura

### Pagos
- **Stripe** para suscripciones premium (Plus $2/mes, VIP $8/mes)
- **CUP manual** vía WhatsApp para usuarios cubanos (Plus 1000 CUP, VIP 4000 CUP)
- Stripe Checkout para flujo de pago
- Stripe Webhooks para sincronizar estado de suscripción

### Notificaciones
- **Web Push** vía service worker para PWA
- Librería `web-push` con VAPID keys para envío server-side
- Tipos de notificación: Match, Re-engagement, NewChisme, Boost, Superlike
- Frecuencia máxima: 1 notificación/hora (excepto match, que es inmediata)
- Toggles por tipo en Settings del perfil

## Arquitectura: Service Layer + Repository Pattern

La app usa un patrón de capas para separar acceso a datos de lógica de negocio:

### Repositories (`lib/repositories/`)
Capa de acceso a datos. Cada archivo encapsula queries de Supabase para una entidad:
```
lib/repositories/
  users.ts            — CRUD de perfiles, ubicación, fotos, prompts, intereses
  swipes.ts           — Crear swipes, verificar swipes existentes
  matches.ts          — Obtener matches, match individual
  messages.ts         — Enviar mensajes, obtener historial
  chismes.ts          — CRUD de chismes, interacciones
  subscriptions.ts    — Suscripciones, pagos, precios CUP
  push-subscriptions.ts — Suscripciones push, logs de notificación
  index.ts            — Barrel export
```

**Convención**: Los repositories reciben un cliente Supabase como parámetro y retornan
los datos directamente de la query. No contienen lógica de negocio.

### Services (`lib/services/`)
Capa de lógica de negocio. Orquestan repositories y aplican reglas:
```
lib/services/
  discovery.ts        — Algoritmo de descubrimiento, cálculo de distancia
  chismes.ts          — Feed de chismes, likes, publicación
  notifications.ts    — Tipos de notificación, payloads, templates con emojis
  index.ts            — Barrel export
```

**Convención**: Los services importan repositories y añaden lógica (validaciones,
cálculos, transformaciones). Ejemplo: `discovery.ts` usa `calculateDistance()` de
geolib para calcular distancia entre usuarios.

### Cómo usar
```typescript
// En un Server Component o Server Action:
import { UsersRepository } from "@/lib/repositories";
import { DiscoveryService } from "@/lib/services";

// Repository: acceso directo a datos
const profile = await UsersRepository.getProfile(supabase, userId);

// Service: lógica de negocio
const distance = DiscoveryService.calculateDistance(lat1, lng1, lat2, lng2);
```

## Arquitectura de la Base de Datos

### Tablas Principales (ver `database.sql` para schema completo)
```
users               — Perfil principal (display_name, date_of_birth, gender, show_me, bio, role, status, phone)
user_location       — Ubicación (city como municipio/provincia, lat/lng)
user_photos         — Hasta 6 fotos de perfil con posición
user_prompts        — Hasta 3 prompts personalizados (pregunta + respuesta)
user_interests      — Tags/intereses del usuario
user_stats          — Estadísticas (likes, superlikes, matches, swipes diarios)
swipes              — Registro de swipes (like, nope, superlike)
matches             — Matches confirmados (con constraint user1_id < user2_id)
messages            — Mensajes de chat con indicador de leído
user_subscriptions  — Suscripciones (plus, vip) con payment_method (stripe/cup)
chismes             — Contenido social tipo feed (con jsonb content)
chisme_interactions — Interacciones con chismes (view, like, click, share)
reports             — Reportes de usuarios
blocks              — Bloqueos entre usuarios
stripe_customers    — Mapeo user_id → stripe_customer_id
stripe_subscriptions — Suscripciones Stripe detalladas
stripe_payments     — Historial de pagos Stripe
cup_prices          — Precios en CUP por plan (administrable)
push_subscriptions  — Suscripciones push por usuario (endpoint, keys)
notification_log    — Log de notificaciones enviadas (para rate limiting)
user_settings       — Configuración de usuario (notificaciones por tipo)
```

### Triggers Automáticos
- `on_auth_user_created`: Crea registro en `users` + `user_stats` al registrarse
- `create_match_on_mutual_like`: Crea match cuando ambos dan like/superlike
- `update_stats_on_swipe`: Actualiza contadores de stats por cada swipe
- `set_match_last_message`: Actualiza `last_message_at` en matches
- `set_updated_at_*`: Auto-actualiza `updated_at` en tablas editables

### Row Level Security (RLS)
- Cada usuario solo puede leer/escribir sus propios datos
- Los mensajes solo son visibles para los participantes del match
- Los swipes son privados — un usuario nunca ve quién le dio like (excepto premium)
- Admin actions verifican `role = 'admin'` en la tabla `users`
- Las policies deben ser estrictas y testeadas

## Estructura de Carpetas

```
app/
  (auth)/                 — Páginas de autenticación (login)
  (app)/                  — Layout principal de la app autenticada
    discover/             — Pantalla principal de swipe (estilo Tinder)
    matches/              — Lista de matches
    chat/[matchId]/       — Conversación individual
    chismes/              — Feed de chismes
    profile/              — Perfil propio (editar) + Settings (notificaciones)
    profile/[userId]/     — Ver perfil de otro usuario
    premium/              — Planes de suscripción (Stripe + CUP)
  admin/                  — Panel de administración
    recharges/            — Recargas manuales CUP
    ads/                  — Publicar chismes
    analytics/            — Insights
    moderation/           — Moderación de usuarios
  api/
    webhooks/stripe/      — Webhook de Stripe
    notifications/
      subscribe/          — POST/DELETE suscripción push
      send/               — POST enviar notificación (server-to-server)
  terminos/               — Términos de uso
  privacidad/             — Política de privacidad
components/
  ui/                     — Componentes shadcn/ui
  swipe/                  — SwipeCard, SwipeStack, SwipeActions
  chat/                   — ChatBubble, ChatInput, ChatList
  profile/                — ProfileCard, ProfileEditor, PhotoUploader, NotificationSettings
  match/                  — MatchScreen, MatchList
  chismes/                — ChismeCard, ChismeList
  layout/                 — TopBar, BottomNav
  landing/                — PWAInstallModal
  shared/                 — AttentionUser (suspended/blocked)
lib/
  supabase/               — Clientes de Supabase (server, client, proxy)
  stripe/                 — Configuración de Stripe (config, actions)
  repositories/           — Capa de acceso a datos (queries Supabase)
  services/               — Capa de lógica de negocio
  hooks/                  — Custom hooks (useSwipe, useChat, useGeolocation, usePushNotifications)
  utils/                  — Utilidades generales
  constants/              — Constantes de la app
  types/                  — Tipos TypeScript globales
public/
  sw.js                   — Service Worker (push notifications + caching)
  manifest.json           — PWA manifest
```

## Comandos

```bash
pnpm dev          # Servidor de desarrollo
pnpm build        # Build de producción
pnpm start        # Iniciar servidor de producción
pnpm lint         # Ejecutar ESLint
```

## Variables de Entorno

```
NEXT_PUBLIC_SUPABASE_URL=              # URL de Supabase self-hosted
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=  # Clave pública (anon key)
SUPABASE_SERVICE_ROLE_KEY=             # Clave de servicio (solo servidor)
NEXT_PUBLIC_APP_URL=                   # URL base de la app
NEXT_PUBLIC_CDN_URL=                   # URL del CDN (Cloudflare)
STRIPE_SECRET_KEY=                     # Clave secreta de Stripe
STRIPE_WEBHOOK_SECRET=                 # Secreto del webhook de Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=    # Clave pública de Stripe
STRIPE_PRICE_PLUS_ID=                  # Price ID de plan Plus en Stripe
STRIPE_PRICE_VIP_ID=                   # Price ID de plan VIP en Stripe
DO_SPACES_KEY=                         # Digital Ocean Spaces access key
DO_SPACES_SECRET=                      # Digital Ocean Spaces secret key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=          # VAPID public key para push notifications
VAPID_PRIVATE_KEY=                     # VAPID private key (solo servidor)
INTERNAL_API_SECRET=                   # Secret para llamadas server-to-server
```

## Convenciones de Código

### Generales
- TypeScript estricto: `strict: true`, sin `any` a menos que sea absolutamente necesario
- Componentes funcionales con arrow functions
- Nombres en inglés para código, español para contenido visible al usuario
- Archivos: kebab-case para archivos, PascalCase para componentes
- Importaciones absolutas usando `@/` alias

### React / Next.js
- Usar Server Components por defecto, `"use client"` solo cuando sea necesario
- Preferir `server actions` sobre API routes cuando sea posible
- Validar inputs del usuario con Zod en server actions
- Componentes pequeños y reutilizables — no más de 150 líneas por componente
- Custom hooks para lógica de estado compleja
- Evitar `useEffect` cuando sea posible — preferir server-side data fetching
- En Next.js 16, `proxy.ts` reemplaza a `middleware.ts`

### Supabase
- Siempre usar el cliente correcto: `createClient()` en servidor, `createBrowserClient()` en cliente
- Todas las queries deben respetar RLS — nunca usar service role en el cliente
- Tipar todas las queries con los tipos generados de Supabase
- Manejar errores de Supabase explícitamente — no ignorar `error` del response
- Acceso a datos vía repositories (`lib/repositories/`), lógica vía services (`lib/services/`)

### Estilos
- Tailwind utility-first — evitar CSS custom
- Usar las variables de tema de shadcn/ui para colores
- Mobile-first: diseñar para móvil primero, luego adaptar a desktop
- La app debe funcionar perfectamente en dispositivos móviles (target principal)

### Git
- Commits semánticos: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `test:`
- Ramas: `feature/`, `fix/`, `refactor/` desde `main`
- PRs con descripción clara y screenshots cuando aplique

## Consideraciones Específicas para Cuba

- **Conectividad limitada**: Optimizar para conexiones lentas (lazy loading, imágenes comprimidas)
- **Datos móviles caros**: Minimizar transferencia de datos, usar caché agresivo
- **Dispositivos variados**: Asegurar compatibilidad con dispositivos Android de gama baja
- **Offline-first donde sea posible**: Service workers para funcionalidad básica offline
- **PWA**: La app debe ser instalable como PWA para funcionar sin app stores
- **Idioma**: Interfaz en español por defecto
- **Pagos CUP**: Soporte de pagos manuales en CUP vía WhatsApp para usuarios sin acceso a Stripe

## Seguridad

- Nunca exponer claves secretas en el cliente
- Validar todos los inputs en el servidor
- Sanitizar contenido generado por usuarios
- Implementar rate limiting en acciones sensibles
- Verificación de edad (18+) en el registro
- Sistema de reportes y moderación de contenido
- Bloqueo de usuarios como medida de seguridad
- Admin actions verifican `role = 'admin'` antes de ejecutar
- API de notificaciones protegida con `INTERNAL_API_SECRET`

## Performance

- Lazy loading de imágenes con `next/image` y blur placeholders
- Prefetch de los próximos perfiles en la cola de descubrimiento
- Virtualización de listas largas (matches, mensajes)
- Debounce en búsquedas y filtros
- Compresión de imágenes antes de subir a Storage
- Cloudflare Image Resizing para optimización de imágenes on-the-fly
- CDN de Cloudflare para assets estáticos y fotos de perfil
- `output: "standalone"` en Next.js para builds optimizados
- Service Worker con cache-first para assets estáticos

## Autenticación

- **Google OAuth exclusivamente** — no se usa email/password
- Flujo: Botón "Continuar con Google" → Supabase OAuth → Callback → Sesión
- Ruta de callback: `/auth/callback` (intercambia code por sesión)
- Al registrarse, trigger `on_auth_user_created` crea perfil en `users`
- Sesiones gestionadas con cookies vía `@supabase/ssr`
- `proxy.ts` protege rutas: redirige a `/auth/login` si no hay sesión
- Rutas admin requieren `role = 'admin'` en la tabla `users`

## Base de Datos

- Schema completo en `database.sql` — ejecutar en Supabase SQL Editor
- Tabla principal: `users` (NO `user_profiles` — siempre referenciar como `users`)
- Todas las tablas tienen RLS habilitado con policies estrictas
- Usar PostGIS para cálculos de geolocalización
- Los stats se actualizan solo vía triggers (SECURITY DEFINER)
- Cuando agregues tablas nuevas, actualizar `database.sql` y consultar al usuario
