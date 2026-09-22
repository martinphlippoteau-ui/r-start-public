import type { CorumContent } from '@/content/types';
import { externalLinks } from '@/content/fr/facts';

/**
 * Section « Le groupe CORUM en quelques chiffres » (id : corum), rendue sur l'accueil par
 * 07-Trust.astro : `corum.title`, le bandeau des chiffres du groupe (trust.ts, `trust.stats`,
 * brochure partenaires 2026, p. 7) et le bouton `aboutLink`. Les chiffres restent gouvernés par
 * facts.corumGroup : aucun arbitrage ici.
 *
 * CE QU'IL FAUT SAVOIR CÔTÉ CONFORMITÉ : « objectifs tenus » est repris dans le libellé du premier
 * chiffre (texte de l'équipe, 14/09/2026), une allégation de performance que le contrôle signale en
 * avertissement ; le montant de plus-values redistribuées cité dans la brochure reste hors du site
 * tant que CORUM n'a pas répondu à l'AMF ; les anciens contre-poids et notes de la section ont
 * quitté le code le 22/09/2026 (archivés hors du dépôt, .claude/audits), rien n'en était rendu.
 */

export const corum = {
  /* Titre du 15/09/2026 : il dit ce que la section montre, le bandeau des chiffres du groupe. */
  title: 'Le groupe CORUM en quelques chiffres',
  /** Bouton vers /a-propos, de la même forme que « Découvrir notre approche » (15/09/2026). */
  aboutLink: 'Découvrir le groupe CORUM',
  /* Appel sous les chiffres du groupe, sur /a-propos. Il sort du site, vers corum.fr, seul appel du
     site à le faire depuis le corps d'une page : d'où la mention de nouvelle fenêtre. */
  siteLink: {
    label: 'Découvrir CORUM',
    href: externalLinks.corum,
    newTabHint: 'nouvelle fenêtre',
  },
} satisfies CorumContent;
