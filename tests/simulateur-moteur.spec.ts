import { test, expect } from '@playwright/test';
import {
  CADRE_ETROIT,
  CADRE_LARGE,
  anneeSous,
  cadrePour,
  echelle,
  graduations,
} from '../src/scripts/simulateur/graphique';
import { simuler, tauxDeRetrait, type Regles } from '../src/scripts/simulateur/moteur';
import { adresseDeSouscription } from '../src/scripts/simulateur/souscription';

/**
 * LE CALCUL DU SIMULATEUR, SANS NAVIGATEUR (19/09/2026). Les règles sont posées par le test, pas lues
 * dans facts.ts : on vérifie que le moteur calcule juste, pas que le produit a tel barème. Les valeurs
 * attendues sont recalculées ici à la main ou par une formule indépendante de celle du moteur.
 *
 * Les trois profils de Playwright exécuteraient trois fois les mêmes fonctions pures : un seul suffit.
 */
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'desktop', 'fonctions pures : un seul passage suffit');
});

const REGLES: Regles = {
  enjoymentDelayMonths: 6,
  exitFee: [
    { before: 4, rate: 0.1 },
    { before: 6, rate: 0.07 },
    { before: 7, rate: 0.05 },
    { before: 8, rate: 0.03 },
  ],
};
const projet = (p: Partial<Parameters<typeof simuler>[0]> = {}) =>
  simuler({ initial: 12_000, monthly: 0, reinvestShare: 0, years: 10, rate: 0.06, ...p }, REGLES);

test.describe('Délai de jouissance', () => {
  test('aucun revenu avant le sixième mois, puis un revenu chaque mois', () => {
    const sim = projet();
    /* 12 000 € à 6 % : 60 € par mois. La première année n'en verse que sept, du 6e au 12e mois. */
    expect(sim.monthlyNow).toBeCloseTo(60, 10);
    expect(sim.annualNow).toBeCloseTo(720, 10);
    expect(sim.rows[1]?.cumGross).toBeCloseTo(60 * 7, 8);
    /* Sur dix ans : 120 mois, moins les cinq premiers. */
    expect(sim.cumPaid).toBeCloseTo(60 * 115, 8);
    expect(sim.cumGross).toBeCloseTo(sim.cumPaid, 8);
    expect(sim.capitalFinal).toBe(12_000);
  });

  test('chaque versement programmé attend son propre délai', () => {
    const sim = projet({ initial: 0, monthly: 1_000, years: 1, rate: 0.12 });
    /* 1 000 € à 12 % : 10 € par mois et par versement. Au 12e mois, seuls les versements des mois 1 à 6
       produisent : 60 €. Cumul de l'année : 10 au 7e mois, 20 au 8e… 60 au 12e. */
    expect(sim.monthlyAtTerm).toBeCloseTo(60, 8);
    expect(sim.cumGross).toBeCloseTo(10 + 20 + 30 + 40 + 50 + 60, 8);
    expect(sim.invested).toBe(12_000);
    expect(sim.rows.at(-1)?.programmes).toBe(12_000);
  });
});

test.describe('Revenus perçus ou réinvestis', () => {
  test('tout perçu : le capital ne bouge pas', () => {
    const sim = projet({ years: 25 });
    expect(sim.capitalFinal).toBe(12_000);
    expect(sim.rows.every((r) => r.reinvestis === 0)).toBe(true);
  });

  test('tout réinvesti : rien n’est perçu, et le capital grandit d’exactement ce qui est réinvesti', () => {
    const sim = projet({ reinvestShare: 1, years: 25 });
    expect(sim.cumPaid).toBe(0);
    expect(sim.capitalFinal - 12_000).toBeCloseTo(sim.cumGross, 6);
    expect(sim.rows.at(-1)?.reinvestis).toBeCloseTo(sim.cumGross, 6);
    /* Les revenus réinvestis produisent à leur tour : le revenu mensuel finit au-dessus de celui du départ. */
    expect(sim.monthlyAtTerm).toBeGreaterThan(sim.monthlyNow);
    expect(sim.invested).toBe(12_000);
  });

  test('moitié, moitié : ce qui est perçu égale ce qui est réinvesti', () => {
    const sim = projet({ reinvestShare: 0.5, years: 15 });
    expect(sim.cumPaid).toBeCloseTo(sim.cumGross / 2, 6);
    expect(sim.capitalFinal - 12_000).toBeCloseTo(sim.cumGross / 2, 6);
  });

  test('une part hors bornes est ramenée entre 0 et 1', () => {
    expect(projet({ reinvestShare: 3 }).cumPaid).toBe(0);
    expect(projet({ reinvestShare: -1 }).capitalFinal).toBe(12_000);
  });
});

