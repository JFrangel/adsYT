import { describe, it, expect } from 'vitest';
import * as timers from '@/lib/timers';
import {
  createSession,
  completeEntry1,
  signSession,
  verifySession,
  startAdRedirect,
  resolveAdRedirect,
  AD_REDIRECT_MS,
} from '@/lib/timers';

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

describe('redirect al anuncio (7s fuera)', () => {
  it('startAdRedirect sella el inicio y resetea el completado', () => {
    const s = startAdRedirect(completeEntry1(createSession()));
    expect(s.adRedirectStartedAt).toBeGreaterThan(0);
    expect(s.adRedirectCompleted).toBe(false);
  });

  it('resolveAdRedirect NO completa antes de los 7 segundos', () => {
    const base = startAdRedirect(completeEntry1(createSession()));
    const s = { ...base, adRedirectStartedAt: Date.now() - 3000 };
    expect(resolveAdRedirect(s).adRedirectCompleted).toBe(false);
  });

  it('resolveAdRedirect completa después de los 7 segundos', () => {
    const base = startAdRedirect(completeEntry1(createSession()));
    const s = { ...base, adRedirectStartedAt: Date.now() - (AD_REDIRECT_MS + 1000) };
    expect(resolveAdRedirect(s).adRedirectCompleted).toBe(true);
  });

  it('resolveAdRedirect sin inicio no completa nada', () => {
    const s = completeEntry1(createSession());
    expect(resolveAdRedirect(s).adRedirectCompleted).toBeFalsy();
  });

  it('el estado completado sobrevive el round-trip de firma', () => {
    const base = startAdRedirect(completeEntry1(createSession()));
    const s = resolveAdRedirect({ ...base, adRedirectStartedAt: Date.now() - 8000 });
    const decoded = verifySession(signSession(s));
    expect(decoded!.adRedirectCompleted).toBe(true);
  });
});
