import type { NextApiRequest, NextApiResponse } from 'next';
import { saveCheckpoint, syncWithGitHub } from '@/lib/click-cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Manual checkpoint requested...');
    await saveCheckpoint();
    
    // Sincronizar después de guardar para asegurar que tenemos los valores correctos
    const clicks = await syncWithGitHub();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Checkpoint saved successfully',
      clicks
    });
  } catch (error: any) {
    console.error('Error saving checkpoint:', error);
    return res.status(500).json({ 
      error: 'Failed to save checkpoint',
      details: error.message 
    });
  }
}
