import type { FaqContent, LegalNote } from '@/content/types';
import { pages } from '@/config/pages';
import {
  corumGroup,
  fees as feeFacts,
  income,
  product,
  risk,
  share,
  strategy as strategyFacts,
  subscription,
} from '@/content/fr/facts';
import { withdrawalExemptions } from '@/content/fr/fees';
import { innovationNotRevolution, managementCompany, publisher } from '@/content/fr/legal';

/**
 * Section « FAQ ».
 * Ordre de lecture : les 10 questions de la stratégie SEO (src/content/fr/seo.ts, `faqQuestions`), avec
 * leur libellé exact, complétées par les 6 questions de pédagogie de la V2 (réunion produit du
 * 10/09/2026), insérées au plus près de la question SEO qu'elles éclairent :
 *  - « Comment R Start compte-t-elle créer de la performance ? » (réponse fournie par l'équipe) ;
 *  - « Les frais d'entrée, c'est quoi ? » et « Les frais sur les achats d'immeubles, c'est quoi ? » ;
 *  - « Pourquoi R Start n'affiche-t-elle pas d'objectif de rendement ? » ;
 *  - « Délai de jouissance et dividendes : comment ça marche ? » ;
 *  - « R Start remplace-t-elle les autres SCPI du groupe CORUM ? » (gamme complémentaire, brochure p.5).
 * La réponse fournie par l'équipe pour « Une SCPI, c'est quoi ? » est portée par la question SEO
 * équivalente, « Qu'est-ce qu'une SCPI ? » : même contenu, libellé SEO conservé, pas de doublon dans le
 * JSON-LD FAQPage. Sert aussi de base à ce JSON-LD.
 *
 * Vocabulaire (V2, §3) : à l'affichage, on écrit « frais sur les achats d'immeubles ». Le terme
 * réglementaire « frais d'acquisition » ne subsiste que dans les notes, dans le barème détaillé
 * (fees.ts, feesPage.ts) et dans facts.ts.
 *
 * Règles appliquées : aucune donnée de performance ; chaque avantage cité est contrebalancé par son
 * risque dans la même réponse, et la longueur cumulée des contre-poids (RiskNote) d'une réponse atteint
 * au moins 80 % de celle de ses paragraphes « avantage » (deux RiskNote si nécessaire) ; aucun « 0 % »
 * sans les frais réellement appliqués dans le même bloc ; fiscalité limitée à la nature des revenus
 * (note d'information, chapitre IV) et au prélèvement à la source du bulletin, sans conseil
 * personnalisé ; tous les chiffres et libellés réglementaires (paliers de la commission de retrait,
 * date de jouissance, chiffres du groupe) viennent de facts.ts ; l'encadré « Une innovation, pas une
 * révolution » est importé de legal.ts à l'identique.
 */

/** Espace insécable avant % € : ; ? ! — appliquée à toutes les questions, réponses et notes. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1');
const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

/** « a, b ou c ». */
const joinOr = (items: readonly string[]): string =>
  items.length > 1
    ? `${items.slice(0, -1).join(', ')} ou ${items[items.length - 1]}`
    : items.join('');

/** « a, b et c ». */
const joinAnd = (items: readonly string[]): string =>
  items.length > 1
    ? `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`
    : items.join('');

/** « 0, 6 ou 12 % » à partir de taux libellés « 0 % », « 6 % », « 12 % ». */
const ratesList = (rates: readonly string[]): string =>
  `${joinOr(rates.map((r) => r.replace(/\s*%$/, '')))} %`;

/** « CORUM Origin, CORUM XL, CORUM Eurion, CORUM USA et R Start » (note de source uniquement). */
const scpiList = joinAnd(corumGroup.scpiNames);

const zeroAfter = feeFacts.withdrawal.zeroAfterYears;
/** « 10, 7, 5 ou 3 % » : paliers de la commission de retrait avant 8 ans. */
const withdrawalRates = ratesList(feeFacts.withdrawal.steps.slice(0, -1).map((s) => s.rate));
/**
 * Barème complet de la commission de retrait, libellés des périodes dérivés de facts.fees.withdrawal.steps :
 * « 10 % pour un retrait avant 4 ans de détention, 7 % pour un retrait au cours de la 5e ou de la 6e année, … ».
 */
