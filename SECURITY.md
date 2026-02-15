# 🔐 Política de Seguridad - Free Fire Portal

Documento que describe las prácticas de seguridad, vulnerabilidades y cómo reportarlas en Free Fire Portal.

---

## 🛡️ Sistemas de Seguridad Implementados

### 1. Encriptación AES-256-CBC

#### ¿Qué se encripta?

- Tokens de GitHub almacenados en `GITHUB_TOKEN_ENCRYPTED`
- Nunca expuestos en texto plano en variables de entorno

#### ¿Cómo funciona?

```
1. GENERACIÓN:
   └─ 32 bytes aleatorios generados con crypto.randomBytes(32)
   └─ Convertidos a base64 para almacenar en ENCRYPTION_KEY

2. ENCRIPTACIÓN:
   ├─ IV (Initialization Vector): 16 bytes aleatorios por encriptación
   ├─ Algoritmo: AES-256-CBC
   ├─ Clave: Derivada de ENCRYPTION_KEY vía SHA256
   └─ Formato: IV:encryptedData (separados por ':')

3. DESENCRIPTACIÓN (Runtime):
   ├─ Lee variable: GITHUB_TOKEN_ENCRYPTED
   ├─ Extrae IV y datos encriptados
   ├─ Desencripta usando ENCRYPTION_KEY
   └─ Token válido usado para GitHub API
```

#### Ventajas de Seguridad

✅ **Token nunca en texto plano** - Imposible extraerlo del `.env.local`
✅ **IV único por encriptación** - Mismo token produce diferente ciphertext
✅ **256 bits de seguridad** - Fuerte contra ataques de fuerza bruta
✅ **Autenticación server-side** - Validación adicional de token

---

### 2. JWT para Sesiones Admin

#### Autenticación Flow

```
LOGIN:
├─ POST /api/admin/auth { user, pass }
├─ Valida credenciales contra variables de entorno
├─ Genera JWT con payload: { userId, exp: +24h }
├─ Firma con JWT_SECRET (privado, nunca compartido)
└─ Setea en cookie httpOnly

PETICIONES PROTEGIDAS:
├─ Middleware verifica cookie
├─ Decodifica JWT con JWT_SECRET
├─ Valida firma del JWT
├─ Valida fecha de expiración
└─ Si todo OK: Ejecuta; Si falla: Redirige a login
```

#### Propiedades Seguras

✅ **httpOnly Cookie** - Inaccesible desde JavaScript (previene XSS)
✅ **SameSite=Strict** - Protección contra CSRF
✅ **Secure (en prod)** - Solo transmite por HTTPS
✅ **Expiration** - Sesión expira en 24 horas
✅ **Signed** - Imposible falsificar sin JWT_SECRET

---

### 3. Validaciones Server-Side

#### Timers No Manipulables

```typescript
// En /api/ad/heartbeat:
- Valida timestamps en server
- Verifica que la solicitud toma ~1 segundo (no instantánea)
- Si toma < 500ms: Rechaza (probablemente manipulado)
- Si toma > 2s: Podría ser legítimo pero se registra
- Máximo de heartbeats permitidos: 1 por segundo
```

#### Protección de Descarga

```typescript
// En /api/download:
- Normaliza rutas de archivos
- Verifica que no escape de /archivos/ (path traversal)
- Valida que archivo existe
- Verifica tamaño antes de servir
- Logging de todas las descargas
```

---

### 4. Protecciones Contra Ataques Comunes

| Ataque | Protección | Ubicación |
|--------|-----------|-----------|
| **SQL Injection** | No usa BD relacional | N/A |
| **XSS (Cross-Site Scripting)** | React auto-escaping + CSP headers | React rendering |
| **CSRF (Cross-Site Request Forgery)** | SameSite=Strict cookies | JWT middleware |
| **Session Hijacking** | httpOnly cookies + JWT signing | Cookie handling |
| **Token Leakage** | AES-256-CBC encryption | `lib/encryption.ts` |
| **Path Traversal** | Path normalization check | `pages/api/download.ts` |
| **Large Upload DoS** | 50MB file size limit | `pages/api/admin/files.ts` |
| **Brute Force** | Rate limiting (implementar) | Middleware |
| **Malware Upload** | File type validation | `pages/api/admin/files.ts` |

