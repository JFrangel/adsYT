import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { getClicks, incrementClicks, getLastUsedIndex, setLastUsedIndex, initializeFromCheckpoint } from '@/lib/click-cache';

interface LinkConfig {
  id: string;
  name: string;
  url: string;
  clicks: number;
  enabled: boolean;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

interface LinksData {
  links: LinkConfig[];
  mode: 'single' | 'alternate';
  lastUsedIndex?: number;
}

const configFile = path.join(process.cwd(), 'config', 'links.json');

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

function getLinksConfig(): LinksData {
  try {
    if (!fs.existsSync(configFile)) {
      // Configuración por defecto si no existe el archivo
      const defaultConfig: LinksData = {
        mode: 'alternate',
        links: [
          {
            id: 'monetag',
            name: 'Monetag',
            url: 'https://omg10.com/4/9722913',
            clicks: 0,
            enabled: true,
            active: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: 'adsterra',
            name: 'AdSterra',
            url: 'https://www.effectivegatecpm.com/myp26ea7?key=eafcdb4cf323eb02772929a09be0ceb5',
            clicks: 0,
            enabled: true,
            active: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
        ]
      };
      
      // Intentar crear el archivo, pero no fallar si no se puede
      try {
        ensureConfigDir();
        fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2));
      } catch (writeError) {
        console.warn('Could not write default config file (read-only filesystem?):', writeError);
      }
      
      return defaultConfig;
    }
    
    const data = fs.readFileSync(configFile, 'utf-8');
    const config = JSON.parse(data);
    
    // Apply in-memory click counts
    config.links = config.links.map((link: LinkConfig) => ({
      ...link,
      clicks: getClicks(link.id) || link.clicks
    }));
    
    // Apply last used index from cache
    const cachedIndex = getLastUsedIndex();
    if (cachedIndex !== undefined) {
      config.lastUsedIndex = cachedIndex;
    }
    
    return config;
  } catch (error) {
    console.error('Error reading config file:', error);
    // Retornar configuración por defecto si hay error
    return {
      mode: 'alternate',
      links: [
        {
          id: 'monetag',
          name: 'Monetag',
          url: 'https://omg10.com/4/9722913',
          clicks: getClicks('monetag'),
          enabled: true,
          active: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'adsterra',
          name: 'AdSterra',
          url: 'https://www.effectivegatecpm.com/myp26ea7?key=eafcdb4cf323eb02772929a09be0ceb5',
          clicks: getClicks('adsterra'),
          enabled: true,
          active: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      ],
      lastUsedIndex: getLastUsedIndex()
    };
  }
}

function saveLinksConfig(config: LinksData) {
  try {
    ensureConfigDir();
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.warn('Could not save config (read-only filesystem?):', error);
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Inicializar desde checkpoint en el primer request
  await initializeFromCheckpoint();

  try {
    const config = getLinksConfig();
    const enabledLinks = config.links.filter(l => l.enabled);

    if (enabledLinks.length === 0) {
      return res.status(404).json({ error: 'No enabled links found' });
    }

    let selectedLink: LinkConfig;

    if (config.mode === 'single') {
      // Modo single: usa el link marcado como activo
      const activeLink = enabledLinks.find(l => l.active);
      selectedLink = activeLink || enabledLinks[0];
    } else {
      // Modo alternate: alterna entre los links habilitados
      const lastIndex = getLastUsedIndex() ?? -1;
      const nextIndex = (lastIndex + 1) % enabledLinks.length;
      selectedLink = enabledLinks[nextIndex];
      
      // Guardar el índice del link usado en memoria
      setLastUsedIndex(nextIndex);
    }

    // Incrementar contador de clics en memoria
    const currentClicks = await incrementClicks(selectedLink.id);
    
    console.log(`Click tracked for ${selectedLink.name}: ${currentClicks} total clicks`);

    // Intentar guardar cambios en archivo (puede fallar en readonly filesystem)
    try {
      const linkInConfig = config.links.find(l => l.id === selectedLink.id);
      if (linkInConfig) {
        linkInConfig.clicks = getClicks(selectedLink.id);
        linkInConfig.updatedAt = Date.now();
      }
      saveLinksConfig(config);
    } catch (saveError) {
      console.warn('Could not save to file, using in-memory cache only');
    }

    return res.status(200).json({
      url: selectedLink.url,
      linkId: selectedLink.id,
      linkName: selectedLink.name,
    });
  } catch (error: any) {
    console.error('Error getting redirect link:', error);
    
    // Intentar devolver un link por defecto incluso si hay error
    try {
      const fallbackUrl = 'https://omg10.com/4/9722913';
      console.log('Using fallback URL:', fallbackUrl);
      return res.status(200).json({
        url: fallbackUrl,
        linkId: 'monetag',
        linkName: 'Monetag (Fallback)',
      });
    } catch (fallbackError) {
      return res.status(500).json({ 
        error: 'Error getting redirect link',
        details: error.message 
      });
    }
  }
}
