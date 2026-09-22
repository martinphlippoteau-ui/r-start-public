import type { PageHero, PageSeo } from '@/content/types-v2';
import type { Cta } from '@/content/types';
import { corumGroup, product } from '@/content/fr/facts';

/**
 * Page /a-propos, la société de gestion : métadonnées, en-tête et appel à l'action. Le corps (bande
 * illustrée, chiffres du groupe, gamme des autres SCPI) vient de trust.ts et corumRange.ts.
 */
export const aboutPage: { seo: PageSeo; hero: PageHero; cta: Cta } = {
  seo: {
    /** ≤ 60 caractères. */
    title: 'À propos de CORUM, société de gestion de R Start',
    /** 140-155 caractères, avec rappel de risque. */
    description: `CORUM gère des SCPI depuis ${corumGroup.scpiSince} et en compte ${corumGroup.scpiCount}, dont ${product.name}. Cette expérience ne préjuge pas des résultats. Risque de perte en capital.`,
  },
  /* En-tête du 14/09/2026, texte de l'équipe repris mot pour mot. Deux paragraphes d'introduction,
     que PageHero rend l'un sous l'autre, dans la même taille. */
  hero: {
    /* Titre du 16/09/2026, texte de l'équipe. */
    title: 'R Start, une innovation signée CORUM',
    intro: [
      'On ne part pas d’une feuille blanche…',
      `R Start s’appuie sur ${corumGroup.experienceLabel} d’expertise du groupe CORUM dans l’investissement immobilier.`,
    ],
    /* Plus de ligne risques dans l'en-tête (14/09/2026, « supprime les bon à savoir de tous les
       hero sauf celui de la home ») ; restent les mentions du contenu et le pied de page. */
  },
  cta: { label: 'Souscrire en ligne', position: 'a-propos' },
};
