import type { HeroContent, LegalNote } from '@/content/types';
import { sections } from '@/config/sections';
import { product } from '@/content/fr/facts';
import { shortRiskLine } from '@/content/fr/legal';

/**
 * Section 1 — Hero (id « apercu »), version minimale (décision du 10/09/2026, deux allègements successifs) :
 * H1 unique « R Start », pastille « Nouveau », accroche (facts.product.tagline), ligne risques importée de
 * legal.ts (jamais recopiée, jamais animée), deux CTA, photo plein cadre. Rien d'autre : ni définition, ni
 * frais, ni phrases pédagogiques — tout cela ouvre la zone 2 « Ce qui change vraiment » (difference.ts :
 * claim + pedagogy + counterweight), où l'allégation de rang est immédiatement suivie des frais réels,
 * dans le même bloc et à la même taille (règle AMF).
 */

/** Plus aucune note dans le hero : la définition et ses frais vivent dans difference.ts (difference-definition). */
export const notes: LegalNote[] = [];

export const hero = {
  /** Surtitre informatif court : la nature juridique du produit (facts.product.type), jamais le nom, déjà dans le H1. */
  eyebrow: product.type,
  /** Pastille « Nouveau » : R Start est ouverte aux souscriptions depuis 2026 (facts.product.openingDate). */
  badge: 'Nouveau',
  title: product.name,
  tagline: product.tagline,
  /** Règle AMF : la définition annonce l'absence de frais d'entrée, cette ligne porte, dans le même bloc et à la même taille, les frais réellement prélevés. */
  /**
   * Claim de l'équipe marketing, repris mot pour mot et rendu en deux temps (énoncé, puis réponse) :
   * décision du 11/09/2026, à défendre en compliance — lecture stricte : les frais de gestion sont
   * prélevés sur les loyers encaissés, y compris quand la valeur des parts baisse. Le contre-poids
   * chiffré est porté par la zone 2 (« Ce qui change vraiment ») et par la section Frais qui la suit.
   */
  claims: [
    { text: 'Payer des frais si notre travail vous fait gagner de l’argent', answer: 'Oui !' },
    { text: 'Payer avant même qu’on ait commencé à travailler', answer: 'Non !' },
  ],
  riskLine: shortRiskLine,
  primaryCta: { label: 'Souscrire en ligne', position: 'hero' },
  secondaryCta: {
    label: 'Découvrir R Start',
    position: 'hero',
    href: `#${sections.highlights.id}`,
  },
  notes,
} satisfies HeroContent;
