import type { CorumContent } from '@/content/types';
import { externalLinks } from '@/content/fr/facts';

/**
 * Section « Le groupe CORUM en quelques chiffres » (id : corum, « L'expérience derrière R Start »
 * jusqu'au 15/09/2026), rendue sur l'accueil par 07-Trust.astro : le titre `corum.title`, le
 * bandeau des chiffres du groupe, qui vient de trust.ts (`trust.stats`, seul élément de ce
 * fichier-là rendu dans la section), et le bouton `aboutLink`. Zone 4 de la page d'accueil, réunion
 * produit du 10/09/2026. Les chiffres (trust.experienceStats) viennent de la brochure partenaires
 * 2026, p. 7. La formule « objectifs tenus » de la brochure EST reprise depuis le 14/09/2026, dans
 * le libellé du premier chiffre (« d'expertise et d'objectifs tenus », texte de l'équipe) : c'est
 * une allégation de performance, que le contrôle de conformité signale en avertissement. Le montant
 * de plus-values redistribuées cité dans la brochure reste hors du site tant que CORUM n'a pas
 * répondu à l'AMF. Les contre-poids des anciens blocs (l'expérience du groupe ne préjuge de rien,
 * chiffres du groupe et non de R Start, cessions passées, effets de seuil de la commission
 * d'arbitrage) et les notes de la section ont quitté le code le 22/09/2026 (archivés hors du dépôt,
 * .claude/audits) : rien n'en était rendu. Les chiffres du groupe restent gouvernés par
 * facts.corumGroup : aucun arbitrage ici.
 */

export const corum = {
  /*
   * « Le groupe CORUM en quelques chiffres » depuis le 15/09/2026, ex-« L'expérience derrière
   * R Start ». La section ne porte plus les avis Trustpilot mais le bandeau des quatre chiffres du
   * groupe : son titre dit maintenant ce qu'elle montre. Le libellé est celui de `trust.stats.title`,
   * qui titrait ce bandeau jusqu'ici en sous-titre et faisait donc doublon.
   */
  title: 'Le groupe CORUM en quelques chiffres',
  /** Bouton vers /a-propos (chiffres du groupe, gamme des autres SCPI et avis Trustpilot). */
  /* « Découvrir le groupe CORUM » depuis le 15/09/2026, ex-« En savoir plus sur CORUM » : même
     forme que « Découvrir notre approche », l'autre appel secondaire de l'accueil. */
  aboutLink: 'Découvrir le groupe CORUM',
  /*
   * Appel SOUS LES CHIFFRES DU GROUPE, sur /a-propos (16/09/2026). Il sort du site, vers corum.fr :
   * c'est le seul appel du site à le faire depuis le corps d'une page, d'où la mention de nouvelle
   * fenêtre lue par les lecteurs d'écran. Le libellé est plus court que celui de l'accueil, qui reste
   * interne et mène ici même.
   */
  siteLink: {
    label: 'Découvrir CORUM',
    href: externalLinks.corum,
    newTabHint: 'nouvelle fenêtre',
  },
} satisfies CorumContent;
