import type { LegalNote } from '../types';
import { fees, income, marketComparison, product, share, subscription } from './facts.ts';
import { shortRiskLine } from './legal.ts';

/**
 * Page /outils (12/09/2026) : les outils chiffrés du site.
 *
 * RÈGLE FONDATRICE. R Start n'a pas d'historique et le site ne reprend aucun scénario de performance :
 * aucun outil d'ici ne projette donc un rendement, une valeur de part ou un gain. Tous ne calculent que
 * du CONTRACTUEL, c'est-à-dire ce qui est écrit dans le bulletin, la note d'information et le document
 * d'informations clés : des taux de frais, des durées, des dates, un prix de part.
 * Quand un calcul a besoin d'un montant qui n'est pas connu (des loyers, une plus-value), c'est le
 * VISITEUR qui pose l'hypothèse et l'outil le dit. Une hypothèse saisie par le visiteur n'est pas une
 * prévision de la société de gestion, et chaque résultat le rappelle.
 *
 * Deux idées ont été écartées volontairement : un simulateur fiscal, qui demande une validation fiscale
 * et non marketing, et un questionnaire d'adéquation, qui empiéterait sur le test réglementaire réalisé
 * dans le tunnel de souscription.
 *
 * Aucun chiffre en dur : tout vient de facts.ts.
 */

const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1');

export const notes: LegalNote[] = [
  {
    id: 'outils-hypotheses',
    text: nb(
      `Les montants que vous saisissez sont des hypothèses de travail, pas des prévisions. R Start a ouvert ses souscriptions le ${product.openingDate.label} et n’a aucun historique : ni la société de gestion ni ce site n’annoncent de loyer, de plus-value ou de valeur de part future. Les outils de cette page appliquent seulement les taux prévus au contrat aux montants que vous choisissez. Sources : bulletin de souscription et conditions générales de vente de mai 2026, note d’information visée par l’AMF, document d’informations clés du ${product.dicDate.label}.`
    ),
  },
  {
    id: 'outils-frais',
    text: nb(
      `Taux appliqués par le simulateur : ${fees.management.label} de frais de gestion, ${fees.management.base} ; commission sur les cessions d’immeubles de ${fees.disposal.label} selon la plus-value réalisée, ${fees.disposal.base} ; commission de retrait dégressive avant ${fees.withdrawal.zeroAfterYears} ans de détention. Aucune commission de souscription, aucun frais d’acquisition, d’intermédiation ou de travaux. ${fees.vatNote}`
    ),
  },
  {
    id: 'outils-marche',
    text: nb(
      `Les taux proposés par défaut pour la SCPI de comparaison sont des moyennes de marché, pas les frais d’une SCPI précise. Le prélèvement à l’entrée est renseigné avec la moyenne des frais d’acquisition, ${marketComparison.averages.acquisition.label} : les SCPI du panel ne prennent pas de commission de souscription (${marketComparison.averages.subscription.label}), elles se rémunèrent à l’achat des immeubles. Les frais de gestion sont renseignés avec la moyenne du panel, ${marketComparison.averages.management.label}. ${marketComparison.perimeterLead} : ${marketComparison.panel.join(', ')}, ${marketComparison.perimeterTail} Source : ${marketComparison.source} Vous pouvez remplacer ces valeurs par celles de la SCPI de votre choix : le calcul suit ce que vous saisissez.`
    ),
  },
  {
    id: 'outils-jouissance',
    text: nb(
      `Règle de jouissance : « ${income.enjoymentDate} », soit un délai de ${income.enjoymentDelayLabel}. La date calculée dépend de la date à laquelle votre règlement est encaissé, pas de celle où vous signez. Aucun dividende n’est versé pendant ce délai, et aucun montant de dividende n’est annoncé à l’avance. Source : bulletin de souscription R Start, conditions générales de vente, mai 2026.`
    ),
  },
  {
    id: 'outils-parts',
    text: nb(
      `Le nombre de parts est calculé au prix de souscription en vigueur, ${share.priceLabel}, et les parts peuvent être fractionnées en ${share.fractions}. Ce prix peut être révisé par la société de gestion : le nombre de parts réellement acquises dépendra du prix applicable à la date de chaque versement. Les versements programmés supposent de détenir au préalable au moins une part entière. Source : bulletin de souscription et adhésion au plan d’épargne immobilier, 2026.`
    ),
  },
];

