import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { readJson, writeJson, updateJson, __setLocalDirForTests } from '@/lib/storage';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'storage-test-'));
  __setLocalDirForTests(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('capa de almacenamiento', () => {
  it('devuelve el valor por defecto cuando la clave no existe', async () => {
    const value = await readJson('inexistente', { files: [] });
    expect(value).toEqual({ files: [] });
  });

  it('escribe y lee de vuelta', async () => {
    await writeJson('archivos', { files: [{ id: 'a', name: 'Uno' }] });
    const value = await readJson<any>('archivos', { files: [] });
    expect(value.files).toHaveLength(1);
    expect(value.files[0].name).toBe('Uno');
  });

  it('sobrescribe el valor anterior', async () => {
    await writeJson('archivos', { files: [{ id: 'a' }] });
    await writeJson('archivos', { files: [] });
    const value = await readJson<any>('archivos', { files: ['sentinela'] });
    expect(value.files).toEqual([]);
  });

  it('updateJson aplica una transformación read-modify-write', async () => {
    await writeJson('contadores', { vistas: 5 });
    const result = await updateJson<any>('contadores', { vistas: 0 }, (actual) => ({
      vistas: actual.vistas + 1,
    }));
    expect(result.vistas).toBe(6);
    expect((await readJson<any>('contadores', { vistas: 0 })).vistas).toBe(6);
  });

  it('updateJson parte del valor por defecto si la clave no existe', async () => {
    const result = await updateJson<any>('nuevo', { vistas: 0 }, (actual) => ({
      vistas: actual.vistas + 1,
    }));
    expect(result.vistas).toBe(1);
  });

  it('no se confunde entre claves distintas', async () => {
    await writeJson('a', { v: 1 });
    await writeJson('b', { v: 2 });
    expect((await readJson<any>('a', { v: 0 })).v).toBe(1);
    expect((await readJson<any>('b', { v: 0 })).v).toBe(2);
  });

  it('un JSON corrupto en disco no rompe la lectura: devuelve el defecto', async () => {
    fs.writeFileSync(path.join(tmpDir, 'roto.json'), '{ esto no es json', 'utf-8');
    const value = await readJson('roto', { ok: true });
    expect(value).toEqual({ ok: true });
  });

  it('incrementos secuenciales no se pisan', async () => {
    for (let i = 0; i < 20; i++) {
      await updateJson<any>('c', { n: 0 }, (actual) => ({ n: actual.n + 1 }));
    }
    expect((await readJson<any>('c', { n: 0 })).n).toBe(20);
  });
});
