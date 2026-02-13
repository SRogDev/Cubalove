# AGENTS.md — Empatando

## Descripción del Proyecto

Empatando es una plataforma de citas online inspirada en Tinder, construida con
Next.js 16 (App Router), Supabase y Tailwind CSS. El objetivo es ofrecer una experiencia
de matchmaking moderna optimizada para el contexto cubano (conectividad limitada,
dispositivos de gama baja, PWA-first).

## Visión del Producto

### Propuesta de Valor
Crear la primera plataforma de citas digital diseñada para Cuba, donde las opciones
de dating apps son extremadamente limitadas. Nos inspiramos en la experiencia probada
de Tinder pero la adaptamos al contexto local.

### Público Objetivo
- Adultos cubanos (18-45 años) con acceso a internet móvil
- Cubanos en el extranjero que buscan conectar con personas en Cuba
- Turistas que visitan Cuba y quieren conocer gente local

### Monetización
- Freemium: funcionalidades básicas gratuitas con swipes limitados por día
- Empatando Plus ($2/mes o 1000 CUP): swipes ilimitados, deshacer swipe, 1 boost mensual
- Empatando VIP ($8/mes o 4000 CUP): ver quién te dio like, likes ilimitados, boosts, pasaporte

## Agentes Especializados

### Agent: UI/Swipe Engineer
**Rol**: Desarrollar toda la interfaz de swipe inspirada en Tinder.
**Responsabilidades**:
- Implementar el SwipeStack con animaciones fluidas usando Framer Motion
- Crear gestos táctiles para swipe left (nope), right (like), up (super like)
- Desarrollar los botones de acción (X, corazón, estrella, rewind, boost)
- Implementar la pantalla de "¡Empataste!" con animaciones
- Optimizar rendimiento de animaciones en dispositivos de gama baja
- Garantizar 60fps en las animaciones de swipe

**Archivos clave**:
```
components/swipe/swipe-stack.tsx
components/swipe/swipe-card.tsx
components/swipe/swipe-actions.tsx
components/match/match-screen.tsx
lib/hooks/use-swipe.ts
lib/hooks/use-spring-animation.ts
```

**Guías de implementación**:
- Usar `framer-motion` para todas las animaciones
- El gesto de swipe debe tener threshold de 100px para confirmar acción
- Feedback visual: la tarjeta debe rotar ligeramente al arrastrar
- Mostrar overlay de "LIKE" (verde) o "NOPE" (rojo) según la dirección
- Pre-cargar las siguientes 3 tarjetas para transición instantánea
- En mobile: soporte completo de touch events
- En desktop: soporte de drag con mouse y atajos de teclado (flechas)

### Agent: Chat & Realtime Engineer
**Rol**: Implementar el sistema de mensajería en tiempo real.
**Responsabilidades**:
- Chat 1:1 entre usuarios que hicieron match
- Indicadores de "escribiendo..." y "visto"
- Envío de GIFs e imágenes en el chat
- Notificaciones de nuevos mensajes
- Scroll infinito para historial de mensajes

**Archivos clave**:
```
components/chat/chat-interface.tsx
components/chat/chat-bubble.tsx
components/chat/chat-input.tsx
components/chat/chat-list.tsx
lib/hooks/use-chat.ts
lib/hooks/use-realtime.ts
app/(app)/chat/[matchId]/page.tsx
```

**Guías de implementación**:
- Usar Supabase Realtime (canales por match_id)
- Optimistic updates para envío de mensajes
- Virtualizar la lista de mensajes para performance
- Comprimir imágenes antes de enviar (max 500KB)
- Almacenar imágenes de chat en Supabase Storage bucket `chat-images`
- Implementar retry automático en caso de desconexión

