import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mockear la capa de GitHub: el test valida el CONTRATO de persistencia,
// no la red.
vi.mock('@/lib/github-storage', () => ({
  saveCheckpointToGitHub: vi.fn().mockResolvedValue(true),
  loadCheckpointFromGitHub: vi.fn().mockResolvedValue(null),
}));

import {
  incrementClicks,
  getClicks,
  resetCache,
  flushClicks,
  FLUSH_EVERY,
} from '@/lib/click-cache';
import { saveCheckpointToGitHub, loadCheckpointFromGitHub } from '@/lib/github-storage';

describe('conteo de vistas', () => {
  beforeEach(() => {
    resetCache();
    vi.mocked(saveCheckpointToGitHub).mockReset().mockResolvedValue(true);
    vi.mocked(loadCheckpointFromGitHub).mockReset().mockResolvedValue(null);
  });

  it('incrementClicks suma en memoria de inmediato', async () => {
    await incrementClicks('monetag');
    await incrementClicks('monetag');
    expect(getClicks('monetag')).toBe(2);
  });

  it('NO escribe a GitHub en cada vista (evita agotar el rate limit)', async () => {
    await incrementClicks('monetag');
    expect(saveCheckpointToGitHub).not.toHaveBeenCalled();
  });

  it(`escribe a GitHub al acumular ${FLUSH_EVERY} vistas`, async () => {
    for (let i = 0; i < FLUSH_EVERY; i++) await incrementClicks('monetag');
    expect(saveCheckpointToGitHub).toHaveBeenCalledTimes(1);
  });

  it('SUMA sobre el valor remoto en vez de sobrescribirlo (no pierde clicks de otros contenedores)', async () => {
    vi.mocked(loadCheckpointFromGitHub).mockResolvedValue({
      monetag: 100,
      lastUpdated: 1,
      totalCheckpoints: 1,
    } as any);

    await incrementClicks('monetag');
    await incrementClicks('monetag');
    await flushClicks();

    const payload = vi.mocked(saveCheckpointToGitHub).mock.calls[0][0] as any;
    expect(payload.monetag).toBe(102);
  });

  it('si el guardado falla, los deltas NO se pierden y se reintentan luego', async () => {
    vi.mocked(saveCheckpointToGitHub).mockResolvedValueOnce(false);
    await incrementClicks('monetag');
    await flushClicks();
    expect(getClicks('monetag')).toBe(1);

    vi.mocked(saveCheckpointToGitHub).mockResolvedValue(true);
    await flushClicks();
    const lastCall = vi.mocked(saveCheckpointToGitHub).mock.calls.at(-1)![0] as any;
    expect(lastCall.monetag).toBe(1);
  });

  it('un flush sin deltas pendientes no llama a GitHub', async () => {
    await flushClicks();
    expect(saveCheckpointToGitHub).not.toHaveBeenCalled();
  });
});