const withdrawalSchedule = joinAnd(
  feeFacts.withdrawal.steps.map((s) => `${s.rate} pour un ${lowerFirst(s.period)}`)
);
/** « 0, 6 ou 12 % » : paliers de la commission sur les cessions d'immeubles. */
const disposalRates = ratesList(feeFacts.disposal.tiers.map((t) => t.rate));
/** « 0 % si la plus-value est inférieure à 7 %, 6 % si …, 12 % si … ». */
const disposalTiers = feeFacts.disposal.tiers.map((t) => `${t.rate} ${t.condition}`).join(', ');
const withdrawalPriceLabel = `${share.withdrawalPrice} €`;
const documentsList = subscription.documentsRequired.map(lowerFirst).join(', ');
const creationYear = product.creationDate.iso.slice(0, 4);
/** Date du bulletin de souscription dont sont issus les taux de prélèvement (voir note faq-fiscalite). */
const bulletinDate = 'mai 2026';
/** « démembrement, souscription papier et CORUM Life » : modalités non proposées (brochure p.5). */
const notEligibleList = joinAnd(subscription.notEligible);
/** « ni démembrement, ni souscription papier, ni CORUM Life » : énumération négative des mêmes modalités. */
const notEligibleNor = `ni ${subscription.notEligible.join(', ni ')}`;

const rawNotes: LegalNote[] = [
  {
    id: 'faq-leviers',
    text: `Les deux leviers de performance visés par R Start, ${joinAnd(strategyFacts.levers.map(lowerFirst))}, et la formule « ${lowerFirst(strategyFacts.motto)} » : brochure partenaires 2026, p. 3. Il s’agit d’un objectif d’investissement, sans garantie de résultat.`,
  },
  {
    id: 'faq-frais-achats',
    text: `Terme réglementaire : « frais d’acquisition », tel qu’il figure au document d’informations clés du ${product.dicDate.label} et dans le barème détaillé de la section Frais. Il désigne la commission de la société de gestion sur le prix d’acquisition net vendeur des immeubles. Source : brochure partenaires 2026, p. 4.`,
  },
  {
    id: 'faq-objectif',
    text: `R Start n’affiche aucun objectif de rendement, à la différence des premières SCPI du groupe CORUM, dont les frais sont par ailleurs forfaitaires. Source : brochure partenaires 2026, p. 5, tableau « Une gamme complémentaire ».`,
  },
  {
    id: 'faq-jouissance',
    text: `Délai de jouissance de R Start : ${income.enjoymentDelayLabel} (brochure partenaires 2026, p. 3). Date de jouissance : date à partir de laquelle les parts donnent droit aux dividendes potentiels. Pour R Start : ${lowerFirst(income.enjoymentDate)}. Source : bulletin de souscription R Start, conditions générales de vente.`,
  },
  {
    id: 'faq-sri',
    text: `Indicateur synthétique de risque (SRI) : échelle de 1 (risque le plus faible) à ${risk.sriMax} (risque le plus élevé), établie en supposant que vous conservez le produit ${risk.recommendedHoldingLabel}. R Start y est classée ${risk.sriLabel} dans son document d’informations clés du ${product.dicDate.label}, qui seul fait foi. Source : document d’informations clés de R Start, p. 2.`,
  },
  {
    id: 'faq-fiscalite',
    text: `Prélèvement à la source obligatoire de ${income.withholdingTax} (hors prélèvements sociaux de ${income.socialContributions}) opéré par la société de gestion sur les produits financiers, pour tout associé personne physique résidant fiscalement en France. Il constitue un acompte d’impôt sur le revenu, imputable sur l’impôt dû et restituable s’il l’excède. Une dispense peut être demandée sous conditions de revenus (article 242 quater du Code général des impôts). Source : bulletin de souscription R Start, ${bulletinDate}. Taux en vigueur à cette date, susceptibles d’évoluer.`,
  },
  {
    id: 'faq-corum-source',
    text: `${corumGroup.statsSource} Nombre de SCPI gérées : brochure partenaires 2026 (${scpiList}). Agrément de la société de gestion : mentions légales de ${managementCompany.name}.`,
  },
  {
    id: 'faq-gamme',
    text: `Éligibilité de R Start : souscription ${subscription.onlineLabel} ; ${subscription.options.rd.name} et ${subscription.options.pei.name} proposés ; ${notEligibleList} non proposés. Positionnement : stratégie patrimoniale plus dynamique, en contrepartie d’un risque plus élevé, quand les premières SCPI du groupe visent des revenus potentiels réguliers. Source : brochure partenaires 2026, p. 5.`,
  },
];

