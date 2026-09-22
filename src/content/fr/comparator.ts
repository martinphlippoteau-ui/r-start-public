/*
 * Imports RELATIFS, contrairement au reste du dossier : scripts/check-compliance.mjs charge ce fichier
 * avec node, qui ne connaît pas l'alias « @/ » du projet. facts.ts et legal.ts sont dans le même cas.
 */
import { fees, product } from './facts.ts';

/**
 * Comparateur de frais de /frais et de l'accueil : R Start à gauche, une SCPI choisie dans une
 * liste à droite, sept lignes de frais. Les valeurs de R Start ne sont JAMAIS saisies ici : elles
 * viennent de facts.fees, comme partout.
 *
 * CE QU'IL FAUT SAVOIR CÔTÉ CONFORMITÉ : les dix-neuf SCPI ont leurs sept taux, tous en HT, la même
 * base que R Start, mais d'une source UNIQUE et globale (SOURCE_EQUIPE). Il manque toujours, SCPI
 * par SCPI, le document réglementaire et sa date d'arrêté : un lecteur ne peut pas remonter un taux
 * jusqu'à la note d'information ou au DIC dont il sort, et un taux qui change ne se vérifie pas. Le
 * tableau nomme dix-neuf sociétés de gestion sans plus rien dire de son périmètre (voir la note
 * après `sourceOthers`), et il repose sur une hypothèse de lecture que l'écran ne dit pas (voir
 * avant `range`).
 */

/** Une SCPI du comparateur. `values` vide = données à relever ; la ligne s'affiche « à compléter ». */
export interface ComparedScpi {
  /** Nom commercial, à vérifier sur les documents de la SCPI au moment de relever les taux. */
  name: string;
  /** Société de gestion, même réserve. */
  manager: string;
  /** Taux par clé de ligne (voir `rows`). Absent = non relevé. */
  values?: Partial<Record<ComparatorRowKey, string>>;
  /** Précision sous un taux (palier, condition), quand le taux seul ne suffit pas. */
  details?: Partial<Record<ComparatorRowKey, string>>;
  /** Document et date d'où viennent les taux. Obligatoire dès qu'une valeur est renseignée. */
  source?: string;
  /**
   * Renseigné = la SCPI N'EST PAS proposée au choix, et pourquoi. On ne laisse pas dans une liste
   * publique un nom qu'on n'a pas pu vérifier : ce serait une erreur de fait dans un comparatif.
   */
  unavailable?: string;
}

/**
 * Une ligne du comparateur. DÉCLARÉE, et non déduite du tableau : le jour où plus aucune ligne n'a
 * porté `rstartDetail` (16/09/2026), TypeScript a conclu que la propriété n'existait pas et le
 * composant qui la lit ne compilait plus. Le type dit ce qu'une ligne PEUT avoir.
 */
export interface ComparatorRow {
  key: ComparatorRowKey;
  /** Texte du « i » de la ligne. */
  info: string;
  label: string;
  /** Assiette du taux, sous le libellé. */
  basis: string;
  /** Taux de R Start, ou fourchette. */
  rstart: string;
  /** Taux réellement comparé quand la case affiche une fourchette. */
  rstartCompare?: string;
  /**
   * Précision sous le taux de R Start. Absente : la case n'affiche que le taux. Une LISTE pour les
   * barèmes à paliers (cessions, retrait) : une ligne par palier, taux en tête.
   */
  rstartDetail?: string | readonly string[];
}

export type ComparatorRowKey =
  'subscription' | 'acquisition' | 'broker' | 'management' | 'works' | 'disposal' | 'withdrawal';

/**
 * HYPOTHÈSE DE LECTURE DU TABLEAU, JAMAIS DITE À L'ÉCRAN (12/09/2026, demande de l'équipe) : le
 * souscripteur garde ses parts au moins huit ans (facts.fees.withdrawal.zeroAfterYears), durée
 * au-delà de laquelle R Start ne prélève plus de commission de retrait. Le retrait de R Start se
 * compare donc sur `rstartCompare` (0 %) et peut être marqué « taux le plus bas de la ligne » sans
 * que l'hypothèse soit énoncée. La phrase qui devait la dire a quitté le code le 22/09/2026
 * (archivée hors du dépôt, .claude/audits) ; l'écart, lui, demeure.
 */

