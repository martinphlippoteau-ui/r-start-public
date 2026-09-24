/*
 * Imports RELATIFS, contrairement au reste du dossier : scripts/check-compliance.mjs charge ce fichier
 * avec node, qui ne connaît pas l'alias « @/ » du projet. facts.ts et legal.ts sont dans le même cas.
 */
import { fees, product } from './facts.ts';
import { nb } from '../../lib/texte.ts';

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
 * après `sourceText`).
 *
 * MISE À JOUR DU 23/09/2026 (tableau de Martin « Comparatif des frais - R START vs concurrents »,
 * relevé par l'équipe dans les DIC, notes d'information et statuts) : Cœur d'Europe (travaux et vente
 * d'immeubles 6 %), Osmo Énergie (entrée 12 %), Alta Convictions (achat d'immeubles 0 % sur la
 * collecte, 1,25 % en réemploi), Iroko Zen (agent immobilier : en l'absence d'intermédiaire). Les
 * quinze autres étaient déjà à jour. Documents relevés, dans l'ordre de la liste : Iroko Zen, note
 * d'information ; Transitions Europe, note d'information ; Comète, note d'information du
 * 07/07/2026 ; Épargne Pierre Europe, note d'information du 26/06/2026 ; Iroko Atlas, note
 * d'information ; EDR Europa, note d'information de juin 2026 ; Cristal Life, note d'information et
 * statuts du 15/01/2026 ; Sofidynamic, note d'information de juillet 2026 ; Wemo One, DIC du
 * 19/06/2026 ; Remake Live, note d'information ; Cœur d'Europe, note d'information ; Osmo Énergie,
 * note d'information ; Allianz Diverscity, note d'information du 30/04/2026 ; Epsicap Nano, note
 * d'information de mai 2026 ; Alta Convictions, note d'information de juin 2026 ; Volt Europe,
 * note d'information du 29/05/2026 ; Immo France Territoires, statuts ; PPG PremEurope, page
 * produit de la société de gestion ; Atream Atwin, statuts du 02/07/2026. Les frais du marché
 * secondaire (colonne « Note » du tableau) ne figurent pas dans les sept lignes du comparateur.
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
 * Une ligne du comparateur. DÉCLARÉE, et non déduite du tableau : une propriété que plus aucune
 * ligne ne porterait disparaîtrait du type déduit, et le composant qui la lit ne compilerait plus.
 * Le type dit ce qu'une ligne PEUT avoir.
 */
export interface ComparatorRow {
  key: ComparatorRowKey;
  /** Texte du « i » de la ligne. */
  info: string;
  label: string;
  /** Assiette du taux, sous le libellé. */
  basis: string;
  /** Taux unique de R Start ; absent quand la ligne est un barème à paliers (`rstartTiers`). */
  rstart?: string;
  /**
   * Barème à paliers de R Start, un palier par ligne, le taux en tête et sa condition à côté (à la
   * présentation de la brochure, même forme pour la vente d'immeubles et la sortie anticipée).
   * Une ligne à paliers n'est jamais comparée à l'autre colonne.
   */
  rstartTiers?: readonly { rate: string; when: string }[];
}

export type ComparatorRowKey =
  'subscription' | 'acquisition' | 'broker' | 'management' | 'works' | 'disposal' | 'withdrawal';

/**
 * BARÈMES À PALIERS (22/09/2026, demande de Martin, à la présentation de la brochure) : la vente
 * d'immeubles et la sortie anticipée affichent leurs paliers, taux et condition, au lieu d'une
 * fourchette. Taux et bornes viennent de facts.ts ; seule la tournure est écrite ici. ET AUCUNE
 * COMPARAISON sur ces lignes (« pour les frais où il y a des fourchettes ne mets pas de
 * comparaison ») : la sortie anticipée se comparait sur le taux au-delà de huit ans (0 %) sous une
 * hypothèse de détention jamais affichée, et pouvait être marquée « taux le plus bas » ; elle ne
 * l'est plus.
 */
const zeroAfter = fees.withdrawal.zeroAfterYears;
/**
 * « Si sortie > 8 ans » … « Si sortie < 4 ans », d'après la borne de chaque palier (`until`), du
 * taux le plus bas au plus haut comme la vente d'immeubles (22/09/2026, « inverse l'ordre »).
 */
const withdrawalTiers = fees.withdrawal.steps
  .map((step) => ({
    rate: nb(step.rate),
    when:
      step.until === null
        ? `Si sortie >\u00A0${zeroAfter}\u00A0ans`
        : `Si sortie <\u00A0${step.until}\u00A0ans`,
  }))
  .reverse();
/** « Si plus-value < 7 % », « Si 7 % < plus-value < 13 % », « Si plus-value > 13 % » (`from`). */
const disposalTiers = fees.disposal.tiers.map((tier, i, tiers) => {
  const next = tiers[i + 1];
  const when =
    i === 0 && next
      ? `Si plus-value <\u00A0${next.from}\u00A0%`
      : next
        ? `Si ${tier.from}\u00A0% <\u00A0plus-value <\u00A0${next.from}\u00A0%`
        : `Si plus-value >\u00A0${tier.from}\u00A0%`;
  return { rate: nb(tier.rate), when };
});

