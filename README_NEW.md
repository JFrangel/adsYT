# 🔥 Free Fire Portal - Sistema Completo de Retención Multiestado

Portal web profesional con **3 fases de progreso** que retienen usuarios mediante temporizadores progresivos, verificación de anuncios con heartbeats, y descargas de archivos. Incluye **panel admin oculto** con autenticación JWT, almacenamiento seguro con encriptación AES-256-CBC, diseño glassmorphism animado e **iconos SVG personalizados**.

---

## ✨ Características Principales

### 🎯 Sistema de 3 Pasos Estratégicos
- **Paso 1 (`/`)**: Temporizador 8s con localStorage persistente - retiene usuarios con Lock Icon animado
- **Paso 2 (`/entry2`)**: Verificación de anuncio 7s con heartbeats server-side - solo cuenta si pestaña activa
- **Paso 3 (`/entry3`)**: Descarga de archivos desde almacenamiento local con tracking automático

### 🔐 Seguridad Avanzada
- **Encriptación AES-256-CBC** para tokens de GitHub (IV aleatorio por encriptación)
- **JWT httpOnly Cookies** para sesiones admin (prevención CSRF)
- **Validación Server-Side** de todas las transacciones y tiempos
- **Protección Anti-Manipulación** de timers mediante sellos de tiempo
- **Tokens Nunca Expuestos** en texto plano (encriptados en variables de entorno)

### 💾 Gestión Inteligente de Archivos
- Almacenamiento en carpeta local `/archivos` (no GitHub para binarios)
- Manifest JSON automático con metadata completa
- Tracking de descargas por archivo y usuario
- Panel admin para subir/eliminar archivos con validación
- Límite configurable de 50MB por archivo

### 🎨 Interfaz Moderna y Profesional
- **Glassmorphism Design** con efectos de blur y transparencia
- **15 Iconos SVG Animados** (reemplazó completamente todos los emojis)
- **Animaciones Personalizadas**: float, glow, fadeIn, bounce, spin, scale
- **Diseño Fully Responsive** (mobile 320px, tablet 768px, desktop 1440px+)
- **Gradientes Dinámicos** y efectos de iluminación con Tailwind

### 📊 Admin Panel Profesional
- Interfaz similar a dashboards enterprise
- Autenticación con usuario/contraseña segura
- Subida de archivos con validación de tipo y tamaño
- Gestión de descargas (estadísticas en tiempo real)
- Eliminación segura de archivos
- Estado visual de sesión activa

---

## 🛠 Stack Tecnológico Completo

| Componente | Tecnología | Versión | Propósito |
|-----------|-----------|---------|----------|
| **Framework** | Next.js | 14.2.35 | SSR, API routes, optimización |
| **Runtime** | React | 18.2.0 | Componentes UI reutilizables |
| **Lenguaje** | TypeScript | 5.3.3 | Type safety y mejor DX |
| **Estilos** | Tailwind CSS | 3.4.1 | Utilidades, animaciones custom |
| **Encriptación** | crypto (Node.js) | Built-in | AES-256-CBC de tokens |
| **Autenticación** | JWT + Cookies | Custom | Sesiones admin seguras |
| **HTTP Client** | Axios | Latest | Requests a APIs |
| **Validación Files** | Formidable | 2.1.2 | Multipart form parsing |
| **Deployment** | Netlify | - | CI/CD automático |

---

## 📋 Requisitos Previos

- **Node.js** 18+ (verificar con `node --version`)
- **npm** 9+ (verificar con `npm --version`)
- **Cuenta de GitHub** (para token - aunque archivos se guardan localmente)
- **Terminal/Command Line** con acceso a variables de entorno
- **Editor de Código** (VS Code recomendado)
- **Git** instalado

---

## 🚀 Instalación y Configuración Completa

### 1️⃣ Clonar Repositorio

```bash
# Clonar el repo
git clone https://github.com/JFrangel/adsYT.git
cd "volver al peak"

# Verificar contenido
ls -la  # Windows: dir
```

### 2️⃣ Instalar Dependencias

```bash
npm install

# Esto instala:
# - next@14.2.35
# - react@18.2.0
# - typescript@5.3.3
# - tailwindcss@3.4.1
# - axios
# - formidable
```

### 3️⃣ Generar Clave de Encriptación (IMPORTANTE)

```bash
# Genera 32 bytes de entropía en base64
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Ejemplo de output:
# a7K9/m2+QxL8vN5pR3wZ1jD4bF6gH7jK8lM9nO0pQ1sT

# Copia este valor - es tu ENCRYPTION_KEY
```

### 4️⃣ Crear y Configurar `.env.local`

Copia el template:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus valores:

