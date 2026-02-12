# CLAUDE.md — Dating Cuba

## Proyecto

**Dating Cuba** es una aplicación de citas diseñada específicamente para el mercado cubano.
El producto se inspira directamente en **Tinder** — imitamos sus elementos de UI, flujos de
interacción y lógicas de matching. El stack es **Next.js 16 (App Router)** + **Supabase**
(auth, database, storage, realtime) + **Tailwind CSS** + **shadcn/ui**.

## Referencia Principal: Tinder

Debemos estudiar y replicar las siguientes características clave de Tinder:

### UI/UX a Imitar
- **Card Stack**: Las tarjetas de perfil se apilan y se deslizan (swipe left/right)
- **Swipe Gestures**: Soporte completo para gestos táctiles en móvil y drag en desktop
- **Like / Nope / Super Like**: Los tres estados visuales al interactuar con un perfil
- **Match Screen**: La pantalla de "It's a Match!" con animación cuando hay match mutuo
- **Chat Interface**: Mensajería en tiempo real similar a la de Tinder
- **Profile Cards**: Fotos grandes, nombre, edad, bio corta, distancia
- **Discovery Settings**: Filtros de edad, distancia, género
- **Perfil Editable**: Fotos (hasta 9), bio, intereses, información básica

### Lógicas de Tinder a Implementar
- **Matching bilateral**: Solo se crea match cuando ambos usuarios se dan like
- **Cola de perfiles**: Algoritmo que presenta perfiles relevantes uno a uno
- **Sistema de likes limitados**: Gestión de cuota diaria de swipes
- **Boost/Super Like**: Funcionalidades premium
- **Deshacer último swipe**: Feature premium
- **Geolocalización**: Filtrado por proximidad

## Stack Técnico

### Frontend
- **Next.js 16** con App Router y React Server Components
- **TypeScript** estricto en todo el proyecto
- **Tailwind CSS v3** para estilos utilitarios
- **shadcn/ui** como sistema de componentes base
- **Framer Motion** para animaciones de swipe y transiciones
- **Lucide React** para iconografía

### Backend (Supabase)
- **Supabase Auth**: Login con email/password, OAuth (Google), magic links
- **Supabase Database (PostgreSQL)**: Todas las tablas con Row Level Security (RLS)
- **Supabase Storage**: Almacenamiento de fotos de perfil
- **Supabase Realtime**: Chat en tiempo real y notificaciones de match
- **Supabase Edge Functions**: Lógica de servidor (matching algorithm, etc.)

### Pagos
- **Stripe** para suscripciones premium (Tinder Plus, Gold equivalentes)
- Stripe Checkout para flujo de pago
- Stripe Webhooks para sincronizar estado de suscripción

## Arquitectura de la Base de Datos

### Tablas Principales
```
profiles        — Información de usuario (nombre, bio, fotos, preferencias, ubicación)
swipes          — Registro de cada swipe (user_id, target_id, direction, created_at)
matches         — Matches confirmados (user1_id, user2_id, created_at)
messages        — Mensajes de chat (match_id, sender_id, content, created_at)
subscriptions   — Estado de suscripción Stripe del usuario
reports         — Reportes de usuarios problemáticos
blocks          — Usuarios bloqueados
```

### Row Level Security (RLS)
- Cada usuario solo puede leer/escribir sus propios datos
- Los mensajes solo son visibles para los participantes del match
- Los swipes son privados — un usuario nunca ve quién le dio like (excepto premium)
- Las policies deben ser estrictas y testeadas

## Estructura de Carpetas

```
app/
  (auth)/                 — Páginas de autenticación (login, signup, forgot-password)
  (app)/                  — Layout principal de la app autenticada
    discover/             — Pantalla principal de swipe (estilo Tinder)
    matches/              — Lista de matches
    chat/[matchId]/       — Conversación individual
    profile/              — Perfil propio (editar)
    profile/[userId]/     — Ver perfil de otro usuario
    settings/             — Configuración y preferencias
    premium/              — Planes de suscripción
  api/
    webhooks/stripe/      — Webhook de Stripe
components/
  ui/                     — Componentes shadcn/ui
  swipe/                  — SwipeCard, SwipeStack, SwipeActions
  chat/                   — ChatBubble, ChatInput, ChatList
  profile/                — ProfileCard, ProfileEditor, PhotoUploader
  match/                  — MatchScreen, MatchList
  layout/                 — Navbar, BottomNav, Sidebar
lib/
  supabase/               — Clientes de Supabase (server, client, middleware)
  stripe/                 — Configuración de Stripe
  utils/                  — Utilidades generales
  hooks/                  — Custom hooks (useSwipe, useChat, useGeolocation)
  constants/              — Constantes de la app
  types/                  — Tipos TypeScript globales
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
NEXT_PUBLIC_SUPABASE_URL=          # URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Clave pública de Supabase
SUPABASE_SERVICE_ROLE_KEY=         # Clave de servicio (solo servidor)
STRIPE_SECRET_KEY=                 # Clave secreta de Stripe
STRIPE_WEBHOOK_SECRET=             # Secreto del webhook de Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY= # Clave pública de Stripe
NEXT_PUBLIC_APP_URL=               # URL base de la app
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

### Supabase
- Siempre usar el cliente correcto: `createClient()` en servidor, `createBrowserClient()` en cliente
- Todas las queries deben respetar RLS — nunca usar service role en el cliente
- Tipar todas las queries con los tipos generados de Supabase
- Manejar errores de Supabase explícitamente — no ignorar `error` del response

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

## Seguridad

- Nunca exponer claves secretas en el cliente
- Validar todos los inputs en el servidor
- Sanitizar contenido generado por usuarios
- Implementar rate limiting en acciones sensibles
- Verificación de edad (18+) en el registro
- Sistema de reportes y moderación de contenido
- Bloqueo de usuarios como medida de seguridad

## Performance

- Lazy loading de imágenes con `next/image` y blur placeholders
- Prefetch de los próximos perfiles en la cola de descubrimiento
- Virtualización de listas largas (matches, mensajes)
- Debounce en búsquedas y filtros
- Compresión de imágenes antes de subir a Storage
- CDN de Supabase para assets estáticos
