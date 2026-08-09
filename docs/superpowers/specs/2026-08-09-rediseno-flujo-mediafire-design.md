# Spec: Rediseño visual + flujo simplificado + archivos vía MediaFire

**Fecha:** 2026-08-09
**Estado:** Aprobado por el usuario (diseño conversado y confirmado)

## Contexto y problema

1. **Error 400 al subir archivos en producción.** El panel admin subía binarios como
   `multipart/form-data` a una función serverless de Netlify que los reenviaba a GitHub
   en base64. Netlify limita el body de una función a ~6MB; los archivos del usuario
   pesan >25MB → la petición se rechaza en producción (en local no hay límite).
   Además, `pages/api/download.ts` proxeaba el binario por la misma función, por lo que
   las descargas grandes también fallarían.
2. **Flujo con fricción innecesaria.** El sitio obligaba a 3 pasos: timer 8s → ver
   anuncio 7s fuera de la página (heartbeats server-side) → descargas.
3. **Estética recargada.** Gradientes morados, glow doble, grid de fondo, emojis y
   animaciones llamativas. El usuario quiere algo minimalista, moderno y profesional.

## Decisión de almacenamiento (elimina el 400 de raíz)

Los archivos ya **no se suben a través del sitio**. El admin sube manualmente sus
archivos a **MediaFire** y en el panel solo **pega el enlace**. El sitio solo persiste
metadatos JSON pequeños en la rama `data` del repo GitHub (igual que hoy). No queda
ninguna ruta que mueva binarios → el límite de 6MB deja de ser relevante.

## Nuevo flujo de usuario

> **Actualizado durante la ejecución por pedido del usuario:** entre el timer y las
> descargas se reintrodujo una visita al anuncio en la misma pestaña, con permanencia
> mínima de 7 segundos validada server-side (sello de tiempo firmado en la cookie).

```
/  (Paso 1)                           /descargas (Paso 2)          Clic en "Descargar"
┌──────────────────────────┐         ┌─────────────────────┐      ┌──────────────────────────┐
│ 1. Timer 8s              │         │ Lista de archivos   │      │ Pestaña nueva: MediaFire │
│ 2. "Ver anuncio" →       │  ─────> │ (enlaces MediaFire) │ ───> │ Pestaña actual: countdown│
│    redirect misma pestaña│  cookie │                     │      │ 8s → redirect a Monetag  │
│ 3. 7s fuera (validado    │  sesión │                     │      └──────────────────────────┘
│    server-side) → volver │         └─────────────────────┘
│ 4. "Continuar" ✓         │
└──────────────────────────┘
```

- Endpoints de sesión: `POST /api/session/start` (timer), `POST /api/session/ad-visit`
  (sella la salida al anuncio), `GET /api/session/status` (resuelve si ya pasaron los
  7s y re-firma la cookie). `GET /api/files` exige `entry1Completed` **y**
  `adRedirectCompleted`.
- Al volver del anuncio (botón atrás), la home re-consulta el status en `pageshow`/
  `focus` para cubrir restauraciones desde bfcache.

- Comportamiento al descargar (confirmado): **2 pestañas** — MediaFire se abre en una
  pestaña nueva; la pestaña actual muestra un countdown de **8s** (igual que el flujo anterior, decidido por el usuario) y luego navega al
  link del ad (`/api/get-redirect-link`, con fallback si falla).
- El contador de descargas se registra en el momento del clic (`POST /api/download`),
  best-effort (no bloquea al usuario).

### Se elimina

- `pages/entry2.tsx` (paso "ver anuncio")
- `pages/ad-visit.tsx` (página de verificación del anuncio)
- `pages/api/ad/heartbeat.ts` (sistema de heartbeats)
- En `lib/timers.ts`: `startAdVisit`, `recordHeartbeat`, `getRemainingSeconds` y los
  campos `entry2*`/`lastHeartbeat` de `SessionProgress`.
- La verificación `entry2Completed` en `pages/api/files.ts` (queda solo `entry1Completed`).

### Rutas

- `/` — Paso 1 (timer). Botón al completar: "Ver archivos" → `/descargas`.
- `/descargas` — nueva página de archivos (reemplaza `/entry3`).
- `/entry3` — redirect 308 a `/descargas` (enlaces viejos no se rompen).
- `/entry2` y `/ad-visit` — se eliminan; sus URLs caen al 404 estándar de Next.

## Sistema visual (dark monocromo + un acento)

Fusión pedida por el usuario: base **monocroma oscura** estilo Vercel/Linear con **un
solo acento naranja** para la acción principal.

- **Paleta:** fondo `#0A0A0A`; superficies `#111113` / `#18181B`; bordes
  `rgba(255,255,255,0.08)`; texto `#FAFAFA` / secundario `#A1A1AA`; acento naranja
  `#FF6B35` solo en la acción principal y estados de foco; verde `#22C55E` únicamente
  para confirmación de completado.
- **Se elimina:** gradientes morados, doble glow, grid de fondo, emojis en UI, puntos
  de progreso decorativos, textos "Paso X de 3".
- **Tipografía:** títulos grandes con tracking ajustado, jerarquía clara, sin
  `font-black` generalizado; `Inter`/system-ui.
- **Superficies:** cards planas con borde 1px sutil y radio consistente (12-16px);
  sombras mínimas; sin backdrop-blur pesado.
