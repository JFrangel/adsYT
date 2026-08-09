import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/auth';
import { createGitHubDataService } from '@/lib/github';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require admin authentication
    requireAdmin(req);
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }

  try {
    console.log('🔄 Syncing download stats from data branch...');
    
    const githubData = createGitHubDataService();
    
    // Load download stats from data branch
    let downloadStats: any = {};
    
    try {
      const downloadsFile = await githubData.getFile('downloads-stats.json');
      if (downloadsFile) {
        const statsContent = Buffer.from(downloadsFile.content, 'base64').toString('utf-8');
        downloadStats = JSON.parse(statsContent);
        
        console.log('✅ Download stats synced from data branch:', downloadStats);
        
        return res.status(200).json({ 
          success: true, 
          downloads: downloadStats,
          message: 'Download stats synchronized from data branch'
        });
      } else {
        console.log('ℹ️ No download stats file found in data branch');
        return res.status(200).json({ 
          success: true, 
          downloads: {},
          message: 'No download stats found in data branch'
        });
      }
    } catch (error) {
      console.error('❌ Error loading download stats from data branch:', error);
      return res.status(500).json({ 
        error: 'Failed to sync download stats from data branch',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
  } catch (error: any) {
    console.error('❌ Error syncing download stats:', error);
    return res.status(500).json({ 
      error: 'Failed to sync download stats',
      details: error.message
    });
  }
}