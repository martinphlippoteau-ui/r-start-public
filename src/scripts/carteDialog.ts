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
 *
 * LA SÉQUENCE D'OUVERTURE en trois temps, demandée le 16/09/2026 : « clic tourne la card, contenu tout
 * petit au dos ; zoom sur ce contenu en affichage final ; fermeture en faisant le flow inverse ».
 * Elle est jouée ici et non en CSS parce qu'elle a besoin d'une mesure : le zoom part de la carte
 * cliquée, dont la position et la taille dépendent de la colonne, de la largeur de l'écran et du
 * défilement. Aucune règle CSS ne peut les écrire.
 */

/*
 * Le demi-tour de la carte, puis l'agrandissement. Les deux valeurs servent aux deux sens.
 * RALENTIES le 16/09/2026 (« c'est un peu rapide donc pas super fluide ») : 300 et 320 ms. À cette
 * vitesse, la rotation et le zoom se lisaient comme un saut, et le temps mort du quart de tour, où
 * rien n'est visible, occupait une part trop grande d'une séquence trop courte. Un mouvement en trois
 * temps a besoin de durer pour qu'on distingue les trois.
 */
const TOUR = 460;
const ZOOM = 480;
/** Assez de profondeur pour que la rotation se voie sans déformer les bords. */
const FUITE = 1600;
/* Courbes ADOUCIES avec l'allongement : une accélération franche sur 460 ms donne une secousse là où
   elle passait inaperçue sur 300. Le départ et l'arrivée sont plus progressifs. */
const COURBE_TOUR = 'cubic-bezier(0.4, 0.05, 0.25, 1)';
const COURBE_ZOOM = 'cubic-bezier(0.25, 0.6, 0.3, 1)';

const sobre = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Position et échelle à donner à la fenêtre pour qu'elle se superpose exactement à la carte.
 * ÉCHELLE UNIFORME, le plus petit des deux rapports : une échelle par axe ferait entrer la fenêtre
 * dans le cadre de la carte au prix d'un texte étiré, ce qui se voit immédiatement.
 */
const poseSurLaCarte = (dialog: HTMLDialogElement, carte: HTMLElement): string => {
  const c = carte.getBoundingClientRect();
  const d = dialog.getBoundingClientRect();
  const echelle = Math.min(c.width / d.width, c.height / d.height);
  const dx = c.left + c.width / 2 - (d.left + d.width / 2);
  const dy = c.top + c.height / 2 - (d.top + d.height / 2);
  return `translate(${dx}px, ${dy}px) scale(${echelle})`;
};

/*
 * Les trois états de la fenêtre. Ils partagent la MÊME LISTE DE FONCTIONS, dans le même ordre : c'est
 * ce qui permet au navigateur d'interpoler fonction par fonction. Deux listes de formes différentes
 * le forceraient à passer par des matrices, et la rotation deviendrait un écrasement.
 */
const etat = (pose: string, angle: number): string =>
  `perspective(${FUITE}px) ${pose} rotateY(${angle}deg)`;
const POSE_NEUTRE = 'translate(0px, 0px) scale(1)';

/*
 * LE DOS DE LA FENÊTRE, MASQUÉ À LA MAIN.
 *
 * `backface-visibility: hidden` devrait suffire : un élément tourné au-delà du quart de tour cesse
 * d'être visible. Il ne mord PAS ici, et ça se voit — pendant le retournement, on lisait le texte de
 * la fenêtre à l'envers, en miroir, à la place de la carte.
 * La fenêtre est dans la COUCHE SUPÉRIEURE du navigateur (<dialog> ouverte en modale) : elle y est
 * peinte dans son propre contexte de rendu, et la propriété n'y produit pas l'effet attendu.
 *
 * On pose donc l'opacité nous-mêmes, en marche d'escalier : invisible tant que le demi-tour n'est pas
 * terminé, visible ensuite. Une deuxième animation, parallèle à celle de la transformation, parce
 * qu'une seule ne peut pas donner une courbe différente à deux propriétés.
 * Le palier est fin (un centième du cycle) : à l'écran, c'est une bascule nette, exactement ce que
 * `backface-visibility` aurait fait.
 */
const masquerLeDos = (dialog: HTMLDialogElement, sortie: boolean): void => {
  const bascule = sortie ? ZOOM / (TOUR + ZOOM) : TOUR / (TOUR + ZOOM);
  const cles = sortie
    ? [
        { opacity: '1', offset: 0 },
        { opacity: '1', offset: bascule },
        { opacity: '0', offset: Math.min(bascule + 0.01, 1) },
        { opacity: '0', offset: 1 },
      ]
    : [
        { opacity: '0', offset: 0 },
        { opacity: '0', offset: Math.max(bascule - 0.01, 0) },
        { opacity: '1', offset: bascule },
        { opacity: '1', offset: 1 },
      ];
  dialog.animate(cles, {
    duration: TOUR + ZOOM,
    easing: 'linear',
    fill: sortie ? 'forwards' : 'backwards',
  });
};

