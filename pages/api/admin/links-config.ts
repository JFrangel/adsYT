import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface LinkConfig {
  id: string;
  name: string;
  url: string;
  clicks: number;
  enabled: boolean;
  active: boolean; // Si es el link activo por defecto
  createdAt: number;
  updatedAt: number;
}

interface LinksData {
  links: LinkConfig[];
  mode: 'single' | 'alternate'; // single: usa el link activo, alternate: alterna entre ambos
}

const configFile = path.join(process.cwd(), 'config', 'links.json');

// Crear directorio config si no existe
function ensureConfigDir() {
  const configDir = path.dirname(configFile);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

// Obtener configuración de links
function getLinksConfig(): LinksData {
  ensureConfigDir();
  
  if (!fs.existsSync(configFile)) {
    const defaultConfig: LinksData = {
      mode: 'single',
      links: [
        {
          id: 'monetag',
          name: 'Monetag',
          url: 'https://gizokraijaw.net/vignette.min.js',
          clicks: 0,
          enabled: true,
          active: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'adterra',
          name: 'AdTerra',
          url: 'https://www.effectivegatecpm.com/myp26ea7?key=eafcdb4cf323eb02772929a09be0ceb5',
          clicks: 0,
          enabled: true,
          active: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      ]
    };
    
    fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  
  const data = fs.readFileSync(configFile, 'utf-8');
  return JSON.parse(data);
}

// Guardar configuración de links
function saveLinksConfig(config: LinksData) {
  ensureConfigDir();
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Obtener configuración de links
    try {
      const config = getLinksConfig();
      return res.status(200).json(config);
    } catch (error: any) {
      return res.status(500).json({ error: 'Error reading links config' });
    }
  }
  
  if (req.method === 'POST') {
    // Trackear click en un link
    const { linkId } = req.body;
    
    if (!linkId) {
      return res.status(400).json({ error: 'linkId is required' });
    }
    
    try {
      const config = getLinksConfig();
      const link = config.links.find(l => l.id === linkId);
      
      if (!link) {
        return res.status(404).json({ error: 'Link not found' });
      }
      
      link.clicks += 1;
      link.updatedAt = Date.now();
      
      saveLinksConfig(config);
      
      return res.status(200).json({
        success: true,
        link: link,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error updating click count' });
    }
  }
  
  if (req.method === 'PUT') {
    // Actualizar configuración de links
    const { mode, activeLink, links } = req.body;
    
    try {
      const config = getLinksConfig();
      
      if (mode) {
        config.mode = mode;
      }
      
      if (activeLink) {
        config.links.forEach(l => {
          l.active = l.id === activeLink;
        });
      }
      
      if (links && Array.isArray(links)) {
        config.links = links.map(updatedLink => {
          const existingLink = config.links.find(l => l.id === updatedLink.id);
          return {
            ...existingLink,
            ...updatedLink,
            updatedAt: Date.now(),
          };
        });
      }
      
      saveLinksConfig(config);
      
      return res.status(200).json({
        success: true,
        config: config,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error updating links config' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
