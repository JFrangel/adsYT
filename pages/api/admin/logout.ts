import type { NextApiRequest, NextApiResponse } from 'next';
import { clearAuthCookie } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    clearAuthCookie(res);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Logout error' });
  }
}