---

## 🔒 Variables de Entorno Sensibles

### Protección de Secretos

```env
# ⚠️ CRÍTICO - Nunca compartir o hacer push

ENCRYPTION_KEY=base64_encoded_32_bytes
├─ Usado para: Desencriptar GitHub token
├─ Generado por: crypto.randomBytes(32).toString('base64')
└─ Almacenado en: .env.local (git-ignored)

GITHUB_TOKEN_ENCRYPTED=iv:encrypted_data
├─ Usado para: API calls a GitHub
├─ Generado por: scripts/encrypt-env.js
└─ Formato: IV:encryptedToken

JWT_SECRET=long_random_string_no_spaces
├─ Usado para: Firmar y verificar JWTs
├─ Mínimo: 32 caracteres
└─ Debe ser: Único y fuerte

ADMIN_PASS=contraseña_segura
├─ Usado para: Autenticación admin
├─ Mínimo: 8 caracteres
└─ Recomendado: 12+ caracteres con mixtura
```

### Best Practices

✅ **HACER:**
- Usar `.env.local` para desarrollo local
- Nunca commitear `.env.local` a git
- Rotar ENCRYPTION_KEY cada 90 días
- Cambiar ADMIN_PASS regularmente
- Usar variables en Netlify UI (no hardcoded)

❌ **NO HACER:**
- Compartir `.env.local` por email/chat
- Poner tokens en código fuente
- Usar mismas credenciales en dev y prod
- Loguear valores sensibles
- Usar credenciales por defecto

---

## 📋 Reporte de Vulnerabilidades

### Proceso Responsable de Divulgación

Si descubres una vulnerabilidad de seguridad:

1. **NO la reportes públicamente** en GitHub Issues
2. **Contacta privadamente** al mantenedor
3. **Permite tiempo para patch** (max 90 días)
4. **Recibe crédito** en la divulgación

### Cómo Reportar

```
Email: [Será proporcionado por el mantenedor]

Incluye:
- Descripción de la vulnerabilidad
- Pasos para reproducir
- Impacto potencial (severity)
- Sugerencias de fix (si tienes)
- Tu información de contacto
```

### Severidad de Vulnerabilidades

| Nivel | Descripción | Ejemplo |
|-------|-------------|---------|
| **CRÍTICA** | Exposición inmediata de datos sensibles | Token en logs |
| **ALTA** | Acceso no autorizado a funciones | Bypass de autenticación |
| **MEDIA** | Impacto limitado en seguridad/privacidad | Información incompleta |
| **BAJA** | Riesgo mínimo | Typos en error messages |

---

## 🔍 Checklist de Seguridad

### Para Desarrolladores

Antes de hacer un commit:

```bash
# ✅ Verificar que no se commitearon secretos
git diff --cached | grep -i "token\|secret\|password\|key"

# ✅ Verificar .env.local no está versionado
git ls-files | grep ".env.local"
# Resultado: (vacío) ✅ o (listado) ❌

# ✅ Verificar formatos de encriptación
grep "GITHUB_TOKEN_ENCRYPTED" .env.local
# Debe incluir ':' separador

# ✅ Hacer lint y type-check
npm run lint
npm run type-check

# ✅ Verificar que tests pasan
npm test
```

### Para Productores (Deployment)

Antes de hacer deploy a producción:

```bash
# ✅ Verificar todas las variables están configuradas
[ -z "$ENCRYPTION_KEY" ] && echo "ERROR: ENCRYPTION_KEY missing" || echo "OK"
[ -z "$JWT_SECRET" ] && echo "ERROR: JWT_SECRET missing" || echo "OK"
[ -z "$ADMIN_PASS" ] && echo "ERROR: ADMIN_PASS missing" || echo "OK"

# ✅ Verificar certificados HTTPS válidos
# (Netlify lo maneja automáticamente)

# ✅ Verificar NODE_ENV=production
echo $NODE_ENV

# ✅ Ejecutar tests en producción
npm run test

# ✅ Verificar logs no exponen información sensible
grep -r "console.log(token\|password\|secret" src/
```

