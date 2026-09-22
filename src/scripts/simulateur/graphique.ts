/**
 * SIMULATEUR : LA GÉOMÉTRIE DU GRAPHIQUE. Fonctions pures, sans DOM : des nombres entrent, des chemins
 * SVG et des positions sortent. ./page.ts les pose dans le squelette que Simulator.astro a rendu.
 * DEUX CADRES, UN SEUL GRAPHIQUE : un SVG se réduit avec sa boîte, texte compris, et dessiné pour
 * 720 unités dans les 316 px d'un téléphone, ses montants faisaient 5 px de haut. Sous
 * `SEUIL_ETROIT`, le graphique est dessiné dans un cadre de 360 unités, plus haut en proportion.
 * `cadrePour` choisit ; ./page.ts pose le `viewBox` et replace ce qui en dépend.
 */
export interface Cadre {
  largeur: number;
  hauteur: number;
  /** À gauche la place des montants, en bas celle des années. */
  marge: { gauche: number; droite: number; haut: number; bas: number };
}

export const CADRE_LARGE: Cadre = {
  largeur: 720,
  hauteur: 290,
  marge: { gauche: 64, droite: 20, haut: 16, bas: 40 },
};
export const CADRE_ETROIT: Cadre = {
  largeur: 360,
  hauteur: 250,
  marge: { gauche: 56, droite: 10, haut: 14, bas: 40 },
};
/** Largeur d'affichage, en pixels, sous laquelle le cadre étroit prend le relais. */
export const SEUIL_ETROIT = 480;
export const cadrePour = (largeurAffichee: number): Cadre =>
  largeurAffichee > 0 && largeurAffichee < SEUIL_ETROIT ? CADRE_ETROIT : CADRE_LARGE;

/** Part de la hauteur laissée libre au-dessus du plus haut point. */
const RESPIRATION = 1.08;
/** Fractions du maximum où passent les cinq lignes de grille. */
export const GRILLE = [0, 0.25, 0.5, 0.75, 1] as const;

export interface Echelle {
  cadre: Cadre;
  /** Nombre d'intervalles : une série de n + 1 points, du départ à l'année n. */
  n: number;
  /** Plus grande valeur portée par l'axe des montants (la dernière ligne de grille). */
  sommet: number;
  x: (i: number) => number;
  y: (v: number) => number;
}

export const echelle = (n: number, maximum: number, cadre: Cadre = CADRE_LARGE): Echelle => {
  const sommet = Math.max(1, maximum);
  const { marge } = cadre;
  const largeur = cadre.largeur - marge.gauche - marge.droite;
  const hauteur = cadre.hauteur - marge.haut - marge.bas;
  return {
    cadre,
    n,
    sommet,
    x: (i) => marge.gauche + (i / Math.max(1, n)) * largeur,
    y: (v) => cadre.hauteur - marge.bas - (v / (sommet * RESPIRATION)) * hauteur,
  };
};

const point = (x: number, y: number): string => `${x.toFixed(1)},${y.toFixed(1)}`;

/** Une courbe : les ordonnées sont déjà dans le repère du SVG. */
export const courbe = (ys: readonly number[], e: Echelle): string =>
  ys.map((y, i) => (i ? 'L' : 'M') + point(e.x(i), y)).join(' ');

/** Une bande fermée entre deux courbes : le haut de gauche à droite, le bas en revenant. */
export const bande = (haut: readonly number[], bas: readonly number[], e: Echelle): string => {
  const retour = bas.map((y, i) => 'L' + point(e.x(i), y)).reverse();
  return `${courbe(haut, e)} ${retour.join(' ')} Z`;
};

/**
 * Années à graduer : un pas rond qui en laisse huit au plus (six dans le cadre étroit), le départ et
 * le terme toujours présents. L'avant-dernière graduation saute si elle colle au terme.
 */
export const graduations = (n: number, intervalles = 7): number[] => {
  const pas = [1, 2, 5, 10, 20].find((p) => n / p <= intervalles) ?? 25;
  const sortie: number[] = [];
  for (let annee = 0; annee < n; annee += pas) sortie.push(annee);
  const derniere = sortie.at(-1) ?? 0;
  if (sortie.length > 1 && n - derniere < pas * 0.6) sortie.pop();
  sortie.push(n);
  return sortie;
};

/** L'indice de l'année la plus proche d'une abscisse du repère SVG. */
export const anneeSous = (xSvg: number, e: Echelle): number => {
  const { marge, largeur } = e.cadre;
  const utile = largeur - marge.gauche - marge.droite;
  return Math.max(0, Math.min(e.n, Math.round(((xSvg - marge.gauche) / utile) * e.n)));
};