/** Fourchette d'un barème à paliers : « de 0 % à 12 % » se lit mieux que « 0 / 6 / 12 % ». */
const range = (rates: readonly string[]): string => {
  const nums = rates.map((r) => parseFloat(r.replace(',', '.')));
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return min === max ? `${min} %` : `de ${min} % à ${max} %`;
};

/** Taux de retrait de R Start au-delà de la durée retenue : le dernier palier du barème. */
const lastWithdrawalStep = fees.withdrawal.steps.at(-1);
if (!lastWithdrawalStep)
  throw new Error('comparator.ts : le barème de retrait de facts.ts est vide');
const withdrawalAfterHolding = lastWithdrawalStep.rate;

/*
 * Conditions du barème de retrait (texte de l'équipe, 16/09/2026), une par palier, dans l'ordre de
 * facts.fees.withdrawal.steps d'où viennent les taux. Le garde-fou arrête la compilation si un
 * palier est ajouté dans facts.ts sans sa condition, au lieu de laisser un taux sans phrase.
 */
const WITHDRAWAL_CONDITIONS = [
  'en cas de sortie avant 4 ans de détention',
  'en cas de sortie la 5e ou la 6e année',
  'en cas de sortie la 7e année',
  'en cas de sortie la 8e année',
  'au-delà de 8 ans de détention',
] as const;
if (WITHDRAWAL_CONDITIONS.length !== fees.withdrawal.steps.length) {
  throw new Error(
    `comparator.ts : ${WITHDRAWAL_CONDITIONS.length} conditions de retrait pour ${fees.withdrawal.steps.length} paliers dans facts.fees.withdrawal.steps`
  );
}
const withdrawalSchedule = fees.withdrawal.steps.map(
  (step, i) => `${step.rate} ${WITHDRAWAL_CONDITIONS[i]}`
);

/*
 * Source commune des dix-neuf SCPI (texte de l'équipe, 16/09/2026), tout en HT. Elle nomme l'étude
 * mais reste unique et globale, sans référence documentaire par SCPI : voir l'en-tête. La mention
 * est honnête sur ce point plutôt que de laisser croire à une référence par société de gestion.
 */
const SOURCE_EQUIPE =
  'étude comparative réalisée par CORUM au 15 septembre 2026, à partir des notes d’information publiées par chaque société de gestion concernée. Taux exprimés hors taxes.';