/**
 * Les trois niveaux d'expertise, communs aux quatre outils. Ils ne changent RIEN au calcul : l'outil
 * applique toujours les mêmes taux aux mêmes champs. Ce qui change, c'est le nombre de paramètres
 * exposés et le détail rendu. Un champ masqué garde sa valeur par défaut, le résultat reste juste.
 *
 * Le choix se fait par des boutons radio et la bascule est en CSS pure (global.css) : sans JavaScript,
 * les trois niveaux restent accessibles, et sans `:has()` tout s'affiche, ce qui ne cache rien.
 */
export const toolLevels = [
  {
    id: 'debutant',
    rank: 1,
    label: 'Débutant',
    hint: 'L’essentiel, deux champs et une réponse.',
  },
  {
    id: 'intermediaire',
    rank: 2,
    label: 'Intermédiaire',
    hint: 'Vos hypothèses de durée et de revente.',
  },
  {
    id: 'expert',
    rank: 3,
    label: 'Expert',
    hint: 'Tous les paramètres et le détail du calcul.',
  },
] as const;

export type ToolLevelId = (typeof toolLevels)[number]['id'];

export const levelPicker = {
  legend: 'Niveau de détail',
  help: 'Changez de niveau à tout moment : les champs masqués gardent leur valeur par défaut et le calcul reste le même.',
};

