import type { ConsentContent } from '@/content/types';

/** Textes du bandeau de consentement cookies (CNIL). */
export const consent = {
  title: 'Votre choix concernant les cookies',
  body:
    "Ce site utilise uniquement des cookies de mesure d'audience (Google Analytics via Google Tag Manager) pour comprendre comment il est consulté. Aucun cookie n'est déposé sans votre accord. Vous pouvez modifier votre choix à tout moment via le lien « Gérer les cookies » en bas de page.",
  /** Sur petit écran : même sens en une phrase, pour laisser la ligne risques du hero visible au-dessus du bandeau. */
  bodyShort:
    "Ce site utilise uniquement des cookies de mesure d'audience, déposés avec votre accord, que vous pouvez retirer à tout moment.",
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