const ROWS: ComparatorRow[] = [
    /*
     * Textes « i » (16/09/2026, fournis par l'équipe) : ce que le frais RECOUVRE et QUI le paie, là
     * où `basis` ne dit que l'assiette. Repliés derrière un bouton, absent des lignes sans texte.
     */
    {
      key: 'subscription' as const,
      info: 'L’épargnant paie ces frais au moment de son investissement. Ils rémunèrent la société de gestion et les intermédiaires avant que l’épargnant perçoive tout revenu. Ils réduisent d’autant le montant réellement investi.',
      label: 'Frais de souscription',
      basis: 'en % du montant investi',
      rstart: fees.subscription.label,
    },
    {
      key: 'acquisition' as const,
      info: 'L’épargnant paie ces frais à chaque fois que la SCPI achète un immeuble. Ils rémunèrent la recherche et l’acquisition du bien. Ces frais créent un écart entre le montant souscrit et le montant réellement investi par la SCPI. Ils sont prélevés même si la SCPI ne verse aucun revenu à l’épargnant.',
      label: 'Frais d’acquisition',
      basis: 'en % du prix d’achat',
      rstart: fees.acquisition.label,
    },
    {
      key: 'broker' as const,
      info: 'L’épargnant paie ces frais lorsque la SCPI achète un immeuble sans passer par un agent immobilier. Il s’agit de frais d’acquisition majorés. Ces frais sont prélevés même si la SCPI ne verse aucun revenu à l’épargnant.',
      label: 'Frais d’agent immobilier',
      basis: 'en % du prix d’acquisition',
      rstart: fees.broker.label,
    },
    /* L'ordre des lignes n'a qu'une source, cette liste : chaque SCPI donne ses valeurs par `key`.
       Travaux avant gestion depuis le 15/09/2026 (demande de l'équipe). */
    {
      key: 'works' as const,
      info: 'L’épargnant paie des frais lorsque la SCPI réalise des travaux sur les immeubles. Ces frais sont prélevés même lorsque la SCPI ne verse aucun revenu à l’épargnant.',
      label: 'Frais de travaux',
      basis: 'en % du montant des travaux',
      rstart: fees.works.label,
    },
    {
      key: 'management' as const,
      info: 'L’épargnant paie des frais de gestion quand il perçoit des revenus issus des loyers. Autrement dit, ces frais ne sont dus que lorsque l’épargnant gagne de l’argent.',
      label: 'Frais de gestion',
      basis: 'en % des loyers encaissés',
      rstart: fees.management.label,
    },
    {
      key: 'disposal' as const,
      info: 'L’épargnant paie des frais de cession d’immeubles quand il perçoit des revenus issus de la vente d’immeuble. La plupart des SCPI ne prélèvent des frais qu’à partir d’un certain niveau de plus-value. Autrement dit, ces frais ne sont dus que lorsque l’épargnant gagne de l’argent.',
      label: 'Frais de cession d’immeubles',
      basis: 'en % du prix de vente',
      rstart: range(fees.disposal.tiers.map((t) => t.rate)),
      /* Barème sous la fourchette, un palier par ligne (16/09/2026, texte de l'équipe) ; taux et
         conditions viennent de facts.fees.disposal.tiers. */
      rstartDetail: fees.disposal.tiers.map((t) => `${t.rate} ${t.condition}`),
    },
    {
      key: 'withdrawal' as const,
      info: 'L’épargnant paie des frais de retrait anticipé s’il revend ses parts avant une certaine durée de détention (variable selon la SCPI). Ces frais sont prélevés même lorsque la SCPI ne verse aucun revenu à l’épargnant.',
      label: 'Frais de retrait anticipé',
      basis: 'en % de la valeur de retrait',
      /* Fourchette, et non le seul dernier palier (15/09/2026, « mets au format de 0 % à 12 %
         plutôt ») : on lisait « 0 % » là où le taux vaut 10 % pour qui sort avant quatre ans. */
      rstart: range(fees.withdrawal.steps.map((s) => s.rate)),
      /* Ce qui est COMPARÉ reste le taux au-delà de la durée retenue, 0 % : c'est l'hypothèse de
         lecture consignée plus haut. Sans ce champ, la fourchette ne se comparerait à rien. */
      rstartCompare: withdrawalAfterHolding,
      /* Barème sous la fourchette, un palier par ligne (16/09/2026) : il rend l'hypothèse lisible,
         il ne la change pas. */
      rstartDetail: withdrawalSchedule,
    },
];

