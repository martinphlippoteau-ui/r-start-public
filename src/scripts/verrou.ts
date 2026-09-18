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
 * LE ZOOM N'EST JAMAIS NEUTRALISÉ (audit du 18/09/2026) : ni le pincement à deux doigts, ni Ctrl +
 * molette. La première version annulait tout `wheel` et tout `touchmove` : menu ou recherche ouverts,
 * un visiteur malvoyant ne pouvait plus agrandir la page. heroAvance.ts faisait déjà l'exception.
 *
 * LA PAGE EST AUSSI RENDUE INERTE (audit du 18/09/2026). Le tiroir et la recherche se déclarent
 * `aria-modal` et piègent la tabulation, mais ni l'un ni l'autre n'arrête le curseur virtuel d'un
 * lecteur d'écran ou le balayage tactile : TalkBack, là où le tiroir sert, et plusieurs versions de
 * VoiceOver n'honorent pas `aria-modal`, et l'utilisateur partait lire la page recouverte par le voile.
 * `inert` est posé sur tous les enfants de <body> qui ne contiennent pas la surface (le contenu, le pied
 * de page, le bandeau de consentement, les pastilles), plus les éléments que l'appelant désigne (la
 * barre, sous le tiroir). Seuls les éléments rendus inertes ICI sont rétablis à la fin.
 *
 * Plusieurs propriétaires sont admis : le verrou ne tombe qu'au dernier rendu. LES ÉCOUTEURS SONT
 * RETIRÉS AVEC LUI : `wheel` et `touchmove` sont posés en `passive: false`, et un écouteur non passif
 * oblige le navigateur à attendre le script avant chaque défilement. Gardés « pour la suite », ils
 * ralentissaient le défilement de toute la page, jusqu'au rechargement, dès le premier usage du menu.
 */

/** Propriétaire → sa zone défilante, s'il en a une. */
const proprietaires = new Map<object, HTMLElement | null>();
/** Propriétaire → les éléments qu'il a rendus inertes, et lui seul. */
const neutralises = new Map<object, HTMLElement[]>();

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
  /* Agrandir la page reste permis : Ctrl + molette (c'est aussi le pincement d'un trackpad, que le
     navigateur traduit ainsi) et le pincement à deux doigts sur un écran tactile. */
  if (e instanceof WheelEvent && e.ctrlKey) return;
  if (typeof TouchEvent !== 'undefined' && e instanceof TouchEvent && e.touches.length > 1) return;
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
const cesserDEcouter = (): void => {
  if (!ecoute) return;
  ecoute = false;
  document.removeEventListener('wheel', bloquerGeste);
  document.removeEventListener('touchmove', bloquerGeste);
  document.removeEventListener('keydown', bloquerTouche);
};

/**
 * Verrouille la page pour `proprietaire` (un objet quelconque, l'élément de la surface fait l'affaire).
 * `zone` est l'élément qui, lui, garde le droit de défiler.
 */
export const verrouiller = (
  proprietaire: object,
  zone: HTMLElement | null = null,
  aussiInertes: (HTMLElement | null)[] = []
): void => {
  ecouter();
  proprietaires.set(proprietaire, zone);
  document.documentElement.setAttribute('data-verrou', '');

  if (neutralises.has(proprietaire)) return;
  const surface = proprietaire instanceof Node ? proprietaire : null;
  const cibles = [
    ...Array.from(document.body.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement &&
        !/^(SCRIPT|STYLE|DIALOG)$/.test(el.tagName) &&
        !(surface && el.contains(surface))
    ),
    ...aussiInertes.filter((el): el is HTMLElement => el instanceof HTMLElement),
  ].filter((el) => !el.inert);
  cibles.forEach((el) => {
    el.inert = true;
  });
  neutralises.set(proprietaire, cibles);
};

/** Rend la page à son propriétaire précédent, ou au visiteur s'il n'y en a plus. */
export const deverrouiller = (proprietaire: object): void => {
  proprietaires.delete(proprietaire);
  (neutralises.get(proprietaire) ?? []).forEach((el) => {
    el.inert = false;
  });
  neutralises.delete(proprietaire);
  if (proprietaires.size) return;
  document.documentElement.removeAttribute('data-verrou');
  cesserDEcouter();
};
