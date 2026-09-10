import type { SeoContent } from '@/content/types';
import { product, share } from '@/content/fr/facts';

/**
 * Stratégie SEO du site one-page R Start (FR).
 *
 * Requêtes cibles (par ordre de priorité) :
 *  1. « SCPI R Start »                       → title, H1 + H2 hero, H2 FAQ, JSON-LD WebPage.about
 *  2. « R Start CORUM » / « SCPI CORUM »     → title, H2 hero, H2 corum, JSON-LD Organization
 *  3. « SCPI sans frais de souscription »    → intention servie UNIQUEMENT par la formulation conforme
 *                                              « 0 % de frais de souscription » (title, H2 frais, FAQ 2 et 3).
 *                                              « sans frais » ne doit jamais apparaître sur la page (legal.ts).
 *  4. « nouvelle SCPI 2026 » / « SCPI nouvelle génération » → H2 hero, description, notes (visa, ouverture)
 *  5. « SCPI 200 euros »                     → H2 points forts, description, FAQ 10
 *  6. « SCPI distribution mensuelle »        → H2 revenus, FAQ 4
 *  7. « SCPI Europe Canada »                 → H2 stratégie, FAQ 9
 *  8. « souscrire SCPI en ligne »            → H2 souscrire, FAQ 10
 *  9. « frais SCPI R Start »                 → H2 frais, FAQ 3
 *
 * Règles : H1 unique « R Start » ; un H2 par section, ≤ 8 mots, un chiffre maximum ; aucune donnée de
 * performance ; chaque avantage cité dans une balise est contrebalancé dans le bloc correspondant.
 *
 * JSON-LD attendu de l'intégrateur (généré depuis content/fr, jamais en dur) :
 *  - Organization : CORUM L'Épargne (legal.publisher), logo, sameAs corum.fr, contactPoint (téléphone, e-mail).
 *  - WebPage : name = seo.title, description = seo.description, inLanguage « fr »,
 *    about = { @type: 'InvestmentFund', name: 'R Start' }, keywords = seo.keywords.
 *  - FAQPage : strictement les questions/réponses visibles de faq.ts.
 *  Interdits : Product, Offer, AggregateRating (signaux marchands trompeurs sur un produit financier).
 */
/** Minuscule sur la seule initiale : `toLowerCase()` abîmerait le sigle SCPI de l'accroche. */
const lowerFirst = (value: string): string => value.charAt(0).toLowerCase() + value.slice(1);

export const seo = {
  /** ≤ 60 caractères. Contient « R Start » et « CORUM ». « Frais d’entrée » : vocabulaire du DIC (« coûts d’entrée », 0 %). */
  title: 'R Start, SCPI CORUM : 0 % de frais d’entrée, 15 % de gestion',
  /**
   * 140 à 155 caractères, avec rappel de risque. Le « 0 % » y est toujours accompagné des 15 % de gestion
   * et des commissions sur cessions et retraits (frais complets : le snippet est diffusé hors contexte).
   */
  description:
    'R Start, SCPI CORUM : 0 % de frais de souscription, 15 % de gestion, commissions sur cessions et retraits. Perte en capital et revenus non garantis.',
  ogImageAlt:
    `Logo R Start, ${lowerFirst(product.tagline)} de CORUM, sur un dégradé bleu marine et turquoise.`,
  /**
   * Requêtes cibles, formulées comme les internautes les tapent, dans le respect du vocabulaire autorisé.
   * Usage : JSON-LD WebPage.keywords et suivi de positionnement. Google ignore <meta name="keywords">.
   */
  keywords: [
    'SCPI R Start',
    'R Start CORUM',
    'SCPI CORUM',
    'nouvelle SCPI 2026',
    'SCPI nouvelle génération',
    'SCPI 0 % de frais de souscription',
    'SCPI 0 % de frais d’acquisition',
    'SCPI 200 euros',
    'SCPI distribution mensuelle',
    'SCPI Europe Canada',
    'souscrire SCPI en ligne',
    'frais SCPI R Start',
  ],
} satisfies SeoContent;

/**
 * Proposition de H2 par section, à reprendre (ou adapter) dans le champ `title` de chaque fichier de
 * contenu. Style Apple : phrase courte terminée par un point, un chiffre au plus, aucune performance.
 * Clés = SectionKey (src/config/sections.ts), hors « notes ».
 */
export const seoH2: Record<string, string> = {
  /** Sous le H1 « R Start ». Reprend l’accroche de facts.product.tagline. */
  hero: `${product.tagline} de CORUM.`,
  /** Requête « SCPI 200 euros ». Les 4 cartes portent chacune leur contre-poids. */
  highlights: `L’immobilier à partir de ${share.minimumLabel}.`,
  /** Formulation autorisée, à contrebalancer immédiatement par `counterweight` (15 % de gestion, cessions, retrait). */
  fees: '0 % de frais de souscription.',
  /** Requête « SCPI Europe Canada ». Le mot d’ordre « Acheter décoté, valoriser, revendre » vit dans l’intro. */
  strategy: 'De l’immobilier en Europe et au Canada.',
  /** Requête « SCPI distribution mensuelle ». « Potentiels » est indispensable : revenus non garantis. */
  income: 'Des revenus potentiels chaque mois.',
  /** Requête « souscrire SCPI en ligne ». */
  subscribe: 'Souscrire à R Start, 100 % en ligne.',
  /** Requête « SCPI CORUM ». Fait sourcé (facts.corumGroup.scpiSince), sans « expertise » ni superlatif. */
  corum: 'CORUM gère des SCPI depuis 2012.',
  /** Même poids visuel que les sections avantages. */
  risks: 'Investir dans R Start comporte des risques.',
  /** DIC, note d’information, statuts, bulletin. */
  documents: 'Les documents à lire avant de souscrire.',
  /** Requête « SCPI R Start ». */
  faq: 'Vos questions sur la SCPI R Start.',
};

/**
 * Les 10 questions de la FAQ, dans l’ordre d’affichage, formulées comme les internautes les tapent.
 * Aucune question ne porte sur la performance (rendement, taux de distribution, TRI, scénarios).
 * Chaque réponse doit rester équilibrée : l’avantage et son risque dans le même paragraphe.
 * Sert aussi de base au JSON-LD FAQPage (strictement les Q/R visibles).
 */
export const faqQuestions: string[] = [
  'Qu’est-ce qu’une SCPI ?',
  'Pourquoi R Start affiche-t-elle 0 % de frais de souscription ?',
  'Combien coûte réellement la SCPI R Start ?',
  'Quand reçoit-on les premiers revenus avec R Start ?',
  'Peut-on revendre ses parts de R Start ?',
  'Quels sont les risques de la SCPI R Start ?',
  'Quelle est la fiscalité des revenus de R Start ?',
  'Qui gère la SCPI R Start ?',
  'Où investit R Start ?',
  'Comment souscrire à R Start en ligne ?',
];
