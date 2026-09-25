import { menuPages } from '@/config/pages';

/**
 * Pages d'erreur (25/09/2026, demande de Martin : « les pages d'erreur 404, etc. SEO friendly »),
 * rendues par src/components/PageErreur.astro : 404 (page introuvable), 403 (accès refusé), 500
 * (erreur du serveur), 503 (maintenance). Aucune allégation commerciale : pas de chiffre, pas de CTA
 * de souscription, donc pas de contre-poids risque à afficher.
 *
 * CE QUI LES REND « SEO FRIENDLY » : servies avec leur VRAI code HTTP par l'hébergeur (pas de
 * « 200 » qui ferait indexer une page vide, les « soft 404 » que Google pénalise) ; `noindex,
 * follow` (jamais dans l'index, mais les robots suivent leurs liens vers les pages utiles) ; SANS
 * balise canonique (une page d'erreur n'a pas d'adresse de référence) ; hors du plan du site ; un
 * titre et une description propres à chacune ; des liens vers toutes les pages du menu et la
 * recherche du site, pour que le visiteur comme le robot repartent vers du contenu.
 *
 * À BRANCHER CHEZ L'HÉBERGEUR : GitHub Pages ne sert que 404.html (avec son vrai code). Les autres
 * se déclarent à la migration : `responseOverrides` d'Azure Static Web Apps (403, 404) ou
 * `error_page` de nginx (403, 500, 502, 503, 504).
 */
export type CodeErreur = '403' | '404' | '500' | '503';

interface ContenuErreur {
  seo: { title: string; description: string };
  title: string;
  intro: string;
}

const suffixe = ' | R Start, SCPI CORUM';

export const erreurs = {
  pages: {
    '404': {
      seo: {
        title: 'Page introuvable' + suffixe,
        description:
          'Cette page n’existe pas ou a été déplacée. Retrouvez R Start, ses frais, sa stratégie et les réponses à vos questions.',
      },
      title: 'Cette page n’existe pas.',
      intro:
        'Le lien est peut-être ancien, ou l’adresse comporte une erreur. Voici les pages du site, ou cherchez directement ce qui vous intéresse.',
    },
    '403': {
      seo: {
        title: 'Accès refusé' + suffixe,
        description:
          'Vous n’avez pas accès à cette adresse. Retrouvez R Start, ses frais, sa stratégie et les réponses à vos questions.',
      },
      title: 'Cette page n’est pas accessible.',
      intro:
        'L’adresse existe, mais son accès est réservé. Voici les pages ouvertes à tous, ou cherchez directement ce qui vous intéresse.',
    },
    '500': {
      seo: {
        title: 'Erreur technique' + suffixe,
        description:
          'Une erreur technique empêche d’afficher cette page. Réessayez dans un instant ou retrouvez les autres pages de R Start.',
      },
      title: 'Une erreur technique est survenue.',
      intro:
        'Le problème vient de notre côté, pas du vôtre. Réessayez dans un instant ; en attendant, les autres pages du site restent disponibles.',
    },
    '503': {
      seo: {
        title: 'Site en maintenance' + suffixe,
        description:
          'Le site R Start est en maintenance pour quelques instants. Merci de revenir un peu plus tard.',
      },
      title: 'Le site est en maintenance.',
      intro:
        'Nous améliorons le site. Il sera de retour dans quelques instants : merci de réessayer un peu plus tard.',
    },
  } satisfies Record<CodeErreur, ContenuErreur>,
  /** Libellé lu avant le code, pour les lecteurs d'écran (« Erreur 404 »). */
  codeLabel: 'Erreur',
  linksLabel: 'Pages du site',
  /** L'accueil d'abord, puis les pages du menu (l'accueil en fait partie : dédoublonné). */
  links: [
    { label: 'Accueil', href: '/' },
    ...menuPages.filter((p) => p.path !== '/').map((p) => ({ label: p.navLabel ?? p.label, href: p.path })),
  ],
  /** Le champ de recherche de la page (libellé lu par les lecteurs d'écran, texte indicatif). */
  searchLabel: 'Rechercher sur le site',
  searchPlaceholder: 'Frais, stratégie, souscription…',
  searchSubmit: 'Rechercher',
  retryLabel: 'Réessayer',
};
