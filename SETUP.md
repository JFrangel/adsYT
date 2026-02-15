# 🚀 Guía Rápida de Configuración

## Paso 1: Configurar GitHub

### 1.1 Crear Repositorio para Archivos
1. Ve a GitHub y crea un nuevo repositorio (puede ser público o privado)
2. Nómbralo como quieras (ej: `free-fire-files`)
3. Crea un archivo `manifest.json` en la raíz con este contenido:
```json
{
  "files": []
}
```

### 1.2 Generar Token de GitHub
1. Ve a GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic) → Generate new token
3. Selecciona los permisos:
   - ✅ `repo` (todos los sub-permisos)
4. Genera el token y **cópialo** (solo se muestra una vez)

## Paso 2: Configurar Variables de Entorno

Edita el archivo `.env.local` con tus valores reales:

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx  # Tu token de GitHub
GITHUB_OWNER=tu_usuario                # Tu nombre de usuario de GitHub
GITHUB_REPO=free-fire-files            # Nombre del repo que creaste
GITHUB_BRANCH=main                     # Branch (normalmente 'main')

ADMIN_USER=admin                       # Usuario admin (cámbialo)
ADMIN_PASS=MiPassword123!              # Contraseña segura

JWT_SECRET=una_clave_muy_larga_y_aleatoria_aqui_123456789
```

## Paso 3: Probar Localmente

```bash
npm run dev
```

Abre http://localhost:3000

### Probar Flujo Público
1. Ve a http://localhost:3000
2. Click "Desbloquear" y espera 8 segundos
3. Click "Continuar a Paso 2"
4. Click "Ver Anuncio" y permanece en la página 7 segundos
5. Automáticamente se desbloqueará "Continuar"
6. Click "Continuar a Descargas"

### Probar Panel Admin
1. Ve a http://localhost:3000/admin/login
2. Inicia sesión con las credenciales de `.env.local`
3. Sube un archivo de prueba
4. Verifica que aparece en la lista
5. Ve a Entry 3 y verifica que el archivo está disponible

## Paso 4: Desplegar en Netlify

### 4.1 Preparar Repositorio
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

### 4.2 Configurar Netlify
1. Ve a https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Conecta tu repositorio de GitHub
4. Configuración de build:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - Framework: Next.js (se detecta automáticamente)

### 4.3 Configurar Variables de Entorno en Netlify
1. Site configuration → Environment variables
2. Añade todas las variables del `.env.local`:
   ```
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
   GITHUB_OWNER=tu_usuario
   GITHUB_REPO=free-fire-files
   GITHUB_BRANCH=main
   ADMIN_USER=admin
   ADMIN_PASS=MiPassword123!
   JWT_SECRET=una_clave_muy_larga_y_aleatoria
   NODE_ENV=production
   ```

### 4.4 Deploy
1. Click "Deploy site"
2. Espera a que termine el build (2-3 minutos)
3. Tu sitio estará en `https://tu-sitio.netlify.app`

## Paso 5: Verificar Producción

1. Visita tu sitio en Netlify
2. Prueba el flujo completo de las 3 entradas
3. Inicia sesión en `/admin/login`
4. Sube un archivo de prueba
5. Verifica la descarga desde Entry 3

## 🔧 Troubleshooting

### Error: "GITHUB_TOKEN no válido"
- Verifica que el token tenga permisos `repo`
- Asegúrate de que no haya espacios en el token
- Verifica que el token no haya expirado

### Error: "manifest.json not found"
- Ve al repo de GitHub y crea el archivo manualmente
- Contenido: `{"files": []}`
- Haz commit del archivo

### Error: "Unauthorized" en admin
- Verifica que `ADMIN_USER` y `ADMIN_PASS` estén configurados
- Limpia las cookies del navegador
- Verifica que `JWT_SECRET` esté configurado

### Heartbeats no funcionan
- Abre la consola del navegador (F12)
- Ve a la pestaña Network
- Busca llamadas a `/api/ad/heartbeat`
- Verifica que respondan con status 200

### Archivos no se suben
- Verifica el límite de 50MB por archivo
- Revisa los logs de Netlify (Deploy log)
- Verifica permisos del token de GitHub

## 📝 Notas Importantes

1. **Seguridad**: Cambia `ADMIN_USER` y `ADMIN_PASS` en producción
2. **JWT_SECRET**: Usa una cadena larga y aleatoria en producción
3. **Límite de GitHub**: Max 100MB por archivo con Contents API
4. **Rate limits**: GitHub tiene límite de 5000 requests/hora con autenticación
5. **Backups**: GitHub guarda el historial, puedes revertir cambios

## 🎯 Próximos Pasos

1. Personaliza los colores en `tailwind.config.js`
2. Añade tus enlaces de anuncios reales
3. Configura dominio personalizado en Netlify (opcional)
4. Añade analytics (Google Analytics, Vercel Analytics, etc.)
5. Implementa más funcionalidades del admin

## 📧 Soporte

Si tienes problemas:
1. Revisa los logs de Netlify
2. Revisa la consola del navegador
3. Verifica que todas las variables de entorno estén configuradas
4. Consulta el README principal para más detalles
