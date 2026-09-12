import type { LegalNote } from '../types';
import { fees, income, marketComparison, product, share } from './facts.ts';
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
      `Les taux proposés par défaut pour la SCPI de comparaison sont des moyennes de marché, pas les frais d’une SCPI précise : ${marketComparison.averages.subscription.label} de commission de souscription, ${marketComparison.averages.acquisition.label} de frais d’acquisition et ${marketComparison.averages.management.label} de frais de gestion. ${marketComparison.perimeterLead} : ${marketComparison.panel.join(', ')}, ${marketComparison.perimeterTail} Source : ${marketComparison.source} Vous pouvez remplacer ces valeurs par celles de la SCPI de votre choix : le calcul suit ce que vous saisissez.`
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
    title: 'Ce que R Start prélève, et à partir de quand c’est plus cher',
    intro:
      'R Start ne prend rien à l’entrée et se rémunère sur les loyers. Une SCPI à frais d’entrée prend l’inverse : beaucoup au départ, moins ensuite. Posez vos hypothèses, l’outil calcule les deux et vous dit à partir de quel niveau de loyers le modèle R Start devient le plus coûteux.',
    fields: {
      amount: 'Montant investi',
      rent: 'Loyers qui vous sont distribués, au total sur la période',
      gain: 'Plus-value à la revente, en % du prix de vente',
      years: 'Durée de détention',
      rivalEntry: 'Commission de souscription de la SCPI comparée',
      rivalManagement: 'Frais de gestion de la SCPI comparée',
    },
    hints: {
      rent: 'Votre hypothèse. Rien n’oblige une SCPI à distribuer quoi que ce soit.',
      gain: 'Votre hypothèse. Une revente peut aussi se faire à perte.',
      rivalEntry: 'Moyenne de marché par défaut, modifiable.',
    },
    results: {
      rstart: 'Ce que prélève R Start',
      rival: 'Ce que prélève la SCPI comparée',
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
    title: 'Quand vos parts commencent à produire des revenus',
    intro: `Vos parts n’ouvrent droit aux versements qu’après un délai de ${income.enjoymentDelayLabel}. Indiquez la date à laquelle votre règlement sera encaissé.`,
    fields: { date: 'Date d’encaissement de votre règlement' },
    results: { date: 'Vos parts entrent en jouissance le', wait: 'Soit une attente de' },
    risk: nb(
      `Entrer en jouissance ne veut pas dire percevoir un montant connu. Les dividendes potentiels dépendent des loyers encaissés et de la décision de la société de gestion. Aucun montant n’est annoncé à l’avance, et un mois peut se solder par aucune distribution.`
    ),
    noteId: 'outils-jouissance',
  },

  /** 3. Coût d'une sortie anticipée. */
  exit: {
    title: 'Ce que coûte une sortie avant l’échéance',
    intro: `La commission de retrait diminue avec la durée de détention et disparaît après ${fees.withdrawal.zeroAfterYears} ans. Indiquez le montant que vous souhaitez retirer et depuis combien de temps vous détenez vos parts.`,
    fields: { amount: 'Montant du retrait, à la valeur de retrait', years: 'Durée de détention' },
    results: { rate: 'Commission appliquée', cost: 'Montant prélevé', net: 'Il vous reste' },
    risk: nb(
      `Ce calcul suppose que le retrait est possible. Il ne l’est pas toujours : vous ne récupérez votre argent que si un autre épargnant achète vos parts, et la société de gestion ne garantit pas leur rachat. La valeur de retrait peut par ailleurs être inférieure au prix que vous avez payé.`
    ),
    noteId: 'outils-frais',
  },

  /** 4. Versements programmés. */
  savings: {
    title: 'Ce que représente un versement programmé',
    intro: `À partir de ${share.priceLabel} la part, fractionnable, vos versements achètent des parts entières et des fractions de part. L’outil calcule ce que vous aurez versé et combien de parts cela représente au prix actuel.`,
    fields: { monthly: 'Versement mensuel', months: 'Pendant' },
    results: { total: 'Total versé', shares: 'Nombre de parts au prix actuel' },
    risk: nb(
      `Le nombre de parts est calculé au prix de souscription en vigueur. Ce prix peut être révisé : à versement égal, vous obtiendrez plus ou moins de parts. Détenir davantage de parts n’implique aucun revenu et ne protège pas d’une perte en capital.`
    ),
    noteId: 'outils-parts',
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

export default toolsPage;
