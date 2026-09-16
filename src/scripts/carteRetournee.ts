/**
 * Cartes à retournement de la page /strategie.
 *
 * HISTOIRE COURTE, ET ELLE EXPLIQUE LA FORME DU FICHIER. Ces cartes ont d'abord ouvert une <dialog>
 * modale (« le format de card sur le site d'Apple qui ouvre une popup »), puis un retournement suivi
 * d'un zoom. L'équipe a tranché le 16/09/2026 : « je veux que le contenu soit au dos des cards en fait,
 * pas de zoom ni de popup ». Il ne reste donc qu'un mouvement, la carte tourne et montre son dos.
 * Plus de fenêtre, plus de voile, plus de couche supérieure, plus de piège à focus à entretenir.
 *
 * AMÉLIORATION PROGRESSIVE, inchangée et c'est tout le point. Le HTML arrive avec le contenu de chaque
 * carte VISIBLE dans le flux, sous elle, et le bouton caché. Ce script déplace ce contenu au dos, puis
 * révèle le bouton. Sans lui, la page se lit entière et aucun bouton ne reste sans effet.
 *
 * CE QUE LE RETOURNEMENT OBLIGE À FAIRE À LA MAIN. Une face cachée par `backface-visibility` reste
 * dans l'arbre d'accessibilité et sous le clavier : on la rend donc `inert`, et on déplace le focus
 * d'une face à l'autre. C'est ce que la <dialog> donnait gratuitement et qu'il faut maintenant écrire.
 */

/** Le demi-tour, dans les deux sens. */
const TOUR = 460;
const COURBE = 'cubic-bezier(0.4, 0.05, 0.25, 1)';
/** Assez de profondeur pour que la rotation se voie sans déformer les bords. */
const FUITE = 1600;

const sobre = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const tourner = (carte: HTMLElement, de: number, vers: number): void => {
  if (typeof carte.animate !== 'function' || sobre()) {
    carte.style.transform = `perspective(${FUITE}px) rotateY(${vers}deg)`;
    return;
  }
  const a = carte.animate(
    [
      { transform: `perspective(${FUITE}px) rotateY(${de}deg)` },
      { transform: `perspective(${FUITE}px) rotateY(${vers}deg)` },
    ],
    { duration: TOUR, easing: COURBE, fill: 'forwards' }
  );
  /*
   * L'animation est REMPLACÉE par un style en dur une fois finie. Sans cela, chaque aller-retour
   * empilerait une animation en `fill: forwards` de plus sur la carte, et la dernière posée gagnerait
   * sur la position réelle. Une seule propriété écrite, pas de pile qui grandit.
   */
  void a.finished.catch(() => undefined).then(() => {
    carte.style.transform = `perspective(${FUITE}px) rotateY(${vers}deg)`;
    a.cancel();
  });
};

const init = (): void => {
  const boutons = document.querySelectorAll<HTMLButtonElement>('[data-carte-ouvrir]');
  if (!boutons.length) return;

  for (const bouton of boutons) {
    if (bouton.dataset.carteLiee === '1') continue;
    const id = bouton.getAttribute('aria-controls');
    const detail = id ? document.getElementById(id) : null;
    const carte = bouton.closest<HTMLElement>('.carte-face');
    const verso = carte?.querySelector<HTMLElement>('.carte-verso');
    const recto = carte?.querySelector<HTMLElement>('.carte-recto');
    if (!detail || !carte || !verso || !recto) continue;

    /* Le contenu quitte le flux pour le dos de la carte. */
    verso.append(detail);
    detail.hidden = false;

    const fermer = document.createElement('button');
    fermer.type = 'button';
    fermer.className = 'carte-retour';
    fermer.textContent = bouton.dataset.carteFermer ?? 'Fermer';
    verso.append(fermer);

    bouton.hidden = false;
    bouton.dataset.carteLiee = '1';
    carte.dataset.carteCliquable = '1';

    /*
     * `inert` retire la face cachée du clavier, du pointeur et de l'arbre d'accessibilité d'un coup.
     * Sans lui, on tabule dans un dos invisible, et un lecteur d'écran lit les deux faces à la suite.
     */
    let retournee = false;
    verso.inert = true;

    const basculer = (vers: boolean): void => {
      if (vers === retournee) return;
      retournee = vers;
      tourner(carte, vers ? 0 : 180, vers ? 180 : 0);
      recto.inert = vers;
      verso.inert = !vers;
      /* Le focus suit la face montrée : sinon il resterait sur un bouton devenu inatteignable. */
      (vers ? fermer : bouton).focus({ preventScroll: true });
    };

    bouton.addEventListener('click', () => basculer(true));
    fermer.addEventListener('click', () => basculer(false));

    /*
     * TOUTE LA FACE AVANT EST CLIQUABLE. Le dos, non : on y lit un texte, et un clic pour sélectionner
     * un mot ne doit pas refermer la carte. Seul son bouton la referme.
     * Le bouton du recto est ignoré ici, sinon le clic compterait deux fois.
     */
    recto.addEventListener('click', (e) => {
      const cible = e.target as HTMLElement | null;
      if (cible?.closest('a, button')) return;
      basculer(true);
    });

    /* Échap referme la carte retournée, comme il refermait la fenêtre. */
    carte.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && retournee) {
        e.stopPropagation();
        basculer(false);
      }
    });
  }

  /* Le contenu est déplacé HORS de son conteneur d'origine : celui-ci n'a plus rien à occuper. */
  for (const vide of document.querySelectorAll<HTMLElement>('[data-carte-detail-hote]')) {
    if (!vide.children.length) vide.hidden = true;
  }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

export {};
