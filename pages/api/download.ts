import type { NextApiRequest, NextApiResponse } from 'next';
import { createGitHubService, createGitHubDataService } from '@/lib/github';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { file } = req.query;

  // Ensure file is a string (req.query can be string[])
  const fileId = Array.isArray(file) ? file[0] : file;

  if (!fileId) {
    return res.status(400).json({ error: 'File ID required' });
  }

  try {
    const github = createGitHubService(); // Para leer archivos desde main
    const githubData = createGitHubDataService(); // Para guardar stats en rama data
    
    // Get manifest from main branch to find file details
    const manifestFile = await github.getFile('manifest.json');
    
    if (!manifestFile) {
      return res.status(404).json({ error: 'No files available' });
    }

    const content = Buffer.from(manifestFile.content, 'base64').toString('utf-8');
    const manifest = JSON.parse(content);
    
    const fileItem = manifest.files?.find((f: any) => f.id === fileId);
    
    if (!fileItem) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Increment download count if POST request
    if (req.method === 'POST') {
      console.log('💾 Updating download stats in data branch to avoid Netlify builds...');
      
      try {
        // Get download stats from data branch
        let downloadStats: any = {};
        let downloadStatsSha: string | undefined;
        
        const downloadsFile = await githubData.getFile('downloads-stats.json');
        if (downloadsFile) {
          const statsContent = Buffer.from(downloadsFile.content, 'base64').toString('utf-8');
          downloadStats = JSON.parse(statsContent);
          downloadStatsSha = downloadsFile.sha;
        }
        
        // Update download count
        downloadStats[fileId] = (downloadStats[fileId] || 0) + 1;
        
        // Save to data branch
        const updatedStats = JSON.stringify(downloadStats, null, 2);
        await githubData.createOrUpdateFile(
          'downloads-stats.json',
          updatedStats,
          `[DATA] Update download stats for ${fileItem.name} [skip ci][skip netlify]`,
          downloadStatsSha
        );
        
        console.log(`✅ Download count updated: ${fileItem.name} now has ${downloadStats[fileId]} downloads`);
        return res.status(200).json({ 
          success: true, 
          downloads: downloadStats[fileId],
          message: 'Saved to data branch - no build triggered' 
        });
        
      } catch (dataError: any) {
        console.error('❌ Error updating download stats in data branch:', dataError);
        
        // No fallback to main - just return error to avoid builds
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to update download stats in data branch',
          details: dataError.message,
          message: 'Download stats not updated to avoid triggering builds'
        });
      }
    }

    // GET request - download file from local storage
    try {
      // Build path to files directory
      const filesDir = path.join(process.cwd(), 'files');
      const filePath = path.join(filesDir, fileItem.filename);
      
      // Security: ensure file path is within files directory
      const normalizedPath = path.normalize(filePath);
      if (!normalizedPath.startsWith(filesDir)) {
        console.error('Security violation: attempted to access file outside files directory');
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


