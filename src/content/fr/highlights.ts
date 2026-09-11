import type { HighlightsContent, LegalNote } from '@/content/types';
import { fees, income, product, risk, share, strategy, subscription } from '@/content/fr/facts';

/**
 * Section 2 — « R Start en six repères » (id « points-forts »).
 * Six encarts repris de la brochure partenaires 2026, p. 3 (ticket d'entrée, niveau de risque,
 * distribution des revenus potentiels, zone d'investissement, délai de jouissance), plus la
 * souscription 100 % en ligne (brochure p. 7).
 * Ordre : ticket d'entrée, niveau de risque en deuxième position (réunion produit du 10/09/2026, donc
 * haut dans la page), souscription 100 % en ligne en troisième (audit UX : le parcours avant le
 * fonctionnement), puis revenus, zone, jouissance. La valeur du niveau de risque est celle du document
 * d'informations clés, cité avec sa date : une communication commerciale ne peut pas contredire le DIC
 * (retour AMF sur la brochure, qui annonçait une autre valeur).
 * La carte zone ne parle plus de « stratégie diversifiée » (brochure) : le patrimoine peut être
 * concentré au démarrage (strategy.ts, pilier « Où »), le mot contredirait ce risque.
 * Chaque encart porte son contre-poids risque (champ `risk`), de longueur comparable à
 * `description` et rendu à la même taille : la page « modèle unique » de la brochure n'est jamais
 * reprise sans ses contreparties. Aucune donnée de performance, aucun exemple d'investissement.
 * Aucun chiffre en dur : tout vient de src/content/fr/facts.ts.
 */

