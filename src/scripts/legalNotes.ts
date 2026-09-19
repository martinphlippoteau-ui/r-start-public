/**
 * NOTES LÉGALES : le dépliage à l'arrivée sur une note. Module à part depuis le 19/09/2026 : écrit dans
 * LegalNotes.astro, il était publié sur /documentation, /a-propos et /presse alors que le composant
 * n'y rend plus rien (`AFFICHER = false`). Le composant ne l'importe que s'il affiche ses notes.
 */
/**
 * Déplie le bloc des notes quand l'adresse vise une note, puis donne le focus à la note visée.
 * Appelé au chargement (arrivée par un lien externe portant déjà le fragment) et à chaque
 * `hashchange` (clic sur un appel de note dans la page). Le défilement reste celui du navigateur :
 * `scroll-mt-24` sur les <li> place la note sous la barre collée.
 */
const openTargetedNote = (): void => {
  const hash = location.hash;
  if (!hash || hash.length < 2) return;
  let target: Element | null = null;
  try {
    target = document.querySelector(hash);
  } catch {
    return; // fragment non conforme à un sélecteur CSS : rien à ouvrir
  }
  const details = target?.closest<HTMLDetailsElement>('[data-legal-notes]');
  if (!details || !target) return;
  if (!details.open) {
    details.open = true;
    // Le bloc vient de s'ouvrir : le navigateur avait déjà renoncé à défiler vers une cible masquée.
    target.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  (target as HTMLElement).focus({ preventScroll: true });
};

window.addEventListener('hashchange', openTargetedNote);
openTargetedNote();

export {};
