/**
 * RECHERCHE DU SITE : L'ARRIVÉE SUR LE PASSAGE. Sans rapport avec le panneau, et exécuté sur toutes les
 * pages : c'est la page d'ARRIVÉE qui joue ce module, pas celle où l'on a cherché.
 *
 * Au clic sur un résultat, le panneau note la cible en `sessionStorage` (`noterArrivee`) ; la page
 * d'arrivée la reconnaît, éclaire brièvement le titre de la section ou la question
 * (`data-recherche-cible`, global.css), et se recale une fois la page chargée : les sections épinglées
 * de l'accueil changent la hauteur du document après le premier défilement vers l'ancre. L'ouverture de
 * la question elle-même est l'affaire de src/scripts/faqAncre.ts.
 *
 * Une arrivée par un lien ordinaire, un favori ou un retour arrière n'éclaire rien : la note n'existe
 * que si le visiteur vient de choisir ce résultat, et elle est effacée à la lecture.
 */
const CLE_ARRIVEE = 'rstart:recherche:arrivee';

/** « /faq/ » et « /faq » sont la même page : les deux côtés de la comparaison passent par ici. */
export const sansBarre = (chemin: string): string => chemin.replace(/\/+$/, '') || '/';

/** Note le passage vers lequel le visiteur part. `lien` est le résultat cliqué. */
export const noterArrivee = (lien: HTMLAnchorElement): void => {
  try {
    sessionStorage.setItem(CLE_ARRIVEE, sansBarre(lien.pathname) + lien.hash);
  } catch {
    /* stockage refusé : on arrive sans éclairage, rien de plus */
  }
};

export const arriver = (): void => {
  let attendue: string | null = null;
  try {
    attendue = sessionStorage.getItem(CLE_ARRIVEE);
    if (attendue) sessionStorage.removeItem(CLE_ARRIVEE);
  } catch {
    return;
  }
  if (!attendue || attendue !== sansBarre(location.pathname) + location.hash) return;
  let id = '';
  try {
    id = decodeURIComponent(location.hash.slice(1));
  } catch {
    return;
  }
  const cible = id ? document.getElementById(id) : null;
  if (!cible) return;
  /* Une question refermée à la main puis visée de nouveau depuis la même page : pas de changement
     d'ancre, donc rien pour src/scripts/faqAncre.ts. On l'ouvre ici. */
  if (cible instanceof HTMLDetailsElement && !cible.open) cible.open = true;

  const repere =
    cible instanceof HTMLDetailsElement
      ? cible.querySelector<HTMLElement>('summary')
      : cible.querySelector<HTMLElement>('h2, h1');
  const recaler = (): void => cible.scrollIntoView({ block: 'start' });
  if (document.readyState !== 'complete') {
    window.addEventListener('load', () => requestAnimationFrame(recaler), { once: true });
  } else {
    recaler();
  }
  if (!repere) return;
  repere.removeAttribute('data-recherche-cible');
  void repere.offsetWidth;
  repere.setAttribute('data-recherche-cible', '');
  window.setTimeout(() => repere.removeAttribute('data-recherche-cible'), 2600);
};
