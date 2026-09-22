/**
 * RECHERCHE DU SITE : LE PANNEAU de SiteSearch.astro, ouvert par la loupe de la barre. Ce qu'une
 * recherche trouve et dans quel ordre est l'affaire de ./moteur.ts ; l'arrivée sur le passage visé,
 * celle de ./arrivee.ts. Ici : l'index, le rendu, la hauteur, le clavier, la mesure.
 * AUCUNE PAGE DE RÉSULTATS. Les résultats s'affichent à chaque frappe dans le panneau, en deux
 * rubriques, « Pages » puis « Questions ». Entrée ouvre le premier ; un résultat mène au passage exact.
 * LE PANNEAU A UNE HAUTEUR FIXE (demande de Martin) : celle du panneau vide, mesurée à chaque
 * ouverture ; les résultats sont ROGNÉS pour y tenir, en alternant entre les deux rubriques.
 * LA PAGE NE DÉFILE PAS derrière le panneau, par le verrou de src/scripts/verrou.ts (les raisons y
 * sont écrites). Elle peut encore bouger au glissé de la barre de défilement : la contraction de la
 * barre (`data-stuck`) est donc recopiée sur le panneau au fil de l'eau.
 * LE RELAIS DES VERRES. À l'ouverture, dans la même image, le panneau apparaît sous la barre, à sa
 * hauteur et dans sa matière, et la barre éteint son verre (global.css, `:has`) ; puis il grandit.
 * À la fermeture, il redescend, et c'est à la FIN du mouvement (`transitionend`, minuterie de
 * secours) qu'il est masqué et que la barre rallume son verre sans transition
 * (`data-sans-transition`). Les deux verres ne sont jamais allumés ensemble : rien ne clignote.
 * L'INDEX (dist/recherche.json, scripts/search-index.mjs) n'est demandé qu'à la première intention
 * (survol ou focus de la loupe, sinon ouverture) : une visite qui ne cherche rien ne le télécharge
 * pas. MESURE (src/scripts/analytics.ts, événement `rstart:mesure`) : `recherche` une fois la
 * frappe posée (1,5 s) ou au départ vers un résultat ; `recherche_clic`, le résultat, sa rubrique
 * et son rang. Une recherche qui ressemble à une adresse électronique ou porte une suite de
 * chiffres n'est pas transmise : une donnée personnelle n'a rien à faire dans la mesure d'audience.
 */
import { search } from '@/content/fr/search';
import { deverrouiller, verrouiller } from '@/scripts/verrou';
import { arriver, noterArrivee, sansBarre } from './arrivee';
import {
  bornesExtrait,
  classer,
  concepts,
  grouper,
  plages,
  preparer,
  type Concept,
  type Doc,
  type Plage,
  type Prepare,
  type Trouve,
} from './moteur';

/** Durées des mouvements (global.css), plus une marge : minuteries de secours si `transitionend`
    manque. */
const SECOURS_OUVERTURE = 440 + 120;
const SECOURS_FERMETURE = 320 + 120;
const PAUSE_MESURE = 1500;
/** Délai d'abandon du téléchargement de l'index, en millisecondes. */
const DELAI_INDEX = 8000;
/** Plafond avant rognage : la hauteur du panneau en garde rarement plus de deux par rubrique. */
const MAX_PAR_RUBRIQUE = 4;

const groupes = grouper(search.synonyms);

/* ------------------------------------------------------------------------------------------------ */
/* Extraits                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

/** Écrit `texte` dans `cible`, les plages surlignées en <mark>, entre `debut` et `fin`. */
const surligner = (
  cible: HTMLElement,
  texte: string,
  marques: Plage[],
  debut = 0,
  fin = texte.length
): void => {
  cible.replaceChildren();
  let curseur = debut;
  for (const [a, b] of marques) {
    if (b <= curseur || a >= fin) continue;
    const de = Math.max(a, curseur);
    if (de > curseur) cible.append(texte.slice(curseur, de));
    const mark = document.createElement('mark');
    mark.textContent = texte.slice(de, Math.min(b, fin));
    cible.append(mark);
    curseur = Math.min(b, fin);
  }
  if (curseur < fin) cible.append(texte.slice(curseur, fin));
};

