import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { getClicks, getLastUsedIndex, clickCache } from '@/lib/click-cache';

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
  try {
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  } catch (error) {
    console.warn('Could not create config directory:', error);
  }
}

// Obtener configuración de links
function getLinksConfig(): LinksData {
  try {
    ensureConfigDir();
    
    if (!fs.existsSync(configFile)) {
      const defaultConfig: LinksData = {
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
        ]
      };
      
      try {
        fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2));
      } catch (writeError) {
        console.warn('Could not write default config (read-only filesystem):', writeError);
      }
      
      return defaultConfig;
    }
    
    const data = fs.readFileSync(configFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading config, using defaults:', error);
    // Retornar configuración por defecto si hay cualquier error
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
      ]
    };
  }
}

// Guardar configuración de links
function saveLinksConfig(config: LinksData): boolean {
  try {
    ensureConfigDir();
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.warn('Could not save config (read-only filesystem):', error);
    return false;
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Obtener configuración de links
    try {
      const config = getLinksConfig();
      
      console.log('📊 Admin panel requesting links config');
      console.log('📝 Raw config from file:', config.links.map(l => ({ id: l.id, name: l.name, fileClicks: l.clicks })));
      console.log('📝 Memory cache clicks:', Object.keys(clickCache).reduce((acc, key) => { acc[key] = getClicks(key); return acc; }, {} as any));
      
      // Usar SIEMPRE los clicks del caché en memoria (ya sincronizados)
      config.links = config.links.map(link => {
        const memoryClicks = getClicks(link.id);
        const finalClicks = memoryClicks !== undefined ? memoryClicks : link.clicks;
        console.log(`🔗 ${link.name}: file=${link.clicks}, memory=${memoryClicks}, final=${finalClicks}`);
        
        return {
          ...link,
          clicks: finalClicks
        };
      });
      
      console.log('✅ Final links with clicks:', config.links.map(l => ({ id: l.id, name: l.name, clicks: l.clicks })));
      
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
      
      const saved = saveLinksConfig(config);
      if (!saved) {
        console.warn('Click count updated but not persisted (read-only filesystem)');
      }
      
      return res.status(200).json({
        success: true,
        link: link,
        persisted: saved,
      });
    } catch (error: any) {
      console.error('Error updating click count:', error);
      return res.status(500).json({ error: 'Error updating click count' });
    }
  }
  
  if (req.method === 'PUT') {
    // Actualizar configuración de links
    const { mode, activeLink, links, addLink, editLink, deleteLink } = req.body;
    
    try {
      const config = getLinksConfig();
      
      // Cambiar modo
      if (mode) {
        config.mode = mode;
      }
      
      // Cambiar link activo
      if (activeLink) {
        config.links.forEach(l => {
          l.active = l.id === activeLink;
        });
      }
      
      // Agregar nuevo link
      if (addLink) {
        const newLink: LinkConfig = {
          id: addLink.id || `link_${Date.now()}`,
          name: addLink.name,
          url: addLink.url,
          clicks: 0,
          enabled: true,
          active: config.links.length === 0, // Activo si es el primero
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        config.links.push(newLink);
      }
      
      // Editar link existente
      if (editLink) {
        const linkIndex = config.links.findIndex(l => l.id === editLink.id);
        if (linkIndex !== -1) {
          config.links[linkIndex] = {
            ...config.links[linkIndex],
            name: editLink.name ?? config.links[linkIndex].name,
            url: editLink.url ?? config.links[linkIndex].url,
            updatedAt: Date.now(),
          };
        }
      }
      
      // Eliminar link
      if (deleteLink) {
        config.links = config.links.filter(l => l.id !== deleteLink);
        // Si se eliminó el link activo, activar el primero
        if (config.links.length > 0 && !config.links.some(l => l.active)) {
          config.links[0].active = true;
        }
      }
      
      // Actualización masiva de links
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
      
      const saved = saveLinksConfig(config);
      if (!saved) {
        console.warn('Config updated but not persisted (read-only filesystem)');
      }
      
      return res.status(200).json({
        success: true,
        config: config,
        persisted: saved,
      });
    } catch (error: any) {
      console.error('Error updating links config:', error);
      return res.status(500).json({ error: 'Error updating links config' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
