/**
 * VERROU DE PAGE : la page ne défile plus derrière ce qui la recouvre. Trois surfaces s'en servent,
 * le tiroir du menu (SiteNav.astro), le panneau de recherche (recherche/panneau.ts) et la fenêtre
 * d'accès du simulateur (simulateur/page.ts).
 * PAS `overflow: hidden` SUR <html> : il retire la barre de défilement, et avec une barre classique
 * (Windows, souris sur Mac) la page se recentre de 7 px à chaque ouverture ; `scrollbar-gutter:
 * stable` laisse une colonne vide qu'aucun voile ne couvre (« un carré », Martin). La barre reste
 * en place et ce sont les GESTES qui sont neutralisés : molette, doigt, touches. La surface ouverte
 * garde son propre défilement ; un glissé de la barre de défilement passe encore, le geste est
 * délibéré. `data-verrou` SUR <html> EST LE REPÈRE UNIQUE de cet état, lu par les tests.
 * LE ZOOM N'EST JAMAIS NEUTRALISÉ (pincement, Ctrl + molette) : annuler tout `wheel` et `touchmove`
 * empêchait un visiteur malvoyant d'agrandir la page, menu ouvert.
 * LA PAGE EST AUSSI RENDUE INERTE : `aria-modal` et le piège à tabulation n'arrêtent ni le curseur
 * virtuel d'un lecteur d'écran (TalkBack, VoiceOver) ni le balayage tactile. `inert` est posé sur
 * les enfants de <body> qui ne contiennent pas la surface, plus ceux que l'appelant désigne ; seuls
 * les éléments rendus inertes ICI sont rétablis. Plusieurs propriétaires sont admis, le verrou ne
 * tombe qu'au dernier rendu. LES ÉCOUTEURS SONT RETIRÉS AVEC LUI : `wheel` et `touchmove` non
 * passifs font attendre le navigateur avant chaque défilement ; gardés, ils ralentissaient toute la
 * page.
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
  /* Agrandir la page reste permis : Ctrl + molette (le pincement d'un trackpad, aussi) et le
     pincement à deux doigts. */
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
