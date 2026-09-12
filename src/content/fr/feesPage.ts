import type { DocumentItem, FeeRow, LegalNote } from '@/content/types';
import type { FeeComparison, FeeComparisonSide, FeesPageContent } from '@/content/types-v2';
import {
  documents as documentFacts,
  externalLinks,
  fees as feeFacts,
  marketComparison as marketFacts,
  product,
  risk,
  share,
} from '@/content/fr/facts';
import { withdrawalExemptions } from '@/content/fr/fees';
import { isDocumentPublished } from '@/content/fr/documentation';
import {
  arbitrageWarningBullets,
  arbitrageWarningTitle,
  innovationNotRevolution,
  managementCompany,
  publisher,
  shortRiskLine,
} from '@/content/fr/legal';
import manifest from '@/content/fr/media.manifest.json';

/**
 * Page /frais (périmètre v2, plan §12), version complète de la section « Frais » de l'accueil (fees.ts).
 * Sources : brochure R Start 2026 (p.4 : barème et mécanisme de réserve), DIC du 20/05/2026 (p.1 :
 * avertissement commission d'arbitrage ; p.3 : incidence des coûts), bulletin de souscription de mai 2026
 * (CGV : commission de retrait, rémunération des intermédiaires).
 *
 * Règles appliquées : aucune donnée de performance (les scénarios du DIC ne sont jamais cités, seule
 * l'incidence des coûts l'est) ; les 0 % n'apparaissent jamais sans les 15 % de gestion, la commission
 * sur les cessions (0 / 6 / 12 %) et la commission de retrait (10 / 7 / 5 / 3 / 0 %), y compris dans le
 * titre SEO, qui ne porte aucun « 0 % » isolé ; chaque avantage a son contre-poids risque de longueur
 * comparable ; toutes les valeurs viennent de facts.ts (les coûts totaux en euros du DIC p.3 n'y figurent
 * pas : ils ne sont pas affichés tant que facts.fees.dicCostImpact ne les porte pas) ; les mentions de
 * legal.ts sont reproduites à l'identique, hors typographie `nb`. La formulation « 0 % de commission de
 * souscription » remplace tout « rien » ou « sans frais » : le prix de la part inclut une prime d'émission.
 *
 * Le PDF « Simulation des frais ex-ante » (V2, 27/03/2026) n'est pas publié : il affiche 1,12 % de frais de
 * souscription et des montants d'épargne espérée issus des scénarios du DIC. Le bloc document renvoie à la
 * section « Que va me coûter cet investissement ? » du DIC, jusqu'à livraison d'une version corrigée et
 * validée par la Conformité. La publication du DIC suit la décision unique des pages v2
 * (documentation.ts, PENDING_DOCUMENT_KEYS) : tant qu'il est en attente (fichier hébergé du 20/05/2026 à
 * 3 sur 7, CORUM ayant confirmé 4 sur 7), le bloc renvoie vers www.corum.fr et non vers le PDF.
 *
 * Bascule pédagogique des frais (plan §3 bis, arbitrage du 10/09/2026) : les moyennes de marché de la
 * brochure p.6 sont portées dans facts.ts (`marketComparison`) avec leur périmètre et leur source ; les
 * valeurs de R Start viennent, elles, de facts.fees. Garde-fous appliqués ici : aucune SCPI tierce
 * nommée dans la partie visible (le panel des neuf SCPI vit dans `perimeter`, toujours affiché sous la
 * bascule, et dans la note « frais-page-comparatif ») ; une seule taille de police pour toutes les
 * valeurs de frais, des deux côtés ; l'encadré « Une innovation, pas une révolution » (legal.ts)
 * accompagne la bascule, reproduit à l'identique. La position de marché s'intitule « SCPI avec frais
 * d'acquisition », comme dans la brochure : ces SCPI ne prélèvent pas de commission de souscription.
 */

/** Drapeau de la bascule des frais (brochure p.6) : le passer à false retire le bloc en une ligne. */
export const SHOW_MARKET_COMPARISON = true;

/**
 * Typographie française : apostrophe typographique, espace insécable (U+00A0, en échappement) avant % € : ; ? !,
 * entre groupes de trois chiffres (ex. « 10 000 € ») et à l'intérieur des « ». Jamais appliquée aux mentions de
 * legal.ts reproduites à l'identique (voir `feesPage`).
 */
