import type { NextApiRequest, NextApiResponse } from 'next';
import { createGitHubService } from '@/lib/github';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const github = createGitHubService();
    
    // Fetch manifest.json from GitHub
    const manifestFile = await github.getFile('manifest.json');
    
    if (!manifestFile) {
      return res.status(200).json({ files: [] });
    }

    // Decode content
    const content = Buffer.from(manifestFile.content, 'base64').toString('utf-8');
    const manifest = JSON.parse(content);

    // Filter visible files only
    const visibleFiles = manifest.files?.filter((f: any) => f.visible !== false) || [];

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
