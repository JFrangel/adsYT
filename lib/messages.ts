/**
 * Sistema centralizado de mensajes de la aplicación
 * Todos los textos y mensajes en un solo lugar para facilitar:
 * - Internacionalización (i18n)
 * - Consistencia de mensajes
 * - Mantenimiento y actualización
 * - Auditoría de comunicación con usuarios
 */

// ============================================
// MENSAJES DE AUTENTICACIÓN (8 mensajes)
// ============================================
export const AUTH_MESSAGES = {
  CHECK_ERROR: 'Error al verificar autenticación',
  LOGIN_SUCCESS: 'Login exitoso',
  LOGIN_ERROR: 'Error al iniciar sesión',
  LOGOUT_SUCCESS: 'Sesión cerrada',
  LOGOUT_ERROR: 'Error al cerrar sesión',
  UNAUTHORIZED: 'No autorizado. Inicia sesión.',
  TOKEN_EXPIRED: 'Sesión expirada. Inicia sesión nuevamente.',
  TOKEN_INVALID: 'Token inválido. Inicia sesión.',
} as const;

// ============================================
// MENSAJES DE ARCHIVOS (12 mensajes)
// ============================================
export const FILE_MESSAGES = {
  UPLOAD_SUCCESS: 'Archivo subido correctamente',
  UPLOAD_ERROR: 'Error al subir archivo',
  UPLOAD_PROGRESS: 'Subiendo archivo...',
  DELETE_SUCCESS: 'Archivo eliminado',
  DELETE_ERROR: 'Error al eliminar archivo',
  DELETE_CONFIRM: '¿Eliminar {filename}?',
  DOWNLOAD_ERROR: 'Error al descargar el archivo. Intenta de nuevo.',
  FETCH_ERROR: 'Error al obtener archivos',
  NOT_FOUND: 'Archivo no encontrado',
  SECURITY_VIOLATION: 'Violación de seguridad: acceso denegado',
  NO_FILES: 'No hay archivos subidos',
  LOADING_FILES: 'Cargando archivos...',
} as const;

// ============================================
// MENSAJES DE LINKS/MONETIZACIÓN (18 mensajes)
// ============================================
export const LINK_MESSAGES = {
  ADD_SUCCESS: 'Link agregado correctamente',
  ADD_ERROR: 'Error al agregar link',
  ADD_PROMPT_NAME: 'Nombre del link (ej: Monetag, AdSterra):',
  ADD_PROMPT_URL: 'URL del link:',
  EDIT_SUCCESS: 'Link actualizado correctamente',
  EDIT_ERROR: 'Error al editar link',
  EDIT_PROMPT_NAME: 'Nuevo nombre:',
  EDIT_PROMPT_URL: 'Nuevo URL:',
  DELETE_SUCCESS: 'Link eliminado correctamente',
  DELETE_ERROR: 'Error al eliminar link',
  DELETE_CONFIRM: '¿Eliminar el link "{linkName}"? Esta acción no se puede deshacer.',
  UPDATE_ERROR: 'Error al actualizar configuración de links',
  FETCH_ERROR: 'Error al obtener configuración de links',
  MODE_UPDATE_ERROR: 'Error al actualizar modo de operación',
  TOGGLE_ERROR: 'Error al cambiar estado del link',
  NO_ENABLED_LINKS: 'No hay links habilitados',
  REDIRECT_ERROR: 'Error al obtener el enlace. Intenta de nuevo.',
  CLICK_TRACKED: 'Click registrado para {linkName}: {clicks} clicks totales',
} as const;

// ============================================
// MENSAJES DE CHECKPOINTS (10 mensajes)
// ============================================
export const CHECKPOINT_MESSAGES = {
  SAVE_SUCCESS: '✅ Checkpoint guardado: Monetag {monetag} | AdSterra {adsterra}',
  SAVE_ERROR: '❌ Error al guardar checkpoint: {error}\n\nVerifica que GITHUB_TOKEN esté configurado en las variables de entorno.',
  SAVE_CONFIRM: '¿Guardar checkpoint de clicks actual a GitHub? Se guardará un commit con el estado actual.',
  SAVING: 'Guardando checkpoint...',
  MANUAL_REQUESTED: '🔄 Manual checkpoint requested...',
  AUTO_SAVE: '🎯 {interval} clicks reached, saving checkpoint...',
  SAVED_TO_GITHUB: '✅ Checkpoint saved to GitHub',
  LOADED_FROM_GITHUB: '📍 Checkpoint loaded from GitHub: {data}',
  LOAD_ERROR: '❌ Error loading checkpoint from GitHub',
  LOAD_FRESH_START: 'Could not load checkpoint, starting fresh',
} as const;

// ============================================
// MENSAJES DE GITHUB/ENCRIPTACIÓN (8 mensajes)
// ============================================
export const GITHUB_MESSAGES = {
  TOKEN_NOT_CONFIGURED: 'GITHUB_TOKEN not configured, skipping checkpoint save',
  TOKEN_DECRYPT_ERROR: 'Failed to decrypt GitHub token',
  TOKEN_INVALID_ENCRYPTED: 'Invalid GITHUB_TOKEN_ENCRYPTED. Make sure ENCRYPTION_KEY is set correctly.',
  TOKEN_NOT_FOUND: 'GitHub token not found. Set GITHUB_TOKEN or GITHUB_TOKEN_ENCRYPTED in .env',
  API_ERROR: 'Error en API de GitHub',
  CHECKPOINT_SAVED: '✅ Checkpoint saved to GitHub: {data}',
  CHECKPOINT_SAVE_FAILED: '❌ Failed to save checkpoint',
  ENCRYPTION_ERROR: 'Decryption error',
} as const;

