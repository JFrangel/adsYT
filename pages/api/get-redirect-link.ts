import type { NextApiRequest, NextApiResponse } from 'next';
import { getLinksConfig, registerAdView, LinkConfig } from '@/lib/links-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const config = await getLinksConfig();
    const enabledLinks = config.links.filter((link) => link.enabled);

    if (enabledLinks.length === 0) {
      return res.status(503).json({ error: 'No hay links de anuncio configurados' });
    }

    let selectedLink: LinkConfig;
    let nextIndex: number | undefined;

    if (config.mode === 'single') {
      selectedLink = enabledLinks.find((link) => link.active) || enabledLinks[0];
    } else {
      // Rotación A/B. El índice se persiste junto a la config: guardarlo solo
      // en memoria no rotaba en serverless (cada contenedor empezaba de cero).
      nextIndex = ((config.lastUsedIndex ?? -1) + 1) % enabledLinks.length;
      selectedLink = enabledLinks[nextIndex];
    }

    const clicks = await registerAdView(selectedLink.id, nextIndex);

    return res.status(200).json({
      url: selectedLink.url,
      linkId: selectedLink.id,
      linkName: selectedLink.name,
      clicks,
      mode: config.mode,
    });
  } catch (error: any) {
    console.error('Error in get-redirect-link:', error.message);
    return res.status(500).json({ error: 'Error getting redirect link' });
  }
}