test.describe('Commission de retrait', () => {
  test('le taux suit l’ancienneté des parts, bornes comprises', () => {
    expect(tauxDeRetrait(0, REGLES.exitFee)).toBe(0.1);
    expect(tauxDeRetrait(3.99, REGLES.exitFee)).toBe(0.1);
    expect(tauxDeRetrait(4, REGLES.exitFee)).toBe(0.07);
    expect(tauxDeRetrait(6, REGLES.exitFee)).toBe(0.05);
    expect(tauxDeRetrait(7, REGLES.exitFee)).toBe(0.03);
    expect(tauxDeRetrait(8, REGLES.exitFee)).toBe(0);
  });

  test('un versement unique : le palier de son ancienneté au terme', () => {
    const frais = (years: number) => projet({ initial: 10_000, years }).exitFee;
    expect(frais(3)).toBeCloseTo(1_000, 8);
    expect(frais(5)).toBeCloseTo(700, 8);
    expect(frais(6)).toBeCloseTo(500, 8);
    expect(frais(7)).toBeCloseTo(300, 8);
    expect(frais(8)).toBe(0);
  });

  test('des versements programmés : elle s’apprécie versement par versement', () => {
    const sim = projet({ initial: 10_000, monthly: 100, years: 10 });
    /* Formule indépendante : le versement du mois m a (120 - m) / 12 ans au terme. L'initial, dix ans. */
    let attendu = 0;
    for (let m = 1; m <= 120; m += 1)
      attendu += 100 * tauxDeRetrait((120 - m) / 12, REGLES.exitFee);
    expect(sim.exitFee).toBeCloseTo(attendu, 6);
    expect(sim.exitFee).toBeGreaterThan(0);
    /* Elle n'est déduite de rien. */
    expect(sim.capitalFinal).toBe(10_000 + 100 * 120);
  });
});

test.describe('Cas limites', () => {
  test('un taux nul ne produit rien, et aucun NaN', () => {
    const sim = projet({ rate: 0, monthly: 50, reinvestShare: 1 });
    expect(sim.cumGross).toBe(0);
    expect(sim.monthlyAtTerm).toBe(0);
    expect(
      Object.values(sim)
        .filter((v) => typeof v === 'number')
        .every(Number.isFinite)
    ).toBe(true);
  });

  test('une ligne par année, départ compris', () => {
    const sim = projet({ years: 50 });
    expect(sim.rows).toHaveLength(51);
    expect(sim.rows.map((r) => r.year)).toEqual(Array.from({ length: 51 }, (_, i) => i));
    expect(sim.rows[0]).toMatchObject({ capital: 12_000, cumGross: 0, monthlyIncome: 0 });
  });
});

