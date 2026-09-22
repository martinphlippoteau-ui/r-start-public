/*
 * Imports RELATIFS, contrairement au reste du dossier : scripts/check-compliance.mjs charge ce fichier
 * avec node, qui ne connaît pas l'alias « @/ » du projet. facts.ts et legal.ts sont dans le même cas.
 */
import { fees, product } from './facts.ts';
import { innovationNotRevolution } from './legal.ts';

/**
 * Comparateur de frais, page /frais (11/09/2026, demande de l'équipe, inspiré des comparateurs
 * e-commerce) : R Start à gauche, une SCPI choisie dans une liste à droite, sept lignes de frais.
 *
 * ÉTAT AU 15/09/2026 : les dix-neuf SCPI ont leurs sept taux, relevé de l'équipe, tous en HT. Les
 * cases vides ont disparu, le comparateur ne montre plus les zéros de R Start face à du blanc.
 *
 * IL MANQUE ENCORE LA TROISIÈME CONDITION POUR PUBLIER. Il en fallait trois, SCPI par SCPI :
 *  1. les sept taux : obtenus ;
 *  2. la même base de calcul pour tous : obtenue, tout est HT ;
 *  3. le document et la date d'arrêté d'où vient chaque taux : MANQUANTS. Le relevé est global, sans
 *     référence par société de gestion, alors que le tableau en nomme dix-neuf. Un taux change, et une
 *     comparaison qu'on ne peut pas remonter à sa source n'est pas vérifiable.
 * Voir SOURCE_EQUIPE plus bas.
 *
 * Les valeurs de R Start ne sont JAMAIS saisies ici : elles viennent de facts.fees, comme partout.
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
 * Une ligne du comparateur. DÉCLARÉE, et non déduite du tableau : le 16/09/2026, l'équipe a retiré les
 * deux dernières précisions affichées sous les taux de R Start, plus aucune ligne ne portait
 * `rstartDetail`, et TypeScript a conclu que la propriété n'existait pas — le composant qui la lit ne
 * compilait plus. Une ligne peut ne pas en avoir ; le type doit le dire, pas les données du jour.
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
   * Précision sous le taux de R Start. Absente : la case n'affiche que le taux. Une LISTE depuis le
   * 16/09/2026 : les deux barèmes à paliers (cessions, retrait) se lisent une ligne par palier, taux
   * en tête, et non en une phrase où les taux se noient.
   */
  rstartDetail?: string | readonly string[];
}

export type ComparatorRowKey =
  'subscription' | 'acquisition' | 'broker' | 'management' | 'works' | 'disposal' | 'withdrawal';

/**
 * Hypothèse de lecture du tableau (12/09/2026, demande de l'équipe) : le souscripteur garde ses
 * parts au moins huit ans, la durée après laquelle R Start ne prélève plus de commission de
 * retrait. Elle devait être dite en clair (`holdingNotice`), parce qu'elle change la ligne
 * « retrait » de toutes les SCPI ; ce texte n'a JAMAIS été affiché. Le tableau l'applique
 * pourtant : le retrait de R Start s'y compare sur `rstartCompare` (0 %) et peut être marqué « taux
 * le plus bas de la ligne ».
 */
