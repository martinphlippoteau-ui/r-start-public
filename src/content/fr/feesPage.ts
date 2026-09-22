import type { FeesPageContent } from '@/content/types-v2';
import { nb } from '@/lib/texte';

/**
 * Page /frais : l'en-tête (titre, introduction, `punchline` qui introduit le comparateur) et le
 * CTA. Le comparateur SCPI par SCPI, seul bloc de la page, a son contenu dans comparator.ts ; c'est
 * lui qui porte le « 15 % » que scripts/check-compliance.mjs exige sur cette page. Les anciens
 * blocs (barème, bande des « 0 % » et son contre-poids, frise du retrait, incidence des coûts du
 * DIC, bascule pédagogique, FAQ des frais, notes, mention HT) ont quitté le code le 22/09/2026
 * (décision de Martin, archivés hors du dépôt, .claude/audits). L'avertissement commission
 * d'arbitrage est reproduit sur /documentation.
 *
 * CE QU'IL FAUT SAVOIR CÔTÉ CONFORMITÉ, signalé à l'équipe le 14/09/2026 : « la seule SCPI qui »
 * est une allégation de rang SANS PÉRIMÈTRE et sur TOUT LE MARCHÉ, là où la brochure écrit « la
 * première SCPI DU GROUPE CORUM », exactement le type de formulation que l'AMF avait repris ; le
 * texte est rendu tel quel, c'est la décision de l'équipe, pas un oubli. Le contrôle le signale
 * sans le bloquer.
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

  /* En-tête du 14/09/2026, texte de l'équipe repris mot pour mot (voir l'en-tête du fichier). */
  hero: {
    /* Le titre dit ce que la page EST et reprend l'intitulé du menu (16/09/2026, texte de
       l'équipe). Plus aucun « gagnant-gagnant » sur cette page depuis. */
    title: nb('Comparateur de frais SCPI'),
    intro: nb(
      'R Start est la seule SCPI qui ne prélève ni frais de souscription, ni frais d’acquisition sur les achats d’immeubles.'
    ),
    /* Chute du 15/09/2026, texte de l'équipe : elle ne promet rien et envoie au comparateur, que
       frais.astro lui fait introduire (elle n'est pas rendue dans l'en-tête). */
    punchline: nb(
      'Comparez chaque ligne de frais de R Start avec les autres SCPI du marché grâce à notre comparateur.'
    ),
    /* Plus de ligne risques dans l'en-tête (14/09/2026, « supprime les bon à savoir de tous les
       hero sauf celui de la home ») ; reste le pied de page, commun à tout le site. */
  },

  cta: { label: 'Souscrire en ligne', position: 'frais' },
} satisfies FeesPageContent;
