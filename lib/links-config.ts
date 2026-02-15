import fs from 'fs';
import path from 'path';
import { createGitHubDataService } from '@/lib/github';
import { getClicks } from '@/lib/click-cache';

export interface LinkConfig {
  id: string;
  name: string;
  url: string;
  clicks: number;
  enabled: boolean;
  active: boolean; // Si es el link activo por defecto
  createdAt: number;
  updatedAt: number;
}

export interface LinksData {
  links: LinkConfig[];
  mode: 'single' | 'alternate'; // single: usa el link activo, alternate: alterna entre ambos
}

const configFile = path.join(process.cwd(), 'config', 'links.json');

// Crear directorio config si no existe
function ensureConfigDir() {
  const configDir = path.dirname(configFile);
  try {
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  } catch (error) {
    console.warn('Could not create config directory:', error);
  }
}

// Obtener configuración desde GitHub (rama data)
async function getLinksConfigFromGitHub(): Promise<LinksData | null> {
  try {
    const githubData = createGitHubDataService();
    const configFile = await githubData.getFile('links-config.json');
    
    if (configFile) {
      const content = Buffer.from(configFile.content, 'base64').toString('utf-8');
      const config = JSON.parse(content);
      console.log('✅ Links config loaded from GitHub data branch:', { mode: config.mode, linksCount: config.links?.length });
      return config;
    }
    
    return null;
  } catch (error) {
    console.log('ℹ️ No links config found in GitHub data branch:', error);
    return null;
  }
}

// Guardar configuración en GitHub (rama data)
async function saveLinksConfigToGitHub(config: LinksData): Promise<boolean> {
  try {
    const githubData = createGitHubDataService();
    
    // Obtener SHA actual del archivo
    let configSha: string | undefined;
    try {
      const existingFile = await githubData.getFile('links-config.json');
      if (existingFile) {
        configSha = existingFile.sha;
      }
    } catch (error) {
      // Archivo no existe, continuar sin SHA
    }
    
    // Guardar configuración actualizada
    await githubData.createOrUpdateFile(
      'links-config.json',
      JSON.stringify(config, null, 2),
      `[DATA] Update links configuration [skip ci][skip netlify]`,
      configSha
    );
    
    console.log('✅ Links config saved to GitHub data branch to avoid builds');
    return true;
  } catch (error) {
    console.error('❌ Error saving links config to GitHub data branch:', error);
    return false;
  }
}

// Obtener configuración de links (GitHub primero, luego archivo local)
export async function getLinksConfig(): Promise<LinksData> {
  // Intentar obtener desde GitHub primero
  const githubConfig = await getLinksConfigFromGitHub();
  if (githubConfig) {
    // Actualizar clicks desde memoria cache
    githubConfig.links = githubConfig.links.map(link => ({
      ...link,
      clicks: getClicks(link.id) || link.clicks || 0
    }));
    return githubConfig;
  }

  // Fallback al archivo local
  try {
    ensureConfigDir();
    
    if (!fs.existsSync(configFile)) {
      const defaultConfig: LinksData = {
        mode: 'single', // Default a 'single' para nuevas instalaciones
        links: [
          {
            id: 'monetag',
            name: 'Monetag',
            url: 'https://omg10.com/4/9722913',
            clicks: getClicks('monetag') || 0,
            enabled: true,
            active: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: 'adsterra',
            name: 'AdSterra',
            url: 'https://www.effectivegatecpm.com/myp26ea7?key=eafcdb4cf323eb02772929a09be0ceb5',
            clicks: getClicks('adsterra') || 0,
            enabled: true,
            active: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
        ]
      };
      
      // Intentar guardar en GitHub primero
      const githubSaved = await saveLinksConfigToGitHub(defaultConfig);
      
      // También intentar guardar localmente como backup
      try {
        fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2));
      } catch (writeError) {
        console.warn('Could not write default config locally (read-only filesystem):', writeError);
      }
      
      console.log('📋 Created default links config:', { 
        githubSaved, 
        mode: defaultConfig.mode,
        message: githubSaved ? 'Saved to GitHub data branch' : 'Could not save to GitHub' 
      });
      
      return defaultConfig;
    }
    
    const data = fs.readFileSync(configFile, 'utf-8');
    const localConfig = JSON.parse(data);
    
    // Actualizar clicks desde memoria cache
    localConfig.links = localConfig.links.map((link: any) => ({
      ...link,
      clicks: getClicks(link.id) || link.clicks || 0
    }));
    
    console.log('📋 Loaded config from local file (GitHub not available):', { mode: localConfig.mode });
    return localConfig;
    
  } catch (error) {
    console.error('Error reading config, using defaults:', error);
    // Retornar configuración por defecto si hay cualquier error
    return {
      mode: 'single', // Default a 'single'
      links: [
        {
          id: 'monetag',
          name: 'Monetag',
          url: 'https://omg10.com/4/9722913',
          clicks: getClicks('monetag') || 0,
          enabled: true,
          active: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'adsterra',
          name: 'AdSterra',
          url: 'https://www.effectivegatecpm.com/myp26ea7?key=eafcdb4cf323eb02772929a09be0ceb5',
          clicks: getClicks('adsterra') || 0,
          enabled: true,
          active: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      ]
    };
  }
}

// Guardar configuración de links (GitHub primero, luego archivo local)
export async function saveLinksConfig(config: LinksData): Promise<boolean> {
  console.log('💾 Saving links config:', { mode: config.mode, linksCount: config.links?.length });
  
  // Intentar guardar en GitHub primero
  const githubSaved = await saveLinksConfigToGitHub(config);
  
  // También intentar guardar localmente como backup
  let localSaved = false;
  try {
    ensureConfigDir();
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    localSaved = true;
  } catch (error) {
    console.warn('Could not save config locally (read-only filesystem):', error);
  }
  
  console.log('✅ Config save result:', { githubSaved, localSaved });
  return githubSaved || localSaved; // Éxito si al menos uno funcionó
}