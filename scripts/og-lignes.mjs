/**
 * LES LIGNES DE TEXTE DE L'IMAGE OPEN GRAPH, composées depuis les sources du site. L'image partagée
 * sur les réseaux est une communication commerciale au même titre que la page, mais c'est un JPEG :
 * aucun contrôle ne peut la relire, et un chiffre écrit en dur y survivrait à sa modification dans
 * facts.ts. make-og.mjs compose donc ses lignes ICI et les consigne, à chaque génération, dans
 * scripts/og-lignes.json (versionné, non publié) ; scripts/check-compliance.mjs les recompose et
 * les compare au fichier : un écart arrête le build en demandant de régénérer (`node
 * scripts/make-og.mjs`).
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
