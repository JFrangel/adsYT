# Rediseño visual + flujo simplificado + MediaFire — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar el error 400 de subida reemplazando uploads binarios por enlaces MediaFire pegados en el admin, simplificar el flujo a timer → descargas → ad final, y rediseñar toda la UI con un sistema dark monocromo minimalista con acento naranja.

**Architecture:** Next.js 14 Pages Router. Los metadatos de archivos viven en `manifest.json` en la rama `data` del repo GitHub (via Contents API); ya no se mueve ningún binario por el servidor. La sesión de usuario es un JWT en cookie httpOnly que solo registra `entry1Completed`. El frontend abre MediaFire en pestaña nueva y redirige la pestaña actual al link de ads tras un countdown de 5s.

**Tech Stack:** Next.js 14.1, React 18, TypeScript 5.3, Tailwind CSS 3.4, axios, jsonwebtoken, vitest (nuevo, solo dev).

**Spec:** `docs/superpowers/specs/2026-08-09-rediseno-flujo-mediafire-design.md`

## Global Constraints

- Countdown post-descarga: **5 segundos** exactos, luego redirect al URL de `/api/get-redirect-link`.
- URLs de archivo válidas: **https** con host `mediafire.com`, `www.mediafire.com` o `*.mediafire.com`. Nada más.
- Paleta: fondo `#0A0A0A`, superficies `#111113` / `#18181B`, acento único `#FF6B35` (`primary`), verde `#22C55E` solo para confirmaciones. Prohibido en UI nueva: gradientes morados, `blur-3xl` decorativo, grid de fondo, emojis en copy.
- Animaciones: 150–250ms, easing estándar; todo bajo `@media (prefers-reduced-motion: reduce)` se desactiva.
- Copy de UI en español.
- Dependencias nuevas permitidas: solo `vitest` (devDependency). Se eliminan `formidable` y `@types/formidable`.
- Los scripts de Monetag en `pages/_document.tsx` y `public/sw.js` **no se tocan**.
- Rutas finales: `/` (timer), `/descargas` (archivos), `/entry3` → redirect 308 a `/descargas`. `/entry2` y `/ad-visit` dejan de existir.
- ADVERTENCIA operativa: las verificaciones manuales del admin (crear/borrar enlace) escriben en la rama `data` del repo real `JFrangel/adsYT` usando el token de `.env.local`. Borrar al final los enlaces de prueba creados.

---

### Task 1: Setup del workspace (git + dependencias)

**Files:**
- Create: `.git/` (repo nuevo — la carpeta no es repo)
- Modify: ninguno

**Interfaces:**
- Consumes: nada
- Produces: repo git inicializado en rama `main`, `node_modules/` instalado, dev server arrancable. Todos los tasks siguientes commitean sobre este repo.

- [ ] **Step 1: Inicializar git**

```bash
cd "D:/proyects/volver al peak"
git init -b main
git add -A
git commit -m "chore: baseline antes del rediseño"
```

Expected: commit inicial creado sin errores. (`archivos/` y `.env.local` quedan fuera por `.gitignore`.)

- [ ] **Step 2: Instalar dependencias**

```bash
npm install
```

Expected: termina sin errores (warnings de deprecación son aceptables). Existe `node_modules/`.

- [ ] **Step 3: Verificar que el dev server arranca**

```bash
npm run dev
```

Expected: `✓ Ready` en la consola y `http://localhost:3000` responde. Detener con Ctrl+C después de verificar.

---

### Task 2: Validador de URLs MediaFire (TDD, incluye setup de vitest)

**Files:**
- Create: `lib/mediafire.ts`
- Create: `tests/mediafire.test.ts`
- Create: `vitest.config.ts`
- Modify: `package.json` (devDependency `vitest` + script `test`)

**Interfaces:**
- Consumes: nada
- Produces: `isValidMediafireUrl(value: string): boolean` — exportada desde `@/lib/mediafire`. La consumen Task 4 (validación server-side en la API admin) y Task 9 (validación client-side en el formulario del admin).

- [ ] **Step 1: Instalar vitest y agregar script**

```bash
npm install -D vitest
```

Luego en `package.json`, dentro de `"scripts"`, agregar la línea:

```json
    "test": "vitest run",
```

- [ ] **Step 2: Crear config de vitest con el alias `@/`**

Crear `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 3: Escribir los tests (fallan primero)**

Crear `tests/mediafire.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isValidMediafireUrl } from '@/lib/mediafire';

describe('isValidMediafireUrl', () => {
  it('acepta URL estándar con www', () => {
    expect(isValidMediafireUrl('https://www.mediafire.com/file/abc123/juego.zip/file')).toBe(true);
  });

  it('acepta URL sin www', () => {
    expect(isValidMediafireUrl('https://mediafire.com/file/abc123/juego.zip/file')).toBe(true);
  });

  it('acepta subdominios de mediafire.com (mirrors de descarga)', () => {
    expect(isValidMediafireUrl('https://download1591.mediafire.com/xyz/archivo.apk')).toBe(true);
  });

  it('acepta URL con espacios alrededor (se recorta)', () => {
    expect(isValidMediafireUrl('  https://www.mediafire.com/file/abc/x.zip/file  ')).toBe(true);
  });

  it('rechaza http (sin TLS)', () => {
    expect(isValidMediafireUrl('http://www.mediafire.com/file/abc/x.zip/file')).toBe(false);
  });

  it('rechaza otros dominios', () => {
    expect(isValidMediafireUrl('https://mega.nz/file/abc123')).toBe(false);
  });

  it('rechaza dominios que solo contienen la palabra mediafire', () => {
    expect(isValidMediafireUrl('https://evilmediafire.com/file/abc')).toBe(false);
    expect(isValidMediafireUrl('https://mediafire.com.evil.io/file/abc')).toBe(false);
  });

  it('rechaza texto que no es URL y vacío', () => {
    expect(isValidMediafireUrl('no soy una url')).toBe(false);
    expect(isValidMediafireUrl('')).toBe(false);
  });
});
```

- [ ] **Step 4: Correr tests y verificar que fallan**

```bash
npm test
```

Expected: FAIL — `Cannot find module '@/lib/mediafire'` (o equivalente de resolución).

- [ ] **Step 5: Implementar el validador**

Crear `lib/mediafire.ts`:

```ts
/**
 * Valida que un enlace sea de MediaFire (https + host mediafire.com,
 * www.mediafire.com o cualquier subdominio *.mediafire.com).
 */
