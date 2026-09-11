import { PUBLIC_GTM_ID, PUBLIC_SITE_URL, PUBLIC_SUBSCRIBE_URL } from 'astro:env/client';
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
  gtmId: PUBLIC_GTM_ID,
  ogImagePath: '/og/og-rstart.jpg',
  consent: {
    cookieName: 'rstart_consent',
    maxAgeDays: 180,
  },
} as const;

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