const HOLDING_YEARS = fees.withdrawal.zeroAfterYears;

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
 * BARÈME DU RETRAIT, tel que l'équipe l'a formulé le 16/09/2026 pour le comparateur, un palier par
 * ligne. LES TAUX VIENNENT DE facts.fees.withdrawal.steps, jamais d'ici ; seules les conditions sont
 * écrites, dans l'ordre des paliers. Le garde-fou vérifie que le barème compte bien autant de
 * conditions que de paliers : un palier ajouté dans facts.ts sans sa condition arrêterait la
 * compilation au lieu de laisser un taux sans phrase.
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
 * SOURCE COMMUNE des taux des autres SCPI, relevé transmis par l'équipe le 15/09/2026. Il remplace les
 * relevés faits un à un entre le 11 et le 12/09/2026, qui mêlaient pages marketing et documents
 * réglementaires, et exprimaient les taux tantôt HT tantôt TTC.
 *
 * TOUT EST EN HT dans ce relevé, ce qui est enfin la même base pour les dix-neuf SCPI et pour R Start.
 * C'est le principal gain : jusqu'ici la comparaison portait sur des bases différentes selon la ligne.
 *
 * CE QUI MANQUE ENCORE, et qui doit être obtenu avant publication : pour chaque SCPI, le DOCUMENT et
 * la DATE D'ARRÊTÉ d'où vient le taux (document d'informations clés, note d'information, et leur page).
 * Un comparatif qui nomme dix-neuf sociétés de gestion doit pouvoir dire d'où vient chaque chiffre :
 * c'est ce que dit déjà le bloc « Sources des données » sous le tableau, et il ne peut pas se contenter
 * d'un renvoi global. Tant que ces références ne sont pas là, la ligne reste vraie mais invérifiable.
 */
/*
 * SOURCE NOMMÉE LE 16/09/2026 : « étude comparative réalisée par CORUM le 15 septembre 2026 ».
 * Elle disait jusque-là « relevé comparatif transmis par l'équipe », sans auteur ni nature, et ajoutait
 * que le document et la date d'arrêté de chaque société de gestion restaient à obtenir.
 *
 * CE QUI EST RÉGLÉ : le tableau peut désormais nommer d'où viennent ses chiffres, ce qu'un comparatif
 * qui cite dix-neuf sociétés de gestion doit pouvoir faire.
 * CE QUI NE L'EST PAS, et qu'il faut garder en tête : l'étude est une source UNIQUE et globale. Elle ne
 * donne toujours pas, SCPI par SCPI, le document réglementaire et sa date d'arrêté. Un lecteur ne peut
 * donc pas remonter un taux jusqu'à la note d'information ou au DIC dont il sort. La mention reste donc
 * honnête sur ce point plutôt que de laisser croire à une référence par SCPI.
 */
/* Reformulée le 16/09/2026, texte de l'équipe. L'ancienne version disait que la référence documentaire
   de chaque société de gestion n'était pas publiée ; celle-ci nomme la source, les notes d'information
   publiées par chaque société de gestion concernée. */
const SOURCE_EQUIPE =
  'étude comparative réalisée par CORUM au 15 septembre 2026, à partir des notes d’information publiées par chaque société de gestion concernée. Taux exprimés hors taxes.';