// ============================================
// MENSAJES DE SISTEMA/CONFIGURACIÓN (12 mensajes)
// ============================================
export const SYSTEM_MESSAGES = {
  CONFIG_DIR_ERROR: 'Could not create config directory',
  CONFIG_WRITE_ERROR: 'Could not write default config (read-only filesystem)',
  CONFIG_READ_ERROR: 'Error reading config, using defaults',
  CONFIG_SAVE_ERROR: 'Could not save config (read-only filesystem)',
  CONFIG_SAVE_WARN: 'Config updated but not persisted (read-only filesystem)',
  READONLY_FILESYSTEM: 'Could not save to file, using in-memory cache only',
  FALLBACK_URL_USED: 'Using fallback URL: {url}',
  CLICK_UPDATE_WARN: 'Click count updated but not persisted (read-only filesystem)',
  STREAM_ERROR: 'Stream error',
  HEARTBEAT_ERROR: 'Heartbeat error',
  GENERAL_ERROR: 'Ha ocurrido un error',
  SUCCESS: 'Operación exitosa',
} as const;

// ============================================
// MENSAJES DE SERVICE WORKER (4 mensajes)
// ============================================
export const SW_MESSAGES = {
  INSTALL_SUCCESS: 'Monetag Service Worker installed',
  ACTIVATE_SUCCESS: 'Monetag Service Worker activated',
  REGISTER_SUCCESS: 'Monetag Service Worker registration successful',
  REGISTER_FAILED: 'Monetag Service Worker registration failed',
} as const;

// ============================================
// MENSAJES DE UI/ESTADO (10 mensajes)
// ============================================
export const UI_MESSAGES = {
  LOADING: 'Cargando...',
  PROCESSING: 'Procesando...',
  SAVING: 'Guardando...',
  UPLOADING: 'Subiendo...',
  DELETING: 'Eliminando...',
  WAITING: 'Espera...',
  READY: 'Listo',
  SUCCESS: 'Éxito',
  ERROR: 'Error',
  COMPLETE: 'Completado',
} as const;

// ============================================
// RESUMEN DE MENSAJES
// ============================================
export const MESSAGES_SUMMARY = {
  AUTH: 8,
  FILES: 12,
  LINKS: 18,
  CHECKPOINTS: 10,
  GITHUB: 8,
  SYSTEM: 12,
  SERVICE_WORKER: 4,
  UI: 10,
  TOTAL: 82,
} as const;

// ============================================
// UTILIDADES
// ============================================

/**
 * Reemplaza placeholders en mensajes
 * Ejemplo: formatMessage("Hola {name}", { name: "Juan" }) => "Hola Juan"
 */
export function formatMessage(message: string, params: Record<string, any> = {}): string {
  return message.replace(/{(\w+)}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

/**
 * Logger centralizado con categorías
 */
export const logger = {
  auth: {
    log: (msg: string) => console.log(`[AUTH] ${msg}`),
    warn: (msg: string) => console.warn(`[AUTH] ${msg}`),
    error: (msg: string, err?: any) => console.error(`[AUTH] ${msg}`, err),
  },
  file: {
    log: (msg: string) => console.log(`[FILE] ${msg}`),
    warn: (msg: string) => console.warn(`[FILE] ${msg}`),
    error: (msg: string, err?: any) => console.error(`[FILE] ${msg}`, err),
  },
  link: {
    log: (msg: string) => console.log(`[LINK] ${msg}`),
    warn: (msg: string) => console.warn(`[LINK] ${msg}`),
    error: (msg: string, err?: any) => console.error(`[LINK] ${msg}`, err),
  },
  checkpoint: {
    log: (msg: string) => console.log(`[CHECKPOINT] ${msg}`),
    warn: (msg: string) => console.warn(`[CHECKPOINT] ${msg}`),
    error: (msg: string, err?: any) => console.error(`[CHECKPOINT] ${msg}`, err),
  },
  github: {
    log: (msg: string) => console.log(`[GITHUB] ${msg}`),
    warn: (msg: string) => console.warn(`[GITHUB] ${msg}`),
    error: (msg: string, err?: any) => console.error(`[GITHUB] ${msg}`, err),
  },
  system: {
    log: (msg: string) => console.log(`[SYSTEM] ${msg}`),
    warn: (msg: string) => console.warn(`[SYSTEM] ${msg}`),
    error: (msg: string, err?: any) => console.error(`[SYSTEM] ${msg}`, err),
  },
};

/**
 * Función helper para mostrar alerts con formato consistente
 */
export function showAlert(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };
  
  alert(`${icons[type]} ${message}`);
}

/**
 * Función helper para confirmaciones
 */
export function showConfirm(message: string): boolean {
  return confirm(message);
}

// ============================================
// EXPORT ALL
// ============================================
export default {
  AUTH: AUTH_MESSAGES,
  FILE: FILE_MESSAGES,
  LINK: LINK_MESSAGES,
  CHECKPOINT: CHECKPOINT_MESSAGES,
  GITHUB: GITHUB_MESSAGES,
  SYSTEM: SYSTEM_MESSAGES,
  SW: SW_MESSAGES,
  UI: UI_MESSAGES,
  SUMMARY: MESSAGES_SUMMARY,
  format: formatMessage,
  logger,
  alert: showAlert,
  confirm: showConfirm,
};
