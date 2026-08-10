import fs from 'fs';
import path from 'path';

/**
 * Almacenamiento de datos de la app (enlaces de archivos, links de anuncios y
 * contadores).
 *
 * En producción usa Netlify Blobs. En desarrollo —o si Blobs no está
 * disponible— cae a ficheros JSON dentro de `.data/`, así `npm run dev`
 * funciona sin configurar nada.
 *
 * Sustituye al almacenamiento anterior sobre la rama `data` de GitHub, que
 * traía límites de escritura, conflictos de SHA y un token que caduca.
 */

const STORE_NAME = 'portal';

let localDir = path.join(process.cwd(), '.data');

/** Solo para tests: redirige el backend local a un directorio temporal. */
export function __setLocalDirForTests(dir: string) {
  localDir = dir;
}

let cachedStore: any = null;
let storeResolved = false;

async function getBlobStore(): Promise<any | null> {
  if (storeResolved) return cachedStore;
  storeResolved = true;

  try {
    const { getStore } = await import('@netlify/blobs');
    // 'strong' evita que el admin agregue un enlace y la lista siga mostrando
    // la versión anterior por consistencia eventual.
    cachedStore = getStore({ name: STORE_NAME, consistency: 'strong' });
  } catch {
    cachedStore = null;
  }

  return cachedStore;
}

function localFile(key: string): string {
  // Las claves son constantes del código, pero se sanean por si acaso para que
  // nunca puedan escapar del directorio de datos.
  const safe = key.replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.join(localDir, `${safe}.json`);
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const file = localFile(key);
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
  } catch {
    // Fichero corrupto o ilegible: mejor el valor por defecto que reventar
    return fallback;
  }
}

function writeLocal(key: string, value: unknown): void {
  fs.mkdirSync(localDir, { recursive: true });
  fs.writeFileSync(localFile(key), JSON.stringify(value, null, 2), 'utf-8');
}

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  const store = await getBlobStore();

  if (store) {
    try {
      const value = await store.get(key, { type: 'json' });
      return (value ?? fallback) as T;
    } catch (error) {
      console.warn(`No se pudo leer "${key}" de Netlify Blobs:`, error);
      return fallback;
    }
  }

  return readLocal(key, fallback);
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  const store = await getBlobStore();

  if (store) {
    await store.setJSON(key, value);
    return;
  }

  writeLocal(key, value);
}

/**
 * Lee, transforma y guarda. Es read-modify-write, no atómico: dos escrituras
 * simultáneas sobre la misma clave pueden pisarse. Con el volumen de este
 * sitio es aceptable, y las escrituras de datos distintos (archivos vs
 * contadores) usan claves separadas para no competir entre sí.
 */
export async function updateJson<T>(
  key: string,
  fallback: T,
  transform: (current: T) => T
): Promise<T> {
  const current = await readJson<T>(key, fallback);
  const next = transform(current);
  await writeJson(key, next);
  return next;
}

/** Claves usadas por la app. */
export const KEYS = {
  files: 'files',
  adLinks: 'ad-links',
} as const;
