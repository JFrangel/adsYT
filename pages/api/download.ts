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
      
      // Get file from DATA branch
      const fileContent = await githubData.getFile(`files/${fileItem.filename}`);
      
      if (!fileContent) {
        console.error('File not found in DATA branch:', fileItem.filename);
        return res.status(404).json({ error: 'File not available for download' });
      }

      // Decode base64 content from GitHub
      const fileBuffer = Buffer.from(fileContent.content, 'base64');
      
      console.log('📦 File prepared:', {
        filename: fileItem.filename,
        size: fileBuffer.length,
        method: req.method
      });
      
      // Critical headers for reliable downloads
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', String(fileBuffer.length));
      res.setHeader('Content-Disposition', `attachment; filename="${fileItem.filename}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Extra headers for mobile compatibility
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Accept-Ranges', 'bytes');
      
      console.log('✅ Headers set, sending file buffer');
      
      // Send file
      res.end(fileBuffer);
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


