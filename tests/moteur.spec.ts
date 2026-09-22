import { test, expect } from '@playwright/test';
import { plier } from '../src/lib/texte';
import { slug } from '../src/lib/ancre';
import {
  bornesExtrait,
  classer,
  concepts,
  distance,
  grouper,
  plages,
  preparer,
  type Doc,
} from '../src/scripts/recherche/moteur';

/**
 * LE MOTEUR DE LA RECHERCHE, SANS NAVIGATEUR. Vérifié à travers le panneau, donc à travers l'index
 * du jour, un test qui cherche « frais » dit que le site parle de frais, pas que le moteur classe
 * bien. Ici, l'index et les synonymes sont posés par le test, et aucune page n'est ouverte.
 * Les trois profils de Playwright exécuteraient trois fois les mêmes fonctions pures : un seul suffit.
 */
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'desktop', 'fonctions pures : un seul passage suffit');
});

const SYNONYMES = [
  ['frais', 'commission', 'coût'],
  ['frais d’entrée', 'frais de souscription'],
  ['revenus', 'dividendes', 'loyers'],
];
const groupes = grouper(SYNONYMES);

const doc = (titre: string, texte: string, type: Doc['type'] = 'page'): Doc => ({
  type,
  titre,
  texte,
  url: '/' + slug(titre) + '/',
});

const INDEX = preparer([
  doc('La stratégie', 'Des immeubles de bureaux et de commerces, en zone euro.'),
  doc('Les frais', 'Aucun frais de souscription. Une commission de gestion sur les loyers.'),
  doc('Les risques', 'Le capital n’est pas garanti. Les frais réduisent le rendement.'),
  doc(
    'Quand commence la jouissance des parts ?',
    'Le délai de jouissance est de six mois.',
    'question'
  ),
  doc(
    'Que coûte un retrait ?',
    'Un retrait anticipé coûte jusqu’à 6 % des sommes retirées.',
    'question'
  ),
]);

const chercher = (q: string, max = 4) => {
  const liste = concepts(q, groupes);
  const { pages, questions } = classer(INDEX, liste, q, max);
  return {
    pages: pages.map((t) => t.p.doc.titre),
    questions: questions.map((t) => t.p.doc.titre),
  };
};

test.describe('Pliage du texte', () => {
  test('accents, casse, ligatures et exposants', () => {
    expect(plier('Intérêt ÉLEVÉ')).toBe('interet eleve');
    expect(plier('Œuvre et æther')).toBe('oeuvre et aether');
    expect(plier('1ᵉʳ, 200 m²')).toBe('1er, 200 m2');
  });

  test('une ancre se lit : les accents tombent, ils ne deviennent pas des tirets', () => {
    expect(slug('Éditeur du site')).toBe('editeur-du-site');
    expect(slug('Quel est le prix d’une part ?')).toBe('quel-est-le-prix-d-une-part');
    expect(slug('Main-d’œuvre')).toBe('main-d-oeuvre');
  });
});

test.describe('Distance entre deux mots', () => {
  test('une lettre en trop, en moins, remplacée, ou deux lettres inversées : une faute', () => {
    expect(distance('souscription', 'souscriptions', 2)).toBe(1);
    expect(distance('souscripton', 'souscription', 2)).toBe(1);
    expect(distance('rendemant', 'rendement', 2)).toBe(1);
    expect(distance('frias', 'frais', 2)).toBe(1);
    expect(distance('frais', 'frais', 2)).toBe(0);
    /* Deux lettres inversées, mais pas voisines : ce sont deux fautes, pas une. */
    expect(distance('fiars', 'frais', 2)).toBe(2);
  });

  test('au-delà de la tolérance, le calcul s’arrête et rend « trop loin »', () => {
    expect(distance('frais', 'risques', 1)).toBe(2);
    expect(distance('loyer', 'stratégie', 2)).toBe(3);
  });
});

