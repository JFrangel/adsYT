import type { NextApiRequest, NextApiResponse } from 'next';
import { createGitHubService, createGitHubDataService } from '@/lib/github';
import { verifySession, resolveAdRedirect, consumeSession, signSession } from '@/lib/timers';

// Simple memory cache to absorb traffic spikes in serverless
let manifestCache: any = null;
let statsCache: any = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.cookies.user_session;
    const session = token ? verifySession(token) : null;
    
    // El usuario debe haber completado el timer Y la visita al anuncio (7s fuera)
    if (!session || !session.entry1Completed || !resolveAdRedirect(session).adRedirectCompleted) {
      return res.status(401).json({ success: false, error: 'Unauthorized', files: [] });
    }

    // Marcar la sesión como usada: refrescar /descargas sigue funcionando, pero
    // al volver a entrar por la home se exigirá repetir el flujo completo.
    if (!session.consumed) {
      const consumed = consumeSession(resolveAdRedirect(session));
      res.setHeader(
        'Set-Cookie',
        `user_session=${signSession(consumed)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`
      );
    }

    const githubData = createGitHubDataService();
    
    const now = Date.now();
    let manifest;
    let downloadStats: any = {};

    if (manifestCache && statsCache && now - lastCacheTime < CACHE_TTL) {
      console.log('⚡ Using cached manifest and stats');
      manifest = manifestCache;
      downloadStats = statsCache;
    } else {
      console.log('📋 Fetching manifest from GitHub API...');
      const manifestFile = await githubData.getFile('manifest.json');
      if (!manifestFile) {
        return res.status(200).json({ files: [] });
      }
      manifest = JSON.parse(Buffer.from(manifestFile.content, 'base64').toString('utf-8'));
      
      try {
        const downloadsFile = await githubData.getFile('downloads-stats.json');
        if (downloadsFile) {
          downloadStats = JSON.parse(Buffer.from(downloadsFile.content, 'base64').toString('utf-8'));
        }
      } catch (statsError) {
        console.log('ℹ️ No download stats found');
      }

      // Update cache
      manifestCache = manifest;
      statsCache = downloadStats;
      lastCacheTime = now;
    }

    // Combinar manifest con stats de descargas. Solo entradas nuevas (con url de MediaFire).
    const filesWithStats = (manifest.files || [])
      .filter((file: any) => typeof file.url === 'string' && file.url.length > 0)
      .map((file: any) => ({
        id: file.id,
        name: file.name,
        url: file.url,
        size: file.size,
        createdAt: file.createdAt,
        visible: file.visible,
        downloads: downloadStats[file.id] || file.downloads || 0,
      }));

    const visibleFiles = filesWithStats.filter((f: any) => f.visible !== false);

    console.log('✅ Files served with combined stats from main + data branches');
    return res.status(200).json({ files: visibleFiles });
  } catch (error: any) {
    console.error('Error fetching files:', error);
    
    // Return empty list if manifest doesn't exist yet
    if (error.response?.status === 404) {
      return res.status(200).json({ files: [] });
    }
    
    return res.status(500).json({ error: 'Error fetching files' });
  }
}
