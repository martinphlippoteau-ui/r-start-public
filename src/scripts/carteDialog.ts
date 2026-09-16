/**
 * Tuiles à fenêtre de la page /strategie (16/09/2026, demande de l'équipe : « j'aime bien le format
 * de card sur le site d'Apple qui ouvre une popup pour le contenu »).
 *
 * AMÉLIORATION PROGRESSIVE, et c'est tout le point. Le HTML arrive avec le contenu de chaque tuile
 * VISIBLE dans le flux, sous sa tuile, et le bouton d'ouverture caché. Ce script déplace ce contenu
 * dans une <dialog> qu'il crée, puis révèle le bouton. Sans lui, la page se lit donc entière, et aucun
 * bouton ne reste sans effet : c'est la seule façon de faire une fenêtre sans perdre les deux tiers du
 * propos pour qui n'exécute pas de script.
 *
 * <dialog> NATIVE plutôt qu'une fenêtre maison : le navigateur donne le piégeage du clavier dans la
 * fenêtre, la fermeture par Échap, l'inertie du reste de la page et le rôle ARIA. Rien de tout cela
 * n'est à réécrire, et tout serait à moitié faux si on le réécrivait.
 */
const init = (): void => {
  const boutons = document.querySelectorAll<HTMLButtonElement>('[data-carte-ouvrir]');
  if (!boutons.length) return;

  for (const bouton of boutons) {
    if (bouton.dataset.carteLiee === '1') continue;
    const id = bouton.getAttribute('aria-controls');
    const detail = id ? document.getElementById(id) : null;
    if (!detail) continue;

    const dialog = document.createElement('dialog');
    dialog.className = 'carte-dialog';
    /* La fenêtre est nommée par le titre de la tuile : sans nom, elle est annoncée « dialogue ». */
    const titre = bouton.dataset.carteTitre;
    if (titre) dialog.setAttribute('aria-label', titre);

    const fermer = document.createElement('button');
    fermer.type = 'button';
    fermer.className = 'carte-dialog-fermer';
    fermer.innerHTML =
      '<span aria-hidden="true">×</span>' +
      '<span class="visually-hidden">' +
      (bouton.dataset.carteFermer ?? 'Fermer') +
      '</span>';
    fermer.addEventListener('click', () => dialog.close());

    dialog.append(fermer, detail);
    document.body.append(dialog);
    detail.hidden = false;

    bouton.hidden = false;
    bouton.dataset.carteLiee = '1';

    /*
     * LA TUILE SE RETOURNE POUR OUVRIR LA FENÊTRE (16/09/2026, demande de l'équipe). La carte pivote
     * jusqu'à se présenter de profil, et la fenêtre s'ouvre à ce moment-là ; à la fermeture, elle
     * revient.
     *
     * ON ATTEND `transitionend`, ET NON UN DÉLAI ÉCRIT EN DUR : la durée vit dans la feuille de style
     * (.carte-face), et deux valeurs à tenir d'accord finissent toujours par diverger. Un garde-fou
     * `setTimeout` ouvre quand même la fenêtre si l'événement ne vient pas : une transition sur un
     * élément masqué, ou interrompue, n'en émet aucun, et la carte resterait alors muette.
     *
     * `prefers-reduced-motion` : aucune classe n'est posée, la fenêtre s'ouvre directement. La requête
     * est relue à chaque clic plutôt que mémorisée, le réglage pouvant changer en cours de visite.
     */
    const carte = bouton.closest<HTMLElement>('.carte-face');
    const sobre = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    bouton.addEventListener('click', () => {
      if (!carte || sobre()) {
        dialog.showModal();
        return;
      }
      let ouverte = false;
      const ouvrir = (): void => {
        if (ouverte) return;
        ouverte = true;
        carte.removeEventListener('transitionend', ouvrir);
        if (!dialog.open) dialog.showModal();
      };
      carte.addEventListener('transitionend', ouvrir);
      window.setTimeout(ouvrir, 600);
      carte.classList.add('carte-face--profil');
    });

    /* La tuile revient dès la fermeture, quelle qu'en soit la cause : bouton, Échap ou clic au fond. */
    dialog.addEventListener('close', () => carte?.classList.remove('carte-face--profil'));

    /* Clic sur le fond : <dialog> ne le distingue pas de la fenêtre, la cible de l'événement est le
       <dialog> lui-même quand on clique à côté de son contenu. */
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
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
