import type { HighlightsContent, LegalNote } from '@/content/types';
import { fees, income, product, risk, share, strategy, subscription } from '@/content/fr/facts';
import { managementCompany } from '@/content/fr/legal';

/**
 * Section 2 — « R Start en un clin d'œil » (id « points-forts »).
 * Six encarts repris de la brochure partenaires 2026, p. 3 (ticket d'entrée, niveau de risque,
 * distribution des revenus potentiels, stratégie d'investissement, délai de jouissance), plus la
 * souscription 100 % en ligne (brochure p. 7).
 * Ordre imposé par la réunion produit du 10/09/2026 : le niveau de risque arrive en deuxième
 * position, donc haut dans la page. Sa valeur est attribuée à la société de gestion et non au
 * document d'informations clés, qui seul fait foi (retour AMF sur la brochure).
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
      `Le niveau de risque est exprimé sur une échelle réglementaire de 1 à ${risk.sriMax}, où 1 correspond au risque le plus faible. R Start y est classée ${risk.sriLabel}, soit une ${risk.sriClass}. Cette valeur est communiquée par ${managementCompany.name} ; elle n’est pas extraite du document d’informations clés du ${product.dicDate.label}, qui seul fait foi. Cette échelle ne mesure pas tous les risques : elle ne dit rien de la liquidité de vos parts. Sources : société de gestion et brochure partenaires 2026, p. 3.`
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
      `Zone d’investissement selon le DIC du ${product.dicDate.label} : ${lower(strategy.zoneDetail)}. Les investissements portent sur tous types d’actifs immobiliers professionnels. La stratégie est qualifiée de diversifiée dans la brochure partenaires 2026, p. 3 : cette diversité ne supprime aucun des risques du placement.`
    ),
  },
  {
    id: 'points-forts-jouissance',
    text: nb(
      `Date de jouissance des parts : « ${income.enjoymentDate} », soit un délai de ${income.enjoymentDelayLabel}. Aucun dividende n’est versé pendant ce délai. Sources : bulletin de souscription R Start, conditions générales de vente, mai 2026 ; brochure partenaires 2026, p. 3.`
    ),
  },
  {
    id: 'points-forts-en-ligne',
    text: nb(
      `R Start se souscrit uniquement en ligne. Le démembrement, la souscription papier et CORUM Life ne sont pas proposés pour cette SCPI. Pièces à préparer : ${subscription.documentsRequired.map(lower).join(', ')}. Sources : brochure partenaires 2026, p. 5 et p. 7 ; bulletin de souscription, mai 2026.`
    ),
  },
];

export const highlights = {
  eyebrow: 'Points forts',
  title: 'R Start en un clin d’œil',
  intro: nb(
    `R Start est une société civile de placement immobilier à capital variable, gérée par ${managementCompany.name}. Six repères pour la comprendre, chacun avec sa contrepartie.`
  ),
  cards: [
    {
      icon: 'argent',
      value: nb(share.priceLabel),
      label: 'le ticket d’entrée',
      description: nb(
        `Une part de R Start coûte ${share.priceLabel}. Le minimum de souscription est d’une part. Vous réglez en ligne, par virement ou par prélèvement SEPA.`
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
        `Sur l’échelle réglementaire de risque, R Start est classée ${risk.sriLabel}. Cette valeur est communiquée par ${managementCompany.name}. Le document d’informations clés fait foi.`
      ),
      risk: nb(
        'Un risque moyen reste un risque. Vous pouvez perdre tout ou partie du capital investi. Cette échelle ne couvre pas tout : la revente de vos parts n’est pas garantie.'
      ),
      noteId: 'points-forts-risque',
    },
    {
      icon: 'analyse',
      value: 'Chaque mois',
      label: 'des revenus potentiels',
      description: nb(
        'Les dividendes potentiels sont versés chaque mois. Leur montant dépend des loyers encaissés et des résultats de la société.'
      ),
      risk: nb(
        'Ces revenus ne sont pas garantis. Ils varient à la hausse comme à la baisse, selon l’évolution du marché immobilier et du cours des devises.'
      ),
      noteId: 'points-forts-distribution',
    },
    {
      icon: 'exploration',
      value: 'Diversifiée',
      label: 'la stratégie d’investissement',
      description: nb(
        'R Start peut investir dans les pays du Conseil de l’Europe et au Canada. Tous les secteurs de l’immobilier professionnel sont visés.'
      ),
      risk: nb(
        'La diversification ne supprime pas le risque de perte en capital. Hors zone euro, la variation des devises peut réduire vos revenus et la valeur de vos parts.'
      ),
      noteId: 'points-forts-zone',
    },
    {
      icon: 'calendrier',
      value: nb(income.enjoymentDelayLabel),
      label: 'le délai de jouissance',
      description: nb(
        'Vos parts ouvrent droit aux dividendes potentiels le premier jour du sixième mois qui suit votre souscription et son règlement.'
      ),
      risk: nb(
        'Pendant ce délai, votre épargne est investie sans vous verser de revenu. Les versements ne sont pas garantis, à cette échéance comme ensuite.'
      ),
      noteId: 'points-forts-jouissance',
    },
    {
      icon: 'document-valide',
      value: nb(subscription.onlineLabel.replace(' en ligne', '')),
      label: 'en ligne',
      description: nb(
        'La souscription se fait entièrement en ligne. Vous créez votre profil, signez en ligne, puis réglez par virement ou par prélèvement SEPA.'
      ),
      risk: nb(
        `La sortie est moins simple que l’entrée. Le rachat de vos parts n’est pas garanti. Une commission de retrait s’applique avant ${fees.withdrawal.zeroAfterYears} ans de détention.`
      ),
      noteId: 'points-forts-en-ligne',
    },
  ],
  notes,
} satisfies HighlightsContent;
