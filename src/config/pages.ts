/**
 * Plan du site (mis à jour le 14/09/2026) : cinq pages publiques au menu (Accueil, Les frais, Stratégie
 * d'investissement, La presse en parle, À propos, cette dernière en bout de menu). « Les outils » et les
 * quatre simulateurs sous /outil ont été SUPPRIMÉS le 14/09/2026, sur demande de l'équipe : ni page, ni
 * composants, ni contenu, ni entrée de menu. Documentation et salle
 * de presse sont hors menu, accessibles par le pied de page, la salle de presse en pied de
 * page, puis les pages légales. Le menu ne contient que des pages, jamais d'ancre de section.
 * La navigation unique (src/components/SiteNav.astro) suit `order` ; `inMenu` exclut les pages
 * légales. `navLabel` permet un libellé de navigation plus explicite que celui du fil d'Ariane.
 * (`hasSectionNav`, reliquat de la sous-navigation par sections, est retiré le 10/09/2026 : aucun
 * consommateur.)
 */
export type PageKey =
  | 'home'
  | 'fees'
  | 'strategy'
  | 'about'
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
  /**
   * Page mère, pour un fil d'Ariane à plus de deux niveaux. AUCUNE page n'en déclare depuis le
   * 14/09/2026 et la suppression des outils, qui étaient les seules ; le mécanisme reste, il ne coûte
   * rien et il resservira à la première sous-page qui en aura une.
   */
  parent?: PageKey;
}

export const pages: Record<PageKey, PageMeta> = {
  home: { key: 'home', path: '/', label: 'Accueil', order: 1, inMenu: true },
  fees: {
    key: 'fees',
    path: '/frais',
    label: 'Frais',
    navLabel: 'Les frais',
    order: 2,
    inMenu: true,
  },
  strategy: {
    key: 'strategy',
    path: '/strategie',
    label: 'Stratégie d’investissement',
    /* Les libellés de navigation portent tous un article (12/09/2026) : « Les frais », « La stratégie »,
       « La presse en parle ». `label` reste le nom complet de la page. */
    navLabel: 'La stratégie',
    order: 3,
    inMenu: true,
  },
  about: {
    key: 'about',
    path: '/a-propos',
    label: 'À propos',
    order: 6,
    inMenu: true,
  },
  documentation: {
    key: 'documentation',
    path: '/documentation',
    label: 'Documentation',
    order: 5,
    // Hors menu depuis le 11/09/2026 : accessible par le pied de page, comme la salle de presse.
    inMenu: false,
  },
  press: {
    key: 'press',
    path: '/presse',
    label: 'Presse',
    navLabel: 'La presse en parle',
    order: 4,
    inMenu: true,
  },
  // Salle de presse : réservée aux journalistes, accessible depuis le pied de page seulement
  // (arbitrage du 10/09/2026), donc hors du menu et hors de la navigation unique.
  pressRoom: {
    key: 'pressRoom',
    path: '/salle-de-presse',
    label: 'Salle de presse',
    order: 7,
    inMenu: false,
  },
  legal: {
    key: 'legal',
    path: '/mentions-legales',
    label: 'Mentions légales',
    order: 10,
    inMenu: false,
  },
  privacy: {
    key: 'privacy',
    path: '/politique-de-confidentialite',
    label: 'Politique de confidentialité',
    order: 11,
    inMenu: false,
  },
  cookies: {
    key: 'cookies',
    path: '/cookies',
    label: 'Politique cookies',
    order: 12,
    inMenu: false,
  },
};

export const menuPages = (Object.values(pages) as PageMeta[])
  .filter((p) => p.inMenu)
  .sort((a, b) => a.order - b.order);

/**
 * Fil d'Ariane d'une sous-page : Accueil › Page, et un niveau de plus par page mère déclarée. La chaîne
 * est remontée puis retournée, l'accueil est toujours en tête.
 */
export const breadcrumb = (key: PageKey): PageMeta[] => {
  const chaine: PageMeta[] = [];
  let courante: PageMeta | undefined = pages[key];
  while (courante && courante.key !== 'home') {
    chaine.unshift(courante);
    courante = courante.parent ? pages[courante.parent] : undefined;
  }
  return [pages.home, ...chaine];
};
