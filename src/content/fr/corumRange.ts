/**
 * LA GAMME DE SCPI DU GROUPE CORUM, avec ses chiffres (16/09/2026, contenu fourni par l'équipe pour
 * la page /a-propos). Elle remplace la liste de cinq tuiles « Des SCPI gérées depuis 2012 ».
 *
 * CE BLOC AFFICHE DES PERFORMANCES PASSÉES, ce que le site ne faisait nulle part ailleurs, et c'est
 * ce qui commande sa forme :
 *  - chaque chiffre porte son intitulé exact, celui fourni par l'équipe, jamais un raccourci : un
 *    « taux de distribution » n'est pas un rendement, un TRI n'est pas une performance annuelle ;
 *  - CORUM USA affiche un OBJECTIF et non un historique, et son intitulé le dit ;
 *  - les cinq définitions livrées avec les chiffres sont rendues sous le carrousel, in extenso ;
 *  - la mention réglementaire « les performances passées ne préjugent pas des performances futures »
 *    est AJOUTÉE ici : elle ne figurait pas dans le contenu fourni, et une communication commerciale
 *    qui affiche des performances passées ne peut pas s'en dispenser. Elle est posée en tête des
 *    mentions, pas noyée à la fin.
 *
 * R START N'Y FIGURE PAS, et c'est juste : la SCPI n'a aucun historique, elle n'a donc ni TRI ni
 * rendement à montrer. La liste des cinq SCPI avec l'année de création, qui occupait cette place, est
 * remplacée par ce carrousel à la demande de l'équipe.
 *
 * LES CHIFFRES SONT SAISIS TELS QUE FOURNIS, seule leur écriture est mise aux normes françaises :
 * virgule décimale au lieu du point, espace insécable dans les milliers et avant les unités.
 * DATE D'ARRÊTÉ NON COMMUNIQUÉE : comme pour les chiffres du groupe, elle reste à demander à CORUM.
 */

/** Une mesure affichée sur une carte : le nombre, son unité, et ce qu'il mesure. */
export interface MesureScpi {
  value: string;
  unit: string;
  label: string;
}

export interface ScpiGamme {
  /*
   * PAS DE SURTITRE. Chaque carte en portait un, « SCPI », retiré le 16/09/2026 à la demande de
   * l'équipe : le titre du bloc dit déjà « Nos autres SCPI », et le mot se répétait quatre fois sous
   * lui pour ne rien apprendre.
   */
  name: string;
  /** Pastille « nouveauté » : CORUM USA seulement. */
  badge?: string;
  /** Mesure mise en avant, TRI réalisé ou objectif de TRI selon la SCPI. */
  principale: MesureScpi;
  /*
   * PAS DE CHAMP « Voir plus ». Le contenu fourni en portait un sous chaque TRI : sur corum.fr, il
   * ouvre la définition. Ici les cinq définitions sont affichées EN ENTIER sous le carrousel, un
   * « Voir plus » n'aurait donc rien à ouvrir et renverrait vers un texte déjà à l'écran.
   */
  autres: MesureScpi[];
}

const RISQUE = 'Indicateur de risque';
const MINIMUM = 'Minimum d’investissement';
const RENDEMENT = 'Rendement 2025';
const TRI = 'Taux de rendement interne (TRI) depuis la création';

/*
 * TYPÉ EXPLICITEMENT, et non par `satisfies` : celui-ci conserve le type du littéral, et le jour où
 * plus aucune SCPI ne porte de pastille — c'est arrivé le 16/09/2026 avec le retrait de celle de
 * CORUM USA — TypeScript conclut que le champ n'existe pas et le composant qui le lit ne compile
 * plus. Le type doit décrire ce qu'une carte PEUT porter, pas ce que les données du jour portent.
 */
const ITEMS: ScpiGamme[] = [
    {
      name: 'CORUM Origin',
      principale: { value: '6,94', unit: '%', label: TRI },
      autres: [
        { value: '3', unit: '/7', label: RISQUE },
        { value: '1 135', unit: '€', label: MINIMUM },
        { value: '6,50', unit: '%', label: RENDEMENT },
      ],
    },
    {
      name: 'CORUM XL',
      principale: { value: '5,77', unit: '%', label: TRI },
      autres: [
        { value: '4', unit: '/7', label: RISQUE },
        { value: '195', unit: '€', label: MINIMUM },
        { value: '5,30', unit: '%', label: RENDEMENT },
      ],
    },
    {
      name: 'CORUM Eurion',
      principale: { value: '6,50', unit: '%', label: TRI },
      autres: [
        { value: '3', unit: '/7', label: RISQUE },
        { value: '215', unit: '€', label: MINIMUM },
        { value: '5,73', unit: '%', label: RENDEMENT },
      ],
    },
    {
      name: 'CORUM USA',
      /* Pastille « nouveauté » retirée le 16/09/2026, demande de l'équipe. Le champ `badge` reste
         dans le type : R Start le reprendra le jour où elle entrera dans cette liste. */
      /* OBJECTIF et non historique : la SCPI est trop jeune pour un TRI réalisé, et l'intitulé fourni
         par l'équipe le dit lui-même. Ne jamais l'aligner sur celui des trois autres. */
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
  /* « Nos autres SCPI en quelques chiffres » depuis le 16/09/2026, ex-« Notre gamme de SCPI » :
     « autres » dit que R Start n'y est pas, et « quelques chiffres » annonce ce qu'on va lire. */
  title: 'Nos autres SCPI en quelques chiffres',
  /** Libellé lu par les lecteurs d'écran sur la liste défilante. */
  listLabel: 'Les SCPI du groupe CORUM',
  previousLabel: 'SCPI précédente',
  nextLabel: 'SCPI suivante',

  items: ITEMS,

  /**
   * Mention réglementaire, AJOUTÉE au contenu fourni : elle ouvre les définitions parce qu'elle
   * qualifie tous les chiffres au-dessus, et non l'une d'entre elles.
   */
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