export const comparator = {
  /*
   * Titre hors écran (`visually-hidden`) : il nomme la section (`labelledBy`) et sert de
   * `<caption>` au tableau, sans quoi les lecteurs d'écran ne l'annoncent pas. Le titre visible
   * « la seule SCPI qui ne prend des frais que si vous gagnez » a été retiré le 16/09/2026 à la
   * demande de l'équipe, et REMPLACÉ plutôt que masqué : hors écran, l'allégation d'exclusivité
   * serait restée dans la page, lue par les lecteurs d'écran et comptée par
   * scripts/check-compliance.mjs.
   */
  title: 'Comparaison des frais de R Start avec une autre SCPI',
  /* Titre VISIBLE du comparateur de l'accueil (16/09/2026, texte de l'équipe). Non rendu sur
     /frais, dont l'en-tête dit déjà « Comparateur de frais ». */
  homeHeading: 'Un modèle de frais inédit. Comparez par vous-même !',
  /** Colonne de gauche, toujours R Start. */
  leftLabel: product.name,
  /* Intitulé visible au-dessus de la liste (raccourci le 14/09/2026, demande de l'équipe). Ce que
     ces SCPI ont en commun (pas de commission de souscription, mais des frais d'acquisition) n'est
     plus dit nulle part autour du tableau depuis que le périmètre a quitté l'écran. */
  selectLabel: 'Autres SCPI',
  /** Affiché tant que la SCPI n'a pas été documentée du tout (aucune source). */
  pendingLabel: 'À compléter',
  /**
   * Affiché quand la source A ÉTÉ consultée mais ne publie pas ce frais. Ce n'est pas la même chose
   * qu'une donnée manquante, et ce n'est surtout pas 0 % : une absence de mention ne vaut pas gratuité.
   */
  notPublishedLabel: 'Non publié',
  /** En-tête de la première colonne, lu par les lecteurs d'écran (masqué à l'œil). */
  feeColumnLabel: 'Frais',
  /**
   * Le taux le plus bas d'une ligne est mis en avant par la COULEUR et la GRAISSE, jamais par la
   * TAILLE : un frais affiché plus petit que ses voisins est précisément ce que l'AMF a reproché à
   * la brochure, et tests/conformite.spec.ts le vérifie. Ce libellé est lu par les lecteurs
   * d'écran, pour qui la couleur ne dit rien ; il n'apparaît que si LES DEUX cases portent un taux
   * unique comparable.
   */
  bestLabel: 'taux le plus bas de la ligne',
  /* Nom du bouton « i » pour les lecteurs d'écran, complété par le libellé de la ligne. */
  infoLabel: 'Expliquer',
  /**
   * Sources sous le tableau, une par colonne. `sourceOthers` est le repli porté par le HTML avant
   * le script, seul affiché sans script.
   */
  sourceLabel: 'Sources des données',
  /** Qui publie les chiffres de la colonne de gauche, et dans quels documents. */
  sourceRStartLabel: 'CORUM Asset Management',
  sourceRStart: `document d’informations clés du ${product.dicDate.label}, note d’information visée par l’AMF et brochure partenaires 2026.`,
  sourceOthers:
    'Frais des autres SCPI : à relever dans le document d’informations clés et la note d’information de chacune, avec leur date d’arrêté. Un taux change : la date fait foi.',
  /*
   * TROIS TEXTES ONT QUITTÉ L'ÉCRAN LE 14/09/2026 ET LE CODE LE 22/09/2026 (archivés hors du dépôt,
   * .claude/audits) : le périmètre du comparatif (des taux affichés, pas des coûts réels ; les
   * seules SCPI de la liste, pas le marché ; aucune comparaison de résultats), la base HT / TTC de
   * chaque taux et l'encadré « Une innovation, pas une révolution ». Plus rien ne le dit autour du
   * tableau, et scripts/check-compliance.mjs ne le contrôle plus.
   */

  /** Les sept lignes, dans l'ordre du tableau fourni par l'équipe. */
  rows: ROWS,

  /**
   * Dix-neuf SCPI depuis le 15/09/2026, Iroko Zen en tête : celle que l'équipe veut voir d'abord.
   */
  scpis: [
    {
      name: 'Iroko Zen',
      manager: 'Iroko',
      values: {
        subscription: '0 %',
        acquisition: '3 %',
        broker: '5 %',
        management: '12 %',
        works: '5 %',
        disposal: '4,16 %',
        withdrawal: '5 %',
      },
      details: {
        disposal: 'si la plus-value dépasse 5 %',
        withdrawal: 'avant 6 ans de détention ; 0 % au-delà',
      },
      source: SOURCE_EQUIPE,
    },
    {
      name: 'Transitions Europe',
      manager: 'Arkéa REIM',
      values: {
        subscription: '10 %',
        acquisition: '0 %',
        broker: '0 %',
        management: '10 %',
        works: '5 %',
        disposal: '2 %',
        withdrawal: '0 %',
      },
      source: SOURCE_EQUIPE,
    },
    {
      name: 'Comète',
      manager: 'Alderan',
      values: {
        subscription: '10 %',
        acquisition: '0 %',
        broker: '0 %',
        management: '11 %',
        works: '3 %',
        disposal: '1 %',
        withdrawal: '0 %',
      },
      details: {
        acquisition:
          '0 % sur les acquisitions financées par la collecte, 1 % en cas de réemploi du produit de cessions',
      },
      source: SOURCE_EQUIPE,
    },
    {
      name: 'Épargne Pierre Europe',
      manager: 'Atland Voisin',
      values: {
        subscription: '10 %',
        acquisition: '0 %',
        broker: '0 %',
        management: '10 %',
        works: '2,50 %',
        disposal: '1 %',
        withdrawal: '0 %',
      },
      details: {
        acquisition:
          '0 % sur les acquisitions financées par la collecte, 1 % en cas de réemploi du produit de cessions',
        disposal:
          '1 % si la plus-value nette fiscale est comprise entre 5 % et 10 %, 1,25 % au-delà de 10 %',
      },
      source: SOURCE_EQUIPE,
    },
    {
      name: 'Iroko Atlas',
      manager: 'Iroko',
      values: {
        subscription: '0 %',
        acquisition: '4 %',
        broker: '0 %',
        management: '12 %',
        works: '5 %',
        disposal: '4,16 %',
        withdrawal: '5 %',
      },
      details: {
        management: '12 % pour les actifs situés en zone euro, 14 % hors zone euro',
        disposal: 'si la plus-value dépasse 5 %',
        withdrawal: 'sur les parts détenues moins de 6 ans',
      },
      source: SOURCE_EQUIPE,
    },
    {
      name: 'EDR Europa',
      manager: 'Edmond de Rothschild REIM',
      values: {
        subscription: '10 %',
        acquisition: '1,25 %',
        broker: '0 %',
        management: '10,50 %',
        works: '2,50 %',
        disposal: '1,25 %',
        withdrawal: '0 %',
      },
      details: {
        disposal: 'dès que la vente dégage une plus-value',
      },
      source: SOURCE_EQUIPE,
    },
    {
      name: 'Cristal Life',
      manager: 'Inter Gestion',
      values: {
        subscription: '12 %',
        acquisition: '1,50 %',
        broker: '3,50 %',
        management: '12,40 %',
        works: '2,50 %',
        disposal: '2,50 %',
        withdrawal: '0 %',
      },
      details: {
        broker:
          '3,5 % sous 5 M€ hors droits, 1,75 % de 5 à 10 M€, 1,5 % de 10 à 15 M€, 1,25 % au-delà',
      },
      source: SOURCE_EQUIPE,
    },
    {
      name: 'Sofidynamic',
      manager: 'Tikehau IM',
      values: {
        subscription: '2 %',
        acquisition: '2,50 %',
        broker: '0 %',
        management: '12 %',
        works: '1,50 %',
        disposal: '2,50 %',
        withdrawal: '4,17 %',
      },
      details: {
        works: 'sur les travaux dépassant 100 000 € HT',
        withdrawal: 'sur les parts détenues moins de 8 ans',
      },
      source: SOURCE_EQUIPE,
    },
    {
      name: 'Wemo One',
      manager: 'Wemo REIM',
      values: {
        subscription: '10 %',
        acquisition: '2 %',
        broker: '0 %',
        management: '11 %',
        works: '0 %',
        disposal: '2 %',
        withdrawal: '0 %',
      },
      details: {
        disposal: 'dès que la vente dégage une plus-value',
      },
      source: SOURCE_EQUIPE,
    },
    {
      name: 'Remake Live',
      manager: 'Remake AM',
      values: {
        subscription: '0 %',
        acquisition: '4,17 %',
        broker: '0 %',
        management: '15 %',
        works: '4,17 %',
        disposal: '0 %',
        withdrawal: '4,17 %',
      },
      details: {
        withdrawal: 'sur les parts détenues moins de 5 ans',
      },
      source: SOURCE_EQUIPE,
    },
    {
      name: 'Cœur d’Europe',
      manager: 'Sogenial Immobilier',
      values: {
        subscription: '10 %',
        acquisition: '0 %',
        broker: '0 %',
        management: '10 %',
        works: '5 %',
        disposal: '5 %',
        withdrawal: '0 %',
      },
      source: SOURCE_EQUIPE,
    },
    {
      name: 'Osmo Énergie',
      manager: 'Mata Capital IM',
      values: {
        subscription: '10 %',
        acquisition: '1 %',
        broker: '0 %',
        management: '9 %',
        works: '0 %',
        disposal: '1 %',
        withdrawal: '0 %',
      },
      details: {
        disposal: 'dès que la vente dégage une plus-value',
      },
      source: SOURCE_EQUIPE,
    },
    {
      name: 'Allianz Diverscity',
      manager: 'Allianz Immovalor',
      values: {
        subscription: '8 %',
        acquisition: '0 %',
        broker: '0 %',
        management: '8 %',
        works: '0 %',
        disposal: '2 %',
        withdrawal: '0 %',
      },
      source: SOURCE_EQUIPE,
    },
    {
      name: 'Epsicap Nano',
      manager: 'Epsicap REIM',
      values: {
        subscription: '5 %',
        acquisition: '5 %',
        broker: '0 %',
        management: '10 %',
        works: '0 %',
        disposal: '0 %',
        withdrawal: '0 %',
      },
      details: {
        acquisition:
          '5 % sur les acquisitions financées par la collecte, 2 % en cas de réemploi du produit de cessions',
      },
      source: SOURCE_EQUIPE,
    },
    {
      name: 'Alta Convictions',
      manager: 'Altarea IM',
      values: {
        subscription: '8,45 %',
        acquisition: '1,25 %',
        broker: '0 %',
        management: '11,45 %',
        works: '3 %',
        disposal: '2,50 %',
        withdrawal: '0 %',
      },
      source: SOURCE_EQUIPE,
    },
    {
      name: 'Volt Europe',
      manager: 'Volt AM',
      values: {
        subscription: '10 %',
        acquisition: '0 %',
        broker: '0 %',
        management: '10 %',
        works: '5 %',
        disposal: '1 %',
        withdrawal: '0 %',
      },
      details: {
        disposal:
          '1 % si la plus-value est comprise entre 1 % et 5 %, 3 % de 5 à 10 %, 5 % au-delà',
      },
      source: SOURCE_EQUIPE,
    },
    {
      name: 'Immo France Territoires',
      manager: 'Amundi Immobilier',
      values: {
        subscription: '4 %',
        acquisition: '1 %',
        broker: '0 %',
        management: '13 %',
        works: '3 %',
        disposal: '1 %',
        withdrawal: '1 %',
      },
      details: {
        acquisition:
          '1 %, ramené à 0,5 % pour une transaction entre deux fonds gérés par Amundi Immobilier',
        disposal:
          '1 %, ramené à 0,5 % pour une transaction entre deux fonds gérés par Amundi Immobilier',
      },
      source: SOURCE_EQUIPE,
    },
    {
      name: 'PPG PremEurope',
      manager: 'Pierre 1er Gestion',
      values: {
        subscription: '8 %',
        acquisition: '3 %',
        broker: '0 %',
        management: '10 %',
        works: '1 %',
        disposal: '1 %',
        withdrawal: '0 %',
      },
      details: {
        acquisition: '3 % sous 10 M€ hors droits, 2 % de 10 à 25 M€, 1,5 % au-delà',
        disposal: 'dès que la vente dégage une plus-value',
      },
      source: SOURCE_EQUIPE,
    },
    {
      name: 'Atream Atwin',
      manager: 'Atream',
      values: {
        subscription: '10 %',
        acquisition: '0 %',
        broker: '0 %',
        management: '10 %',
        works: '0 %',
        disposal: '0 %',
        withdrawal: '0 %',
      },
      details: {
        acquisition:
          '0 % sur les acquisitions financées par la collecte, 1,5 % en cas de réemploi du produit de cessions',
        disposal: '0 % sous 5 % de plus-value, 2,5 % de 5 à 10 %, 5 % au-delà',
      },
      source: SOURCE_EQUIPE,
    },
  ] as ComparedScpi[],
};

/** Les SCPI réellement proposées au choix : celles qu'on a pu vérifier. */
export const comparatorScpis = comparator.scpis.filter((s) => !s.unavailable);