test.describe('Ce qu’une recherche trouve', () => {
  test('la recherche suit la frappe : un début de mot trouve le mot', () => {
    expect(chercher('jouis').questions).toEqual(['Quand commence la jouissance des parts ?']);
  });

  test('une faute de frappe est admise à partir de quatre lettres, pas avant', () => {
    expect(chercher('stratégei').pages).toEqual(['La stratégie']);
    expect(chercher('risqes').pages).toEqual(['Les risques']);
    expect(chercher('fri')).toEqual({ pages: [], questions: [] });
  });

  test('sans accent et en majuscules, on trouve la même chose', () => {
    expect(chercher('STRATEGIE')).toEqual(chercher('stratégie'));
  });

  test('un mot du titre pèse plus que le même mot dans le texte', () => {
    expect(chercher('frais').pages).toEqual(['Les frais', 'Les risques']);
  });

  test('un synonyme trouve les autres membres de son groupe', () => {
    /* « dividendes » n'est écrit nulle part : ce sont les « loyers » de la page des frais qui répondent. */
    expect(chercher('dividendes').pages).toEqual(['Les frais']);
  });

  test('un synonyme ne vaut que tel quel ou au pluriel : « coût » ne trouve pas « coûte »', () => {
    /* « commission » a pour synonyme « coût ». La question du retrait ne contient que « coûte » : elle
       ne doit pas remonter. */
    expect(chercher('commission')).toEqual({ pages: ['Les frais', 'Les risques'], questions: [] });
  });

  test('une expression d’un groupe est cherchée d’un bloc, avec ses équivalents', () => {
    const liste = concepts('frais d’entrée', groupes);
    expect(liste).toHaveLength(1);
    expect(liste[0]?.map((a) => a.mots.join(' '))).toEqual([
      'frais d entree',
      'frais de souscription',
    ]);
    expect(chercher('frais d’entrée').pages).toEqual(['Les frais']);
  });

  test('les mots vides sont ignorés, sauf s’il n’y a qu’eux', () => {
    expect(concepts('quels sont les risques', groupes)).toHaveLength(1);
    expect(chercher('quels sont les risques').pages).toEqual(['Les risques']);
    expect(concepts('quels sont les', groupes).map((c) => c[0]?.mots[0])).toEqual([
      'quels',
      'sont',
      'les',
    ]);
  });

  test('tous les mots sont exigés ; à défaut, ceux qui en trouvent le plus', () => {
    expect(chercher('capital garanti').pages).toEqual(['Les risques']);
    /* « bureaux » et « garanti » ne sont jamais ensemble : chaque page qui en trouve un est proposée. */
    expect(chercher('bureaux garanti').pages).toEqual(['La stratégie', 'Les risques']);
  });

  test('à score égal, l’ordre de l’index départage, et chaque rubrique est plafonnée', () => {
    expect(chercher('retrait').questions).toEqual(['Que coûte un retrait ?']);
    expect(chercher('frais', 1).pages).toEqual(['Les frais']);
  });

  test('une recherche sans mot utile ne donne aucun concept', () => {
    expect(concepts('?', groupes)).toEqual([]);
    expect(concepts('   ', groupes)).toEqual([]);
  });
});

test.describe('Ce qui est surligné et montré', () => {
  test('les plages couvrent les mots trouvés, dans l’ordre du texte', () => {
    const p = INDEX[2];
    if (!p) throw new Error('index de test incomplet');
    const marques = plages(p.motsTexte, concepts('frais rendement', groupes));
    expect(marques.map(([a, b]) => p.doc.texte.slice(a, b))).toEqual(['frais', 'rendement']);
  });

  test('l’extrait commence sur un mot, peu avant le premier trouvé, et finit sur un mot', () => {
    const long = preparer([
      doc(
        'Un long texte',
        'Un premier paragraphe qui ne parle de rien de précis et qui dure assez pour repousser la suite. ' +
          'Le délai de jouissance est de six mois, et il court à partir du premier jour du mois qui suit ' +
          'la souscription, ce qui laisse le temps d’investir les sommes collectées.'
      ),
    ])[0];
    if (!long) throw new Error('index de test incomplet');
    const marques = plages(long.motsTexte, concepts('jouissance', groupes));
    const [debut, fin] = bornesExtrait(long, marques);
    const texte = long.doc.texte;
    expect(debut).toBeGreaterThan(0);
    expect(marques[0]?.[0]).toBeGreaterThanOrEqual(debut);
    expect((marques[0]?.[0] ?? 0) - debut).toBeLessThanOrEqual(30);
    expect(fin - debut).toBeLessThanOrEqual(120);
    /* Ni le début ni la fin ne coupent un mot. */
    expect(texte[debut - 1]).toBe(' ');
    expect(/[\p{L}\p{N}]/u.test(texte[fin] ?? ' ')).toBe(false);
  });

  test('un texte court est montré en entier', () => {
    const p = INDEX[0];
    if (!p) throw new Error('index de test incomplet');
    expect(bornesExtrait(p, [])).toEqual([0, p.doc.texte.length]);
  });
});
