import type { HeroContent } from '@/content/types';
import { pages } from '@/config/pages';
import { product } from '@/content/fr/facts';

/**
 * Section 1, Hero (id « apercu »), version minimale : surtitre (`eyebrow`), H1 unique « R Start »
 * (texte masqué, le logo en tient lieu), accroche (`tagline`), deux CTA, puis le bandeau Trustpilot
 * et la mention de la société de gestion agréée (trust.ts). Rien d'autre : ni définition, ni frais,
 * ni ligne risques (retirée le 14/09/2026 avec tous les « Bon à savoir »).
 *
 * CE QU'IL FAUT SAVOIR CÔTÉ CONFORMITÉ : l'accroche « LA PREMIÈRE SCPI » est une allégation de rang
 * sans périmètre, faute de source, de date et de marché de référence, que
 * scripts/check-compliance.mjs signale ; la version bornée (« du groupe CORUM ») a quitté l'accueil
 * le 15/09/2026. Le premier écran n'a plus de contre-poids : les frais réellement prélevés ne sont
 * plus énoncés au même endroit ni en note, seuls les 15 % de gestion restent sur l'accueil par le
 * comparateur.
 */

export const hero = {
  /* Signature de l'annonceur, en grand au-dessus du logo (texte de l'équipe, 16/09/2026). La
     nature juridique du produit (facts.product.type) reste dans les données structurées. */
  eyebrow: 'CORUM invente',
  title: product.name,
  /* Accroche réécrite le 22/09/2026 (demande de Martin) : « frais d'entrée » et « frais d'achat
     sur les immeubles » remplacent les termes réglementaires « frais de souscription » et « frais
     d'acquisition ». Exact et borné (les deux frais absents sont nommés) ; « la première SCPI »
     reste l'allégation de rang de l'en-tête. Sans point final (17/09/2026, demande de Martin) :
     une accroche, pas une phrase. */
  tagline: 'La première SCPI sans frais d’entrée ni frais d’achat sur les immeubles',
  primaryCta: { label: 'Souscrire en ligne', position: 'hero' },
  /** Vers /frais ; la pastille flottante y mène aussi, et le comparateur est sur l'accueil. */
  secondaryCta: {
    label: 'Comparer les frais',
    href: pages.fees.path,
  },
  /** Invitation à descendre, sous le bandeau Trustpilot ; libellé VISIBLE au-dessus du chevron, il
      nomme le lien pour tout le monde, à l'écran comme au clavier. */
  scrollHint: { label: 'Découvrir R Start' },
} satisfies HeroContent;
