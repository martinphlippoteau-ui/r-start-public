/**
 * SIMULATEUR : LE MOTEUR DE CALCUL (19/09/2026, page /simulateur). Des fonctions pures, sans DOM :
 * ./page.ts les appelle à chaque modification du formulaire, tests/simulateur-moteur.spec.ts les
 * éprouve sans navigateur. Aucune valeur métier n'est écrite ici : le délai de jouissance et le barème
 * de retrait arrivent en paramètre (`Regles`), tirés de facts.ts par src/content/fr/simulator.ts.
 *
 * CE QUE LE MOTEUR SUPPOSE, et que la page affiche sous « Hypothèses de calcul » :
 *  - la valeur de la part ne bouge pas : le capital projeté n'est que la somme de ce qui a été versé
 *    et réinvesti ;
 *  - le taux de distribution choisi par le visiteur est constant, et les revenus sont mensuels ;
 *  - CHAQUE VERSEMENT EST DATÉ : versement initial, versements programmés et revenus réinvestis forment
 *    autant de lots. Un lot ne produit de revenus qu'après le délai de jouissance, et c'est aussi
 *    lot par lot que s'apprécie la commission de retrait anticipé ;
 *  - tous les montants sont bruts, avant fiscalité ; la commission de retrait est CALCULÉE mais jamais
 *    déduite des résultats : la page la signale à part.
 *
 * Inspiré du prototype fourni par Martin le 19/09/2026. Son prélèvement caché sur les revenus
 * réinvestis (20 %, jamais affiché dans l'ancien code, déjà ramené à 0 dans le prototype) n'est pas
 * repris : un paramètre que personne ne règle n'a pas sa place dans un calcul publié.
 */

/** Ce que le visiteur choisit. */
export interface Hypotheses {
  /** Versement initial, en euros. */
  initial: number;
  /** Versement programmé mensuel, en euros ; 0 s'il n'y en a pas. */
  monthly: number;
  /** Part des revenus réinvestie, de 0 (tout est perçu) à 1 (tout est réinvesti). */
  reinvestShare: number;
  /** Durée de projection, en années entières. */
  years: number;
  /** Taux de distribution testé, en fraction : 0,0491 pour 4,91 %. */
  rate: number;
}

/** Un palier de la commission de retrait : `rate` s'applique aux parts détenues depuis moins de `before` ans. */
export interface PalierRetrait {
  before: number;
  rate: number;
}

/** Les règles du produit, tirées de facts.ts. */
export interface Regles {
  /** Un versement produit des revenus à partir du mois qui porte ce rang après lui. */
  enjoymentDelayMonths: number;
  /** Paliers par ancienneté croissante ; au-delà du dernier, aucune commission. */
  exitFee: readonly PalierRetrait[];
}

/** L'état du placement à la fin d'une année (l'année 0 est le départ). */
export interface Annee {
  year: number;
  /** Capital projeté : tout ce qui a été versé et réinvesti, à valeur de part inchangée. */
  capital: number;
  initial: number;
  /** Cumul des versements programmés. */
  programmes: number;
  /** Cumul des revenus réinvestis. */
  reinvestis: number;
  /** Ce que le visiteur a sorti de sa poche : versement initial et versements programmés. */
  invested: number;
  /** Cumul des revenus bruts, perçus ou réinvestis. */
  cumGross: number;
  /** Cumul des revenus perçus. */
  cumPaid: number;
  /** Revenu brut du dernier mois de l'année. */
  monthlyIncome: number;
}

export interface Simulation {
  rows: Annee[];
  capitalFinal: number;
  invested: number;
  cumGross: number;
  cumPaid: number;
  /** Commission de retrait estimée en cas de retrait total au terme. Non déduite des autres montants. */
  exitFee: number;
  /** Revenu mensuel brut au terme de la projection. */
  monthlyAtTerm: number;
  /** Revenu mensuel brut du seul versement initial, une fois le délai de jouissance passé. */
  monthlyNow: number;
  annualNow: number;
}

/** Taux de la commission de retrait pour des parts détenues depuis `ageYears` années. */
export const tauxDeRetrait = (ageYears: number, bareme: readonly PalierRetrait[]): number => {
  for (const palier of bareme) if (ageYears < palier.before) return palier.rate;
  return 0;
};

export const simuler = (h: Hypotheses, regles: Regles): Simulation => {
  const mois = h.years * 12;
  const delai = regles.enjoymentDelayMonths;
  const part = Math.min(1, Math.max(0, h.reinvestShare));
  /* Chaque versement, daté : sert au délai de jouissance puis à la commission de retrait. */
  const lots: { amount: number; month: number }[] = [{ amount: h.initial, month: 0 }];
  let prochain = 0;
  let productif = 0;
  let capital = h.initial;
  let programmes = 0;
  let reinvestis = 0;
  let invested = h.initial;
  let cumGross = 0;
  let cumPaid = 0;
  let brut = 0;
  const rows: Annee[] = [
    {
      year: 0,
      capital,
      initial: h.initial,
      programmes: 0,
      reinvestis: 0,
      invested,
      cumGross: 0,
      cumPaid: 0,
      monthlyIncome: 0,
    },
  ];

  for (let m = 1; m <= mois; m += 1) {
    /* Les lots entrés en jouissance ce mois-ci rejoignent le capital qui produit. Ils sont rangés par
       date : le premier qui n'y est pas encore arrête la boucle. */
    for (let lot = lots[prochain]; lot && lot.month + delai <= m; lot = lots[prochain]) {
      productif += lot.amount;
      prochain += 1;
    }
    brut = (productif * h.rate) / 12;
    const reinvesti = brut * part;
    cumGross += brut;
    cumPaid += brut - reinvesti;
    if (reinvesti > 0) {
      capital += reinvesti;
      reinvestis += reinvesti;
      lots.push({ amount: reinvesti, month: m });
    }
    if (h.monthly > 0) {
      capital += h.monthly;
      programmes += h.monthly;
      invested += h.monthly;
      lots.push({ amount: h.monthly, month: m });
    }
    if (m % 12 === 0) {
      rows.push({
        year: m / 12,
        capital,
        initial: h.initial,
        programmes,
        reinvestis,
        invested,
        cumGross,
        cumPaid,
        monthlyIncome: brut,
      });
    }
  }

  const exitFee = lots.reduce(
    (somme, lot) => somme + lot.amount * tauxDeRetrait((mois - lot.month) / 12, regles.exitFee),
    0
  );
  return {
    rows,
    capitalFinal: capital,
    invested,
    cumGross,
    cumPaid,
    exitFee,
    monthlyAtTerm: brut,
    monthlyNow: (h.initial * h.rate) / 12,
    annualNow: h.initial * h.rate,
  };
};
