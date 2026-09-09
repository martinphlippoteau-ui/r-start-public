import type { FeesContent, LegalNote } from '@/content/types';
import { pages } from '@/config/pages';
import { fees as feeFacts, product, risk } from '@/content/fr/facts';
import {
  arbitrageWarningBullets,
  arbitrageWarningTitle,
  innovationNotRevolution,
  managementCompany,
} from '@/content/fr/legal';

/**
 * Section 3 — Frais en bref (id « frais »).
 * Les trois « 0 % » sont contrebalancés immédiatement (counterweight, même taille), puis le barème
 * complet est présenté : 15 % de frais de gestion, commission sur les cessions 0 / 6 / 12 %, commission
 * de retrait 10 / 7 / 5 / 3 / 0 %. L'encadré « Une innovation, pas une révolution » et les trois puces
 * de la commission d'arbitrage sont importés de legal.ts à l'identique. Toutes les valeurs viennent de
 * facts.fees.
 * Version « chapitre » de la page /frais : chaque ligne du barème se limite au libellé, à l'assiette et
 * au taux (le texte long par ligne, `FeeRow.detail`, est réservé à feesPage.ts). Les notes légales
 * sont toutes appelées dans la section : sources (légende du tableau), commission d'arbitrage et
 * exonérations (lignes du tableau), incidence des coûts du DIC (contre-poids des 0 %), rémunération
 * des intermédiaires (ligne des frais de gestion), HT = TTC (précision finale).
 */

/** Espace insécable avant % et € : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1');

const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

/** Taux sans son « % » (« 10 % » → « 10 »). */
const bare = (rate: string): string => rate.replace(/\s*%$/, '');

/** « 10 / 7 / 5 / 3 / 0 % ». */
const withdrawalValue = nb(`${feeFacts.withdrawal.steps.map((s) => bare(s.rate)).join(' / ')} %`);

/** « 10 à 0 % » : variante courte du barème dégressif pour la colonne Taux sur mobile. */
const withdrawalValueShort = nb(
  `${bare(feeFacts.withdrawal.steps[0].rate)} à ${bare(feeFacts.withdrawal.steps[feeFacts.withdrawal.steps.length - 1].rate)} %`
);

/**
 * Cas d'exonération de la commission de retrait anticipé (facts.fees.withdrawal.exemptions, note
 * d'information chapitre III § 6). Phrase unique, réutilisée par subscribe.ts et faq.ts. Les cas sont
 * soumis à conditions : le texte renvoie à la note d'information sans laisser croire à une exonération
 * automatique.
 */
export const withdrawalExemptions = nb(
  `La note d’information prévoit, sous conditions, des cas d’exonération de cette commission (${feeFacts.withdrawal.exemptions.join(', ')}) : reportez-vous à son chapitre III.`
);

/** Notes dans l'ordre de leur premier appel dans la section (numérotation croissante à la lecture). */
export const notes: LegalNote[] = [
  {
    id: 'frais-incidence-dic',
    text: `Incidence des coûts selon le DIC du ${product.dicDate.label}, pour un investissement de 10 000 € et selon les hypothèses réglementaires : ${nb(feeFacts.dicCostImpact.after1Year)} en cas de sortie après 1 an, ${nb(feeFacts.dicCostImpact.after5Years)} après 5 ans et ${nb(feeFacts.dicCostImpact.after10Years)} après ${risk.recommendedHoldingYears} ans. Cette incidence mesure la réduction moyenne, chaque année, de ce que le placement rapporte, du fait de l’ensemble des coûts, commission de retrait comprise en cas de sortie anticipée.`,
  },
  {
    id: 'frais-sources',
    text: `Sources : document d’informations clés (DIC) du ${product.dicDate.label}, bulletin de souscription de mai 2026 (conditions générales de vente) et brochure R Start 2026. L’ensemble des frais figure dans la note d’information visée par l’AMF (visa SCPI n° ${product.visa.number} du ${product.visa.date}) et dans le DIC.`,
  },
  {
    id: 'frais-distributeur',
    text: `Dans le cadre de la commercialisation de R Start, ${managementCompany.name} est susceptible de reverser aux intermédiaires habilités une rémunération récurrente équivalente à ${nb(feeFacts.distributorRemuneration)}. Source : bulletin de souscription R Start, conditions générales de vente, mai 2026.`,
  },
  {
    id: 'frais-commission-arbitrage',
    text: `La commission sur les cessions d’immeubles est aussi appelée commission d’arbitrage. Elle est calculée sur le montant hors taxes de chaque vente, par paliers selon la plus-value réalisée. Source : brochure R Start 2026 et DIC du ${product.dicDate.label}.`,
  },
  {
    id: 'frais-exoneration-retrait',
    text: nb(
      `Cas d’exonération de la commission de retrait anticipé : ${lowerFirst(feeFacts.withdrawal.exemptionsSource)}. Chaque cas est soumis aux conditions qui y sont décrites.`
    ),
  },
  {
    id: 'frais-ht',
    text: 'Frais exprimés hors taxes (HT). R Start étant exonérée de TVA, le montant hors taxes est égal au montant toutes taxes comprises (TTC) : les taux affichés sont ceux réellement supportés. Le bulletin de souscription exprime la commission de retrait en TTC, pour des taux identiques.',
  },
];

