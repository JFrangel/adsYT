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
      console.log('💾 POST request: Updating download stats in data branch...');
      
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

      // Download file from GitHub DATA branch (works on both local and serverless)
    try {
      console.log('📥 Downloading file from GitHub DATA branch:', fileItem.filename);
      console.log('🔍 Looking for file at path: files/' + fileItem.filename);

      // Get file metadata from DATA branch
      const fileContent = await githubData.getFile(`files/${fileItem.filename}`);

      console.log('📦 File metadata retrieved from GitHub:', {
        hasContentProperty: !!fileContent?.content,
        download_url: fileContent?.download_url,
        sha: fileContent?.sha,
        size: fileContent?.size,
      });

      if (!fileContent) {
        console.error('❌ File object is null/undefined');
        return res.status(404).json({ error: 'File not found in DATA branch' });
      }

      // If content is present (small files) decode and send
      if (fileContent.content) {
        try {
          const fileBuffer = Buffer.from(fileContent.content, 'base64');

          if (fileBuffer.length === 0) {
            console.error('❌ Decoded file is EMPTY!', { filename: fileItem.filename });
            return res.status(500).json({ error: 'File content is empty after decoding' });
          }

          // Critical headers for reliable downloads
          res.setHeader('Content-Type', 'application/octet-stream');
          res.setHeader('Content-Length', String(fileBuffer.length));
          res.setHeader('Content-Disposition', `attachment; filename="${fileItem.filename}"`);
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('Accept-Ranges', 'bytes');

          console.log('✅ Sending decoded buffer, bytes:', fileBuffer.length);
          res.write(fileBuffer);
          res.end();
          return;
        } catch (decodeError: any) {
          console.error('❌ Base64 decode error:', decodeError);
          return res.status(500).json({ error: 'Failed to decode file content' });
        }
      }

      // For large files GitHub may not include 'content' — stream from download_url instead
      const downloadUrl = fileContent.download_url || githubData.getRawUrl(`files/${fileItem.filename}`);
      if (!downloadUrl) {
        console.error('❌ No download URL available for file');
        return res.status(500).json({ error: 'No download URL available for file' });
      }

      console.log('🔁 Streaming file from:', downloadUrl);

      try {
        const axios = (await import('axios')).default;
        const streamResp = await axios.get(downloadUrl, {
          responseType: 'stream',
          headers: githubData ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN || ''}` } : undefined,
        });

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

        streamResp.data.pipe(res);
        streamResp.data.on('end', () => {
          console.log('✅ Stream finished for', fileItem.filename);
        });
        streamResp.data.on('error', (err: any) => {
          console.error('❌ Stream error:', err);
          try { res.end(); } catch {};
        });
        return;
      } catch (streamError: any) {
        console.error('❌ Streaming error:', streamError?.message || streamError);
        return res.status(500).json({ error: 'Failed to stream file: ' + (streamError?.message || streamError) });
      }
    } catch (downloadError: any) {
      console.error('❌ Download error:', {
        filename: fileItem.filename,
        message: downloadError.message,
        status: downloadError.response?.status,
      });

      if (downloadError.response?.status === 404) {
        return res.status(404).json({ error: 'File not found in DATA branch' });
      }

      return res.status(500).json({ error: 'Failed to download file: ' + downloadError.message });
    }
  } catch (error: any) {
    console.error('Download error:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Error downloading file: ' + error.message });
  }
}