### Agent: Profile & Discovery Engineer
**Rol**: Gestión de perfiles de usuario y algoritmo de descubrimiento.
**Responsabilidades**:
- Editor de perfil (fotos, bio, intereses, información)
- Upload y gestión de hasta 6 fotos de perfil
- Algoritmo de descubrimiento (cola de perfiles)
- Filtros: edad, distancia, género
- Geolocalización del usuario

**Archivos clave**:
```
components/profile/profile-editor.tsx
components/profile/photo-uploader.tsx
components/profile/profile-card.tsx
app/(app)/profile/page.tsx
app/(app)/discover/page.tsx
lib/hooks/use-geolocation.ts
```

**Guías de implementación**:
- Las fotos deben comprimirse client-side antes de subir (max 1MB, WebP)
- Usar drag-and-drop para reordenar fotos
- El algoritmo de descubrimiento debe:
  - Filtrar por preferencias del usuario (edad, distancia, género)
  - Excluir usuarios ya vistos (swipeados)
  - Excluir usuarios bloqueados/reportados
  - Priorizar perfiles con fotos y bio completa
  - Usar PostGIS para cálculos de distancia
- Geolocalización: pedir permiso al usuario, actualizar posición cada 30 min
- Fallback a ubicación manual (seleccionar ciudad) si no hay GPS

### Agent: Auth & Security Engineer
**Rol**: Autenticación, autorización y seguridad de la plataforma.
**Responsabilidades**:
- Google OAuth como único método de login (no email/password)
- Verificación de edad (18+) en onboarding
- Row Level Security policies en Supabase (ver `database.sql`)
- Sistema de reportes y moderación
- Bloqueo de usuarios
- Rate limiting

**Archivos clave**:
```
app/auth/login/page.tsx
app/auth/sign-up/page.tsx
app/auth/callback/route.ts       — OAuth callback (code → session)
components/login-form.tsx         — Botón "Continuar con Google"
lib/supabase/server.ts
lib/supabase/client.ts
database.sql                      — RLS policies completas
```

**Guías de implementación**:
- Usar `@supabase/ssr` para manejo de sesiones con cookies
- Middleware de Next.js para proteger rutas autenticadas
- Google OAuth exclusivo: `signInWithOAuth({ provider: "google" })`
- Callback en `/auth/callback` intercambia code por sesión
- Trigger `on_auth_user_created` crea perfil automáticamente
- RLS policies estrictas — un usuario nunca puede ver datos de swipes ajenos
- Rate limit: máx 100 swipes/día para usuarios free (vía `user_stats`)
- Validar toda data con Zod en server actions
- Sanitizar contenido de bio y mensajes (prevenir XSS)
- Implementar soft-delete para cuentas eliminadas

### Agent: Payments & Subscription Engineer
**Rol**: Sistema de pagos y suscripciones con Stripe.
**Responsabilidades**:
- Integración con Stripe Checkout
- Gestión de planes de suscripción
- Webhooks para sincronizar estado
- Portal de cliente para gestionar suscripción
- Lógica de features premium

**Archivos clave**:
```
app/(app)/premium/page.tsx
app/api/webhooks/stripe/route.ts
lib/stripe/config.ts
lib/stripe/actions.ts
```

**Guías de implementación**:
- Tres planes: Free, Plus ($4.99/mes), Gold ($9.99/mes)
- Stripe Checkout para flujo de pago (no Custom Elements)
- Webhook handler robusto con verificación de firma
- Sincronizar subscription status en tabla `user_subscriptions` de Supabase
- Planes: `plus` y `vip` (ver tabla `user_subscriptions` en `database.sql`)
- Features premium controladas por middleware/server-side checks

### Agent: PWA & Performance Engineer
**Rol**: Optimización de rendimiento y funcionalidad PWA.
**Responsabilidades**:
- Configuración PWA (manifest, service worker, icons)
- Caching strategy para assets y datos
- Compresión y optimización de imágenes
- Bundle size optimization
- Core Web Vitals

