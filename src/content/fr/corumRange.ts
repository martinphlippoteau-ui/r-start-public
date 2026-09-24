/**
 * LA GAMME DE SCPI DU GROUPE CORUM, avec ses chiffres, pour la page /a-propos. R START N'Y FIGURE
 * PAS : sans historique, elle n'a ni TRI ni rendement à montrer.
 *
 * SOURCE : LES PAGES PRODUIT DE CORUM.FR (22/09/2026, demande de Martin : « prends les
 * indicateurs sur les pages produit »), corum.fr/nos-scpi/corum-origin, corum-xl, eurion et
 * corum-usa, relues le 22/09/2026. Chaque carte reprend le bloc « En bref » de sa page, dans le
 * même ordre : le TRI depuis la création (un OBJECTIF pour CORUM USA, trop jeune), le prix de la
 * part et sa ligne de frais, puis la performance globale annuelle 2025 (CORUM USA, créée en 2023,
 * affiche en plus son rendement 2025). LA PERFORMANCE MOYENNE 2020-2025 des trois autres SCPI,
 * reprise de corum.fr, a été RETIRÉE des cartes le 24/09/2026 (demande de Martin). L'INDICATEUR DE
 * RISQUE (3 ou 4 sur 7) et le « minimum d'investissement » du document de l'équipe du 16/09/2026
 * ne sont plus sur les cartes : les pages produit ne les y montrent pas. Le TRI de CORUM Eurion
 * passe de 6,50 % (document de l'équipe) à 6,49 % (corum.fr).
 *
 * CE BLOC AFFICHE DES PERFORMANCES PASSÉES, ce que le site ne fait nulle part ailleurs, et c'est ce
 * qui commande sa forme :
 *  - chaque chiffre porte l'intitulé de corum.fr, jamais un raccourci : une performance globale
 *    n'est pas un rendement, un TRI n'est pas une performance annuelle ;
 *  - chaque chiffre RENVOIE à sa note (numéros entre parenthèses, comme sur corum.fr), et un
 *    bouton « i » sur la carte déplie la même note sur place ;
 *  - les notes sont celles des pages produit, reproduites sans coupe, dans l'ordre de `NOTES`,
 *    qui fixe leur numéro ; celle de CORUM USA (« la performance 2025 … n'est pas représentative
 *    d'une performance stabilisée ») est demandée par Martin ;
 *  - la mention « les performances passées ne préjugent pas des performances futures » est AJOUTÉE
 *    au contenu de corum.fr, avant les notes : une communication commerciale qui affiche des
 *    performances passées ne peut pas s'en dispenser.
 *
 * LES CHIFFRES SONT SAISIS TELS QUE PUBLIÉS, seule leur écriture est mise aux normes françaises
 * (« 7,7 % » de corum.fr devient « 7,70 % », à deux décimales comme les autres).
 * DATE D'ARRÊTÉ : corum.fr date son patrimoine au 30/06/2026 et ses performances de 2025 ; les
 * TRI n'ont pas de date d'arrêté affichée.
 *
 * `distribution` (taux de distribution 2025, par SCPI) est lu par simulator.ts, qui en fait la
 * moyenne (repère « SCPI CORUM ») : il vaut la performance globale annuelle 2025 affichée, le prix
 * de souscription n'ayant pas bougé en 2025 (définition de la note « pga »), et le rendement 2025
 * de CORUM USA. tests/simulateur.spec.ts vérifie que la moyenne du simulateur est celle des
 * chiffres lus sur les cartes.
 */

import { scpiCreated } from '@/content/fr/facts';
import { nb } from '@/lib/texte';

/** Les notes sous les cartes ; l'ordre de `NOTES` donne leur numéro de renvoi. */
export type NoteKey = 'tri' | 'tti' | 'pga' | 'rendement' | 'usa2025';

/** Une mesure affichée sur une carte : le nombre, son unité, ce qu'elle mesure, et ses renvois. */
export interface MesureScpi {
  value: string;
  unit: string;
  label: string;
  /** Renvois vers les notes sous les cartes ; le bouton « i » de la mesure les déplie sur place. */
  notes?: readonly NoteKey[];
  /** Ligne sous la valeur (prix : « Frais et commission de souscription de 12 % TTI inclus »). */
  detail?: { text: string; notes?: readonly NoteKey[] };
}

export interface ScpiGamme {
  /** Année de création sous le nom, depuis `scpiCreated` (facts.ts), qui porte la réserve. */
  created?: string;
  /* Pas de surtitre « SCPI » (retiré le 16/09/2026, demande de l'équipe) : le titre du bloc le dit.
*/
  name: string;
  /** Mesure mise en avant, TRI réalisé ou objectif de TRI selon la SCPI. */
  principale: MesureScpi;
  autres: readonly MesureScpi[];
  /** Taux de distribution de l'année, pour simulator.ts (voir l'en-tête). */
  distribution: { year: number; value: string };
}

/*
 * Dates de création (16/09/2026, demande de l'équipe), jamais retapées ici : `scpiCreated`
 * (facts.ts) est leur unique source et porte la réserve qui compte, seule celle de R Start
 * s'appuyant sur une pièce du dossier. Deux listes de dates finiraient par diverger.
 */
const creee = (nom: string): string | undefined => {
  const annee = scpiCreated[nom];
  return annee ? `Créée en ${annee}` : undefined;
};

const TRI = 'Taux de rendement interne (TRI) depuis la création';
const PRIX = 'Prix de la part';
const PGA = 'Performance globale annuelle 2025';
const RENDEMENT = 'Rendement 2025';
const frais = (taux: string): MesureScpi['detail'] => ({
  text: nb(`Frais et commission de souscription de ${taux} % TTI inclus`),
  notes: ['tti'],
});

