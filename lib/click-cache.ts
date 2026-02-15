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