**Guías de implementación**:
- Service worker con estrategia cache-first para assets estáticos
- Network-first para datos dinámicos con fallback a cache
- Manifest con tema, colores e íconos para instalación
- Splash screens para iOS y Android
- Lazy loading agresivo para rutas y componentes
- Imágenes: WebP con fallback, múltiples resoluciones via `next/image`
- Target: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Bundle analysis periódico con `@next/bundle-analyzer`

## Flujos Principales (User Stories)

### 1. Registro y Onboarding
```
Nuevo usuario → "Continuar con Google" → Google OAuth → Callback →
  → Trigger crea perfil en users → Onboarding:
  → Subir foto principal → Agregar nombre y fecha de nacimiento →
  → Seleccionar género y preferencia (show_me) → Escribir bio →
  → Seleccionar intereses → Configurar ubicación (municipio, provincia) →
  → Activar geolocalización → ¡Listo para descubrir!
```

### 2. Descubrimiento y Matching
```
Usuario entra a Discover → Ve tarjeta de perfil →
  → Swipe right (like) / left (nope) / up (super like) →
  → Si ambos dieron like → ¡Match! → Pantalla de match →
  → Opción de enviar mensaje o seguir descubriendo
```

### 3. Chat
```
Usuario ve lista de matches → Selecciona match →
  → Abre conversación → Envía/recibe mensajes en tiempo real →
  → Puede enviar GIFs o fotos → Indicadores de visto/escribiendo
```

### 4. Suscripción Premium
```
Usuario quiere features premium → Va a Premium →
  → Ve comparación de planes → Selecciona plan →
  → Stripe Checkout → Pago exitoso → Webhook actualiza DB →
  → Features premium desbloqueadas inmediatamente
```

## Convenciones para Agentes

### Naming
- Componentes: `PascalCase` (e.g., `SwipeCard`, `ChatBubble`)
- Hooks: `camelCase` con prefijo `use` (e.g., `useSwipe`, `useChat`)
- Utils: `camelCase` (e.g., `formatDistance`, `compressImage`)
- Tipos: `PascalCase` con sufijo descriptivo (e.g., `UserProfile`, `SwipeDirection`)
- Server Actions: `camelCase` con prefijo verbal (e.g., `createSwipe`, `sendMessage`)

### Testing
- Tests unitarios para utils y hooks con Vitest
- Tests de componentes con React Testing Library
- Tests E2E para flujos críticos (registro, swipe, match, chat) con Playwright
- Coverage mínimo: 80% en lógica de negocio

### Error Handling
- Usar `try/catch` en todas las server actions
- Retornar objetos `{ success, data, error }` desde server actions
- Mostrar toast notifications para errores de usuario
- Logging estructurado para errores de servidor
- Fallback UI para estados de error en componentes

### Accesibilidad
- Todos los elementos interactivos deben ser accesibles por teclado
- ARIA labels en botones de acción del swipe
- Soporte de screen readers para la interfaz de chat
- Contraste de colores WCAG AA mínimo
- Focus management en modales y overlays

### Base de Datos
- Schema completo en `database.sql` — siempre mantener sincronizado
- Tabla principal: `users` (NO `user_profiles`)
- Al proponer cambios de DB, preguntar al usuario antes de implementar
- Todas las tablas nuevas deben tener RLS habilitado
- Usar triggers con `SECURITY DEFINER` para actualizaciones cross-table

### Infraestructura
- Ver `INFRA.md` para la arquitectura completa
- Next.js self-hosted con `output: "standalone"` en Digital Ocean
- Supabase self-hosted (PostgreSQL, Auth, Realtime, Storage)
- Storage apunta a Digital Ocean Spaces (S3-compatible)
- Cloudflare CDN con Image Resizing para optimización de imágenes
- Dokploy para deploy automático desde GitHub

### Internacionalización (Futuro)
- Textos en español por defecto
- Preparar estructura para i18n con `next-intl` en el futuro
- No hardcodear strings — usar constantes o archivos de traducción
