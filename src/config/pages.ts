/**
 * Plan du site (mis à jour le 19/09/2026 : le simulateur entre au menu, voir plus bas). Le 14/09/2026 :
 * cinq pages publiques au menu (Accueil, Les frais, Stratégie
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
  | 'simulator'
  | 'strategy'
  | 'about'
  | 'documentation'
  | 'faq'
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
    /*
     * « Comparateur de frais » depuis le 15/09/2026, ex-« Frais » et « Les frais ». La page s'ouvre sur
     * le comparateur SCPI par SCPI, son titre le dit maintenant aussi dans le menu.
     * SEULE ENTRÉE SANS ARTICLE : la convention du 12/09/2026 en donnait un à chaque libellé de
     * navigation (« Les frais », « La stratégie », « La presse en parle »). « Le comparateur de frais »
     * pesait trop dans une barre qui en compte quatre. L'URL ne change pas, elle reste /frais.
     */
    label: 'Comparateur de frais',
    navLabel: 'Comparateur de frais',
    order: 2,
    inMenu: true,
  },
  /*
   * SIMULATEUR, page créée le 19/09/2026 à la demande de Martin, AU MENU (son arbitrage du même jour),
   * juste après le comparateur : les deux outils du site se suivent. La barre passe de cinq à six
   * entrées sur grand écran ; sous « lg » elles vivent dans le tiroir, rien ne change.
   * Les quatre simulateurs de /outil supprimés le 14/09/2026 n'ont rien à voir avec celui-ci : ils
   * calculaient avec des taux posés par le site. Celui-ci n'en propose aucun (src/content/fr/simulator.ts).
   */
  simulator: {
    key: 'simulator',
    path: '/simulateur',
    label: 'Simulateur',
    order: 3,
    inMenu: true,
  },
  strategy: {
    key: 'strategy',
    path: '/strategie',
    label: 'Stratégie d’investissement',
    /*
     * « Notre approche » depuis le 15/09/2026, ex-« La stratégie ». La convention du 12/09/2026 voulait
     * un article devant chaque libellé de navigation (« Les frais », « La stratégie », « La presse en
     * parle ») ; celui-ci porte un possessif à la place, ce qui remplit le même rôle : il empêche le
     * libellé de se lire comme une étiquette de rubrique.
     * `label` reste le nom complet de la page, lu par la page 404 et le pied de page ; seul l'intitulé
     * de la barre change, et le fil d'Ariane le suit puisqu'il reprend l'intitulé du menu.
     */
    navLabel: 'Notre approche',
    order: 4,
    inMenu: true,
  },
  about: {
    key: 'about',
    path: '/a-propos',
    label: 'À propos',
    order: 8,
    inMenu: true,
  },
  documentation: {
    key: 'documentation',
    path: '/documentation',
    label: 'Documentation',
    order: 7,
    // Hors menu depuis le 11/09/2026 : accessible par le pied de page, comme la salle de presse.
    inMenu: false,
  },
  /*
   * FAQ COMPLÈTE, page créée le 16/09/2026. Les autres pages n'en rendent plus que quatre questions et
   * renvoient ici pour le reste.
   * AU MENU depuis le 16/09/2026, en quatrième position, juste après « Notre approche » : la barre en
   * portait quatre depuis la réunion du 10/09/2026, elle en porte cinq. Les renvois posés sous chaque
   * FAQ courte restent, ils mènent au même endroit.
   * `navLabel` « Vos questions » et non le nom complet de la page : cinq entrées dans une barre, à
   * 375 px, ne tiennent qu'à des libellés courts. Le fil d'Ariane suit l'intitulé du menu.
   */
  faq: {
    key: 'faq',
    path: '/faq',
    label: 'Questions fréquentes',
    navLabel: 'Vos questions',
    order: 5,
    inMenu: true,
  },
  press: {
    key: 'press',
    path: '/presse',
    label: 'Presse',
    navLabel: 'La presse en parle',
    order: 6,
    inMenu: true,
  },
  // Salle de presse : réservée aux journalistes, accessible depuis le pied de page seulement
  // (arbitrage du 10/09/2026), donc hors du menu et hors de la navigation unique.
  pressRoom: {
    key: 'pressRoom',
    path: '/salle-de-presse',
    label: 'Salle de presse',
    order: 9,
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
