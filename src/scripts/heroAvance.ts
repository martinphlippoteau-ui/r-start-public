/**
 * LE HERO DE L'ACCUEIL SE FRANCHIT D'UN SEUL GESTE (17/09/2026, demande de l'équipe : « fluidifier le
 * scroll du hero de la home pour passer automatiquement au contenu une fois le scroll commencé »).
 *
 * CE QUE ÇA FAIT. Entre le haut de la page et le début du contenu (le haut de la section qui recouvre
 * le hero en rideau), la page n'a plus que DEUX POSITIONS DE REPOS : le hero entier, ou le contenu en
 * place. Le premier cran de molette, le premier glissé du doigt ou la première touche de défilement
 * lance un défilement animé jusqu'à l'autre position. Vers le bas depuis le hero, on arrive au contenu ;
 * vers le haut depuis le début du contenu, on revient au hero. Plus bas dans la page, rien ne change :
 * le défilement reste celui du navigateur.
 * Les effets liés au défilement (vol des textes, logo qui grandit et se floute, rideau) se jouent en
 * entier pendant le trajet : ils suivent la position, pas le geste.
 *
 * C'EST UNE EXCEPTION ASSUMÉE au garde-fou « pas de scroll hijacking » de motion.ts, limitée à ce seul
 * passage. Ce qui la rend acceptable :
 *  - RIEN EN MOUVEMENT RÉDUIT : `prefers-reduced-motion: reduce` rend le défilement natif, sans
 *    aucune interception (et suit un changement de réglage en cours de visite) ;
 *  - rien quand un champ, un bouton ou un lien a le focus au clavier pour la touche Espace (elle les
 *    active), ni quand une fenêtre ou le tiroir du menu est ouvert (le document est alors verrouillé) ;
 *  - jamais sur un zoom à deux doigts, ni sur un glissé horizontal ;
 *  - un clic dans la barre de défilement (pointeur) interrompt le trajet : la main reprend la main ;
 *  - Origine, Fin, les liens d'ancre et le passage au clavier par Tab restent natifs.
 *
 * L'INERTIE DES TRACKPADS. Un geste sur trackpad émet des événements de molette pendant une à deux
 * secondes après qu'on a levé les doigts. Sans précaution, cette traîne relancerait un défilement dès
 * l'arrivée, ou pousserait la page au-delà du contenu. Les événements de molette sont donc absorbés
 * pendant le trajet, puis tant qu'ils continuent d'arriver sans pause de plus de 160 ms (une traîne
 * n'en fait jamais) : sans condition pendant 1,2 s après l'arrivée, puis seulement tant que leurs crans
 * décroissent, signature d'une inertie qui s'amortit. Une molette qu'on se remet à tourner donne des
 * crans égaux ou croissants : c'est un nouveau geste, on le laisse passer. Un geste en sens inverse est
 * toujours un nouveau geste.
 *
 * L'INVITATION À DÉFILER du hero (« Découvrir R Start ») mène à la même position, par le même trajet.
 * C'est un vrai lien d'ancre : sans script, elle fonctionne seule ; avec, le focus est posé sur la
 * section d'arrivée, comme l'aurait fait la navigation d'ancre.
 *
 * `scroll-behavior: smooth` (global.css) est suspendu pendant le trajet : chaque `scrollTo` de l'animation
 * lancerait sinon son propre défilement doux, et les deux se battraient.
 */

const HERO = '#apercu';
const INDICE = '[data-hero-scroll-hint]';
/** Tolérance de position, en pixels : les positions de défilement peuvent être fractionnaires. */
const MARGE = 2;
/** Pause qui sépare deux gestes de molette : une traîne d'inertie n'en fait jamais d'aussi longue. */
const PAUSE_GESTE = 160;
/** Au-delà de ce délai après l'arrivée, un flot continu de molette est un nouveau geste. */
const PLAFOND_TRAINE = 1200;
/** Glissé minimal du doigt avant de décider d'un sens. */
const SEUIL_DOIGT = 8;

/*
 * Courbe cubic-bezier(0.33, 0, 0.15, 1) : un départ franc sans être brutal, qui prolonge le geste déjà
 * commencé, et une longue arrivée douce. Une courbe « in-out » classique resterait presque immobile
 * pendant les cent premières millisecondes, et la page aurait l'air de ne pas répondre au geste.
 */
