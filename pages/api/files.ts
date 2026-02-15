import type { NextApiRequest, NextApiResponse } from 'next';
import { createGitHubService, createGitHubDataService } from '@/lib/github';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const github = createGitHubService(); // Para archivos físicos en main
    const githubData = createGitHubDataService(); // Para manifest y stats en data
    
    // Fetch manifest.json from GitHub DATA branch to avoid builds  
    console.log('📋 Getting manifest from data branch to avoid triggering builds...');
    const manifestFile = await githubData.getFile('manifest.json');
    
    if (!manifestFile) {
      return res.status(200).json({ files: [] });
    }

    // Decode manifest content
    const manifestContent = Buffer.from(manifestFile.content, 'base64').toString('utf-8');
    const manifest = JSON.parse(manifestContent);

    // Fetch download stats from data branch
    let downloadStats: any = {};
    try {
      const downloadsFile = await githubData.getFile('downloads-stats.json');
      if (downloadsFile) {
        const statsContent = Buffer.from(downloadsFile.content, 'base64').toString('utf-8');
        downloadStats = JSON.parse(statsContent);
      }
    } catch (statsError) {
      console.log('ℹ️ No download stats found in data branch (first run or not created yet)');
    }

    // Combine manifest data with download stats
    const filesWithStats = manifest.files?.map((file: any) => ({
      ...file,
      downloads: downloadStats[file.id] || file.downloads || 0 // Use data branch stats, fallback to manifest, then 0
    })) || [];

    // Filter visible files only
    const visibleFiles = filesWithStats.filter((f: any) => f.visible !== false);

    console.log('✅ Files served with combined stats from main + data branches');
    return res.status(200).json({ files: visibleFiles });
  } catch (error: any) {
    console.error('Error fetching files:', error);
    
    // Return empty list if manifest doesn't exist yet
    if (error.response?.status === 404) {
      return res.status(200).json({ files: [] });
    }
    
    return res.status(500).json({ error: 'Error fetching files' });
  }
}
