import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/auth';
import { isValidMediafireUrl } from '@/lib/mediafire';
import { readJson, updateJson, KEYS } from '@/lib/storage';

export interface FileEntry {
  id: string;
  name: string;
  url: string;
  size?: string;
  downloads: number;
  createdAt: string;
  visible: boolean;
}

interface FilesData {
  files: FileEntry[];
}

const EMPTY: FilesData = { files: [] };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Autenticar ANTES de procesar cualquier cosa
  try {
    requireAdmin(req);
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }

  try {
    if (req.method === 'GET') {
      const data = await readJson<FilesData>(KEYS.files, EMPTY);
      return res.status(200).json({ files: data.files || [] });
    }

    if (req.method === 'POST') {
      const { name, url, size } = req.body || {};

      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
      }
      if (typeof url !== 'string' || !isValidMediafireUrl(url)) {
        return res.status(400).json({ error: 'El enlace debe ser de mediafire.com (https)' });
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

      await updateJson<FilesData>(KEYS.files, EMPTY, (current) => ({
        files: [...(current.files || []), newFile],
      }));

      return res.status(200).json({ success: true, file: newFile });
    }

    if (req.method === 'DELETE') {
      const { file } = req.query;
      const fileId = Array.isArray(file) ? file[0] : file;

      if (!fileId) {
        return res.status(400).json({ error: 'File ID required' });
      }

      const before = await readJson<FilesData>(KEYS.files, EMPTY);
      if (!(before.files || []).some((f) => f.id === fileId)) {
        return res.status(404).json({ error: 'File not found' });
      }

      await updateJson<FilesData>(KEYS.files, EMPTY, (current) => ({
        files: (current.files || []).filter((f) => f.id !== fileId),
      }));

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Admin files API error:', error.message);
    return res.status(500).json({ error: 'Error: ' + error.message });
  }
}
