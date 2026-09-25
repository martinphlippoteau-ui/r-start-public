/**
 * Les trois volets de /strategie en ONGLETS (25/09/2026, demande de Martin, d'après une maquette :
 * la liste des volets, le volet actif surligné, un panneau qui montre le volet choisi). AMÉLIORATION
 * PROGRESSIVE : le HTML arrive avec les trois panneaux VISIBLES l'un sous l'autre, une liste de
 * liens d'ancre et, au pied de chaque panneau, des liens « précédent / suivant » vers les autres
 * ancres ; ce script pose les rôles d'onglets (tablist, tab, tabpanel), empile les panneaux dans
 * une même case (`data-volets-pret`, CSS de 04-Strategy.astro : la hauteur ne saute pas, le
 * panneau qui arrive entre en fondu), rend les autres `inert` (hors clavier, hors lecteurs
 * d'écran, dessins en pause), suit le clavier (flèches, Début, Fin, Espace), l'adresse
 * (#volet-quoi ouvre le bon volet, à l'arrivée comme au changement) et le balayage horizontal
 * sur écran tactile. Sans lui, la page se lit entière et les liens mènent à leur panneau. Aucun
 * mot du contenu n'est ajouté ni retiré : les textes sont ceux validés par la conformité
 * (src/content/fr/strategy.ts).
 */
const SEUIL_BALAYAGE = 48;

const init = (): void => {
  for (const bloc of document.querySelectorAll<HTMLElement>('[data-volets]')) {
    const liste = bloc.querySelector<HTMLElement>('[data-volets-liste]');
    const onglets = [...bloc.querySelectorAll<HTMLAnchorElement>('[data-volet-onglet]')];
    const panneaux = [...bloc.querySelectorAll<HTMLElement>('[data-volet-panneau]')];
    const pile = bloc.querySelector<HTMLElement>('[data-volets-panneaux]');
    if (!liste || !pile || !onglets.length || onglets.length !== panneaux.length) continue;

    liste.setAttribute('role', 'tablist');
    onglets.forEach((onglet, i) => {
      const panneau = panneaux[i]!;
      onglet.setAttribute('role', 'tab');
      onglet.setAttribute('aria-controls', panneau.id);
      panneau.setAttribute('role', 'tabpanel');
      panneau.setAttribute('aria-labelledby', onglet.id);
      panneau.tabIndex = 0;
    });
    bloc.setAttribute('data-volets-pret', '');

    let courant = -1;
    const choisir = (i: number, focus = false): void => {
      if (i === courant) return;
      courant = i;
      onglets.forEach((onglet, j) => {
        const actif = i === j;
        onglet.setAttribute('aria-selected', String(actif));
        onglet.tabIndex = actif ? 0 : -1;
        const panneau = panneaux[j]!;
        panneau.toggleAttribute('data-inactif', !actif);
        panneau.inert = !actif;
        panneau.setAttribute('aria-hidden', String(!actif));
      });
      if (focus) onglets[i]!.focus();
    };
    const indexDe = (hash: string): number => panneaux.findIndex((p) => `#${p.id}` === hash);
    const aller = (i: number, focus = false): void => {
      choisir(i, focus);
      /* L'adresse suit, sans défilement ni entrée dans l'historique : un lien partagé rouvre le
         même volet. */
      history.replaceState(null, '', `#${panneaux[i]!.id}`);
    };

    onglets.forEach((onglet, i) => {
      onglet.addEventListener('click', (e) => {
        e.preventDefault();
        aller(i);
      });
      onglet.addEventListener('keydown', (e) => {
        const n = onglets.length;
        let j = -1;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (i + 1) % n;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (i - 1 + n) % n;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = n - 1;
        else if (e.key === ' ') j = i;
        if (j < 0) return;
        e.preventDefault();
        aller(j, true);
      });
    });

    /* « Précédent » et « suivant » au pied des panneaux : des liens d'ancre, interceptés ici. */
    for (const lien of bloc.querySelectorAll<HTMLAnchorElement>('[data-volet-vers]')) {
      lien.addEventListener('click', (e) => {
        const k = indexDe(lien.getAttribute('href') ?? '');
        if (k < 0) return;
        e.preventDefault();
        aller(k, true);
      });
    }

    /* Balayage horizontal sur la pile des panneaux (écrans tactiles) : franc et surtout horizontal,
       sinon c'est un défilement. */
    let depart: { x: number; y: number } | null = null;
    pile.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      depart = { x: e.clientX, y: e.clientY };
    });
    pile.addEventListener('pointerup', (e) => {
      if (!depart) return;
      const dx = e.clientX - depart.x;
      const dy = e.clientY - depart.y;
      depart = null;
      if (Math.abs(dx) < SEUIL_BALAYAGE || Math.abs(dx) < Math.abs(dy) * 2) return;
      const n = panneaux.length;
      aller(dx < 0 ? Math.min(courant + 1, n - 1) : Math.max(courant - 1, 0));
    });
    pile.addEventListener('pointercancel', () => {
      depart = null;
    });

    const initial = indexDe(location.hash);
    choisir(initial >= 0 ? initial : 0);
    window.addEventListener('hashchange', () => {
      const k = indexDe(location.hash);
      if (k >= 0) choisir(k);
    });
  }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

export {};
