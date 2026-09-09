import type { HeroContent, LegalNote } from '@/content/types';
import { sections } from '@/config/sections';
import { fees, product, share } from '@/content/fr/facts';
import { shortRiskLine, visaNotice } from '@/content/fr/legal';

/**
 * Section 1 — Hero (id « apercu »).
 * H1 unique « R Start », accroche validée (facts.product.tagline), sous-titre en trois phrases et ligne
 * risques importée de legal.ts (jamais recopiée, jamais animée, même taille que le sous-titre).
 */

/** Espace insécable avant % et € : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, '\u00A0$1');

export const notes: LegalNote[] = [
  {
    id: 'hero-prix-de-part',
    text: `Prix de souscription : ${nb(share.priceLabel)} par part, soit ${share.nominal} € de valeur nominale et ${share.premium} € de prime d’émission, dont 0 € de commission de souscription. Minimum de souscription : ${share.minimumShares} part. Source : bulletin de souscription R Start, conditions générales de vente, mai 2026.`,
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
    text: `${nb(fees.subscription.label)} de frais de souscription et ${nb(fees.acquisition.label)} de frais d’acquisition. R Start applique en revanche ${nb(fees.management.label)} de frais de gestion, ${fees.management.base}, une commission sur les cessions d’immeubles (${nb(fees.disposal.label)} selon la plus-value) et une commission de retrait dégressive avant ${fees.withdrawal.zeroAfterYears} ans de détention. Frais exprimés hors taxes, égaux au montant TTC. Détail dans la section Frais et dans la note d’information.`,
  },
];

export const hero = {
  /** Surtitre informatif court : la nature juridique du produit (facts.product.type), jamais le nom, déjà dans le H1. */
  eyebrow: product.type,
  title: product.name,
  tagline: product.tagline,
  subtitle: `${nb(fees.subscription.label)} de frais de souscription et d’acquisition. ${nb(fees.management.label)} de frais de gestion sur les loyers, commissions sur les cessions d’immeubles et sur les retraits avant ${fees.withdrawal.zeroAfterYears} ans. À partir de ${nb(share.minimumLabel)}.`,
  riskLine: shortRiskLine,
  primaryCta: { label: 'Souscrire en ligne', position: 'hero' },
  secondaryCta: {
    label: 'Découvrir R Start',
    position: 'hero',
    href: `#${sections.highlights.id}`,
  },
  notes,
} satisfies HeroContent;
