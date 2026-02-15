import type { NextApiRequest, NextApiResponse } from 'next';
import { createGitHubService } from '@/lib/github';

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

    // GET request - download file from GitHub using API
    try {
      console.log('Fetching file:', `files/${fileItem.filename}`);
      const fileResponse = await github.getFile(`files/${fileItem.filename}`);
      
      if (!fileResponse) {
        console.error('File not found in GitHub:', fileItem.filename);
        return res.status(404).json({ error: 'File not found in repository' });
      }

      // Decode the base64 content from GitHub
      const fileBuffer = Buffer.from(fileResponse.content, 'base64');

      // Set headers
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileItem.filename}"`);
      res.setHeader('Content-Length', fileBuffer.length);

      // Send the file
      res.send(fileBuffer);
    } catch (downloadError: any) {
      console.error('GitHub download error:', {
        filename: fileItem.filename,
        status: downloadError.response?.status,
        message: downloadError.message,
      });
      return res.status(500).json({ error: 'Failed to download file from GitHub' });
    }
  } catch (error: any) {
    console.error('Download error:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Error downloading file: ' + error.message });
  }
}