test.describe('Géométrie du graphique', () => {
  test('les graduations gardent le départ et le terme, huit au plus entre les deux', () => {
    expect(graduations(10)).toEqual([0, 2, 4, 6, 8, 10]);
    expect(graduations(25)).toEqual([0, 5, 10, 15, 20, 25]);
    expect(graduations(50)).toEqual([0, 10, 20, 30, 40, 50]);
    /* L'avant-dernière saute quand elle colle au terme : 10 et 11 se chevaucheraient. */
    expect(graduations(11)).toEqual([0, 2, 4, 6, 8, 11]);
    for (let n = 10; n <= 50; n += 1) expect(graduations(n).length).toBeLessThanOrEqual(9);
  });

  test('l’échelle place le départ, le terme, zéro et le sommet aux bords du cadre, dans les deux cadres', () => {
    for (const cadre of [CADRE_LARGE, CADRE_ETROIT]) {
      const e = echelle(25, 100_000, cadre);
      expect(e.x(0)).toBe(cadre.marge.gauche);
      expect(e.x(25)).toBe(cadre.largeur - cadre.marge.droite);
      expect(e.y(0)).toBe(cadre.hauteur - cadre.marge.bas);
      expect(e.y(100_000)).toBeGreaterThan(cadre.marge.haut);
      expect(e.y(100_000)).toBeLessThan(e.y(0));
    }
  });

  test('l’année sous le pointeur reste dans la série', () => {
    const e = echelle(25, 1, CADRE_ETROIT);
    expect(anneeSous(-50, e)).toBe(0);
    expect(anneeSous(CADRE_ETROIT.largeur + 50, e)).toBe(25);
    expect(anneeSous(e.x(12), e)).toBe(12);
  });

  /* Un SVG se réduit avec sa boîte, texte compris : à 316 px de large, le cadre de 720 donnait des
     montants de 5 px de haut. */
  test('le cadre étroit prend le relais sous 480 px, et le texte y garde sa taille', () => {
    expect(cadrePour(316)).toBe(CADRE_ETROIT);
    expect(cadrePour(479)).toBe(CADRE_ETROIT);
    expect(cadrePour(480)).toBe(CADRE_LARGE);
    expect(cadrePour(0), 'masqué, donc sans largeur : le cadre large par défaut').toBe(CADRE_LARGE);
    const corpsReel = (largeurAffichee: number) =>
      (12 * largeurAffichee) / cadrePour(largeurAffichee).largeur;
    expect(corpsReel(316)).toBeGreaterThan(10);
    expect(graduations(25, 5)).toEqual([0, 5, 10, 15, 20, 25]);
    expect(graduations(50, 5)).toEqual([0, 10, 20, 30, 40, 50]);
  });
});

/*
 * « COMMENCER MA SOUSCRIPTION » (20/09/2026) : les choix du visiteur partent en paramètres vers le
 * tunnel. Ce qui part, ce qui ne part pas, et ce qui était déjà sur l'adresse.
 */
test.describe('Adresse de souscription', () => {
  const NOMS = {
    initial: 'montant',
    monthly: 'versement_mensuel',
    reinvest: 'reinvestissement',
    origin: 'origine',
  };
  const BASE = 'https://souscrire.r-start.com/?utm_content=simulateur-resultat#etape-1';
  const lire = (adresse: string) => Object.fromEntries(new URL(adresse).searchParams);

  test('le montant, le versement et la part réinvestie, arrondis à l’unité', () => {
    const adresse = adresseDeSouscription(
      BASE,
      { initial: 20_000, monthly: 250, reinvestShare: 0.35 },
      NOMS,
      'simulateur'
    );
    expect(lire(adresse)).toEqual({
      utm_content: 'simulateur-resultat',
      montant: '20000',
      versement_mensuel: '250',
      reinvestissement: '35',
      origine: 'simulateur',
    });
    /* L'adresse d'origine est conservée : son chemin, ses paramètres, son ancre. */
    expect(new URL(adresse).origin + new URL(adresse).pathname).toBe(
      'https://souscrire.r-start.com/'
    );
    expect(new URL(adresse).hash).toBe('#etape-1');
  });

  test('ce qui vaut zéro ne part pas, et ne reste pas d’un résultat précédent', () => {
    const avec = adresseDeSouscription(
      BASE,
      { initial: 5_000, monthly: 100, reinvestShare: 1 },
      NOMS,
      'simulateur'
    );
    const sans = adresseDeSouscription(
      avec,
      { initial: 5_000, monthly: 0, reinvestShare: 0 },
      NOMS,
      'simulateur'
    );
    expect(lire(sans)).toEqual({
      utm_content: 'simulateur-resultat',
      montant: '5000',
      origine: 'simulateur',
    });
  });

  test('ni le taux testé ni la durée ne figurent dans l’adresse', () => {
    const adresse = adresseDeSouscription(
      BASE,
      { initial: 20_000, monthly: 0, reinvestShare: 0 },
      NOMS,
      'simulateur'
    );
    expect(adresse).not.toMatch(/taux|duree|rate|years/i);
  });
});
