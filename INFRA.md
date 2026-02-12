# INFRA.md — Dating Cuba — Infraestructura

## Visión General

Toda la infraestructura de Dating Cuba está alojada en **Digital Ocean**, usando
**Dokploy** como plataforma de deployment y orquestación. Usamos **Cloudflare** como
CDN y proxy de seguridad frente a todo el tráfico público.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE                               │
│  CDN · WAF · DNS · SSL · Image Optimization · Cache            │
└──────────────┬──────────────────────────────┬───────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────┐   ┌──────────────────────────────────┐
│   DIGITAL OCEAN DROPLET  │   │   DIGITAL OCEAN SPACES (S3)     │
│                          │   │                                  │
│  ┌────────────────────┐  │   │  Bucket: dating-cuba-storage    │
│  │     DOKPLOY        │  │   │  - Fotos de perfil               │
│  │  (Orquestador)     │  │   │  - Imágenes de chat              │
│  │                    │  │   │  - Assets estáticos              │
│  │  ┌──────────────┐  │  │   └──────────────────────────────────┘
│  │  │  Next.js 16  │  │  │
│  │  │  (App)       │  │  │
│  │  │  Port 3000   │  │  │
│  │  └──────────────┘  │  │
│  │                    │  │
│  │  ┌──────────────┐  │  │
│  │  │  Supabase    │  │  │
│  │  │  Self-hosted │  │  │
│  │  │  - Auth      │  │  │
│  │  │  - PostgREST │  │  │
│  │  │  - Realtime  │  │  │
│  │  │  - Storage*  │  │  │
│  │  │  - PostgreSQL│  │  │
│  │  └──────────────┘  │  │
│  └────────────────────┘  │
└──────────────────────────┘

* Storage de Supabase configurado para usar DO Spaces como backend S3
```

## Componentes

### 1. Next.js 16 — Self-hosted (Frontend + Backend)

Next.js actúa como nuestro frontend y backend (API routes, server actions).
Se ejecuta en modo standalone para optimizar el tamaño del build.

**Configuración clave:**
- `output: "standalone"` en `next.config.ts`
- Puerto: 3000 (interno), expuesto vía Cloudflare
- Imágenes optimizadas vía Cloudflare Image Resizing
- Headers de seguridad configurados en `next.config.ts`

**Variables de entorno en producción:**
```
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://supabase.datingcuba.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_APP_URL=https://datingcuba.com
NEXT_PUBLIC_CDN_URL=https://cdn.datingcuba.com
STRIPE_SECRET_KEY=<stripe-secret>
STRIPE_WEBHOOK_SECRET=<webhook-secret>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<stripe-pub>
```

### 2. Supabase — Self-hosted

Supabase se despliega como un conjunto de contenedores Docker orquestados por Dokploy.
Incluye: PostgreSQL, GoTrue (Auth), PostgREST, Realtime, Storage API, Studio (admin).

**Componentes Docker:**
| Servicio        | Puerto interno | Descripción                     |
|-----------------|----------------|---------------------------------|
| PostgreSQL      | 5432           | Base de datos principal          |
| GoTrue (Auth)   | 9999           | Autenticación y OAuth            |
| PostgREST       | 3000           | API REST auto-generada           |
| Realtime        | 4000           | WebSocket para chat y notifs     |
| Storage API     | 5000           | Gestión de archivos (→ DO Spaces)|
| Studio          | 3001           | Panel admin (solo acceso interno)|
| Kong            | 8000           | API Gateway                      |

**Storage → Digital Ocean Spaces:**
El Storage API de Supabase se configura para usar DO Spaces como backend S3 compatible
en lugar del almacenamiento local. En el `docker-compose.yml` de Supabase:

```yaml
storage:
  environment:
    STORAGE_BACKEND: s3
    STORAGE_S3_BUCKET: dating-cuba-storage
    STORAGE_S3_ENDPOINT: https://nyc3.digitaloceanspaces.com
    STORAGE_S3_REGION: nyc3
    STORAGE_S3_ACCESS_KEY: ${DO_SPACES_KEY}
    STORAGE_S3_SECRET_KEY: ${DO_SPACES_SECRET}
    STORAGE_S3_FORCE_PATH_STYLE: "true"
