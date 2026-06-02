# Dance Beat Academy — Web

Plataforma web de Dance Beat Academy. Migración desde Wix a un stack propio para
soportar reservas, cuentas de alumnos, dashboards de profesores/admin y
multi-sucursal.

## Stack

- **Next.js 15** (App Router, RSC, Server Actions)
- **TypeScript** estricto
- **Tailwind CSS 3.4** + **shadcn/ui** (configurado, sin componentes precargados)
- **Supabase** (Postgres + Auth + Storage)
- **Stripe** para pagos (fase 2)
- **Vercel** para hosting

## Estructura

```
dancebeat-web/
├── app/                    Rutas Next.js (App Router)
│   ├── layout.tsx          Layout raíz con fuentes y nav/footer
│   ├── page.tsx            Home
│   ├── fonts.ts            next/font (August Bold + Inter + JetBrains Mono)
│   └── globals.css         Tokens de diseño + Tailwind
├── components/
│   ├── nav.tsx             Header con scroll-blur
│   ├── footer.tsx          Footer editorial
│   ├── home/               Secciones del Home
│   └── ui/                 Componentes shadcn (vacío, agregar con `npx shadcn add`)
├── lib/
│   ├── utils.ts            cn() helper
│   └── supabase/           Clientes browser y server
├── public/
│   ├── fonts/              August-Bold.ttf
│   └── logos/              Logos Dance Beat (PNG)
└── types/                  Tipos compartidos del dominio
```

## Setup local

### 1. Instalar Node.js

Necesitas Node 18.18+ (recomendado: 20 LTS).
Descarga: https://nodejs.org/ → versión LTS.

Verifica:

```bash
node -v   # v20.x.x o superior
npm -v    # 10.x.x o superior
```

### 2. Instalar dependencias

```bash
cd dancebeat-web
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Luego edita `.env.local` con tus credenciales reales (Supabase, Stripe, etc.).
**Nunca** commitees `.env.local`.

### 4. Correr en desarrollo

```bash
npm run dev
```

Abre http://localhost:3000.

## Deploy en Vercel

### Primera vez

1. Crea repositorio en GitHub:
   ```bash
   gh repo create dancebeat-academy --private --source=. --remote=origin
   git push -u origin main
   ```

   O manualmente: crea el repo en github.com, luego:
   ```bash
   git remote add origin https://github.com/<tu-usuario>/dancebeat-academy.git
   git branch -M main
   git push -u origin main
   ```

2. Importa el proyecto en Vercel:
   - Ve a https://vercel.com/new
   - Selecciona el repo
   - Framework: Next.js (auto-detectado)
   - Root directory: `dancebeat-web`
   - Agrega las variables de entorno desde `.env.example` (excepto `NEXT_PUBLIC_SITE_URL` que debe apuntar al dominio de producción)
   - Deploy

3. Cada push a `main` redeploys automáticamente. Los PRs generan preview URLs.

### Dominio

Apunta `dancebeat.studio` (o el que sea) desde el panel de Vercel → Domains.
Mientras se hace la migración, puedes deployar a un subdominio (`new.dancebeat.studio`).

## Convenciones

- **Componentes**: PascalCase, en `components/` agrupados por dominio (`home/`, `app/`, `admin/`).
- **Server Components por defecto**. Solo agregar `"use client"` cuando se necesite estado, efectos o eventos.
- **Tailwind**: usar tokens del design system (`text-bone`, `bg-ink`, `text-lumen`) en lugar de colores hardcoded.
- **Tipografía**: `font-display` (August) solo para titulares grandes ≥40px. Body en `font-body` (Inter).

## Diseño — sistema de tokens

### Paleta

| Token | Hex | Uso |
|---|---|---|
| `ink` | `#000000` | Fondo principal |
| `ink-off` | `#0A0A0A` | Cards, footer |
| `ink-surface` | `#1A1A1A` | Modales, dropdowns |
| `bone` | `#FFFFFF` | Texto principal |
| `bone-mute` | `#A8A8A8` | Texto secundario |
| `bone-border` | `#4A4A4A` | Bordes sutiles |
| `lumen` | `#B8A4FF` | Acento, focus, plan activo |
| `lumen-deep` | `#6B5BD6` | Hover states |
| `lumen-wash` | `#E8DFFF` | Backgrounds suaves |

### Tipografía

- **Display**: August Bold (titulares ≥40px)
- **Body**: Inter (todo lo demás)
- **Mono**: JetBrains Mono (números, etiquetas técnicas)

### Componentes utility

- `.eyebrow` — etiqueta tipo "ACADEMY" (uppercase, tracking amplio)
- `.glass` — card con blur frostado
- `.hairline` — divisor sutil
- `.bg-spotlight` — gradiente radial Lumen para heros

## Roadmap

### Fase 0 — Landing pública (actual)
- [x] Home con hero, estilos, planes, Luminaria
- [ ] `/clases` (hub + páginas por estilo)
- [ ] `/horarios` (calendario público)
- [ ] `/planes` (página completa de pricing)
- [ ] `/luminaria` (landing del show)
- [ ] `/estudio` (sobre, venue, contacto)

### Fase 1 — Sistema de cuentas
- [ ] Auth (Supabase) — registro, login, recuperación
- [ ] Onboarding alumno
- [ ] Stripe checkout para inscripción + plan mensual
- [ ] Webhook Stripe → activar suscripción

### Fase 2 — Reservas
- [ ] Modelo de BD completo (studios, classes, sessions, bookings, plans)
- [ ] `/app/reservar` (calendario interactivo)
- [ ] `book_class()` Postgres function (atómica)
- [ ] Lista de espera con promoción automática
- [ ] WhatsApp confirmaciones (Twilio)

### Fase 3 — Backoffice
- [ ] `/admin` métricas
- [ ] CRUD de clases, planes, usuarios
- [ ] `/profesor/clase/[id]` para asistencia
- [ ] Reportes de ocupación

### Fase 4 — Comunidad (opcional)
- [ ] Blog/feed
- [ ] Reels de alumnos
- [ ] Galería Luminaria

## Notas

### Licencia de fuente

`August-Bold.ttf` requiere validación de licencia para uso comercial. Verificar
con la clienta antes de go-live. Si no hay licencia, alternativas con vibra
similar y track comercial: **Fraunces**, **Ogg**, **Tobias**.

### Imágenes placeholder

El Home usa imágenes de Unsplash temporalmente. Reemplazar con fotografía
propia (idealmente B&N de las alumnas/clases en el venue) antes de producción.

### Multi-sucursal

El modelo está diseñado multi-tenant desde el día 1: cada `class` tiene
`studio_id`. Por ahora dos sucursales: Av. Stim 1348 piso -1 (a partir 4:30 PM)
y Recepción Cumbres International School.