export function isValidMediafireUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return false;
  }

  if (url.protocol !== 'https:') return false;

  const host = url.hostname.toLowerCase();
  return host === 'mediafire.com' || host.endsWith('.mediafire.com');
}
```

- [ ] **Step 6: Correr tests y verificar que pasan**

```bash
npm test
```

Expected: PASS — 8 tests OK.

- [ ] **Step 7: Commit**

```bash
git add lib/mediafire.ts tests/mediafire.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat: validador de URLs MediaFire con tests (vitest)"
```

---

### Task 3: Simplificar la sesión — solo entry1 (TDD) y eliminar heartbeats

**Files:**
- Modify: `lib/timers.ts` (reescritura completa)
- Create: `tests/timers.test.ts`
- Delete: `pages/api/ad/heartbeat.ts` (y la carpeta `pages/api/ad/`)
- Modify: `pages/api/files.ts:21-23` (check de sesión)
- Modify: `pages/api/download.ts` (queda solo POST)

**Interfaces:**
- Consumes: nada
- Produces:
  - `lib/timers.ts` exporta SOLO: `SessionProgress { sessionId: string; entry1Completed: boolean }`, `createSession(): SessionProgress`, `completeEntry1(s: SessionProgress): SessionProgress`, `signSession(s: SessionProgress): string`, `verifySession(token: string): SessionProgress | null`. (`startAdVisit`, `recordHeartbeat`, `getRemainingSeconds` desaparecen.)
  - `POST /api/download?file=<id>` → `200 { success: true }` (contador best-effort). `GET /api/download` → `405`.
  - `GET /api/files` → `200 { files: FileEntry[] }` con `FileEntry { id, name, url, size?, downloads, createdAt, visible }`; `401 { success: false, error: 'Unauthorized', files: [] }` si la cookie no tiene `entry1Completed`.

- [ ] **Step 1: Escribir tests de sesión (fallan primero por los exports eliminados)**

Crear `tests/timers.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import * as timers from '@/lib/timers';
import { createSession, completeEntry1, signSession, verifySession } from '@/lib/timers';

describe('sesión simplificada', () => {
  it('createSession inicia sin entry1 completado', () => {
    const s = createSession();
    expect(s.sessionId.length).toBeGreaterThan(0);
    expect(s.entry1Completed).toBe(false);
  });

  it('completeEntry1 marca el paso 1', () => {
    const s = completeEntry1(createSession());
    expect(s.entry1Completed).toBe(true);
  });

  it('sign + verify hacen round-trip', () => {
    const s = completeEntry1(createSession());
    const token = signSession(s);
    const decoded = verifySession(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.sessionId).toBe(s.sessionId);
    expect(decoded!.entry1Completed).toBe(true);
  });

  it('verifySession devuelve null con token inválido', () => {
    expect(verifySession('token-basura')).toBeNull();
  });

  it('la API de heartbeats ya no existe en el módulo', () => {
    expect((timers as any).recordHeartbeat).toBeUndefined();
    expect((timers as any).startAdVisit).toBeUndefined();
    expect((timers as any).getRemainingSeconds).toBeUndefined();
  });
});
```

- [ ] **Step 2: Correr tests y verificar el fallo**

```bash
npm test
```

Expected: FAIL — el test "la API de heartbeats ya no existe" falla porque `recordHeartbeat` sigue exportado.

- [ ] **Step 3: Reescribir `lib/timers.ts` completo**

Reemplazar TODO el contenido de `lib/timers.ts` por:

```ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

export interface SessionProgress {
  sessionId: string;
  entry1Completed: boolean;
}

export function createSession(): SessionProgress {
  return {
    sessionId: Math.random().toString(36).substring(2, 15),
    entry1Completed: false,
  };
}

export function completeEntry1(session: SessionProgress): SessionProgress {
  return { ...session, entry1Completed: true };
}

export function signSession(session: SessionProgress): string {
  // Quitar claims propios de JWT antes de re-firmar
  const { iat, exp, ...cleanSession } = session as any;
  return jwt.sign(cleanSession, JWT_SECRET, { expiresIn: '1h' });
}

export function verifySession(token: string): SessionProgress | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionProgress;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Borrar el endpoint de heartbeats**

```bash
git rm pages/api/ad/heartbeat.ts
```

Expected: la carpeta `pages/api/ad/` queda vacía y desaparece del repo.

- [ ] **Step 5: Relajar el check en `pages/api/files.ts`**

En `pages/api/files.ts`, reemplazar:

```ts
    // Strict verification: User must have completed both steps
    if (!session || !session.entry1Completed || !session.entry2Completed) {
      return res.status(401).json({ success: false, error: 'Unauthorized', files: [] });
    }
```

por:

```ts
    // El usuario solo necesita haber completado el paso 1 (timer)
    if (!session || !session.entry1Completed) {
      return res.status(401).json({ success: false, error: 'Unauthorized', files: [] });
    }
```

Y reemplazar el bloque que combina stats (el `.map` con `downloadUrl`):

```ts
    // Combine manifest data with download stats
    const filesWithStats = manifest.files?.map((file: any) => ({
      ...file,
      downloads: downloadStats[file.id] || file.downloads || 0, // Use data branch stats, fallback to manifest, then 0
      downloadUrl: githubData.getRawUrl(`files/${file.filename}`), // Direct GitHub raw URL for downloads
    })) || [];

    // Filter visible files only
    const visibleFiles = filesWithStats.filter((f: any) => f.visible !== false);
```

por:

```ts
    // Combinar manifest con stats de descargas. Solo entradas nuevas (con url de MediaFire).
    const filesWithStats = (manifest.files || [])
      .filter((file: any) => typeof file.url === 'string' && file.url.length > 0)
      .map((file: any) => ({
        id: file.id,
        name: file.name,
        url: file.url,
        size: file.size,
        createdAt: file.createdAt,
        visible: file.visible,
        downloads: downloadStats[file.id] || file.downloads || 0,
      }));

    const visibleFiles = filesWithStats.filter((f: any) => f.visible !== false);
```

- [ ] **Step 6: Reescribir `pages/api/download.ts` (solo contador POST)**

