/**
 * RECHERCHE DU SITE (17/09/2026) : le panneau de SiteSearch.astro, ouvert par la loupe de la barre.
 *
 * AUCUNE PAGE DE RÉSULTATS. Les résultats s'affichent à chaque frappe dans le panneau, en deux
 * rubriques, « Pages » puis « Questions ». Entrée ouvre le premier ; un résultat mène au passage exact.
 *
 * L'INDEX (dist/recherche.json, scripts/search-index.mjs) n'est demandé qu'à la première intention :
 * survol ou focus de la loupe, sinon ouverture. Une visite qui ne cherche rien ne le télécharge pas.
 *
 * LA COMPARAISON est insensible aux accents, à la casse et aux ligatures (NFKD : « 1ᵉʳ », « œ ») et
 * tolère les fautes de frappe :
 *  - un mot tapé trouve les mots qui COMMENCENT par lui (la recherche suit la frappe : « jouis » trouve
 *    « jouissance ») ;
 *  - à partir de quatre lettres, une faute est admise, deux à partir de huit (distance de Damerau-
 *    Levenshtein : lettre en trop, en moins, remplacée, ou deux lettres inversées), y compris sur le
 *    début d'un mot plus long, pendant qu'on le tape ;
 *  - un mot ou une expression d'un groupe de synonymes (src/content/fr/search.ts) trouve aussi les
 *    autres membres du groupe, tels quels ou au pluriel seulement : une faute ou un début de mot sur un
 *    synonyme rapprocherait des mots qui n'ont plus rien à voir ;
 *  - les mots vides (« le », « de », « quels »…) sont ignorés, sauf si la recherche ne contient qu'eux.
 * Tous les mots de la recherche doivent être trouvés ; à défaut, les documents qui en trouvent le plus
 * sont proposés, pour qu'une recherche de plusieurs mots ne tombe pas à vide pour un seul.
 *
 * LE CLASSEMENT pèse un mot trouvé dans le titre trois fois plus que dans le texte, ajoute un peu pour
 * les occurrences répétées et pour l'expression entière trouvée d'un bloc, et départage à égalité par
 * l'ordre du menu.
 *
 * MESURE (après consentement, src/scripts/analytics.ts, qui reçoit un événement `rstart:mesure`) :
 *  - `recherche` : la recherche une fois la frappe posée (1,5 s), ou au départ vers un résultat ;
 *  - `recherche_clic` : le résultat choisi, sa rubrique et son rang.
 * Une recherche qui ressemble à une adresse électronique ou porte une suite de chiffres n'est pas
 * transmise : on ne sait pas ce qu'un visiteur y a tapé, et une donnée personnelle n'a rien à faire
 * dans un outil de mesure d'audience.
 *
 * ARRIVÉE SUR LE PASSAGE. Au clic, la cible est notée en `sessionStorage` ; la page d'arrivée la
 * reconnaît, éclaire brièvement le titre de la section ou la question (`data-recherche-cible`,
 * global.css), et se recale une fois la page chargée : les sections épinglées de l'accueil changent la
 * hauteur du document après le premier défilement vers l'ancre. L'ouverture de la question elle-même
 * est l'affaire de src/scripts/faqAncre.ts.
 */
import { search } from '@/content/fr/search';

interface Doc {
  type: 'page' | 'question';
  titre: string;
  contexte?: string;
  url: string;
  texte: string;
}

interface Mot {
  /** Forme comparée : sans accent, minuscule. */
  n: string;
  debut: number;
  fin: number;
}

interface Prepare {
  doc: Doc;
  rang: number;
  motsTitre: Mot[];
  motsTexte: Mot[];
}

interface Alternative {
  mots: string[];
  /** 1 pour les mots tapés, moins pour un synonyme. */
  poids: number;
}

type Concept = Alternative[];

interface Trouve {
  p: Prepare;
  score: number;
  concepts: number;
}

const CLE_ARRIVEE = 'rstart:recherche:arrivee';
const DUREE_FERMETURE = 380;
const PAUSE_MESURE = 1500;
const MAX_PAR_RUBRIQUE = 6;
const POIDS_SYNONYME = 0.8;

const VIDES = new Set(
  (
    'a au aux avec ce ces cet cette comment combien d de des du elle elles en est et etre il ils ' +
    'je l la le les leur leurs ma mes mon ne nos notre on ou par pas peut pour qu quand que quel ' +
    'quelle quelles quels qui quoi sa se ses son sont sur ta tes ton tu un une vos votre vous y'
  ).split(' ')
);