/** L'extrait d'un résultat : une seule ligne, tronquée par le style, ses mots trouvés surlignés. */
const extrait = (cible: HTMLElement, p: Prepare, liste: Concept[]): void => {
  const texte = p.doc.texte;
  const marques = plages(p.motsTexte, liste);
  const [debut, fin] = bornesExtrait(p, marques);
  surligner(cible, texte, marques, debut, fin);
  if (debut > 0) cible.prepend('… ');
  if (fin < texte.length) cible.append(' …');
};

/* ------------------------------------------------------------------------------------------------ */
/* Panneau                                                                                           */
/* ------------------------------------------------------------------------------------------------ */

const mesurer = (detail: Record<string, unknown>): void => {
  document.dispatchEvent(new CustomEvent('rstart:mesure', { detail }));
};

/** Une recherche transmissible : ni adresse électronique, ni suite de chiffres. */
const transmissible = (q: string): boolean => !/@/.test(q) && !/\d[\d\s.-]{4,}/.test(q);

export const init = (): void => {
  const nav = document.querySelector<HTMLElement>('[data-sitenav]');
  const bouton = document.querySelector<HTMLButtonElement>('[data-recherche-ouvrir]');
  const panneau = document.querySelector<HTMLElement>('[data-recherche-panneau]');
  const voile = document.querySelector<HTMLElement>('[data-recherche-voile]');
  if (!nav || !bouton || !panneau || !voile) return;
  const bar = nav.querySelector<HTMLElement>('[data-sitenav-bar]');
  const champ = panneau.querySelector<HTMLInputElement>('[data-recherche-champ]');
  const statut = panneau.querySelector<HTMLElement>('[data-recherche-statut]');
  const rapides = panneau.querySelector<HTMLElement>('[data-recherche-rapides]');
  const resultats = panneau.querySelector<HTMLElement>('[data-recherche-resultats]');
  const vide = panneau.querySelector<HTMLElement>('[data-recherche-vide]');
  const videTexte = panneau.querySelector<HTMLElement>('[data-recherche-vide-texte]');
  const videLien = panneau.querySelector<HTMLElement>('[data-recherche-vide-lien]');
  const defilement = panneau.querySelector<HTMLElement>('[data-recherche-defilement]');
  const gabaritRubrique = panneau.querySelector<HTMLTemplateElement>(
    'template[data-recherche-gabarit-rubrique]'
  );
  const gabaritResultat = panneau.querySelector<HTMLTemplateElement>(
    'template[data-recherche-gabarit-resultat]'
  );
  if (
    !champ ||
    !statut ||
    !rapides ||
    !resultats ||
    !vide ||
    !videTexte ||
    !defilement ||
    !gabaritRubrique ||
    !gabaritResultat
  )
    return;

  /* LA LOUPE EST AFFICHÉE PAR `@media (scripting: enabled)` (global.css), que Safari 16, Chrome 119 et
     leurs aînés ignorent (les iPhone 8 et X, bloqués sur iOS 16) : ce script s'y exécutait sans que
     personne voie le bouton qui l'ouvre. Puisqu'on est là, les scripts tournent : on l'affiche. */
  if (getComputedStyle(bouton).display === 'none') bouton.classList.add('recherche-loupe-forcee');

  const libelleOuvrir = bouton.getAttribute('aria-label') ?? '';
  const libelleFermer = bouton.dataset.labelFermer ?? libelleOuvrir;
  const sobre = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Même matière que la barre à tout instant : sa contraction au défilement est recopiée à chaque
     changement, pas seulement à l'ouverture, puisque la page peut encore bouger sous le voile. */
  if (bar) {
    new MutationObserver(() =>
      panneau.toggleAttribute('data-stuck', bar.hasAttribute('data-stuck'))
    ).observe(bar, { attributes: true, attributeFilter: ['data-stuck'] });
  }

  /* --- Index ------------------------------------------------------------------------------------ */
  let index: Prepare[] | null = null;
  let chargement: Promise<void> | null = null;
  let echec = false;

  const charger = (): Promise<void> => {
    if (!chargement) {
      /* Une nouvelle tentative repart d'un état neutre : le panneau dit « recherche en cours », pas
         l'erreur de la tentative précédente. */
      echec = false;
      /* Huit secondes, pas davantage : sur un réseau qui pend (portail captif), la requête ne
         rejetait jamais et le panneau restait muet. L'abandon tombe dans le `catch`, qui affiche
         l'erreur. */
      const signal =
        typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(DELAI_INDEX) : undefined;
      chargement = fetch(panneau.dataset.index ?? '', { credentials: 'same-origin', signal })
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.json() as Promise<{ docs: Doc[] }>;
        })
        .then(({ docs }) => {
          index = preparer(docs);
          echec = false;
        })
        .catch(() => {
          echec = true;
          chargement = null;
        })
        .finally(() => {
          if (ouvert()) afficher();
        });
    }
    return chargement;
  };

  /* --- Mesure ----------------------------------------------------------------------------------- */
  let derniereMesuree = '';
  let minuterieMesure = 0;
  /** Résultats trouvés, avant rognage : c'est ce chiffre qui dit ce que le site ne couvre pas. */
  let nbResultats = 0;

  const mesurerRecherche = (): void => {
    window.clearTimeout(minuterieMesure);
    const q = champ.value.trim();
    if (q.length < 2 || q === derniereMesuree || !transmissible(q)) return;
    derniereMesuree = q;
    mesurer({ event: 'recherche', terme: q.slice(0, 80), nb_resultats: nbResultats });
  };

  /* --- Rendu ------------------------------------------------------------------------------------ */
  let annonce = 0;

  /* La zone est VIDÉE tout de suite, puis écrite à la minuterie : réécrire la même chaîne dans une zone
     `aria-live` n'annonce rien, deux recherches à « 3 résultats » restaient muettes la seconde
     fois. */
  const annoncer = (texte: string): void => {
    window.clearTimeout(annonce);
    statut.textContent = '';
    annonce = window.setTimeout(() => {
      statut.textContent = texte;
    }, 450);
  };

  const rubrique = (titre: string, cle: string, trouves: Trouve[], liste: Concept[]): Node => {
    const fragment = gabaritRubrique.content.cloneNode(true) as DocumentFragment;
    const libelle = fragment.querySelector<HTMLElement>('[data-rubrique-titre]');
    const ul = fragment.querySelector<HTMLElement>('[data-liste]');
    if (!libelle || !ul) return fragment;
    const id = `${panneau.id}-${cle}`;
    libelle.id = id;
    libelle.textContent = titre;
    ul.setAttribute('aria-labelledby', id);
    trouves.forEach((t, rang) => {
      const item = gabaritResultat.content.cloneNode(true) as DocumentFragment;
      const a = item.querySelector<HTMLAnchorElement>('a');
      const contexte = item.querySelector<HTMLElement>('[data-contexte]');
      const titreEl = item.querySelector<HTMLElement>('[data-titre]');
      const extraitEl = item.querySelector<HTMLElement>('[data-extrait]');
      if (!a || !contexte || !titreEl || !extraitEl) return;
      a.href = t.p.doc.url;
      a.dataset.rubrique = cle;
      a.dataset.rang = String(rang + 1);
      surligner(titreEl, t.p.doc.titre, plages(t.p.motsTitre, liste));
      if (t.p.doc.texte) extrait(extraitEl, t.p, liste);
      else extraitEl.remove();
      /* Sur la même ligne que l'extrait, séparés d'un point médian s'ils sont tous deux là. */
      if (t.p.doc.contexte) contexte.textContent = t.p.doc.contexte + (t.p.doc.texte ? ' · ' : '');
      else contexte.remove();
      ul.append(item);
    });
    return fragment;
  };

  const afficher = (): void => {
    const q = champ.value.trim();
    const liste = q ? concepts(q, groupes) : [];

    if (!q || !liste.length) {
      rapides.hidden = false;
      resultats.hidden = true;
      vide.hidden = true;
      nbResultats = 0;
      /* L'annonce en attente est ANNULÉE : effacer le champ en moins de 450 ms faisait lire
         « 4 résultats » devant un panneau revenu à ses liens rapides. */
      window.clearTimeout(annonce);
      statut.textContent = '';
      return;
    }
    rapides.hidden = true;

    /* L'index n'est pas encore là, ou n'a pas pu venir : on le DIT, à l'écran comme au lecteur d'écran.
       « Recherche en cours » n'était écrit que dans la zone `sr-only` : à l'œil, un panneau vide. */
    if (!index) {
      const message = echec ? (panneau.dataset.erreur ?? '') : (panneau.dataset.chargement ?? '');
      resultats.hidden = true;
      videTexte.textContent = message;
      if (videLien) videLien.hidden = !echec;
      vide.hidden = false;
      annoncer(message);
      return;
    }
    if (videLien) videLien.hidden = false;

    const { pages, questions } = classer(index, liste, q, MAX_PAR_RUBRIQUE);
    nbResultats = pages.length + questions.length;

    resultats.replaceChildren();
    if (pages.length) resultats.append(rubrique(search.groups.pages, 'pages', pages, liste));
    if (questions.length)
      resultats.append(rubrique(search.groups.questions, 'questions', questions, liste));
    resultats.hidden = nbResultats === 0;
    vide.hidden = nbResultats > 0;
    /* Fonction et non chaîne : `replace` interprète « $& », « $' » et « $` » dans une chaîne de
       remplacement, et le message affichait autre chose que ce que le visiteur avait tapé. */
    if (!nbResultats)
      videTexte.textContent = (videTexte.dataset.gabarit ?? '').replace('{q}', () => q);
    const affiches = ajuster();
    defilement.scrollTop = 0;

    /* Annoncés : les résultats VISIBLES, ceux qu'un lecteur d'écran va parcourir. */
    annoncer(
      affiches === 0
        ? (videTexte.textContent ?? '')
        : affiches === 1
          ? (panneau.dataset.compteUn ?? '')
          : (panneau.dataset.comptePlusieurs ?? '').replace('{n}', String(affiches))
    );
  };

  /* --- Géométrie -------------------------------------------------------------------------------- */
  /* Le panneau est `fixed` (SiteSearch.astro dit pourquoi) : il se cale sur l'enveloppe de la
     barre, dont la boîte ignore la contraction au défilement, rejouée avec `data-stuck`. Sans ce
     calage, sa largeur ne suivrait pas la barre. */
  const enveloppe = panneau.parentElement;
  const caler = (): void => {
    if (!enveloppe) return;
    const r = enveloppe.getBoundingClientRect();
    panneau.style.top = `${r.top}px`;
    panneau.style.left = `${r.left}px`;
    panneau.style.width = `${r.width}px`;
  };

  /* --- Hauteur fixe ----------------------------------------------------------------------------- */
  /** Hauteur ouverte du panneau, en pixels : celle du panneau vide, mesurée à chaque ouverture. */
  let hauteurOuverte = 0;

  /* Mesure du panneau vide, liens rapides visibles, hauteur libre : deux mises en page forcées dans
     le même tour, rien n'est peint entre les deux. L'appelant rétablit ensuite l'affichage. */
  const mesurerHauteur = (): number => {
    rapides.hidden = false;
    resultats.hidden = true;
    vide.hidden = true;
    panneau.style.height = 'auto';
    const h = panneau.offsetHeight;
    panneau.style.height = '';
    return h;
  };

  /* Rognage : tant que la liste déborde de la place qui lui revient, le dernier résultat de la
     rubrique la plus longue est retiré, à égalité celui des « Pages » (les questions sont plus
     précises). La mesure ne dépend pas de la hauteur courante du panneau, qui peut grandir :
     `scrollHeight` lit le contenu, pas la boîte. Renvoie le nombre de résultats restés visibles. */
  const ajuster = (): number => {
    const compter = (): number => resultats.querySelectorAll('a[href]').length;
    if (!hauteurOuverte || resultats.hidden) return compter();
    const dispo = hauteurOuverte - defilement.offsetTop;
    for (let garde = 0; garde < 2 * MAX_PAR_RUBRIQUE + 2; garde += 1) {
      if (defilement.scrollHeight <= dispo) break;
      /* JAMAIS MOINS D'UN RÉSULTAT : sur une fenêtre très basse (zoom de 400 %, 320 × 256), le
         rognage les retirait tous et le panneau restait blanc. La zone, défilante une fois le
         panneau établi, montre ce qui dépasse. */
      if (compter() <= 1) break;
      const listes = Array.from(resultats.querySelectorAll<HTMLElement>('[data-liste]'));
      if (!listes.length) break;
      const cible = listes.reduce((a, b) => (b.children.length > a.children.length ? b : a));
      if (!cible.lastElementChild) break;
      cible.lastElementChild.remove();
      if (!cible.children.length) cible.closest('[data-rubrique-bloc]')?.remove();
    }
    return compter();
  };

  /* --- Ouverture et fermeture ------------------------------------------------------------------- */
  let minuterieFermeture = 0;
  let minuterieEtabli = 0;
  const ouvert = (): boolean => nav.hasAttribute('data-recherche-ouverte');

  /** Panneau ÉTABLI : arrivé à sa hauteur. Seulement alors la zone des résultats peut défiler
      (global.css, `recherche-defilement`, qui dit pourquoi). */
  const etablir = (): void => {
    window.clearTimeout(minuterieEtabli);
    if (ouvert()) nav.setAttribute('data-recherche-etabli', '');
  };

  const ouvrir = (): void => {
    if (ouvert()) return;
    window.clearTimeout(minuterieFermeture);
    /* Même matière que la barre à cet instant : sa contraction au défilement est recopiée AVANT que le
       panneau soit affiché, pour qu'il naisse contracté, sans transition. */
    panneau.toggleAttribute('data-stuck', bar?.hasAttribute('data-stuck') ?? false);
    panneau.hidden = false;
    voile.hidden = false;
    /* Caler AVANT de mesurer : la hauteur du contenu dépend de la largeur. */
    caler();
    hauteurOuverte = mesurerHauteur();
    /* La hauteur fermée doit être enregistrée avant que l'état ouvert ne soit posé, sans quoi le
       panneau apparaît déjà déplié, sans transition. */
    void panneau.offsetHeight;
    nav.setAttribute('data-recherche-ouverte', '');
    panneau.style.height = `${hauteurOuverte}px`;
    if (sobre.matches) etablir();
    else minuterieEtabli = window.setTimeout(etablir, SECOURS_OUVERTURE);
    bouton.setAttribute('aria-expanded', 'true');
    bouton.setAttribute('aria-label', libelleFermer);
    verrouiller(panneau, defilement);
    /* Dans le même geste que le clic : iOS n'ouvre le clavier qu'à cette condition. */
    champ.focus({ preventScroll: true });
    champ.select();
    void charger();
    afficher();
  };

  /* Le relais : le panneau disparaît et la barre rallume son verre dans la même image. Son verre
     porte une transition de 320 ms ; `data-sans-transition` la suspend, puis s'efface deux
     images plus tard. */
  const masquer = (): void => {
    if (ouvert() || panneau.hidden) return;
    window.clearTimeout(minuterieFermeture);
    bar?.setAttribute('data-sans-transition', '');
    panneau.hidden = true;
    voile.hidden = true;
    panneau.style.top = '';
    panneau.style.left = '';
    panneau.style.width = '';
    if (bar) {
      void bar.offsetWidth;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => bar.removeAttribute('data-sans-transition'));
      });
    }
  };

  const fermer = ({ rendreFocus = true, instantane = false } = {}): void => {
    if (!ouvert()) return;
    mesurerRecherche();
    nav.removeAttribute('data-recherche-ouverte');
    nav.removeAttribute('data-recherche-etabli');
    window.clearTimeout(minuterieEtabli);
    panneau.style.height = '';
    bouton.setAttribute('aria-expanded', 'false');
    bouton.setAttribute('aria-label', libelleOuvrir);
    deverrouiller(panneau);
    if (rendreFocus) bouton.focus({ preventScroll: true });
    window.clearTimeout(minuterieFermeture);
    /* En mouvement réduit, aucune transition ne finira jamais : on masque tout de suite. */
    if (instantane || sobre.matches) masquer();
    else minuterieFermeture = window.setTimeout(masquer, SECOURS_FERMETURE);
  };

  /* Redimensionnement, rotation du téléphone : le panneau se recale sur la barre et reprend la hauteur
     du panneau vide, qui a changé avec la largeur. */
  window.addEventListener(
    'resize',
    () => {
      if (!ouvert()) return;
      caler();
      hauteurOuverte = mesurerHauteur();
      panneau.style.height = `${hauteurOuverte}px`;
      afficher();
    },
    { passive: true }
  );

  /* La fin réelle du mouvement, plutôt qu'une minuterie calée sur la durée du style. */
  panneau.addEventListener('transitionend', (e) => {
    if (e.target !== panneau || e.propertyName !== 'height') return;
    if (ouvert()) etablir();
    else masquer();
  });

  bouton.addEventListener('click', () => (ouvert() ? fermer() : ouvrir()));

  /* UNE SEULE SURFACE À LA FOIS : ouverts ensemble, tiroir et panneau se renvoyaient le focus à
     chaque Tab. Le tiroir demande la fermeture par un événement DOM (SiteNav.astro) : aucun des
     deux modules n'a à connaître l'autre. */
  document.addEventListener('rstart:recherche:fermer', () =>
    fermer({ rendreFocus: false, instantane: true })
  );

  /* « Souscrire » cliqué pendant la recherche, tunnel fermé : la fenêtre « bientôt » va s'ouvrir
     (écouteur sur `document`, donc APRÈS celui-ci). On ferme d'abord et le focus revient sur la
     loupe, où le navigateur le rendra à la fermeture de la fenêtre, au lieu de le perdre sur un
     panneau masqué. */
  nav.addEventListener('click', (e) => {
    if (!ouvert() || document.body.dataset.souscriptionOuverte === 'oui') return;
    if ((e.target as HTMLElement | null)?.closest('[data-cta="souscrire"]')) fermer();
  });
  /* Intention : l'index est demandé avant même le clic. */
  bouton.addEventListener('pointerenter', () => void charger(), { once: true });
  bouton.addEventListener('focus', () => void charger(), { once: true });
  voile.addEventListener('click', () => fermer());
  panneau
    .querySelector<HTMLButtonElement>('[data-recherche-fermer]')
    ?.addEventListener('click', () => fermer());

  champ.addEventListener('input', () => {
    /* Nouvelle tentative après un échec, À LA FRAPPE et pas dans `afficher()` : celui-ci est rappelé
       par la fin de chaque téléchargement, un échec s'y relancerait lui-même sans fin. */
    if (echec) void charger();
    afficher();
    window.clearTimeout(minuterieMesure);
    minuterieMesure = window.setTimeout(mesurerRecherche, PAUSE_MESURE);
  });

  /* Entrée : le premier résultat. Il n'y a pas de page de résultats. */
  champ.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.isComposing || !champ.value.trim() || resultats.hidden) return;
    e.preventDefault();
    resultats.querySelector<HTMLAnchorElement>('a[href]')?.click();
  });

  /* Sur téléphone, faire défiler les résultats range le clavier. */
  defilement.addEventListener(
    'touchmove',
    () => {
      if (document.activeElement === champ) champ.blur();
    },
    { passive: true }
  );

  const liens = (): HTMLAnchorElement[] =>
    Array.from(panneau.querySelectorAll<HTMLAnchorElement>('a[data-recherche-lien][href]')).filter(
      (a) => a.offsetParent !== null
    );

  document.addEventListener('keydown', (e) => {
    /* Une fenêtre native ouverte par-dessus (« la souscription ouvre bientôt ») a la main sur le
       clavier : annuler Échap ici empêchait sa fermeture, il fallait appuyer deux fois. */
    if (!ouvert() || document.querySelector('dialog[open]')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      fermer();
      return;
    }
    const actif = document.activeElement as HTMLElement | null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const tous = liens();
      if (!tous.length) return;
      /* Du champ au premier résultat, d'un résultat au suivant ; en remontant, du premier résultat au
         champ. Au bout de la liste, ou le focus ailleurs dans le panneau : la touche reste au navigateur. */
      const i = tous.indexOf(actif as HTMLAnchorElement);
      const bas = e.key === 'ArrowDown';
      let suivant: HTMLElement | undefined;
      if (actif === champ) suivant = bas ? tous[0] : undefined;
      else if (i >= 0) suivant = bas ? tous[i + 1] : i === 0 ? champ : tous[i - 1];
      if (!suivant) return;
      suivant.focus();
      e.preventDefault();
      return;
    }
    if (e.key === 'Tab') {
      const focusables = Array.from(
        panneau.querySelectorAll<HTMLElement>('input, button, a[href]')
      ).filter((el) => el.offsetParent !== null || el.matches('[data-recherche-fermer]'));
      const premier = focusables[0];
      const dernier = focusables.at(-1);
      if (!premier || !dernier) return;
      if (e.shiftKey && (actif === premier || !panneau.contains(actif))) {
        e.preventDefault();
        dernier.focus();
      } else if (!e.shiftKey && (actif === dernier || !panneau.contains(actif))) {
        e.preventDefault();
        premier.focus();
      }
    }
  });

  /* --- Départ vers un résultat ------------------------------------------------------------------ */
  panneau.addEventListener('click', (e) => {
    const lien = (e.target as HTMLElement).closest<HTMLAnchorElement>(
      'a[data-recherche-lien][href]'
    );
    if (!lien) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    mesurerRecherche();
    const q = champ.value.trim();
    mesurer({
      event: 'recherche_clic',
      terme: transmissible(q) ? q.slice(0, 80) : '',
      rubrique: lien.dataset.rubrique ?? '',
      rang: Number(lien.dataset.rang ?? 0),
      resultat: lien.querySelector('[data-titre]')?.textContent ?? lien.textContent?.trim() ?? '',
      destination: lien.pathname + lien.hash,
    });

    noterArrivee(lien);
    const memePage = sansBarre(lien.pathname) === sansBarre(location.pathname);
    fermer({ rendreFocus: false, instantane: !memePage });
    if (!memePage) return;
    /* MÊME PAGE : l'ancre est changée ici, pas par le navigateur. Un lien « /faq#… » suivi depuis
       « /faq/ » rechargerait toute la page (la barre finale en fait une autre adresse). Même ancre
       : rien ne changerait, on rejoue l'arrivée. Sans ancre : le haut de la page. */
    e.preventDefault();
    if (!lien.hash) window.scrollTo({ top: 0 });
    else if (lien.hash !== location.hash) location.hash = lien.hash;
    else arriver();
  });

  window.addEventListener('pageshow', (e) => {
    /* Retour arrière : la page revient du cache telle qu'on l'a quittée, panneau fermé. */
    if (e.persisted) fermer({ rendreFocus: false, instantane: true });
  });
};
