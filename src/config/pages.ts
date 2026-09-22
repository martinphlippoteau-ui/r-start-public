/**
 * Plan du site : six pages au menu (Accueil, Comparateur de frais, Simulateur, Notre approche, Vos
 * questions, La presse en parle, À propos en bout de menu), les autres hors menu. Le menu ne
 * contient que des pages, jamais d'ancre de section (10/09/2026). La navigation unique
 * (src/components/SiteNav.astro) suit `order` ; `inMenu` exclut les pages légales et /documentation
 * (hors menu et hors pied de page : on y arrive par la fenêtre « la souscription arrive bientôt »,
 * SubscribeSoon.astro, tant que la souscription n'est pas ouverte). `navLabel` : libellé de
 * navigation plus court ou plus explicite que celui du fil d'Ariane. « Les outils » et les quatre
 * simulateurs sous /outil ont été supprimés le 14/09/2026 à la demande de l'équipe, la salle de
 * presse le 22/09/2026.
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
   * Page mère, pour un fil d'Ariane à plus de deux niveaux. Aucune page n'en déclare depuis la
   * suppression des outils (14/09/2026) ; le mécanisme reste, il ne coûte rien.
   */
  parent?: PageKey;
}

export const pages: Record<PageKey, PageMeta> = {
  home: { key: 'home', path: '/', label: 'Accueil', order: 1, inMenu: true },
  fees: {
    key: 'fees',
    path: '/frais',
    /* « Comparateur de frais » (15/09/2026) : la page s'ouvre sur le comparateur SCPI par SCPI, son
       titre le dit aussi dans le menu. SEULE ENTRÉE SANS ARTICLE : « Le comparateur de frais »
       pesait trop dans la barre. L'URL reste /frais. */
    label: 'Comparateur de frais',
    navLabel: 'Comparateur de frais',
    order: 2,
    inMenu: true,
  },
  /* Simulateur, page créée le 19/09/2026 à la demande de Martin et AU MENU (son arbitrage du même
     jour), juste après le comparateur : les deux outils du site se suivent. Sans rapport avec les
     quatre simulateurs de /outil supprimés le 14/09/2026, qui calculaient avec des taux posés par
     le site : celui-ci n'en propose aucun (src/content/fr/simulator.ts). */
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
    /* « Notre approche » (15/09/2026), ex-« La stratégie » : la convention du 12/09/2026 veut un
       article devant chaque libellé de navigation ; le possessif remplit le même rôle, il empêche
       le libellé de se lire comme une étiquette de rubrique. `label` reste le nom complet de la
       page, lu par la page 404 et le pied de page ; le fil d'Ariane reprend l'intitulé du menu. */
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
    // Hors menu et hors pied de page (voir en tête).
    inMenu: false,
  },
  /* FAQ complète (16/09/2026), au menu juste après « Notre approche » : les autres pages n'en
     rendent que quatre questions et renvoient ici. `navLabel` « Vos questions » et non le nom
     complet de la page : à 375 px, la barre ne tient qu'à des libellés courts. Le fil d'Ariane suit
     l'intitulé du menu. */
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
 * Fil d'Ariane d'une sous-page : Accueil › Page, et un niveau de plus par page mère déclarée. La
 * chaîne est remontée puis retournée, l'accueil est toujours en tête.
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
