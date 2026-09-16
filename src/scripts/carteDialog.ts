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
    bouton.addEventListener('click', () => dialog.showModal());

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
