import type { PageHero, PageSeo } from '@/content/types-v2';
import type { Cta, LegalNote } from '@/content/types';
import { notes as corumNotes } from '@/content/fr/corum';
import { corumGroup, product } from '@/content/fr/facts';

/**
 * Page /a-propos, la société de gestion : métadonnées, en-tête, et les blocs qui suivaient « Le groupe
 * CORUM en chiffres » sur l'accueil jusqu'au 11/09/2026 (ambiance des bureaux, gamme des cinq SCPI).
 * Les notes sont celles de corum.ts, filtrées sur celles réellement appelées ici.
 */
export const aboutPage: { seo: PageSeo; hero: PageHero; notes: LegalNote[]; cta: Cta } = {
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
    /* Plus de ligne risques dans l'en-tête (14/09/2026, demande de l'équipe : « supprime les bon à
       savoir de tous les hero sauf celui de la home »). Le « Bon à savoir : … » sous le H1 a disparu de
       TOUTES les sous-pages ; seul l'accueil le garde, sous ses appels à l'action. Ces pages n'ont donc
       plus de mention de risque dans leur en-tête : il reste celles de leur contenu quand elles en ont,
       et le pied de page, commun à tout le site. À rétablir en remettant `riskLine: shortRiskLine`. */
  },
  /** Seules les notes appelées par les blocs de cette page. */
  notes: corumNotes.filter((note) =>
    ['confiance-chiffres', 'corum-savoir-faire', 'corum-gamme'].includes(note.id)
  ),
  /* Appel à l'action de la page (13/09/2026) : elle n'en portait aucun. */
  cta: { label: 'Souscrire en ligne', position: 'a-propos' },
};
