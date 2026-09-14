/**
 * Campagnes : capter à l'arrivée, garder le temps de la visite, transmettre au tunnel.
 *
 * POURQUOI. Le site posait déjà des paramètres de campagne sur le lien du tunnel, mais ÉCRITS EN DUR :
 * `utm_source=site-r-start`. Un visiteur venu d'une campagne arrivait avec les siens, que personne ne
 * lisait, et repartait vers le tunnel étiqueté comme venant du site. La campagne qui avait payé le clic
 * disparaissait exactement là où elle aurait dû être créditée.
 *
 * CE QUI EST GARDÉ. Les cinq `utm_*` et `gclid`, en sessionStorage, le temps de la visite (choix de
 * l'équipe du 14/09/2026). PREMIÈRE CAMPAGNE GAGNANTE : une visite qui commence sur une campagne et
 * repasse ensuite par un lien nu garde la campagne d'origine. Le contraire attribuerait la souscription
 * au dernier clic interne, ce qui ne veut rien dire.
 *
 * CE QUI EST TRANSMIS. Les paramètres d'origine remplacent le repli en dur, sauf `utm_content`, qui
 * reste la POSITION DU CTA : c'est la seule chose que le site sait et que la campagne ignore. S'y
 * ajoute l'identifiant client de GA4, pour que CORUM puisse rapprocher une souscription de la visite
 * qui l'a produite, sans qu'aucune donnée personnelle ne transite par le site.
 *
 * QUAND. Uniquement sur les liens SORTANTS. Tant que la souscription n'est pas ouverte, les appels
 * pointent vers /documentation : il n'y a rien à étiqueter, et le module ne touche à rien.
 *
 * SANS JAVASCRIPT. Le lien reste celui rendu au build, avec son repli en dur : correct, simplement
 * moins précis. Rien ne dépend de ce module pour fonctionner.
 */

/** Clés lues dans l'adresse d'arrivée et conservées. */
const CLES = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
] as const;
const RANGEMENT = 'rstart_campagne';

/**
 * Nom du paramètre qui porte l'identifiant client vers le tunnel. À ALIGNER AVEC CORUM : le tunnel doit
 * le lire sous ce nom exact et le stocker avec la souscription. Une seule ligne à changer le jour où
 * l'équipe du tunnel donne le sien.
 */
const PARAM_IDENTIFIANT = 'cid';

type Campagne = Partial<Record<(typeof CLES)[number], string>>;

const lireRangement = (): Campagne => {
  try {
    const brut = sessionStorage.getItem(RANGEMENT);
    return brut ? (JSON.parse(brut) as Campagne) : {};
  } catch {
    return {};
  }
};

/**
 * Campagne de la visite : celle déjà retenue si elle existe, sinon celle de l'adresse courante.
 * Écrit seulement quand l'adresse en porte une : un passage sur une page sans paramètre ne doit pas
 * effacer la campagne d'entrée.
 */
export const campagne = (): Campagne => {
  const retenue = lireRangement();
  if (Object.keys(retenue).length) return retenue;

  const params = new URLSearchParams(location.search);
  const trouvee: Campagne = {};
  for (const cle of CLES) {
    const valeur = params.get(cle);
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

/**
 * Identifiant client de GA4, lu dans son cookie `_ga`, de forme `GA1.1.<id>.<horodatage>`. L'identifiant
 * attendu est la concaténation des deux derniers segments. Vide tant que GA4 n'a pas écrit son cookie,
 * c'est-à-dire tant que le visiteur n'a pas accepté la mesure : c'est le comportement voulu, rien n'est
 * transmis sans consentement.
 */
export const identifiantClient = (): string => {
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

/**
 * Étiquette un lien de souscription sortant : campagne d'origine, position du CTA, identifiant client.
 * Idempotent, il peut être rappelé sans dupliquer ni écraser ce qu'il a déjà posé.
 */
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
    if (valeur) url.searchParams.set(cle, valeur);
  }
  const position = a.dataset.ctaPosition;
  if (position) url.searchParams.set('utm_content', position);
  if (cid) url.searchParams.set(PARAM_IDENTIFIANT, cid);

  a.href = url.toString();
};

const init = (): void => {
  const origine = campagne();
  const cid = identifiantClient();
  /* Rien à transmettre et rien à identifier : on ne touche à aucun lien. */
  if (!Object.keys(origine).length && !cid) return;
  document
    .querySelectorAll<HTMLAnchorElement>('a[data-cta="souscrire"]')
    .forEach((a) => etiqueter(a, origine, cid));
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
