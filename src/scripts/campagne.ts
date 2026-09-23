/**
 * Campagnes : capter à l'arrivée, garder le temps de la visite, transmettre au tunnel.
 * POURQUOI. Le lien du tunnel porte une campagne de repli ÉCRITE EN DUR (src/config/site.ts) :
 * sans ce module, un visiteur venu d'une campagne repartait vers le tunnel étiqueté « accès
 * direct », et la campagne qui avait payé le clic n'était jamais créditée.
 * CE QUE LE TUNNEL LIT (recherche Jira/Confluence du 23/09/2026, page CRM « Fonctionnement des UTM
 * dans le CRM ») : `utm_source` → Partner, `utm_medium` → Media, `utm_campaign` → Campaign, sur le
 * contact et l'opportunité, À CONDITION QUE LA VALEUR EXISTE dans le référentiel du CRM ; une
 * valeur inconnue est ignorée. `utm_content`, `utm_term` et `gclid` ne sont lus par personne côté
 * CRM : ils restent pour la mesure d'audience du tunnel. L'identifiant client de GA4 (`cid`), que
 * ce module envoyait, n'était lu par personne non plus : retiré le 23/09/2026.
 * CE QUI EST GARDÉ : les cinq `utm_*` et `gclid`, en sessionStorage, le temps de la visite (choix
 * de l'équipe). PREMIÈRE CAMPAGNE GAGNANTE : un lien nu rencontré ensuite n'efface pas la campagne
 * d'origine ; le dernier clic interne ne veut rien dire. ARRIVÉE DEPUIS GOOGLE SANS PARAMÈTRE : la
 * convention de corum.fr, `google / organic / fr_g_organic`, trois valeurs connues du CRM.
 * CE QUI EST TRANSMIS : les paramètres d'origine, sauf `utm_content`, qui reste la POSITION DU CTA
 * (la seule chose que le site sait et que la campagne ignore). `gclid` NE PART QU'AVEC L'ACCORD EN
 * VIGUEUR : il désigne un clic, pas une campagne. L'ÉTIQUETAGE SE REFAIT AU CLIC : un retrait de
 * consentement doit RETIRER l'identifiant d'un lien déjà étiqueté. Uniquement sur les liens
 * SORTANTS : tunnel fermé, il n'y a rien à étiqueter. SANS JAVASCRIPT, le lien garde son repli en
 * dur : correct, moins précis.
 */

import { consentCookie } from '@/content/fr/consent';

/** Clés lues dans l'adresse d'arrivée et conservées. */
const CLES = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
] as const;
/** Clés qui identifient un navigateur ou un clic, et non une campagne : soumises au consentement. */
const IDENTIFIANTS: readonly string[] = ['gclid'];
const RANGEMENT = 'rstart_campagne';

/** Une valeur de campagne vient de l'adresse, donc de n'importe qui, et repart vers le dataLayer et
    le tunnel : texte court, sans caractère de contrôle ni chevron. */
