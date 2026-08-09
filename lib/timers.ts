import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

export interface SessionProgress {
  sessionId: string;
  entry1Completed: boolean;
}

export function createSession(): SessionProgress {
  return {
    sessionId: Math.random().toString(36).substring(2, 15),
    entry1Completed: false,
  };
}

export function completeEntry1(session: SessionProgress): SessionProgress {
  return { ...session, entry1Completed: true };
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
