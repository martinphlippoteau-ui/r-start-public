/**
 * LA GAMME DE SCPI DU GROUPE CORUM, avec ses chiffres (16/09/2026, contenu fourni par l'équipe pour
 * la page /a-propos). R START N'Y FIGURE PAS : sans historique, elle n'a ni TRI ni rendement à
 * montrer.
 *
 * CE BLOC AFFICHE DES PERFORMANCES PASSÉES, ce que le site ne fait nulle part ailleurs, et c'est ce
 * qui commande sa forme :
 *  - chaque chiffre porte son intitulé exact, celui fourni par l'équipe, jamais un raccourci : un
 *    « taux de distribution » n'est pas un rendement, un TRI n'est pas une performance annuelle ;
 *  - CORUM USA affiche un OBJECTIF et non un historique, et son intitulé le dit ;
 *  - les cinq définitions livrées avec les chiffres sont rendues sous les cartes, in extenso ;
 *  - la mention « les performances passées ne préjugent pas des performances futures » est AJOUTÉE
 *    au contenu fourni, en tête des mentions : une communication commerciale qui affiche des
 *    performances passées ne peut pas s'en dispenser.
 *
 * LES CHIFFRES SONT SAISIS TELS QUE FOURNIS, seule leur écriture est mise aux normes françaises.
 * DATE D'ARRÊTÉ NON COMMUNIQUÉE : comme pour les chiffres du groupe, elle reste à demander à CORUM.
 */

import { scpiCreated } from '@/content/fr/facts';

/** Une mesure affichée sur une carte : le nombre, son unité, et ce qu'elle mesure. */
export interface MesureScpi {
  value: string;
  unit: string;
  label: string;
}

export interface ScpiGamme {
  /** Année de création sous le nom, depuis `scpiCreated` (facts.ts), qui porte la réserve. */
  created?: string;
  /* Pas de surtitre « SCPI » (retiré le 16/09/2026, demande de l'équipe) : le titre du bloc le dit.
*/
  name: string;
  /** Pastille « nouveauté » : CORUM USA seulement. */
  badge?: string;
  /** Mesure mise en avant, TRI réalisé ou objectif de TRI selon la SCPI. */
  principale: MesureScpi;
  /* Pas de « Voir plus » sous chaque TRI comme sur corum.fr : les définitions sont déjà à l'écran.
*/
  autres: MesureScpi[];
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

const RISQUE = 'Indicateur de risque';
const MINIMUM = 'Minimum d’investissement';
const RENDEMENT = 'Rendement 2025';
const TRI = 'Taux de rendement interne (TRI) depuis la création';

/*
 * TYPÉ EXPLICITEMENT, et non par `satisfies` : celui-ci conserve le type du littéral, et le jour où
 * plus aucune SCPI ne porte de pastille (arrivé le 16/09/2026), TypeScript conclut que le champ
 * n'existe pas et le composant qui le lit ne compile plus.
 */
const ITEMS: ScpiGamme[] = [
    {
      name: 'CORUM Origin',
    created: creee('CORUM Origin'),
      principale: { value: '6,94', unit: '%', label: TRI },
      autres: [
        { value: '3', unit: '/7', label: RISQUE },
        { value: '1 135', unit: '€', label: MINIMUM },
        { value: '6,50', unit: '%', label: RENDEMENT },
      ],
    },
    {
      name: 'CORUM XL',
    created: creee('CORUM XL'),
      principale: { value: '5,77', unit: '%', label: TRI },
      autres: [
        { value: '4', unit: '/7', label: RISQUE },
        { value: '195', unit: '€', label: MINIMUM },
        { value: '5,30', unit: '%', label: RENDEMENT },
      ],
    },
    {
      name: 'CORUM Eurion',
    created: creee('CORUM Eurion'),
      principale: { value: '6,50', unit: '%', label: TRI },
      autres: [
        { value: '3', unit: '/7', label: RISQUE },
        { value: '215', unit: '€', label: MINIMUM },
        { value: '5,73', unit: '%', label: RENDEMENT },
      ],
    },
    {
      name: 'CORUM USA',
    created: creee('CORUM USA'),
      /* Pastille « nouveauté » retirée le 16/09/2026, demande de l'équipe. OBJECTIF et non
         historique : trop jeune pour un TRI réalisé. Ne jamais aligner l'intitulé sur les autres.
*/
      principale: {
        value: '4,50',
        unit: '%',
        label: 'Objectif de taux de rendement interne sur 10 ans',
      },
      autres: [
        { value: '4', unit: '/7', label: RISQUE },
        { value: '200', unit: '€', label: MINIMUM },
        { value: '7,70', unit: '%', label: RENDEMENT },
      ],
    },
];

export const corumRange = {
  /* « autres » dit que R Start n'y est pas (16/09/2026, texte de l'équipe). */
  title: 'Nos autres SCPI en quelques chiffres',
  /** Libellé lu par les lecteurs d'écran sur la liste. */
  listLabel: 'Les SCPI du groupe CORUM',

  items: ITEMS,

  /** Mention réglementaire ajoutée au contenu fourni (voir l'en-tête). */
  pastPerformance:
    'Les performances passées ne préjugent pas des performances futures. Investir dans une SCPI comporte un risque de perte en capital et les revenus ne sont pas garantis.',

  /** Les cinq définitions livrées avec les chiffres, reproduites sans coupe. */
  notes: [
    'Le taux de rendement interne (TRI) permet de mesurer la rentabilité totale d’un investissement en intégrant le fait que la valeur de l’argent évolue dans le temps. Il tient compte non seulement des revenus perçus, des frais payés et de la variation de valeur de votre investissement, mais aussi du temps qui passe : en effet, 1 € aujourd’hui vaut plus que 1 € dans 1 an, car on peut immédiatement réinvestir cet euro et le faire fructifier.',
    'L’indicateur synthétique de risque permet d’apprécier le niveau de risque de ce produit par rapport à d’autres. Il indique la probabilité que ce produit enregistre des pertes en cas de mouvements sur les marchés.',
    'Frais et commission de souscription inclus.',
    'Rendement : taux de distribution, défini comme le dividende brut, avant prélèvements français et étrangers (payés par la SCPI pour le compte de l’associé), versé au titre de l’année N (y compris les acomptes exceptionnels et quote-part de plus-values distribuées, 0,57 % pour CORUM Origin en 2025) divisé par le prix de souscription au 1er janvier de l’année N de la part. Cet indicateur permet de mesurer la performance financière annuelle de chaque SCPI. En l’absence d’évolution du prix de souscription en 2025, le taux de performance globale annuelle est strictement égal au rendement.',
    'Taux de performance globale annuelle, défini comme le rendement versé augmenté ou diminué de la différence entre le prix de souscription au 1er janvier de l’année n+1 et le prix de souscription au 1er janvier de l’année n, divisé par le prix de souscription au 1er janvier de l’année N de la part.',
  ],
} as const;
