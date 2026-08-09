/**
 * Valida que un enlace sea de MediaFire (https + host mediafire.com,
 * www.mediafire.com o cualquier subdominio *.mediafire.com).
 */
export function isValidMediafireUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return false;
  }

  if (url.protocol !== 'https:') return false;

  const host = url.hostname.toLowerCase();
  return host === 'mediafire.com' || host.endsWith('.mediafire.com');
}
