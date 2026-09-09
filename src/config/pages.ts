/**
 * Plan du site (périmètre v2, 08/09/2026) : quatre pages publiques + pages légales.
 * Le menu du Header suit `order` ; `inMenu` exclut les pages légales.
 */
export type PageKey = 'home' | 'fees' | 'documentation' | 'press' | 'legal' | 'privacy' | 'cookies';

export interface PageMeta {
  key: PageKey;
  path: string;
  /** Libellé du menu et du fil d'Ariane. */
  label: string;
  order: number;
  inMenu: boolean;
  /** Sous-navigation sticky des sections (accueil uniquement). */
  hasSectionNav: boolean;
}

export const pages: Record<PageKey, PageMeta> = {
  home: { key: 'home', path: '/', label: 'Accueil', order: 1, inMenu: true, hasSectionNav: true },
  fees: { key: 'fees', path: '/frais', label: 'Frais', order: 2, inMenu: true, hasSectionNav: false },
  documentation: { key: 'documentation', path: '/documentation', label: 'Documentation', order: 3, inMenu: true, hasSectionNav: false },
  press: { key: 'press', path: '/presse', label: 'Presse', order: 4, inMenu: true, hasSectionNav: false },
  legal: { key: 'legal', path: '/mentions-legales', label: 'Mentions légales', order: 10, inMenu: false, hasSectionNav: false },
  privacy: { key: 'privacy', path: '/politique-de-confidentialite', label: 'Politique de confidentialité', order: 11, inMenu: false, hasSectionNav: false },
  cookies: { key: 'cookies', path: '/cookies', label: 'Politique cookies', order: 12, inMenu: false, hasSectionNav: false },
};

export const menuPages = (Object.values(pages) as PageMeta[]).filter((p) => p.inMenu).sort((a, b) => a.order - b.order);

/** Fil d'Ariane d'une sous-page : Accueil › Page. */
export const breadcrumb = (key: PageKey) => [pages.home, pages[key]];
