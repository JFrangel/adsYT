import type { NextApiRequest, NextApiResponse } from 'next';
import { getLinksConfig, registerAdView, LinkConfig } from '@/lib/links-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const config = await getLinksConfig();
    const enabledLinks = config.links.filter((link) => link.enabled);

    // Sin links configurados no es un error del cliente: se responde 200 con
    // url vacía para que la página lo trate como "no hay anuncio" en vez de
    // quedarse esperando o fallar en silencio.
    if (enabledLinks.length === 0) {
      return res.status(200).json({ url: null, disponible: false });
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

    // La home precarga el link al entrar al paso, antes de que el usuario
    // decida ir. Con ?preview=1 no se cuenta la vista: el conteo lo hace
    // /api/session/ad-visit, que se llama justo al salir hacia el anuncio.
    const esPreview = req.query.preview === '1';
    const clicks = esPreview
      ? selectedLink.clicks
      : await registerAdView(selectedLink.id, nextIndex);

    return res.status(200).json({
      url: selectedLink.url,
      linkId: selectedLink.id,
      linkName: selectedLink.name,
      clicks,
      mode: config.mode,
      disponible: true,
    });
  } catch (error: any) {
    console.error('Error in get-redirect-link:', error.message);
    return res.status(500).json({ error: 'Error getting redirect link' });
  }
}