const ROWS: ComparatorRow[] = [
    /*
     * EXPLICATIONS « i » (16/09/2026, textes fournis par l'équipe, un par ligne). Elles disent ce que
     * le frais RECOUVRE et QUI le paie, là où `basis` ne dit que son assiette de calcul. Repliées
     * derrière un bouton : le tableau se lit d'abord en chiffres, l'explication vient si on la demande.
     * Le bouton n'apparaît que sur les lignes qui portent un texte.
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
    /*
     * TRAVAUX AVANT GESTION depuis le 15/09/2026 (demande de l'équipe). Les valeurs suivent seules :
     * chaque SCPI donne les siennes dans un objet indexé par `key`, l'ordre des colonnes n'a donc
     * qu'une source, cette liste.
     */
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
      /*
       * LE BARÈME SOUS LA FOURCHETTE, un palier par ligne (16/09/2026, texte de l'équipe : « 0 % si la
       * plus-value est inférieure à 7 % », « 6 % si la plus-value est comprise entre 7 % et 13 % »,
       * « 12 % si la plus-value est supérieure à 13 % »). Il avait été retiré le matin même (« on
       * changera et on ajoutera plus tard ») ; il revient dans ce format, et non plus en une phrase.
       * Taux ET conditions viennent de facts.fees.disposal.tiers, dont les libellés sont ceux fournis.
       */
      rstartDetail: fees.disposal.tiers.map((t) => `${t.rate} ${t.condition}`),
    },
    {
      key: 'withdrawal' as const,
      info: 'L’épargnant paie des frais de retrait anticipé s’il revend ses parts avant une certaine durée de détention (variable selon la SCPI). Ces frais sont prélevés même lorsque la SCPI ne verse aucun revenu à l’épargnant.',
      label: 'Frais de retrait anticipé',
      basis: 'en % de la valeur de retrait',
      /*
       * FOURCHETTE DEPUIS LE 15/09/2026 (« mets au format de 0 % à 12 % plutôt »). La case affichait le
       * seul dernier palier, « 0 % », et renvoyait le barème dégressif au détail en dessous : on lisait
       * donc « 0 % » là où le taux vaut 10 % pour qui sort avant quatre ans. La fourchette dit les deux
       * bornes, comme la ligne des cessions d'immeubles juste au-dessus.
       */
      rstart: range(fees.withdrawal.steps.map((s) => s.rate)),
      /*
       * Ce qui est COMPARÉ reste le taux au-delà de la durée retenue, soit 0 %, et non la
       * fourchette : c'est l'hypothèse de lecture du tableau (une détention d'au moins huit ans).
       * `holdingNotice` devait la dire en clair ; il n'est pas affiché, et la case peut donc être
       * marquée « taux le plus bas » sur ce 0 % sans que l'écran dise sous quelle hypothèse. Sans
       * ce champ, la case ne serait plus comparable du tout, un intervalle ne se départageant pas
       * d'un taux unique.
       */
      rstartCompare: withdrawalAfterHolding,
      /*
       * LE BARÈME SOUS LA FOURCHETTE, un palier par ligne (16/09/2026, texte de l'équipe). Il avait été
       * retiré le matin même, en une phrase (« au-delà de 8 ans de détention ; avant, le barème est
       * dégressif : 10 % < 4 ans, 7 % 5e-6e année… ») ; il revient ligne à ligne, taux en tête.
       * La comparaison, elle, se fait toujours sur le taux au-delà de huit ans (`rstartCompare`),
       * hypothèse que `holdingNotice` devait dire et qui n'est pas affichée : le barème la rend
       * lisible, il ne la change pas.
       */
      rstartDetail: withdrawalSchedule,
    },
];

