/**
 * LES LIGNES DE TEXTE DE L'IMAGE OPEN GRAPH, composées depuis les sources du site (audit du 18/09/2026).
 *
 * L'image partagée sur les réseaux est une communication commerciale au même titre que la page, mais
 * c'est un JPEG : aucun contrôle ne peut la relire. Ses chiffres (« 0 % », « 15 % », « 200 € »,
 * « 10 ans ») étaient écrits en dur dans scripts/make-og.mjs ; un taux modifié dans facts.ts laissait
 * l'aperçu afficher l'ancienne valeur, sans que rien le signale.
 *
 * Désormais : make-og.mjs compose ses lignes ICI et les consigne, à chaque génération, dans
 * scripts/og-lignes.json (versionné, non publié). scripts/check-compliance.mjs recompose les lignes et
 * les compare au fichier : un écart veut dire que l'image en ligne affiche d'anciennes valeurs, et le
 * build s'arrête en demandant de la régénérer (`node scripts/make-og.mjs`).
 */
import { fees, product, risk, share } from '../src/content/fr/facts.ts';
import { publisher } from '../src/content/fr/legal.ts';

export const lignesOg = () => ({
  accroche: product.tagline,
  chiffres: `${fees.subscription.label} de frais de souscription · ${fees.management.label} de frais de gestion · à partir de ${share.minimumLabel}`,
  risques: [
    `Investissement immobilier de long terme (${risk.recommendedHoldingYears} ans recommandés). Risque de perte en capital,`,
    /* Apostrophe typographique, comme sur le reste de l'image : legal.ts écrit le nom avec une droite. */
    `revenus non garantis, liquidité limitée, risque de change. ${publisher.name.replace(/'/g, '’')}.`,
  ],
});