---

## 🚨 Incidentes de Seguridad

### Qué Hacer si Descubres Exposición

1. **Immediatamente:**
   - Revoke los tokens/credenciales expuestos
   - Contacta al mantenedor

2. **Dentro de 24 horas:**
   - Parar el servidor si es crítico
   - Generar nuevas credenciales

3. **Root Cause Analysis:**
   - Investigar cómo ocurrió
   - Documentar el incidente

4. **Preventivo:**
   - Implementar mejoras
   - Actualizar documentación

---

## 🛡️ Actualizaciones de Seguridad

### Versiones Parcheadas

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 2.0.0 | Feb 2026 | Encriptación AES-256-CBC, JWT, SVG icons |
| 1.5.0 | Ene 2026 | Path traversal protection |
| 1.0.0 | Dic 2025 | Release inicial |

### Cómo Mantenerse Actualizado

```bash
# Verificar vulnerabilidades conocidas
npm audit

# Actualizar dependencias
npm update

# Auditar permisos
npm audit fix

# Instalar versión específica
npm install package@^X.Y.Z
```

---

## 📚 Recursos de Seguridad

### Para Aprender Más

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Next.js Security Guide](https://nextjs.org/learn/foundations/from-javascript-to-react)
- [Crypto Module Documentation](https://nodejs.org/api/crypto.html)

### Herramientas de Seguridad

```bash
# Auditar dependencias
npm audit

# Escanear código
npm run lint

# Type checking
npm run type-check

# Testing
npm test
```

---

## 🔄 Política de Actualizaciones

### Dependencias

**Críticas (Seguridad):**
- Actualización inmediata
- Release patch (v1.0.1)
- Notificación a usuarios

**Importantes (Funcionalidad):**
- Actualización mensual
- Release minor (v1.1.0)
- Release notes en GitHub

**Menores:**
- Actualización trimestral
- Release patch o minor
- Changelog en repositorio

---

## ✅ Cumplimiento

### Estándares Seguidos

- ✅ OWASP Top 10
- ✅ Node.js Security Best Practices
- ✅ NIST Cybersecurity Framework
- ✅ Conventional Commits (para tracking)

### Auditorías

El proyecto se audita internamente:

- Cada release: Revisión de código
- Cada mes: Audit de dependencias
- Cada trimestre: Penetration testing (si es crítico)

---

## 📞 Contacto de Seguridad

**Reportar vulnerabilidades:**
```
Email: [Proporcionado por mantenedor]
PGP Key: [Si aplica]
```

**Seguimiento:**
```
GitHub Issues: https://github.com/JFrangel/adsYT/issues
Discussions: https://github.com/JFrangel/adsYT/discussions
```

---

## 📝 Changelog de Seguridad

### v2.0.0 - Feb 2026

✅ **Nuevas Medidas:**
- Encriptación AES-256-CBC para tokens
- JWT para sesiones admin
- Path traversal protection
- File size limits
- Heartbeat validation

✅ **Documentación:**
- SECURITY.md (este archivo)
- Encryption setup guide
- Best practices documentation

---

## ⚖️ Disclaimer

Este documento describe medidas de seguridad implementadas, pero NO garantiza:

- Protección 100% contra todos los ataques
- Disponibilidad constante del servicio
- Confidencialidad de datos si credenciales se comprometen

**Usuarios son responsables por:**
- Mantener ENCRYPTION_KEY segura
- Mantener credenciales admin confidenciales
- Usar HTTPS en producción
- Hacer backups regulares

---

## 🙏 Agradecimientos

Gracias a la comunidad de seguridad de código abierto por guías y mejores prácticas.

**Mantenido por:** [JFrangel](https://github.com/JFrangel)

**Última actualización:** Febrero 2026

---

**Si tienes preguntas sobre seguridad, contacta al mantenedor directamente.** 🔐