export const comparator = {
  /*
   * TITRE ET ACCROCHE SUPPRIMÉS DE L'ÉCRAN le 16/09/2026, demande de l'équipe. Ils disaient « R Start :
   * la seule SCPI qui ne prend des frais que si vous gagnez. » et « Comparez vous-même ! », fournis par
   * l'équipe le 14/09. L'accroche disparaît pour de bon ; le titre, lui, NE POUVAIT PAS ÊTRE SIMPLEMENT
   * EFFACÉ : il nomme la section (`labelledBy`) et sert de légende au tableau (`<caption>`), un tableau
   * sans nom n'étant pas annoncé aux lecteurs d'écran.
   *
   * Il est donc REMPLACÉ par un intitulé descriptif, rendu en `visually-hidden` comme il l'était déjà
   * entre le 12 et le 14/09. Descriptif et non masqué à l'identique : garder la phrase d'origine hors
   * écran aurait laissé l'allégation d'exclusivité dans la page, lue par les lecteurs d'écran et
   * comptée par scripts/check-compliance.mjs. Elle est retirée, pas cachée.
   */
  title: 'Comparaison des frais de R Start avec une autre SCPI',
  /* Titre VISIBLE du comparateur de l'accueil (16/09/2026, texte de l'équipe). Sur /frais il n'est pas
     rendu : l'en-tête de la page dit déjà « Comparateur de frais », et `title` y reste hors écran pour
     nommer la section et le tableau. */
  homeHeading: 'Un modèle de frais inédit. Comparez par vous-même !',
  /** Colonne de gauche, toujours R Start. */
  leftLabel: product.name,
  /* Intitulé VISIBLE au-dessus de la liste déroulante (12/09/2026, demande de l'équipe) : il dit ce
     que la colonne de droite oppose à R Start, là où « SCPI à comparer » ne disait pas laquelle.
     RACCOURCI le 14/09/2026 à la demande de l'équipe : la mention « dites “sans frais” » tombe. Ce
     que ces SCPI ont en commun (pas de commission de souscription, mais des frais d'acquisition)
     devait rester dit par la première phrase du périmètre (`perimeter`) ; celui-ci a quitté l'écran
     le soir même, et plus rien ne le dit autour du tableau. */
  selectLabel: 'Autres SCPI',
  /** Affiché tant que la SCPI n'a pas été documentée du tout (aucune source). */
  pendingLabel: 'À compléter',
  /**
   * Affiché quand la source A ÉTÉ consultée mais ne publie pas ce frais. Ce n'est pas la même chose
   * qu'une donnée manquante, et ce n'est surtout pas 0 % : une absence de mention ne vaut pas gratuité.
   */
  notPublishedLabel: 'Non publié',
  /** En-tête de la première colonne, lu par les lecteurs d'écran (masqué à l'œil). Il était écrit en
      dur dans FeeComparator.astro, seul texte du tableau à ne pas venir d'ici. */
  feeColumnLabel: 'Frais',
  /**
   * Le taux le plus bas d'une ligne est mis en avant par la COULEUR et la GRAISSE, l'autre est atténué.
   * Jamais par la TAILLE : un frais affiché plus petit que ses voisins est précisément ce que l'AMF a
   * reproché à la brochure, et tests/conformite.spec.ts le vérifie.
   * Ce libellé n'est pas affiché : il est lu par les lecteurs d'écran, pour qui une différence de couleur
   * ne dit rien. Il n'apparaît que si LES DEUX cases portent un pourcentage unique et comparable.
   */
  bestLabel: 'taux le plus bas de la ligne',
  /* Nom du bouton « i » pour les lecteurs d'écran, complété par le libellé de la ligne. */
  infoLabel: 'Expliquer',
  /**
   * Avertissement prévu au-dessus du tableau quand des taux manquent pour une SCPI choisie sans
   * source. EN VEILLE : il passe par RiskNote, qui ne rend plus rien depuis le 14/09/2026, et les
   * dix-neuf SCPI ont une source ; rien n'est affiché.
   */
  pendingNotice:
    'Les taux de cette SCPI ne sont pas encore relevés. Tant qu’ils manquent, ce tableau ne compare rien : il ne montre que les frais de R Start. Aucune conclusion ne peut en être tirée.',
  /**
   * Hypothèse de lecture, prévue au-dessus du tableau : elle change la ligne « retrait ».
   * EN VEILLE, et JAMAIS affichée : aucun gabarit ne l'a rendue. Le tableau applique pourtant cette
   * hypothèse (voir HOLDING_YEARS et `rstartCompare`).
   */
  holdingNotice: `La ligne « frais de retrait anticipé » suppose une détention d’au moins ${HOLDING_YEARS} ans, la durée de placement recommandée de ${product.name}. Sortir plus tôt coûte davantage : le barème complet de chaque SCPI figure sous son taux.`,
  /**
   * Rappel sous le tableau : une case vide n'est pas un zéro. EN VEILLE : retiré de l'écran le
   * 14/09/2026 (texte de la page fourni par l'équipe).
   */
  notPublishedNotice:
    'Une ligne « non publié » signifie que le document consulté ne mentionne pas ce frais. Cela ne veut pas dire qu’il n’est pas prélevé.',
  /**
   * Sources affichées sous le tableau, une par colonne : celle de R Start, et celle de la SCPI
   * choisie (SOURCE_EQUIPE pour les dix-neuf depuis le 15/09/2026). `sourceOthers` n'est plus qu'un
   * texte de repli : c'est lui que porte le HTML avant le script, et il reste seul affiché sans
   * script.
   */
  sourceLabel: 'Sources des données',
  /** Qui publie les chiffres de la colonne de gauche, et dans quels documents. */
  sourceRStartLabel: 'CORUM Asset Management',
  sourceRStart: `document d’informations clés du ${product.dicDate.label}, note d’information visée par l’AMF et brochure partenaires 2026.`,
  sourceOthers:
    'Frais des autres SCPI : à relever dans le document d’informations clés et la note d’information de chacune, avec leur date d’arrêté. Un taux change : la date fait foi.',
  /**
   * Périmètre du comparatif : il dit ce qui est comparé et ce qui ne l'est pas. Ce tableau compare
   * des TAUX AFFICHÉS, SCPI par SCPI, ce n'est ni la moyenne de marché de la brochure, ni une
   * comparaison de résultats. EN VEILLE : retiré de sous le tableau le 14/09/2026, alors que le
   * tableau nomme ses SCPI ; l'exigence qui l'imposait est commentée dans
   * scripts/check-compliance.mjs.
   */
  /*
   * La PREMIÈRE phrase qualifie « sans frais », et ce n'est pas une précaution de style : le contrôle de
   * conformité interdit la formule absolue, qui laisserait croire qu'aucun frais n'est prélevé. Ces SCPI
   * ne prennent pas de commission de souscription, elles se rémunèrent à l'achat des immeubles, et le
   * tableau juste au-dessus le montre ligne par ligne.
   */
  perimeter:
    'Une SCPI dite « sans frais » ne prélève pas de frais de souscription : elle se rémunère autrement, par des frais d’acquisition sur les immeubles qu’elle achète, que ce tableau détaille ligne par ligne. Ce tableau compare les taux de frais affichés dans les documents de chaque SCPI, lus sous une même hypothèse de durée de détention. Quand les deux taux d’une ligne sont directement comparables, le plus bas est mis en avant : cette mise en avant ne porte que sur cette ligne et ne dit rien du coût total, qui dépend de ce que la SCPI encaisse et de votre durée de détention. Il ne compare pas les résultats. Il ne porte pas sur l’ensemble du marché : seules les SCPI de la liste y figurent. R Start n’a pas d’historique et aucune donnée de performance n’est communiquée sur ce site.',
  /**
   * Base de comparaison HT / TTC. Sans elle, on opposerait un taux TTC à un taux HT sans le dire,
   * ce que l'AMF a déjà reproché à la brochure. R Start étant exonérée de TVA, ses deux montants
   * sont égaux.
   * EN VEILLE : retirée de l'écran le 14/09/2026. Et PÉRIMÉE : écrite pour des relevés en bases
   * mêlées, elle dit les taux « reproduits tels que publiés » et ceux de R Start TTC pour la
   * cession et le retrait, quand le tableau n'affiche plus que des taux HT (SOURCE_EQUIPE). À
   * réécrire avant tout retour.
   */
  vatNotice:
    'Chaque taux est reproduit tel que la société de gestion le publie. Ceux de R Start sont hors taxes, sauf la commission de cession et la commission de retrait, exprimées toutes taxes comprises ; R Start étant exonérée de TVA, ses montants hors taxes et toutes taxes comprises sont égaux. Vérifiez la base retenue par chaque SCPI avant toute conclusion.',
  /**
   * Encadré de la brochure (p.4), fait pour accompagner tout comparatif de frais. EN VEILLE :
   * retiré de sous le tableau le 14/09/2026, le comparateur s'affiche sans lui (exigence commentée
   * dans scripts/check-compliance.mjs).
   */
  innovationBox: innovationNotRevolution,

  /** Les sept lignes, dans l'ordre du tableau fourni par l'équipe. */
  rows: ROWS,

  /**
   * Les SCPI proposées au choix, DIX-NEUF depuis le 15/09/2026. Iroko Zen en tête : c'est celle que
   * l'équipe veut voir d'abord. Immo France Territoires et Atream Atwin, jusque-là écartées faute de
   * documents publiés, entrent dans la liste avec le relevé de l'équipe.
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

/*
 * `comparatorIsIncomplete` a été SUPPRIMÉ le 14/09/2026 : personne ne le lisait. Il disait « vrai tant
 * qu'une SCPI proposée n'a pas été documentée ». Le même calcul est refait à la main dans
 * scripts/check-compliance.mjs, qui est le seul endroit où il servait vraiment.
 */

export default comparator;