/** Espace insécable avant % € : ; ? ! : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1');
/** Apostrophe typographique (’) : certains libellés de facts.ts sont saisis avec l'apostrophe droite. */
const typo = (s: string): string => nb(s.replace(/'/g, '’'));
const lower = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

export const notes: LegalNote[] = [
  {
    id: 'points-forts-prix-de-part',
    text: nb(
      `Prix de souscription de ${share.priceLabel} par part, dont ${share.nominal} € de valeur nominale et ${share.premium} € de prime d’émission. Les parts peuvent être fractionnées en ${share.fractions}. Source : bulletin de souscription R Start, conditions générales de vente, mai 2026.`
    ),
  },
  {
    id: 'points-forts-risque',
    text: nb(
      `Le niveau de risque est exprimé sur une échelle réglementaire de 1 à ${risk.sriMax}, où 1 correspond au risque le plus faible. R Start y est classée ${risk.sriLabel}, soit une ${risk.sriClass}, dans son document d’informations clés du ${product.dicDate.label}, qui seul fait foi et suppose une détention de ${risk.recommendedHoldingLabel}. Cette échelle ne mesure pas tous les risques : elle ne dit rien de la liquidité de vos parts, ni du risque de change, ni de l’effet de levier. Source : document d’informations clés de R Start du ${product.dicDate.label}, p. 2.`
    ),
  },
  {
    id: 'points-forts-en-ligne',
    text: nb(
      `R Start se souscrit uniquement en ligne. Le démembrement, la souscription papier et CORUM Life ne sont pas proposés pour cette SCPI. Pièces à préparer : ${subscription.documentsRequired.map(lower).join(', ')}. Sources : brochure partenaires 2026, p. 5 et p. 7 ; bulletin de souscription, mai 2026.`
    ),
  },
  {
    id: 'points-forts-distribution',
    text: nb(
      `Fréquence de versement des dividendes potentiels : ${lower(income.frequency)}. Leur montant dépend des loyers encaissés et de la décision de la société de gestion. Aucun montant n’est annoncé à l’avance. Sources : bulletin de souscription R Start, conditions générales de vente, mai 2026 ; brochure partenaires 2026, p. 3.`
    ),
  },
  {
    id: 'points-forts-zone',
    text: typo(
      `Zone d’investissement selon le DIC du ${product.dicDate.label} : ${lower(strategy.zoneDetail)}. Les investissements portent sur tous types d’actifs immobiliers professionnels. Cette zone décrit où R Start peut investir, pas un patrimoine existant : il se constitue au fil des collectes et peut rester concentré sur peu d’immeubles, de pays ou de secteurs. L’étendue de la zone ne supprime aucun des risques du placement.`
    ),
  },
  {
    id: 'points-forts-jouissance',
    text: nb(
      `Date de jouissance des parts : « ${income.enjoymentDate} », soit un délai de ${income.enjoymentDelayLabel}. Aucun dividende n’est versé pendant ce délai. Sources : bulletin de souscription R Start, conditions générales de vente, mai 2026 ; brochure partenaires 2026, p. 3.`
    ),
  },
];

export const highlights = {
  eyebrow: 'Points forts',
  title: 'R Start en six repères',
  intro: nb(
    'R Start est une SCPI : une société qui achète des immeubles loués à des entreprises et vous en reverse les loyers, après frais de gestion. Vous achetez des parts de cette société, pas les immeubles. Six points à connaître, chacun avec son risque.'
  ),
  cards: [
    {
      icon: 'argent',
      value: nb(share.priceLabel),
      label: 'le prix d’une part',
      description: nb(
        `Une part est une fraction de la société : vous en détenez un morceau, pas un immeuble. Elle coûte ${share.priceLabel}, et vous pouvez n’en acheter qu’une. Vous réglez en ligne, par virement ou par prélèvement SEPA.`
      ),
      risk: nb(
        `Le capital n’est pas garanti : vous pouvez perdre tout ou partie de la somme investie. Ce placement est de long terme, ${risk.recommendedHoldingLabel} recommandés.`
      ),
      noteId: 'points-forts-prix-de-part',
    },
    {
      icon: 'alerte',
      value: risk.sriLabel,
      label: 'le niveau de risque',
      description: nb(
        `R Start est classée ${risk.sriLabel} sur l’échelle réglementaire de risque, où 1 est le risque le plus faible et 7 le plus élevé. C’est une ${risk.sriClass}, telle que l’indique son document d’informations clés du ${product.dicDate.label}. Ce document fait foi.`
      ),
      risk: nb(
        'Un risque moyen reste un risque. Vous pouvez perdre tout ou partie du capital investi. Cette échelle ne couvre pas tout : la revente de vos parts n’est pas garantie.'
      ),
      noteId: 'points-forts-risque',
    },
    {
      icon: 'document-valide',
      value: nb(subscription.onlineLabel.replace(' en ligne', '')),
      label: 'en ligne',
      description: nb(
        'La souscription se fait entièrement en ligne. Vous créez votre profil, signez en ligne, puis réglez par virement ou par prélèvement SEPA.'
      ),
      risk: nb(
        `La sortie est moins simple que l’entrée : vous ne récupérez votre argent que si un autre épargnant achète vos parts. Une commission de retrait s’applique avant ${fees.withdrawal.zeroAfterYears} ans de détention.`
      ),
      noteId: 'points-forts-en-ligne',
    },
    {
      icon: 'analyse',
      value: 'Chaque mois',
      label: 'des revenus potentiels',
      description: nb(
        'Chaque mois, R Start peut vous reverser une part des loyers qu’elle a encaissés : c’est ce qu’on appelle un dividende. Son montant dépend des loyers perçus et des résultats de la société.'
      ),
      risk: nb(
        'Ces revenus ne sont pas garantis. Ils varient à la hausse comme à la baisse, selon l’évolution du marché immobilier et du cours des devises.'
      ),
      noteId: 'points-forts-distribution',
    },
    {
      icon: 'exploration',
      value: 'Europe et Canada',
      label: 'la zone d’investissement',
      description: nb(
        'R Start peut investir dans les pays du Conseil de l’Europe et au Canada, dans tous les secteurs de l’immobilier professionnel. Le choix des pays suit leur cycle immobilier et économique.'
      ),
      risk: nb(
        'Au démarrage, le patrimoine peut être concentré sur peu d’immeubles, de pays ou de secteurs, ce qui accroît le risque. Hors zone euro, la variation des devises peut réduire vos revenus et la valeur de vos parts.'
      ),
      noteId: 'points-forts-zone',
    },
    {
      icon: 'calendrier',
      value: nb(income.enjoymentDelayLabel),
      label: 'avant vos premiers revenus',
      description: nb(
        'Vos parts ne rapportent rien pendant les six premiers mois : c’est le délai de jouissance. Elles donnent droit aux versements à partir du premier jour du sixième mois qui suit votre paiement.'
      ),
      risk: nb(
        'Pendant ce délai, votre épargne est investie sans vous verser de revenu. Les versements ne sont pas garantis, à cette échéance comme ensuite.'
      ),
      noteId: 'points-forts-jouissance',
    },
  ],
  notes,
} satisfies HighlightsContent;
