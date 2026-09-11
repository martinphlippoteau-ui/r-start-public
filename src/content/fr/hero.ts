import type { HeroContent, LegalNote } from '@/content/types';
import { pages } from '@/config/pages';
import { fees, product } from '@/content/fr/facts';
import { shortRiskLine } from '@/content/fr/legal';

/**
 * Section 1 — Hero (id « apercu »), version minimale (décision du 10/09/2026, deux allègements successifs) :
 * H1 unique « R Start », pastille « Nouveau », accroche (facts.product.tagline), ligne risques importée de
 * legal.ts (jamais recopiée, jamais animée), deux CTA, photo plein cadre. Rien d'autre : ni définition, ni
 * frais, ni phrases pédagogiques — tout cela ouvre la zone 2 « Ce qui change vraiment » (difference.ts :
 * claim + pedagogy + counterweight), où l'allégation de rang est immédiatement suivie des frais réels,
 * dans le même bloc et à la même taille (règle AMF).
 */

/** Une seule note dans le hero : les frais réels (l'allégation bornée et son périmètre vivent en zone 2). */
/** Espace insécable avant % (typographie française). */
const nb = (t: string): string => t.replace(/ ([%€:;?!])/g, '\u00A0$1');

export const notes: LegalNote[] = [
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
   * Accroche de l'équipe marketing, reprise mot pour mot (décision du 11/09/2026, prise en connaissance
   * du risque). DEUX POINTS À DÉFENDRE, signalés en avertissement par scripts/check-compliance.mjs :
   *  - « la seule » est une allégation d'exclusivité sur TOUT le marché, sans périmètre ni preuve ; c'est
   *    précisément ce que l'AMF a fait borner sur la brochure (« la première SCPI DU GROUPE CORUM ») ;
   *  - « gagnant-gagnant » suggère un gain pour l'épargnant, alors que le capital n'est pas garanti et les
   *    revenus non plus.
   * Le contre-poids du hero (`riskLine`, juste sous les CTA) porte les frais réellement prélevés et la
   * ligne risques ; l'allégation bornée, elle, reste sur la page dans « Ce qui change vraiment ».
   */
  tagline: 'La seule SCPI Gagnant-Gagnant',
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
  /** CTA secondaire (11/09/2026) : il mène à la page Frais, seul accès au barème depuis l'accueil. */
  secondaryCta: {
    label: 'Comparer les frais',
    position: 'hero',
    href: pages.fees.path,
  },
  notes,
} satisfies HeroContent;