const LONGUEUR_MAX = 120;
const nettoyer = (valeur: unknown): string => {
  if (typeof valeur !== 'string') return '';
  const propre = valeur.replace(/[\u0000-\u001f\u007f<>"'`]/g, '').trim();
  return propre.slice(0, LONGUEUR_MAX);
};

/** Le consentement EN VIGUEUR, relu à chaque fois : il peut changer pendant la visite. */
const consentementDonne = (): boolean => {
  return new RegExp('(?:^|; )' + consentCookie.name + '=granted(?:;|$)').test(document.cookie);
};

type Campagne = Partial<Record<(typeof CLES)[number], string>>;

/** Ce qui est relu du stockage passe par le même filtre que ce qui vient de l'adresse. */
const lireRangement = (): Campagne => {
  try {
    const brut = sessionStorage.getItem(RANGEMENT);
    const lu: unknown = brut ? JSON.parse(brut) : null;
    if (!lu || typeof lu !== 'object') return {};
    const retenue: Campagne = {};
    for (const cle of CLES) {
      const valeur = nettoyer((lu as Record<string, unknown>)[cle]);
      if (valeur) retenue[cle] = valeur;
    }
    return retenue;
  } catch {
    return {};
  }
};

/** Arrivée depuis un résultat naturel de Google, sans paramètre : la convention de corum.fr
    (Confluence CRM « Fonctionnement des UTM dans le CRM »). Les trois valeurs existent dans le CRM. */
const ORGANIQUE: Campagne = {
  utm_source: 'google',
  utm_medium: 'organic',
  utm_campaign: 'fr_g_organic',
};

/** Le référent est-il un domaine Google ? La politique de référent du site (`strict-origin-when-
    cross-origin`) laisse passer l'origine, c'est tout ce qu'il faut. */
const referentGoogle = (): boolean => {
  try {
    return /(^|\.)google\.[a-z.]+$/.test(new URL(document.referrer).hostname);
  } catch {
    return false;
  }
};

/** Campagne de la visite : celle déjà retenue, sinon celle de l'adresse, sinon « organique » quand
    le référent est Google. Écrite seulement quand il y a quelque chose à retenir : une page sans
    paramètre n'efface pas la campagne d'entrée. */
export const campagne = (): Campagne => {
  const retenue = lireRangement();
  if (Object.keys(retenue).length) return retenue;

  const params = new URLSearchParams(location.search);
  const trouvee: Campagne = {};
  for (const cle of CLES) {
    if (IDENTIFIANTS.includes(cle) && !consentementDonne()) continue;
    const valeur = nettoyer(params.get(cle));
    if (valeur) trouvee[cle] = valeur;
  }
  if (!Object.keys(trouvee).length) {
    if (!referentGoogle()) return {};
    Object.assign(trouvee, ORGANIQUE);
  }

  try {
    sessionStorage.setItem(RANGEMENT, JSON.stringify(trouvee));
  } catch {
    /* stockage indisponible (navigation privée) : la campagne vaudra pour cette page seulement */
  }
  return trouvee;
};

/** Un lien qui sort du site : c'est là, et là seulement, qu'il y a quelque chose à étiqueter. */
const estSortant = (a: HTMLAnchorElement): boolean => {
  try {
    return new URL(a.href, location.href).origin !== location.origin;
  } catch {
    return false;
  }
};

/** Étiquette un lien de souscription sortant : campagne d'origine et position du CTA. Idempotent. */
const etiqueter = (a: HTMLAnchorElement, origine: Campagne): void => {
  if (!estSortant(a)) return;
  let url: URL;
  try {
    url = new URL(a.href);
  } catch {
    return;
  }

  for (const cle of CLES) {
    /* utm_content reste la position du CTA : la campagne ne la connaît pas, le site oui. */
    if (cle === 'utm_content') continue;
    const valeur = origine[cle];
    if (IDENTIFIANTS.includes(cle) && !consentementDonne()) url.searchParams.delete(cle);
    else if (valeur) url.searchParams.set(cle, valeur);
  }
  const position = a.dataset.ctaPosition;
  if (position) url.searchParams.set('utm_content', position);
  a.href = url.toString();
};

const init = (): void => {
  const origine = campagne();
  /* Rien à transmettre : on ne touche à aucun lien. */
  if (Object.keys(origine).length) {
    document
      .querySelectorAll<HTMLAnchorElement>('a[data-cta="souscrire"]')
      .forEach((a) => etiqueter(a, origine));
  }

  /* AU CLIC, en phase de capture : le lien part avec le consentement du moment. `pointerdown`
     couvre le clic du milieu et « ouvrir dans un nouvel onglet », qui ne déclenchent pas
     `click`. */
  const auMoment = (e: Event): void => {
    const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>(
      'a[data-cta="souscrire"]'
    );
    if (a) etiqueter(a, campagne());
  };
  document.addEventListener('pointerdown', auMoment, true);
  document.addEventListener('click', auMoment, true);
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
