import type { NextApiRequest, NextApiResponse } from 'next';
import { createGitHubService } from '@/lib/github';
import fs from 'fs';
import path from 'path';

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

    // GET request - download file from local storage
    try {
      // Build path to archivos directory
      const archivosDir = path.join(process.cwd(), 'archivos');
      const filePath = path.join(archivosDir, fileItem.filename);
      
      // Security: ensure file path is within archivos directory
      const normalizedPath = path.normalize(filePath);
      if (!normalizedPath.startsWith(archivosDir)) {
        console.error('Security violation: attempted to access file outside archivos directory');
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error('File not found on disk:', fileItem.filename);
        return res.status(404).json({ error: 'File not available for download' });
      }

      // Get file info
      const stats = fs.statSync(filePath);
      
      // Set headers
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileItem.filename}"`);
      res.setHeader('Content-Length', stats.size);

      // Stream file to response
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error reading file' });
        }
      });
    } catch (downloadError: any) {
      console.error('Download error:', {
        filename: fileItem.filename,
        message: downloadError.message,
      });
      return res.status(500).json({ error: 'Failed to download file' });
    }
  } catch (error: any) {
    console.error('Download error:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Error downloading file: ' + error.message });
  }
}


