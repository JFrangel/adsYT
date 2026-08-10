import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/auth';
import { getLinksConfig, saveLinksConfig, LinkConfig } from '@/lib/links-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo admin: sin esto cualquiera podía cambiar la URL a la que se redirige
  // a los usuarios (secuestro del tráfico) o borrar los links de monetización.
  try {
    requireAdmin(req);
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json(await getLinksConfig());
    }

    if (req.method === 'PUT') {
      const { mode, activeLink, links, addLink, editLink, deleteLink } = req.body || {};
      const config = await getLinksConfig();

      if (mode === 'single' || mode === 'alternate') {
        config.mode = mode;
      }

      if (activeLink) {
        config.links = config.links.map((l) => ({ ...l, active: l.id === activeLink }));
      }

      if (addLink?.name && addLink?.url) {
        const newLink: LinkConfig = {
          id: addLink.id || `link_${Date.now()}`,
          name: String(addLink.name),
          url: String(addLink.url),
          clicks: 0,
          enabled: true,
          active: config.links.length === 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        config.links = [...config.links, newLink];
      }

      if (editLink?.id) {
        config.links = config.links.map((l) =>
          l.id === editLink.id
            ? {
                ...l,
                name: editLink.name ?? l.name,
                url: editLink.url ?? l.url,
                updatedAt: Date.now(),
              }
            : l
        );
      }

      if (deleteLink) {
        config.links = config.links.filter((l) => l.id !== deleteLink);
        if (config.links.length > 0 && !config.links.some((l) => l.active)) {
          config.links[0].active = true;
        }
      }

      if (Array.isArray(links)) {
        // Actualización masiva: se conserva el contador de cada link existente
        config.links = links.map((updated: any) => {
          const existing = config.links.find((l) => l.id === updated.id);
          return { ...existing, ...updated, clicks: existing?.clicks ?? 0, updatedAt: Date.now() };
        });
      }

      const saved = await saveLinksConfig(config);
      return res.status(saved ? 200 : 500).json({ success: saved, config });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error updating links config:', error.message);
    return res.status(500).json({ error: 'Error updating links config' });
  }
}
