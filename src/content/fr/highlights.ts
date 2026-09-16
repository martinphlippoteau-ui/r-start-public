import type { HighlightsContent, LegalNote } from '@/content/types';
import { income, product, risk, share, strategy, subscription } from '@/content/fr/facts';
import { pages } from '@/config/pages';

/**
 * Section 2, « R Start en six repères » (id « points-forts »).
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
      `Le niveau de risque est exprimé sur une échelle réglementaire de 1 à ${risk.sriMax}, où 1 correspond au risque le plus faible. R Start y est classée ${risk.sriLabel}, soit une ${risk.sriClass}, valeur communiquée par CORUM ; l’échelle suppose une détention de ${risk.recommendedHoldingLabel}. Cette échelle ne mesure pas tous les risques : elle ne dit rien de la liquidité de vos parts, ni du risque de change, ni de l’effet de levier. Source : CORUM, brochure partenaires 2026, p. 3. Le document d’informations clés du ${product.dicDate.label} reste le seul document qui fait foi : lisez-le avant toute décision.`
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
    id: 'points-forts-approche',
    text: typo(
      `Approche de R Start selon le DIC du ${product.dicDate.label} : « ${lower(strategy.approach)} ». Une approche n’est pas un résultat : elle n’assure ni plus-value, ni revenu, et ne met pas le capital à l’abri d’une perte. Le patrimoine se constitue au fil des collectes et peut rester concentré sur peu d’immeubles, de pays ou de secteurs.`
    ),
  },
  {
    id: 'points-forts-automatique',
    text: nb(
      `Versements programmés (${lower(subscription.options.pei.name)}) : à partir de ${subscription.options.pei.minimumMonthlyLabel}, sous réserve de ${lower(subscription.options.pei.requirement)}. Réinvestissement des dividendes : ${lower(subscription.options.rd.description)} potentiels en nouvelles parts. Ces deux options s’interrompent et se modifient à tout demande ; elles ne garantissent aucun revenu. Sources : brochure partenaires 2026, p. 5 ; bulletins d’adhésion, avril 2026.`
    ),
  },
  {
    id: 'points-forts-jouissance',
    text: nb(
      `Date de jouissance des parts : « ${income.enjoymentDate} », soit un délai de ${income.enjoymentDelayLabel}. Aucun dividende n’est versé pendant ce délai. Sources : bulletin de souscription R Start, conditions générales de vente, mai 2026 ; brochure partenaires 2026, p. 3.`
    ),
  },
];

/*
 * Type DÉCLARÉ et non `satisfies` : `intro` est désormais facultative et absente de ce contenu.
 * Avec `satisfies`, le type déduit est celui du littéral, et le composant qui lit `highlights.intro`
 * ne compilait plus. L'annotation garde le contrôle du littéral et expose le champ optionnel.
 */