export const notes: LegalNote[] = rawNotes.map((n) => ({ ...n, text: nb(n.text) }));

/**
 * Questions et réponses avant application de la typographie française (voir `nb`).
 * `riskFrom` : index du premier paragraphe de contre-poids risque de chaque réponse (rendu en RiskNote,
 * même taille que l'avantage qui précède) ; `noteId` : appel de note porté par la question.
 */
const rawItems: FaqContent['items'] = [
  {
    /** Réponse fournie par l'équipe produit pour « Une SCPI, c'est quoi ? », portée par le libellé SEO. */
    question: 'Qu’est-ce qu’une SCPI ?',
    riskFrom: 2,
    answer: [
      'Une société civile de placement immobilier, ou SCPI, achète et gère des immeubles professionnels. Elle les loue à des entreprises. Vous achetez des parts de cette société, pas les immeubles eux-mêmes.',
      'Vous pouvez ainsi percevoir des revenus potentiels réguliers, en contrepartie de frais de gestion. C’est faire de l’immobilier sans avoir à le gérer : la société de gestion sélectionne, achète, loue, entretient et revend. R Start est une SCPI à capital variable : le nombre de parts évolue au fil des souscriptions et des retraits.',
      `Une SCPI est un placement immobilier de long terme. Le capital investi n’est pas garanti et sa valeur peut baisser : vous pourriez perdre tout ou partie de votre investissement. Les revenus ne sont pas garantis : ils varient à la hausse comme à la baisse, selon les loyers encaissés et le marché immobilier. La revente des parts n’est pas garantie non plus : la liquidité est limitée, et la société de gestion ne garantit pas le rachat de vos parts. Pour R Start, la durée de placement recommandée est de ${risk.recommendedHoldingLabel}.`,
      `Les frais de gestion réduisent les revenus qui vous sont distribués : pour R Start, ils sont de ${feeFacts.management.label} des loyers HT encaissés. Confier la gestion ne supprime pas le risque immobilier : un impayé, une vacance ou une baisse des loyers pèse directement sur vos dividendes potentiels.`,
    ],
  },
  {
    /** Réponse fournie par l'équipe produit ; les deux leviers viennent de facts.strategy.levers (brochure p.3). */
    question: 'Comment R Start compte-t-elle créer de la performance ?',
    riskFrom: 2,
    noteId: 'faq-leviers',
    answer: [
      `R Start vise deux moteurs. Le premier : ${lowerFirst(strategyFacts.levers[0])}, versés par les locataires des immeubles détenus. Ils alimentent les dividendes potentiels.`,
      `Le second : ${lowerFirst(strategyFacts.levers[1])} lors de la vente d’un immeuble. La stratégie tient en trois mots : ${lowerFirst(strategyFacts.motto)}.`,
      'Ces deux moteurs sont un objectif, pas un résultat. Un locataire peut partir ou ne pas payer, un immeuble rester inoccupé. Les revenus ne sont pas garantis : ils varient à la hausse comme à la baisse, selon le marché immobilier et le cours des devises.',
      `Une plus-value n’est jamais acquise d’avance : une vente peut aussi dégager une moins-value. Le capital investi n’est pas garanti et sa valeur peut baisser. R Start a été créée en ${creationYear} : elle ne dispose d’aucun historique et aucune donnée de performance n’est présentée sur ce site. Durée de placement recommandée : ${risk.recommendedHoldingLabel}.`,
    ],
  },
  {
    question: 'Pourquoi R Start affiche-t-elle 0 % de frais de souscription ?',
    riskFrom: 1,
    answer: [
      `Sa société de gestion ne perçoit ni commission de souscription, ni frais sur les achats d’immeubles, ni frais de travaux. Le prix de la part est de ${share.priceLabel}, dont 0 € de commission de souscription. ${managementCompany.name} se rémunère lorsque R Start encaisse des loyers ou vend un immeuble avec plus-value. Elle perçoit aussi une commission de retrait de ${withdrawalRates} de la valeur de retrait si vous sortez avant ${zeroAfter} ans de détention.`,
      innovationNotRevolution.body,
      `Ses frais sont prélevés ailleurs : ${feeFacts.management.label} HT des loyers encaissés, une commission sur les cessions d’immeubles (${disposalRates} du montant de la vente selon la plus-value) et une commission de retrait de ${withdrawalRates} de la valeur de retrait avant ${zeroAfter} ans de détention. La commission d’arbitrage a des effets de seuil et peut capter une partie significative de la plus-value.`,
    ],
  },
  {
    question: 'Les frais d’entrée, c’est quoi ?',
    riskFrom: 2,
    answer: [
      'Les frais d’entrée, ou commission de souscription, sont prélevés sur la somme que vous versez. Ils rémunèrent la société de gestion et les intermédiaires dès la souscription, avant tout revenu. Ils réduisent d’autant le montant réellement investi.',
      `Pour R Start, cette commission est de ${feeFacts.subscription.label} : rien n’est prélevé sur le montant investi. Une part coûte ${share.priceLabel}, dont 0 € de commission de souscription.`,
      `Les frais de R Start sont prélevés ailleurs : ${feeFacts.management.label} HT des loyers encaissés au titre des frais de gestion. À chaque vente d’immeuble, une commission de ${disposalRates} du montant de la vente s’applique, selon la plus-value réalisée. Avant ${zeroAfter} ans de détention, une commission de retrait de ${withdrawalRates} est prélevée sur la valeur de retrait.`,
      'Votre coût total n’est donc pas connu à la souscription. Si les ventes d’immeubles dégagent de fortes plus-values, ces commissions peuvent dépasser ce qu’aurait coûté une commission de souscription classique. Le document d’informations clés détaille l’incidence de l’ensemble des coûts sur votre investissement.',
    ],
  },
  {
    question: 'Les frais sur les achats d’immeubles, c’est quoi ?',
    riskFrom: 2,
    noteId: 'faq-frais-achats',
    answer: [
      'Quand une SCPI achète un immeuble, sa société de gestion peut prélever une commission sur le prix payé. Cette commission rémunère la recherche et l’acquisition du bien. Elle est supportée par la SCPI, donc indirectement par ses associés.',
      `Pour R Start, ces frais sont de ${feeFacts.acquisition.label}, ${feeFacts.acquisition.base}. Les frais d’intermédiation d’un agent immobilier sont eux aussi de ${feeFacts.broker.label}, comme les frais sur les travaux réalisés.`,
      `Ce taux ne signifie pas qu’un achat ne coûte rien à R Start : il porte sur la seule commission de la société de gestion. Celle-ci se rémunère ailleurs : ${feeFacts.management.label} HT des loyers encaissés, et ${disposalRates} du montant de chaque vente selon la plus-value réalisée.`,
      `Cette commission sur les cessions a des effets de seuil et peut capter une partie significative de la plus-value. Elle peut être perçue même si la valeur de vos parts a baissé. Une commission de retrait de ${withdrawalRates} de la valeur de retrait s’applique aussi avant ${zeroAfter} ans de détention.`,
    ],
  },
  {
    question: 'Combien coûte réellement la SCPI R Start ?',
    riskFrom: 1,
    answer: [
      `À la souscription : ${feeFacts.subscription.label} de frais de souscription. Sur les achats d’immeubles : ${feeFacts.acquisition.label} de frais. Pendant la détention : ${feeFacts.works.label} de frais sur les travaux réalisés et ${feeFacts.management.label} HT des loyers encaissés, au titre des frais de gestion.`,
      `À la revente d’un immeuble, une commission dépend de la plus-value réalisée : ${disposalTiers}. Elle est prélevée sur le montant de la vente. Cette commission a des effets de seuil et peut capter une partie significative de la plus-value. La société de gestion peut la percevoir même si la valeur de vos parts a baissé.`,
      `Si vous retirez vos parts avant ${zeroAfter} ans de détention, une commission de retrait dégressive s’applique sur la valeur de retrait : ${withdrawalSchedule}. ${withdrawalExemptions} ${feeFacts.vatNote} Le DIC détaille l’incidence de l’ensemble des coûts sur votre investissement.`,
    ],
  },
  {
    question: 'Pourquoi R Start n’affiche-t-elle pas d’objectif de rendement ?',
    riskFrom: 1,
    noteId: 'faq-objectif',
    answer: [
      `R Start a été créée le ${product.creationDate.label} : elle a moins de douze mois d’existence. Faute d’historique, elle n’affiche pas d’objectif de rendement, à la différence des autres SCPI du groupe CORUM. Aucune donnée de performance ne figure sur ce site.`,
      'Ce que vous percevrez dépendra des immeubles acquis, de leur location et de leur revente. Les revenus ne sont pas garantis : ils varient à la hausse comme à la baisse, selon le marché immobilier et le cours des devises.',
      `Le capital investi n’est pas garanti : vous pourriez perdre tout ou partie de votre investissement. Le patrimoine de R Start est en cours de constitution : tant qu’il compte peu d’immeubles, une vacance ou un impayé pèse davantage sur ses revenus. Durée de placement recommandée : ${risk.recommendedHoldingLabel}.`,
    ],
  },
  {
    question: 'Quand reçoit-on les premiers revenus avec R Start ?',
    riskFrom: 1,
    noteId: 'faq-jouissance',
    answer: [
      `Vos parts entrent en jouissance ${lowerFirst(income.enjoymentDate)}. C’est à partir de cette date qu’elles peuvent donner droit aux dividendes.`,
      'Les dividendes potentiels sont ensuite versés chaque mois. Cette fréquence mensuelle n’est pas une promesse de revenu. Les revenus ne sont pas garantis : ils varient à la hausse comme à la baisse, selon les loyers encaissés, le marché immobilier et le cours des devises.',
      `R Start a été créée en ${creationYear} et ne dispose pas d’historique propre. Aucune donnée de performance n’est présentée sur ce site. Ce que vous percevrez dépendra des immeubles acquis et de leur location.`,
    ],
  },
  {
    /** Complète la question précédente : celle-ci dit « quand », celle-ci explique le mécanisme et le vocabulaire. */
    question: 'Délai de jouissance et dividendes : comment ça marche ?',
    riskFrom: 2,
    noteId: 'faq-jouissance',
    answer: [
      `Le délai de jouissance sépare votre souscription de la date où vos parts donnent droit aux dividendes. Pour R Start, il est de ${income.enjoymentDelayLabel}.`,
      `Concrètement, vos parts entrent en jouissance ${lowerFirst(income.enjoymentDate)}. À partir de cette date, les dividendes potentiels sont versés chaque mois.`,
      'Avant cette date, vos parts ne donnent droit à aucun dividende. Votre épargne reste investie pendant ce délai, sans produire de revenu.',
      `Ensuite, la fréquence mensuelle n’est pas une promesse de revenu. Les dividendes ne sont pas garantis : ils varient à la hausse comme à la baisse, selon les loyers encaissés, le marché immobilier et le cours des devises. R Start ne dispose d’aucun historique de distribution et sa durée de placement recommandée est de ${risk.recommendedHoldingLabel}.`,
    ],
  },
  {
    question: 'Peut-on revendre ses parts de R Start ?',
    riskFrom: 1,
    answer: [
      `Oui. R Start est une SCPI à capital variable : vous pouvez demander le retrait de vos parts à tout moment, au prix de retrait en vigueur, actuellement ${withdrawalPriceLabel} par part. Le retrait n’est possible que si une souscription vient en contrepartie.`,
      `Le rachat de vos parts n’est pas garanti : c’est le risque de liquidité. Sans contrepartie, vous pourriez ne pas pouvoir vendre vos parts, ou devoir attendre. ${managementCompany.name} ne garantit pas le rachat de vos parts. Les modalités de sortie, retrait et cession, sont détaillées dans la note d’information.`,
      `Avant ${zeroAfter} ans de détention, une commission de retrait dégressive est prélevée sur la valeur de retrait : ${withdrawalSchedule}. ${withdrawalExemptions} R Start s’adresse aux épargnants qui visent le long terme : la durée de placement recommandée est de ${risk.recommendedHoldingLabel}.`,
    ],
  },
  {
    question: 'Quels sont les risques de la SCPI R Start ?',
    riskFrom: 0,
    noteId: 'faq-sri',
    answer: [
      'R Start est un investissement immobilier de long terme. Le capital investi n’est pas garanti : la valeur de vos parts peut baisser, et vous pourriez perdre tout ou partie de votre investissement. Les revenus ne sont pas garantis et varient selon le marché immobilier et le cours des devises.',
      `S’y ajoutent trois risques spécifiques. Le risque de liquidité : le rachat des parts n’est pas garanti. Le risque de change : R Start peut investir hors zone euro, sans couverture systématique. L’effet de levier : R Start peut recourir à l’endettement jusqu’à ${risk.maxLeverage} de la valeur d’expertise de ses actifs, ce qui amplifie les variations à la hausse comme à la baisse.`,
      `R Start est classée ${risk.sriLabel} sur l’indicateur synthétique de risque, une ${risk.sriClass}, dans son document d’informations clés du ${product.dicDate.label}. Cet indicateur suppose une détention de ${risk.recommendedHoldingLabel} et n’intègre ni le risque de change, ni le risque de liquidité, ni l’effet de levier. Enfin, la commission d’arbitrage a des effets de seuil et peut capter une partie significative de la plus-value.`,
    ],
  },
  {
    question: 'Quelle est la fiscalité des revenus de R Start ?',
    riskFrom: 2,
    noteId: 'faq-fiscalite',
    answer: [
      'Les revenus d’une SCPI sont imposables. Leur régime dépend de leur nature (loyers d’immeubles situés en France ou à l’étranger, produits financiers) et des conventions fiscales applicables. Il est décrit au chapitre IV de la note d’information.',
      `Seule la quote-part de produits financiers, issue des placements de trésorerie, supporte un prélèvement à la source obligatoire. Pour un associé personne physique résidant fiscalement en France, il est de ${income.withholdingTax}, hors prélèvements sociaux de ${income.socialContributions}. Ce prélèvement est un acompte d’impôt sur le revenu : il s’impute sur l’impôt dû et peut être restitué s’il le dépasse.`,
      'Votre imposition dépend de votre situation personnelle, de votre résidence fiscale et de la nature des revenus perçus. Elle peut évoluer dans le temps, et une hausse de la fiscalité réduirait le revenu net que vous conservez. Ce site ne fournit pas de conseil fiscal : rapprochez-vous de votre conseiller ou de l’administration fiscale avant de souscrire.',
      `Les taux cités (${income.withholdingTax} de prélèvement à la source, ${income.socialContributions} de prélèvements sociaux) sont ceux en vigueur à la date du bulletin de souscription, ${bulletinDate}, et peuvent évoluer. Les loyers d’immeubles situés à l’étranger relèvent des conventions fiscales conclues entre la France et chaque pays : leur traitement diffère d’un pays à l’autre et peut changer si ces conventions évoluent. La fiscalité ne modifie pas la nature du placement : les revenus ne sont pas garantis et le capital investi peut perdre de la valeur.`,
    ],
  },
  {
    question: 'Qui gère la SCPI R Start ?',
    riskFrom: 2,
    noteId: 'faq-corum-source',
    answer: [
      `R Start est gérée par ${managementCompany.name}, ${lowerFirst(managementCompany.amfApproval)} Le groupe CORUM gère des SCPI depuis ${corumGroup.scpiSince} et en compte ${corumGroup.scpiCount} au ${corumGroup.statsDate.label}. Le dépositaire de R Start est ${product.depositary}.`,
      `${publisher.name}, société du même groupe, distribue R Start et édite ce site. La souscription se déroule ${subscription.onlineLabel}.`,
      `L’expérience de CORUM sur ses autres SCPI ne préjuge pas des résultats de R Start. ${corumGroup.disposalsDisclaimer} Les autres SCPI du groupe sont distinctes de R Start : chacune a sa propre stratégie et ses propres frais. Les chiffres cités décrivent le groupe CORUM et sont sans lien avec les résultats futurs de R Start, SCPI récente, sans historique propre, dont les revenus et le capital ne sont pas garantis.`,
    ],
  },
  {
    /** Gamme complémentaire et éligibilité : brochure partenaires 2026, p. 5. */
    question: 'R Start remplace-t-elle les autres SCPI du groupe CORUM ?',
    riskFrom: 2,
    noteId: 'faq-gamme',
    answer: [
      'Non. R Start complète la gamme du groupe CORUM, elle ne la remplace pas. Les premières SCPI du groupe s’adressent aux épargnants qui recherchent des revenus potentiels réguliers et lisibles.',
      'R Start s’adresse à une stratégie patrimoniale plus dynamique, en contrepartie d’un risque plus élevé. Ses frais sont variables, quand ceux des premières SCPI du groupe sont forfaitaires.',
      'Ce risque plus élevé est réel. Le capital investi n’est pas garanti et sa valeur peut baisser : vous pourriez perdre tout ou partie de votre investissement. R Start n’affiche aucun objectif de rendement et ne dispose d’aucun historique propre.',
      `Les modalités diffèrent aussi. R Start se souscrit ${subscription.onlineLabel} : ${notEligibleNor}. Le ${lowerFirst(subscription.options.rd.name)} et le ${subscription.options.pei.name} restent proposés : ils ne réduisent ni le risque de perte en capital, ni la liquidité limitée des parts.`,
    ],
  },
  {
    question: 'Où investit R Start ?',
    riskFrom: 2,
    answer: [
      `R Start a vocation à constituer un patrimoine d’immeubles professionnels dans les pays du Conseil de l’Europe, en zone euro comme hors zone euro, et au Canada. Tous les types d’actifs sont possibles : ${strategyFacts.assetTypes.join(', ')}.`,
      `La stratégie privilégie la valorisation du patrimoine, selon la position de chaque pays dans son cycle immobilier et économique. En trois mots : ${lowerFirst(strategyFacts.motto)}. R Start cible des ${strategyFacts.targetAssetSize}, acquis construits ou en état futur d’achèvement, détenus directement ou indirectement.`,
      `Investir hors zone euro expose R Start au risque de change. La couverture n’est pas systématique. Le cours des devises influe sur la valeur des parts et sur les revenus. Une plus-value à la revente n’est jamais acquise d’avance ; une vente peut aussi générer une moins-value. Le recours à l’endettement, jusqu’à ${risk.maxLeverage} de la valeur d’expertise des actifs, amplifie ces variations.`,
      `Cette stratégie est un objectif, pas un résultat : la valeur des immeubles et leur loyer suivent les cycles immobiliers et économiques de chaque pays, à la baisse comme à la hausse. Un immeuble acheté en état futur d’achèvement ne produit pas de loyer avant sa livraison et peut être livré en retard ou rester inoccupé. Le patrimoine de R Start est en cours de constitution : tant qu’il compte peu d’immeubles, une vacance ou un impayé pèse davantage sur ses revenus.`,
    ],
  },
  {
    question: 'Comment souscrire à R Start en ligne ?',
    riskFrom: 2,
    answer: [
      `La souscription à R Start se fait ${subscription.onlineLabel}, à partir de ${share.minimumLabel}, soit ${share.minimumShares} part. Vous créez votre profil, signez en ligne, puis réglez par virement ou par prélèvement SEPA. Pièces à préparer : ${documentsList}.`,
      `Deux options sont proposées. Le ${subscription.options.pei.name}, pour des versements programmés à la fréquence de votre choix : mensuelle, trimestrielle, semestrielle ou annuelle. Le ${subscription.options.rd.name}, pour réinvestir automatiquement tout ou partie de vos dividendes. R Start n’est pas accessible en démembrement, en souscription papier ni via CORUM Life.`,
      `Avant de souscrire, lisez le document d’informations clés et la note d’information : ils décrivent les risques, les frais et les modalités de retrait. R Start est un placement de long terme, ${risk.recommendedHoldingLabel} recommandés, avec un risque de perte en capital et une liquidité limitée. Un retrait avant ${zeroAfter} ans de détention entraîne une commission dégressive.`,
      `Les versements programmés et le réinvestissement des dividendes ne réduisent pas ces risques : chaque part souscrite est exposée de la même manière à la perte en capital, à la variation des revenus et au risque de change, et sa revente dépend de l’existence d’une contrepartie. Les dividendes réinvestis ne sont pas garantis, pas plus que ceux des parts qu’ils permettent d’acquérir. Un placement programmé engage votre épargne dans la durée : vérifiez qu’il correspond à votre horizon et à votre capacité à supporter une perte.`,
    ],
  },
];

