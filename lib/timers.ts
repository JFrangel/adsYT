import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

export interface SessionProgress {
  sessionId: string;
  entry1Completed: boolean;
  adRedirectStartedAt?: number;
  adRedirectCompleted?: boolean;
}

/** Tiempo mínimo (ms) que el usuario debe permanecer fuera, en el anuncio. */
export const AD_REDIRECT_MS = 7000;

export function createSession(): SessionProgress {
  return {
    sessionId: Math.random().toString(36).substring(2, 15),
    entry1Completed: false,
  };
}

export function completeEntry1(session: SessionProgress): SessionProgress {
  return { ...session, entry1Completed: true };
}

/** Sella el momento en que el usuario salió hacia el anuncio. */
export function startAdRedirect(session: SessionProgress): SessionProgress {
  return { ...session, adRedirectStartedAt: Date.now(), adRedirectCompleted: false };
}

/**
 * Marca el paso como completado si ya pasaron `requiredMs` desde la salida.
 * La validación es server-side: el cliente no puede fabricar el sello.
 */
export function resolveAdRedirect(
  session: SessionProgress,
  requiredMs: number = AD_REDIRECT_MS
): SessionProgress {
  if (session.adRedirectCompleted) return session;
  if (session.adRedirectStartedAt && Date.now() - session.adRedirectStartedAt >= requiredMs) {
    return { ...session, adRedirectCompleted: true };
  }
  return session;
}

export function signSession(session: SessionProgress): string {
  // Quitar claims propios de JWT antes de re-firmar
  const { iat, exp, ...cleanSession } = session as any;
  return jwt.sign(cleanSession, JWT_SECRET, { expiresIn: '1h' });
}

export function verifySession(token: string): SessionProgress | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionProgress;
  } catch {
    return null;
  }
}
