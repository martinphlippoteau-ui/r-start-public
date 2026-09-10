/**
 * Plan du site (périmètre v2, mis à jour le 10/09/2026) : quatre pages publiques au menu, la salle de
 * presse en pied de page, puis les pages légales.
 * La navigation unique (src/components/SiteNav.astro) suit `order` ; `inMenu` exclut les pages
 * légales. `navLabel` permet un libellé de navigation plus explicite que celui du fil d'Ariane.
 */
export type PageKey =
  | 'home'
  | 'fees'
  | 'documentation'
  | 'press'
  | 'pressRoom'
  | 'legal'
  | 'privacy'
  | 'cookies';

export interface PageMeta {
  key: PageKey;
  path: string;
  /** Libellé du menu et du fil d'Ariane. */
  label: string;
  /** Libellé dans la navigation unique, si différent de `label` (ex. « La presse en parle »). */
  navLabel?: string;
  order: number;
  inMenu: boolean;
  /** Sous-navigation sticky des sections (accueil uniquement). */
  hasSectionNav: boolean;
}

export const pages: Record<PageKey, PageMeta> = {
  home: { key: 'home', path: '/', label: 'Accueil', order: 1, inMenu: true, hasSectionNav: true },
  fees: { key: 'fees', path: '/frais', label: 'Frais', order: 2, inMenu: true, hasSectionNav: false },
  documentation: { key: 'documentation', path: '/documentation', label: 'Documentation', order: 3, inMenu: true, hasSectionNav: false },
  press: { key: 'press', path: '/presse', label: 'Presse', navLabel: 'La presse en parle', order: 4, inMenu: true, hasSectionNav: false },
  // Salle de presse : réservée aux journalistes, accessible depuis le pied de page seulement
  // (arbitrage du 10/09/2026), donc hors du menu et hors de la navigation unique.
  pressRoom: { key: 'pressRoom', path: '/salle-de-presse', label: 'Salle de presse', order: 5, inMenu: false, hasSectionNav: false },
  legal: { key: 'legal', path: '/mentions-legales', label: 'Mentions légales', order: 10, inMenu: false, hasSectionNav: false },
  privacy: { key: 'privacy', path: '/politique-de-confidentialite', label: 'Politique de confidentialité', order: 11, inMenu: false, hasSectionNav: false },
  cookies: { key: 'cookies', path: '/cookies', label: 'Politique cookies', order: 12, inMenu: false, hasSectionNav: false },
};

export const menuPages = (Object.values(pages) as PageMeta[]).filter((p) => p.inMenu).sort((a, b) => a.order - b.order);

/** Fil d'Ariane d'une sous-page : Accueil › Page. */
export const breadcrumb = (key: PageKey) => [pages.home, pages[key]];