Reemplazar TODO el contenido de `pages/api/download.ts` por:

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createGitHubDataService } from '@/lib/github';

// El archivo ya no se sirve desde aquí: el navegador abre MediaFire directo.
// Este endpoint solo registra la descarga (best-effort).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { file } = req.query;
  const fileId = Array.isArray(file) ? file[0] : file;

  if (!fileId) {
    return res.status(400).json({ error: 'File ID required' });
  }

  try {
    const githubData = createGitHubDataService();

    const manifestFile = await githubData.getFile('manifest.json');
    if (!manifestFile) {
      return res.status(404).json({ error: 'No files available' });
    }

    const manifest = JSON.parse(Buffer.from(manifestFile.content, 'base64').toString('utf-8'));
    const fileItem = manifest.files?.find((f: any) => f.id === fileId);

    if (!fileItem) {
      return res.status(404).json({ error: 'File not found' });
    }

    try {
      let downloadStats: any = {};
      let downloadStatsSha: string | undefined;

      const downloadsFile = await githubData.getFile('downloads-stats.json');
      if (downloadsFile) {
        downloadStats = JSON.parse(Buffer.from(downloadsFile.content, 'base64').toString('utf-8'));
        downloadStatsSha = downloadsFile.sha;
      }

      downloadStats[fileId] = (downloadStats[fileId] || 0) + 1;

      await githubData.createOrUpdateFile(
        'downloads-stats.json',
        JSON.stringify(downloadStats, null, 2),
        `[DATA] Update download stats for ${fileItem.name} [skip ci][skip netlify]`,
        downloadStatsSha
      );
    } catch (statsError: any) {
      // Best-effort: no bloquear al usuario si el contador falla
      console.warn('No se pudo actualizar el contador de descargas:', statsError.message);
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Download tracking error:', error.message);
    return res.status(500).json({ error: 'Error registering download' });
  }
}
```

- [ ] **Step 7: Correr tests y typecheck**

```bash
npm test
```

Expected: PASS — todos los tests (mediafire + timers).

```bash
npx tsc --noEmit
```

Expected: los únicos errores permitidos son en `pages/entry2.tsx`, `pages/ad-visit.tsx`, `pages/entry3.tsx` (usan la sesión vieja o rutas viejas; se borran en Task 8). Si aparecen errores en OTROS archivos, corregirlos antes de seguir.

- [ ] **Step 8: Commit**

```bash
git add lib/timers.ts tests/timers.test.ts pages/api/files.ts pages/api/download.ts
git commit -m "feat: sesión solo con paso 1, download como contador POST, fuera heartbeats"
```

---

### Task 4: API admin de enlaces (reemplaza subida multipart) y retirar formidable

**Files:**
- Modify: `pages/api/admin/files.ts` (reescritura completa)
- Modify: `package.json` (quitar `formidable` y `@types/formidable`)

**Interfaces:**
- Consumes: `isValidMediafireUrl` de `@/lib/mediafire` (Task 2); `requireAdmin` de `@/lib/auth`; `createGitHubDataService` de `@/lib/github`.
- Produces (para el admin UI de Task 9):
  - `GET /api/admin/files` → `200 { files: FileEntry[] }` — `FileEntry { id: string; name: string; url: string; size?: string; downloads: number; createdAt: string; visible: boolean }`
  - `POST /api/admin/files` con body JSON `{ name: string, url: string, size?: string }` → `200 { success: true, file: FileEntry }` | `400 { error }` si el nombre está vacío o la URL no es MediaFire
  - `DELETE /api/admin/files?file=<id>` → `200 { success: true }` | `404 { error }`
  - Todos → `401 { error }` sin cookie admin válida. Método no soportado → `405`.

- [ ] **Step 1: Reescribir `pages/api/admin/files.ts` completo**

Reemplazar TODO el contenido por:

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/auth';
import { createGitHubDataService } from '@/lib/github';
import { isValidMediafireUrl } from '@/lib/mediafire';

interface FileEntry {
  id: string;
  name: string;
  url: string;
  size?: string;
  downloads: number;
  createdAt: string;
  visible: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Autenticar ANTES de procesar cualquier cosa
  try {
    requireAdmin(req);
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }

  const githubData = createGitHubDataService();

  try {
    if (req.method === 'GET') {
      const manifestFile = await githubData.getFile('manifest.json');
      if (!manifestFile) {
        return res.status(200).json({ files: [] });
      }

      const manifest = JSON.parse(Buffer.from(manifestFile.content, 'base64').toString('utf-8'));

      let downloadStats: any = {};
      try {
        const downloadsFile = await githubData.getFile('downloads-stats.json');
        if (downloadsFile) {
          downloadStats = JSON.parse(Buffer.from(downloadsFile.content, 'base64').toString('utf-8'));
        }
      } catch {
        // sin stats aún: todos en 0
      }

      const files: FileEntry[] = (manifest.files || [])
        .filter((f: any) => typeof f.url === 'string' && f.url.length > 0)
        .map((f: any) => ({
          id: f.id,
          name: f.name,
          url: f.url,
          size: f.size,
          createdAt: f.createdAt,
          visible: f.visible !== false,
          downloads: downloadStats[f.id] || f.downloads || 0,
        }));

      return res.status(200).json({ files });
    }

    if (req.method === 'POST') {
      const { name, url, size } = req.body || {};

      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
      }
      if (typeof url !== 'string' || !isValidMediafireUrl(url)) {
        return res.status(400).json({ error: 'El enlace debe ser de mediafire.com (https)' });
      }

      const manifestFile = await githubData.getFile('manifest.json');
      let manifest: any = { files: [] };
      if (manifestFile) {
        manifest = JSON.parse(Buffer.from(manifestFile.content, 'base64').toString('utf-8'));
        manifest.files = manifest.files || [];
      }

      const newFile: FileEntry = {
        id: Math.random().toString(36).substring(2, 15),
        name: name.trim(),
        url: url.trim(),
        size: typeof size === 'string' && size.trim() ? size.trim().slice(0, 30) : undefined,
        downloads: 0,
        createdAt: new Date().toISOString(),
        visible: true,
      };

      manifest.files.push(newFile);

      await githubData.createOrUpdateFile(
        'manifest.json',
        JSON.stringify(manifest, null, 2),
        `[DATA] Add link ${newFile.name} [skip ci][skip netlify]`,
        manifestFile?.sha
      );

      return res.status(200).json({ success: true, file: newFile });
    }

    if (req.method === 'DELETE') {
      const { file } = req.query;
      const fileId = Array.isArray(file) ? file[0] : file;

      if (!fileId) {
        return res.status(400).json({ error: 'File ID required' });
      }

      const manifestFile = await githubData.getFile('manifest.json');
      if (!manifestFile) {
        return res.status(404).json({ error: 'No files found' });
      }

      const manifest = JSON.parse(Buffer.from(manifestFile.content, 'base64').toString('utf-8'));
      const exists = manifest.files?.some((f: any) => f.id === fileId);
      if (!exists) {
        return res.status(404).json({ error: 'File not found' });
      }

      manifest.files = manifest.files.filter((f: any) => f.id !== fileId);

      await githubData.createOrUpdateFile(
        'manifest.json',
        JSON.stringify(manifest, null, 2),
        `[DATA] Remove link ${fileId} [skip ci][skip netlify]`,
        manifestFile.sha
      );

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message || 'Unknown error';
    console.error('Admin files API error:', msg);
    return res.status(500).json({ error: 'Error: ' + msg });
  }
}
```

