import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mockear la capa de GitHub: el test valida el CONTRATO de persistencia,
// no la red.
vi.mock('@/lib/github-storage', () => ({
  saveCheckpointToGitHub: vi.fn().mockResolvedValue(true),
  loadCheckpointFromGitHub: vi.fn().mockResolvedValue(null),
}));

import { incrementClicks, getClicks, resetCache, clickCache } from '@/lib/click-cache';
import { saveCheckpointToGitHub } from '@/lib/github-storage';

describe('conteo de vistas confiable', () => {
  beforeEach(() => {
    resetCache();
    vi.mocked(saveCheckpointToGitHub).mockClear();
  });

  it('incrementClicks suma en memoria', async () => {
    await incrementClicks('monetag');
    await incrementClicks('monetag');
    expect(getClicks('monetag')).toBe(2);
  });

  it('CADA vista se persiste a GitHub (no cada 1000)', async () => {
    await incrementClicks('monetag');
    expect(saveCheckpointToGitHub).toHaveBeenCalledTimes(1);
    await incrementClicks('monetag');
    expect(saveCheckpointToGitHub).toHaveBeenCalledTimes(2);
  });

  it('el checkpoint incluye el conteo actual', async () => {
    await incrementClicks('monetag');
    const payload = vi.mocked(saveCheckpointToGitHub).mock.calls[0][0] as any;
    expect(payload.monetag).toBe(1);
    expect(payload.lastUpdated).toBeGreaterThan(0);
  });

  it('si GitHub falla, reintenta una vez', async () => {
    vi.mocked(saveCheckpointToGitHub)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    await incrementClicks('monetag');
    expect(saveCheckpointToGitHub).toHaveBeenCalledTimes(2);
    expect(getClicks('monetag')).toBe(1);
  });
});