/*
 * Source commune des dix-neuf SCPI (texte de Martin, 22/09/2026 ; ex-« étude comparative réalisée
 * par CORUM au 15 septembre 2026… »). Unique et globale, sans référence documentaire ni date
 * d'arrêté par SCPI : voir l'en-tête. La base HT est dite sous le tableau (`htNote`).
 */
const SOURCE_EQUIPE =
  'sur la base des notes d’information et documents de souscription publics des SCPI mentionnées.';

const ROWS: ComparatorRow[] = [
    /*
     * Textes « i » (16/09/2026, fournis par l'équipe) : ce que le frais RECOUVRE et QUI le paie, là
     * où `basis` ne dit que l'assiette. Repliés derrière un bouton, absent des lignes sans texte.
     */
    {
      key: 'subscription' as const,
      info: 'L’épargnant paie ces frais au moment de son investissement. Ils rémunèrent la société de gestion et les intermédiaires avant que l’épargnant perçoive tout revenu. Ils réduisent d’autant le montant réellement investi.',
      /* Libellés à la brochure depuis le 22/09/2026 (demande de Martin) : « Frais d'entrée », « Frais
         sur achat d'immeubles », « Frais sur vente d'immeubles », « Frais de sortie anticipée ». */
      label: 'Frais d’entrée',
      basis: 'en % du montant investi',
      rstart: fees.subscription.label,
    },
    {
      key: 'acquisition' as const,
      info: 'L’épargnant paie ces frais à chaque fois que la SCPI achète un immeuble. Ils rémunèrent la recherche et l’acquisition du bien. Ces frais créent un écart entre le montant souscrit et le montant réellement investi par la SCPI. Ils sont prélevés même si la SCPI ne verse aucun revenu à l’épargnant.',
      label: 'Frais sur achat d’immeubles',
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
      label: 'Frais sur vente d’immeubles',
      basis: 'en % du prix de vente',
      rstartTiers: disposalTiers,
    },
    {
      key: 'withdrawal' as const,
      info: 'L’épargnant paie des frais de retrait anticipé s’il revend ses parts avant une certaine durée de détention (variable selon la SCPI). Ces frais sont prélevés même lorsque la SCPI ne verse aucun revenu à l’épargnant.',
      label: 'Frais de sortie anticipée',
      basis: 'en % de la valeur de retrait',
      rstartTiers: withdrawalTiers,
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
   * Sous le tableau (22/09/2026, texte de Martin) : la base HT de tous les taux. R Start étant
   * exonérée de TVA, ses montants HT et TTC sont égaux.
   */
  htNote:
    'Les frais mentionnés sont exprimés hors taxes (HT). R Start étant exonérée de TVA, le montant hors taxes est égal au montant toutes taxes comprises (TTC).',
  /**
   * Dans le bandeau « Points essentiels », après l'avertissement (22/09/2026, texte de Martin) : le
   * mécanisme de réserve en cas de moins-value, qui conditionne la commission sur les ventes (note
   * d'information, ch. III § 4).
   */
  lossNote: {
    title: 'En cas de moins-value',
    text: 'Si une vente génère une moins-value, celle-ci est enregistrée dans une réserve dédiée. CORUM ne peut percevoir aucune commission sur les ventes tant que cette réserve n’est pas intégralement compensée par des plus-values futures. CORUM ne se rémunère sur les cessions que lorsque le bilan global des ventes est positif. Retrouvez le détail du mécanisme de compensation au chapitre III, section 4 de la note d’information de R Start.',
  },
  /**
   * Bandeau sous le comparateur (22/09/2026, demande de Martin) : l'avertissement sur la commission
   * d'arbitrage, reproduit à l'identique depuis legal.ts par le composant, sous ce titre.
   */
  essentialsTitle: 'Points essentiels à connaître :',
  /**
   * Sources, en un paragraphe sous la mention HT (22/09/2026, texte de Martin) : R Start, puis les
   * autres SCPI, dont la source est la même pour les dix-neuf (SOURCE_EQUIPE, aussi portée par
   * chaque SCPI pour dire qu'elle a été documentée). Sans la brochure partenaires.
   */
  /* Datée (24/09/2026, demande de Martin) : la date du relevé des taux des autres SCPI, à mettre à
     jour à chaque vérification du tableau. Le gabarit ajoute les deux-points. */
  sourceLabel: 'Sources de données au 24 septembre 2026',
  sourceText: `${product.name}, CORUM Asset Management : document d’informations clés du ${product.dicDate.label} et note d’information visée par l’AMF. Pour les autres, l’analyse est ${SOURCE_EQUIPE}`,
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
        broker: 'en l’absence d’intermédiaire',
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
        works: '6 %',
        disposal: '6 %',
        withdrawal: '0 %',
      },
      source: SOURCE_EQUIPE,
    },
    {
      name: 'Osmo Énergie',
      manager: 'Mata Capital IM',
      values: {
        subscription: '12 %',
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
        acquisition: '0 %',
        broker: '0 %',
        management: '11,45 %',
        works: '3 %',
        disposal: '2,50 %',
        withdrawal: '0 %',
      },
      details: {
        acquisition:
          '0 % sur les acquisitions financées par la collecte, 1,25 % en cas de réemploi du produit de cessions',
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
