import type { PageHero, PageSeo } from '@/content/types-v2';
import { product } from '@/content/fr/facts';
import { shortRiskLine } from '@/content/fr/legal';

/**
 * Page /strategie, « Stratégie d'investissement » : métadonnées et en-tête. Le corps de la page est la
 * section Stratégie de l'accueil rendue en entier (src/components/sections/04-Strategy.astro, contenu
 * strategy.ts), avec ses notes propres. Aucune donnée de performance, aucune promesse de résultat.
 */
export const strategyPage: { seo: PageSeo; hero: PageHero } = {
  seo: {
    /** ≤ 60 caractères. */
    title: 'Stratégie R Start, SCPI CORUM : Europe et Canada',
    /** 140-155 caractères, avec rappel de risque. */
    description:
      'Stratégie de R Start, SCPI CORUM : acheter décoté, valoriser, revendre en Europe et au Canada. Revenus non garantis, risque de perte en capital.',
  },
  hero: {
    eyebrow: `Stratégie · SCPI ${product.name}`,
    title: 'Stratégie d’investissement',
    intro:
      'R Start achète des immeubles décotés, les valorise puis les revend, en Europe et au Canada. Cette page détaille ses deux leviers, ses trois piliers, sa zone d’investissement, les types d’actifs visés et le recours à l’emprunt.',
    riskLine: shortRiskLine,
  },
};