export const toolsPage = {
  seo: {
    title: `Outils et simulateurs de frais | ${product.name}`,
    description:
      'Calculez ce que R Start prélève selon vos propres hypothèses, la date de vos premiers revenus potentiels, le coût d’une sortie anticipée et le nombre de parts d’un versement programmé.',
  },
  hero: {
    eyebrow: `Outils · SCPI ${product.name}`,
    title: 'Calculez avant de décider',
    riskLine: shortRiskLine,
  },

  /** Bandeau en tête de page : il pose la règle une fois pour les quatre outils. */
  frame: {
    title: 'Ce que ces outils font, et ce qu’ils ne font pas',
    body: `Ils appliquent les taux prévus au contrat aux montants que vous saisissez. Ils ne prévoient rien : R Start n’a pas d’historique, et aucun loyer, aucune plus-value, aucune valeur de part future n’est annoncée ici. Les montants que vous entrez sont vos hypothèses de travail.`,
    risk: nb(
      `Un résultat affiché ici n’est ni un engagement, ni une simulation de performance. Le capital n’est pas garanti : vous pouvez perdre tout ou partie de la somme investie. Les revenus ne sont pas garantis. La revente de vos parts n’est pas garantie. Les frais s’appliquent quoi qu’il arrive, y compris quand la valeur de vos parts baisse.`
    ),
    noteId: 'outils-hypotheses',
  },

  /** 1. Simulateur de frais et point de bascule. */
  feeSimulator: {
    pageKey: 'toolFees' as const,
    card: {
      eyebrow: 'Frais',
      question: 'Combien R Start me prélèvera-t-il, et à partir de quand est-ce plus cher ?',
      teaser:
        'R Start ne prend rien à l’entrée et se rémunère sur les loyers. Une SCPI à frais d’entrée fait l’inverse. Posez vos hypothèses, l’outil chiffre les deux modèles et donne le niveau de loyers où ils se croisent.',
    },
    levelNotes: {
      debutant: 'Un montant, une hypothèse de loyers, et ce que chaque modèle prélève.',
      intermediaire:
        'Ajoute la durée de détention, la plus-value à la revente et le point de bascule.',
      expert:
        'Ajoute les taux de la SCPI comparée et le détail poste par poste de ce que prélève R Start.',
    },
    title: 'Ce que R Start prélève, et à partir de quand c’est plus cher',
    intro:
      'R Start ne prend rien à l’entrée et se rémunère sur les loyers. Une SCPI à frais d’entrée prend l’inverse : beaucoup au départ, moins ensuite. Posez vos hypothèses, l’outil calcule les deux et vous dit à partir de quel niveau de loyers le modèle R Start devient le plus coûteux.',
    fields: {
      amount: 'Montant investi',
      rent: 'Loyers qui vous sont distribués, au total sur la période',
      gain: 'Plus-value à la revente, en % du prix de vente',
      years: 'Durée de détention',
      rivalEntry: 'Frais prélevés à l’entrée par la SCPI comparée',
      rivalManagement: 'Frais de gestion de la SCPI comparée',
    },
    hints: {
      rent: 'Votre hypothèse. Rien n’oblige une SCPI à distribuer quoi que ce soit.',
      gain: 'Votre hypothèse. Une revente peut aussi se faire à perte.',
      rivalEntry:
        'Moyenne de marché par défaut, modifiable. Les SCPI du panel ne prennent pas de commission de souscription : leur prélèvement à l’entrée est un frais d’acquisition.',
    },
    results: {
      rstart: 'Ce que prélève R Start',
      rival: 'Ce que prélève la SCPI comparée',
      detailTitle: 'Détail de ce que prélève R Start',
      detailManagement: 'Frais de gestion sur les loyers',
      detailDisposal: 'Commission sur la cession des immeubles',
      detailWithdrawal: 'Commission de retrait anticipé',
      detailNone:
        'Aucune commission de souscription, d’acquisition, d’intermédiation ni de travaux.',
      crossover: 'Point de bascule',
      crossoverNever:
        'Avec ces taux, le modèle R Start reste le moins coûteux quel que soit le montant des loyers : ses frais de gestion ne dépassent pas ceux de la SCPI comparée.',
      crossoverAlways:
        'Avec ces taux, la SCPI comparée reste la moins coûteuse dès le premier euro de loyer.',
      crossoverTemplate:
        'Au-delà de {seuil} de loyers distribués sur la période, R Start vous coûte plus cher que la SCPI comparée. En dessous, elle vous coûte moins cher.',
    },
    risk: nb(
      `Ce calcul ne compare que des frais. Il ne dit rien de ce que chaque SCPI rapportera, ni de la valeur de vos parts. Un modèle de frais plus favorable n’a jamais empêché une perte en capital. Chez R Start, les frais de gestion sont prélevés sur les loyers encaissés y compris quand la valeur de vos parts baisse, et votre coût total n’est pas connu à la souscription.`
    ),
    noteId: 'outils-frais',
    marketNoteId: 'outils-marche',
  },

  /** 2. Calendrier de jouissance. */
  enjoyment: {
    pageKey: 'toolEnjoyment' as const,
    card: {
      eyebrow: 'Calendrier',
      question: 'À partir de quand mes parts ouvrent-elles droit aux versements ?',
      teaser: `Vos parts n’ouvrent droit aux versements qu’après ${income.enjoymentDelayLabel}. Le compte à rebours part de l’encaissement de votre règlement, pas de votre signature. Donnez la date, l’outil donne le jour exact.`,
    },
    levelNotes: {
      debutant: 'Une date d’encaissement, une date d’entrée en jouissance.',
      intermediaire: 'Ajoute l’attente en jours et le rythme des versements.',
      expert: 'Ajoute la règle appliquée et ce que change le jour du mois où vous êtes encaissé.',
    },
    title: 'Quand vos parts commencent à produire des revenus',
    intro: `Vos parts n’ouvrent droit aux versements qu’après un délai de ${income.enjoymentDelayLabel}. Indiquez la date à laquelle votre règlement sera encaissé.`,
    fields: { date: 'Date d’encaissement de votre règlement' },
    results: {
      date: 'Vos parts entrent en jouissance le',
      wait: 'Soit une attente de',
      frequency: 'Rythme des versements',
      frequencyValue: income.frequencyLabel,
      ruleTitle: 'La règle appliquée',
      rule: income.enjoymentDate,
      sameMonthTitle: 'Le jour du mois ne change rien',
      sameMonthTemplate:
        'Tout règlement encaissé entre le {debut} et le {fin} donne la même entrée en jouissance, le {jouissance}. Encaissé un jour plus tard, au {suivant}, elle recule d’un mois entier.',
    },
    risk: nb(
      `Entrer en jouissance ne veut pas dire percevoir un montant connu. Les dividendes potentiels dépendent des loyers encaissés et de la décision de la société de gestion. Aucun montant n’est annoncé à l’avance, et un mois peut se solder par aucune distribution.`
    ),
    noteId: 'outils-jouissance',
  },

  /** 3. Coût d'une sortie anticipée. */
  exit: {
    pageKey: 'toolExit' as const,
    card: {
      eyebrow: 'Sortie',
      question: 'Combien me coûte une sortie avant l’échéance ?',
      teaser: `La commission de retrait décroît avec la durée de détention et disparaît après ${fees.withdrawal.zeroAfterYears} ans. Indiquez ce que vous voulez retirer et depuis quand vous détenez vos parts.`,
    },
    levelNotes: {
      debutant: 'Un montant, une durée, et ce qui vous reste.',
      intermediaire: 'Ajoute le barème complet, palier courant en évidence.',
      expert: 'Ajoute ce que vous gagneriez à attendre le palier suivant.',
    },
    title: 'Ce que coûte une sortie avant l’échéance',
    intro: `La commission de retrait diminue avec la durée de détention et disparaît après ${fees.withdrawal.zeroAfterYears} ans. Indiquez le montant que vous souhaitez retirer et depuis combien de temps vous détenez vos parts.`,
    fields: { amount: 'Montant du retrait, à la valeur de retrait', years: 'Durée de détention' },
    results: {
      rate: 'Commission appliquée',
      cost: 'Montant prélevé',
      net: 'Il vous reste',
      scaleTitle: 'Le barème complet',
      scaleCurrent: 'Votre palier',
      nextTitle: 'Si vous attendiez le palier suivant',
      nextTemplate:
        'À partir de {duree} de détention, la commission tombe à {taux}. Sur ce montant, attendre vous éviterait {economie}.',
      nextNone:
        'Vous êtes au dernier palier : au-delà de ' +
        fees.withdrawal.zeroAfterYears +
        ' ans, aucune commission de retrait n’est prélevée.',
    },
    risk: nb(
      `Ce calcul suppose que le retrait est possible. Il ne l’est pas toujours : vous ne récupérez votre argent que si un autre épargnant achète vos parts, et la société de gestion ne garantit pas leur rachat. La valeur de retrait peut par ailleurs être inférieure au prix que vous avez payé.`
    ),
    noteId: 'outils-frais',
  },

  /** 4. Versements programmés. */
  savings: {
    pageKey: 'toolSavings' as const,
    card: {
      eyebrow: 'Versements',
      question: 'Que représente un versement programmé, en parts ?',
      teaser: `À partir de ${subscription.options.pei.minimumMonthlyLabel}, vos versements achètent des parts entières et des fractions de part. L’outil calcule ce que vous aurez versé et combien de parts cela représente au prix en vigueur.`,
    },
    levelNotes: {
      debutant: 'Un versement mensuel, une durée, et le nombre de parts.',
      intermediaire:
        'Ajoute le minimum du plan, sa condition d’accès et la jouissance du premier versement.',
      expert: 'Ajoute le prix de part retenu, pour mesurer l’effet d’une révision.',
    },
    title: 'Ce que représente un versement programmé',
    intro: `À partir de ${share.priceLabel} la part, fractionnable, vos versements achètent des parts entières et des fractions de part. L’outil calcule ce que vous aurez versé et combien de parts cela représente au prix actuel.`,
    fields: {
      monthly: 'Versement mensuel',
      months: 'Pendant',
      sharePrice: 'Prix de part retenu',
    },
    hints: {
      monthly: `Minimum du plan : ${subscription.options.pei.minimumMonthlyLabel}.`,
      sharePrice: `Prix en vigueur : ${share.priceLabel}. Modifiez-le pour mesurer l’effet d’une révision.`,
    },
    results: {
      total: 'Total versé',
      shares: 'Nombre de parts au prix retenu',
      minimumTitle: 'Ce que le plan exige',
      minimum: `${subscription.options.pei.minimumMonthlyLabel} minimum. ${subscription.options.pei.requirement}.`,
      firstEnjoyment: 'Jouissance du premier versement',
      firstEnjoymentHint: `Chaque versement a sa propre date de jouissance, ${income.enjoymentDelayLabel} après son encaissement.`,
    },
    risk: nb(
      `Le nombre de parts est calculé au prix de souscription en vigueur. Ce prix peut être révisé : à versement égal, vous obtiendrez plus ou moins de parts. Détenir davantage de parts n’implique aucun revenu et ne protège pas d’une perte en capital.`
    ),
    noteId: 'outils-parts',
  },

  /** Page d'accueil des outils : une carte par outil, chacune vers sa page. */
  index: {
    title: 'Quatre questions, quatre outils',
    intro:
      'Chaque outil répond à une question et vit sur sa propre page. Sur chacune, trois niveaux de détail : l’essentiel, vos hypothèses, ou tous les paramètres.',
    cardCta: 'Ouvrir l’outil',
  },

  /** Renvois d'une page d'outil vers les trois autres. */
  elsewhere: {
    title: 'Les autres outils',
    backLabel: 'Tous les outils',
  },

  labels: {
    years: 'ans',
    months: 'mois',
    euro: '€',
    percent: '%',
    reset: 'Réinitialiser',
    /** Valeur d'un résultat tant que rien n'est calculé : sans JavaScript, ou champ date vide. */
    pending: 'Non calculé',
  },

  cta: { label: 'Souscrire en ligne', position: 'outils' as const },
  notes,
};

/**
 * Les quatre outils dans l'ordre de lecture, pour la page d'accueil des outils et pour la route
 * /outil/[slug]. Chacun sait à quelle page il correspond (`pageKey`) : le chemin, le libellé et le fil
 * d'Ariane viennent alors de src/config/pages.ts, jamais d'une chaîne recopiée ici.
 */
export const toolCards = [
  toolsPage.feeSimulator,
  toolsPage.enjoyment,
  toolsPage.exit,
  toolsPage.savings,
] as const;

export default toolsPage;
