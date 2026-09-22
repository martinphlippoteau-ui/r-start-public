import type { HeroContent, LegalNote } from '@/content/types';
import { pages } from '@/config/pages';
import { fees, product } from '@/content/fr/facts';

/**
 * Section 1, Hero (id « apercu »), version minimale (décision du 10/09/2026, deux allègements successifs) :
 * surtitre (`eyebrow`), H1 unique « R Start » (texte masqué, le logo en tient lieu à l'écran),
 * accroche (`tagline`), deux CTA, puis le bandeau Trustpilot et la mention de la société de gestion
 * agréée (trust.ts). La pastille « Nouveau » et la photo plein cadre ont été retirées le
 * 11/09/2026, la ligne risques le 14/09/2026 avec tous les « Bon à savoir » (le champ `riskLine` a
 * quitté le code le 22/09/2026). Rien d'autre : ni définition, ni frais, ni phrases pédagogiques, tout cela ouvre la
 * zone 2 « Qui a envie de payer avant de gagner ? » (difference.ts). L'allégation de rang (`claim`,
 * retirée le 15/09/2026) et le contre-poids chiffré des frais (`counterweight.risk`, EN VEILLE) n'y
 * sont plus rendus.
 */

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
   * Premier temps de l'ouverture (11/09/2026) : la signature de l'annonceur, rendue en grand au-dessus du
   * logo. La nature juridique du produit (facts.product.type) reste dans les données structurées et les
   * mentions légales.
   */
  /* « CORUM invente » depuis le 16/09/2026, ex-« CORUM invente la SCPI ». */
  eyebrow: 'CORUM invente',
  title: product.name,
  /**
   * Accroche de l'équipe marketing, reprise mot pour mot. CHANGÉE LE 15/09/2026 : elle disait
   * « L'immobilier gagnant-gagnant », dont le « gagnant-gagnant » suggérait un gain alors que le
   * capital n'est pas garanti.
   *
   * CE QUI REMPLACE UN POINT À DÉFENDRE PAR UN AUTRE, et il faut que la Conformité le sache :
   *  - la partie « sans frais de souscription ni frais d'acquisition » est EXACTE et bornée, elle
   *    nomme les deux frais absents au lieu de laisser entendre qu'il n'y en a aucun ;
   *  - « LA PREMIÈRE SCPI » n'a pas de périmètre. C'est l'allégation de rang que
   *    scripts/check-compliance.mjs signale déjà ailleurs, faute de source, de date et de marché de
   *    référence. La même page portait deux sections plus bas la version bornée, « la première SCPI
   *    DU GROUPE CORUM sans frais d'entrée ni frais sur les achats d'immeubles » ; elle a été
   *    retirée le 15/09/2026 (voir difference.ts) : l'accueil ne porte plus que la formulation non
   *    bornée.
   * Le détail des frais réellement prélevés était à un clic, dans la note `hero-frais` ; il ne
   * l'est plus, la note n'étant plus rendue (registre de l'accueil vide, NoteRef coupé). Les frais
   * restent affichés sur l'accueil par le comparateur de la section 03.
   */
  /* Sans point final depuis le 17/09/2026 (demande de Martin) : une accroche, pas une phrase. */
  tagline: 'La première SCPI sans frais de souscription ni frais d’acquisition',
  /*
   * PLUS DE CONTRE-POIDS au premier écran depuis le 14/09/2026. À défendre en compliance : l'accroche
   * annonce une absence de frais d'entrée et les frais réellement prélevés ne sont plus énoncés au
   * même endroit, ni même en note ; les 15 % de frais de gestion restent sur l'accueil par le
   * comparateur de frais (section 03).
   */
  primaryCta: { label: 'Souscrire en ligne', position: 'hero' },
  /**
   * CTA secondaire (11/09/2026) : il mène à la page Frais. Ce n'est plus le seul accès aux frais
   * depuis l'accueil : la pastille flottante mène aussi à /frais, et le comparateur est affiché sur
   * la page même depuis le 15/09/2026 (section 03).
   */
  secondaryCta: {
    label: 'Comparer les frais',
    href: pages.fees.path,
  },
  /**
   * Invitation à descendre, dans le vide sous le bandeau Trustpilot. Le libellé est VISIBLE depuis le
   * 11/09/2026, au-dessus du chevron : il nomme le lien pour tout le monde, à l'écran comme au clavier.
   */
  scrollHint: { label: 'Découvrir R Start' },
} satisfies HeroContent;
