import type { NextApiRequest, NextApiResponse } from 'next';
import { verifySession, resolveAdRedirect, consumeSession, signSession } from '@/lib/timers';
import { readJson, KEYS } from '@/lib/storage';
import { hasUsableAdLink } from '@/lib/links-config';
import type { FileEntry } from '@/pages/api/admin/files';

interface FilesData {
  files: FileEntry[];
}

const EMPTY: FilesData = { files: [] };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.cookies.user_session;
    const session = token ? verifySession(token) : null;

    // El usuario debe haber completado el timer y, si hay anuncio configurado,
    // la visita de 7s. Sin links de anuncio ese paso no existe y exigirlo
    // dejaría el sitio inservible.
    const adRequired = await hasUsableAdLink();
    const adOk = !adRequired || resolveAdRedirect(session ?? ({} as any)).adRedirectCompleted;

    if (!session || !session.entry1Completed || !adOk) {
      return res.status(401).json({ success: false, error: 'Unauthorized', files: [] });
    }

    const data = await readJson<FilesData>(KEYS.files, EMPTY);
    const visibleFiles = (data.files || []).filter((f) => f.visible !== false);

    // Marcar la sesión como usada: refrescar /descargas sigue funcionando, pero
    // al volver a entrar por la home se exigirá repetir el flujo completo.
    if (!session.consumed) {
      const consumed = consumeSession(resolveAdRedirect(session));
      res.setHeader(
        'Set-Cookie',
        `user_session=${signSession(consumed)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`
      );
    }

    return res.status(200).json({ files: visibleFiles });
  } catch (error: any) {
    console.error('Error fetching files:', error.message);
    return res.status(500).json({ error: 'Error fetching files' });
  }
}
