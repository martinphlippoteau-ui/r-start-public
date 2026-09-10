import type { HeroContent, LegalNote } from '@/content/types';
import { sections } from '@/config/sections';
import { corumGroup, fees, product, share } from '@/content/fr/facts';
import { shortRiskLine, visaNotice } from '@/content/fr/legal';

/**
 * Section 1 — Hero (id « apercu »).
 * H1 unique « R Start », accroche de facts.product.tagline (« La SCPI nouvelle génération », brochure
 * partenaires 2026 p.1), ligne de définition avec appel de note (allégation de rang au périmètre du
 * groupe CORUM), deux phrases pédagogiques sur le moment du prélèvement, sous-titre allégé limité aux
 * frais réellement appliqués, et ligne risques importée de legal.ts (jamais recopiée, jamais animée,
 * même taille que le sous-titre).
 * Règle AMF : la définition annonce l'absence de frais d'entrée, le sous-titre qui la suit porte, dans
 * le même bloc et à la même taille, les frais réellement prélevés (gestion, cessions, retrait).
 */

/** Espace insécable avant % et € : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1');

export const notes: LegalNote[] = [
  {
    id: 'hero-definition',
    text: nb(`${product.definitionScope} Les cinq SCPI concernées : ${corumGroup.scpiNames.join(', ')}.`),
  },
  {
    id: 'hero-prix-de-part',
    text: nb(`Prix de souscription : ${share.priceLabel} par part, soit ${share.nominal} € de valeur nominale et ${share.premium} € de prime d’émission, dont 0 € de commission de souscription. Minimum de souscription : ${share.minimumShares} part. Source : bulletin de souscription R Start, conditions générales de vente, mai 2026.`),
  },
  {
    id: 'hero-visa',
    text: `${visaNotice} La note d’information est disponible sur www.corum.fr et dans la section Documents.`,
  },
  {
    id: 'hero-ouverture',
    text: `R Start a été créée le ${product.creationDate.label} et ouverte aux souscriptions le ${product.openingDate.label}. Son document d’informations clés (DIC) est daté du ${product.dicDate.label}.`,
  },
  {
    id: 'hero-frais',
    text: nb(
      `${fees.subscription.label} de frais de souscription et ${fees.acquisition.label} de frais d’acquisition. R Start applique en revanche ${fees.management.label} de frais de gestion, ${fees.management.base}, une commission sur les cessions d’immeubles (${fees.disposal.label} selon la plus-value) et une commission de retrait dégressive avant ${fees.withdrawal.zeroAfterYears} ans de détention. ${fees.vatNote} Détail dans la section Frais et dans la note d’information.`
    ),
  },
];

export const hero = {
  /** Surtitre informatif court : la nature juridique du produit (facts.product.type), jamais le nom, déjà dans le H1. */
  eyebrow: product.type,
  title: product.name,
  tagline: product.tagline,
  /** Allégation de rang autorisée, au périmètre du groupe CORUM : jamais affichée sans son appel de note. */
  definition: product.definition,
  definitionNoteId: 'hero-definition',
  /** Les deux phrases fournies par l'équipe produit : quand les frais sont prélevés, et quand ils ne le sont pas. */
  pedagogy: [
    nb('Payer des frais si notre travail vous fait gagner de l’argent : oui.'),
    nb('Payer avant même qu’on ait commencé à travailler : non.'),
  ],
  subtitle: nb(
    `R Start prélève ${fees.management.label} de frais de gestion sur les loyers. S’y ajoutent une commission sur les cessions d’immeubles (${fees.disposal.label}) et une commission de retrait avant ${fees.withdrawal.zeroAfterYears} ans. À partir de ${share.minimumLabel}.`
  ),
  riskLine: shortRiskLine,
  primaryCta: { label: 'Souscrire en ligne', position: 'hero' },
  secondaryCta: {
    label: 'Découvrir R Start',
    position: 'hero',
    href: `#${sections.highlights.id}`,
  },
  notes,
} satisfies HeroContent;