```

### 3. Digital Ocean Spaces (Object Storage)

Almacenamiento S3-compatible para todos los archivos del proyecto.

**Buckets:**
- `dating-cuba-storage` — bucket principal usado por Supabase Storage
  - `/profile-photos/` — Fotos de perfil de usuarios
  - `/chat-images/` — Imágenes enviadas en el chat
  - `/chismes/` — Imágenes de chismes

**CDN de Spaces:**
Digital Ocean Spaces tiene CDN integrado, pero lo servimos a través de Cloudflare
para mayor control de caché y optimización de imágenes.

**Endpoint público:** `https://cdn.datingcuba.com` (vía Cloudflare)

### 4. Cloudflare — CDN, DNS, Seguridad

Cloudflare actúa como proxy frente a toda la infraestructura pública.

**Funciones:**
- **DNS**: Gestión de dominio `datingcuba.com`
- **SSL/TLS**: Full (Strict) — certificados en origen + edge
- **CDN**: Caché de assets estáticos, imágenes, fonts
- **Image Resizing**: Transformación de imágenes on-the-fly (resize, format, quality)
- **WAF**: Protección contra ataques comunes
- **Rate Limiting**: Protección contra abuso de API
- **Cache Rules**: Caché agresivo para imágenes y assets

**Subdominios:**
| Subdominio                  | Destino                      |
|-----------------------------|------------------------------|
| `datingcuba.com`            | Next.js (Droplet)            |
| `supabase.datingcuba.com`   | Kong API Gateway (Droplet)   |
| `cdn.datingcuba.com`        | DO Spaces CDN                |

**Configuración de Image Resizing:**
Las imágenes de perfil se sirven mediante Cloudflare Image Resizing para entregar
el tamaño y formato óptimo según el dispositivo:

```
https://cdn.datingcuba.com/cdn-cgi/image/width=400,quality=80,format=auto/profile-photos/user-123/photo-1.jpg
```

### 5. Dokploy — Orquestación y Deploy

Dokploy gestiona el deployment automático desde este repositorio de GitHub.

**Funciones:**
- Deploy automático en push a `main`
- Gestión de contenedores Docker (Supabase stack + Next.js)
- Variables de entorno centralizadas
- Certificados SSL internos
- Logs centralizados
- Rollback instantáneo
- Health checks

**Pipeline de deploy:**
```
Push a main → GitHub Webhook → Dokploy detecta cambio →
  → Build Next.js (standalone) → Reemplaza contenedor →
  → Health check → Deploy exitoso
```

**Configuración de Dokploy:**
- Conectado al repo `SRogDev/Dating-Cuba`
- Branch de deploy: `main`
- Build command: `pnpm build`
- Dockerfile: auto-generado o custom en `/Dockerfile`

## Requisitos del Droplet

**Recomendación mínima para producción:**
- **Droplet**: Premium AMD, 4 vCPU, 8GB RAM, 160GB SSD
- **Región**: NYC3 (misma región que Spaces)
- **SO**: Ubuntu 22.04 LTS

**Distribución de recursos:**
| Servicio     | RAM estimada | CPU |
|-------------|-------------|-----|
| PostgreSQL  | 2GB         | 1   |
| Next.js     | 1GB         | 1   |
| GoTrue      | 256MB       | 0.5 |
| PostgREST   | 256MB       | 0.5 |
| Realtime    | 512MB       | 0.5 |
| Storage API | 256MB       | 0.25|
| Kong        | 256MB       | 0.25|
| Dokploy     | 512MB       | —   |
| **Total**   | **~5GB**    | **4**|

## Backups

- **PostgreSQL**: Backup diario automático vía `pg_dump` a DO Spaces
- **DO Spaces**: Versionado de objetos habilitado
- **Retención**: 30 días de backups diarios

## Monitoreo

- **Dokploy**: Health checks y logs de contenedores
- **Cloudflare Analytics**: Tráfico, cache hit ratio, threats blocked
- **Supabase Studio**: Monitoreo de queries, auth events
- **Uptime Robot** (o similar): Alertas de downtime

## Consideraciones de Red

- El tráfico usuario → Cloudflare es HTTPS
- Cloudflare → Droplet usa Full (Strict) SSL
- Las comunicaciones internas entre contenedores usan red Docker privada
- Solo los puertos necesarios están expuestos al host (Kong 8000, Next.js 3000)
- PostgreSQL nunca está expuesto a internet
