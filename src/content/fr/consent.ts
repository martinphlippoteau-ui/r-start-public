import type { ConsentContent } from '@/content/types';

/** Textes du bandeau de consentement cookies (CNIL). */
/**
 * NOM ET DURÉE DU COOKIE DE CONSENTEMENT : LA SEULE SOURCE (audit du 18/09/2026). Ils étaient écrits
 * trois fois, dans src/config/site.ts (ce que le site dépose), dans src/content/fr/pages.ts (ce que la
 * politique cookies publie, recopié « sans l'importer ») et en repli dans src/scripts/consent.ts.
 * Changer la durée dans site.ts modifiait le cookie réellement déposé sans toucher au texte légal : le
 * site aurait publié une durée de conservation fausse, et rien ne l'arrêtait.
 * Ici et non dans site.ts : ce fichier n'importe rien d'Astro, le contenu reste lisible hors du site.
 */
export const consentCookie = { name: 'rstart_consent', days: 180 } as const;

export const consent = {
  title: 'Votre choix concernant les cookies',
  body: "Ce site utilise uniquement des cookies de mesure d'audience (Google Analytics via Google Tag Manager) pour comprendre comment il est consulté. Aucun cookie n'est déposé sans votre accord. Vous pouvez modifier votre choix à tout moment via le lien « Gérer les cookies » en bas de page.",
  /**
   * Sur petit écran : même sens en une phrase courte. La hauteur du bandeau conditionne la place qui
   * reste à la ligne risques du hero au premier chargement, deux lignes au maximum à 393 px.
   */
  bodyShort: "Cookies de mesure d'audience, avec votre accord, retirables à tout moment.",
  accept: 'Tout accepter',
  refuse: 'Tout refuser',
  customize: 'Personnaliser',
  save: 'Enregistrer mes choix',
  analyticsLabel: "Mesure d'audience (Google Analytics)",
  analyticsDescription: 'Statistiques anonymisées de fréquentation, conservées 13 mois maximum.',
  necessaryLabel: 'Cookies strictement nécessaires',
  necessaryDescription: 'Mémorisation de votre choix de consentement (toujours actif).',
  policyLabel: 'Politique cookies',
  policyHref: '/cookies',
  manageLabel: 'Gérer les cookies',
} satisfies ConsentContent;
