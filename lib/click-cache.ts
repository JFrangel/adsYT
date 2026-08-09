// In-memory cache for click counts and last used index
// En serverless la memoria se pierde al reciclar la instancia, así que CADA
// vista se persiste a GitHub (rama data) de inmediato, igual que las descargas.
import { saveCheckpointToGitHub, loadCheckpointFromGitHub } from './github-storage';

import fs from 'fs';
import path from 'path';

export const clickCache: { [linkId: string]: number } = {};
export let lastUsedIndexCache: number | undefined = undefined;

/**
 * Vistas registradas en ESTE contenedor que aún no se han sumado en GitHub.
 * Se guardan como incrementos (deltas) y no como totales: en serverless hay
 * varios contenedores a la vez y escribir el total local pisaría las vistas
 * contadas por los demás.
 */
const pendingDeltas: { [linkId: string]: number } = {};

let totalCheckpoints = 0;

/**
 * Cada cuántas vistas se persiste a GitHub. Escribir en CADA vista convierte un
 * GET público en un commit y agota los límites de escritura de la API (y es un
 * vector de abuso trivial). Con lote de 10 la pérdida máxima por reciclaje de
 * contenedor es pequeña y la presión sobre la API baja un orden de magnitud.
 */
export const FLUSH_EVERY = 10;

const LOCAL_CACHE_FILE = path.join(process.cwd(), 'config', 'clicks-local.json');

// El disco local solo sirve en desarrollo (en Netlify el FS es efímero/read-only)
const CAN_USE_LOCAL_DISK = process.env.NODE_ENV !== 'production' && !process.env.NETLIFY && !process.env.VITEST;

// Bandera para evitar múltiples cargas
let checkpointsLoaded = false;

