import type { NextApiRequest, NextApiResponse } from 'next';
import { syncWithGitHub } from '@/lib/click-cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Sync clicks requested from admin panel...');
    const updatedClicks = await syncWithGitHub();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Clicks synchronized with GitHub',
      clicks: updatedClicks
    });
  } catch (error: any) {
    console.error('Error syncing clicks:', error);
    return res.status(500).json({ 
      error: 'Failed to sync clicks',
      details: error.message 
    });
  }
}