const nb = (s: string): string =>
  s
    .replace(/'/g, '’')
    .replace(/ ([%€:;?!])/g, ' $1')
    .replace(/(\d) (?=\d{3}(?!\d))/g, '$1 ')
    .replace(/« /g, '« ')
    .replace(/ »/g, ' »');

/** Applique `nb` à toutes les chaînes d'une structure, en conservant son type. */
const deepNb = <T>(value: T): T => {
  if (typeof value === 'string') return nb(value) as T;
  if (Array.isArray(value)) return value.map((v) => deepNb(v)) as T;
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, deepNb(v)])
    ) as T;
  }
  return value;
};

const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

/** « a, b ou c ». */
const joinOr = (items: readonly string[]): string =>
  items.length > 1
    ? `${items.slice(0, -1).join(', ')} ou ${items[items.length - 1]}`
    : items.join('');

/** « 0, 6 ou 12 % » à partir de taux libellés « 0 % », « 6 % », « 12 % ». */
const ratesList = (rates: readonly string[]): string =>
  `${joinOr(rates.map((r) => r.replace(/\s*%$/, '')))} %`;

const zeroAfter = feeFacts.withdrawal.zeroAfterYears;
const steps = feeFacts.withdrawal.steps;
const [w0, w1, w2, w3, w4] = steps;
/** « 10 / 7 / 5 / 3 / 0 % ». */
const withdrawalValue = `${steps.map((s) => s.rate.replace(/\s*%$/, '')).join(' / ')} %`;
/** « 10 à 0 % » : variante courte du barème de retrait pour les écrans étroits. */
const withdrawalValueShort = `${w0.rate.replace(/\s*%$/, '')} à ${steps[steps.length - 1].rate}`;
/** « 10 % (< 4 ans), 7 % (5e-6e année), … ». */
const withdrawalDetail = `Dégressive selon la durée de détention : ${steps.map((s) => `${s.rate} (${s.short})`).join(', ')}.`;
/** « 10, 7, 5 ou 3 % ». */
const withdrawalRates = ratesList(steps.slice(0, -1).map((s) => s.rate));
/** « 0, 6 ou 12 % ». */
const disposalRates = ratesList(feeFacts.disposal.tiers.map((t) => t.rate));
/** « 0 % si la plus-value est inférieure à 7 %. 6 % si …. 12 % si …. » : une phrase courte par palier. */
const disposalSentences = feeFacts.disposal.tiers.map((t) => `${t.rate} ${t.condition}.`).join(' ');
const withdrawalPriceLabel = `${share.withdrawalPrice} €`;
const { after1Year, after5Years, after10Years } = feeFacts.dicCostImpact;
const holdingYears = risk.recommendedHoldingYears;

/** Le DIC est-il publié sur ce site (décision unique des pages v2, documentation.ts) ? */
const dicPublished = isDocumentPublished('dic');

/** Poids (ko) d'un PDF publié, depuis le manifeste des médias. */
const kbOf = (file: string): number | undefined =>
  manifest.documents.find((m) => '/' + m.file.replace(/^\/+/, '') === file)?.kb;

/**
 * Document de référence sur les coûts : le DIC (facts.documents), section « Que va me coûter cet
 * investissement ? ». Remplace le PDF « Simulation des frais ex-ante », non publié (voir en-tête).
 * Tant que le DIC est en attente, le bloc renvoie vers www.corum.fr (`file` porte alors une URL externe,
 * sans poids) et non vers le PDF hébergé.
 */
const costDocument = (): DocumentItem => {
  const doc = documentFacts.find((d) => d.key === 'dic');
  if (!doc) throw new Error('facts.documents : document « dic » introuvable');
  const description = `Section « Que va me coûter cet investissement ? » (page 3) : incidence de l’ensemble des coûts pour 10 000 € investis, selon la durée de détention. Lecture obligatoire avant toute souscription.`;
  if (!dicPublished) {
    return {
      key: doc.key,
      title: doc.title,
      description: `${description} Dans l’attente de sa mise en ligne sur ce site, le DIC est disponible sur www.corum.fr.`,
      file: externalLinks.corum,
      version: 'Version à jour sur www.corum.fr',
    };
  }
  const kb = kbOf(doc.file);
  return {
    key: doc.key,
    title: doc.title,
    description,
    file: doc.file,
    version: doc.version,
    ...(kb !== undefined ? { kb } : {}),
  };
};

/** Avertissement commission d'arbitrage, tel que repris dans la FAQ (reproduit à l'identique, hors `nb`). */
const arbitrageVerbatim = `${arbitrageWarningTitle} ${arbitrageWarningBullets.join(' ')}`;

