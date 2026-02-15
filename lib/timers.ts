export interface SessionProgress {
  sessionId: string;
  entry1Completed: boolean;
  entry2Completed: boolean;
  entry2AdSeconds: number;
  entry2AdStarted: number;
  lastHeartbeat: number;
}

// In-memory store for demo purposes
// In production, use Redis or a database
const sessionsStore = new Map<string, SessionProgress>();

export function createSession(): SessionProgress {
  const sessionId = Math.random().toString(36).substring(2, 15);
  const session: SessionProgress = {
    sessionId,
    entry1Completed: false,
    entry2Completed: false,
    entry2AdSeconds: 0,
    entry2AdStarted: 0,
    lastHeartbeat: 0,
  };
  
  sessionsStore.set(sessionId, session);
  return session;
}

export function getSession(sessionId: string): SessionProgress | null {
  return sessionsStore.get(sessionId) || null;
}

export function updateSession(sessionId: string, updates: Partial<SessionProgress>): SessionProgress | null {
  const session = sessionsStore.get(sessionId);
  if (!session) return null;
  
  const updated = { ...session, ...updates };
  sessionsStore.set(sessionId, updated);
  return updated;
}

export function completeEntry1(sessionId: string): SessionProgress | null {
  return updateSession(sessionId, { entry1Completed: true });
}

export function startAdVisit(sessionId: string): SessionProgress | null {
  return updateSession(sessionId, {
    entry2AdStarted: Date.now(),
    entry2AdSeconds: 0,
    lastHeartbeat: Date.now(),
  });
}

export function recordHeartbeat(sessionId: string, isActive: boolean): SessionProgress | null {
  const session = getSession(sessionId);
  if (!session) return null;
  
  const now = Date.now();
  const timeSinceLastHeartbeat = now - session.lastHeartbeat;
  
  // Only count time if heartbeat is within reasonable interval (max 2 seconds gap)
  if (isActive && timeSinceLastHeartbeat < 2000 && session.lastHeartbeat > 0) {
    const secondsToAdd = Math.floor(timeSinceLastHeartbeat / 1000);
    const newSeconds = session.entry2AdSeconds + secondsToAdd;
    
    // Check if we've reached the target (7 seconds)
    const entry2Completed = newSeconds >= 7;
    
    return updateSession(sessionId, {
      entry2AdSeconds: newSeconds,
      entry2Completed,
      lastHeartbeat: now,
    });
  }
  
  return updateSession(sessionId, { lastHeartbeat: now });
}

export function getRemainingSeconds(sessionId: string, targetSeconds: number = 7): number {
  const session = getSession(sessionId);
  if (!session) return targetSeconds;
  
  const remaining = targetSeconds - session.entry2AdSeconds;
  return Math.max(0, remaining);
}

export function isEntry2Completed(sessionId: string): boolean {
  const session = getSession(sessionId);
  return session?.entry2Completed || false;
}

// Cleanup old sessions (call periodically)
export function cleanupOldSessions(): void {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [sessionId, session] of sessionsStore.entries()) {
    if (now - session.lastHeartbeat > maxAge) {
      sessionsStore.delete(sessionId);
    }
  }
}