export const highlights: HighlightsContent = {
  eyebrow: 'Points forts',
  /*
   * Appel à l'action au pied de la section (15/09/2026, demande de l'équipe). Le tableau dit CE QUE
   * R Start est ; la page Stratégie dit COMMENT elle investit. Le libellé reprend l'intitulé du menu,
   * passé à « Notre approche » le même jour : un visiteur qui suit ce bouton retrouve le mot exact
   * dans la barre.
   */
  secondaryCta: { label: 'Découvrir notre approche', href: pages.strategy.path },
  /* Le bouton « i » ne montre qu'une lettre : ce libellé est ce que les lecteurs d'écran annoncent,
     complété par celui de la carte (« Expliquer : Approche »). */
  labels: { info: 'Expliquer' },
  /**
   * TABLEAU DU DOCUMENT DE L'ÉQUIPE, repris au plus près (14/09/2026) : son titre, ses sept lignes,
   * son ordre, « 100 % Digital » remonté du second bloc dans le tableau, et le second bloc réduit aux
   * deux options automatiques. L'introduction qui définissait la SCPI a quitté cette section : la même
   * explication ouvre la FAQ, là où le document la place.
   *
   * TOUTES LES VALEURS SONT CELLES DU DOCUMENT (14/09/2026, demande explicite de le respecter à la
   * lettre). Trois d'entre elles s'écartent des documents de référence ; l'équipe en a décidé ainsi, et
   * le contrôle de conformité les signale désormais en avertissement, à chaque exécution :
   *  - « Niveau de risque 4/7 » : le DIC hébergé sur ce site dit 3 sur 7. Voir facts.risk, qui porte
   *    l'écart au complet. Plus aucune phrase du site n'attribue cette valeur au DIC ;
   *  - « Zone d'investissement : Monde » : le DIC borne la zone aux pays du Conseil de l'Europe, en
   *    zone euro et hors zone euro, et au Canada. La note de cette ligne cite toujours le DIC ;
   *  - « Approche : Diversifiée » : R Start n'a pas encore de patrimoine à diversifier.
   * Aucun chiffre en dur : tout vient de src/content/fr/facts.ts.
   */
  title: 'R Start en un clin d’œil',
  cards: [
    { label: 'Ticket d’entrée', value: nb(share.priceLabel), noteId: 'points-forts-prix-de-part' },
    { label: 'Niveau de risque', value: risk.sriLabel, noteId: 'points-forts-risque' },
    /** income.frequency vaut « Mensuelle » ; accordé ici au libellé (« revenus »). */
    { label: 'Revenus potentiels', value: 'Mensuels', noteId: 'points-forts-distribution' },
    /*
     * DEUX EXPLICATIONS DÉPLIABLES (15/09/2026, textes de l'équipe). « Diversifiée » et « Monde » sont
     * les deux valeurs du tableau qu'un mot ne suffit pas à rendre : elles nomment un mandat, pas une
     * caractéristique observable. Le bouton « i » les développe sans allonger la carte.
     * Elles ne remplacent pas les notes légales, qui restent en `noteId` : celle de l'approche rappelle
     * notamment que le patrimoine n'existe pas encore et peut rester concentré.
     */
    {
      label: 'Approche',
      value: 'Diversifiée',
      info: 'R Start investit dans tous secteurs, toutes zones géographiques et tous types d’immeubles pour ne pas dépendre d’une seule source de performance.',
      noteId: 'points-forts-approche',
    },
    {
      label: 'Zone d’investissement',
      value: 'Monde',
      info: 'R Start investit là où les équipes de gestion identifient les meilleures opportunités, en Europe et au-delà, tous secteurs confondus.',
      noteId: 'points-forts-zone',
    },
    {
      label: 'Délai de jouissance',
      /*
       * « 1er jour du 6e mois » depuis le 15/09/2026, demande de l'équipe. La carte disait « 6 mois »,
       * repris de la brochure p. 3 ; elle dit maintenant la RÈGLE, celle du bulletin de souscription,
       * qui est plus précise et ne se contredit pas : le délai court jusqu'au premier jour du sixième
       * mois suivant la souscription et son règlement, il n'est donc pas de six mois pleins pour tout
       * le monde. Les deux formulations existaient déjà dans facts.ts, `enjoymentDelayLabel` et
       * `enjoymentShort` ; c'est la seconde qui est affichée.
       * « 6e » et non « 6ème » : abréviation correcte de l'ordinal, déjà employée partout ailleurs.
       */
      value: nb(income.enjoymentShort),
      /* Explication dépliable (16/09/2026, texte de l'équipe). « 1er jour du 6e mois » dit QUAND,
         pas POURQUOI : c'est le temps qu'il faut à la SCPI pour investir l'argent collecté. */
      info: 'Période d’attente entre votre investissement et le moment où vous commencez à percevoir des revenus. Le délai de jouissance correspond au temps nécessaire à la SCPI pour investir l’argent collecté.',
      noteId: 'points-forts-jouissance',
    },
    /*
     * PAS DE LIGNE « 100 % Digital » dans le tableau (14/09/2026, demande de l'équipe) : elle disait la
     * même chose que « Souscription : 100 % en ligne », juste en dessous, où l'information est à sa
     * place. Le tableau s'en tient donc aux six caractéristiques du produit.
     */
  ],
  /**
   * La souscription et les deux options automatiques vivent à part : ce ne sont pas des
   * caractéristiques du produit mais la façon d'y souscrire et ce qu'on peut automatiser ensuite.
   */
  subscriptionTitle: 'Souscription et options disponibles',
  subscriptionItems: [
    { label: 'Souscription', value: nb(subscription.onlineLabel), noteId: 'points-forts-en-ligne' },
    {
      label: 'Versements automatiques',
      value: nb(`dès ${subscription.options.pei.minimumMonthlyLabel}`),
      noteId: 'points-forts-automatique',
    },
    { label: 'Réinvestissement automatique', value: 'des dividendes' },
  ],
  /*
   * PAS DE CONTRE-POIDS SOUS LE TABLEAU depuis le 14/09/2026 (demande de l'équipe) : le document
   * n'en porte pas, le tableau s'arrête à ses sept lignes. Le champ reste optionnel dans le type, il
   * suffit de le réécrire ici pour le faire revenir. Le texte retiré était : « Ces repères décrivent le
   * produit, ils ne réduisent aucun de ses risques. Le capital n'est pas garanti… Durée de placement
   * recommandée : 10 ans. »
   * Ce qu'il portait n'est pas perdu pour autant : la ligne risques du hero, jamais animée, ouvre la
   * page avec la perte en capital, les revenus non garantis, la liquidité limitée et le risque de
   * change ; la section Risques les détaille ; et chaque ligne du tableau garde son appel de note, qui
   * donne sa source et sa limite.
   */
  notes,
};
