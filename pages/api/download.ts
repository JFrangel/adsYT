import type { NextApiRequest, NextApiResponse } from 'next';
import { createGitHubService } from '@/lib/github';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { file } = req.query;

  if (!file) {
    return res.status(400).json({ error: 'File ID required' });
  }

  try {
    const github = createGitHubService();
    
    // Get manifest to find file details
    const manifestFile = await github.getFile('manifest.json');
    
    if (!manifestFile) {
      return res.status(404).json({ error: 'No files available' });
    }

    const content = Buffer.from(manifestFile.content, 'base64').toString('utf-8');
    const manifest = JSON.parse(content);
    
    const fileItem = manifest.files?.find((f: any) => f.id === file);
    
    if (!fileItem) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Increment download count if POST request
    if (req.method === 'POST') {
      fileItem.downloads = (fileItem.downloads || 0) + 1;
      
      // Update manifest
      const updatedManifest = JSON.stringify(manifest, null, 2);
      await github.createOrUpdateFile(
        'manifest.json',
        updatedManifest,
        `Update download count for ${fileItem.name}`,
        manifestFile.sha
      );

      return res.status(200).json({ success: true });
    }

    // GET request - redirect to raw GitHub URL
    const rawUrl = github.getRawUrl(`files/${fileItem.filename}`);
    
    // Stream the file from GitHub
    const response = await axios.get(rawUrl, {
      responseType: 'stream',
    });

    // Set headers
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileItem.filename}"`);

    // Pipe the stream
    response.data.pipe(res);
  } catch (error: any) {
    console.error('Download error:', error);
    return res.status(500).json({ error: 'Error downloading file' });
  }
}
