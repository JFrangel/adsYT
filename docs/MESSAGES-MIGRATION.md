# Ejemplo de Uso del Sistema de Mensajes

## Admin Panel - Antes vs Después

### ANTES (código antiguo)

```tsx
// pages/admin/index.tsx
const addNewLink = async () => {
  const name = prompt('Nombre del link (ej: Monetag, AdSterra):');
  if (!name) return;
  
  const url = prompt('URL del link:');
  if (!url) return;
  
  try {
    const response = await axios.put('/api/admin/links-config', { 
      addLink: { name, url } 
    });
    setLinks(response.data.config.links);
    alert('Link agregado correctamente');
  } catch (error) {
    console.error('Error adding link:', error);
    alert('Error al agregar link');
  }
};

const deleteLink = async (linkId: string, linkName: string) => {
  if (!confirm(\`¿Eliminar el link "\${linkName}"? Esta acción no se puede deshacer.\`)) return;
  
  try {
    const response = await axios.put('/api/admin/links-config', { 
      deleteLink: linkId 
    });
    setLinks(response.data.config.links);
    alert('Link eliminado correctamente');
  } catch (error) {
    console.error('Error deleting link:', error);
    alert('Error al eliminar link');
  }
};

const saveCheckpoint = async () => {
  if (!confirm('¿Guardar checkpoint de clicks actual a GitHub?')) return;
  
  setSavingCheckpoint(true);
  try {
    const response = await axios.post('/api/admin/save-checkpoint');
    alert(\`✅ Checkpoint guardado: Monetag \${response.data.clicks.monetag} | AdSterra \${response.data.clicks.adsterra}\`);
    await fetchLinks();
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message;
    alert(\`❌ Error al guardar checkpoint: \${errorMsg}\\n\\nVerifica que GITHUB_TOKEN esté configurado.\`);
    console.error('Error saving checkpoint:', error);
  } finally {
    setSavingCheckpoint(false);
  }
};
```

### DESPUÉS (con sistema de mensajes)

```tsx
// pages/admin/index.tsx
import MESSAGES, { showAlert, showConfirm, formatMessage, logger } from '@/lib/messages';

const addNewLink = async () => {
  const name = prompt(MESSAGES.LINK.ADD_PROMPT_NAME);
  if (!name) return;
  
  const url = prompt(MESSAGES.LINK.ADD_PROMPT_URL);
  if (!url) return;
  
  try {
    const response = await axios.put('/api/admin/links-config', { 
      addLink: { name, url } 
    });
    setLinks(response.data.config.links);
    showAlert(MESSAGES.LINK.ADD_SUCCESS, 'success');
  } catch (error) {
    logger.link.error(MESSAGES.LINK.ADD_ERROR, error);
    showAlert(MESSAGES.LINK.ADD_ERROR, 'error');
  }
};

const deleteLink = async (linkId: string, linkName: string) => {
  const confirmMsg = formatMessage(MESSAGES.LINK.DELETE_CONFIRM, { linkName });
  if (!showConfirm(confirmMsg)) return;
  
  try {
    const response = await axios.put('/api/admin/links-config', { 
      deleteLink: linkId 
    });
    setLinks(response.data.config.links);
    showAlert(MESSAGES.LINK.DELETE_SUCCESS, 'success');
  } catch (error) {
    logger.link.error(MESSAGES.LINK.DELETE_ERROR, error);
    showAlert(MESSAGES.LINK.DELETE_ERROR, 'error');
  }
};

const saveCheckpoint = async () => {
  if (!showConfirm(MESSAGES.CHECKPOINT.SAVE_CONFIRM)) return;
  
  setSavingCheckpoint(true);
  try {
    const response = await axios.post('/api/admin/save-checkpoint');
    const msg = formatMessage(MESSAGES.CHECKPOINT.SAVE_SUCCESS, {
      monetag: response.data.clicks.monetag,
      adsterra: response.data.clicks.adsterra
    });
    showAlert(msg, 'success');
    await fetchLinks();
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message;
    const msg = formatMessage(MESSAGES.CHECKPOINT.SAVE_ERROR, { error: errorMsg });
    showAlert(msg, 'error');
    logger.checkpoint.error(MESSAGES.CHECKPOINT.SAVE_ERROR, error);
  } finally {
    setSavingCheckpoint(false);
  }
};
```

## API Endpoint - Antes vs Después

### ANTES

```typescript
// pages/api/get-redirect-link.ts
export default async function handler(req, res) {
  try {
    const currentClicks = await incrementClicks(selectedLink.id);
    console.log(\`Click tracked for \${selectedLink.name}: \${currentClicks} total clicks\`);
    
    return res.status(200).json({
      url: selectedLink.url,
      linkId: selectedLink.id,
      linkName: selectedLink.name,
    });
  } catch (error) {
    console.error('Error getting redirect link:', error);
    return res.status(500).json({ error: 'Error' });
  }
}
```

### DESPUÉS

```typescript
// pages/api/get-redirect-link.ts
import MESSAGES, { formatMessage, logger } from '@/lib/messages';

export default async function handler(req, res) {
  try {
    const currentClicks = await incrementClicks(selectedLink.id);
    const msg = formatMessage(MESSAGES.LINK.CLICK_TRACKED, {
      linkName: selectedLink.name,
      clicks: currentClicks
    });
    logger.link.log(msg);
    
    return res.status(200).json({
      url: selectedLink.url,
      linkId: selectedLink.id,
      linkName: selectedLink.name,
    });
  } catch (error) {
    logger.link.error(MESSAGES.LINK.REDIRECT_ERROR, error);
    return res.status(500).json({ error: MESSAGES.LINK.REDIRECT_ERROR });
  }
}
```

## Ventajas del cambio

### ✅ Antes
- ❌ Mensajes hardcodeados en todo el código
- ❌ Inconsistencias de formato
- ❌ Difícil buscar y actualizar
- ❌ Sin logs categorizados
- ❌ Difícil traducir

### ✅ Después
- ✅ Mensajes centralizados
- ✅ Formato consistente
- ✅ Fácil mantenimiento
- ✅ Logs con prefijos [LINK], [AUTH], etc
- ✅ Preparado para i18n
- ✅ Autocompletado con TypeScript
- ✅ Type-safe

## Resumen de cambios

| Concepto | Antes | Después |
|----------|-------|---------|
| **Alerts** | `alert('texto')` | `showAlert(MESSAGES.X, 'tipo')` |
| **Confirms** | `confirm('texto')` | `showConfirm(MESSAGES.X)` |
| **Console logs** | `console.log('texto')` | `logger.categoria.log(MESSAGES.X)` |
| **Parámetros** | Template strings | `formatMessage(msg, params)` |
| **Total mensajes** | 92 dispersos | 82 centralizados |