- **Animaciones:** entrada fade+translate 150-250ms con easing estándar; transiciones
  de hover 150ms; el timer usa un anillo de progreso SVG limpio; countdown post-clic
  con número grande y barra fina. Todo respeta `prefers-reduced-motion`.
- **Componentes compartidos:** `Button` (primario naranja / secundario neutro),
  `Card`, `TimerButton` rediseñado (anillo SVG), lista de archivos con filas sobrias.
  Los contenedores de anuncio quedan enmarcados con etiqueta "Publicidad" discreta.
- Las skills de diseño frontend disponibles se usarán en la implementación para
  ejecutar esta dirección.

## Panel admin

Se reemplaza el formulario de subida multipart por un formulario de **enlace**:

| Campo | Validación | Obligatorio |
|-------|-----------|-------------|
| Nombre visible | no vacío | Sí |
| Enlace MediaFire | URL válida con host `mediafire.com` o `www.mediafire.com` (cliente y servidor) | Sí |
| Peso (texto libre, ej. "48 MB") | ninguna | No |

- Lista de enlaces existentes: nombre, URL truncada, peso, descargas, fecha; botón
  **Eliminar** (con confirmación) y botón **Copiar enlace**.
- Se mantiene: login JWT, gestión de links de ads (Monetag), sincronización de clicks.
- El resto del panel adopta el mismo sistema visual.

## Datos y API

### Modelo (`manifest.json` en rama `data`)

```json
{
  "files": [
    {
      "id": "abc123",
      "name": "Sensibilidad Pro 2026",
      "url": "https://www.mediafire.com/file/xxxx/archivo.zip/file",
      "size": "48 MB",
      "downloads": 0,
      "createdAt": "2026-08-09T00:00:00.000Z",
      "visible": true
    }
  ]
}
```

Entradas antiguas (con `filename`/`sha`) pueden existir en el manifest de producción;
el código las ignora (filtra las que no tengan `url`). Migración manual no requerida:
el usuario re-crea sus archivos como enlaces MediaFire.

### Endpoints

- `pages/api/admin/files.ts` — **reescrito como JSON puro** (sin formidable, sin
  `bodyParser: false`). `requireAdmin` se ejecuta **antes** de cualquier procesamiento.
  - `GET` — lista entradas del manifest + stats de descargas.
  - `POST { name, url, size? }` — valida, genera `id`, agrega al manifest (rama `data`).
  - `DELETE ?file=<id>` — elimina la entrada del manifest. Ya no borra binarios de GitHub.
- `pages/api/files.ts` — igual que hoy pero exige solo `entry1Completed` y devuelve el
  nuevo modelo (incluye `url`). Mantiene el cache en memoria de 5 min.
- `pages/api/download.ts` — **solo `POST`** (contador best-effort). El `GET` de proxy
  se elimina; el front abre la URL de MediaFire directamente.
- `pages/api/ad/heartbeat.ts` — eliminado.
- Sin cambios: `auth`, `check`, `logout`, `get-redirect-link`, `links-config`,
  `sync-clicks`, `save-checkpoint`, `manage-cache`, `sync-downloads` (este último puede
  simplificarse después; no bloquea).

### Dependencias

Se retiran del `package.json`: `formidable`, `@types/formidable` (ya sin uso).

## Manejo de errores

- **Admin / crear enlace:** URL que no sea de MediaFire → error inline "El enlace debe
  ser de mediafire.com". Fallo de GitHub API → mensaje con el error y el formulario
  conserva lo escrito.
- **Descargas:** sesión sin `entry1Completed` → la API responde 401 y el front redirige
  a `/`. Lista vacía → estado vacío sobrio. Carga → skeletons.
- **Redirect al ad:** si `/api/get-redirect-link` falla, la pestaña actual permanece en
  `/descargas` (no se navega a una URL rota).
- **Popup bloqueado:** MediaFire se abre con `window.open` dentro del handler del clic
  (gesto del usuario). Si el navegador lo bloquea igualmente, se muestra el enlace
  directo como fallback visible para clic manual.

## Fuera de alcance (señalado al usuario, no incluido aquí)

- Endpoints sin autenticación preexistentes (`links-config` PUT, `manage-cache`,
  `sync-clicks`, `save-checkpoint`, `debug-*`) — vulnerabilidad conocida, pendiente.
- `netlify.toml` (regla `ignore` invertida y redirect SPA `/*`) — pendiente de revisión
  aparte.
- Limpieza de archivos muertos (`sw.js` duplicados, `test-download.js`).

## Criterios de aceptación

1. `npm run build` compila sin errores y sin `formidable` en dependencias.
2. Flujo completo local: timer 8s → `/descargas` lista archivos → clic descarga abre
   MediaFire en pestaña nueva, countdown 8s y redirect al ad en la actual; contador
   de descargas incrementa en el manifest.
3. Admin: crear enlace MediaFire válido aparece en la lista y en `/descargas`;
   URL no-MediaFire es rechazada con error claro; eliminar lo quita de ambas.
4. `/entry2` y `/ad-visit` ya no existen; `/entry3` redirige a `/descargas`.
5. La UI de las 3 vistas usa el nuevo sistema visual (sin morados/glow/grid/emojis).
