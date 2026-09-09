import type { LegalNote, StrategyContent } from '@/content/types';
import { corumGroup, product, risk, strategy as strategyFacts } from '@/content/fr/facts';

/**
 * Section 4 — Stratégie (id « strategie »).
 * « Acheter décoté, valoriser, revendre » (facts.strategy.motto) avec son contre-poids visible
 * (mottoRisk : intention de gestion, cessions passées des SCPI CORUM ne préjugeant pas de l'avenir),
 * deux leviers, trois piliers avec leur contre-poids, zone Conseil de l'Europe + Canada (risque de
 * change), types d'actifs du DIC, effet de levier (endettement jusqu'à 40 %) contrebalancé dans le
 * même bloc.
 */

/** Espace insécable avant % et € : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, '\u00A0$1');
/** Apostrophe typographique (’) : certains libellés de facts.ts sont saisis avec l'apostrophe droite. */
const typo = (s: string): string => nb(s.replace(/'/g, '’'));
const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);
const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export const notes: LegalNote[] = [
  {
    id: 'strategie-objectif',
    text: `Objectif de R Start selon le DIC du ${product.dicDate.label} : constituer un patrimoine de biens immobiliers au sein des pays du Conseil de l’Europe (en zone euro et hors zone euro) et au Canada, dans le cadre d’une « ${typo(lowerFirst(strategyFacts.approach))} ».`,
  },
  {
    id: 'strategie-actifs',
    text: `Types d’actifs cités par le DIC, sans que la liste soit limitative : ${strategyFacts.assetTypes.map(typo).join(', ')}. ${capitalize(strategyFacts.acquisitionModes)}.`,
  },
  {
    id: 'strategie-endettement',
    text: `R Start peut recourir à l’endettement dans la limite de ${nb(risk.maxLeverage)} de la valeur d’expertise de ses actifs immobiliers, majorée des fonds collectés nets de frais non encore investis. Le montant maximum de l’emprunt est voté en assemblée générale. Source : DIC du ${product.dicDate.label}.`,
  },
  {
    id: 'strategie-mot-d-ordre',
    text: `« ${strategyFacts.motto} » est la formule de la brochure R Start 2026. Elle décrit une intention de gestion, non un résultat. ${corumGroup.disposalsDisclaimer}`,
  },
  {
    id: 'strategie-sfdr',
    text: `Classification extra-financière : ${product.sfdr}. Les informations relatives à la durabilité figurent dans la note d’information. Source : DIC du ${product.dicDate.label}.`,
  },
];

export const strategy = {
  eyebrow: 'Stratégie',
  title: 'De l’immobilier en Europe et au Canada.',
  /**
   * Affiché en très grand juste avant l'introduction, qui le commente (« C’est le mot d’ordre… »).
   * Optionnel dans le type, mais requis pour cette section : sans lui, l'introduction serait orpheline.
   */
  motto: strategyFacts.motto,
  intro: `C’est le mot d’ordre de R Start. Deux leviers sont visés, les loyers distribués et les plus-values réalisées. Son approche est plus dynamique que celle des autres SCPI CORUM, en contrepartie d’un risque plus élevé.`,
  /** Contre-poids du mot d'ordre, affiché sous l'introduction dans la même taille (jamais animé). */
  mottoRisk: `Cette formule décrit une intention de gestion, non un résultat. ${corumGroup.disposalsDisclaimer}`,
  leversTitle: 'Deux leviers',
  levers: [
    {
      title: strategyFacts.levers[0],
      description:
        'Les loyers encaissés sur les immeubles alimentent, après frais de gestion, les dividendes potentiels versés chaque mois. Ils ne sont pas garantis et varient avec le marché.',
    },
    {
      title: strategyFacts.levers[1],
      description:
        'Un immeuble revendu plus cher qu’il n’a été acheté peut dégager une plus-value, après commission sur la cession. Une revente peut aussi se solder par une moins-value.',
    },
  ],
  pillarsTitle: 'Trois piliers',
  pillars: [
    {
      icon: 'analyse',
      title: 'Une stratégie opportuniste',
      description:
        'R Start vise à acheter des immeubles décotés, à les valoriser, puis à les revendre. Elle tient compte de la position de chaque pays dans son cycle immobilier et économique.',
      risk: 'R Start est récente et n’a pas d’historique propre. Une valorisation n’est jamais acquise : un immeuble peut se revendre moins cher que son prix d’achat.',
    },
    {
      icon: 'equipe',
      title: 'Des immeubles de taille intermédiaire',
      description:
        'Les équipes de gestion ciblent des immeubles de taille intermédiaire. Ils sont achetés construits ou en état futur d’achèvement, détenus directement ou indirectement.',
      risk: 'Un immeuble en état futur d’achèvement ne produit aucun loyer avant sa livraison. Un actif livré peut ensuite rester vacant ou perdre de la valeur.',
    },
    {
      icon: 'exploration',
      title: 'Une zone d’investissement étendue',
      description:
        'R Start investira là où ses équipes identifient des opportunités. Elle peut le faire dans les pays du Conseil de l’Europe et au Canada, tous secteurs confondus.',
      risk: 'Le patrimoine se constitue au fil des collectes. Au démarrage, il peut être concentré sur peu d’immeubles, de pays ou de secteurs, ce qui accroît le risque.',
    },
  ],
  zone: {
    title: typo(strategyFacts.zoneLabel),
    description:
      'R Start peut investir dans les pays du Conseil de l’Europe, en zone euro ou non, et au Canada. Le choix des pays dépend de leur position dans le cycle immobilier et économique.',
    countriesLabel: 'Pays où R Start peut investir',
    risk: 'Hors zone euro, vos revenus et la valeur de vos parts dépendent aussi du cours des devises. La couverture de change n’est pas systématique : une devise qui baisse face à l’euro réduit ce que vous percevez.',
  },
  assetTypesLabel: 'Types d’actifs visés, liste non limitative',
  /** Libellés du DIC (minuscules dans facts.ts) : majuscule initiale et apostrophe typographique pour l'affichage. */
  assetTypes: strategyFacts.assetTypes.map((type) => capitalize(typo(type))),
  leverageTitle: 'L’effet de levier',
  leverage: {
    advantage:
      'R Start peut recourir à l’emprunt. Cet effet de levier lui permet d’acheter plus d’immeubles que sa seule collecte ne le permettrait. Elle peut ainsi saisir une opportunité sans attendre.',
    risk: `L’endettement peut atteindre ${nb(risk.maxLeverage)} de la valeur des immeubles. Il amplifie les pertes comme les gains. Si les prix baissent, la valeur de vos parts recule davantage et les intérêts restent dus.`,
  },
  notes,
} satisfies StrategyContent;
