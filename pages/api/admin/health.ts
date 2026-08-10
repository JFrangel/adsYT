import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/auth';
import { storageHealth } from '@/lib/storage';

/**
 * Diagnóstico del almacenamiento: dice qué backend está en uso y si una
 * escritura + lectura de ida y vuelta funciona de verdad. Sirve para saber por
 * qué el admin "no agrega" sin tener que adivinar.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    requireAdmin(req);
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }

  const health = await storageHealth();

  return res.status(200).json({
    ...health,
    entorno: {
      esNetlify: !!process.env.NETLIFY,
      tieneContextoBlobs: !!process.env.NETLIFY_BLOBS_CONTEXT,
      tieneSiteID: !!(process.env.NETLIFY_SITE_ID || process.env.SITE_ID),
      tieneToken: !!(process.env.NETLIFY_API_TOKEN || process.env.NETLIFY_AUTH_TOKEN),
      nodeEnv: process.env.NODE_ENV,
    },
  });
}