const rawNotes: LegalNote[] = [
  {
    id: 'frais-page-ht',
    text: `${feeFacts.vatNote} Sources : brochure R Start 2026 et bulletin de souscription, mai 2026.`,
  },
  {
    id: 'frais-page-sources',
    text: `Sources : document d’informations clés (DIC) du ${product.dicDate.label}, bulletin de souscription de mai 2026 (conditions générales de vente) et brochure R Start 2026. L’ensemble des frais figure dans la note d’information visée par l’AMF (visa SCPI n° ${product.visa.number} du ${product.visa.date}) et dans le DIC. ${
      dicPublished
        ? 'Ces documents sont disponibles sur www.corum.fr et dans la page Documentation.'
        : 'La note d’information est disponible sur www.corum.fr et dans la page Documentation ; le DIC, sur www.corum.fr, dans l’attente de sa mise en ligne sur ce site.'
    }`,
  },
  {
    id: 'frais-page-commission-arbitrage',
    text: `La commission sur les cessions d’immeubles est aussi appelée commission d’arbitrage. Elle est calculée sur le montant hors taxes de chaque vente, par paliers selon la plus-value réalisée, exprimée en pourcentage du prix de vente. Sources : brochure R Start 2026 (pages 4 et 6) et DIC du ${product.dicDate.label}.`,
  },
  {
    id: 'frais-page-retrait',
    text: `Prix de retrait : ${withdrawalPriceLabel} par part. La commission de retrait anticipé est prélevée en cas de sortie, totale ou partielle, avant ${zeroAfter} ans de détention ; elle est calculée sur le prix de retrait. Source : bulletin de souscription R Start, conditions générales de vente, mai 2026. Le rachat des parts n’est pas garanti : la sortie n’est possible que s’il existe une contrepartie à l’achat (DIC du ${product.dicDate.label}).`,
  },
  {
    id: 'frais-page-exoneration-retrait',
    text: `Cas d’exonération de la commission de retrait anticipé : ${lowerFirst(feeFacts.withdrawal.exemptionsSource)}. Chaque cas est soumis aux conditions qui y sont décrites ; l’exonération n’est pas automatique.`,
  },
  {
    id: 'frais-page-moins-value',
    text: 'Mécanisme de réserve en cas de moins-value : brochure R Start 2026, page 4, et note d’information de R Start, chapitre III, section 4 (mécanisme de compensation).',
  },
  {
    id: 'frais-page-incidence-dic',
    text: `Incidence des coûts selon le DIC du ${product.dicDate.label} (page 3), pour 10 000 € investis : ${after1Year} après 1 an, ${after5Years} après 5 ans et ${after10Years} après ${holdingYears} ans. Hypothèses réglementaires : au cours de la première année, vous récupérez le montant investi ; pour les autres durées, le produit évolue selon le scénario intermédiaire. L’incidence mesure la réduction moyenne, chaque année, de ce que le placement rapporte, du fait de l’ensemble des coûts, commission de retrait comprise en cas de sortie anticipée. Les montants en euros et les scénarios de performance du DIC ne sont pas repris sur ce site.`,
  },
  {
    id: 'frais-page-distributeur',
    text: `Dans le cadre de la commercialisation de R Start, ${managementCompany.name} est susceptible de reverser aux intermédiaires habilités une rémunération récurrente équivalente à ${feeFacts.distributorRemuneration}. ${publisher.name}, éditeur de ce site, distribue R Start. Source : bulletin de souscription R Start, conditions générales de vente, mai 2026.`,
  },
];

export const notes: LegalNote[] = rawNotes.map((n) => ({ ...n, text: nb(n.text) }));

/** Barème des cessions d'immeubles : une ligne par palier de plus-value (facts.fees.disposal.tiers). */
const disposalRows: FeeRow[] = feeFacts.disposal.tiers.map((t, i) => ({
  kind: 'transaction',
  label: `Plus-value ${t.condition.replace(/^si la plus-value est /, '')}`,
  base: feeFacts.disposal.base,
  value: t.rate,
  detail:
    i === 0
      ? 'Aucune commission sur cette vente.'
      : 'Taux appliqué au montant HT de la vente, pas à la seule plus-value.',
}));

/**
 * Bascule pédagogique des frais (brochure p.6). Les cinq moments du parcours sont les mêmes des deux
 * côtés, dans le même ordre : c'est la comparaison du *moment* du prélèvement, pas seulement du montant.
 */
const moments = {
  subscribe: 'À la souscription',
  buy: 'À l’achat des immeubles',
  hold: 'Pendant la détention',
  sell: 'À la vente d’un immeuble',
  exit: 'À la sortie',
} as const;

const avg = marketFacts.averages;

