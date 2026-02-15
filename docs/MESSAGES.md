# Sistema Centralizado de Mensajes

## 📊 Resumen

El sistema tiene **82 mensajes** organizados en **7 categorías**:

| Categoría | Cantidad | Descripción |
|-----------|----------|-------------|
| **Autenticación** | 8 | Login, logout, tokens, permisos |
| **Archivos** | 12 | Upload, download, delete, fetch |
| **Links/Monetización** | 18 | CRUD de links, clicks, redirecciones |
| **Checkpoints** | 10 | Guardado/carga de estados en GitHub |
| **GitHub/Encriptación** | 8 | API GitHub, tokens encriptados |
| **Sistema** | 12 | Config, filesystem, errores generales |
| **Service Worker** | 4 | Instalación y registro de SW |
| **UI/Estado** | 10 | Estados de carga y procesamiento |
| **TOTAL** | **82** | |

## 🚀 Uso Rápido

### Importar mensajes

```typescript
import MESSAGES from '@/lib/messages';
import { formatMessage, showAlert, showConfirm, logger } from '@/lib/messages';
```

### Ejemplos básicos

```typescript
// Mostrar alert con formato
showAlert(MESSAGES.FILE.UPLOAD_SUCCESS, 'success');
// ✅ Archivo subido correctamente

showAlert(MESSAGES.FILE.UPLOAD_ERROR, 'error');
// ❌ Error al subir archivo

// Confirmar acción
if (showConfirm(MESSAGES.FILE.DELETE_CONFIRM)) {
  // Eliminar archivo
}

// Mensajes con parámetros
const msg = formatMessage(MESSAGES.LINK.CLICK_TRACKED, {
  linkName: 'Monetag',
  clicks: 150
});
console.log(msg);
// "Click registrado para Monetag: 150 clicks totales"
```

### Logger categorizado

```typescript
// Logs con categorías automáticas
logger.auth.log('Usuario autenticado');
// [AUTH] Usuario autenticado

logger.file.error('Upload falló', error);
// [FILE] Upload falló {error details}

logger.checkpoint.log('Checkpoint guardado');
// [CHECKPOINT] Checkpoint guardado
```

## 📝 Mensajes por Categoría

### Autenticación (8)
```typescript
MESSAGES.AUTH.CHECK_ERROR
MESSAGES.AUTH.LOGIN_SUCCESS
MESSAGES.AUTH.LOGIN_ERROR
MESSAGES.AUTH.LOGOUT_SUCCESS
MESSAGES.AUTH.LOGOUT_ERROR
MESSAGES.AUTH.UNAUTHORIZED
MESSAGES.AUTH.TOKEN_EXPIRED
MESSAGES.AUTH.TOKEN_INVALID
```

### Archivos (12)
```typescript
MESSAGES.FILE.UPLOAD_SUCCESS
MESSAGES.FILE.UPLOAD_ERROR
MESSAGES.FILE.UPLOAD_PROGRESS
MESSAGES.FILE.DELETE_SUCCESS
MESSAGES.FILE.DELETE_ERROR
MESSAGES.FILE.DELETE_CONFIRM         // Con {filename}
MESSAGES.FILE.DOWNLOAD_ERROR
MESSAGES.FILE.FETCH_ERROR
MESSAGES.FILE.NOT_FOUND
MESSAGES.FILE.SECURITY_VIOLATION
MESSAGES.FILE.NO_FILES
MESSAGES.FILE.LOADING_FILES
```

### Links/Monetización (18)
```typescript
MESSAGES.LINK.ADD_SUCCESS
MESSAGES.LINK.ADD_ERROR
MESSAGES.LINK.ADD_PROMPT_NAME
MESSAGES.LINK.ADD_PROMPT_URL
MESSAGES.LINK.EDIT_SUCCESS
MESSAGES.LINK.EDIT_ERROR
MESSAGES.LINK.EDIT_PROMPT_NAME
MESSAGES.LINK.EDIT_PROMPT_URL
MESSAGES.LINK.DELETE_SUCCESS
MESSAGES.LINK.DELETE_ERROR
MESSAGES.LINK.DELETE_CONFIRM         // Con {linkName}
MESSAGES.LINK.UPDATE_ERROR
MESSAGES.LINK.FETCH_ERROR
MESSAGES.LINK.MODE_UPDATE_ERROR
MESSAGES.LINK.TOGGLE_ERROR
MESSAGES.LINK.NO_ENABLED_LINKS
MESSAGES.LINK.REDIRECT_ERROR
MESSAGES.LINK.CLICK_TRACKED          // Con {linkName} y {clicks}
```

### Checkpoints (10)
```typescript
MESSAGES.CHECKPOINT.SAVE_SUCCESS     // Con {monetag} y {adsterra}
MESSAGES.CHECKPOINT.SAVE_ERROR       // Con {error}
MESSAGES.CHECKPOINT.SAVE_CONFIRM
MESSAGES.CHECKPOINT.SAVING
MESSAGES.CHECKPOINT.MANUAL_REQUESTED
MESSAGES.CHECKPOINT.AUTO_SAVE        // Con {interval}
MESSAGES.CHECKPOINT.SAVED_TO_GITHUB
MESSAGES.CHECKPOINT.LOADED_FROM_GITHUB  // Con {data}
MESSAGES.CHECKPOINT.LOAD_ERROR
MESSAGES.CHECKPOINT.LOAD_FRESH_START
```

