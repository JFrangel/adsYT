import type { NextApiRequest, NextApiResponse } from 'next';
import { createSession, completeEntry1, signSession } from '@/lib/timers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let session = createSession();
    session = completeEntry1(session);
    
    const newToken = signSession(session);
    res.setHeader('Set-Cookie', `user_session=${newToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`);

    return res.status(200).json({ success: true, message: 'Step 1 completed' });
  } catch (error: any) {
    console.error('Session start error:', error);
    return res.status(500).json({ error: error.message });
  }
}
