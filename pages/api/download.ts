import type { NextApiRequest, NextApiResponse } from 'next';
import { createGitHubService, createGitHubDataService } from '@/lib/github';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { file } = req.query;

  // Ensure file is a string (req.query can be string[])
  const fileId = Array.isArray(file) ? file[0] : file;

  if (!fileId) {
    console.error('❌ No file ID provided');
    return res.status(400).json({ error: 'File ID required' });
  }

  try {
    console.log('🔵 Download request started:', { fileId });
    
    const github = createGitHubService();
    const githubData = createGitHubDataService();
    
    // Get manifest from DATA branch (where files are stored)
    console.log('📋 Fetching manifest.json from DATA branch...');
    const manifestFile = await githubData.getFile('manifest.json');
    
    if (!manifestFile) {
      console.error('❌ Manifest not found in DATA branch');
      return res.status(404).json({ error: 'No files available' });
    }

    const content = Buffer.from(manifestFile.content, 'base64').toString('utf-8');
    const manifest = JSON.parse(content);
    
    console.log('📂 Manifest loaded, total files:', manifest.files?.length || 0);
    console.log('🔍 Looking for file ID:', fileId);
    
    const fileItem = manifest.files?.find((f: any) => f.id === fileId);
    
    if (!fileItem) {
      console.error('❌ File not found in manifest. Available IDs:', manifest.files?.map((f: any) => f.id) || []);
      return res.status(404).json({ error: 'File not found' });
    }

    console.log('✅ File found in manifest:', { filename: fileItem.filename, id: fileId });

    // Increment download count if POST request
    if (req.method === 'POST') {
      console.log('💾 POST request: Attempting to update download stats in data branch... (Best Effort)');
      
      try {
        // Run in background / best-effort locally to not block the user
        let downloadStats: any = {};
        let downloadStatsSha: string | undefined;
        
        const downloadsFile = await githubData.getFile('downloads-stats.json');
        if (downloadsFile) {
          const statsContent = Buffer.from(downloadsFile.content, 'base64').toString('utf-8');
          downloadStats = JSON.parse(statsContent);
          downloadStatsSha = downloadsFile.sha;
        }
        
        downloadStats[fileId] = (downloadStats[fileId] || 0) + 1;
        
        await githubData.createOrUpdateFile(
          'downloads-stats.json',
          JSON.stringify(downloadStats, null, 2),
          `[DATA] Update download stats for ${fileItem.name} [skip ci][skip netlify]`,
          downloadStatsSha
        );
        
        console.log(`✅ Download count updated: ${fileItem.name} now has ${downloadStats[fileId]} downloads`);
      } catch (dataError: any) {
        console.warn('⚠️ Non-critical Error updating download stats in data branch:', dataError.message);
        // We DON'T return 500 here anymore, we let the user proceed!
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Download registered (best effort)' 
      });
    }

    // GET request logic - Redirect directly to GitHub DATA branch
    try {
      console.log('📥 Procuring GitHub download URL for:', fileItem.filename);

      // Get file metadata from DATA branch
      const fileContent = await githubData.getFile(`files/${fileItem.filename}`);

      if (!fileContent) {
        console.error('❌ File object is null/undefined');
        return res.status(404).json({ error: 'File not found in DATA branch' });
      }

      // We use download_url, which safely works for both public and private repos (includes temporary token if private)
      const downloadUrl = fileContent.download_url || githubData.getRawUrl(`files/${fileItem.filename}`);
      if (!downloadUrl) {
        console.error('❌ No download URL available for file');
        return res.status(500).json({ error: 'No download URL available for file' });
      }

      console.log('🔁 Proxying stream from GitHub to protect URL:', downloadUrl);

      try {
        const axios = (await import('axios')).default;
        
        // Safe to stream binary via proxy.
        // DO NOT inject Authorization headers because downloadUrl (from GitHub API) 
        // already contains a temporary ?token= querystring for private repos! 
        // Adding headers causes GitHub's CDN to reject the request with a 400 Bad Request.
        const streamResp = await axios.get(downloadUrl, { responseType: 'stream' });

        // Proxy headers
        const contentLength = streamResp.headers['content-length'];
        const contentType = streamResp.headers['content-type'] || 'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        if (contentLength) res.setHeader('Content-Length', String(contentLength));
        res.setHeader('Content-Disposition', `attachment; filename="${fileItem.filename}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Accept-Ranges', 'bytes');

        // In Next.js API routes, if the handler resolves before the stream finishes, the connection is instantly killed, corrupting the file.
        // We MUST wrap the pipe in a Promise that resolves only when the stream actually finishes.
        return new Promise<void>((resolve) => {
            streamResp.data.pipe(res);
            streamResp.data.on('end', () => {
              console.log('✅ Stream finished for', fileItem.filename);
              resolve();
            });
            streamResp.data.on('error', (err: any) => {
              console.error('❌ Stream error:', err);
              try { res.end(); } catch {};
              resolve();
            });
        });
      } catch (streamError: any) {
        console.error('❌ Streaming error:', streamError?.message || streamError);
        return res.status(500).json({ error: 'Failed to stream file from origin' });
      }

    } catch (downloadError: any) {
      console.error('❌ Metadata fetch error:', {
        filename: fileItem.filename,
        message: downloadError.message,
        status: downloadError.response?.status,
      });

      if (downloadError.response?.status === 404) {
        return res.status(404).json({ error: 'File not found in DATA branch' });
      }

      return res.status(500).json({ error: 'Failed to fetch file metadata: ' + downloadError.message });
    }
  } catch (error: any) {
    console.error('Download error:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Error downloading file: ' + error.message });
  }
}