### GitHub/Encriptación (8)
```typescript
MESSAGES.GITHUB.TOKEN_NOT_CONFIGURED
MESSAGES.GITHUB.TOKEN_DECRYPT_ERROR
MESSAGES.GITHUB.TOKEN_INVALID_ENCRYPTED
MESSAGES.GITHUB.TOKEN_NOT_FOUND
MESSAGES.GITHUB.API_ERROR
MESSAGES.GITHUB.CHECKPOINT_SAVED     // Con {data}
MESSAGES.GITHUB.CHECKPOINT_SAVE_FAILED
MESSAGES.GITHUB.ENCRYPTION_ERROR
```

### Sistema (12)
```typescript
MESSAGES.SYSTEM.CONFIG_DIR_ERROR
MESSAGES.SYSTEM.CONFIG_WRITE_ERROR
MESSAGES.SYSTEM.CONFIG_READ_ERROR
MESSAGES.SYSTEM.CONFIG_SAVE_ERROR
MESSAGES.SYSTEM.CONFIG_SAVE_WARN
MESSAGES.SYSTEM.READONLY_FILESYSTEM
MESSAGES.SYSTEM.FALLBACK_URL_USED    // Con {url}
MESSAGES.SYSTEM.CLICK_UPDATE_WARN
MESSAGES.SYSTEM.STREAM_ERROR
MESSAGES.SYSTEM.HEARTBEAT_ERROR
MESSAGES.SYSTEM.GENERAL_ERROR
MESSAGES.SYSTEM.SUCCESS
```

### Service Worker (4)
```typescript
MESSAGES.SW.INSTALL_SUCCESS
MESSAGES.SW.ACTIVATE_SUCCESS
MESSAGES.SW.REGISTER_SUCCESS
MESSAGES.SW.REGISTER_FAILED
```

### UI/Estado (10)
```typescript
MESSAGES.UI.LOADING
MESSAGES.UI.PROCESSING
MESSAGES.UI.SAVING
MESSAGES.UI.UPLOADING
MESSAGES.UI.DELETING
MESSAGES.UI.WAITING
MESSAGES.UI.READY
MESSAGES.UI.SUCCESS
MESSAGES.UI.ERROR
MESSAGES.UI.COMPLETE
```

## 🔧 Ejemplos Avanzados

### En componentes React

```tsx
import MESSAGES, { showAlert, showConfirm } from '@/lib/messages';

function FileUpload() {
  const handleUpload = async (file) => {
    try {
      await uploadFile(file);
      showAlert(MESSAGES.FILE.UPLOAD_SUCCESS, 'success');
    } catch (error) {
      showAlert(MESSAGES.FILE.UPLOAD_ERROR, 'error');
    }
  };
  
  return <button onClick={handleUpload}>Subir</button>;
}
```

### En APIs con parámetros

```typescript
import { formatMessage, logger } from '@/lib/messages';
import MESSAGES from '@/lib/messages';

export default async function handler(req, res) {
  try {
    const clicks = incrementClicks(linkId);
    const msg = formatMessage(MESSAGES.LINK.CLICK_TRACKED, {
      linkName: 'Monetag',
      clicks
    });
    logger.link.log(msg);
    
    res.json({ success: true });
  } catch (error) {
    logger.link.error(MESSAGES.LINK.UPDATE_ERROR, error);
    res.status(500).json({ error: MESSAGES.LINK.UPDATE_ERROR });
  }
}
```

### Confirmaciones con parámetros

```typescript
import { formatMessage, showConfirm } from '@/lib/messages';
import MESSAGES from '@/lib/messages';

const deleteLink = (linkName: string) => {
  const confirmMsg = formatMessage(MESSAGES.LINK.DELETE_CONFIRM, { linkName });
  
  if (showConfirm(confirmMsg)) {
    // Eliminar link
  }
};
```

## 🌍 Preparado para i18n

El sistema está diseñado para facilitar internacionalización:

```typescript
// Futuro: messages.es.ts, messages.en.ts, messages.pt.ts
const locale = 'es'; // o 'en', 'pt'
const MESSAGES = require(`@/lib/messages.${locale}`).default;
```

## ✅ Ventajas

- ✅ **Centralizado**: Todos los mensajes en un solo lugar
- ✅ **Tipado**: TypeScript autocomplete y type-safety
- ✅ **Consistente**: Formato uniforme en toda la app
- ✅ **Mantenible**: Fácil actualizar todos los mensajes
- ✅ **i18n Ready**: Preparado para múltiples idiomas
- ✅ **Categorizado**: Logger con prefijos automáticos
- ✅ **Documentado**: 82 mensajes catalogados

## 📦 Migración

Para migrar código existente:

**Antes:**
```typescript
alert('Archivo subido correctamente');
console.log('Click tracked for Monetag: 150 total clicks');
```

**Después:**
```typescript
import { showAlert, formatMessage } from '@/lib/messages';
import MESSAGES from '@/lib/messages';

showAlert(MESSAGES.FILE.UPLOAD_SUCCESS, 'success');
logger.link.log(formatMessage(MESSAGES.LINK.CLICK_TRACKED, {
  linkName: 'Monetag',
  clicks: 150
}));
```

## 🔄 Actualización continua

Para agregar nuevos mensajes:

1. Edita `lib/messages.ts`
2. Agrega mensaje a la categoría apropiada
3. Actualiza `MESSAGES_SUMMARY.TOTAL`
4. Documenta en este archivo
