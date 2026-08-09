import { describe, it, expect } from 'vitest';
import { isValidMediafireUrl } from '@/lib/mediafire';

describe('isValidMediafireUrl', () => {
  it('acepta URL estándar con www', () => {
    expect(isValidMediafireUrl('https://www.mediafire.com/file/abc123/juego.zip/file')).toBe(true);
  });

  it('acepta URL sin www', () => {
    expect(isValidMediafireUrl('https://mediafire.com/file/abc123/juego.zip/file')).toBe(true);
  });

  it('acepta subdominios de mediafire.com (mirrors de descarga)', () => {
    expect(isValidMediafireUrl('https://download1591.mediafire.com/xyz/archivo.apk')).toBe(true);
  });

  it('acepta URL con espacios alrededor (se recorta)', () => {
    expect(isValidMediafireUrl('  https://www.mediafire.com/file/abc/x.zip/file  ')).toBe(true);
  });

  it('rechaza http (sin TLS)', () => {
    expect(isValidMediafireUrl('http://www.mediafire.com/file/abc/x.zip/file')).toBe(false);
  });

  it('rechaza otros dominios', () => {
    expect(isValidMediafireUrl('https://mega.nz/file/abc123')).toBe(false);
  });

  it('rechaza dominios que solo contienen la palabra mediafire', () => {
    expect(isValidMediafireUrl('https://evilmediafire.com/file/abc')).toBe(false);
    expect(isValidMediafireUrl('https://mediafire.com.evil.io/file/abc')).toBe(false);
  });

  it('rechaza texto que no es URL y vacío', () => {
    expect(isValidMediafireUrl('no soy una url')).toBe(false);
    expect(isValidMediafireUrl('')).toBe(false);
  });
});
