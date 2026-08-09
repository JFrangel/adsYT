import type { NextApiRequest, NextApiResponse } from 'next';
import { clickCache, resetCache, syncWithGitHub } from '@/lib/click-cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.body;

  try {
    if (action === 'reset') {
      // Resetear cache completamente
      const beforeReset = { ...clickCache };
      resetCache();
      
      return res.status(200).json({
        success: true,
        message: 'Cache reset successfully',
        before: beforeReset,
        after: { ...clickCache }
      });
    }
    
    if (action === 'force-sync') {
      // Forzar sincronización sin resetear
      const beforeSync = { ...clickCache };
      const result = await syncWithGitHub();
      
      return res.status(200).json({
        success: true,
        message: 'Force sync completed',
        before: beforeSync,
        after: result
      });
    }

    return res.status(400).json({ 
      error: 'Invalid action. Use "reset" or "force-sync"' 
    });
  } catch (error: any) {
    console.error('Error in cache management:', error);
    return res.status(500).json({ 
      error: 'Failed to manage cache',
      details: error.message 
    });
  }
}