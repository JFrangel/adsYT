import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/auth';
import { createGitHubDataService } from '@/lib/github';
import { isValidMediafireUrl } from '@/lib/mediafire';

interface FileEntry {
  id: string;
  name: string;
  url: string;
  size?: string;
  downloads: number;
  createdAt: string;
  visible: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Autenticar ANTES de procesar cualquier cosa
  try {
    requireAdmin(req);
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }

  const githubData = createGitHubDataService();

  try {
    if (req.method === 'GET') {
      const manifestFile = await githubData.getFile('manifest.json');
      if (!manifestFile) {
        return res.status(200).json({ files: [] });
      }

      const manifest = JSON.parse(Buffer.from(manifestFile.content, 'base64').toString('utf-8'));

      let downloadStats: any = {};
      try {
        const downloadsFile = await githubData.getFile('downloads-stats.json');
        if (downloadsFile) {
          downloadStats = JSON.parse(Buffer.from(downloadsFile.content, 'base64').toString('utf-8'));
        }
      } catch {
        // sin stats aún: todos en 0
      }

      const files: FileEntry[] = (manifest.files || [])
        .filter((f: any) => typeof f.url === 'string' && f.url.length > 0)
        .map((f: any) => ({
          id: f.id,
          name: f.name,
          url: f.url,
          size: f.size,
          createdAt: f.createdAt,
          visible: f.visible !== false,
          downloads: downloadStats[f.id] || f.downloads || 0,
        }));

      return res.status(200).json({ files });
    }

    if (req.method === 'POST') {
      const { name, url, size } = req.body || {};

      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
      }
      if (typeof url !== 'string' || !isValidMediafireUrl(url)) {
        return res.status(400).json({ error: 'El enlace debe ser de mediafire.com (https)' });
      }

      const manifestFile = await githubData.getFile('manifest.json');
      let manifest: any = { files: [] };
      if (manifestFile) {
        manifest = JSON.parse(Buffer.from(manifestFile.content, 'base64').toString('utf-8'));
        manifest.files = manifest.files || [];
      }

      const newFile: FileEntry = {
        id: Math.random().toString(36).substring(2, 15),
        name: name.trim(),
        url: url.trim(),
        size: typeof size === 'string' && size.trim() ? size.trim().slice(0, 30) : undefined,
        downloads: 0,
        createdAt: new Date().toISOString(),
        visible: true,
      };

      manifest.files.push(newFile);

      await githubData.createOrUpdateFile(
        'manifest.json',
        JSON.stringify(manifest, null, 2),
        `[DATA] Add link ${newFile.name} [skip ci][skip netlify]`,
        manifestFile?.sha
      );

      return res.status(200).json({ success: true, file: newFile });
    }

    if (req.method === 'DELETE') {
      const { file } = req.query;
      const fileId = Array.isArray(file) ? file[0] : file;

      if (!fileId) {
        return res.status(400).json({ error: 'File ID required' });
      }

      const manifestFile = await githubData.getFile('manifest.json');
      if (!manifestFile) {
        return res.status(404).json({ error: 'No files found' });
      }

      const manifest = JSON.parse(Buffer.from(manifestFile.content, 'base64').toString('utf-8'));
      const exists = manifest.files?.some((f: any) => f.id === fileId);
      if (!exists) {
        return res.status(404).json({ error: 'File not found' });
      }

      manifest.files = manifest.files.filter((f: any) => f.id !== fileId);

      await githubData.createOrUpdateFile(
        'manifest.json',
        JSON.stringify(manifest, null, 2),
        `[DATA] Remove link ${fileId} [skip ci][skip netlify]`,
        manifestFile.sha
      );

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message || 'Unknown error';
    console.error('Admin files API error:', msg);
    return res.status(500).json({ error: 'Error: ' + msg });
  }
}
