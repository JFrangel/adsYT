# Configuración de Checkpoints en GitHub

El sistema guarda automáticamente checkpoints cada 1000 clicks en el repositorio de GitHub para persistencia a largo plazo.

## Cómo funciona

1. **Memoria (rápido)**: Todos los clicks se almacenan en memoria del servidor
2. **Checkpoint automático**: Cada 1000 clicks, se guarda automáticamente a GitHub
3. **Recuperación**: Al reiniciar el servidor, carga el último checkpoint y continúa desde ahí

## Configuración

### 1. Crear GitHub Personal Access Token

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click en "Generate new token (classic)"
3. Configuración requerida:
   - **Note**: `adsYT Checkpoints`
   - **Expiration**: No expiration (o el tiempo que prefieras)
   - **Scopes**: Marca solo `repo` (Full control of private repositories)
4. Click "Generate token"
5. **IMPORTANTE**: Copia el token inmediatamente (solo se muestra una vez)

### 2. Configurar Variables de Entorno

#### En Desarrollo Local:

Crea un archivo `.env.local`:

```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=JFrangel
GITHUB_REPO=adsYT
```

#### En Netlify (Producción):

1. Ve a tu sitio en Netlify → Site settings → Environment variables
2. Agrega las siguientes variables:
   - `GITHUB_TOKEN`: Tu personal access token
   - `GITHUB_OWNER`: `JFrangel`
   - `GITHUB_REPO`: `adsYT`
3. Despliega de nuevo el sitio

## Funcionamiento del Sistema

### Sin GitHub Token configurado:
- ✅ Los clicks funcionan normalmente en memoria
- ⚠️ Se pierden al reiniciar el servidor
- 📝 Mensaje en logs: "GITHUB_TOKEN not configured, skipping checkpoint save"

### Con GitHub Token configurado:
- ✅ Clicks en memoria (rápido)
- ✅ Checkpoint cada 1000 clicks → commit automático a GitHub
- ✅ Al reiniciar: carga último checkpoint y continúa
- 📍 Mantiene historial completo en Git

## Archivos del Sistema

- **`data/click-checkpoints.json`**: Archivo de checkpoints en el repo
- **`lib/click-cache.ts`**: Caché en memoria + lógica de checkpoints
- **`lib/github-storage.ts`**: API de GitHub para guardar/cargar

## Monitoreo

Los logs del servidor mostrarán:

```
📍 Checkpoint loaded. Starting from: { monetag: 2000, adsterra: 1500 }
Click tracked for Monetag: 2001 total clicks
🎯 1000 clicks reached, saving checkpoint...
✅ Checkpoint saved to GitHub
```

## Ventajas del Sistema

- ⚡ **Performance**: Solo hace llamadas a GitHub cada 1000 clicks
- 💾 **Persistencia**: No pierde mucho progreso en reinicios (máximo 999 clicks)
- 📊 **Historial**: Cada checkpoint es un commit, puedes ver la evolución
- 🔒 **Sin base de datos**: No necesita servicios externos adicionales
- 💰 **Gratis**: GitHub tiene límite de 5000 requests/hora (más que suficiente)

## Límites y Consideraciones

- GitHub API: 5000 requests/hora con token
- Con 1000 clicks por checkpoint = hasta 5 millones de clicks/hora teóricos
- Latencia del checkpoint no afecta al usuario (se hace en background)
- El archivo checkpoint se actualiza atómicamente (no hay corrupción)
