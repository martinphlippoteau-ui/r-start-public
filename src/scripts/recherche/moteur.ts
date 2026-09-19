/**
 * RECHERCHE DU SITE : LE MOTEUR. Des fonctions pures, sans DOM ni réseau : ce qu'une recherche trouve,
 * dans quel ordre, et quoi surligner. Le panneau (./panneau.ts) les appelle ; tests/moteur.spec.ts les
 * éprouve sans navigateur, ce qui était impossible tant qu'elles vivaient, non exportées, dans le même
 * fichier que le panneau (audit du 18/09/2026) : le classement, la tolérance aux fautes et les
 * synonymes ne se vérifiaient qu'à travers Playwright.
 *
 * LA COMPARAISON est insensible aux accents, à la casse et aux ligatures (src/lib/texte.ts) et tolère
 * les fautes de frappe :
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
 * l'ordre de l'index, qui est celui du menu.
 *
 * LES SYNONYMES SONT UN PARAMÈTRE (`grouper`), pas un import : le moteur ne connaît pas le contenu du
 * site, et ses tests posent les leurs.
 */
import { plier } from '@/lib/texte';

/** Un document de l'index (dist/recherche.json, scripts/search-index.mjs). */
export interface Doc {
  type: 'page' | 'question';
  titre: string;
  contexte?: string;
  url: string;
  texte: string;
}

export interface Mot {
  /** Forme comparée : sans accent, minuscule. */
  n: string;
  debut: number;
  fin: number;
}

export interface Prepare {
  doc: Doc;
  rang: number;
  motsTitre: Mot[];
  motsTexte: Mot[];
}

export interface Alternative {
  mots: string[];
  /** 1 pour les mots tapés, moins pour un synonyme. */
  poids: number;
}

export type Concept = Alternative[];

export interface Trouve {
  p: Prepare;
  score: number;
  concepts: number;
}

/** Groupes de synonymes, chaque membre découpé en mots comparables. */
export type Groupes = string[][][];

/** Plage [début, fin[ d'un texte. */
export type Plage = [number, number];

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

const MOT = /[\p{L}\p{N}]+/gu;

export const decouper = (s: string): Mot[] =>
  Array.from(s.matchAll(MOT), (m) => ({
    n: plier(m[0]),
    debut: m.index,
    fin: m.index + m[0].length,
  }));

export const preparer = (docs: Doc[]): Prepare[] =>
  docs.map((doc, rang) => ({
    doc,
    rang,
    motsTitre: decouper(doc.titre),
    motsTexte: decouper(doc.texte),
  }));

export const grouper = (synonymes: readonly (readonly string[])[]): Groupes =>
  synonymes.map((groupe) => groupe.map((membre) => decouper(membre).map((m) => m.n)));

/**
 * Distance de Damerau-Levenshtein restreinte, abandonnée dès qu'elle dépasse `max` (elle vaut alors
 * `max + 1`, quelle que soit la distance réelle).
 * Les `!` : trois lignes de `b.length + 1` cases, lues à des indices que les boucles bornent. La ligne
 * `avant` n'est lue qu'à partir de i = 2, après avoir reçu la ligne i - 2.
 */
export const distance = (a: string, b: string, max: number): number => {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const largeur = b.length + 1;
  let avant = new Array<number>(largeur).fill(0);
  let prec = Array.from({ length: largeur }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const cour = new Array<number>(largeur).fill(0);
    cour[0] = i;
    let minLigne = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cout = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prec[j]! + 1, cour[j - 1]! + 1, prec[j - 1]! + cout);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, avant[j - 2]! + 1);
      }
      cour[j] = v;
      if (v < minLigne) minLigne = v;
    }
    if (minLigne > max) return max + 1;
    avant = prec;
    prec = cour;
  }
  return prec[b.length]!;
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

/**
 * Qualité de la rencontre entre un mot tapé et un mot du document, de 0 (rien) à 1 (identique).
 * Mémorisée le temps d'une recherche (`classer` la vide en commençant) : les mêmes mots reviennent de
 * document en document, et une recherche se relit une seconde fois pour surligner les résultats
 * affichés. La clé est sûre : un mot ne contient que des lettres et des chiffres, jamais de « | ».
 */
