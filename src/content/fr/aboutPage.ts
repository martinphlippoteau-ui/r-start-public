import type { PageHero, PageSeo } from '@/content/types-v2';
import type { Cta, LegalNote } from '@/content/types';
import { notes as corumNotes } from '@/content/fr/corum';
import { corumGroup, product } from '@/content/fr/facts';

/**
 * Page /a-propos, la société de gestion : métadonnées, en-tête, appel à l'action et notes. Ses
 * blocs suivaient « Le groupe CORUM en chiffres » sur l'accueil jusqu'au 11/09/2026 ; ils ont
 * changé depuis : l'ambiance des bureaux est devenue une bande illustrée (15/09/2026), la gamme des
 * cinq SCPI une grille des quatre autres SCPI en chiffres, sans R Start (corumRange.ts,
 * 16/09/2026). Les notes sont celles de corum.ts, filtrées sur une liste QUI N'EST PLUS À JOUR :
 * `corum-savoir-faire` et `corum-gamme` ne sont plus appelées par aucun bloc, et
 * `confiance-trustpilot`, appelée par les avis du bas de page, n'y figure pas. Sans effet à l'écran
 * tant que les notes sont coupées (AFFICHER = false dans NoteRef et LegalNotes) ; à revoir avant de
 * les rétablir.
 */
export const aboutPage: { seo: PageSeo; hero: PageHero; notes: LegalNote[]; cta: Cta } = {
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
       savoir de tous les hero sauf celui de la home »). Le « Bon à savoir : … » sous le H1 a disparu de
       TOUTES les sous-pages ; celui de l'accueil, gardé ce jour-là, ne s'affiche plus non plus
       depuis que RiskNote ne rend plus rien (même jour). Ces pages n'ont donc plus de mention de
       risque dans leur en-tête : il reste celles de leur contenu quand elles en ont, et le pied de
       page, commun à tout le site. Pour la rétablir, `riskLine: shortRiskLine` ici ne suffit plus :
       la page doit aussi la passer à PageHero (`riskLine={hero.riskLine}`), et RiskNote doit rendre
       de nouveau. */
  },
  /** Notes de la page : liste d'identifiants périmée, voir l'en-tête du fichier. */
  notes: corumNotes.filter((note) =>
    ['confiance-chiffres', 'corum-savoir-faire', 'corum-gamme'].includes(note.id)
  ),
  /* Appel à l'action de la page (13/09/2026) : elle n'en portait aucun. */
  cta: { label: 'Souscrire en ligne', position: 'a-propos' },
};
