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
 * Section 3 — Frais en bref (id « frais »), titre « Ce que vous payez, et quand. » : la section annonce
 * ce qu'elle montre (les frais et leur moment) plutôt qu'un « 0 % » isolé en H2.
 * Les trois « 0 % » sont contrebalancés immédiatement (counterweight, même taille), puis le barème
 * complet est présenté : 15 % de frais de gestion, commission sur les cessions 0 / 6 / 12 %, commission
 * de retrait 10 / 7 / 5 / 3 / 0 %. L'encadré « Une innovation, pas une révolution » et les trois puces
 * de la commission d'arbitrage sont importés de legal.ts à l'identique. Toutes les valeurs viennent de
 * facts.fees.
 * Version « chapitre » de la page /frais : chaque ligne du barème se limite au libellé, à l'assiette et
 * au taux. Les trois frais non nuls portent en plus un `detail` d'une ou deux phrases, en langage
 * courant, qui dit quand et sur quoi ils sont prélevés : sans lui, « 0 / 6 / 12 % » ou
 * « 10 / 7 / 5 / 3 / 0 % » restent opaques pour un néophyte. Ce texte ne répète aucun taux (les taux
 * ne s'affichent que dans la valeur, à la taille commune exigée par l'AMF). Les notes légales
 * sont toutes appelées dans la section : sources (légende du tableau), commission d'arbitrage et
 * exonérations (lignes du tableau), rémunération
 * des intermédiaires (ligne des frais de gestion), HT = TTC (précision finale).
 */

/** Espace insécable avant % et € : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1');

const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

/** Taux sans son « % » (« 10 % » → « 10 »). */
const bare = (rate: string): string => rate.replace(/\s*%$/, '');

/** « 10 / 7 / 5 / 3 / 0 % ». */
const withdrawalValue = nb(`${feeFacts.withdrawal.steps.map((s) => bare(s.rate)).join(' / ')} %`);

/** « 0 à 12 % » : variante courte des paliers de la commission sur les cessions (accueil). */
const disposalValueShort = nb(
  `${bare(feeFacts.disposal.tiers[0].rate)} à ${bare(feeFacts.disposal.tiers[feeFacts.disposal.tiers.length - 1].rate)} %`
);

/** « 10 à 0 % » : variante courte du barème dégressif (accueil, colonne Taux sur mobile). */
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
    text: feeFacts.vatNote,
  },
];

export const fees = {
  eyebrow: 'Frais',
  title: 'Ce que vous payez, et quand.',
  /** 40 mots au plus : l'absence de commission à l'entrée y est immédiatement suivie des trois moments où R Start se rémunère. */
  intro: `Aucune commission à l’entrée ni à l’achat des immeubles. La société de gestion se rémunère sur les loyers encaissés, sur les plus-values réalisées à la vente et, avant ${feeFacts.withdrawal.zeroAfterYears} ans, sur les retraits. Le DIC détaille l’ensemble des coûts.`,
  zeroHighlights: [
    {
      value: nb(feeFacts.subscription.label),
      label: 'de frais de souscription',
      base: feeFacts.subscription.base,
    },
    {
      value: nb(feeFacts.acquisition.label),
      /** Vocabulaire V2 (§3) : le terme réglementaire « frais d'acquisition » reste dans le barème et les notes. */
      label: 'de frais sur les achats d’immeubles',
      base: feeFacts.acquisition.base,
    },
    { value: nb(feeFacts.works.label), label: 'de frais de travaux', base: feeFacts.works.base },
  ],
  zeroHighlightsLabel: 'Les trois frais à 0 %',
  counterRowsLabel: 'Les frais réellement prélevés par R Start',
  // `counterweight` (avantage rédigé + contre-poids) : retiré de l'accueil le 11/09/2026, la rangée des frais
  // prélevés joue ce rôle dans la scène. Le type le rend optionnel.
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
      detail:
        'Prélevés sur les loyers HT encaissés par R Start, avant le versement de vos revenus. Rien n’est prélevé sur le montant que vous investissez.',
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
      label: 'Commission sur les ventes d’immeubles (dite « commission d’arbitrage »)',
      base: feeFacts.disposal.base,
      value: nb(feeFacts.disposal.label),
      valueShort: disposalValueShort,
      detail: nb(
        `Uniquement lorsque R Start revend un immeuble, ${feeFacts.disposal.base}. Ce taux dépend du gain réalisé sur la vente, pas de son montant : aucune commission si le gain est inférieur à 7 % du prix de vente, taux maximal au-delà de 13 %.`
      ),
      noteId: 'frais-commission-arbitrage',
    },
    {
      kind: 'sortie',
      label: 'Commission de retrait anticipé',
      base: feeFacts.withdrawal.base,
      value: withdrawalValue,
      valueShort: withdrawalValueShort,
      detail: `Uniquement si vous revendez vos parts avant ${feeFacts.withdrawal.zeroAfterYears} ans de détention, ${feeFacts.withdrawal.base}. Elle diminue chaque année et disparaît après ${feeFacts.withdrawal.zeroAfterYears} ans.`,
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
    note: `Le rachat de vos parts n’est pas garanti : vous ne récupérez votre argent que si un autre épargnant achète vos parts. ${withdrawalExemptions} Durée de placement recommandée : ${risk.recommendedHoldingLabel}.`,
  },
  innovationBox: innovationNotRevolution,
  arbitrageWarning: { title: arbitrageWarningTitle, bullets: [...arbitrageWarningBullets] },
  htNote: feeFacts.vatNote,
  cta: { label: 'Souscrire en ligne', position: 'frais' },
  /** Rendu par 03-Fees.astro uniquement lorsque src/pages/frais.astro existe (pas de lien mort). */
  detailsLink: { label: 'Tous les frais en détail', href: pages.fees.path },
  notes,
} satisfies FeesContent;
