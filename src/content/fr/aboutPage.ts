import type { PageHero, PageSeo } from '@/content/types-v2';
import type { Cta } from '@/content/types';
import { corumGroup, product } from '@/content/fr/facts';

/**
 * Page /a-propos, la société de gestion : métadonnées, en-tête et appel à l'action. Ses blocs
 * suivaient « Le groupe CORUM en chiffres » sur l'accueil jusqu'au 11/09/2026 ; ils ont changé
 * depuis : l'ambiance des bureaux est devenue une bande illustrée (15/09/2026), la gamme des cinq
 * SCPI une grille des quatre autres SCPI en chiffres, sans R Start (corumRange.ts, 16/09/2026).
 */
export const aboutPage: { seo: PageSeo; hero: PageHero; cta: Cta } = {
  seo: {
    /** ≤ 60 caractères. */
    title: 'À propos de CORUM, société de gestion de R Start',
    /** 140-155 caractères, avec rappel de risque. */
    description: `CORUM gère des SCPI depuis ${corumGroup.scpiSince} et en compte ${corumGroup.scpiCount}, dont ${product.name}. Cette expérience ne préjuge pas des résultats. Risque de perte en capital.`,
  },
  /*
   * En-tête réécrit le 14/09/2026, texte fourni par l'équipe et repris mot pour mot. Il remplace
   * « À propos de CORUM » et son introduction, qui rappelait que R Start n'a pas d'historique.
   * Deux paragraphes : l'accroche, puis ce sur quoi R Start s'appuie. PageHero les rend l'un sous
   * l'autre, dans la même taille.
   */
  hero: {
    /* « R Start, une innovation signée CORUM » depuis le 16/09/2026, texte de l'équipe.
       L'ancien titre, « L'expérience derrière R Start », a servi jusqu'à la veille au bloc CORUM de
       l'accueil, qui porte désormais « Le groupe CORUM en quelques chiffres » : plus de doublon. */
    title: 'R Start, une innovation signée CORUM',
    intro: [
      'On ne part pas d’une feuille blanche…',
      `R Start s’appuie sur ${corumGroup.experienceLabel} d’expertise du groupe CORUM dans l’investissement immobilier.`,
    ],
    /* Plus de ligne risques dans l'en-tête (14/09/2026, demande de l'équipe : « supprime les bon à
       savoir de tous les hero sauf celui de la home », puis celui de l'accueil le même jour). Il
       reste les mentions de risque du contenu, quand il en porte, et le pied de page, commun à tout
       le site. */
  },
  /* Appel à l'action de la page (13/09/2026) : elle n'en portait aucun. */
  cta: { label: 'Souscrire en ligne', position: 'a-propos' },
};
