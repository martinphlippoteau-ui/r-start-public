import type { FeesPageContent } from '@/content/types-v2';
import { nb } from '@/lib/texte';

/**
 * Page /frais : l'en-tête (titre, introduction, `punchline` qui introduit le comparateur) et le
 * CTA. Le comparateur SCPI par SCPI, seul bloc de la page, a son contenu dans comparator.ts.
 *
 * TOUT LE RESTE A QUITTÉ LE CODE LE 22/09/2026 (décision de Martin, archivé hors du dépôt,
 * .claude/audits/archive-contenus-2026-09-22.json) : les anciens blocs de la page, retirés de
 * l'écran entre le 11 et le 16/09/2026 sans être réaffichés depuis : barème des frais, bande des
 * trois « 0 % » et son contre-poids, frise de la commission de retrait, mécanisme de réserve,
 * incidence des coûts du DIC, bascule pédagogique et moyennes de marché de la brochure, document de
 * référence, FAQ des frais, notes et mention HT. Les taux eux-mêmes restent affichés par le
 * comparateur, ligne par ligne ; c'est lui qui porte le « 15 % » que scripts/check-compliance.mjs
 * exige sur cette page. L'avertissement commission d'arbitrage est reproduit sur /documentation.
 */

export const feesPage = {
  seo: {
    /** ≤ 60 caractères. Aucun « 0 % » isolé : le titre s'affiche seul (onglet, partages). */
    title: nb('Frais R Start, SCPI CORUM : gestion, cessions et retrait'),
    /** 140-155 caractères : le « 0 % » y est accompagné des 15 %, des 0 / 6 / 12 % et des 10 à 3 %, puis du rappel de risque. */
    description: nb(
      'Frais de R Start, SCPI CORUM : 0 % à l’entrée, 15 % de gestion, 0, 6 ou 12 % sur les cessions, 10 à 3 % au retrait avant 8 ans. Risque de perte en capital.'
    ),
  },

  /*
   * En-tête réécrit le 14/09/2026, texte fourni par l'équipe et repris mot pour mot. Il remplace
   * « Comparer et comprendre les frais de R Start » et son introduction, qui décrivait le barème.
   *
   * DEUX POINTS À FAIRE VALIDER PAR LA CONFORMITÉ, signalés à l'équipe le jour même :
   *  - « la seule SCPI qui » est une allégation de rang SANS PÉRIMÈTRE et sur TOUT LE MARCHÉ. La
   *    brochure, elle, écrit « la première SCPI DU GROUPE CORUM sans frais d'entrée ni frais sur les
   *    achats d'immeubles » : le périmètre y est dans la phrase. C'est
   *    exactement le type de formulation que l'AMF avait repris sur la brochure ;
   *  - « gagnant-gagnant » est dans la liste « à défendre en compliance » de check-compliance.mjs
   *    (suggère un gain alors que le capital n'est pas garanti). Le contrôle le signale, il ne le
   *    bloque pas.
   * Le texte est rendu tel quel : c'est la décision de l'équipe, pas un oubli.
   */
  hero: {
    /*
     * « Comparateur de frais SCPI » depuis le 16/09/2026, texte de l'équipe. Le titre disait « Un modèle
     * de frais gagnant-gagnant » ; il dit maintenant ce que la page EST, et reprend l'intitulé du menu,
     * passé à « Comparateur de frais » le 15/09.
     * Il emporte au passage la DERNIÈRE occurrence de « gagnant-gagnant » sur cette page, que
     * scripts/check-compliance.mjs signalait (« suggère un gain, capital non garanti ») : l'autre était
     * partie avec la chute du hero le 15/09.
     * (« inédit » était descendu en zone 3, sur le barème, retiré de la page le même jour.)
     */
    title: nb('Comparateur de frais SCPI'),
    intro: nb(
      'R Start est la seule SCPI qui ne prélève ni frais de souscription, ni frais d’acquisition sur les achats d’immeubles.'
    ),
    /*
     * CHUTE REMPLACÉE LE 15/09/2026, texte fourni par l'équipe. L'ancienne disait « En clair : nous, on
     * ne touche rien tant que vous n'avez pas gagné d'argent. C'est gagnant-gagnant. » La nouvelle ne
     * promet plus rien et envoie au comparateur, qui est l'outil de la page.
     * Au passage, elle retire l'une des deux occurrences de « gagnant-gagnant » que le contrôle de
     * conformité signalait sur cette page (« suggère un gain, capital non garanti »). L'autre était
     * dans le titre, parti à son tour le 16/09/2026 (voir ci-dessus).
     * Depuis le 16/09/2026, cette phrase n'est plus dans l'en-tête : frais.astro la passe au
     * comparateur, qu'elle introduit.
     */
    punchline: nb(
      'Comparez chaque ligne de frais de R Start avec les autres SCPI du marché grâce à notre comparateur.'
    ),
    /* Plus de ligne risques dans l'en-tête (14/09/2026, demande de l'équipe : « supprime les bon à
       savoir de tous les hero sauf celui de la home »). Le « Bon à savoir : … » sous le H1 a
       disparu de TOUTES les sous-pages, puis de l'accueil le même jour. Il reste le pied de page,
       commun à tout le site. */
  },

  cta: { label: 'Souscrire en ligne', position: 'frais' },
} satisfies FeesPageContent;