/* ------------------------------------------------------------------------------------------------ */
/* Comparaison                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

const plier = (s: string): string =>
  s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae');

const MOT = /[\p{L}\p{N}]+/gu;

const decouper = (s: string): Mot[] =>
  Array.from(s.matchAll(MOT), (m) => ({
    n: plier(m[0]),
    debut: m.index ?? 0,
    fin: (m.index ?? 0) + m[0].length,
  }));

/** Distance de Damerau-Levenshtein restreinte, abandonnée dès qu'elle dépasse `max`. */
const distance = (a: string, b: string, max: number): number => {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let avant = new Array<number>(b.length + 1);
  let prec = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const cour = new Array<number>(b.length + 1);
    cour[0] = i;
    let minLigne = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cout = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prec[j] + 1, cour[j - 1] + 1, prec[j - 1] + cout);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, avant[j - 2] + 1);
      }
      cour[j] = v;
      if (v < minLigne) minLigne = v;
    }
    if (minLigne > max) return max + 1;
    avant = prec;
    prec = cour;
  }
  return prec[b.length];
};

/**
 * Qualité de la rencontre entre un mot tapé et un mot du document, de 0 (rien) à 1 (identique).
 * Mémorisée le temps d'une frappe : les mêmes mots reviennent de document en document, et une recherche
 * se relit une seconde fois pour surligner les résultats affichés.
 */
const memoire = new Map<string, number>();
const qualite = (tape: string, mot: string, flou: boolean): number => {
  const cle = `${tape}\u0000${mot}\u0000${flou ? 1 : 0}`;
  let q = memoire.get(cle);
  if (q === undefined) {
    q = comparer(tape, mot, flou);
    memoire.set(cle, q);
  }
  return q;
};
const comparer = (tape: string, mot: string, flou: boolean): number => {
  if (mot === tape) return 1;
  if (mot.startsWith(tape)) return tape.length >= 3 ? 0.9 : 0.6;
  if (!flou || tape.length < 4) return 0;
  const tolerance = tape.length >= 8 ? 2 : 1;
  if (distance(tape, mot, tolerance) <= tolerance) return 0.6;
  if (mot.length > tape.length && distance(tape, mot.slice(0, tape.length), tolerance) <= tolerance)
    return 0.45;
  return 0;
};

/** Groupes de synonymes, chaque membre découpé en mots comparables. */
const groupes: string[][][] = search.synonyms.map((groupe) =>
  groupe.map((membre) => decouper(membre).map((m) => m.n))
);

/**
 * La recherche en concepts : chaque mot utile, ou chaque expression d'un groupe de synonymes, avec ses
 * formes admises.
 */
const concepts = (recherche: string): Concept[] => {
  const mots = decouper(recherche).map((m) => m.n);
  const sortie: Concept[] = [];
  const vides: string[] = [];
  for (let i = 0; i < mots.length;) {
    let expression: { groupe: string[][]; membre: string[] } | null = null;
    for (const groupe of groupes) {
      for (const membre of groupe) {
        if (
          membre.length > 1 &&
          membre.length <= mots.length - i &&
          membre.every((m, k) => mots[i + k] === m) &&
          (!expression || membre.length > expression.membre.length)
        )
          expression = { groupe, membre };
      }
    }
    if (expression) {
      const { groupe, membre } = expression;
      sortie.push([
        { mots: membre, poids: 1 },
        ...groupe.filter((m) => m !== membre).map((m) => ({ mots: m, poids: POIDS_SYNONYME })),
      ]);
      i += membre.length;
      continue;
    }
    const mot = mots[i];
    i += 1;
    if (mot.length < 2 && !/\d/.test(mot)) continue;
    if (VIDES.has(mot)) {
      vides.push(mot);
      continue;
    }
    const groupe = groupes.find((g) => g.some((m) => m.length === 1 && m[0] === mot));
    sortie.push([
      { mots: [mot], poids: 1 },
      ...(groupe ?? [])
        .filter((m) => !(m.length === 1 && m[0] === mot))
        .map((m) => ({ mots: m, poids: POIDS_SYNONYME })),
    ]);
  }
  return sortie.length ? sortie : vides.map((mot) => [{ mots: [mot], poids: 1 }]);
};

/**
 * Positions (indices de mots) où une alternative est trouvée, avec leur qualité. Un mot seul admet la
 * faute de frappe s'il a été tapé ; une expression exige chacun de ses mots, dans l'ordre.
 */
