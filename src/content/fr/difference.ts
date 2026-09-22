import type { DifferenceContent } from '@/content/types-v2';
import { pages } from '@/config/pages';
import { nb } from '@/lib/texte';

/**
 * Section 2, « Qui a envie de payer avant de gagner ? » (zone 2 de la V2 ; « Pourquoi
 * gagnant-gagnant ? » jusqu'au 15/09/2026). Titre et copie fournis par l'équipe et repris tels
 * quels. DEUX POINTS À ARBITRER EN COMPLIANCE, tous deux signalés en avertissement par
 * scripts/check-compliance.mjs pour rester traçables :
 *  1. « nous, on ne touche rien tant que vous n'avez pas gagné d'argent », inexact en lecture stricte :
 *     les frais de gestion sont prélevés sur les loyers encaissés, y compris quand la valeur des parts
 *     baisse ; la société de gestion peut donc se rémunérer alors que l'épargnant est en perte ;
 *  2. « La première SCPI sans frais d'entrée ni frais d'acquisition », allégation de rang SANS périmètre
 *     de marché. Elle a quitté cette section le 15/09/2026 (voir `counterweight`), mais sa forme
 *     non bornée reste dans l'accroche du hero, que le contrôle signale toujours. Le périmètre (les
 *     cinq SCPI du groupe CORUM) n'est plus porté nulle part.
 * Explique quand la société de gestion se rémunère, sans jamais promettre de résultat : les deux
 * situations (les loyers encaissés puis redistribués, la plus-value réalisée à la vente) et la
 * conclusion de l'équipe. Le mécanisme de réserve en cas de moins-value (brochure partenaires 2026,
 * p.4) n'est plus rendu depuis le 11/09/2026 ; le contre-poids chiffré des frais réellement prélevés,
 * retiré de l'écran le même jour, a quitté le code le 22/09/2026 (archivé hors du dépôt).
 * Exactitude de la formule d'alignement : les 15 % de frais de gestion sont prélevés sur les loyers
 * encaissés, y compris quand la valeur des parts baisse. La règle était donc d'écrire « se rémunère
 * sur les loyers encaissés et les plus-values réalisées, jamais sur le montant que vous versez »,
 * et jamais « nous ne touchons rien tant que vous n'avez pas gagné d'argent », qui est faux ; la
 * conclusion de l'équipe l'écrit pourtant presque mot pour mot, d'où le point 1 ci-dessus.
 * Garde-fous : aucune donnée de performance, aucun exemple d'investissement. Aucun avantage de la
 * section ne porte plus son risque à l'écran.
 */

export const difference = {
  /** Titre et copie fournis par l'équipe le 11/09/2026, repris tels quels (deux points à défendre en
   *  compliance, signalés en avertissement par scripts/check-compliance.mjs, voir l'en-tête du fichier). */
  /*
   * TITRE ET SOUS-TITRE PERMUTÉS ET RÉÉCRITS le 15/09/2026, texte de l'équipe. C'était
   * « Pourquoi gagnant-gagnant ? » en titre et « Qui a envie de payer avant de gagner ? » dessous ;
   * la question passe en titre, et le sous-titre nomme le modèle.
   */
  title: 'Qui a envie de payer avant de gagner ?',
  intro: 'R Start, un modèle de frais gagnant-gagnant',
  /* « de la SCPI R Start » depuis le 17/09/2026, texte de l'équipe. */
  lead: 'Quand vous détenez des parts de la SCPI R Start, on ne vous prélève des frais que dans deux situations :',
  /** Les deux situations, en liste. `strong` est le mot mis en valeur par le gabarit. */
  situations: [
    { text: 'Quand elle encaisse des loyers qu’elle vous redistribue', strong: 'loyers' },
    {
      text: 'Quand elle réalise une plus-value sur la vente d’immeubles',
      strong: 'plus-value',
    },
  ],
  counterweight: {
    /**
     * Conclusion de l'équipe, reprise mot pour mot (11/09/2026). À DÉFENDRE EN COMPLIANCE : en lecture
     * stricte elle est inexacte, les frais de gestion sont prélevés sur les loyers encaissés, y compris
     * quand la valeur des parts baisse, donc la société de gestion peut se rémunérer alors que l'épargnant
     * est en perte. Le contre-poids chiffré prévu pour la suivre a quitté l'écran le 11/09/2026 et le
     * code le 22/09/2026 (archivé hors du dépôt, .claude/audits), comme l'allégation de rang bornée
     * (« la première SCPI DU GROUPE CORUM… », retirée le 15/09/2026) : l'accueil ne porte plus que
     * l'allégation non bornée de l'accroche du hero.
     */
    pedagogy: [
      nb(
        'En clair : nous, on ne touche rien tant que vous n’avez pas gagné d’argent. C’est gagnant-gagnant.'
      ),
    ],
  },
  /**
   * Lien vers /frais, porté par la pastille flottante (components/StickyCta.astro, rendue par
   * index.astro) et par elle seule : le libellé nomme donc sa destination en entier, « le
   * comparateur » tout court ne disait pas de quoi. Il a été le seul accès aux frais depuis
   * l'accueil (11/09/2026 : la section Frais avait quitté la page) ; il ne l'est plus : le CTA
   * secondaire du hero mène aussi à /frais, et le comparateur est revenu sur l'accueil le
   * 15/09/2026 (section 03).
   */
  cta: { label: 'Voir le comparateur de frais', href: pages.fees.path },
  /*
   * APPEL À L'ACTION DANS LE BLOC RETIRÉ le 16/09/2026 au soir, demande de l'équipe (« supprime le
   * "Voir notre comparateur de frais" du premier bloc de la home »). Il vivait ici depuis le 15/09 en
   * bouton discret sous la démonstration ; la pastille flottante (`cta` ci-dessus) mène déjà au
   * comparateur, et la section suivante l'affiche en entier. Le gabarit teste la propriété : rien
   * d'autre à défaire. Pour rétablir :
   * `secondaryCta: { label: 'Voir notre comparateur de frais', href: pages.fees.path }`.
   */
} satisfies DifferenceContent;
