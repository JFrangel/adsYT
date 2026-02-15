import type { NextApiRequest, NextApiResponse } from 'next';
import { getClicks, clickCache } from '@/lib/click-cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Debug info sobre clicks
    const debugInfo = {
      memoryCache: { ...clickCache },
      individual: {
        monetag: getClicks('monetag'),
        adsterra: getClicks('adsterra'),
      },
      allKeys: Object.keys(clickCache),
      totalClicksInMemory: Object.values(clickCache).reduce((sum, count) => sum + count, 0),
      cacheRaw: clickCache,
    };

    console.log('🔍 Debug Clicks:', debugInfo);

    return res.status(200).json({
      success: true,
      debug: debugInfo,
      message: 'Check console for detailed logs'
    });
  } catch (error: any) {
    console.error('Error debugging clicks:', error);
    return res.status(500).json({ 
      error: 'Failed to debug clicks',
      details: error.message 
    });
  }
}