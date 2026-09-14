import {
  PUBLIC_GTM_ID,
  PUBLIC_SITE_URL,
  PUBLIC_SUBSCRIBE_OPEN,
  PUBLIC_SUBSCRIBE_URL,
} from 'astro:env/client';
import { withBase } from '@/lib/href';
import type { CtaPosition } from '@/content/types';

/**
 * Configuration unique du site. Les valeurs sensibles au déploiement viennent des variables
 * d'environnement PUBLIC_* (voir .env.example et astro.config.mjs).
 */
export const site = {
  name: 'R Start',
  publisher: "CORUM L'Épargne",
  lang: 'fr',
  locale: 'fr_FR',
  url: PUBLIC_SITE_URL.replace(/\/+$/, ''),
  /** URL du tunnel de souscription réglementé. */
  subscribeUrl: PUBLIC_SUBSCRIBE_URL,
  /** Vrai tant que l'URL réelle du tunnel n'a pas été fournie. */
  subscribeIsPlaceholder: /placeholder/i.test(PUBLIC_SUBSCRIBE_URL),
  /**
   * Vrai seulement quand la souscription est réellement ouverte : PUBLIC_SUBSCRIBE_OPEN vaut « true »
   * ET l'URL du tunnel n'est plus celle de repli. Faux (le cas d'aujourd'hui) : tous les CTA
   * « Souscrire » ouvrent la fenêtre « la souscription arrive bientôt », personne ne quitte le site.
   */
  subscribeOpen:
    /^(true|1|oui)$/i.test(PUBLIC_SUBSCRIBE_OPEN.trim()) &&
    !/placeholder/i.test(PUBLIC_SUBSCRIBE_URL),
  gtmId: PUBLIC_GTM_ID,
  ogImagePath: '/og/og-rstart.jpg',
  consent: {
    cookieName: 'rstart_consent',
    maxAgeDays: 180,
  },
} as const;

/** Repli sans JavaScript quand la souscription n'est pas ouverte : les documents réglementaires. */
const SUBSCRIBE_SOON_PATH = '/documentation';

/**
 * Destination PRÊTE À POSER d'un CTA « Souscrire ». Tant que la souscription n'est pas ouverte, elle ne
 * pointe PAS vers le tunnel : le clic est intercepté par la fenêtre « la souscription arrive bientôt »
 * (SubscribeSoon.astro), et sans JavaScript le lien mène à la documentation réglementaire plutôt qu'à
 * une URL de tunnel qui n'accueille personne. Le chemin interne est préfixé par le chemin de base ;
 * l'URL du tunnel est absolue et part telle quelle.
 */
export function ctaHref(position: CtaPosition): string {
  return site.subscribeOpen ? subscribeHref(position) : withBase(SUBSCRIBE_SOON_PATH);
}

/**
 * Construit l'URL du tunnel pour un CTA donné. Ajoute des paramètres UTM uniquement si l'URL
 * fournie n'en contient pas déjà (pour ne pas écraser un code partenaire).
 */
export function subscribeHref(position: CtaPosition): string {
  try {
    const url = new URL(site.subscribeUrl);
    if (!/utm_/i.test(url.search)) {
      url.searchParams.set('utm_source', 'site-r-start');
      url.searchParams.set('utm_medium', 'cta');
      url.searchParams.set('utm_content', position);
    }
    return url.toString();
  } catch {
    return site.subscribeUrl;
  }
}
