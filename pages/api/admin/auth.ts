import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdmin, generateAdminToken, setAuthCookie } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Verify credentials
    if (!verifyAdmin(username, password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateAdminToken(username);

    // Set cookie
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
    });
  } catch (error: any) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
}