/** Position de marché : moyennes du panel, aucune SCPI nommée. */
const marketSide: FeeComparisonSide = {
  key: 'marche',
  label: marketFacts.columnLabel,
  summary:
    'Ces SCPI ne prélèvent pas de commission de souscription. Elles se rémunèrent dès l’achat des immeubles, puis sur les loyers encaissés, et de nouveau en cas de sortie anticipée.',
  steps: [
    {
      moment: moments.subscribe,
      label: 'Frais de souscription',
      value: avg.subscription.label,
      base: avg.subscription.base,
      timing: avg.subscription.timing,
    },
    {
      moment: moments.buy,
      label: 'Frais sur les achats d’immeubles',
      value: avg.acquisition.label,
      base: avg.acquisition.base,
      timing: avg.acquisition.timing,
      detail: 'Prélevés à chaque immeuble acheté, avant tout revenu.',
    },
    {
      moment: moments.buy,
      label: 'Frais d’agent immobilier',
      value: avg.broker.label,
      base: avg.broker.base,
      timing: avg.broker.timing,
      detail: 'Deux des neuf SCPI du panel appliquent ces frais.',
    },
    {
      moment: moments.hold,
      label: 'Frais de gestion',
      value: avg.management.label,
      base: avg.management.base,
      timing: avg.management.timing,
    },
    {
      moment: moments.hold,
      label: 'Frais de travaux',
      value: avg.works.label,
      base: avg.works.base,
      timing: avg.works.timing,
    },
    {
      moment: moments.sell,
      label: 'Frais sur les cessions immobilières',
      value: avg.disposal.label,
      base: avg.disposal.base,
      timing: avg.disposal.timing,
      detail: 'Taux appliqué au prix de vente, que la vente dégage ou non une plus-value.',
    },
    {
      moment: moments.exit,
      label: 'Commission de retrait anticipé',
      value: avg.withdrawal.label,
      base: avg.withdrawal.base,
      timing: avg.withdrawal.timing,
    },
  ],
};

/** Position R Start : toutes les valeurs viennent de facts.fees, jamais de la brochure p.6. */
const rstartSide: FeeComparisonSide = {
  key: 'rstart',
  label: product.name,
  summary: `R Start prélève ${feeFacts.subscription.label} de commission de souscription et ${feeFacts.acquisition.label} de frais sur les achats d’immeubles. Elle prélève ${feeFacts.management.label} des loyers HT encaissés, ${disposalRates} sur chaque vente selon la plus-value, et ${withdrawalRates} en cas de retrait avant ${zeroAfter} ans.`,
  steps: [
    {
      moment: moments.subscribe,
      label: 'Frais de souscription',
      value: feeFacts.subscription.label,
      base: 'prélevés sur le montant investi',
      timing: avg.subscription.timing,
    },
    {
      moment: moments.buy,
      label: 'Frais sur les achats d’immeubles',
      value: feeFacts.acquisition.label,
      base: 'prélevés sur le prix d’achat',
      timing: avg.acquisition.timing,
      detail: 'Terme réglementaire : frais d’acquisition.',
    },
    {
      moment: moments.buy,
      label: 'Frais d’agent immobilier',
      value: feeFacts.broker.label,
      base: avg.broker.base,
      timing: avg.broker.timing,
      detail: 'Terme réglementaire : frais d’intermédiation (broker).',
    },
    {
      moment: moments.hold,
      label: 'Frais de gestion',
      value: feeFacts.management.label,
      base: 'prélevés sur les loyers HT encaissés',
      timing: avg.management.timing,
      detail: 'Le taux le plus élevé des deux positions.',
    },
    {
      moment: moments.hold,
      label: 'Frais de travaux',
      value: feeFacts.works.label,
      base: avg.works.base,
      timing: avg.works.timing,
    },
    {
      moment: moments.sell,
      label: 'Frais sur les cessions immobilières',
      value: feeFacts.disposal.label,
      base: feeFacts.disposal.base,
      timing: avg.disposal.timing,
      detail: `${disposalSentences} ${feeFacts.disposal.basisNote}`,
    },
    {
      moment: moments.exit,
      label: 'Commission de retrait anticipé',
      value: withdrawalValue,
      base: feeFacts.withdrawal.base,
      timing: avg.withdrawal.timing,
      detail: withdrawalDetail,
    },
  ],
};

/**
 * Phrase de périmètre affichée sous la bascule, sans nommer le panel (garde-fou publicité comparative,
 * arbitrage du 10/09/2026 : « aucun concurrent nommé dans la partie visible »). Les neuf SCPI, la note
 * d'agent immobilier et la source complète vivent uniquement dans la note « frais-page-comparatif »,
 * déjà appelée par le titre de la bascule (comparison.noteId), toujours affichée.
 */
