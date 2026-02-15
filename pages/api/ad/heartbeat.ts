import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession, createSession, recordHeartbeat, startAdVisit, getRemainingSeconds } from '@/lib/timers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, isActive } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Get or create session
    let session = getSession(sessionId);
    if (!session) {
      session = createSession();
    }

    // Start ad visit if not started
    if (!session.entry2AdStarted || session.entry2AdStarted === 0) {
      session = startAdVisit(sessionId) || session;
    }

    // Record heartbeat
    session = recordHeartbeat(sessionId, isActive === true) || session;

    // Calculate remaining time
    const remaining = getRemainingSeconds(sessionId, 7);

    return res.status(200).json({
      success: true,
      remaining,
      completed: session.entry2Completed,
      currentSeconds: session.entry2AdSeconds,
    });
  } catch (error: any) {
    console.error('Heartbeat error:', error);
    return res.status(500).json({ error: error.message });
  }
}
