// In-memory cache for click counts and last used index
// This persists during the server session even on read-only filesystems
// Saves checkpoints to GitHub every 1000 clicks for persistence
import { saveCheckpointToGitHub, loadCheckpointFromGitHub } from './github-storage';

export const clickCache: { [linkId: string]: number } = {};
export let lastUsedIndexCache: number | undefined = undefined;

// Contador de clicks desde el último checkpoint
let clicksSinceCheckpoint = 0;
let totalCheckpoints = 0;
const CHECKPOINT_INTERVAL = 1000; // Guardar cada 1000 clicks

// Bandera para evitar múltiples cargas
let checkpointsLoaded = false;

// Cargar checkpoints de GitHub al iniciar
export async function initializeFromCheckpoint() {
  if (checkpointsLoaded) return;
  
  try {
    const checkpoint = await loadCheckpointFromGitHub();
    if (checkpoint) {
      // Cargar clicks desde checkpoint
      Object.keys(checkpoint).forEach(key => {
        if (key !== 'lastUpdated' && key !== 'totalCheckpoints') {
          clickCache[key] = checkpoint[key];
        }
      });
      totalCheckpoints = checkpoint.totalCheckpoints || 0;
      console.log('📍 Checkpoint loaded. Starting from:', clickCache);
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

export async function incrementClicks(linkId: string): Promise<number> {
  const current = clickCache[linkId] || 0;
  clickCache[linkId] = current + 1;
  clicksSinceCheckpoint++;
  
  // Guardar checkpoint cada 1000 clicks
  if (clicksSinceCheckpoint >= CHECKPOINT_INTERVAL) {
    console.log(`🎯 ${CHECKPOINT_INTERVAL} clicks reached, saving checkpoint...`);
    await saveCheckpoint();
  }
  
  return clickCache[linkId];
}

export function getClicks(linkId: string): number {
  return clickCache[linkId] || 0;
}

export async function saveCheckpoint() {
  try {
    totalCheckpoints++;
    const checkpointData = {
      ...clickCache,
      lastUpdated: Date.now(),
      totalCheckpoints,
    };
    
    const success = await saveCheckpointToGitHub(checkpointData);
    if (success) {
      clicksSinceCheckpoint = 0;
      console.log('✅ Checkpoint saved to GitHub');
    }
  } catch (error) {
    console.error('Error saving checkpoint:', error);
  }
}

export function resetCache() {
  Object.keys(clickCache).forEach(key => delete clickCache[key]);
  lastUsedIndexCache = undefined;
  clicksSinceCheckpoint = 0;
}
