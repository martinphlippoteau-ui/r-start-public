import { fees as feeFacts } from '@/content/fr/facts';

/**
 * Ce fichier portait la section « Frais en bref » de l'accueil (03-Fees.astro) : les trois « 0 % » avec
 * leur contre-poids, le barème résumé, l'encadré « Une innovation, pas une révolution » et cinq notes.
 * SECTION ET CONTENU SUPPRIMÉS le 15/09/2026 : elle ne figurait plus dans HOME_ORDER depuis le
 * 11/09/2026, donc plus rendue nulle part. /frais porte le barème complet et l'accueil y renvoie par
 * son appel « Comparer les frais ». La rédaction d'origine, contre-poids compris, est dans git.
 *
 * Il ne reste que la phrase ci-dessous, la seule chose de ce fichier qui ait encore des lecteurs :
 * faq.ts, subscribe.ts et feesPage.ts.
 */

/** Espace insécable avant % et € : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1');

/**
 * Cas d'exonération de la commission de retrait anticipé (facts.fees.withdrawal.exemptions, note
 * d'information chapitre III § 6). Phrase unique, réutilisée par subscribe.ts et faq.ts. Les cas sont
 * soumis à conditions : le texte renvoie à la note d'information sans laisser croire à une exonération
 * automatique.
 */
export const withdrawalExemptions = nb(
  `La note d’information prévoit, sous conditions, des cas d’exonération de cette commission (${feeFacts.withdrawal.exemptions.join(', ')}) : reportez-vous à son chapitre III.`
);
