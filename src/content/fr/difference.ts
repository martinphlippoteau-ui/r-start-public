import type { DifferenceContent } from '@/content/types-v2';
import { pages } from '@/config/pages';
import { nb } from '@/lib/texte';

/**
 * Section « Qui a envie de payer avant de gagner ? » de l'accueil : quand la société de gestion se
 * rémunère, sans promettre de résultat. Titre et copie fournis par l'équipe et repris tels quels.
 *
 * CE QU'IL FAUT SAVOIR CÔTÉ CONFORMITÉ, signalé en avertissement par scripts/check-compliance.mjs
 * pour rester traçable : « nous, on ne touche rien tant que vous n'avez pas gagné d'argent » est
 * inexact en lecture stricte, les 15 % de frais de gestion étant prélevés sur les loyers encaissés
 * y compris quand la valeur des parts baisse ; la société de gestion peut donc se rémunérer alors
 * que l'épargnant est en perte. La règle était d'écrire « se rémunère sur les loyers encaissés et
 * les plus-values réalisées, jamais sur le montant que vous versez ». Le contre-poids chiffré des
 * frais réellement prélevés a quitté l'écran le 11/09/2026 et le code le 22/09/2026 (archivé hors
 * du dépôt, .claude/audits), comme l'allégation de rang bornée « la première SCPI DU GROUPE
 * CORUM… » (15/09/2026) : l'accueil ne porte plus que l'allégation non bornée de l'accroche du
 * hero, et le périmètre (les cinq SCPI du groupe) n'est plus porté nulle part. Aucun avantage de la
 * section ne porte plus son risque à l'écran.
 */

export const difference = {
  /* Titre et sous-titre du 15/09/2026, texte de l'équipe : la question, puis le modèle. */
  title: 'Qui a envie de payer avant de gagner ?',
  intro: 'R Start, un modèle de frais gagnant-gagnant',
  /* « de la SCPI R Start » depuis le 17/09/2026, texte de l'équipe. */
  lead: 'Quand vous détenez des parts de la SCPI R Start, on ne vous prélève des frais que dans deux situations :',
  /** Les deux situations, en liste. `strong` est le mot mis en valeur par le gabarit. */
  situations: [
    /* Textes de Martin du 24/09/2026 : la première situation redevient « Quand elle encaisse des
       loyers » ; « reversés sous forme de dividendes potentiels » (22/09/2026) passe dans `outro`,
       pour les deux situations à la fois. */
    { text: 'Quand elle encaisse des loyers', strong: 'loyers' },
    {
      text: 'Quand elle réalise une plus-value sur la vente d’immeubles',
      strong: 'plus-value',
    },
  ],
  /* Sous la liste (24/09/2026, Martin, mot pour mot) : « potentiels » dit que les revenus ne sont
     pas acquis. */
  outro: 'Les loyers et les plus-values potentielles vous sont versés sous forme de dividendes potentiels.',
  counterweight: {
    /**
     * Conclusion de l'équipe, mot pour mot (11/09/2026), MISE EN VALEUR (24/09/2026, Martin : « à
     * mettre bien en valeur ») par le gabarit, en encadré. À DÉFENDRE EN COMPLIANCE : voir l'en-tête.
     */
    pedagogy: [
      nb(
        'En clair : nous, on ne touche rien tant que vous n’avez pas gagné d’argent. C’est gagnant-gagnant.'
      ),
    ],
  },
  /* Lien vers /frais porté par la pastille flottante (components/StickyCta.astro) et par elle
     seule : le libellé nomme sa destination en entier. Pas de `secondaryCta` dans le bloc depuis le
     16/09/2026 (« supprime le "Voir notre comparateur de frais" du premier bloc de la home »). */
  cta: { label: 'Voir le comparateur de frais', href: pages.fees.path },
} satisfies DifferenceContent;
