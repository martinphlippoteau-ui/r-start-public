import type { ConsentContent } from '@/content/types';

/** Textes du bandeau de consentement cookies (CNIL). */
/**
 * NOM ET DURÉE DU COOKIE DE CONSENTEMENT : LA SEULE SOURCE, lue par le script qui dépose le cookie
 * (src/scripts/consent.ts) et par la politique cookies (pages.ts). Écrits deux fois, la durée
 * déposée et la durée publiée finissaient par diverger, et le site publiait une durée fausse. Ici
 * et non dans site.ts : ce fichier n'importe rien d'Astro, le contenu reste lisible hors du site.
 */
export const consentCookie = { name: 'rstart_consent', days: 180 } as const;

export const consent = {
  title: 'Votre choix concernant les cookies',
  body: "Ce site utilise uniquement des cookies de mesure d'audience (Google Analytics via Google Tag Manager) pour comprendre comment il est consulté. Aucun cookie n'est déposé sans votre accord. Vous pouvez modifier votre choix à tout moment via le lien « Gérer les cookies » en bas de page.",
  /** Sur petit écran : même sens en une phrase courte, deux lignes au maximum à 393 px. */
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
