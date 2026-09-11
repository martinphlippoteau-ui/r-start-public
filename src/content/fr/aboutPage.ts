import type { PageHero, PageSeo } from '@/content/types-v2';
import type { LegalNote } from '@/content/types';
import { notes as corumNotes } from '@/content/fr/corum';
import { corumGroup, product } from '@/content/fr/facts';
import { shortRiskLine } from '@/content/fr/legal';

/**
 * Page /a-propos — la société de gestion : métadonnées, en-tête, et les blocs qui suivaient « Le groupe
 * CORUM en chiffres » sur l'accueil jusqu'au 11/09/2026 (ambiance des bureaux, gamme des cinq SCPI).
 * Les notes sont celles de corum.ts, filtrées sur celles réellement appelées ici.
 */
export const aboutPage: { seo: PageSeo; hero: PageHero; notes: LegalNote[] } = {
  seo: {
    /** ≤ 60 caractères. */
    title: 'À propos de CORUM, société de gestion de R Start',
    /** 140-155 caractères, avec rappel de risque. */
    description: `CORUM gère des SCPI depuis ${corumGroup.scpiSince} et en compte ${corumGroup.scpiCount}, dont ${product.name}. Cette expérience ne préjuge pas des résultats. Risque de perte en capital.`,
  },
  hero: {
    eyebrow: 'CORUM',
    title: 'À propos de CORUM',
    intro: `CORUM gère des SCPI depuis ${corumGroup.scpiSince}. ${product.name} est la plus récente de la gamme : elle a ouvert ses souscriptions le ${product.openingDate.label} et n’a pas encore d’historique propre. Les résultats des autres SCPI du groupe ne préjugent pas des siens.`,
    riskLine: shortRiskLine,
  },
  /** Seules les notes appelées par les blocs de cette page. */
  notes: corumNotes.filter((note) => note.id === 'corum-gamme'),
};
