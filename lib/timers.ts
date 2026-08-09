import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

export interface SessionProgress {
  sessionId: string;
  entry1Completed: boolean;
  entry2Completed: boolean;
  entry2AdSeconds: number;
  entry2AdStarted: number;
  lastHeartbeat: number;
}

export function createSession(): SessionProgress {
  return {
    sessionId: Math.random().toString(36).substring(2, 15),
    entry1Completed: false,
    entry2Completed: false,
    entry2AdSeconds: 0,
    entry2AdStarted: 0,
    lastHeartbeat: 0,
  };
}

export function signSession(session: SessionProgress): string {
  // Strip out JWT specific claims before re-signing
  const { iat, exp, ...cleanSession } = session as any;
  return jwt.sign(cleanSession, JWT_SECRET, { expiresIn: '1h' });
}

export function verifySession(token: string): SessionProgress | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionProgress;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function completeEntry1(session: SessionProgress): SessionProgress {
  return { ...session, entry1Completed: true };
}

export function startAdVisit(session: SessionProgress): SessionProgress {
  return {
    ...session,
    entry2AdStarted: Date.now(),
    entry2AdSeconds: 0,
    lastHeartbeat: Date.now(),
  };
}

export function recordHeartbeat(session: SessionProgress, isActive: boolean): SessionProgress {
  const now = Date.now();
  const timeSinceLastHeartbeat = now - session.lastHeartbeat;
  
  // Only count time if heartbeat is within reasonable interval (max 2 seconds gap)
  if (isActive && timeSinceLastHeartbeat < 2000 && session.lastHeartbeat > 0) {
    const secondsToAdd = Math.floor(timeSinceLastHeartbeat / 1000);
    const newSeconds = session.entry2AdSeconds + secondsToAdd;
    
    // Check if we've reached the target (7 seconds)
    const entry2Completed = newSeconds >= 7;
    
    return {
      ...session,
      entry2AdSeconds: newSeconds,
      entry2Completed,
      lastHeartbeat: now,
    };
  }
  
  return { ...session, lastHeartbeat: now };
}

export function getRemainingSeconds(session: SessionProgress, targetSeconds: number = 7): number {
  const remaining = targetSeconds - session.entry2AdSeconds;
  return Math.max(0, remaining);
}