const rencontres = (mots: Mot[], alt: Alternative): { i: number; long: number; q: number }[] => {
  const synonyme = alt.poids < 1;
  const sortie: { i: number; long: number; q: number }[] = [];
  const n = alt.mots.length;
  for (let i = 0; i + n <= mots.length; i += 1) {
    let q = 1;
    for (let k = 0; k < n && q > 0; k += 1) {
      /* Un synonyme ne vaut que tel quel ou au pluriel : en début de mot, « coût » trouvait
         « coûte ». */
      const tape = alt.mots[k];
      const mot = mots[i + k].n;
      const qk = synonyme
        ? Number(mot === tape || mot === tape + 's' || mot === tape + 'x')
        : qualite(tape, mot, n === 1);
      q = n === 1 ? qk : qk >= 0.9 ? q : 0;
    }
    if (q > 0) sortie.push({ i, long: n, q });
  }
  return sortie;
};

const evaluer = (p: Prepare, liste: Concept[], expression: string[]): Trouve => {
  let score = 0;
  let trouves = 0;
  for (const concept of liste) {
    let meilleur = 0;
    for (const alt of concept) {
      const titre = rencontres(p.motsTitre, alt);
      const texte = rencontres(p.motsTexte, alt);
      if (!titre.length && !texte.length) continue;
      const qTitre = Math.max(0, ...titre.map((r) => r.q));
      const qTexte = Math.max(0, ...texte.map((r) => r.q));
      const repetes = Math.min(texte.length, 8);
      const s =
        alt.poids *
        ((qTitre > 0 ? 3 * qTitre + 0.5 * qTexte : qTexte) + 0.15 * Math.log2(1 + repetes));
      if (s > meilleur) meilleur = s;
    }
    if (meilleur > 0) {
      trouves += 1;
      score += meilleur;
    }
  }
  if (expression.length > 1) {
    const bloc = { mots: expression, poids: 1 };
    if (rencontres(p.motsTitre, bloc).length) score += 2;
    else if (rencontres(p.motsTexte, bloc).length) score += 1;
  }
  return { p, score, concepts: trouves };
};

/* ------------------------------------------------------------------------------------------------ */
/* Extraits                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

/** Plages [début, fin[ du texte à surligner. */
const plages = (mots: Mot[], liste: Concept[]): [number, number][] => {
  const sortie: [number, number][] = [];
  for (const concept of liste) {
    for (const alt of concept) {
      for (const r of rencontres(mots, alt)) {
        sortie.push([mots[r.i].debut, mots[r.i + r.long - 1].fin]);
      }
    }
  }
  return sortie.sort((a, b) => a[0] - b[0]);
};