/*
 * TYPÉ EXPLICITEMENT, et non par `satisfies` : celui-ci conserve le type du littéral, et un champ
 * facultatif absent de toutes les entrées (arrivé le 16/09/2026 avec la pastille) fait conclure à
 * TypeScript qu'il n'existe pas ; le composant qui le lit ne compile plus.
 */
const ITEMS: ScpiGamme[] = [
  {
    name: 'CORUM Origin',
    created: creee('CORUM Origin'),
    principale: { value: '6,94', unit: '%', label: TRI, notes: ['tri'] },
    autres: [
      { value: nb('1 135'), unit: '€', label: PRIX, detail: frais('11,96') },
      { value: '6,50', unit: '%', label: PGA, notes: ['pga'] },
    ],
    distribution: { year: 2025, value: '6,50' },
  },
  {
    name: 'CORUM XL',
    created: creee('CORUM XL'),
    principale: { value: '5,77', unit: '%', label: TRI, notes: ['tri'] },
    autres: [
      { value: '195', unit: '€', label: PRIX, detail: frais('12') },
      { value: '5,30', unit: '%', label: PGA, notes: ['pga'] },
    ],
    distribution: { year: 2025, value: '5,30' },
  },
  {
    name: 'CORUM Eurion',
    created: creee('CORUM Eurion'),
    principale: { value: '6,49', unit: '%', label: TRI, notes: ['tri'] },
    autres: [
      { value: '215', unit: '€', label: PRIX, detail: frais('12') },
      { value: '5,73', unit: '%', label: PGA, notes: ['pga'] },
    ],
    distribution: { year: 2025, value: '5,73' },
  },
  {
    name: 'CORUM USA',
    created: creee('CORUM USA'),
    /* OBJECTIF et non historique : trop jeune pour un TRI réalisé. Ne jamais aligner l'intitulé
       sur les autres. Ses deux chiffres 2025 renvoient en plus à la note « usa2025 ». */
    principale: {
      value: '4,50',
      unit: '%',
      label: 'Objectif de taux de rendement interne sur 10 ans',
      notes: ['tri'],
    },
    autres: [
      { value: '200', unit: '€', label: PRIX, detail: frais('12') },
      { value: '7,70', unit: '%', label: PGA, notes: ['pga', 'usa2025'] },
      { value: '7,70', unit: '%', label: RENDEMENT, notes: ['rendement', 'usa2025'] },
    ],
    distribution: { year: 2025, value: '7,70' },
  },
];

/** Les notes des pages produit de corum.fr, reproduites sans coupe ; leur rang fait leur numéro. */
const NOTES: readonly { key: NoteKey; text: string }[] = [
  {
    key: 'tri',
    text: nb(
      'Le taux de rendement interne (TRI) mesure la rentabilité de l’investissement sur une période donnée. Il tient compte des dividendes distribués, de l’évolution de la valeur de part sur la période, ainsi que des frais de souscription et de gestion supportés par l’investisseur. Il intègre également le fait que la valeur de l’argent évolue dans le temps : en effet, 1 € aujourd’hui vaut plus que 1 € dans 1 an, car on peut immédiatement réinvestir cet euro et le faire fructifier.'
    ),
  },
  { key: 'tti', text: 'Toutes taxes incluses.' },
  {
    key: 'pga',
    text: nb(
      'Taux de performance globale annuelle, défini comme le rendement versé augmenté ou diminué de la différence entre le prix de souscription au 1er janvier de l’année n+1 et le prix de souscription au 1er janvier de l’année n, divisé par le prix de souscription au 1er janvier de l’année N de la part.'
    ),
  },
  {
    /* Version de la page CORUM Origin, la seule à préciser la quote-part de plus-values 2025 ; les
       trois autres pages s'arrêtent avant la parenthèse. */
    key: 'rendement',
    text: nb(
      'Rendement : taux de distribution, défini comme le dividende brut, avant prélèvements français et étrangers (payés par la SCPI pour le compte de l’associé), versé au titre de l’année N (y compris les acomptes exceptionnels et quote-part de plus-values distribuées, 0,57 % pour CORUM Origin en 2025) divisé par le prix de souscription au 1er janvier de l’année N de la part.'
    ),
  },
  {
    key: 'usa2025',
    text: 'La performance 2025 de CORUM USA n’est pas représentative d’une performance stabilisée, notamment en raison de l’impact du délai de jouissance sur la distribution des dividendes.',
  },
];

/** Numéro d'une note (à partir de 1), tel qu'il s'affiche dans les renvois. */
export const numeroNote = (key: NoteKey): number => NOTES.findIndex((n) => n.key === key) + 1;

export const corumRange = {
  /* « autres » dit que R Start n'y est pas (16/09/2026, texte de l'équipe). */
  title: 'Nos autres SCPI en quelques chiffres',
  /** Libellé lu par les lecteurs d'écran sur la liste. */
  listLabel: 'Les SCPI du groupe CORUM',
  /** Libellés des commandes : le bouton « i » et les renvois, pour les lecteurs d'écran. */
  labels: { info: 'Expliquer', note: 'Note' },

  items: ITEMS,

  /** Mention réglementaire ajoutée au contenu de corum.fr (voir l'en-tête). */
  pastPerformance:
    'Les performances passées ne préjugent pas des performances futures. Investir dans une SCPI comporte un risque de perte en capital et les revenus ne sont pas garantis.',

  notes: NOTES,
} as const;
