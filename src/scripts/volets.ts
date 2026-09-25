/**
 * Les trois volets de /strategie en ONGLETS (25/09/2026, demande de Martin, d'après une maquette :
 * une liste à gauche, le volet actif surligné, un grand panneau à droite). AMÉLIORATION
 * PROGRESSIVE : le HTML arrive avec les trois panneaux VISIBLES l'un sous l'autre et une liste de
 * liens d'ancre ; ce script pose les rôles d'onglets (tablist, tab, tabpanel), ne garde qu'un
 * panneau à l'écran, et suit le clavier (flèches, Début, Fin) comme l'adresse (#volet-quoi ouvre
 * le bon volet, à l'arrivée comme au changement). Sans lui, la page se lit entière et les liens
 * mènent à leur panneau. Aucun mot n'est ajouté ni retiré : les textes sont ceux validés par la
 * conformité (src/content/fr/strategy.ts).
 */
const init = (): void => {
  for (const bloc of document.querySelectorAll<HTMLElement>('[data-volets]')) {
    const liste = bloc.querySelector<HTMLElement>('[data-volets-liste]');
    const onglets = [...bloc.querySelectorAll<HTMLAnchorElement>('[data-volet-onglet]')];
    const panneaux = [...bloc.querySelectorAll<HTMLElement>('[data-volet-panneau]')];
    if (!liste || !onglets.length || onglets.length !== panneaux.length) continue;

    liste.setAttribute('role', 'tablist');
    onglets.forEach((onglet, i) => {
      const panneau = panneaux[i]!;
      onglet.setAttribute('role', 'tab');
      onglet.setAttribute('aria-controls', panneau.id);
      panneau.setAttribute('role', 'tabpanel');
      panneau.setAttribute('aria-labelledby', onglet.id);
      panneau.tabIndex = 0;
    });

    const choisir = (i: number, focus = false): void => {
      onglets.forEach((onglet, j) => {
        const actif = i === j;
        onglet.setAttribute('aria-selected', String(actif));
        onglet.tabIndex = actif ? 0 : -1;
        panneaux[j]!.hidden = !actif;
      });
      if (focus) onglets[i]!.focus();
    };
    const depuisAdresse = (): number => panneaux.findIndex((p) => `#${p.id}` === location.hash);

    onglets.forEach((onglet, i) => {
      onglet.addEventListener('click', (e) => {
        e.preventDefault();
        choisir(i);
        /* L'adresse suit, sans défilement ni entrée dans l'historique : un lien partagé rouvre le
           même volet. */
        history.replaceState(null, '', `#${panneaux[i]!.id}`);
      });
      onglet.addEventListener('keydown', (e) => {
        const n = onglets.length;
        let j = -1;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (i + 1) % n;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (i - 1 + n) % n;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = n - 1;
        if (j < 0) return;
        e.preventDefault();
        choisir(j, true);
      });
    });

    const initial = depuisAdresse();
    choisir(initial >= 0 ? initial : 0);
    window.addEventListener('hashchange', () => {
      const k = depuisAdresse();
      if (k >= 0) choisir(k);
    });
  }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

export {};
