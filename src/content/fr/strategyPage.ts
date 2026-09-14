import type { Cta } from '@/content/types';
import type { PageHero, PageSeo } from '@/content/types-v2';
import { product } from '@/content/fr/facts';
import { shortRiskLine } from '@/content/fr/legal';

/**
 * Page /strategie, « Stratégie d'investissement » : métadonnées et en-tête. Le corps de la page tient
 * en trois chapitres (src/components/sections/04-Strategy.astro, contenu strategy.ts), sans note de
 * bas de page. Aucune donnée de performance.
 */
export const strategyPage: { seo: PageSeo; hero: PageHero; cta: Cta } = {
  seo: {
    /** ≤ 60 caractères. */
    title: 'Stratégie R Start, SCPI CORUM : investir dans le monde',
    /** 140-155 caractères, avec rappel de risque. */
    description:
      /* Réécrite le 14/09/2026 : l'ancienne annonçait « acheter décoté, valoriser, revendre », formule
         qui a quitté la page avec l'ancien contenu. Un résultat de recherche ne doit pas promettre un
         chapitre que la page ne contient plus. */
      'Stratégie de R Start, SCPI CORUM : deux moteurs, les loyers et les plus-values, partout dans le monde. Revenus non garantis, risque de perte en capital.',
  },
  /*
   * En-tête réduit au titre (14/09/2026) : l'équipe a fourni le contenu exact de la page, « ni plus ni
   * moins », et il commence par cette question. L'introduction qui annonçait cinq chapitres n'a plus
   * d'objet, la page n'en compte plus que trois, et le texte fourni n'en prévoit pas.
   */
  hero: {
    eyebrow: `Stratégie · SCPI ${product.name}`,
    title: 'Comment R Start investit l’argent de ses clients ?',
    riskLine: shortRiskLine,
  },
  /* Appel à l'action de la page (13/09/2026) : ni l'en-tête ni le corps n'en portaient, la page se
     lisait et s'arrêtait là. Même libellé que partout ailleurs. */
  cta: { label: 'Souscrire en ligne', position: 'strategie' },
};
