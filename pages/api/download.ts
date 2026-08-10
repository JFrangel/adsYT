import type { NextApiRequest, NextApiResponse } from 'next';
import { updateJson, KEYS } from '@/lib/storage';
import type { FileEntry } from '@/pages/api/admin/files';

interface FilesData {
  files: FileEntry[];
}

const EMPTY: FilesData = { files: [] };

// El archivo no se sirve desde aquí: el navegador abre MediaFire directo.
// Este endpoint solo registra la descarga.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { file } = req.query;
  const fileId = Array.isArray(file) ? file[0] : file;

  if (!fileId) {
    return res.status(400).json({ error: 'File ID required' });
  }

  try {
    let found = false;

    await updateJson<FilesData>(KEYS.files, EMPTY, (current) => ({
      files: (current.files || []).map((f) => {
        if (f.id !== fileId) return f;
        found = true;
        return { ...f, downloads: (f.downloads || 0) + 1 };
      }),
    }));

    if (!found) {
      return res.status(404).json({ error: 'File not found' });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Download tracking error:', error.message);
    return res.status(500).json({ error: 'Error registering download' });
  }
}
