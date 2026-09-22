import type { SeoContent } from '@/content/types';
import { product } from '@/content/fr/facts';
import { lowerFirst } from '@/lib/texte';

/**
 * SEO de l'accueil : titre, description, texte de l'image Open Graph et requêtes cibles
 * (`keywords`). Les sous-pages portent les leurs dans leur propre fichier de contenu (`seo`).
 *
 * « sans frais » n'apparaît jamais : l'intention « SCPI sans frais de souscription » est servie par
 * la formulation conforme « 0 % de frais de souscription » (scripts/check-compliance.mjs). Aucune
 * donnée de performance dans une balise ; chaque avantage cité y est contrebalancé.
 *
 * JSON-LD (src/lib/seo.ts, généré depuis content/fr, jamais en dur) : Organization, WebPage (about
 * InvestmentFund, keywords = `seo.keywords`) et FAQPage, strictement les questions visibles de
 * faq.ts. Interdits : Product, Offer, AggregateRating (signaux marchands trompeurs sur un produit
 * financier).
 */

export const seo = {
  /** ≤ 60 caractères, « R Start » et « CORUM » compris. « Frais d’entrée » : vocabulaire du DIC. Le
      0 % est contrebalancé ici par les 15 % de gestion et, dans la description, par le risque. */
  title: 'R Start, SCPI CORUM : 0 % de frais d’entrée, 15 % de gestion',
  /**
   * 140 à 155 caractères, avec rappel de risque. Le « 0 % » y est toujours accompagné des 15 % de gestion
   * et des commissions sur cessions et retraits (frais complets : le snippet est diffusé hors contexte).
   */
  description:
    'R Start, SCPI CORUM : 0 % de frais de souscription, 15 % de gestion, commissions sur cessions et retraits. Perte en capital et revenus non garantis.',
  ogImageAlt: `Logo R Start, ${lowerFirst(product.tagline)} de CORUM, sur un dégradé bleu marine et turquoise.`,
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
