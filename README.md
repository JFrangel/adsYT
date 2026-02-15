# 🔥 Free Fire Portal - Acortador con Retención

Portal web estilo acortador con 3 entradas que retienen usuarios mediante temporizadores y anuncios estratégicos. Panel admin oculto para gestionar archivos que se almacenan automáticamente en GitHub.

## 🚀 Características

- **3 Entradas Públicas** con temporizadores y verificación de anuncios
- **Tracking de Tiempo Real** con heartbeats y verificación server-side
- **Panel Admin Oculto** con autenticación JWT
- **Almacenamiento en GitHub** para archivos (subida/eliminación automática)
- **Sin Login para Usuarios** - Solo progreso por sesión
- **Diseño Responsivo** con Tailwind CSS
- **Deploy en Netlify** listo para producción

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Cuenta de GitHub con un repositorio para almacenar archivos
- Token de acceso personal de GitHub (PAT) con permisos `repo`
- Cuenta de Netlify (para despliegue)

## 🔧 Instalación Local

1. **Clonar e instalar dependencias:**

```bash
npm install
```

2. **Configurar variables de entorno:**

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus valores:

```env
GITHUB_TOKEN=ghp_tu_token_aqui
GITHUB_OWNER=tu_usuario_github
GITHUB_REPO=nombre_del_repo
GITHUB_BRANCH=main

ADMIN_USER=admin
ADMIN_PASS=tu_contraseña_segura

JWT_SECRET=clave_secreta_jwt_muy_larga_y_aleatoria
```

3. **Crear el repositorio GitHub:**

- Crea un repo nuevo en GitHub (público o privado)
- Crea un archivo `manifest.json` inicial en la raíz:

```json
{
  "files": []
}
```

4. **Obtener GitHub Token:**

- Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Genera un nuevo token con permisos `repo` completos
- Copia el token y úsalo en `GITHUB_TOKEN`

5. **Ejecutar en desarrollo:**

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
├── pages/
│   ├── index.tsx              # Entry 1 (timer 8s)
│   ├── entry2.tsx             # Entry 2 (anuncio 7s)
│   ├── entry3.tsx             # Entry 3 (descargas)
│   ├── ad-visit.tsx           # Página de visita a anuncio
│   ├── admin/
│   │   ├── login.tsx          # Login admin
│   │   └── index.tsx          # Panel admin
│   └── api/
│       ├── files.ts           # API pública de archivos
│       ├── download.ts        # Descarga y tracking
│       ├── ad/
│       │   └── heartbeat.ts   # Tracking de tiempo en anuncios
│       └── admin/
│           ├── auth.ts        # Autenticación admin
│           ├── check.ts       # Verificar sesión
│           ├── logout.ts      # Cerrar sesión
│           └── files.ts       # Gestión de archivos
├── components/
│   └── TimerButton.tsx        # Componente de temporizador
├── lib/
│   ├── github.ts              # Wrapper para GitHub API
│   ├── auth.ts                # Lógica de autenticación JWT
│   └── timers.ts              # Gestión de sesiones y tracking
└── styles/
    └── globals.css            # Estilos Tailwind
```

## 🎮 Flujo de Usuario

1. **Entry 1** (`/`)
   - Usuario hace click en "Desbloquear"
   - Timer de 8 segundos (cliente)
   - Se muestra anuncio durante la espera
   - Al terminar, aparece botón "Continuar"

2. **Entry 2** (`/entry2`)
   - Usuario hace click en "Ver Anuncio"
   - Redirige a `/ad-visit` con contador
   - Heartbeats cada 1s al servidor
   - Solo cuenta tiempo si pestaña está visible
   - Al completar 7s, se desbloquea "Continuar"

3. **Entry 3** (`/entry3`)
   - Muestra lista de archivos disponibles
   - Usuario selecciona y descarga archivos
   - Descarga desde GitHub (raw URL o proxy)

## 🛠️ Panel Admin

### Acceder al Panel

1. Ve a `/admin/login`
2. Usa las credenciales configuradas en `.env`
3. Accede al panel en `/admin`

### Funcionalidades Admin

- **Subir Archivos**: Formulario para subir archivos a GitHub
- **Eliminar Archivos**: Botón para borrar archivos del repo y manifest
- **Ver Estadísticas**: Número de descargas por archivo
- **Gestión de Manifest**: Actualización automática del `manifest.json`

## 🚀 Despliegue en Netlify

1. **Conectar Repositorio:**
   - Sube el código a GitHub
   - Conecta tu repo en Netlify

2. **Configurar Build:**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Usa Next.js plugin de Netlify (se detecta automáticamente)

3. **Variables de Entorno:**

En Netlify → Site settings → Environment variables, añade:

```
GITHUB_TOKEN=tu_token
GITHUB_OWNER=tu_usuario
GITHUB_REPO=tu_repo
GITHUB_BRANCH=main
ADMIN_USER=admin
ADMIN_PASS=tu_contraseña
JWT_SECRET=tu_secret_jwt
NODE_ENV=production
```

4. **Deploy:**
   - Netlify hará el deploy automáticamente
   - Tu app estará disponible en `tu-sitio.netlify.app`

## 🔐 Seguridad

- JWT con cookies httpOnly para admin
- `GITHUB_TOKEN` nunca expuesto al cliente
- Validación de tamaño/tipo de archivos (max 50MB)
- Verificación server-side de heartbeats
- Protección contra manipulación de timers

## ⚙️ Configuración Avanzada

### Cambiar Duración de Timers

Edita los componentes:
- Entry 1: `duration={8}` en `pages/index.tsx`
- Entry 2: `t=7` en URL y lógica de `lib/timers.ts`

### Límites de Archivos

En `pages/api/admin/files.ts`:
```typescript
const maxSize = 50 * 1024 * 1024; // 50MB
```

### Tipos de Archivos Permitidos

Añadir validación en `pages/api/admin/files.ts`

## 📊 Mejoras Futuras

- [ ] Analytics/dashboard de métricas
- [ ] Integración con S3 para archivos grandes
- [ ] Sistema de roles multi-admin
- [ ] Protección anti-bot (reCAPTCHA)
- [ ] Localización (i18n)
- [ ] Edición de textos y enlaces de anuncios desde admin
- [ ] Sistema de caché para manifest.json

## 🐛 Troubleshooting

**Error: GITHUB_TOKEN no válido**
- Verifica que el token tenga permisos `repo`
- Asegúrate de que no haya espacios extra

**Error: manifest.json not found**
- Crea el archivo manualmente en el repo
- Contenido inicial: `{"files": []}`

**Heartbeats no funcionan**
- Verifica que `/api/ad/heartbeat` responda
- Revisa console del navegador para errores
- Asegúrate de que la página tiene foco

**Archivos no se suben**
- Verifica límite de tamaño (50MB)
- Revisa permisos del token de GitHub
- Comprueba logs de Netlify

## 📝 Licencia

MIT

## 👨‍💻 Autor

Desarrollado para Free Fire Portal

---

**Nota**: Este es un proyecto educativo. Asegúrate de cumplir con las políticas de los proveedores de anuncios que uses.