- [ ] **Step 2: Quitar formidable de `package.json`**

En `package.json` eliminar estas dos líneas:

```json
    "formidable": "^3.5.1",
```

```json
    "@types/formidable": "^3.4.5",
```

Luego:

```bash
npm install
```

Expected: `npm ls formidable` responde `(empty)`.

- [ ] **Step 3: Verificar que no queda ninguna referencia a formidable**

```bash
grep -ri "formidable" --include="*.ts" --include="*.tsx" --include="*.json" -l . | grep -v node_modules | grep -v package-lock
```

Expected: sin resultados (package-lock se regenera solo).

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: mismos errores permitidos que en Task 3 Step 7 (solo páginas viejas por borrar). Ninguno nuevo.

- [ ] **Step 5: Verificación manual del endpoint (auth primero)**

```bash
npm run dev
```

Con el server corriendo, en otra terminal:

```bash
curl -s -X POST http://localhost:3000/api/admin/files -H "Content-Type: application/json" -d '{"name":"x","url":"https://www.mediafire.com/file/a/b.zip/file"}'
```

Expected: `{"error":"No authentication token"}` con status 401 — la auth corre ANTES de procesar el body (el bug de seguridad de la versión vieja queda cerrado). Detener el server.

- [ ] **Step 6: Commit**

```bash
git add pages/api/admin/files.ts package.json package-lock.json
git commit -m "feat: API admin de enlaces MediaFire (JSON puro, auth primero), fuera formidable"
```

---

### Task 5: Sistema visual base (Tailwind + globals.css)

**Files:**
- Modify: `tailwind.config.js` (reescritura completa)
- Modify: `styles/globals.css` (reescritura completa)

**Interfaces:**
- Consumes: nada
- Produces (clases usadas por Tasks 6–9): `.card`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.input-field`, `.ad-frame`, `.skeleton`, `.fade-in`, `.row-item`, colores `primary`, `dark-900/800/700` (remapeados a la paleta neutra — las clases legadas del panel admin adoptan el nuevo look sin tocarlas).

- [ ] **Step 1: Reescribir `tailwind.config.js`**

Reemplazar TODO el contenido por:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        // Escala neutra. Se conservan los nombres dark-* para que las
        // clases existentes del admin adopten la nueva paleta sin reescribirlas.
        dark: {
          900: '#0A0A0A',
          800: '#111113',
          700: '#18181B',
        },
      },
      animation: {
        'shimmer': 'shimmer 1.8s linear infinite',
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Reescribir `styles/globals.css`**

Reemplazar TODO el contenido por:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    min-height: 100dvh;
    overflow-x: hidden;
    background-color: #0A0A0A;
  }

  body {
    @apply bg-dark-900 text-zinc-100 antialiased;
    min-height: 100dvh;
    overflow-x: hidden;
    font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  }

  ::selection {
    @apply bg-primary/30 text-white;
  }
}

@layer components {
  .card {
    @apply bg-dark-800 border border-white/[0.08] rounded-2xl p-6 sm:p-8;
  }

  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl
           bg-primary text-white font-semibold text-base
           transition-all duration-150
           hover:brightness-110 active:scale-[0.98]
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900
           disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100;
  }

  .btn-secondary {
    @apply inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl
           bg-transparent text-zinc-300 font-semibold text-base
           border border-white/10
           transition-colors duration-150
           hover:bg-white/5 hover:text-white
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30
           disabled:opacity-40 disabled:cursor-not-allowed;
  }

  .btn-danger {
    @apply inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
           bg-transparent text-red-400 font-semibold text-sm
           border border-red-500/20
           transition-colors duration-150
           hover:bg-red-500/10 hover:border-red-500/40
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40;
  }

  .input-field {
    @apply w-full px-4 py-3 rounded-xl bg-dark-900 border border-white/10
           text-zinc-100 placeholder-zinc-600 text-base
           transition-colors duration-150
           focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/60;
  }

  .row-item {
    @apply bg-dark-900 border border-white/[0.06] rounded-xl p-4 sm:p-5
           transition-colors duration-150 hover:border-white/[0.14];
  }

  .ad-frame {
    @apply border border-white/[0.06] rounded-xl bg-dark-900 p-4
           flex flex-col items-center justify-center min-h-[266px];
  }

  .ad-frame::before {
    content: 'Publicidad';
    @apply text-[11px] uppercase tracking-widest text-zinc-600 mb-2 font-medium;
  }

  .skeleton {
    @apply bg-gradient-to-r from-dark-700 via-dark-800 to-dark-700 bg-[length:400%_100%] animate-shimmer rounded-xl;
  }

  .fade-in {
    animation: fadeIn 200ms ease-out both;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: Verificar que compila y el sitio carga**

```bash
npm run dev
```

Abrir `http://localhost:3000`. Expected: la home carga con fondo negro sólido (sin grid ni glow), sin errores de compilación de Tailwind/PostCSS en consola. La página aún tiene el layout viejo (se rediseña en Task 7) — clases desaparecidas como `gradient-text`, `glass-card`, `ad-container`, `btn` viejos simplemente pierden estilo; es el estado esperado e intermedio. Detener el server.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.js styles/globals.css
git commit -m "feat: sistema visual dark monocromo con acento naranja"
```

---

### Task 6: TimerButton rediseñado (anillo de progreso SVG)

**Files:**
- Modify: `components/TimerButton.tsx` (reescritura completa)

**Interfaces:**
- Consumes: clases `.btn-primary` (Task 5)
- Produces: `TimerButton({ duration: number, onComplete: () => void, label?: string, completedLabel?: string })` — default export. Al completar llama `onComplete()` una sola vez y muestra `completedLabel`. Lo consume Task 7 (`pages/index.tsx`).

- [ ] **Step 1: Reescribir `components/TimerButton.tsx`**

Reemplazar TODO el contenido por:

```tsx
import { useState, useEffect, useRef } from 'react';