function ensureConfigDir() {
  const dir = path.dirname(LOCAL_CACHE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Guarda instantáneamente en disco local (ideal para VPS/Windows)
function saveToLocalDisk() {
  if (!CAN_USE_LOCAL_DISK) return;
  try {
    ensureConfigDir();
    fs.writeFileSync(LOCAL_CACHE_FILE, JSON.stringify(clickCache, null, 2));
  } catch (err) {
    console.warn('⚠️ Could not save clicks locally:', err);
  }
}

// Cargar clicks del disco local
function loadFromLocalDisk() {
  if (!CAN_USE_LOCAL_DISK) return;
  try {
    if (fs.existsSync(LOCAL_CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_CACHE_FILE, 'utf-8'));
      Object.keys(data).forEach(k => {
        clickCache[k] = Math.max(clickCache[k] || 0, data[k]);
      });
      console.log('💾 Loaded local disk click cache:', clickCache);
    }
  } catch (err) {
    console.warn('⚠️ Could not load local clicks:', err);
  }
}

// Cargar checkpoints de GitHub al iniciar
export async function initializeFromCheckpoint() {
  if (checkpointsLoaded) return;
  
  // Siempre intentar cargar del disco primero (por si se reinició NPM RUN DEV)
  loadFromLocalDisk();
  
  try {
    const checkpoint = await loadCheckpointFromGitHub();
    if (checkpoint) {
      // Cargar clicks desde checkpoint
      Object.keys(checkpoint).forEach(key => {
        if (key !== 'lastUpdated' && key !== 'totalCheckpoints') {
          clickCache[key] = Math.max(clickCache[key] || 0, checkpoint[key]);
        }
      });
      totalCheckpoints = checkpoint.totalCheckpoints || 0;
      console.log('📍 Checkpoint loaded. Merged with local state:', clickCache);
      // Sincronizar hacia abajo
      saveToLocalDisk();
    }
  } catch (error) {
    console.warn('Could not load checkpoint, starting fresh:', error);
  }
  
  checkpointsLoaded = true;
}

export function setLastUsedIndex(index: number | undefined) {
  lastUsedIndexCache = index;
}

export function getLastUsedIndex(): number | undefined {
  return lastUsedIndexCache;
}

function pendingTotal(): number {
  return Object.values(pendingDeltas).reduce((sum, n) => sum + n, 0);
}

export async function incrementClicks(linkId: string): Promise<number> {
  clickCache[linkId] = (clickCache[linkId] || 0) + 1;
  pendingDeltas[linkId] = (pendingDeltas[linkId] || 0) + 1;

  // Salvar en disco LOCAL instantáneamente (solo desarrollo)
  saveToLocalDisk();

  if (pendingTotal() >= FLUSH_EVERY) {
    await flushClicks();
  }

  return clickCache[linkId];
}

/**
 * Suma los deltas pendientes sobre el valor que hay en GitHub y los persiste.
 * Si falla, los deltas se conservan para el siguiente intento (no se pierden).
 */
export async function flushClicks(): Promise<boolean> {
  if (pendingTotal() === 0) return true;

  const snapshot = { ...pendingDeltas };

  try {
    const remote = await loadCheckpointFromGitHub();

    const merged: { [k: string]: number } = {};
    if (remote) {
      Object.keys(remote).forEach((k) => {
        if (k !== 'lastUpdated' && k !== 'totalCheckpoints') {
          merged[k] = typeof (remote as any)[k] === 'number' ? (remote as any)[k] : 0;
        }
      });
    }

    // Sumar los incrementos locales sobre el remoto
    Object.keys(snapshot).forEach((k) => {
      merged[k] = (merged[k] || 0) + snapshot[k];
    });

    totalCheckpoints++;
    const ok = await saveCheckpointToGitHub({
      ...merged,
      lastUpdated: Date.now(),
      totalCheckpoints,
    } as any);

    if (!ok) {
      console.warn('⚠️ No se pudo guardar el conteo; se reintentará en el próximo lote');
      return false;
    }

    // Restar solo lo que efectivamente se persistió (pudo llegar más mientras tanto)
    Object.keys(snapshot).forEach((k) => {
      pendingDeltas[k] = (pendingDeltas[k] || 0) - snapshot[k];
      if (pendingDeltas[k] <= 0) delete pendingDeltas[k];
    });

    // El total autoritativo es el remoto ya fusionado
    Object.keys(merged).forEach((k) => {
      clickCache[k] = merged[k];
    });
    saveToLocalDisk();

    return true;
  } catch (error) {
    console.error('❌ Error guardando el conteo de vistas:', error);
    return false;
  }
}

export function getClicks(linkId: string): number {
  return clickCache[linkId] || 0;
}

// Sincronizar cache en memoria con checkpoints de GitHub
export async function syncWithGitHub(): Promise<{ [linkId: string]: number }> {
  try {
    console.log('🔄 Syncing clicks with GitHub checkpoint...');
    console.log('📝 Current memory cache before sync:', { ...clickCache });
    
    const checkpoint = await loadCheckpointFromGitHub();
    
    if (checkpoint) {
      console.log('📁 Checkpoint data from GitHub:', checkpoint);
      
      // Para cada link en el checkpoint, usar el valor mayor entre GitHub y memoria
      Object.keys(checkpoint).forEach(key => {
        if (key !== 'lastUpdated' && key !== 'totalCheckpoints') {
          const githubValue = typeof checkpoint[key] === 'number' ? checkpoint[key] : 0;
          const memoryValue = clickCache[key] || 0;
          
          console.log(`🔍 Comparing ${key}: GitHub=${githubValue}, Memory=${memoryValue}`);
          
          // Usar el mayor valor para no perder clicks recientes
          const maxValue = Math.max(githubValue, memoryValue);
          clickCache[key] = maxValue;
          
          if (githubValue > memoryValue) {
            console.log(`📥 ${key}: Updated from ${memoryValue} to ${githubValue} (from GitHub)`);
          } else if (memoryValue > githubValue) {
            console.log(`📤 ${key}: Keeping ${memoryValue} (memory has more clicks than GitHub)`);
          } else {
            console.log(`⚖️ ${key}: Both equal at ${maxValue}`);
          }
        }
      });
      
      // También agregar cualquier link que esté en memoria pero no en GitHub
      Object.keys(clickCache).forEach(key => {
        if (!(key in checkpoint)) {
          console.log(`✨ ${key}: ${clickCache[key]} clicks (new link, not in GitHub yet)`);
        }
      });
      
      console.log('✅ Sync completed. Final cache:', { ...clickCache });
      return { ...clickCache };
    } else {
      console.log('ℹ️ No checkpoint found in GitHub, using memory cache');
      console.log('📝 Memory cache:', { ...clickCache });
      return { ...clickCache };
    }
  } catch (error) {
    console.error('❌ Error syncing with GitHub:', error);
    console.log('📝 Returning memory cache due to error:', { ...clickCache });
    // En caso de error, retornar cache actual
    return { ...clickCache };
  }
}

/**
 * Fuerza el guardado inmediato de lo pendiente (lo usa el botón "Fijar
 * checkpoint" del admin). El merge con el remoto lo hace flushClicks.
 */
export async function saveCheckpoint() {
  const ok = await flushClicks();
  if (ok) console.log('✅ Checkpoint saved to GitHub');
  return ok;
}

export function resetCache() {
  Object.keys(clickCache).forEach(key => delete clickCache[key]);
  Object.keys(pendingDeltas).forEach(key => delete pendingDeltas[key]);
  lastUsedIndexCache = undefined;
  totalCheckpoints = 0;
  saveToLocalDisk();
}