const comparisonPerimeter =
  'Moyennes de marché calculées sur un panel de SCPI sans frais de souscription et avec frais d’acquisition. Panel, périmètre et sources détaillés dans la note ci-dessus.';

/** Contenu de la bascule, avant typographie (`deepNb` plus bas ; l'encadré legal.ts reste à l'identique). */
const rawComparison = {
  enabled: true,
  eyebrow: 'Comparatif',
  title: 'Qui se rémunère, et à quel moment ?',
  intro:
    'Un même parcours d’épargne, rejoué des deux côtés : la souscription, l’achat des immeubles, la détention, la vente d’un immeuble, la sortie. Chaque ligne indique ce qui est prélevé et quand.',
  switchLabel: 'Choisir le modèle de frais à afficher',
  columns: { moment: 'Moment', fee: 'Frais', value: 'Taux' },
  sides: [marketSide, rstartSide] as [FeeComparisonSide, FeeComparisonSide],
  perimeter: comparisonPerimeter,
  risk: `R Start n’est pas moins chère. Ses frais de gestion sont supérieurs à la moyenne du panel (${feeFacts.management.label} contre ${avg.management.label}). Sa commission de retrait avant ${zeroAfter} ans va jusqu’à ${w0.rate}, contre ${avg.withdrawal.label} en moyenne. Si les ventes dégagent de fortes plus-values, les ${disposalRates} sur les cessions peuvent dépasser une commission de souscription classique. Vous ne connaissez pas votre coût total à la souscription.`,
  noteId: 'frais-page-comparatif',
};

const feeComparison: FeeComparison = {
  ...deepNb(rawComparison),
  innovationBox: innovationNotRevolution,
};