const tourneCarte = (carte: HTMLElement, de: number, vers: number, delai: number): Animation =>
  carte.animate(
    [
      { transform: `perspective(${FUITE}px) rotateY(${de}deg)` },
      { transform: `perspective(${FUITE}px) rotateY(${vers}deg)` },
    ],
    { duration: TOUR, delay: delai, easing: COURBE_TOUR, fill: 'forwards' }
  );

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
    /* Le mot est À L'ÉCRAN depuis le 16/09/2026, plus seulement pour les lecteurs d'écran : une croix
       seule demande de deviner. `textContent` et non `innerHTML` : le libellé vient d'un attribut de
       la page, on ne lui laisse pas la possibilité de porter du balisage. */
    fermer.textContent = bouton.dataset.carteFermer ?? 'Fermer';

    dialog.append(fermer, detail);
    document.body.append(dialog);
    detail.hidden = false;

    bouton.hidden = false;
    bouton.dataset.carteLiee = '1';

    const carte = bouton.closest<HTMLElement>('.carte-face');
    /*
     * REPLI : sans carte à retourner, sans API d'animation, ou en `prefers-reduced-motion`, la fenêtre
     * s'ouvre et se ferme d'un coup. La requête est relue à chaque fois plutôt que mémorisée, le
     * réglage pouvant changer en cours de visite.
     */
    const brut = (): boolean => !carte || sobre() || typeof dialog.animate !== 'function';
    /* Un seul mouvement à la fois : sans ce verrou, un clic sur le voile pendant l'ouverture jouerait
       les deux sens en même temps et la carte resterait retournée. */
    let enCours = false;

    const ouvrir = (): void => {
      if (dialog.open || enCours) return;
      if (brut()) {
        dialog.showModal();
        return;
      }
      enCours = true;
      dialog.showModal();
      const pose = poseSurLaCarte(dialog, carte as HTMLElement);
      tourneCarte(carte as HTMLElement, 0, 180, 0);
      const mouvement = dialog.animate(
        [
          /* 1. De dos, à la taille de la carte. */
          { transform: etat(pose, -180), offset: 0 },
          /* 2. Le contenu est là, tout petit, à la place exacte de la carte qui vient de s'effacer. */
          { transform: etat(pose, 0), offset: TOUR / (TOUR + ZOOM), easing: COURBE_ZOOM },
          /* 3. Il s'agrandit jusqu'à sa taille d'affichage. */
          { transform: etat(POSE_NEUTRE, 0), offset: 1 },
        ],
        { duration: TOUR + ZOOM, easing: COURBE_TOUR, fill: 'backwards' }
      );
      masquerLeDos(dialog, false);
      void mouvement.finished.catch(() => undefined).then(() => {
        enCours = false;
      });
    };

    const fermerAnime = (): void => {
      if (!dialog.open || enCours) return;
      if (brut()) {
        dialog.close();
        return;
      }
      enCours = true;
      /* Le voile part avec le mouvement, et non à la fin : il a sa propre transition, hors de portée
         de l'API d'animation, et cette classe est le seul moyen de la déclencher (global.css). */
      dialog.classList.add('carte-dialog--sort');
      const pose = poseSurLaCarte(dialog, carte as HTMLElement);
      /* Les mêmes trois états, lus à l'envers : le zoom se referme, puis la fenêtre se retourne. */
      const mouvement = dialog.animate(
        [
          { transform: etat(POSE_NEUTRE, 0), offset: 0 },
          { transform: etat(pose, 0), offset: ZOOM / (TOUR + ZOOM), easing: COURBE_TOUR },
          { transform: etat(pose, -180), offset: 1 },
        ],
        { duration: TOUR + ZOOM, easing: COURBE_ZOOM, fill: 'forwards' }
      );
      masquerLeDos(dialog, true);
      /* La carte revient pendant le dernier demi-tour, jamais avant : les deux faces se relaient. */
      tourneCarte(carte as HTMLElement, 180, 0, ZOOM);
      void mouvement.finished.catch(() => undefined).then(() => {
        /*
         * TOUT EST PURGÉ, pas seulement le mouvement. Les animations de fermeture sont en
         * `fill: forwards` : elles CONTINUENT de s'appliquer une fois terminées, et celle qui porte
         * l'opacité laisserait la fenêtre à zéro. La fois suivante, elle s'ouvrirait invisible.
         * On efface donc tout ce qui reste sur la fenêtre et sur la carte, l'une comme l'autre étant
         * revenues à leur état naturel.
         */
        for (const a of dialog.getAnimations()) a.cancel();
        for (const a of (carte as HTMLElement).getAnimations()) a.cancel();
        dialog.classList.remove('carte-dialog--sort');
        dialog.close();
        enCours = false;
      });
    };

    bouton.addEventListener('click', ouvrir);
    fermer.addEventListener('click', fermerAnime);

    /*
     * TOUTE LA CARTE EST CLIQUABLE (16/09/2026, demande de l'équipe). Un écouteur sur la carte, et non
     * une carte transformée en bouton : le bouton « En savoir plus » reste le VRAI contrôle, celui que
     * le clavier atteint et que les lecteurs d'écran annoncent. Imbriquer le reste de la carte dans un
     * bouton serait invalide (un bouton ne peut pas contenir un titre) et ferait lire toute la carte
     * comme un seul libellé.
     * Le clic sur le bouton lui-même est ignoré ici, sinon il compterait deux fois ; le verrou
     * `enCours` le rattraperait, mais mieux vaut ne pas s'en remettre à lui.
     * `data-carte-cliquable` sert au CSS : le curseur ne devient une main que si ce script a tourné.
     */
    if (carte) {
      carte.dataset.carteCliquable = '1';
      carte.addEventListener('click', (e) => {
        const cible = e.target as HTMLElement | null;
        if (cible?.closest('[data-carte-ouvrir]')) return;
        /* Un lien ou un bouton posé un jour dans la carte garde la priorité sur l'ouverture. */
        if (cible?.closest('a, button')) return;
        ouvrir();
      });
    }

    /* Échap ferme la fenêtre sans passer par nos boutons : on reprend la main pour jouer le retour. */
    dialog.addEventListener('cancel', (e) => {
      if (brut()) return;
      e.preventDefault();
      fermerAnime();
    });

    /* Clic sur le fond : <dialog> ne le distingue pas de la fenêtre, la cible de l'événement est le
       <dialog> lui-même quand on clique à côté de son contenu. */
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) fermerAnime();
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
