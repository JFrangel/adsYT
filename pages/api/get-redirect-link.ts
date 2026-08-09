import type { NextApiRequest, NextApiResponse } from 'next';
import { getClicks, incrementClicks, getLastUsedIndex, setLastUsedIndex, initializeFromCheckpoint, clickCache } from '@/lib/click-cache';
import { getLinksConfig, LinksData, LinkConfig } from '@/lib/links-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Inicializar desde checkpoint en el primer request
  await initializeFromCheckpoint();

  try {
    // Obtener configuración de links (ahora desde GitHub + fallback local)
    const config = await getLinksConfig();
    
    console.log('🎯 Getting redirect link');
    console.log('📋 Current config mode:', config.mode);
    console.log('📊 Cache state before link selection:', { ...clickCache });
    
    let selectedLink: LinkConfig | null = null;
    
    if (config.mode === 'single') {
      // Modo único: usar el link marcado como activo
      selectedLink = config.links.find(link => link.active && link.enabled) || null;
      
      if (!selectedLink) {
        // Si no hay link activo, usar el primero habilitado
        selectedLink = config.links.find(link => link.enabled) || null;
      }
      
      console.log('🎯 Single mode - selected link:', selectedLink?.name);
      
    } else {
      // Modo alternancia: alternar entre links habilitados
      const enabledLinks = config.links.filter(link => link.enabled);
      
      if (enabledLinks.length === 0) {
        return res.status(500).json({ error: 'No links available' });
      }
      
      if (enabledLinks.length === 1) {
        selectedLink = enabledLinks[0];
        console.log('🎯 Alternate mode - only one link available:', selectedLink.name);
      } else {
        // Obtener índice del último link usado
        let lastIndex = getLastUsedIndex() ?? -1;
        
        // Seleccionar el siguiente link en la lista
        const nextIndex = (lastIndex + 1) % enabledLinks.length;
        selectedLink = enabledLinks[nextIndex];
        
        // Guardar el índice para la próxima vez
        setLastUsedIndex(nextIndex);
        
        console.log('🎯 Alternate mode - rotation:', {
          lastIndex,
          nextIndex,
          selectedLink: selectedLink.name,
          totalEnabled: enabledLinks.length
        });
      }
    }
    
    if (!selectedLink) {
      console.error('❌ No valid link found');
      return res.status(500).json({ error: 'No valid links found' });
    }

    // Incrementar contador de clicks (esto guardará en GitHub cada 1000 clicks)
    await incrementClicks(selectedLink.id);
    
    console.log('✅ Link selected and click tracked:', {
      linkId: selectedLink.id,
      linkName: selectedLink.name,
      newClickCount: getClicks(selectedLink.id),
      url: selectedLink.url
    });
    
    console.log('📊 Cache state after click increment:', { ...clickCache });

    return res.status(200).json({
      url: selectedLink.url,
      linkId: selectedLink.id,
      linkName: selectedLink.name,
      clicks: getClicks(selectedLink.id),
      mode: config.mode,
      message: `Redirecting to ${selectedLink.name}`
    });
    
  } catch (error: any) {
    console.error('❌ Error in get-redirect-link:', error);
    return res.status(500).json({ 
      error: 'Error getting redirect link',
      details: error.message
    });
  }
}