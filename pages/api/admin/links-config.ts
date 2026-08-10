import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/auth';
import { getClicks, clickCache, initializeFromCheckpoint } from '@/lib/click-cache';
import { getLinksConfig, saveLinksConfig, LinkConfig, LinksData } from '@/lib/links-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo admin: sin esto cualquiera podía cambiar la URL a la que se redirige
  // a los usuarios (secuestro del tráfico) o borrar los links de monetización.
  try {
    requireAdmin(req);
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }

  if (req.method === 'GET') {
    // Obtener configuración de links
    try {
      // Ensure clicks are loaded from local cache / GitHub if the server just restarted
      await initializeFromCheckpoint();
      
      const config = await getLinksConfig();
      
      console.log('📊 Admin panel requesting links config');
      console.log('📝 Config loaded with mode:', config.mode);
      console.log('📝 Raw config from storage:', config.links.map(l => ({ id: l.id, name: l.name, fileClicks: l.clicks })));
      console.log('📝 Memory cache clicks:', Object.keys(clickCache).reduce((acc, key) => { acc[key] = getClicks(key); return acc; }, {} as any));
      
      // Usar SIEMPRE los clicks del caché en memoria (ya sincronizados)
      config.links = config.links.map(link => {
        const memoryClicks = getClicks(link.id);
        const finalClicks = memoryClicks !== undefined ? memoryClicks : link.clicks;
        console.log(`🔗 ${link.name}: stored=${link.clicks}, memory=${memoryClicks}, final=${finalClicks}`);
        
        return {
          ...link,
          clicks: finalClicks
        };
      });
      
      console.log('✅ Final config returned:', { 
        mode: config.mode, 
        links: config.links.map(l => ({ id: l.id, name: l.name, clicks: l.clicks }))
      });
      
      return res.status(200).json(config);
    } catch (error: any) {
      console.error('❌ Error reading links config:', error);
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
      const config = await getLinksConfig();
      const link = config.links.find(l => l.id === linkId);
      
      if (!link) {
        return res.status(404).json({ error: 'Link not found' });
      }
      
      link.clicks += 1;
      link.updatedAt = Date.now();
      
      const saved = await saveLinksConfig(config);
      if (!saved) {
        console.warn('Click count updated but not persisted');
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
      const config = await getLinksConfig();
      console.log('🔄 Updating links config from:', { currentMode: config.mode, newMode: mode });
      
      // Cambiar modo
      if (mode) {
        config.mode = mode;
        console.log('✅ Mode updated to:', mode);
      }
      
      // Cambiar link activo
      if (activeLink) {
        config.links.forEach(l => {
          l.active = l.id === activeLink;
        });
        console.log('✅ Active link set to:', activeLink);
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
        console.log('✅ New link added:', newLink.name);
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
          console.log('✅ Link edited:', editLink.name || config.links[linkIndex].name);
        }
      }
      
      // Eliminar link
      if (deleteLink) {
        config.links = config.links.filter(l => l.id !== deleteLink);
        // Si se eliminó el link activo, activar el primero
        if (config.links.length > 0 && !config.links.some(l => l.active)) {
          config.links[0].active = true;
        }
        console.log('✅ Link deleted:', deleteLink);
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
        console.log('✅ Mass update of links completed');
      }
      
      const saved = await saveLinksConfig(config);
      if (!saved) {
        console.warn('⚠️ Config updated but not persisted to any storage');
      }
      
      console.log('✅ Links config update completed:', { 
        mode: config.mode, 
        saved,
        message: saved ? 'Saved to GitHub data branch' : 'Could not persist changes'
      });
      
      return res.status(200).json({
        success: true,
        config: config,
        persisted: saved,
      });
    } catch (error: any) {
      console.error('❌ Error updating links config:', error);
      return res.status(500).json({ error: 'Error updating links config' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}