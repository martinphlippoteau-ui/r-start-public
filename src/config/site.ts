import {
  PUBLIC_GTM_ID,
  PUBLIC_NOINDEX,
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

/**
 * Un interrupteur d'environnement se lit d'une seule façon et refuse ce qu'il ne comprend pas
 * (audit du 18/09/2026 : PUBLIC_NOINDEX comparé strictement à 'true' laissait « True » ou « 1 »
 * rendre la prévisualisation INDEXABLE sans un mot). Vrai pour true, 1 ou oui ; faux pour vide,
 * false, 0 ou non ; toute autre valeur ARRÊTE LE BUILD plutôt que d'être lue comme « faux ».
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
} as const;

/** Repli sans JavaScript quand la souscription n'est pas ouverte : les documents réglementaires. */
const SUBSCRIBE_SOON_PATH = '/documentation';

/**
 * Destination PRÊTE À POSER d'un CTA « Souscrire ». Tant que la souscription n'est pas ouverte,
 * elle ne pointe PAS vers le tunnel : le clic est intercepté par la fenêtre « la souscription
 * arrive bientôt » (SubscribeSoon.astro), et sans JavaScript le lien mène à la documentation
 * réglementaire. Le chemin interne est préfixé par le chemin de base ; l'URL du tunnel est absolue
 * et part telle quelle.
 */
export function ctaHref(position: CtaPosition): string {
  return site.subscribeOpen ? subscribeHref(position) : withBase(SUBSCRIBE_SOON_PATH);
}

/**
 * ORIGINE DÉCLARÉE AU TUNNEL (23/09/2026). Le paramètre `from` alimente le champ « Subscription
 * origin » de la souscription dans le CRM (Confluence PM « KPIs for digital fundraising »). Valeurs
 * admises : website, nps, pps, scpi_simulator, life_simulator, credit_simulator, warm_tunnel,
 * unbounce, email, legacypps. Aucune n'est propre à R Start : `website`, comme les boutons de
 * corum.fr, tant qu'une valeur dédiée n'existe pas côté tunnel ET côté CRM. Une ligne à changer.
 */
const SUBSCRIBE_FROM = 'website';

/**
 * CAMPAGNE DE REPLI d'une visite sans campagne d'entrée : la convention de corum.fr pour un accès
 * direct (Confluence CRM « Fonctionnement des UTM dans le CRM », juillet 2026). Le CRM ne retient une
 * valeur UTM que si elle existe dans son référentiel (`utm_source` → Partner, `utm_medium` → Media,
 * `utm_campaign` → Campaign) : `site-r-start` et `cta`, choisis avant de le savoir, n'y existaient
 * pas et tombaient dans le vide. `fr_direct_direct` suit le modèle `nl_direct_direct` documenté ;
 * à confirmer dans le référentiel avant l'ouverture.
 */
const UTM_DIRECT = {
  utm_source: 'direct',
  utm_medium: 'direct',
  utm_campaign: 'fr_direct_direct',
} as const;

/**
 * Construit l'URL du tunnel pour un CTA donné. Pose l'origine `from` si l'adresse n'en porte pas,
 * et la campagne de repli uniquement si l'adresse ne contient déjà aucun UTM (pour ne pas écraser
 * un code partenaire). src/scripts/campagne.ts remplace ce repli au clic par la campagne d'entrée
 * de la visite, quand il y en a une.
 */
export function subscribeHref(position: CtaPosition): string {
  /* Pas de `try` : l'adresse est validée à la construction de `site` dès que la souscription est
     ouverte (voir plus bas). Avant, une adresse mal formée était publiée TELLE QUELLE sur tous les
     boutons. */
  const url = new URL(site.subscribeUrl);
  if (!url.searchParams.has('from')) url.searchParams.set('from', SUBSCRIBE_FROM);
  if (!/utm_/i.test(url.search)) {
    for (const [cle, valeur] of Object.entries(UTM_DIRECT)) url.searchParams.set(cle, valeur);
    url.searchParams.set('utm_content', position);
  }
  return url.toString();
}

/* Souscription ouverte = adresse du tunnel valide, ou le build s'arrête (audit du 18/09/2026).
   C'est le lien le plus sensible du site, et le seul cas où le dépôt publiait du faux en silence :
   un schéma oublié, une espace, une valeur tronquée par le « # » d'un .env (déjà arrivé, voir
   astro.config.mjs), et tous les CTA partaient avec un href relatif cassé. `https:` exigé : on
   n'envoie personne souscrire en clair. */
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
