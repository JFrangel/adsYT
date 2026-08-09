import { describe, it, expect } from 'vitest';
import * as timers from '@/lib/timers';
import { createSession, completeEntry1, signSession, verifySession } from '@/lib/timers';

describe('sesión simplificada', () => {
  it('createSession inicia sin entry1 completado', () => {
    const s = createSession();
    expect(s.sessionId.length).toBeGreaterThan(0);
    expect(s.entry1Completed).toBe(false);
  });

  it('completeEntry1 marca el paso 1', () => {
    const s = completeEntry1(createSession());
    expect(s.entry1Completed).toBe(true);
  });

  it('sign + verify hacen round-trip', () => {
    const s = completeEntry1(createSession());
    const token = signSession(s);
    const decoded = verifySession(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.sessionId).toBe(s.sessionId);
    expect(decoded!.entry1Completed).toBe(true);
  });

  it('verifySession devuelve null con token inválido', () => {
    expect(verifySession('token-basura')).toBeNull();
  });

  it('la API de heartbeats ya no existe en el módulo', () => {
    expect((timers as any).recordHeartbeat).toBeUndefined();
    expect((timers as any).startAdVisit).toBeUndefined();
    expect((timers as any).getRemainingSeconds).toBeUndefined();
  });
});
