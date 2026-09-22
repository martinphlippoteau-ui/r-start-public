import type { DifferenceContent } from '@/content/types-v2';
import type { LegalNote } from '@/content/types';
import { pages } from '@/config/pages';
import { corumGroup, fees as feeFacts, product } from '@/content/fr/facts';
import { arbitrageWarningBullets } from '@/content/fr/legal';

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
 *     cinq SCPI du groupe CORUM) n'est plus porté nulle part : la note `difference-definition`
 *     n'est plus appelée.
 * Explique quand la société de gestion se rémunère, sans jamais promettre de résultat : les deux
 * situations (les loyers encaissés puis redistribués, la plus-value réalisée à la vente) et la
 * conclusion de l'équipe. Le mécanisme de réserve en cas de moins-value (brochure partenaires 2026,
 * p.4) n'est plus rendu depuis le 11/09/2026, et le contre-poids chiffré des frais réellement
 * prélevés (`counterweight.risk`) est EN VEILLE.
 * Exactitude de la formule d'alignement : les 15 % de frais de gestion sont prélevés sur les loyers
 * encaissés, y compris quand la valeur des parts baisse. La règle était donc d'écrire « se rémunère
 * sur les loyers encaissés et les plus-values réalisées, jamais sur le montant que vous versez »,
 * et jamais « nous ne touchons rien tant que vous n'avez pas gagné d'argent », qui est faux ; la
 * conclusion de l'équipe l'écrit pourtant presque mot pour mot, d'où le point 1 ci-dessus.
 * Garde-fous : aucune donnée de performance, aucun exemple d'investissement. Toutes les valeurs
 * viennent de facts.fees ; la deuxième puce de la commission d'arbitrage est reproduite à
 * l'identique depuis legal.ts (dans `counterweight.risk`). L'allégation de rang
 * (facts.product.definition), qui ouvrait le bloc du contre-poids avec son périmètre en note et les
 * frais réels juste après, est retirée ; aucun avantage de la section ne porte plus son risque à
 * l'écran.
 */

/** Espace insécable avant % et € : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1');

const zeroAfter = feeFacts.withdrawal.zeroAfterYears;

/** Notes dans l'ordre de leur premier appel dans la section. */
export const notes: LegalNote[] = [
  {
    id: 'difference-definition',
    /**
     * Cette note est le PÉRIMÈTRE de l'allégation affichée juste au-dessus, que l'équipe a voulue courte
     * (« La première SCPI sans frais d'entrée ni frais d'acquisition. »). Elle ouvre donc sur la
     * formulation bornée exacte, « la première SCPI DU GROUPE CORUM… », avant d'en donner la portée :
     * sans elle, l'accueil ne porterait plus que la version non bornée.
     * EN VEILLE depuis le retrait de l'allégation, le 15/09/2026 : la note n'est plus appelée, et
     * l'accueil ne porte effectivement plus que la version non bornée, celle de l'accroche du hero.
     */
    text: nb(
      `${product.definition}. ${product.definitionScope} Les cinq SCPI concernées : ${corumGroup.scpiNames.join(', ')}.`
    ),
  },
  {
    id: 'difference-remuneration',
    text: nb(
      `Rémunération de la société de gestion : ${feeFacts.management.label} de frais de gestion, ${feeFacts.management.base}, une commission sur les cessions d’immeubles de ${feeFacts.disposal.label}, ${feeFacts.disposal.base}, selon la plus-value réalisée, et une commission de retrait dégressive avant ${zeroAfter} ans de détention. Aucune commission de souscription, aucun frais d’acquisition, d’intermédiation ou de travaux. ${feeFacts.vatNote} Sources : brochure partenaires 2026, p. 4 et p. 6 ; document d’informations clés du ${product.dicDate.label} ; note d’information visée par l’AMF.`
    ),
  },
];

/*
 * Type DÉCLARÉ et non `satisfies` : `claim.noteId` est facultatif et absent de ce contenu depuis que
 * la phrase porte son périmètre en elle. Avec `satisfies`, le type déduit est celui du littéral, et le
 * composant qui teste `claim.noteId` ne compilait plus.
 */
export const difference: DifferenceContent = {
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
    /*
     * ALLÉGATION DE RANG RETIRÉE le 15/09/2026 (« Supprimer dernière phrase : la première SCPI… »).
     * Elle disait `facts.product.definition` : « La première SCPI DU GROUPE CORUM sans frais d'entrée
     * ni frais sur les achats d'immeubles. »
     *
     * CE QUI PART AVEC ELLE, et la Conformité doit le savoir : c'était la SEULE occurrence du périmètre
     * « du groupe CORUM » sur l'accueil. La page ne porte donc plus que l'allégation non bornée de
     * l'accroche, « La première SCPI sans frais de souscription ni frais d'acquisition. »
     * scripts/check-compliance.mjs exigeait cette phrase sur index.html : la règle est COMMENTÉE, pas
     * supprimée, comme celles des mentions de risque, et reprend effet dès qu'on remet le périmètre.
     * `claim` reste facultatif dans le type et le gabarit le teste : rien d'autre à défaire.
     */
    /**
     * Conclusion de l'équipe, reprise mot pour mot (11/09/2026). À DÉFENDRE EN COMPLIANCE : en lecture
     * stricte elle est inexacte, les frais de gestion sont prélevés sur les loyers encaissés, y compris
     * quand la valeur des parts baisse, donc la société de gestion peut se rémunérer alors que l'épargnant
     * est en perte. Le contre-poids chiffré `risk`, prévu pour la suivre dans le même bloc et à la
     * même taille, n'est plus rendu depuis le 11/09/2026 : EN VEILLE.
     */
    pedagogy: [
      nb(
        'En clair : nous, on ne touche rien tant que vous n’avez pas gagné d’argent. C’est gagnant-gagnant.'
      ),
    ],
    risk: nb(
      `En contrepartie, R Start prélève ${feeFacts.management.label} de frais de gestion sur les loyers. S’y ajoutent une commission sur les cessions d’immeubles (${feeFacts.disposal.label}) et une commission de retrait avant ${zeroAfter} ans. ${arbitrageWarningBullets[1]} Votre coût total n’est pas connu à la souscription.`
    ),
    noteId: 'difference-remuneration',
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
};
