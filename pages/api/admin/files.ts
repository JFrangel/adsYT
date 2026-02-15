import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/auth';
import { createGitHubService, createGitHubDataService } from '@/lib/github';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseForm(req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  const form = formidable({ multiples: false });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Require admin authentication
    requireAdmin(req);
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }

  const github = createGitHubService(); // Para leer/escribir en main
  const githubData = createGitHubDataService(); // Para leer stats desde data

  // GET - List files
  if (req.method === 'GET') {
    try {
      // Get manifest from main branch
      const manifestFile = await github.getFile('manifest.json');
      
      if (!manifestFile) {
        return res.status(200).json({ files: [] });
      }

      const manifestContent = Buffer.from(manifestFile.content, 'base64').toString('utf-8');
      const manifest = JSON.parse(manifestContent);

      // Get download stats from data branch
      let downloadStats: any = {};
      try {
        const downloadsFile = await githubData.getFile('downloads-stats.json');
        if (downloadsFile) {
          const statsContent = Buffer.from(downloadsFile.content, 'base64').toString('utf-8');
          downloadStats = JSON.parse(statsContent);
        }
      } catch (statsError) {
        console.log('ℹ️ No download stats found in data branch for admin panel');
      }

      // Combine manifest data with download stats for admin view
      const filesWithStats = manifest.files?.map((file: any) => ({
        ...file,
        downloads: downloadStats[file.id] || file.downloads || 0
      })) || [];

      return res.status(200).json({ files: filesWithStats });
    } catch (error: any) {
      console.error('Error fetching files:', error);
      
      if (error.response?.status === 404) {
        return res.status(200).json({ files: [] });
      }
      
      return res.status(500).json({ error: 'Error fetching files' });
    }
  }

  // POST - Upload file
  if (req.method === 'POST') {
    try {
      const { fields, files } = await parseForm(req);
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;

      if (!file || !name) {
        return res.status(400).json({ error: 'File and name required' });
      }

      // Check file size (50MB limit)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        return res.status(400).json({ error: 'File too large (max 50MB)' });
      }

      // Read file
      const fileBuffer = fs.readFileSync(file.filepath);
      const filename = file.originalFilename || 'unnamed';

      // Upload to GitHub
      const result = await github.uploadFile(
        `files/${filename}`,
        fileBuffer,
        `Upload ${filename}`
      );

      // Update manifest
      const manifestFile = await github.getFile('manifest.json');
      let manifest: any = { files: [] };
      
      if (manifestFile) {
        const content = Buffer.from(manifestFile.content, 'base64').toString('utf-8');
        manifest = JSON.parse(content);
      }

      const newFile = {
        id: Math.random().toString(36).substring(2, 15),
        name,
        filename,
        size: file.size,
        sha: result.content.sha,
        uploadedAt: new Date().toISOString(),
        visible: true,
        // downloads removed - now tracked in data branch
      };

      manifest.files = manifest.files || [];
      manifest.files.push(newFile);

      // Update manifest in main branch (file info only)
      await github.createOrUpdateFile(
        'manifest.json',
        JSON.stringify(manifest, null, 2),
        `Add ${filename} to manifest`,
        manifestFile?.sha
      );

      // Initialize download stats in data branch to avoid Netlify builds
      try {
        console.log('📊 Initializing download stats in data branch...');
        
        let downloadStats: any = {};
        const downloadsFile = await githubData.getFile('downloads-stats.json');
        if (downloadsFile) {
          const statsContent = Buffer.from(downloadsFile.content, 'base64').toString('utf-8');
          downloadStats = JSON.parse(statsContent);
        }
        
        // Initialize download count for new file
        downloadStats[newFile.id] = 0;
        
        await githubData.createOrUpdateFile(
          'downloads-stats.json',
          JSON.stringify(downloadStats, null, 2),
          `Initialize download stats for ${filename} [skip ci]`,
          downloadsFile?.sha
        );
        
        console.log('✅ Download stats initialized in data branch');
      } catch (statsError) {
        console.warn('⚠️ Could not initialize download stats in data branch:', statsError);
        // Not critical - stats will be created on first download
      }

      return res.status(200).json({ 
        success: true, 
        file: { ...newFile, downloads: 0 } // Add downloads for response
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      return res.status(500).json({ error: 'Upload failed: ' + error.message });
    }
  }

  // DELETE - Remove file
  if (req.method === 'DELETE') {
    try {
      const { file } = req.query;

      if (!file) {
        return res.status(400).json({ error: 'File ID required' });
      }

      // Get manifest
      const manifestFile = await github.getFile('manifest.json');
      
      if (!manifestFile) {
        return res.status(404).json({ error: 'No files found' });
      }

      const content = Buffer.from(manifestFile.content, 'base64').toString('utf-8');
      const manifest = JSON.parse(content);
      
      const fileItem = manifest.files?.find((f: any) => f.id === file);
      
      if (!fileItem) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Delete from GitHub
      await github.deleteFile(
        `files/${fileItem.filename}`,
        fileItem.sha,
        `Delete ${fileItem.filename}`
      );

      // Update manifest
      manifest.files = manifest.files.filter((f: any) => f.id !== file);
      
      await github.createOrUpdateFile(
        'manifest.json',
        JSON.stringify(manifest, null, 2),
        `Remove ${fileItem.filename} from manifest`,
        manifestFile.sha
      );

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Delete error:', error);
      return res.status(500).json({ error: 'Delete failed: ' + error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
