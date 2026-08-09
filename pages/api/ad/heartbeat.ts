import type { NextApiRequest, NextApiResponse } from 'next';
import { createSession, startAdVisit, recordHeartbeat, getRemainingSeconds, verifySession, signSession } from '@/lib/timers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { isActive } = req.body;
    
    // Get session from cookie
    const token = req.cookies.user_session;
    let session = token ? verifySession(token) : null;
    
    if (!session) {
      session = createSession();
    }

    // Start ad visit if not started
    if (!session.entry2AdStarted || session.entry2AdStarted === 0) {
      session = startAdVisit(session);
    }

    // Record heartbeat
    session = recordHeartbeat(session, isActive === true);

    // Calculate remaining time using strictly the verified watch time instead of wall clock
    const verifiedSeconds = session.entry2AdSeconds || 0;
    const remaining = Math.max(0, 10 - verifiedSeconds);
    
    // Si ya completó los 10 segundos
    if (remaining === 0) {
      session.entry2Completed = true;
    }
    const newToken = signSession(session);
    // Usamos headers directamente para no depender de librerías externas si no están
    res.setHeader('Set-Cookie', `user_session=${newToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600`);

    return res.status(200).json({
      success: true,
      remaining,
      completed: session.entry2Completed,
      currentSeconds: session.entry2AdSeconds,
      // return sessionId so frontend can sync if needed
      sessionId: session.sessionId
    });
  } catch (error: any) {
    console.error('Heartbeat error:', error);
    return res.status(500).json({ error: error.message });
  }
}