/** Écrit `texte` dans `cible`, les plages surlignées en <mark>, entre `debut` et `fin`. */
const surligner = (
  cible: HTMLElement,
  texte: string,
  marques: [number, number][],
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

const LONGUEUR_EXTRAIT = 150;
const AVANT_EXTRAIT = 45;

const extrait = (cible: HTMLElement, p: Prepare, liste: Concept[]): void => {
  const texte = p.doc.texte;
  const marques = plages(p.motsTexte, liste);
  let debut = 0;
  if (marques.length && marques[0][0] > AVANT_EXTRAIT) {
    const mot = p.motsTexte.find((m) => m.debut >= marques[0][0] - AVANT_EXTRAIT);
    debut = mot?.debut ?? 0;
  }
  let fin = Math.min(texte.length, debut + LONGUEUR_EXTRAIT);
  if (fin < texte.length) {
    const dernier = [...p.motsTexte].reverse().find((m) => m.fin <= fin);
    fin = dernier?.fin ?? fin;
  }
  surligner(cible, texte, marques, debut, fin);
  if (debut > 0) cible.prepend('… ');
  if (fin < texte.length) cible.append(' …');
};

/* ------------------------------------------------------------------------------------------------ */
/* Panneau                                                                                           */
/* ------------------------------------------------------------------------------------------------ */

const sansBarre = (chemin: string): string => chemin.replace(/\/+$/, '') || '/';

const mesurer = (detail: Record<string, unknown>): void => {
  document.dispatchEvent(new CustomEvent('rstart:mesure', { detail }));
};

/** Une recherche transmissible : ni adresse électronique, ni suite de chiffres. */
const transmissible = (q: string): boolean => !/@/.test(q) && !/\d[\d\s.-]{4,}/.test(q);

const init = (): void => {
  const nav = document.querySelector<HTMLElement>('[data-sitenav]');
  const bouton = document.querySelector<HTMLButtonElement>('[data-recherche-ouvrir]');
  const panneau = document.querySelector<HTMLElement>('[data-recherche-panneau]');
  const voile = document.querySelector<HTMLElement>('[data-recherche-voile]');
  if (!nav || !bouton || !panneau || !voile) return;
  const champ = panneau.querySelector<HTMLInputElement>('[data-recherche-champ]');
  const statut = panneau.querySelector<HTMLElement>('[data-recherche-statut]');
  const rapides = panneau.querySelector<HTMLElement>('[data-recherche-rapides]');
  const resultats = panneau.querySelector<HTMLElement>('[data-recherche-resultats]');
  const vide = panneau.querySelector<HTMLElement>('[data-recherche-vide]');
  const videTexte = panneau.querySelector<HTMLElement>('[data-recherche-vide-texte]');
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

  const libelleOuvrir = bouton.getAttribute('aria-label') ?? '';
  const libelleFermer = bouton.dataset.labelFermer ?? libelleOuvrir;

  /* --- Index ------------------------------------------------------------------------------------ */
  let index: Prepare[] | null = null;
  let chargement: Promise<void> | null = null;
  let echec = false;

  const charger = (): Promise<void> => {
    if (!chargement) {
      chargement = fetch(panneau.dataset.index ?? '', { credentials: 'same-origin' })
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.json() as Promise<{ docs: Doc[] }>;
        })
        .then(({ docs }) => {
          index = docs.map((doc, rang) => ({
            doc,
            rang,
            motsTitre: decouper(doc.titre),
            motsTexte: decouper(doc.texte),
          }));
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

  const annoncer = (texte: string): void => {
    window.clearTimeout(annonce);
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
      if (t.p.doc.contexte) contexte.textContent = t.p.doc.contexte;
      else contexte.remove();
      surligner(titreEl, t.p.doc.titre, plages(t.p.motsTitre, liste));
      if (t.p.doc.texte) extrait(extraitEl, t.p, liste);
      else extraitEl.remove();
      ul.append(item);
    });
    return fragment;
  };

  const afficher = (): void => {
    memoire.clear();
    const q = champ.value.trim();
    const liste = q ? concepts(q) : [];

    if (!q || !liste.length) {
      rapides.hidden = false;
      resultats.hidden = true;
      vide.hidden = true;
      nbResultats = 0;
      statut.textContent = '';
      return;
    }
    rapides.hidden = true;

    if (!index) {
      resultats.hidden = true;
      vide.hidden = true;
      annoncer(echec ? (panneau.dataset.erreur ?? '') : (panneau.dataset.chargement ?? ''));
      if (echec) {
        videTexte.textContent = panneau.dataset.erreur ?? '';
        vide.hidden = false;
      }
      return;
    }

    const expression = decouper(q).map((m) => m.n);
    let trouves = index.map((p) => evaluer(p, liste, expression)).filter((t) => t.concepts > 0);
    const complets = trouves.filter((t) => t.concepts === liste.length);
    if (complets.length) trouves = complets;
    else {
      const plus = Math.max(0, ...trouves.map((t) => t.concepts));
      trouves = trouves.filter((t) => t.concepts === plus);
    }
    trouves.sort((a, b) => b.score - a.score || a.p.rang - b.p.rang);

    const pages = trouves.filter((t) => t.p.doc.type === 'page').slice(0, MAX_PAR_RUBRIQUE);
    const questions = trouves.filter((t) => t.p.doc.type === 'question').slice(0, MAX_PAR_RUBRIQUE);
    nbResultats = pages.length + questions.length;

    resultats.replaceChildren();
    if (pages.length) resultats.append(rubrique(search.groups.pages, 'pages', pages, liste));
    if (questions.length)
      resultats.append(rubrique(search.groups.questions, 'questions', questions, liste));
    resultats.hidden = nbResultats === 0;
    vide.hidden = nbResultats > 0;
    if (!nbResultats) videTexte.textContent = (videTexte.dataset.gabarit ?? '').replace('{q}', q);
    defilement.scrollTop = 0;

    annoncer(
      nbResultats === 0
        ? (videTexte.textContent ?? '')
        : nbResultats === 1
          ? (panneau.dataset.compteUn ?? '')
          : (panneau.dataset.comptePlusieurs ?? '').replace('{n}', String(nbResultats))
    );
  };

  /* --- Ouverture et fermeture ------------------------------------------------------------------- */
  let minuterieFermeture = 0;
  const ouvert = (): boolean => nav.hasAttribute('data-recherche-ouverte');

  const ouvrir = (): void => {
    if (ouvert()) return;
    window.clearTimeout(minuterieFermeture);
    panneau.hidden = false;
    voile.hidden = false;
    /* La position fermée doit être enregistrée avant que l'état ouvert ne soit posé, sans quoi le
       panneau apparaît déjà déplié, sans transition. */
    void panneau.offsetHeight;
    nav.setAttribute('data-recherche-ouverte', '');
    bouton.setAttribute('aria-expanded', 'true');
    bouton.setAttribute('aria-label', libelleFermer);
    document.documentElement.style.overflow = 'hidden';
    /* Dans le même geste que le clic : iOS n'ouvre le clavier qu'à cette condition. */
    champ.focus({ preventScroll: true });
    champ.select();
    void charger();
    afficher();
  };

  const fermer = ({ rendreFocus = true, instantane = false } = {}): void => {
    if (!ouvert()) return;
    mesurerRecherche();
    nav.removeAttribute('data-recherche-ouverte');
    bouton.setAttribute('aria-expanded', 'false');
    bouton.setAttribute('aria-label', libelleOuvrir);
    document.documentElement.style.overflow = '';
    if (rendreFocus) bouton.focus({ preventScroll: true });
    window.clearTimeout(minuterieFermeture);
    const masquer = (): void => {
      if (ouvert()) return;
      panneau.hidden = true;
      voile.hidden = true;
    };
    if (instantane) masquer();
    else minuterieFermeture = window.setTimeout(masquer, DUREE_FERMETURE);
  };

  bouton.addEventListener('click', () => (ouvert() ? fermer() : ouvrir()));
  /* Intention : l'index est demandé avant même le clic. */
  bouton.addEventListener('pointerenter', () => void charger(), { once: true });
  bouton.addEventListener('focus', () => void charger(), { once: true });
  voile.addEventListener('click', () => fermer());
  panneau
    .querySelector<HTMLButtonElement>('[data-recherche-fermer]')
    ?.addEventListener('click', () => fermer());

  champ.addEventListener('input', () => {
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
    if (!ouvert()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      fermer();
      return;
    }
    const actif = document.activeElement as HTMLElement | null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const tous = liens();
      if (!tous.length) return;
      const i = tous.indexOf(actif as HTMLAnchorElement);
      if (e.key === 'ArrowDown') {
        if (actif === champ) tous[0].focus();
        else if (i >= 0 && i < tous.length - 1) tous[i + 1].focus();
        else return;
      } else if (i > 0) tous[i - 1].focus();
      else if (i === 0) champ.focus();
      else return;
      e.preventDefault();
      return;
    }
    if (e.key === 'Tab') {
      const focusables = Array.from(
        panneau.querySelectorAll<HTMLElement>('input, button, a[href]')
      ).filter((el) => el.offsetParent !== null || el.matches('[data-recherche-fermer]'));
      if (!focusables.length) return;
      const premier = focusables[0];
      const dernier = focusables[focusables.length - 1];
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

    const cible = sansBarre(lien.pathname) + lien.hash;
    try {
      sessionStorage.setItem(CLE_ARRIVEE, cible);
    } catch {
      /* stockage refusé : on arrive sans éclairage, rien de plus */
    }
    const memePage = sansBarre(lien.pathname) === sansBarre(location.pathname);
    fermer({ rendreFocus: false, instantane: !memePage });
    if (!memePage) return;
    /* MÊME PAGE : l'ancre est changée ici, pas par le navigateur. Un lien « /faq#… » suivi depuis
       « /faq/ » rechargerait toute la page, la barre oblique finale suffit à en faire une autre adresse,
       et le visiteur perdrait le défilement jusqu'au passage. Même ancre : rien ne changerait, on
       rejoue l'arrivée. Sans ancre : le haut de la page. */
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

/* ------------------------------------------------------------------------------------------------ */
/* Arrivée                                                                                           */
/* ------------------------------------------------------------------------------------------------ */

const arriver = (): void => {
  let attendue: string | null = null;
  try {
    attendue = sessionStorage.getItem(CLE_ARRIVEE);
    if (attendue) sessionStorage.removeItem(CLE_ARRIVEE);
  } catch {
    return;
  }
  if (!attendue || attendue !== sansBarre(location.pathname) + location.hash) return;
  const id = decodeURIComponent(location.hash.slice(1));
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

const demarrer = (): void => {
  init();
  arriver();
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
else demarrer();
window.addEventListener('hashchange', arriver);

export {};
