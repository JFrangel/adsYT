import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

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

function getLinksConfig(): LinksData {
  if (!fs.existsSync(configFile)) {
    throw new Error('Links config not found');
  }
  const data = fs.readFileSync(configFile, 'utf-8');
  return JSON.parse(data);
}

function saveLinksConfig(config: LinksData) {
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      const lastIndex = config.lastUsedIndex ?? -1;
      const nextIndex = (lastIndex + 1) % enabledLinks.length;
      selectedLink = enabledLinks[nextIndex];
      
      // Guardar el índice del link usado (relativo a enabledLinks)
      config.lastUsedIndex = nextIndex;
    }

    // Incrementar contador de clics
    const linkInConfig = config.links.find(l => l.id === selectedLink.id);
    if (linkInConfig) {
      linkInConfig.clicks += 1;
      linkInConfig.updatedAt = Date.now();
    }

    // Guardar cambios
    saveLinksConfig(config);

    return res.status(200).json({
      url: selectedLink.url,
      linkId: selectedLink.id,
      linkName: selectedLink.name,
    });
  } catch (error: any) {
    console.error('Error getting redirect link:', error);
    return res.status(500).json({ error: 'Error getting redirect link' });
  }
}
