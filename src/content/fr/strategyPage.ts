import type { Cta } from '@/content/types';
import type { PageHero, PageSeo } from '@/content/types-v2';

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
   * En-tête réduit AU SEUL TITRE (14/09/2026). L'équipe a fourni le contenu exact de la page, « ni plus
   * ni moins », et il commence par cette question : l'introduction qui annonçait cinq chapitres n'a plus
   * d'objet, la page n'en compte plus que trois.
   *
   * PAS DE LIGNE RISQUES NON PLUS, demande expresse de l'équipe (« ne crée pas de bon à savoir »). Elle
   * portait la mention courte de legal.ts, en « Bon à savoir : … », sous le H1 de toutes les sous-pages.
   * La page s'est ainsi trouvée sans aucune mention de risque en propre ; ce n'est plus le cas :
   * elle rend en fin de page le bloc Risques de l'accueil (08-Risks.astro, voir strategie.astro,
   * même jour), en plus du pied de page (« Communication commerciale », renvoi au DIC et à la note
   * d'information), présent partout.
   */
  hero: {
    /* « R Start : une approche inédite au service de la performance » depuis le 16/09/2026, texte
       de l'équipe. L'en-tête posait une question, « Comment R Start investit l'argent de ses
       clients ? » ; il annonce maintenant le propos. */
    title: 'R Start : une approche inédite au service de la performance',
    /*
     * CHUTE AJOUTÉE LE 15/09/2026, texte fourni par l'équipe. L'en-tête n'avait qu'un titre.
     * L'espace avant le deux-points est une INSÉCABLE (U+00A0) écrite à la main : ce fichier ne passe
     * pas par le `nb()` de feesPage.ts, et sans elle « : nos choix » peut partir seul à la ligne.
     */
    punchline: 'On ouvre le capot\u00A0: nos choix qui font la différence',
  },
  /* Appel à l'action de la page (13/09/2026) : ni l'en-tête ni le corps n'en portaient, la page se
     lisait et s'arrêtait là. Même libellé que partout ailleurs. */
  cta: { label: 'Souscrire en ligne', position: 'strategie' },
};
