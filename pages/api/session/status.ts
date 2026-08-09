import type { NextApiRequest, NextApiResponse } from 'next';
import { verifySession, resolveAdRedirect, signSession, AD_REDIRECT_MS } from '@/lib/timers';

// Estado actual de la sesión. Si ya pasaron los 7s desde la salida al anuncio,
// marca el paso como completado y re-firma la cookie.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.cookies.user_session;
    const session = token ? verifySession(token) : null;

    if (!session) {
      return res.status(200).json({ entry1Completed: false, adCompleted: false });
    }

    // Sesión de un solo uso: si el usuario ya llegó a ver los archivos y vuelve
    // a entrar por la home, se descarta y debe repetir timer + anuncio.
    if (session.consumed) {
      res.setHeader('Set-Cookie', 'user_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
      return res.status(200).json({ entry1Completed: false, adCompleted: false, reset: true });
    }

    const updated = resolveAdRedirect(session);

    if (updated.adRedirectCompleted && !session.adRedirectCompleted) {
      const newToken = signSession(updated);
      res.setHeader('Set-Cookie', `user_session=${newToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`);
    }

    const remainingMs = updated.adRedirectStartedAt && !updated.adRedirectCompleted
      ? Math.max(0, AD_REDIRECT_MS - (Date.now() - updated.adRedirectStartedAt))
      : 0;

    return res.status(200).json({
      entry1Completed: !!updated.entry1Completed,
      adCompleted: !!updated.adRedirectCompleted,
      remainingMs,
    });
  } catch (error: any) {
    console.error('Session status error:', error);
    return res.status(500).json({ error: error.message });
  }
}