/** Contenu avant application de la typographie française (voir `deepNb`). */
const raw = {
  seo: {
    /** ≤ 60 caractères. Aucun « 0 % » isolé : le titre s'affiche seul (onglet, partages). */
    title: 'Frais R Start, SCPI CORUM : gestion, cessions et retrait',
    /** 140-155 caractères : le « 0 % » y est accompagné des 15 %, des 0 / 6 / 12 % et des 10 à 3 %, puis du rappel de risque. */
    description:
      'Frais de R Start, SCPI CORUM : 0 % à l’entrée, 15 % de gestion, 0, 6 ou 12 % sur les cessions, 10 à 3 % au retrait avant 8 ans. Risque de perte en capital.',
  },

  hero: {
    eyebrow: `Frais · SCPI ${product.name}`,
    title: `Comparer et comprendre les frais de ${product.name}`,
    intro: `R Start ne prélève rien à la souscription ni à l’achat des immeubles. Sa société de gestion se rémunère sur les loyers encaissés, sur les plus-values à la vente et, avant ${zeroAfter} ans, sur les retraits.`,
    riskLine: shortRiskLine,
  },

  /** Micro-textes de la page (aria-label, en-têtes, surtitres) : rien n'est écrit en dur dans frais.astro. */
  labels: {
    zeroHighlights: 'Les trois frais à 0 %',
    columns: { fee: 'Frais', base: 'Prélevé sur', value: 'Taux', detail: 'Précisions' },
    kinds: {
      entree: 'À l’entrée',
      investissement: 'À l’investissement',
      gestion: 'Pendant la détention',
      transaction: 'Sur les cessions',
      sortie: 'À la sortie',
    },
    steps: 'Commission de retrait selon la durée de détention des parts',
    costColumns: { period: 'Durée de détention', impact: 'Incidence annuelle des coûts' },
    eyebrows: {
      schedule: 'Le barème complet',
      withdrawal: 'Commission de retrait',
      lossMechanism: 'Mécanisme de réserve',
      costImpact: 'Coûts, pas performance',
      document: 'Document de référence',
      faq: 'Questions fréquentes',
    },
    fileTypeLabel: 'PDF',
    sizeUnit: 'ko',
    newTabHint: 'nouvelle fenêtre',
    faqList: 'Questions fréquentes sur les frais de R Start',
  },

  zeroHighlights: [
    {
      value: feeFacts.subscription.label,
      label: 'de frais de souscription',
      base: feeFacts.subscription.base,
    },
    {
      value: feeFacts.acquisition.label,
      /** Vocabulaire V2 (§3) : le terme réglementaire « frais d'acquisition » reste dans le barème détaillé et les notes. */
      label: 'de frais sur les achats d’immeubles',
      base: feeFacts.acquisition.base,
    },
    { value: feeFacts.works.label, label: 'de frais de travaux', base: feeFacts.works.base },
  ],

  counterweight: {
    advantage: `Aucune commission n’est prélevée sur votre versement à la souscription, ni sur le prix d’achat des immeubles, ni sur les travaux. Le prix de la part, ${share.priceLabel}, inclut 0 € de commission de souscription. La société de gestion se rémunère sur les loyers encaissés et sur les plus-values réalisées à la vente. Avant ${zeroAfter} ans, elle perçoit aussi une commission de retrait, de ${w0.rate} à ${w3.rate} de la valeur de retrait.`,
    risk: `En contrepartie, ${feeFacts.management.label} des loyers HT sont prélevés au titre des frais de gestion. S’y ajoute une commission sur les cessions d’immeubles (${feeFacts.disposal.label} selon la plus-value). Avant ${zeroAfter} ans, une commission de retrait de ${w0.rate} à ${w3.rate} de la valeur de retrait s’applique aussi. Ces frais réduisent vos revenus potentiels et, en cas de sortie anticipée, la somme récupérée. Votre coût total n’est pas connu à la souscription.`,
  },

  /**
   * Frais réellement prélevés, affichés à la même taille (text-stat) que les trois « 0 % » juste
   * au-dessus : retour AMF sur la brochure, taille de police uniforme pour tous les frais (plan §0).
   */
  counterweightRates: [
    { value: feeFacts.management.label, label: 'de frais de gestion sur les loyers HT' },
    { value: feeFacts.disposal.label, label: 'sur les cessions d’immeubles' },
    { value: withdrawalValueShort, label: `de commission de retrait avant ${zeroAfter} ans` },
  ],

  groups: [
    {
      title: 'À l’entrée et à l’investissement',
      noteId: 'frais-page-sources',
      intro: `Ces quatre postes sont à ${feeFacts.subscription.label}. Ils ne sont pas les seuls frais de R Start : les trois blocs suivants détaillent ceux qui s’appliquent.`,
      rows: [
        {
          kind: 'entree',
          label: 'Commission de souscription',
          base: feeFacts.subscription.base,
          value: feeFacts.subscription.label,
          detail: `Prix de la part : ${share.priceLabel}, dont 0 € de commission de souscription. Frais unique, à l’entrée.`,
        },
        {
          kind: 'investissement',
          label: 'Frais d’acquisition',
          base: feeFacts.acquisition.base,
          value: feeFacts.acquisition.label,
          detail: 'À chaque achat d’immeuble.',
        },
        {
          kind: 'investissement',
          label: 'Frais d’intermédiation (agent immobilier)',
          base: feeFacts.broker.base,
          value: feeFacts.broker.label,
          detail: 'À chaque achat d’immeuble réalisé par l’intermédiaire d’un agent.',
        },
        {
          kind: 'investissement',
          label: 'Frais de travaux',
          base: feeFacts.works.base,
          value: feeFacts.works.label,
          detail: 'Frais ponctuels, sur les travaux réalisés dans les immeubles détenus.',
        },
      ],
    },
    {
      title: 'Pendant la détention',
      intro:
        'La rémunération principale de la société de gestion. Elle est prélevée chaque fois que R Start encaisse des loyers, pendant toute la vie de la SCPI.',
      rows: [
        {
          kind: 'gestion',
          label: 'Frais de gestion',
          base: feeFacts.management.base,
          value: feeFacts.management.label,
          detail:
            'Frais récurrents, dus dès qu’un loyer est encaissé, même si la valeur des parts baisse. Ils réduisent d’autant les revenus distribuables.',
        },
      ],
    },
    {
      title: 'Sur les cessions d’immeubles',
      noteId: 'frais-page-commission-arbitrage',
      intro: `Aussi appelée commission d’arbitrage, elle dépend de la plus-value réalisée sur chaque vente. Son taux s’applique au montant HT de la vente. ${feeFacts.disposal.basisNote} Le prélèvement a des effets de seuil : la commission peut capter une partie significative de la plus-value.`,
      rows: disposalRows,
    },
    {
      title: 'À la sortie',
      noteId: 'frais-page-retrait',
      intro: `Une commission de retrait est prélevée si vous sortez avant ${zeroAfter} ans de détention. Elle est calculée sur la valeur de retrait et diminue avec le temps.`,
      rows: [
        {
          kind: 'sortie',
          label: 'Commission de retrait anticipé',
          base: feeFacts.withdrawal.base,
          value: withdrawalValue,
          valueShort: withdrawalValueShort,
          detail: `${withdrawalDetail} Nulle après ${zeroAfter} ans de détention.`,
        },
      ],
    },
  ],

  withdrawal: {
    title: 'Une commission de retrait dégressive.',
    intro: `Si vous demandez le retrait de vos parts avant ${zeroAfter} ans, une commission est prélevée sur la valeur de retrait. Le prix de retrait est aujourd’hui de ${withdrawalPriceLabel} par part. La commission diminue à chaque palier, jusqu’à ${w4.rate} après ${zeroAfter} ans. Le rachat de vos parts n’est pas garanti : il suppose une contrepartie à l’achat.`,
    steps: steps.map(({ period, rate }) => ({ period, rate })),
    /**
     * Le libellé exact des cas d'exonération reste à confirmer par CORUM (facts.fees.withdrawal.exemptions) :
     * d'ici là, la phrase unique « sous conditions » de l'accueil (fees.ts) remplace la liste titrée.
     */
    exemptionsTitle: 'Sous conditions, des cas d’exonération',
    exemptions: [withdrawalExemptions],
    note: `Source : ${feeFacts.withdrawal.exemptionsSource}. Chaque cas est soumis aux conditions qui y sont décrites ; l’exonération n’est pas automatique. Durée de placement recommandée : ${risk.recommendedHoldingLabel}.`,
  },

  lossMechanism: {
    title: 'En cas de moins-value',
    body: [
      'Si une vente génère une moins-value, celle-ci est enregistrée dans une réserve dédiée. La société de gestion ne perçoit alors aucune commission sur les ventes. Cette règle vaut tant que la réserve n’est pas intégralement compensée par des plus-values futures.',
      'La société de gestion ne se rémunère sur les cessions que lorsque le bilan global des ventes est positif. Le détail du mécanisme de compensation figure au chapitre III, section 4 de la note d’information de R Start.',
    ],
    risk: `Ce mécanisme porte sur les commissions de cession, pas sur la valeur de vos parts. ${arbitrageWarningBullets[1]} Les frais de gestion restent dus sur les loyers, comme la commission de retrait avant ${zeroAfter} ans. Une plus-value n’est jamais acquise d’avance : une vente peut aussi se solder par une moins-value.`,
  },

  costImpact: {
    title: 'L’incidence des coûts selon le DIC',
    intro: `Le document d’informations clés (DIC) mesure de combien l’ensemble des coûts réduit, chaque année, ce que le placement rapporte. Il retient un investissement de 10 000 € et le scénario intermédiaire réglementaire. Plus la détention est longue, plus cette incidence diminue.`,
    rows: [
      { period: 'Si vous sortez après 1 an', impact: after1Year },
      { period: 'Si vous sortez après 5 ans', impact: after5Years },
      { period: `Si vous sortez après ${holdingYears} ans`, impact: after10Years },
    ],
    note: `Méthode du DIC du ${product.dicDate.label} (page 3) : 10 000 € investis. Au cours de la première année, vous récupérez le montant investi. Pour les autres durées, le produit évolue selon le scénario intermédiaire. Le chiffre à 1 an inclut les coûts de sortie : la commission de retrait de ${w0.rate}, appliquée avant 4 ans de détention. Les montants en euros figurent dans le DIC.`,
    risk: `Ces chiffres sont des illustrations réglementaires, pas une prévision. Vos coûts réels dépendront de vos versements, de votre durée de détention et de la vie de la SCPI. Ils s’ajoutent au risque de perte en capital. Ce que vous récupérerez n’est pas garanti et peut être inférieur à votre investissement. Les scénarios de performance du DIC ne sont pas repris sur ce site.`,
  },

  /**
   * `riskFrom` : index du premier paragraphe de contre-poids risque (rendu en RiskNote, jamais animé). Dans les
   * trois premières réponses, le deuxième paragraphe décrit déjà les frais prélevés : il fait partie du contre-poids.
   */
  faq: {
    title: 'Vos questions sur les frais de R Start.',
    items: [
      {
        question: 'Que paie-t-on vraiment avec R Start ?',
        answer: [
          `À la souscription, ${feeFacts.subscription.label} de commission : une part coûte ${share.priceLabel}, dont 0 € de commission de souscription. Aucun frais n’est prélevé non plus à l’achat des immeubles, ni sur les travaux.`,
          `Vous payez ensuite, indirectement, ${feeFacts.management.label} HT des loyers encaissés au titre des frais de gestion. À chaque vente d’immeuble, une commission de ${disposalRates} du montant HT s’applique, selon la plus-value. Avant ${zeroAfter} ans, la commission de retrait est de ${withdrawalRates} de la valeur de retrait.`,
          `Ces prélèvements réduisent vos dividendes potentiels et, en cas de sortie anticipée, la somme que vous récupérez. Le DIC en donne une illustration pour 10 000 € investis. L’incidence annuelle des coûts y est de ${after1Year} après 1 an et de ${after10Years} après ${holdingYears} ans. Votre coût total n’est pas connu à la souscription.`,
        ],
        riskFrom: 1,
      },
      {
        question: `Pourquoi ${feeFacts.management.label} de frais de gestion ?`,
        answer: [
          `Les frais de gestion rémunèrent ${managementCompany.name} pour la gestion des immeubles, des locataires et de la SCPI. Ils sont prélevés sur les loyers HT encaissés, pas sur votre versement. R Start ne percevant ni commission de souscription ni frais sur les achats d’immeubles, ce sont ses frais principaux.`,
          'Ce taux s’applique pendant toute la durée de détention. Il réduit d’autant les revenus distribuables, avant les autres charges de la SCPI (impôts, frais non refacturables aux locataires).',
          'Ces frais ne dépendent pas de la valeur de vos parts. Ils sont dus dès qu’un loyer est encaissé, même si cette valeur baisse. Les revenus ne sont pas garantis et varient selon le marché immobilier et le cours des devises.',
        ],
        riskFrom: 1,
      },
      {
        question: `Que se passe-t-il si je sors avant ${zeroAfter} ans ?`,
        answer: [
          `Vous pouvez demander le retrait de vos parts à tout moment. Le prix de retrait est aujourd’hui de ${withdrawalPriceLabel} par part. Avant ${zeroAfter} ans de détention, une commission de retrait anticipé est prélevée sur la valeur de retrait. Elle est de ${w0.rate} avant 4 ans, puis ${w1.rate} la 5e et la 6e année. Elle passe à ${w2.rate} la 7e année et ${w3.rate} la 8e année. Elle est nulle après ${zeroAfter} ans.`,
          `Le DIC illustre ce coût pour 10 000 € investis : l’incidence annuelle des coûts atteint ${after1Year} en cas de sortie après 1 an, commission de retrait comprise. ${withdrawalExemptions}`,
          `Le rachat de vos parts n’est pas garanti : il n’est possible que si une souscription vient en contrepartie. Sans contrepartie, vous pourriez devoir attendre. R Start est un placement de long terme, ${risk.recommendedHoldingLabel} recommandés.`,
        ],
        riskFrom: 1,
      },
      {
        question: 'Comment CORUM se rémunère-t-elle sur les ventes d’immeubles ?',
        answer: [
          `À chaque cession d’immeuble, ${managementCompany.name} perçoit une commission qui dépend de la plus-value réalisée. ${disposalSentences} Elle est calculée sur le montant HT de la vente. ${feeFacts.disposal.basisNote}`,
          'En cas de moins-value, celle-ci est inscrite dans une réserve dédiée. Aucune commission sur les ventes n’est perçue tant que cette réserve n’est pas compensée par des plus-values futures. Détail : note d’information, chapitre III, section 4.',
          arbitrageVerbatim,
        ],
        riskFrom: 2,
      },
    ],
  },

  cta: { label: 'Souscrire en ligne', position: 'frais' },

  notes,
} satisfies Omit<
  FeesPageContent,
  'arbitrageWarning' | 'innovationBox' | 'htNote' | 'marketComparison' | 'simulationDoc'
>;

/** Contenu typographié (`nb` sur toutes les chaînes rédigées ici). */
const typeset = deepNb(raw);

/**
 * Les textes importés de legal.ts et de facts.ts sont reproduits à l'identique, hors `deepNb` : ligne
 * risques du hero, avertissement commission d'arbitrage (bloc et paragraphe de la FAQ), encadré
 * « Une innovation, pas une révolution », note HT/TTC.
 */
export const feesPage: FeesPageContent = {
  ...typeset,
  hero: { ...typeset.hero, riskLine: shortRiskLine },
  faq: {
    ...typeset.faq,
    items: typeset.faq.items.map((item, i) => ({
      ...item,
      answer: item.answer.map((p, j) =>
        raw.faq.items[i]?.answer[j] === arbitrageVerbatim ? arbitrageVerbatim : p
      ),
    })),
  },
  arbitrageWarning: { title: arbitrageWarningTitle, bullets: [...arbitrageWarningBullets] },
  innovationBox: innovationNotRevolution,
  htNote: feeFacts.vatNote,
  marketComparison: feeComparison,
  simulationDoc: deepNb(costDocument()),
};

export default feesPage;
