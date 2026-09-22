/**
 * Campagnes : capter à l'arrivée, garder le temps de la visite, transmettre au tunnel.
 * POURQUOI. Le lien du tunnel porte des paramètres de campagne ÉCRITS EN DUR
 * (`utm_source=site-r-start`) en repli : sans ce module, un visiteur venu d'une campagne repartait
 * vers le tunnel étiqueté comme venant du site, et la campagne qui avait payé le clic n'était
 * jamais créditée. CE QUI EST GARDÉ : les cinq `utm_*` et `gclid`, en sessionStorage, le temps de
 * la visite (choix de l'équipe). PREMIÈRE CAMPAGNE GAGNANTE : un lien nu rencontré ensuite n'efface
 * pas la campagne d'origine ; le dernier clic interne ne veut rien dire.
 * CE QUI EST TRANSMIS : les paramètres d'origine, sauf `utm_content`, qui reste la POSITION DU CTA
 * (la seule chose que le site sait et que la campagne ignore), plus l'identifiant client de GA4,
 * pour rapprocher une souscription de sa visite sans qu'aucune donnée personnelle ne transite par
 * le site. LES DEUX IDENTIFIANTS NE PARTENT QU'AVEC L'ACCORD EN VIGUEUR : l'identifiant client et
 * `gclid` désignent un navigateur ou un clic, pas une campagne. Lire le cookie `_ga` ne suffit pas,
 * il existe encore après un retrait. L'ÉTIQUETAGE SE REFAIT AU CLIC : le consentement donné sur la
 * page même crée `_ga` après coup, et un retrait doit RETIRER l'identifiant d'un lien déjà
 * étiqueté. Uniquement sur les liens SORTANTS : tunnel fermé, il n'y a rien à étiqueter. SANS
 * JAVASCRIPT, le lien garde son repli en dur : correct, moins précis.
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

/** Nom du paramètre qui porte l'identifiant client vers le tunnel. À ALIGNER AVEC CORUM : le tunnel
    doit le lire sous ce nom exact. Une seule ligne à changer. */
const PARAM_IDENTIFIANT = 'cid';

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

/** Campagne de la visite : celle déjà retenue, sinon celle de l'adresse. Écrite seulement quand
    l'adresse en porte une : une page sans paramètre n'efface pas la campagne d'entrée. */
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
  if (!Object.keys(trouvee).length) return {};

  try {
    sessionStorage.setItem(RANGEMENT, JSON.stringify(trouvee));
  } catch {
    /* stockage indisponible (navigation privée) : la campagne vaudra pour cette page seulement */
  }
  return trouvee;
};

/** Identifiant client de GA4, lu dans le cookie `_ga` (`GA1.1.<id>.<horodatage>`, les deux derniers
    segments). Vide sans consentement EN VIGUEUR : la seule présence du cookie ne prouve rien. */
export const identifiantClient = (): string => {
  if (!consentementDonne()) return '';
  const m = document.cookie.match(/(?:^|;\s*)_ga=GA\d+\.\d+\.(\d+\.\d+)/);
  return m?.[1] ?? '';
};

/** Un lien qui sort du site : c'est là, et là seulement, qu'il y a quelque chose à étiqueter. */
const estSortant = (a: HTMLAnchorElement): boolean => {
  try {
    return new URL(a.href, location.href).origin !== location.origin;
  } catch {
    return false;
  }
};

/** Étiquette un lien de souscription sortant : campagne d'origine, position du CTA, identifiant
    client. Idempotent. */
const etiqueter = (a: HTMLAnchorElement, origine: Campagne, cid: string): void => {
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
  /* Posé s'il y en a un, RETIRÉ sinon : un lien étiqueté pendant l'accord ne garde pas son identifiant
     après un retrait. */
  if (cid) url.searchParams.set(PARAM_IDENTIFIANT, cid);
  else url.searchParams.delete(PARAM_IDENTIFIANT);

  a.href = url.toString();
};

const init = (): void => {
  const origine = campagne();
  const cid = identifiantClient();
  /* Rien à transmettre et rien à identifier : on ne touche à aucun lien. */
  if (Object.keys(origine).length || cid) {
    document
      .querySelectorAll<HTMLAnchorElement>('a[data-cta="souscrire"]')
      .forEach((a) => etiqueter(a, origine, cid));
  }

  /* AU CLIC, en phase de capture : le lien part avec le consentement du moment. `pointerdown`
     couvre le clic du milieu et « ouvrir dans un nouvel onglet », qui ne déclenchent pas
     `click`. */
  const auMoment = (e: Event): void => {
    const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>(
      'a[data-cta="souscrire"]'
    );
    if (a) etiqueter(a, campagne(), identifiantClient());
  };
  document.addEventListener('pointerdown', auMoment, true);
  document.addEventListener('click', auMoment, true);
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
