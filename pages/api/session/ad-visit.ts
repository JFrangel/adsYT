import type { NextApiRequest, NextApiResponse } from 'next';
import { verifySession, startAdRedirect, signSession } from '@/lib/timers';
import { registerAdView } from '@/lib/links-config';

// Sella el momento en que el usuario sale hacia el anuncio (paso intermedio)
// y cuenta la vista. El conteo va aquí y no en get-redirect-link porque ese
// se precarga al entrar al paso, antes de que el usuario decida ir.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.cookies.user_session;
    const session = token ? verifySession(token) : null;

    if (!session || !session.entry1Completed) {
      return res.status(401).json({ success: false, error: 'Completa el paso 1 primero' });
    }

    const updated = startAdRedirect(session);
    const newToken = signSession(updated);
    res.setHeader('Set-Cookie', `user_session=${newToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`);

    // Best-effort: si el contador falla, el usuario no debe quedarse atascado
    const { linkId } = req.body || {};
    if (typeof linkId === 'string' && linkId) {
      try {
        await registerAdView(linkId);
      } catch (error: any) {
        console.warn('No se pudo contar la vista del anuncio:', error.message);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Ad visit error:', error);
    return res.status(500).json({ error: error.message });
  }
}