const courbe = (() => {
  const [x1, y1, x2, y2] = [0.33, 0, 0.15, 1];
  const bx = (t: number) => 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3;
  const by = (t: number) => 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
  const dbx = (t: number) =>
    3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
  return (x: number): number => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i += 1) {
      const d = dbx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (bx(t) - x) / d;
      t = Math.min(1, Math.max(0, t));
    }
    return by(t);
  };
})();

const init = (): void => {
  const hero = document.querySelector<HTMLElement>(HERO);
  const indice = document.querySelector<HTMLAnchorElement>(INDICE);
  /*
   * LE CONTENU, C'EST LA CIBLE DE L'INVITATION À DÉFILER, et non le frère qui suit le hero dans le
   * DOM : ce frère est le <script> du composant, rendu en place, dont la boîte vaut zéro. Faute
   * d'invitation, la première section qui suit.
   */
  const ancre = indice?.hash
    ? document.getElementById(decodeURIComponent(indice.hash.slice(1)))
    : null;
  let suivante = hero?.nextElementSibling ?? null;
  while (suivante && suivante.tagName !== 'SECTION') suivante = suivante.nextElementSibling;
  const contenu = (ancre ?? suivante) as HTMLElement | null;
  if (!hero || !contenu) return;

  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)');

  /** Haut du contenu dans le document : le hero n'a pas d'espace réservé d'épinglage, la mesure est stable. */
  const cible = (): number => Math.round(contenu.getBoundingClientRect().top + window.scrollY);
  const y = (): number => window.scrollY;

  let enCours: number | null = null;
  let finTrajet = 0;
  let derniereMolette = 0;
  let dernierCran = 0;
  let sensTraine = 0;

  /** Page verrouillée (tiroir du menu, recherche du site : `data-verrou`, src/scripts/verrou.ts ; ou
      fenêtre modale) : on ne touche à rien. Un seul repère pour toutes les surfaces. */
  const verrouillee = (): boolean =>
    document.documentElement.hasAttribute('data-verrou') ||
    document.querySelector('dialog[open]') !== null;

  /**
   * Le sens demandé mène-t-il à un passage ? Vers le bas : on est au-dessus du contenu. Vers le haut :
   * on est au-dessous du haut de page, et pas plus bas que le début du contenu.
   */
  const destination = (sens: number): number | null => {
    const haut = cible();
    const pos = y();
    if (sens > 0 && pos < haut - MARGE) return haut;
    if (sens < 0 && pos > MARGE && pos <= haut + MARGE) return 0;
    return null;
  };

  const arreter = (): void => {
    if (enCours !== null) cancelAnimationFrame(enCours);
    enCours = null;
    document.documentElement.style.scrollBehavior = '';
  };

  const aller = (vers: number, sens: number): void => {
    arreter();
    const depart = y();
    const distance = vers - depart;
    if (Math.abs(distance) <= MARGE) return;
    /* Durée proportionnelle au trajet, bornée : un écran de 900 px se franchit en 0,85 s environ. */
    const duree = Math.min(1100, Math.max(650, Math.abs(distance) * 0.95));
    const t0 = performance.now();
    sensTraine = sens;
    document.documentElement.style.scrollBehavior = 'auto';
    const pas = (maintenant: number): void => {
      const avance = Math.min(1, (maintenant - t0) / duree);
      window.scrollTo(0, depart + distance * courbe(avance));
      if (avance < 1) {
        enCours = requestAnimationFrame(pas);
      } else {
        enCours = null;
        finTrajet = performance.now();
        document.documentElement.style.scrollBehavior = '';
      }
    };
    enCours = requestAnimationFrame(pas);
  };

  /* ── Molette et trackpad ──────────────────────────────────────────────────────────────────── */
  const surMolette = (e: WheelEvent): void => {
    if (reduit.matches || e.ctrlKey || verrouillee()) return;
    const maintenant = performance.now();
    const ecart = maintenant - derniereMolette;
    derniereMolette = maintenant;
    const cran = Math.abs(e.deltaY);
    const cranPrecedent = dernierCran;
    dernierCran = cran;
    const sens = Math.sign(e.deltaY);
    if (sens === 0 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

    /* Pendant le trajet : tout est absorbé, la page est déjà en route. */
    if (enCours !== null) {
      e.preventDefault();
      return;
    }
    /*
     * La traîne d'inertie du geste qui vient d'aboutir : même sens, sans pause. Sous le plafond, tout
     * flot continu en fait partie ; au-delà, seulement tant que les crans DÉCROISSENT, ce que fait
     * une inertie qui s'amortit et jamais une molette qu'on tourne à nouveau (crans égaux ou qui
     * remontent). Les derniers crans égaux d'une traîne (1, 1…) passent : quelques pixels.
     */
    if (
      sens === sensTraine &&
      ecart < PAUSE_GESTE &&
      (maintenant - finTrajet < PLAFOND_TRAINE || cran < cranPrecedent)
    ) {
      e.preventDefault();
      return;
    }
    const vers = destination(sens);
    if (vers === null) return;
    e.preventDefault();
    aller(vers, sens);
  };

  /* ── Toucher ──────────────────────────────────────────────────────────────────────────────── */
  let doigtY: number | null = null;
  let doigtX = 0;
  let decide = false;
  const surDebutDoigt = (e: TouchEvent): void => {
    if (e.touches.length !== 1) {
      doigtY = null;
      return;
    }
    doigtY = e.touches[0]!.clientY;
    doigtX = e.touches[0]!.clientX;
    decide = false;
  };
  const surDoigt = (e: TouchEvent): void => {
    if (reduit.matches || doigtY === null || e.touches.length !== 1 || verrouillee()) return;
    if (enCours !== null) {
      if (e.cancelable) e.preventDefault();
      return;
    }
    if (decide) return;
    const dy = doigtY - e.touches[0]!.clientY;
    const dx = doigtX - e.touches[0]!.clientX;
    if (Math.abs(dy) < SEUIL_DOIGT || Math.abs(dx) > Math.abs(dy)) return;
    decide = true;
    const sens = Math.sign(dy);
    const vers = destination(sens);
    if (vers === null || !e.cancelable) return;
    e.preventDefault();
    aller(vers, sens);
  };
  const surFinDoigt = (): void => {
    doigtY = null;
  };

  /* ── Clavier ──────────────────────────────────────────────────────────────────────────────── */
  const surTouche = (e: KeyboardEvent): void => {
    if (reduit.matches || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || verrouillee())
      return;
    const cibleTouche = e.target as HTMLElement | null;
    if (
      cibleTouche?.closest(
        'input, textarea, select, [contenteditable=""], [contenteditable="true"], dialog, [role="dialog"]'
      )
    )
      return;
    let sens = 0;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') sens = 1;
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') sens = -1;
    else if (e.key === ' ') {
      /* Espace active un bouton, un lien ou un résumé qui a le focus : on le lui laisse. */
      if (cibleTouche?.closest('button, a, summary, [role="button"]')) return;
      sens = e.shiftKey ? -1 : 1;
    }
    if (sens === 0) return;
    if (enCours !== null) {
      e.preventDefault();
      return;
    }
    const vers = destination(sens);
    if (vers === null) return;
    e.preventDefault();
    aller(vers, sens);
  };

  /* ── Invitation à défiler ─────────────────────────────────────────────────────────────────── */
  const surIndice = (e: MouseEvent): void => {
    if (reduit.matches || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    e.preventDefault();
    aller(cible(), 1);
    /* Le focus suit, comme après une navigation d'ancre, sans provoquer de défilement propre. */
    if (!contenu.hasAttribute('tabindex')) contenu.setAttribute('tabindex', '-1');
    contenu.focus({ preventScroll: true });
  };

  window.addEventListener('wheel', surMolette, { passive: false });
  window.addEventListener('touchstart', surDebutDoigt, { passive: true });
  window.addEventListener('touchmove', surDoigt, { passive: false });
  window.addEventListener('touchend', surFinDoigt, { passive: true });
  window.addEventListener('touchcancel', surFinDoigt, { passive: true });
  window.addEventListener('keydown', surTouche);
  /* Un clic dans la barre de défilement pendant le trajet : l'utilisateur reprend la main. */
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && enCours !== null) arreter();
  });
  indice?.addEventListener('click', surIndice);
  reduit.addEventListener('change', () => {
    if (reduit.matches) arreter();
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

export {};