export const fees = {
  eyebrow: 'Frais',
  title: `${nb(feeFacts.subscription.label)} de frais de souscription.`,
  intro: `Sa société de gestion ne perçoit aucune commission à l’entrée ni à l’achat des immeubles. Elle se rémunère sur les loyers encaissés, sur les plus-values réalisées à la vente et, avant ${feeFacts.withdrawal.zeroAfterYears} ans, sur les retraits. Voici ses frais et commissions. L’ensemble des coûts supportés par R Start figure dans le DIC et la note d’information.`,
  zeroHighlights: [
    {
      value: nb(feeFacts.subscription.label),
      label: 'de frais de souscription',
      base: feeFacts.subscription.base,
    },
    {
      value: nb(feeFacts.acquisition.label),
      label: 'de frais d’acquisition',
      base: feeFacts.acquisition.base,
    },
    { value: nb(feeFacts.works.label), label: 'de frais de travaux', base: feeFacts.works.base },
  ],
  zeroHighlightsLabel: 'Les trois frais à 0 %',
  counterweight: {
    advantage:
      'Rien n’est prélevé sur votre versement à la souscription, ni sur le prix d’achat des immeubles, ni sur les travaux. La société de gestion se rémunère lorsque R Start encaisse des loyers ou réalise une plus-value à la vente.',
    risk: `En contrepartie, R Start prélève ${nb(feeFacts.management.label)} de frais de gestion sur les loyers. S’y ajoutent une commission sur les cessions d’immeubles (${nb(feeFacts.disposal.label)}) et une commission de retrait avant ${feeFacts.withdrawal.zeroAfterYears} ans. Votre coût total n’est pas connu à la souscription.`,
  },
  rows: [
    {
      kind: 'entree',
      label: 'Commission de souscription',
      base: feeFacts.subscription.base,
      value: nb(feeFacts.subscription.label),
    },
    {
      kind: 'investissement',
      label: 'Frais d’acquisition',
      base: feeFacts.acquisition.base,
      value: nb(feeFacts.acquisition.label),
    },
    {
      kind: 'investissement',
      label: 'Frais d’intermédiation (agent immobilier)',
      base: feeFacts.broker.base,
      value: nb(feeFacts.broker.label),
    },
    {
      kind: 'gestion',
      label: 'Frais de gestion',
      base: feeFacts.management.base,
      value: nb(feeFacts.management.label),
      noteId: 'frais-distributeur',
    },
    {
      kind: 'gestion',
      label: 'Frais de travaux',
      base: feeFacts.works.base,
      value: nb(feeFacts.works.label),
    },
    {
      kind: 'transaction',
      label: 'Commission sur les cessions d’immeubles',
      base: feeFacts.disposal.base,
      value: nb(feeFacts.disposal.label),
      noteId: 'frais-commission-arbitrage',
    },
    {
      kind: 'sortie',
      label: 'Commission de retrait anticipé',
      base: feeFacts.withdrawal.base,
      value: withdrawalValue,
      valueShort: withdrawalValueShort,
      noteId: 'frais-exoneration-retrait',
    },
  ],
  table: {
    caption: 'Le barème complet de R Start',
    columns: { fee: 'Frais ou commission', base: 'Prélevé sur', value: 'Taux' },
    groups: {
      entree: 'À l’entrée',
      investissement: 'À l’investissement',
      gestion: 'Pendant la détention',
      transaction: 'À la revente des immeubles',
      sortie: 'À la sortie',
    },
  },
  withdrawal: {
    title: 'Une commission de retrait dégressive.',
    intro: `Si vous revendez vos parts avant ${feeFacts.withdrawal.zeroAfterYears} ans de détention, une commission est prélevée sur la valeur de retrait. Elle diminue avec le temps.`,
    steps: feeFacts.withdrawal.steps.map(({ period, rate }) => ({ period, rate: nb(rate) })),
    stepsLabel: 'Commission de retrait selon la durée de détention des parts',
    note: `Le rachat de vos parts n’est pas garanti : la sortie n’est possible que s’il existe une contrepartie à l’achat. ${withdrawalExemptions} Durée de placement recommandée : ${risk.recommendedHoldingLabel}.`,
  },
  innovationBox: innovationNotRevolution,
  arbitrageWarning: { title: arbitrageWarningTitle, bullets: [...arbitrageWarningBullets] },
  htNote: feeFacts.vatNote,
  cta: { label: 'Souscrire en ligne', position: 'frais' },
  /** Rendu par 03-Fees.astro uniquement lorsque src/pages/frais.astro existe (pas de lien mort). */
  detailsLink: { label: 'Tous les frais en détail', href: pages.fees.path },
  notes,
} satisfies FeesContent;