```env
# ⚠️ CRÍTICO: Encriptación del token de GitHub
# Usa la clave que generaste en paso 3
ENCRYPTION_KEY=a7K9/m2+QxL8vN5pR3wZ1jD4bF6gH7jK8lM9nO0pQ1sT

# GitHub (el token será encriptado después)
GITHUB_TOKEN_ENCRYPTED=será_generado_después
GITHUB_OWNER=JFrangel
GITHUB_REPO=adsYT
GITHUB_BRANCH=main

# Admin - Cambiar estas credenciales
ADMIN_USER=admin
ADMIN_PASS=tu_contraseña_muy_segura_123!

# JWT - Generar clave aleatoria larga
JWT_SECRET=tu_clave_jwt_super_secreta_y_muy_larga_sin_espacios

# Modo deployment
NODE_ENV=development
```

### 5️⃣ Encriptar Token de GitHub (Recomendado)

**Obtén tu GitHub Token primero:**

1. Ve a https://github.com/settings/tokens?type=beta
2. Click "Generate new token"
3. Nombre: "adsYT-local"
4. Expiration: "30 days" (o lo que prefieras)
5. Permisos necesarios: `repo` (completo)
6. Click "Generate"
7. **Copia el token** (aparece solo una vez)

**Encripta el token:**

```bash
# Configura la variable de entorno primero
$env:ENCRYPTION_KEY='tu_ENCRYPTION_KEY_aqui'

# Encripta tu token
node scripts/encrypt-env.js ghp_tu_token_completo_aqui

# Output será algo como:
# ✅ Token encrypted successfully!
# GITHUB_TOKEN_ENCRYPTED=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6:9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9
```

**Actualiza `.env.local`:**

```env
GITHUB_TOKEN_ENCRYPTED=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6:9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9
```

### 6️⃣ Crear Carpeta de Archivos

```bash
# Crea la carpeta donde se guardan los descargables
mkdir -p archivos

# La carpeta es ignorada en .gitignore (no sube binarios)
```

### 7️⃣ Ejecutar en Desarrollo

```bash
npm run dev

# Output esperado:
# > next-app@1.0.0 dev
# > next dev
# 
# ▲ Next.js 14.2.35
# - Local: http://localhost:3000
# 
# ✓ Ready in 2.3s
```

