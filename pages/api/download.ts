import type { NextApiRequest, NextApiResponse } from 'next';
import { createGitHubDataService } from '@/lib/github';

// El archivo ya no se sirve desde aquí: el navegador abre MediaFire directo.
// Este endpoint solo registra la descarga (best-effort).
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
    const githubData = createGitHubDataService();

    const manifestFile = await githubData.getFile('manifest.json');
    if (!manifestFile) {
      return res.status(404).json({ error: 'No files available' });
    }

    const manifest = JSON.parse(Buffer.from(manifestFile.content, 'base64').toString('utf-8'));
    const fileItem = manifest.files?.find((f: any) => f.id === fileId);

    if (!fileItem) {
      return res.status(404).json({ error: 'File not found' });
    }

    try {
      let downloadStats: any = {};
      let downloadStatsSha: string | undefined;

      const downloadsFile = await githubData.getFile('downloads-stats.json');
      if (downloadsFile) {
        downloadStats = JSON.parse(Buffer.from(downloadsFile.content, 'base64').toString('utf-8'));
        downloadStatsSha = downloadsFile.sha;
      }

      downloadStats[fileId] = (downloadStats[fileId] || 0) + 1;

      await githubData.createOrUpdateFile(
        'downloads-stats.json',
        JSON.stringify(downloadStats, null, 2),
        `[DATA] Update download stats for ${fileItem.name} [skip ci][skip netlify]`,
        downloadStatsSha
      );
    } catch (statsError: any) {
      // Best-effort: no bloquear al usuario si el contador falla
      console.warn('No se pudo actualizar el contador de descargas:', statsError.message);
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Download tracking error:', error.message);
    return res.status(500).json({ error: 'Error registering download' });
  }
}
