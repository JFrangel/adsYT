import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/auth';
import { createGitHubService, createGitHubDataService } from '@/lib/github';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseForm(req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  const uploadDir = path.join(os.tmpdir(), 'uploads');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  return new Promise((resolve, reject) => {
    try {
      // Formidable v3 API - pass options in constructor
      const form = formidable({
        uploadDir: uploadDir,
        keepExtensions: true,
        maxFileSize: 50 * 1024 * 1024, // 50MB
      });
      
      console.log('📦 Formidable initialized with uploadDir:', uploadDir);
      
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('❌ Form parse error:', err.message);
          reject(err);
          return;
        }
        
        console.log('✅ Form parsed successfully');
        resolve({ fields, files });
      });
    } catch (error) {
      console.error('❌ Formidable init error:', error);
      reject(error);
    }
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔵 Request started:', { method: req.method, url: req.url });
    
    // POST requires auth + form parsing
    // GET/DELETE require auth
    if (req.method === 'POST') {
      console.log('📤 POST request detected, parsing form...');
      console.log('📋 Request headers:', {
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length'],
      });
      
      // Parse form first, then authenticate
      try {
        const { fields, files } = await parseForm(req);
        console.log('✅ Form parsed successfully');
        
        // Now authenticate after form is parsed
        try {
          requireAdmin(req);
        } catch (authError: any) {
          return res.status(401).json({ error: authError.message });
        }

        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;

        console.log('📄 File info:', { 
          file: !!file, 
          name,
          originalFilename: file?.originalFilename,
          fileSize: file?.size,
          filepath: file?.filepath,
        });

        if (!file) {
          console.error('❌ No file uploaded');
          return res.status(400).json({ error: 'No file provided in request' });
        }

        if (!name) {
          console.error('❌ No file name provided');
          return res.status(400).json({ error: 'File name is required' });
        }

        if (!file.originalFilename) {
          console.error('❌ File has no name');
          return res.status(400).json({ error: 'File has no name' });
        }

        if (file.size === 0) {
          console.error('❌ File is empty:', file.originalFilename);
          return res.status(400).json({ error: 'File is empty, please select a file with content' });
        }

        // Read file
        console.log('📖 Reading file from:', file.filepath);
        const fileBuffer = fs.readFileSync(file.filepath);
        
        console.log('📊 File buffer info:', {
          filepath: file.filepath,
          bufferLength: fileBuffer.length,
          bufferType: typeof fileBuffer,
          fileSize: file.size,
          firstBytes: fileBuffer.slice(0, 20).toString('hex'),
        });
        
        if (fileBuffer.length === 0) {
          console.error('❌ File buffer is EMPTY after reading!', {
            filepath: file.filepath,
            reportedSize: file.size,
            actualSize: fileBuffer.length,
          });
          return res.status(400).json({ 
            error: 'File content is empty. Please check your file is not corrupted.' 
          });
        }
        
        if (fileBuffer.length !== file.size) {
          console.warn('⚠️ Buffer size mismatch!', {
            reportedSize: file.size,
            actualSize: fileBuffer.length,
            difference: file.size - fileBuffer.length,
          });
        }
        
        let filename = file.originalFilename || 'unnamed';
        
        // Sanitize filename to avoid GitHub API issues
        filename = filename.replace(/[^a-zA-Z0-9._\-]/g, '_');
        console.log('✅ File read successfully, size:', fileBuffer.length, 'filename:', filename);

        // Clean up temp file immediately after reading
        try {
          fs.unlinkSync(file.filepath);
          console.log('🧹 Temp file cleaned up');
        } catch (cleanupError) {
          console.warn('⚠️ Could not cleanup temp file:', cleanupError);
        }

        const github = createGitHubService();
        const githubData = createGitHubDataService();

        // Upload to GitHub DATA branch (not main) to avoid builds
        console.log('🔧 Uploading to GitHub DATA branch:', `files/${filename}`, 'size:', fileBuffer.length);
        const result = await githubData.uploadFile(
          `files/${filename}`,
          fileBuffer,
          `[DATA] Upload ${filename} [skip ci][skip netlify]`
        );
        
        console.log('✅ GitHub upload response:', {
          hasContent: !!result.content,
          sha: result.content?.sha,
          size: result.content?.size,
        });
        
        if (!result.content || !result.content.sha) {
          console.error('❌ GitHub upload failed - no content/sha in response:', result);
          return res.status(500).json({ 
            error: 'Failed to upload file to GitHub - invalid response' 
          });
        }
        
        console.log('✅ GitHub upload successful to DATA branch, SHA:', result.content.sha);

        // Update manifest in DATA branch to avoid builds
        console.log('📝 Updating manifest in data branch to avoid builds...');
        const manifestFile = await githubData.getFile('manifest.json');
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
        };

        manifest.files = manifest.files || [];
        manifest.files.push(newFile);

        // Update manifest in DATA branch to avoid builds
        await githubData.createOrUpdateFile(
          'manifest.json',
          JSON.stringify(manifest, null, 2),
          `[DATA] Add ${filename} to manifest [skip ci][skip netlify]`,
          manifestFile?.sha
        );

        // Initialize download stats in data branch to avoid Netlify builds
        try {
          console.log('📊 Initializing download stats in data branch to avoid builds...');
          
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
            `[DATA] Initialize download stats for ${filename} [skip ci][skip netlify]`,
            downloadsFile?.sha
          );
          
          console.log('✅ Download stats initialized in data branch');
        } catch (statsError) {
          console.warn('⚠️ Could not initialize download stats in data branch:', statsError);
        }

        return res.status(200).json({ 
          success: true, 
          file: { ...newFile, downloads: 0 }
        });
      } catch (parseError: any) {
        console.error('❌ Form parse error:', {
          code: parseError.code,
          message: parseError.message,
          statusCode: parseError.statusCode,
          stack: parseError.stack,
        });
        
        // Handle specific formidable errors
        if (parseError.code === 'LIMIT_PART_COUNT') {
          return res.status(400).json({ error: 'Too many fields' });
        } else if (parseError.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'File too large (max 50MB)' });
        } else if (parseError.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ error: 'Too many files' });
        } else if (parseError.code === 'LIMIT_FIELD_KEY') {
          return res.status(400).json({ error: 'Field name too long' });
        } else if (parseError.code === 'LIMIT_FIELD_VALUE') {
          return res.status(400).json({ error: 'Field value too long' });
        }
        
        return res.status(400).json({ 
          error: 'Failed to parse form: ' + parseError.message,
          code: parseError.code,
        });
      }
    }

    // For GET and DELETE, authenticate first
    try {
      requireAdmin(req);
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }

    const github = createGitHubService();
    const githubData = createGitHubDataService();

  // GET - List files
  if (req.method === 'GET') {
    try {
      console.log('📋 Getting manifest from data branch for admin panel...');
      const manifestFile = await githubData.getFile('manifest.json');
      
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
      console.error('❌ Get files error:', {
        message: error.message,
        status: error.response?.status,
        stack: error.stack,
      });
      
      if (error.response?.status === 404) {
        return res.status(200).json({ files: [] });
      }
      
      return res.status(500).json({ error: 'Error fetching files: ' + error.message });
    }
  }

  // DELETE - Remove file
  if (req.method === 'DELETE') {
    try {
      const { file } = req.query;

      if (!file) {
        return res.status(400).json({ error: 'File ID required' });
      }

      // Get manifest from DATA branch
      console.log('📝 Getting manifest from data branch...');
      const manifestFile = await githubData.getFile('manifest.json');
      
      if (!manifestFile) {
        return res.status(404).json({ error: 'No files found' });
      }

      const content = Buffer.from(manifestFile.content, 'base64').toString('utf-8');
      const manifest = JSON.parse(content);
      
      const fileItem = manifest.files?.find((f: any) => f.id === file);
      
      if (!fileItem) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Get current SHA from main branch to ensure we have the right version to delete
      console.log('🔍 Getting current file SHA from main branch...');
      let fileExists = true;
      let currentSha = fileItem.sha;
      try {
        const currentFileInfo = await github.getFile(`files/${fileItem.filename}`);
        if (currentFileInfo?.sha) {
          currentSha = currentFileInfo.sha;
          console.log('✅ Current SHA found:', currentSha);
        }
      } catch (shaError: any) {
        if (shaError.response?.status === 404) {
          console.warn('⚠️ File already deleted from GitHub, will just update manifest');
          fileExists = false;
        } else {
          console.warn('⚠️ Error getting SHA:', shaError.message);
          // Use the SHA from manifest anyway
        }
      }

      // Delete from GitHub only if it still exists
      if (fileExists) {
        console.log('🗑️ Deleting file with SHA:', currentSha);
        try {
          await github.deleteFile(
            `files/${fileItem.filename}`,
            currentSha,
            `[DATA] Delete ${fileItem.filename} [skip ci][skip netlify]`
          );
          console.log('✅ File deleted successfully');
        } catch (deleteError: any) {
          if (deleteError.response?.status === 404) {
            console.warn('⚠️ File not found (already deleted), continuing with manifest update');
          } else {
            throw deleteError; // Re-throw other errors
          }
        }
      } else {
        console.log('ℹ️ File already deleted, skipping GitHub deletion');
      }

      // Update manifest in DATA branch to avoid builds (always do this)
      console.log('📝 Updating manifest to remove file...');
      manifest.files = manifest.files.filter((f: any) => f.id !== file);
      
      await githubData.createOrUpdateFile(
        'manifest.json',
        JSON.stringify(manifest, null, 2),
        `[DATA] Remove ${fileItem.filename} from manifest [skip ci][skip netlify]`,
        manifestFile.sha
      );
      console.log('✅ Manifest updated successfully');

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('❌ Delete error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack,
      });
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
      return res.status(500).json({ error: 'Delete failed: ' + errorMsg });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('❌ Unhandled handler error:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