interface TimerButtonProps {
  duration: number;
  onComplete: () => void;
  label?: string;
  completedLabel?: string;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TimerButton({
  duration,
  onComplete,
  label = 'Desbloquear',
  completedLabel = 'Desbloqueado',
}: TimerButtonProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          setIsCompleted(true);
          onCompleteRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const progress = (duration - timeLeft) / duration;

  if (!isRunning && !isCompleted) {
    return (
      <button onClick={() => setIsRunning(true)} className="btn-primary text-lg px-10 py-4 w-full sm:w-auto">
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 fade-in">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle
            cx="60" cy="60" r={RADIUS}
            fill="none" strokeWidth="6"
            className="stroke-white/10"
          />
          <circle
            cx="60" cy="60" r={RADIUS}
            fill="none" strokeWidth="6" strokeLinecap="round"
            className={isCompleted ? 'stroke-green-500' : 'stroke-primary'}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 150ms ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {isCompleted ? (
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-green-500">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className="text-3xl font-semibold tabular-nums text-white">{timeLeft}</span>
          )}
        </div>
      </div>
      <p className="text-sm text-zinc-500">
        {isCompleted ? completedLabel : 'Desbloqueando…'}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verificar en el navegador**

```bash
npm run dev
```

En `http://localhost:3000`: clic en "Desbloquear" → aparece el anillo, avanza suave 1s por tick, al llegar a 0 muestra el check verde y el texto "Desbloqueado". Detener el server.

- [ ] **Step 3: Commit**

```bash
git add components/TimerButton.tsx
git commit -m "feat: TimerButton minimalista con anillo de progreso SVG"
```

---

### Task 7: Home rediseñada (`/`)

**Files:**
- Modify: `pages/index.tsx` (reescritura completa)

**Interfaces:**
- Consumes: `TimerButton` (Task 6), `.card`/`.ad-frame`/`.btn-primary` (Task 5), `HighPerformanceAd`, `FireIcon`/`ArrowIcon`/`LockIcon` de `@/components/Icons`, `POST /api/session/start` (existente).
- Produces: al completar el timer navega a `/descargas` (página de Task 8).

- [ ] **Step 1: Reescribir `pages/index.tsx`**

Reemplazar TODO el contenido por:

```tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import TimerButton from '@/components/TimerButton';
import HighPerformanceAd from '@/components/HighPerformanceAd';
import { FireIcon, ArrowIcon, LockIcon } from '@/components/Icons';

export default function Home() {
  const router = useRouter();
  const [canContinue, setCanContinue] = useState(false);

  const handleTimerComplete = async () => {
    try {
      await fetch('/api/session/start', { method: 'POST' });
    } catch (error) {
      console.error('No se pudo iniciar la sesión', error);
      // Aun con error de red dejamos continuar; la página de descargas re-valida.
    }
    setCanContinue(true);
  };

  return (
    <>
      <Head>
        <title>Free Fire — Archivos</title>
      </Head>

      <main className="min-h-[100dvh] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg fade-in">
          <div className="card flex flex-col items-center text-center gap-8">
            <header className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <FireIcon className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                Free Fire — Archivos
              </h1>
              <p className="text-zinc-500 text-base">
                Desbloquea el acceso y descarga los archivos disponibles.
              </p>
            </header>

            <TimerButton
              duration={8}
              onComplete={handleTimerComplete}
              label="Desbloquear"
              completedLabel="Acceso desbloqueado"
            />

            <div className="ad-frame w-full">
              <HighPerformanceAd />
            </div>

            <button
              onClick={() => router.push('/descargas')}
              disabled={!canContinue}
              className={canContinue ? 'btn-primary w-full text-lg' : 'btn-secondary w-full text-lg'}
            >
              {canContinue ? (
                <>
                  Ver archivos
                  <ArrowIcon className="w-5 h-5" />
                </>
              ) : (
                <>
                  <LockIcon className="w-4 h-4" />
                  Completa el timer para continuar
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Verificar en el navegador**

```bash
npm run dev
```

En `http://localhost:3000`: layout centrado, sin morados/glow; timer corre y al terminar el botón pasa a "Ver archivos" en naranja. Clic navega a `/descargas` (todavía 404 o kick a `/` — la página llega en Task 8; con que la URL cambie alcanza). Detener el server.

- [ ] **Step 3: Commit**

```bash
git add pages/index.tsx
git commit -m "feat: home minimalista con timer y CTA directo a descargas"
```

---

### Task 8: Página `/descargas` + eliminación de rutas viejas

**Files:**
- Create: `pages/descargas.tsx`
- Delete: `pages/entry2.tsx`, `pages/ad-visit.tsx`, `pages/entry3.tsx`
- Modify: `pages/_app.tsx:13` (rutas iniciales permitidas)
- Modify: `next.config.js` (redirect `/entry3` → `/descargas`)

**Interfaces:**
- Consumes: `GET /api/files` (Task 3: `{ files: FileEntry[] }`, 401 sin sesión), `POST /api/download?file=<id>` (Task 3), `GET /api/get-redirect-link` (existente, responde `{ url: string }`), clases de Task 5, `FolderIcon`/`DownloadIcon`/`FileIcon` de `@/components/Icons`.
- Produces: flujo completo de descarga con 2 pestañas (MediaFire nueva + countdown 5s → ad en la actual).

- [ ] **Step 1: Crear `pages/descargas.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import HighPerformanceAd from '@/components/HighPerformanceAd';
import { FolderIcon, DownloadIcon, FileIcon } from '@/components/Icons';

interface FileItem {
  id: string;
  name: string;
  url: string;
  size?: string;
  downloads: number;
  createdAt: string;
}

const REDIRECT_SECONDS = 5;

export default function Descargas() {
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [redirectingId, setRedirectingId] = useState<string | null>(null);
  const [counter, setCounter] = useState(REDIRECT_SECONDS);
  const [blockedFile, setBlockedFile] = useState<FileItem | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get('/api/files');
        setFiles(response.data.files || []);
      } catch (error: any) {
        if (error.response?.status === 401) {
          router.replace('/');
          return;
        }
        console.error('Error cargando archivos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [router]);

  const handleDownload = (file: FileItem) => {
    if (redirectingId) return;

    // 1) MediaFire en pestaña nueva (dentro del gesto del usuario)
    const win = window.open(file.url, '_blank', 'noopener,noreferrer');
    if (!win) {
      // Popup bloqueado: mostrar enlace directo para clic manual
      setBlockedFile(file);
      return;
    }
    setBlockedFile(null);

    // 2) Registrar descarga (best-effort, no bloquea)
    axios.post(`/api/download?file=${file.id}`).catch(() => {});

    // 3) Countdown en esta pestaña y redirect al ad
    setRedirectingId(file.id);
    let remaining = REDIRECT_SECONDS;
    setCounter(remaining);

    const interval = setInterval(() => {
      remaining -= 1;
      setCounter(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        axios
          .get('/api/get-redirect-link')
          .then((response) => {
            window.location.href = response.data.url;
          })
          .catch(() => {
            // Si el link de ads falla, no navegar a una URL rota
            setRedirectingId(null);
            setCounter(REDIRECT_SECONDS);
          });
      }
    }, 1000);
  };

  return (
    <>
      <Head>
        <title>Descargas — Free Fire</title>
      </Head>

      <main className="min-h-[100dvh] flex flex-col items-center p-4 sm:p-6 py-10">
        <div className="w-full max-w-2xl flex flex-col gap-6 fade-in">
          <header className="card flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <FolderIcon className="w-6 h-6 text-green-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Archivos disponibles
            </h1>
            <p className="text-zinc-500">Elige un archivo para descargarlo desde MediaFire.</p>
          </header>

          <div className="ad-frame">
            <HighPerformanceAd />
          </div>

          <section className="card">
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-20 w-full" />
                ))}
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg font-medium text-zinc-300">No hay archivos disponibles</p>
                <p className="text-sm text-zinc-600 mt-1">Vuelve pronto.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {files.map((file) => (
                  <li key={file.id} className="row-item flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white flex items-center gap-2">
                        <FileIcon className="w-4 h-4 text-zinc-500 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </p>
                      <p className="text-sm text-zinc-500 mt-1">
                        {file.size ? `${file.size} · ` : ''}
                        {file.downloads} descargas
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={redirectingId !== null}
                      className="btn-primary sm:w-auto w-full"
                    >
                      {redirectingId === file.id ? (
                        <span className="tabular-nums">Continuando en {counter}s…</span>
                      ) : (
                        <>
                          <DownloadIcon className="w-5 h-5" />
                          Descargar
                        </>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {blockedFile && (
              <div className="mt-4 p-4 rounded-xl border border-primary/30 bg-primary/5 text-sm fade-in">
                <p className="text-zinc-300">
                  Tu navegador bloqueó la ventana emergente. Abre tu descarga aquí:
                </p>
                <a
                  href={blockedFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium underline underline-offset-4 break-all"
                >
                  {blockedFile.name}
                </a>
              </div>
            )}

            {redirectingId && (
              <p className="mt-4 text-center text-sm text-zinc-500 fade-in">
                Tu descarga se abrió en otra pestaña. Esta página continuará en unos segundos…
              </p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Borrar las páginas del flujo viejo**

```bash
git rm pages/entry2.tsx pages/ad-visit.tsx pages/entry3.tsx
```

- [ ] **Step 3: Permitir `/descargas` y `/admin/login` en carga inicial**

En `pages/_app.tsx`, reemplazar:

```ts
    const allowedInitialPaths = ['/', '/admin'];
```

por:

```ts
    const allowedInitialPaths = ['/', '/admin', '/admin/login', '/descargas'];
```

- [ ] **Step 4: Redirect permanente `/entry3` → `/descargas`**

Reemplazar TODO el contenido de `next.config.js` por:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  async redirects() {
    return [
      {
        source: '/entry3',
        destination: '/descargas',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig
```

- [ ] **Step 5: Typecheck completo (ya sin páginas viejas)**

```bash
npx tsc --noEmit
```

Expected: **cero errores**. Las páginas que usaban la sesión vieja ya no existen.

- [ ] **Step 6: Verificación manual del flujo completo**

```bash
npm run dev
```

1. `http://localhost:3000` → timer 8s → "Ver archivos" → llega a `/descargas` y lista archivos (necesita al menos un enlace en el manifest; si no hay, se ve el estado vacío — crear uno en Task 9 y re-verificar).
2. Ir a `http://localhost:3000/descargas` SIN pasar el timer (ventana incógnita): la API responde 401 y te devuelve a `/`.
3. `http://localhost:3000/entry3` redirige a `/descargas`.
4. `http://localhost:3000/entry2` → 404 de Next.

Detener el server.

- [ ] **Step 7: Commit**

```bash
git add pages/descargas.tsx pages/_app.tsx next.config.js
git commit -m "feat: página /descargas con flujo de 2 pestañas; fuera entry2/entry3/ad-visit"
```

---

### Task 9: Panel admin — formulario de enlace + rediseño

**Files:**
- Modify: `pages/admin/index.tsx` (secciones: interfaz, estado, handlers, JSX de formulario y lista; sweep de clases moradas)
- Modify: `pages/admin/login.tsx` (reescritura completa)

**Interfaces:**
- Consumes: API de Task 4 (`GET/POST/DELETE /api/admin/files` con `FileEntry { id, name, url, size?, downloads, createdAt, visible }`), `isValidMediafireUrl` (Task 2), clases de Task 5, dialogs existentes (`useDialog`, `AlertDialog`, `ConfirmDialog`, `PromptDialog`).
- Produces: admin funcional con alta/baja de enlaces MediaFire.

- [ ] **Step 1: Reescribir `pages/admin/login.tsx` completo**

```tsx
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { LockIcon } from '@/components/Icons';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/admin/auth', { username, password });
      if (response.data.success) {
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin — Iniciar sesión</title>
      </Head>

      <main className="min-h-[100dvh] flex items-center justify-center p-4 sm:p-6">
        <div className="card w-full max-w-sm fade-in">
          <header className="flex flex-col items-center text-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <LockIcon className="w-5 h-5 text-zinc-400" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Panel Admin</h1>
            <p className="text-sm text-zinc-500">Acceso restringido</p>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                required
                autoComplete="username"
                placeholder="Usuario"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
                autoComplete="current-password"
                placeholder="Contraseña"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 fade-in">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Verificando…' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              ← Volver al inicio
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Actualizar interfaz y estado en `pages/admin/index.tsx`**

Reemplazar la interfaz `FileItem` (líneas 9–17):

```ts
interface FileItem {
  id: string;
  name: string;
  filename: string;
  size: number;
  uploadedAt: string;
  downloads: number;
  visible: boolean;
}
```

por:

```ts
interface FileItem {
  id: string;
  name: string;
  url: string;
  size?: string;
  createdAt: string;
  downloads: number;
  visible: boolean;
}
```

Y reemplazar las líneas de estado de upload:

```ts
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
```

por:

```ts
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkSize, setLinkSize] = useState('');
  const [savingLink, setSavingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
```

Agregar el import del validador junto a los imports existentes (después de la línea `import { useDialog } from '@/hooks/useDialog';`):

```ts
import { isValidMediafireUrl } from '@/lib/mediafire';
```

- [ ] **Step 3: Reemplazar `handleUpload` por `handleAddLink`**

Reemplazar la función `handleUpload` completa (desde `const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {` hasta su cierre `};` antes de `const handleDelete`) por:

```ts
  const handleAddLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLinkError(null);

    if (!linkName.trim()) {
      setLinkError('Ingresa un nombre para el archivo');
      return;
    }
    if (!isValidMediafireUrl(linkUrl)) {
      setLinkError('El enlace debe ser de mediafire.com (https)');
      return;
    }

    setSavingLink(true);
    try {
      await axios.post('/api/admin/files', {
        name: linkName.trim(),
        url: linkUrl.trim(),
        size: linkSize.trim() || undefined,
      });
      showAlert('Enlace agregado', 'El archivo ya está disponible en la página de descargas', 'success');
      setLinkName('');
      setLinkUrl('');
      setLinkSize('');
      fetchFiles();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      setLinkError(errorMsg);
      showAlert('Error', 'No se pudo agregar el enlace: ' + errorMsg, 'error');
    } finally {
      setSavingLink(false);
    }
  };
```

- [ ] **Step 4: Actualizar `handleDelete` y reemplazar `handleAdminDownload`**

En `handleDelete`, reemplazar la firma y el mensaje:

```ts
  const handleDelete = (fileId: string, filename: string) => {
    showConfirm(
      'Eliminar Archivo',
      `¿Eliminar ${filename}?\n\nEsta acción no se puede deshacer.`,
```

por:

```ts
  const handleDelete = (fileId: string, name: string) => {
    showConfirm(
      'Eliminar enlace',
      `¿Eliminar "${name}"?\n\nEl archivo seguirá existiendo en MediaFire; solo se quita de la página.`,
```

Reemplazar la función `handleAdminDownload` completa (desde `const handleAdminDownload = async (file: FileItem) => {` hasta su `};`) por:

```ts
  const handleCopyLink = async (file: FileItem) => {
    try {
      await navigator.clipboard.writeText(file.url);
      showAlert('Enlace copiado', file.url, 'success');
    } catch {
      showAlert('Error', 'No se pudo copiar el enlace', 'error');
    }
  };
```

- [ ] **Step 5: Reemplazar el JSX del formulario de subida**

Reemplazar el bloque completo `{/* Upload Form */}` (el `<div className="card mb-6 sm:mb-8 animate-fade-in" ...>` que contiene `<form onSubmit={handleUpload}` y cierra antes de `{/* Files List */}`) por:

```tsx
          {/* Formulario de enlace MediaFire */}
          <div className="card mb-6 fade-in">
            <h2 className="text-xl font-semibold text-white mb-1">Agregar archivo</h2>
            <p className="text-sm text-zinc-500 mb-6">
              Sube tu archivo a MediaFire y pega aquí el enlace para compartirlo.
            </p>
            <form onSubmit={handleAddLink} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Nombre visible</label>
                  <input
                    type="text"
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                    required
                    className="input-field"
                    placeholder="Ej: Sensibilidad Pro 2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Peso <span className="text-zinc-600">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={linkSize}
                    onChange={(e) => setLinkSize(e.target.value)}
                    className="input-field"
                    placeholder="Ej: 48 MB"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Enlace de MediaFire</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  required
                  className="input-field"
                  placeholder="https://www.mediafire.com/file/…"
                />
                {linkError && <p className="mt-2 text-sm text-red-400 fade-in">{linkError}</p>}
              </div>
              <button type="submit" disabled={savingLink} className="btn-primary self-start">
                {savingLink ? 'Guardando…' : 'Agregar enlace'}
              </button>
            </form>
          </div>
```

- [ ] **Step 6: Reemplazar el JSX de la lista de archivos**

Dentro del bloque `{/* Files List */}`, reemplazar el mapeo de archivos completo (el `<div className="space-y-3 sm:space-y-4">` con `{files.map((file, index) => (...))}` y sus botones Descargar/Eliminar) por:

```tsx
              <div className="flex flex-col gap-3">
                {files.map((file) => (
                  <div key={file.id} className="row-item">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white flex items-center gap-2">
                          <FileIcon className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </h3>
                        <p className="text-sm text-zinc-500 mt-1 truncate">{file.url}</p>
                        <p className="text-xs text-zinc-600 mt-1">
                          {file.size ? `${file.size} · ` : ''}
                          {file.downloads} descargas ·{' '}
                          {new Date(file.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleCopyLink(file)} className="btn-secondary text-sm px-4 py-2.5">
                          Copiar enlace
                        </button>
                        <button onClick={() => handleDelete(file.id, file.name)} className="btn-danger">
                          <DeleteIcon className="w-4 h-4" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
```

Además, en el mismo archivo: el texto del estado vacío `<p className="text-lg sm:text-xl text-purple-200">No hay archivos subidos</p>` cambia a `<p className="text-lg text-zinc-400">No hay enlaces todavía</p>`, y el título de la sección `Archivos Actuales` cambia a `Enlaces publicados`.

- [ ] **Step 7: Quitar fondos decorativos y actualizar el header del admin**

Eliminar el bloque de blobs animados:

```tsx
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-40 sm:w-60 lg:w-80 h-40 sm:h-60 lg:h-80 bg-pink-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        </div>
```

Reemplazar el `<h1>` del header (el que contiene `<AdminIcon ... animate />` y `<span className="gradient-text">Panel Admin</span>`) por:

```tsx
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-1 flex items-center gap-3">
                <AdminIcon className="w-7 h-7 text-zinc-400" />
                Panel Admin
              </h1>
```

- [ ] **Step 8: Sweep de clases moradas restantes (sección monetización)**

En `pages/admin/index.tsx` aplicar estos reemplazos con **replace_all**, en este orden (los más específicos primero):

| old_string | new_string |
|---|---|
| `text-purple-300/80` | `text-zinc-500` |
| `text-purple-400/80` | `text-zinc-600` |
| `text-purple-400/50` | `text-zinc-600` |
| `text-purple-200` | `text-zinc-400` |
| `text-purple-300` | `text-zinc-400` |
| `text-purple-400` | `text-zinc-500` |
| `placeholder-purple-300/50` | `placeholder-zinc-600` |
| `border-purple-500/30` | `border-white/10` |
| `border-purple-500/20` | `border-white/10` |
| `border-purple-500/10` | `border-white/[0.06]` |
| `border-purple-500/50` | `border-white/15` |
| `bg-purple-500/20` | `bg-white/5` |
| `hover:bg-purple-500/40` | `hover:bg-white/10` |
| `hover:bg-purple-600/20` | `hover:bg-white/10` |
| `focus:ring-purple-500` | `focus:ring-primary` |
| `border-4 border-purple-500 border-t-transparent` | `border-4 border-primary border-t-transparent` |
| `bg-purple-500/20 animate-ping` | `bg-primary/20 animate-ping` |
| `from-purple-600 to-indigo-600` | `from-primary to-primary` |
| `shadow-purple-500/50` | `shadow-black/40` |
| `shadow-purple-500/30` | `shadow-black/40` |
| `from-purple-900/40 to-indigo-900/40` | `from-dark-800 to-dark-800` |
| `from-purple-600/20 to-indigo-600/20` | `from-dark-700 to-dark-700` |
| `from-purple-500/20 to-indigo-500/20` | `from-dark-700 to-dark-700` |

Nota: la clase `animate-float` ya no existe en Tailwind config (Task 5); las referencias restantes en `components/Icons.tsx` (`animate ? 'animate-float' : ''`) simplemente no aplican animación — comportamiento correcto (sin rebotes).

- [ ] **Step 9: Typecheck + verificación manual**

```bash
npx tsc --noEmit
```

Expected: cero errores.

```bash
npm run dev
```

1. `http://localhost:3000/admin/login` → login sobrio; entrar con las credenciales de `.env.local`.
2. En el panel: agregar un enlace de prueba real de MediaFire → aparece en "Enlaces publicados". Verificar que en otra pestaña `/descargas` (pasando el timer) lo muestra.
3. Probar URL inválida (`https://mega.nz/...`) → error inline "El enlace debe ser de mediafire.com (https)".
4. "Copiar enlace" copia la URL. "Eliminar" lo quita de la lista y de `/descargas`.
5. Revisar visualmente que no queda morado en el panel (la sección de monetización queda neutra).
6. **Borrar el enlace de prueba** al terminar.

Detener el server.

- [ ] **Step 10: Commit**

```bash
git add pages/admin/index.tsx pages/admin/login.tsx
git commit -m "feat: admin con formulario de enlaces MediaFire y estética neutra"
```

---

### Task 10: Build final y verificación integral

**Files:**
- Modify: ninguno (solo verificación; correcciones menores si el build falla)

**Interfaces:**
- Consumes: todo lo anterior
- Produces: build de producción verde y criterios de aceptación del spec confirmados

- [ ] **Step 1: Tests + typecheck + build**

```bash
npm test
```

Expected: PASS (13 tests: 8 mediafire + 5 timers).

```bash
npm run build
```

Expected: `✓ Compiled successfully`. Rutas listadas incluyen `/`, `/descargas`, `/admin`, `/admin/login` y NO incluyen `/entry2`, `/entry3`, `/ad-visit`.

- [ ] **Step 2: Barrido de referencias muertas**

```bash
grep -rn "entry2\|ad-visit\|heartbeat" --include="*.ts" --include="*.tsx" pages components lib hooks
```

Expected: sin resultados.

```bash
grep -rn "purple\|from-pink" --include="*.tsx" pages components
```

Expected: sin resultados.

- [ ] **Step 3: Prueba de humo del flujo completo con `npm start`**

```bash
npm run build
npm start
```

En `http://localhost:3000`: timer → descargas → clic Descargar → se abre MediaFire en pestaña nueva, countdown "Continuando en 5s…" y redirect al link de ads en la pestaña original. Detener el server.

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "chore: verificación final del rediseño y flujo simplificado"
```

Si no hay cambios pendientes (`nothing to commit`), omitir este commit.

---

## Notas para el despliegue (fuera del alcance de este plan, avisar al usuario)

1. La carpeta local no tenía `.git`; el repo remoto es `github.com/JFrangel/adsYT`. Para desplegar: agregar el remote y pushear (`git remote add origin ... && git push -f origin main` o el flujo que el usuario prefiera — **confirmar con el usuario antes de pushear**).
2. `netlify.toml` tiene la regla `ignore` invertida y un redirect SPA `/*` que puede romper rutas de Next en producción — arreglo pendiente señalado en el spec como fuera de alcance; recomendar hacerlo junto con el deploy.
3. El manifest de producción en la rama `data` puede tener entradas viejas con `filename`; el código nuevo las ignora. El usuario debe re-crear sus archivos como enlaces MediaFire desde el admin.
