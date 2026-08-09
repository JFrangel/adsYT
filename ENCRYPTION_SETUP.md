# Configuración de Encriptación de Token

## Instalación

La carpeta `/archivos` se ha creado como ubicación para guardar archivos descargados.

## Uso de Encriptación del Token

### 1. Generar una clave de encriptación segura

```bash
# Opción 1: Usar OpenSSL
openssl rand -base64 32

# Opción 2: En Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Encriptar tu token de GitHub

```bash
# Primero, genera tu token en https://github.com/settings/tokens
# Luego ejecuta:

node scripts/encrypt-env.js ghp_tu_token_aqui_muy_largo
```

Output:
```
✅ Token encriptado exitosamente

📋 Copia esta línea a tu archivo .env.local:

GITHUB_TOKEN_ENCRYPTED=abc123def456...

⚠️  Asegúrate de que ENCRYPTION_KEY esté configurada en tu .env.local
```

### 3. Configurar `.env.local`

```env
# Clave de encriptación (cambia a la generada en paso 1)
ENCRYPTION_KEY=tu-clave-de-32-caracteres-aqui

# Token encriptado (resultado del paso 2)
GITHUB_TOKEN_ENCRYPTED=abc123def456...

# Resto de configuración
GITHUB_OWNER=tu_usuario
GITHUB_REPO=tu_repo
GITHUB_BRANCH=main
```

## Cómo funciona

1. **lib/encryption.ts** - Módulo de encriptación/desencriptación con AES-256-CBC
2. **scripts/encrypt-env.js** - Script para encriptar el token antes de guardarlo
3. **lib/github.ts** - Automáticamente desencripta el token cuando se necesita

## Ventajas

✅ Token nunca se almacena en texto plano
✅ Cada clave encriptada incluye un IV (initialization vector) único
✅ Fácil de usar con CI/CD (solo pasa ENCRYPTION_KEY y GITHUB_TOKEN_ENCRYPTED)
✅ Compatible con Git - puedes hacer commit sin exponer el token

## Notas de Seguridad

- **ENCRYPTION_KEY**: Cambia esto a una clave fuerte en producción
- **NO** hagas commit de keys reales - usa variables de entorno en producción
- Guarda ENCRYPTION_KEY en un lugar seguro (gestor de secretos)
