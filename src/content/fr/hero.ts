import type { HeroContent, LegalNote } from '@/content/types';
import { sections } from '@/config/sections';
import { corumGroup, fees, product } from '@/content/fr/facts';
import { shortRiskLine } from '@/content/fr/legal';

/**
 * Section 1 — Hero (id « apercu »), version minimale (décision du 10/09/2026, deux allègements successifs) :
 * H1 unique « R Start », pastille « Nouveau », accroche (facts.product.tagline), ligne risques importée de
 * legal.ts (jamais recopiée, jamais animée), deux CTA, photo plein cadre. Rien d'autre : ni définition, ni
 * frais, ni phrases pédagogiques — tout cela ouvre la zone 2 « Ce qui change vraiment » (difference.ts :
 * claim + pedagogy + counterweight), où l'allégation de rang est immédiatement suivie des frais réels,
 * dans le même bloc et à la même taille (règle AMF).
 */

/** Le hero porte de nouveau l'allégation de rang et ses frais (11/09/2026) : deux notes, périmètre et frais. */
/** Espace insécable avant % (typographie française). */
const nb = (t: string): string => t.replace(/ ([%€:;?!])/g, '\u00A0$1');

export const notes: LegalNote[] = [
  {
    id: 'hero-definition',
    text: nb(
      `${product.definitionScope} Les cinq SCPI concernées : ${corumGroup.scpiNames.join(', ')}.`
    ),
  },
  {
    id: 'hero-frais',
    text: nb(
      `${fees.subscription.label} de frais de souscription et ${fees.acquisition.label} de frais d’acquisition. R Start applique en revanche ${fees.management.label} de frais de gestion, ${fees.management.base}, une commission sur les cessions d’immeubles (${fees.disposal.label} selon la plus-value) et une commission de retrait dégressive avant ${fees.withdrawal.zeroAfterYears} ans de détention. ${fees.vatNote} Détail dans la section Frais.`
    ),
  },
];

export const hero = {
  /**
   * Surtitre (11/09/2026) : il porte l'objectif « comprendre que tout est digital », le moins bien servi
   * de la page. La nature juridique du produit (facts.product.type) reste dans les données structurées et
   * les mentions légales. À défendre en compliance : ce sont la souscription et le suivi qui sont 100 %
   * en ligne, pas la SCPI elle-même ; la carte « en ligne » et le chapitre « Souscrire » le précisent.
   */
  eyebrow: nb('SCPI 100 % digitale'),
  /** Pastille « Nouveau » : R Start est ouverte aux souscriptions depuis 2026 (facts.product.openingDate). */
  badge: 'Nouveau',
  title: product.name,
  /**
   * Accroche : l'allégation de rang, BORNÉE au périmètre du groupe CORUM (facts.product.definition).
   * « La première SCPI sans frais d'entrée » sans ce périmètre est refusée par scripts/check-compliance.mjs
   * (deux règles : « première SCPI » hors périmètre, et « sans frais » non qualifié) — c'est un retour AMF
   * déjà appliqué à la brochure. Elle n'est jamais affichée sans son appel de note (le périmètre : les cinq
   * SCPI du groupe) ni sans `subtitle`, qui porte les frais réellement prélevés dans le même bloc.
   */
  tagline: product.definition,
  taglineNoteId: 'hero-definition',
  /**
   * Contre-poids unique du hero (11/09/2026) : les frais réellement prélevés OUVRENT le bloc « Bon à
   * savoir », suivis de la ligne risques de legal.ts, reproduite mot pour mot et jamais réécrite.
   * Règle AMF : l'accroche annonce une absence de frais, ce bloc porte les frais réels juste dessous.
   * À défendre en compliance : il est rendu dans la taille du contre-poids, plus petite que l'accroche.
   */
  riskLine: nb(
    `R Start prélève ${fees.management.label} de frais de gestion sur les loyers, une commission sur les ventes d’immeubles et une commission de retrait avant ${fees.withdrawal.zeroAfterYears} ans. ${shortRiskLine}`
  ),
  riskNoteId: 'hero-frais',
  primaryCta: { label: 'Souscrire en ligne', position: 'hero' },
  secondaryCta: {
    label: 'Découvrir R Start',
    position: 'hero',
    href: `#${sections.highlights.id}`,
  },
  notes,
} satisfies HeroContent;
