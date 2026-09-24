import type { Cta } from '@/content/types';
import type { PageHero, PageSeo } from '@/content/types-v2';

/**
 * Page /strategie : métadonnées et en-tête. Le corps est dans strategy.ts (04-Strategy.astro), sans
 * note de bas de page. Aucune donnée de performance.
 */
export const strategyPage: { seo: PageSeo; hero: PageHero; cta: Cta } = {
  seo: {
    /** ≤ 60 caractères. */
    title: 'Stratégie R Start, SCPI CORUM : investir dans le monde',
    /** 140-155 caractères, avec rappel de risque. */
    description:
      /* Un résultat de recherche ne doit pas promettre un chapitre que la page ne contient plus. */
      'Stratégie de R Start, SCPI CORUM : deux moteurs, les loyers et les plus-values, partout dans le monde. Revenus non garantis, risque de perte en capital.',
  },
  /*
   * En-tête sans introduction (14/09/2026, contenu de l'équipe « ni plus ni moins ») ni ligne
   * risques (demande expresse : « ne crée pas de bon à savoir ») : la page rend en fin de page le
   * bloc Risques de l'accueil (08-Risks.astro, voir strategie.astro), en plus du pied de page
   * présent partout.
   */
  hero: {
    /* Titre du 24/09/2026 (Martin), raccourci : « au service de la performance » retiré. */
    title: 'R Start : une approche inédite',
    /* Chute du 24/09/2026 (Martin). L'espace avant le point d'exclamation est une INSÉCABLE
       (U+00A0) écrite à la main : ce fichier n'a pas de `nb()`. */
    punchline: 'On ouvre le capot\u00A0!',
  },
  cta: { label: 'Souscrire en ligne', position: 'strategie' },
};
