import {
  PUBLIC_GTM_ID,
  PUBLIC_NOINDEX,
  PUBLIC_SITE_URL,
  PUBLIC_SUBSCRIBE_OPEN,
  PUBLIC_SUBSCRIBE_URL,
} from 'astro:env/client';
import { consentCookie } from '@/content/fr/consent';
import { withBase } from '@/lib/href';
import type { CtaPosition } from '@/content/types';

/**
 * Configuration unique du site. Les valeurs sensibles au déploiement viennent des variables
 * d'environnement PUBLIC_* (voir .env.example et astro.config.mjs).
 */

/**
 * UN INTERRUPTEUR D'ENVIRONNEMENT SE LIT D'UNE SEULE FAÇON, ET REFUSE CE QU'IL NE COMPREND PAS (audit du
 * 18/09/2026). PUBLIC_NOINDEX était comparé strictement à 'true' : « True », « 1 » ou « true » suivi
 * d'une espace laissaient la prévisualisation d'un produit financier INDEXABLE, sans un mot, alors que
 * PUBLIC_SUBSCRIBE_OPEN acceptait ces graphies. Les deux passent ici : vrai pour true, 1 ou oui ; faux
 * pour vide, false, 0 ou non ; et toute autre valeur ARRÊTE LE BUILD plutôt que d'être lue comme « faux ».
 */
const interrupteur = (nom: string, valeur: string): boolean => {
  const v = valeur.trim();
  if (/^(true|1|oui)$/i.test(v)) return true;
  if (v === '' || /^(false|0|non)$/i.test(v)) return false;
  throw new Error(`${nom} vaut « ${valeur} » : attendu true, 1, oui, false, 0, non, ou vide`);
};

export const site = {
  name: 'R Start',
  publisher: "CORUM L'Épargne",
  locale: 'fr_FR',
  url: PUBLIC_SITE_URL.replace(/\/+$/, ''),
  /** URL du tunnel de souscription réglementé. */
  subscribeUrl: PUBLIC_SUBSCRIBE_URL,
  /** Vrai tant que l'URL réelle du tunnel n'a pas été fournie. */
  /**
   * Vrai seulement quand la souscription est réellement ouverte : PUBLIC_SUBSCRIBE_OPEN vaut « true »
   * ET l'URL du tunnel n'est plus celle de repli. Faux (le cas d'aujourd'hui) : tous les CTA
   * « Souscrire » ouvrent la fenêtre « la souscription arrive bientôt », personne ne quitte le site.
   */
  subscribeOpen:
    interrupteur('PUBLIC_SUBSCRIBE_OPEN', PUBLIC_SUBSCRIBE_OPEN) &&
    !/placeholder/i.test(PUBLIC_SUBSCRIBE_URL),
  /** Prévisualisation : meta robots « noindex » partout et robots.txt en Disallow. */
  noindex: interrupteur('PUBLIC_NOINDEX', PUBLIC_NOINDEX),
  gtmId: PUBLIC_GTM_ID,
  ogImagePath: '/og/og-rstart.jpg',
  /* Lus dans le contenu, qui alimente aussi la politique cookies : une seule valeur, deux usages. */
  consent: {
    cookieName: consentCookie.name,
    maxAgeDays: consentCookie.days,
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
  /* Pas de `try` : l'adresse a été validée à la construction de `site` dès que la souscription est
     ouverte (voir plus bas). Avant, une adresse mal formée était avalée ici et publiée TELLE QUELLE sur
     tous les boutons « Souscrire », sans un mot au build. */
  const url = new URL(site.subscribeUrl);
  if (!/utm_/i.test(url.search)) {
    url.searchParams.set('utm_source', 'site-r-start');
    url.searchParams.set('utm_medium', 'cta');
    url.searchParams.set('utm_content', position);
  }
  return url.toString();
}

/*
 * SOUSCRIPTION OUVERTE = ADRESSE DU TUNNEL VALIDE, OU LE BUILD S'ARRÊTE (audit du 18/09/2026). C'est le
 * lien le plus sensible du site, et le seul cas où le dépôt publiait du faux en silence : un schéma
 * oublié, une espace, une valeur tronquée par le « # » d'un .env (déjà arrivé, voir astro.config.mjs),
 * et tous les CTA partaient avec un href relatif cassé, sans paramètres de campagne. `https:` exigé :
 * on n'envoie personne souscrire en clair.
 */
if (site.subscribeOpen) {
  let tunnel: URL;
  try {
    tunnel = new URL(site.subscribeUrl);
  } catch {
    throw new Error(
      `PUBLIC_SUBSCRIBE_URL vaut « ${site.subscribeUrl} » : ce n'est pas une adresse valide, alors que PUBLIC_SUBSCRIBE_OPEN ouvre la souscription`
    );
  }
  if (tunnel.protocol !== 'https:')
    throw new Error(`PUBLIC_SUBSCRIBE_URL doit être en https, reçu « ${site.subscribeUrl} »`);
}
