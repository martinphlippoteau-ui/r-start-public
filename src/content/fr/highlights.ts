import type { HighlightsContent } from '@/content/types';
import { income, risk, share, subscription } from '@/content/fr/facts';
import { pages } from '@/config/pages';
import { nb } from '@/lib/texte';

/**
 * Section « R Start en un clin d'œil » (id « points-forts »), tableau du document de l'équipe du
 * 14/09/2026 repris au plus près : six cartes, puis, à part, la souscription 100 % en ligne et les
 * deux options automatiques (brochure partenaires 2026, p. 3, 5 et 7). Aucun chiffre en dur : tout
 * vient de facts.ts.
 *
 * CE QU'IL FAUT SAVOIR CÔTÉ CONFORMITÉ. Toutes les valeurs sont celles du document (demande
 * explicite de le respecter à la lettre), deux s'écartent des documents de référence :
 *  - « Niveau de risque 4/7 » : le DIC dit 3 sur 7 ; facts.risk porte l'écart, aucune phrase du
 *    site n'attribue cette valeur au DIC, et scripts/check-compliance.mjs ne vérifie que la
 *    cohérence avec facts.ts, pas l'écart lui-même ;
 *  - « Approche : Diversifiée » : mot de la brochure, alors que R Start n'a pas encore de
 *    patrimoine à diversifier et peut être concentrée au démarrage (strategy.ts, pilier « Où ») ;
 *    le contrôle le signale en avertissement à chaque exécution.
 * Aucune carte ne porte plus de contre-poids risque ni de note légale (source et limite de chaque
 * valeur) : retirés le 14/09/2026 à la demande de l'équipe, les textes ont quitté le code le
 * 22/09/2026 (archivés hors du dépôt, .claude/audits). Reste la section Risques, plus bas.
 */

/*
 * Type DÉCLARÉ et non `satisfies` : `intro` est facultative et absente d'ici ; avec `satisfies`, le
 * type déduit est celui du littéral, et le composant qui lit `highlights.intro` ne compilait plus.
 */
export const highlights: HighlightsContent = {
  /* Vers /documentation depuis le 22/09/2026 (demande de Martin), ex-« Découvrir notre approche »
     vers /strategie : après les repères, on renvoie aux documents qui les fondent. */
  secondaryCta: { label: 'Consultez la documentation', href: pages.documentation.path },
  /* Le bouton « i » ne montre qu'une lettre : ce libellé est ce que les lecteurs d'écran annoncent,
     complété par celui de la carte (« Expliquer : Approche »). */
  labels: { info: 'Expliquer' },
  title: 'R Start en un clin d’œil',
  cards: [
    { label: 'Ticket d’entrée', value: nb(share.priceLabel) },
    { label: 'Niveau de risque', value: risk.sriLabel },
    /** income.frequency vaut « Mensuelle » ; accordé ici au libellé (« revenus »). */
    { label: 'Revenus potentiels', value: 'Mensuels' },
    /* Explications dépliables (15/09/2026, textes de l'équipe) : « Diversifiée » nomme un mandat,
       pas une caractéristique observable, un mot ne suffit pas à le rendre. Ce ne sont pas des
       notes légales (voir l'en-tête). */
    {
      label: 'Approche',
      value: 'Diversifiée',
      info: 'R Start investit dans tous secteurs, toutes zones géographiques et tous types d’immeubles pour ne pas dépendre d’une seule source de performance.',
    },
    {
      /*
       * « Horizon d'investissement » remplace « Zone d'investissement » (16/09/2026, demande de
       * l'équipe), à DIX ANS (« mets à jour à 10 ans partout ») : la carte a dit « 8 ans minimum »
       * le temps d'une journée, seule contradiction du site avec le DIC, la FAQ et les mentions
       * légales. La valeur vient de `risk.recommendedHoldingLabel`, pas d'un chiffre en dur ni de
       * `fees.withdrawal.zeroAfterYears` : les huit ans du barème de retrait sont autre chose, et
       * confondre les deux laisserait croire qu'on peut sortir sans frais après huit ans ET que
       * c'est la durée conseillée. Une communication commerciale ne peut pas contredire le DIC.
       */
      label: 'Horizon d’investissement',
      value: nb(risk.recommendedHoldingLabel),
      /* Texte de l'équipe, 16/09/2026. La dernière phrase de la phrase fournie était interrompue
         (« les revenus ne sont pas garantis et le prix. ») : elle est complétée par la formule employée
         partout ailleurs sur le site, le prix de la part varie à la hausse comme à la baisse. */
      info: 'La durée de placement recommandée dans une SCPI est de 10 ans. Comme un investissement immobilier en direct, l’investissement en SCPI présente un risque de perte en capital, les revenus ne sont pas garantis et le prix de la part peut varier à la hausse comme à la baisse. Les performances passées ne préjugent pas des performances futures.',
    },
    {
      label: 'Délai de jouissance',
      /*
       * « 1er jour du 6e mois » (15/09/2026, demande de l'équipe) plutôt que le « 6 mois » de la
       * brochure p. 3 : la RÈGLE du bulletin de souscription, plus précise, le délai n'étant pas de
       * six mois pleins pour tout le monde. « 6e » et non « 6ème », abréviation correcte de
       * l'ordinal.
       */
      value: nb(income.enjoymentShort),
      /* Explication dépliable (16/09/2026, texte de l'équipe). « 1er jour du 6e mois » dit QUAND,
         pas POURQUOI : c'est le temps qu'il faut à la SCPI pour investir l'argent collecté. */
      info: 'Période d’attente entre votre investissement et le moment où vous commencez à percevoir des revenus. Le délai de jouissance correspond au temps nécessaire à la SCPI pour investir l’argent collecté.',
    },
    /* Pas de ligne « 100 % Digital » (14/09/2026, demande de l'équipe) : « Souscription : 100 % en
       ligne », juste en dessous, dit la même chose à sa place. */
  ],
  /**
   * À part : la façon de souscrire et ce qu'on peut automatiser, pas des caractéristiques du
   * produit.
   */
  subscriptionTitle: 'Souscription et options disponibles',
  subscriptionItems: [
    { label: 'Souscription', value: nb(subscription.onlineLabel) },
    {
      label: 'Versements automatiques',
      value: nb(`dès ${subscription.options.pei.minimumMonthlyLabel}`),
    },
    { label: 'Réinvestissement automatique', value: 'des dividendes' },
  ],
};