const memoire = new Map<string, number>();
const qualite = (tape: string, mot: string, flou: boolean): number => {
  const cle = `${tape}|${mot}|${flou ? 1 : 0}`;
  let q = memoire.get(cle);
  if (q === undefined) {
    q = comparer(tape, mot, flou);
    memoire.set(cle, q);
  }
  return q;
};

/**
 * La recherche en concepts : chaque mot utile, ou chaque expression d'un groupe de synonymes, avec ses
 * formes admises.
 */
export const concepts = (recherche: string, groupes: Groupes): Concept[] => {
  const mots = decouper(recherche).map((m) => m.n);
  const sortie: Concept[] = [];
  const vides: string[] = [];
  let i = 0;
  while (i < mots.length) {
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
    const mot = mots[i] ?? '';
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
      const tape = alt.mots[k];
      const mot = mots[i + k]?.n;
      if (tape === undefined || mot === undefined) {
        q = 0;
        break;
      }
      /* Un synonyme ne vaut que tel quel ou au pluriel : en début de mot, « coût » trouvait
         « coûte ». */
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

/**
 * Les documents que la recherche `q` trouve, classés, en deux rubriques plafonnées à `max` chacune.
 * `liste` est le résultat de `concepts(q, …)` : le panneau l'a déjà en main, il s'en sert aussi pour
 * surligner.
 */
export const classer = (
  index: Prepare[],
  liste: Concept[],
  q: string,
  max: number
): { pages: Trouve[]; questions: Trouve[] } => {
  memoire.clear();
  const expression = decouper(q).map((m) => m.n);
  let trouves = index.map((p) => evaluer(p, liste, expression)).filter((t) => t.concepts > 0);
  const complets = trouves.filter((t) => t.concepts === liste.length);
  if (complets.length) trouves = complets;
  else {
    const plus = Math.max(0, ...trouves.map((t) => t.concepts));
    trouves = trouves.filter((t) => t.concepts === plus);
  }
  trouves.sort((a, b) => b.score - a.score || a.p.rang - b.p.rang);
  return {
    pages: trouves.filter((t) => t.p.doc.type === 'page').slice(0, max),
    questions: trouves.filter((t) => t.p.doc.type === 'question').slice(0, max),
  };
};

/* ------------------------------------------------------------------------------------------------ */
/* Extraits                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

/** Plages du texte à surligner, dans l'ordre du texte. */
export const plages = (mots: Mot[], liste: Concept[]): Plage[] => {
  const sortie: Plage[] = [];
  for (const concept of liste) {
    for (const alt of concept) {
      for (const r of rencontres(mots, alt)) {
        const premier = mots[r.i];
        const dernier = mots[r.i + r.long - 1];
        if (premier && dernier) sortie.push([premier.debut, dernier.fin]);
      }
    }
  }
  return sortie.sort((a, b) => a[0] - b[0]);
};

/* Une seule ligne d'extrait, tronquée par le style : elle commence peu avant le premier mot trouvé. */
const LONGUEUR_EXTRAIT = 120;
const AVANT_EXTRAIT = 30;

/**
 * Bornes de l'extrait à afficher : il commence sur un mot, au plus `AVANT_EXTRAIT` caractères avant la
 * première plage surlignée, et finit sur un mot.
 */
export const bornesExtrait = (p: Prepare, marques: Plage[]): Plage => {
  const texte = p.doc.texte;
  const premiere = marques[0]?.[0] ?? 0;
  let debut = 0;
  if (premiere > AVANT_EXTRAIT) {
    debut = p.motsTexte.find((m) => m.debut >= premiere - AVANT_EXTRAIT)?.debut ?? 0;
  }
  let fin = Math.min(texte.length, debut + LONGUEUR_EXTRAIT);
  if (fin < texte.length) {
    fin = [...p.motsTexte].reverse().find((m) => m.fin <= fin)?.fin ?? fin;
  }
  return [debut, fin];
};