Abre **[http://localhost:3000](http://localhost:3000)** en tu navegador.

---

## 📁 Estructura Completa del Proyecto

```
d:\proyects\volver al peak\
│
├── 📄 pages/                           # Rutas de la aplicación
│   ├── 📄 index.tsx                    # 🔥 Paso 1: Timer 8s (GET /)
│   ├── 📄 entry2.tsx                   # 📢 Paso 2: Anuncio 7s (GET /entry2)
│   ├── 📄 entry3.tsx                   # 📥 Paso 3: Descargas (GET /entry3)
│   ├── 📄 ad-visit.tsx                 # 🎯 Página de anuncio (GET /ad-visit)
│   ├── 📄 _app.tsx                     # Wrapper global de Next.js
│   ├── 📄 _document.tsx                # HTML document personalizado
│   │
│   ├── 📁 admin/                       # 🔐 Rutas protegidas
│   │   ├── 📄 login.tsx                # Login admin (GET /admin/login)
│   │   └── 📄 index.tsx                # Panel admin (GET /admin) - requiere JWT
│   │
│   └── 📁 api/                         # APIs RESTful
│       ├── 📄 files.ts                 # 📋 GET /api/files - lista pública
│       ├── 📄 download.ts              # ⬇️ /api/download - tracking + descarga
│       │
│       ├── 📁 ad/
│       │   └── 📄 heartbeat.ts         # 💓 POST /api/ad/heartbeat
│       │
│       └── 📁 admin/
│           ├── 📄 auth.ts              # 🔑 POST /api/admin/auth
│           ├── 📄 check.ts             # ✅ GET /api/admin/check
│           ├── 📄 logout.ts            # 🚪 GET /api/admin/logout
│           └── 📄 files.ts             # 📁 /api/admin/files (CRUD)
│
├── 📁 components/                      # Componentes React reutilizables
│   ├── 📄 TimerButton.tsx              # ⏱️ Componente timer con iconos
│   └── 📄 Icons.tsx                    # 🎨 Librería de 15 iconos SVG animados
│
├── 📁 lib/                             # Lógica compartida (helpers)
│   ├── 📄 github.ts                    # 🐙 Wrapper GitHub API con desencriptación
│   ├── 📄 auth.ts                      # 🔒 Lógica JWT, verificación cookies
│   ├── 📄 encryption.ts                # 🔐 AES-256-CBC encrypt/decrypt
│   └── 📄 timers.ts                    # ⏰ Gestión de timers y sesiones
│
├── 📁 styles/                          # Estilos globales
│   └── 📄 globals.css                  # 🎨 Tailwind + @keyframes animaciones
│
├── 📁 archivos/                        # 📦 Carpeta para descargas
│   ├── 📄 SCAN1244.pdf                 # Archivo de ejemplo
│   └── manifest.json                   # Metadata de archivos
│
├── 📁 scripts/                         # Scripts de utilidad
│   └── 📄 encrypt-env.js               # 🔐 Herramienta para encriptar tokens
│
├── 🔧 Configuración
│   ├── 📄 tsconfig.json                # TypeScript config
│   ├── 📄 tailwind.config.js           # Tailwind config + animaciones
│   ├── 📄 next.config.js               # Next.js config
│   ├── 📄 jest.config.js               # Jest testing (opcional)
│   └── 📄 .eslintrc.json               # ESLint config
│
├── 📋 Documentación
│   ├── 📄 .env.example                 # Template de variables
│   ├── 📄 .env.local                   # Variables reales (git-ignored)
│   ├── 📄 .gitignore                   # Archivos ignorados por git
│   ├── 📄 README.md                    # Este archivo
│   ├── 📄 SETUP.md                     # Guía rápida de setup
│   ├── 📄 ENCRYPTION_SETUP.md          # Guía detallada de encriptación
│   └── 📄 CONTRIBUTING.md              # Guía para contribuir
│
├── 🔗 Control de Versiones
│   ├── 📄 .gitignore                   # Excluye: /archivos, /files, .env.local
│   └── 📄 package.json                 # Dependencias y scripts npm
│
└── 📦 Carpetas Generadas (después del build)
    ├── 📁 .next/                       # Build output (git-ignored)
    ├── 📁 node_modules/                # Dependencias (git-ignored)
    └── 📁 .netlify/                    # Deploy config (si usas Netlify)
```

---

## 🎮 Flujo de Usuario Completo

### Paso 1: Timer Desbloqueador (8 segundos)
- Usuario hace click en "Desbloquear"
- Temporizador inicia y cuenta hacia atrás
- Progreso visual animado con Lock Icon
- Al terminar: Check Icon y acceso a Paso 2

### Paso 2: Verificación de Anuncio (7 segundos)
- Usuario hace click en "Ver Anuncio"
- Se abre página publicitaria en nueva pestaña
- Heartbeats cada 1s validados server-side
- Solo cuenta si pestaña principal activa
- Al completar 7s: acceso a Paso 3

### Paso 3: Descarga de Archivos
- Lista de archivos disponibles
- Click en "Descargar"
- Contador de descargas se incrementa
- Archivo se descarga a la PC
- Sesión se limpia para nuevo ciclo

---

## 🚀 Despliegue en Netlify

### Paso 1: Preparar Repositorio

```bash
git add .
git commit -m "Ready for production"
git push origin main
```

### Paso 2: Conectar Netlify

1. Ve a https://app.netlify.com
2. Click: **"Add new site"** → **"Import an existing project"**
3. Selecciona: **GitHub** y autoriza
4. Selecciona repo: **adsYT**

### Paso 3: Configurar Variables

En Netlify → **Site settings** → **Environment variables:**

```env
ENCRYPTION_KEY=tu_clave_base64
GITHUB_TOKEN_ENCRYPTED=iv:encryptedtoken
GITHUB_OWNER=JFrangel
GITHUB_REPO=adsYT
GITHUB_BRANCH=main
ADMIN_USER=admin
ADMIN_PASS=tu_contraseña
JWT_SECRET=tu_secret_jwt
NODE_ENV=production
```

### Paso 4: Deploy

```bash
git push origin main
# Netlify automáticamente detecta y deploya
```

---

## 🐛 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| "ENCRYPTION_KEY not found" | Verifica que esté en `.env.local` |
| "Token decryption failed" | ENCRYPTION_KEY debe ser el mismo usado para encriptar |
| "Heartbeats not counting" | Verifica que pestaña de anuncio esté abierta |
| "Archivos no se suben" | Verifica que `/archivos` exista con permisos |
| "Admin panel no carga" | Limpia cookies y re-login |

---

## 📝 Contribuciones y Desarrollo

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para:
- Cómo contribuir al proyecto
- Estándares de código
- Proceso de pull requests
- Guía de desarrollo local

---

## 📄 Licencia

MIT License - Libre para usar, modificar y distribuir

---

## 👨‍💻 Autor

**Desarrollado por:** [JFrangel](https://github.com/JFrangel)

**Repositorio:** [github.com/JFrangel/adsYT](https://github.com/JFrangel/adsYT)

**Última actualización:** Febrero 2026

---

## ⭐ Quick Start

```bash
# Clonar
git clone https://github.com/JFrangel/adsYT.git
cd "volver al peak"

# Instalar
npm install

# Configurar
cp .env.example .env.local
# Editar .env.local con tus valores

# Ejecutar
npm run dev

# Visitar
# http://localhost:3000
```

**¡Listo para conquistar el mundo de Free Fire!** 🔥🚀