/**
 * Questions rendues sur l'accueil (allègement du 11/09/2026) : six questions, une par objectif de la page
 * (comprendre la SCPI, le modèle de frais, le coût réel, les revenus, qui gère, comment souscrire en ligne).
 * Les seize questions restent rendues en entier sur /documentation, qui porte la FAQ complète ; le contrôle
 * ci-dessous échoue au build si un libellé change, plutôt que de réduire la FAQ de l'accueil en silence.
 */
const HOME_FAQ = [
  'Qu’est-ce qu’une SCPI ?',
  'Pourquoi R Start affiche-t-elle 0 % de frais de souscription ?',
  'Combien coûte réellement la SCPI R Start ?',
  'Quand reçoit-on les premiers revenus avec R Start ?',
  'Qui gère la SCPI R Start ?',
  'Comment souscrire à R Start en ligne ?',
];
const homeItems = rawItems.filter((item) => HOME_FAQ.includes(item.question));
if (homeItems.length !== HOME_FAQ.length) {
  const manquantes = HOME_FAQ.filter((q) => !rawItems.some((item) => item.question === q));
  throw new Error(`faq.ts : questions de l’accueil introuvables — ${manquantes.join(' ; ')}`);
}

/** Notes appelées par les six questions de l'accueil ; `notes` reste complet pour /documentation. */
const idsAppeles = homeItems.map((item) => item.noteId).filter(Boolean);
export const homeNotes: LegalNote[] = notes.filter((n) => idsAppeles.includes(n.id));

export const faq = {
  eyebrow: 'FAQ',
  title: 'Vos questions sur la SCPI R Start.',
  intro:
    'Des réponses courtes et factuelles, issues des documents officiels de R Start. Elles ne remplacent pas la lecture du DIC et de la note d’information.',
  items: homeItems.map(({ question, answer, ...rest }) => ({
    ...rest,
    question: nb(question),
    answer: answer.map(nb),
  })),
  /** Les seize questions, pour /documentation (FAQ complète) : l'accueil n'en rend que six. */
  allItems: rawItems.map(({ question, answer, ...rest }) => ({
    ...rest,
    question: nb(question),
    answer: answer.map(nb),
  })),
  listLabel: 'Questions fréquentes sur R Start',
  /** Renvoi vers la FAQ complète : les dix autres questions vivent sur /documentation. */
  moreLink: { label: 'Toutes les questions', href: pages.documentation.path + '#faq' },
  cta: { label: 'Souscrire en ligne', position: 'faq' },
  notes,
} satisfies FaqContent;
