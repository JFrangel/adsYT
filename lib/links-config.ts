import { readJson, writeJson, updateJson, KEYS } from '@/lib/storage';

export interface LinkConfig {
  id: string;
  name: string;
  url: string;
  clicks: number;
  enabled: boolean;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LinksData {
  mode: 'single' | 'alternate';
  links: LinkConfig[];
  /** Índice del último link usado en modo rotación (persistido, no en memoria). */
  lastUsedIndex?: number;
}

const DEFAULT_CONFIG: LinksData = {
  mode: 'single',
  links: [],
  lastUsedIndex: -1,
};

export async function getLinksConfig(): Promise<LinksData> {
  const data = await readJson<LinksData>(KEYS.adLinks, DEFAULT_CONFIG);
  return {
    mode: data.mode || 'single',
    links: data.links || [],
    lastUsedIndex: typeof data.lastUsedIndex === 'number' ? data.lastUsedIndex : -1,
  };
}

/**
 * ¿Hay algún link de anuncio utilizable?
 *
 * Si no lo hay, el paso del anuncio no puede funcionar. En ese caso el sitio
 * deja pasar en vez de bloquear a todo el mundo: un sitio sin monetizar es
 * mejor que un sitio roto. En el admin se avisa de que falta configurarlo.
 */
export async function hasUsableAdLink(): Promise<boolean> {
  const config = await getLinksConfig();
  return config.links.some((link) => link.enabled && link.url);
}

export async function saveLinksConfig(config: LinksData): Promise<boolean> {
  try {
    await writeJson(KEYS.adLinks, config);
    return true;
  } catch (error) {
    console.error('No se pudo guardar la configuración de links:', error);
    return false;
  }
}

/**
 * Suma una vista al link indicado y, si aplica, avanza el índice de rotación.
 * Todo en una sola escritura: antes esto vivía en memoria (se perdía al
 * reciclar el contenedor) y en checkpoints a GitHub cada N clicks.
 */
export async function registerAdView(linkId: string, nextIndex?: number): Promise<number> {
  let updated = 0;

  await updateJson<LinksData>(KEYS.adLinks, DEFAULT_CONFIG, (current) => {
    const links = (current.links || []).map((link) => {
      if (link.id !== linkId) return link;
      updated = (link.clicks || 0) + 1;
      return { ...link, clicks: updated, updatedAt: Date.now() };
    });

    return {
      ...current,
      links,
      lastUsedIndex: typeof nextIndex === 'number' ? nextIndex : current.lastUsedIndex,
    };
  });

  return updated;
}
