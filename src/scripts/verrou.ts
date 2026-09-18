/**
 * VERROU DE PAGE (18/09/2026) : la page ne défile plus derrière ce qui la recouvre. Deux surfaces s'en
 * servent, le tiroir du menu (SiteNav.astro) et le panneau de recherche (src/scripts/recherche.ts).
 *
 * PAS `overflow: hidden` SUR <html>, le verrou classique. Il retire la barre de défilement : avec une
 * barre classique (Windows, souris branchée sur Mac), la page se recentre de 7 px à chaque ouverture,
 * la pastille de navigation avec elle ; et réserver sa place (`scrollbar-gutter: stable`) laisse une
 * colonne vide de 15 px qu'aucun voile ne couvre, « un carré » (Martin, 17/09/2026). Les deux essais
 * sont dans l'historique.
 * La barre de défilement reste donc en place, et ce sont les GESTES qui sont neutralisés : molette,
 * doigt, et les touches qui font défiler. La surface ouverte garde son propre défilement, à la
 * condition qu'elle en ait besoin : une liste qui tient dans sa hauteur ne défile pas davantage que
 * la page. Un glissé de la barre de défilement elle-même passe encore, et c'est très bien : le geste
 * est délibéré, la page bouge alors sous le voile.
 *
 * `data-verrou` SUR <html> EST LE REPÈRE UNIQUE de cet état. src/scripts/heroAvance.ts le lit pour ne
 * pas intercepter la molette pendant qu'une surface est ouverte ; il y avait là trois détections
 * différentes, une par surface, et chaque nouvelle surface en demandait une de plus.
 *
 * Plusieurs propriétaires sont admis (le tiroir peut s'ouvrir par-dessus le panneau) : le verrou ne
 * tombe qu'au dernier rendu. Les écouteurs sont posés à la première ouverture et gardés ensuite ; ils
 * sortent en une comparaison tant que rien n'est verrouillé.
 */

/** Propriétaire → sa zone défilante, s'il en a une. */
const proprietaires = new Map<object, HTMLElement | null>();

/** Touches qui font défiler la page. */
const TOUCHES = new Set([' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown']);

const peutDefiler = (zone: HTMLElement | null): boolean =>
  !!zone && zone.scrollHeight > zone.clientHeight + 1;

/** Le geste part-il d'une zone qui a de quoi défiler elle-même ? */
const dansUneZone = (cible: EventTarget | null): boolean => {
  if (!(cible instanceof Node)) return false;
  for (const zone of proprietaires.values()) {
    if (zone && zone.contains(cible) && peutDefiler(zone)) return true;
  }
  return false;
};

const bloquerGeste = (e: Event): void => {
  if (!proprietaires.size || dansUneZone(e.target)) return;
  e.preventDefault();
};

const bloquerTouche = (e: KeyboardEvent): void => {
  if (!proprietaires.size || !TOUCHES.has(e.key) || e.defaultPrevented) return;
  const actif = document.activeElement;
  /* Dans un champ, ces touches déplacent le curseur ; sur un bouton, l'espace l'actionne. Elles leur
     appartiennent, on ne s'en mêle pas. */
  if (
    actif instanceof HTMLInputElement ||
    actif instanceof HTMLTextAreaElement ||
    actif instanceof HTMLSelectElement
  )
    return;
  if (e.key === ' ' && actif instanceof HTMLButtonElement) return;
  if (dansUneZone(actif)) return;
  e.preventDefault();
};

let ecoute = false;
const ecouter = (): void => {
  if (ecoute) return;
  ecoute = true;
  /* `passive: false` : sans quoi le navigateur refuse l'annulation du geste. */
  document.addEventListener('wheel', bloquerGeste, { passive: false });
  document.addEventListener('touchmove', bloquerGeste, { passive: false });
  document.addEventListener('keydown', bloquerTouche);
};

/**
 * Verrouille la page pour `proprietaire` (un objet quelconque, l'élément de la surface fait l'affaire).
 * `zone` est l'élément qui, lui, garde le droit de défiler.
 */
export const verrouiller = (proprietaire: object, zone: HTMLElement | null = null): void => {
  ecouter();
  proprietaires.set(proprietaire, zone);
  document.documentElement.setAttribute('data-verrou', '');
};

/** Rend la page à son propriétaire précédent, ou au visiteur s'il n'y en a plus. */
export const deverrouiller = (proprietaire: object): void => {
  proprietaires.delete(proprietaire);
  if (!proprietaires.size) document.documentElement.removeAttribute('data-verrou');
};
