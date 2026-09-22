/**
 * Fenêtres d'un immeuble dessiné au trait, pour les illustrations des cartes de /strategie
 * (EngineGain, StrategySelect, StrategyTiming ; EngineRent garde ses fenêtres écrites en dur). UN
 * IMMEUBLE, C'EST UN CADRE ET UNE GRILLE DE FENÊTRES : c'est ce qui le fait lire comme un immeuble
 * à n'importe quelle taille, là où trois traits dans un carré se lisaient comme un graphique
 * (« remplace les carrés qui ressemblent à des graphes par quelque chose qui ressemble à des
 * immeubles », 16/09/2026). La grille est CENTRÉE dans le cadre, à la fenêtre près : un appelant
 * donne le cadre et le nombre de colonnes et de rangées, jamais une coordonnée de fenêtre.
 */
export interface Cadre {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Fenetre {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Grille {
  colonnes: number;
  rangees: number;
  /** Côté d'une fenêtre, en unités du viewBox. */
  taille?: number;
  /** Écart entre deux fenêtres. */
  ecart?: number;
}

export const fenetres = (cadre: Cadre, grille: Grille): Fenetre[] => {
  const { colonnes, rangees, taille = 4, ecart = 2.5 } = grille;
  const largeur = colonnes * taille + (colonnes - 1) * ecart;
  const hauteur = rangees * taille + (rangees - 1) * ecart;
  const x0 = cadre.x + (cadre.w - largeur) / 2;
  const y0 = cadre.y + (cadre.h - hauteur) / 2;
  const liste: Fenetre[] = [];
  for (let r = 0; r < rangees; r += 1) {
    for (let c = 0; c < colonnes; c += 1) {
      liste.push({ x: x0 + c * (taille + ecart), y: y0 + r * (taille + ecart), w: taille, h: taille });
    }
  }
  return liste;
};
