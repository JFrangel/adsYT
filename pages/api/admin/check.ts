import type { NextApiRequest, NextApiResponse } from 'next';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = getTokenFromRequest(req);
    
    if (!token) {
      return res.status(200).json({ authenticated: false });
    }

    const payload = verifyToken(token);

    if (!payload || payload.role !== 'admin') {
      return res.status(200).json({ authenticated: false });
    }

    return res.status(200).json({
      authenticated: true,
      username: payload.username,
    });
  } catch (error) {
    return res.status(200).json({ authenticated: false });
  }
}
