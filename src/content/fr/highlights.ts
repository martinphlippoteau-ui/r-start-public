import type { HighlightsContent } from '@/content/types';
import { income, risk, share, subscription } from '@/content/fr/facts';
import { pages } from '@/config/pages';

/**
 * Section 2, « R Start en un clin d'œil » (id « points-forts »), titre du document de l'équipe
 * (14/09/2026).
 * Six cartes (ticket d'entrée, niveau de risque, revenus potentiels, approche, horizon
 * d'investissement, délai de jouissance), puis, à part, la souscription 100 % en ligne et les deux
 * options automatiques (brochure partenaires 2026, p. 3, p. 5 et p. 7).
 * Le niveau de risque est en deuxième position (réunion produit du 10/09/2026, donc haut dans la
 * page). Sa valeur, 4 sur 7, est celle de l'équipe et de CORUM, pas celle du DIC (3 sur 7) : voir
 * facts.risk, qui porte l'écart, et le commentaire du tableau plus bas.
 * Plus de carte « zone » depuis le 16/09/2026, remplacée par l'horizon d'investissement. La carte
 * « Approche » dit « Diversifiée », mot que la brochure employait et que le contrôle de conformité
 * signale : le patrimoine peut être concentré au démarrage (strategy.ts, pilier « Où »).
 * Aucun encart ne porte plus de contre-poids risque : ni champ `risk` par carte, ni contre-poids de
 * section (retiré le 14/09/2026, voir en bas du fichier). Aucune donnée de performance, aucun
 * exemple d'investissement. Aucun chiffre en dur : tout vient de src/content/fr/facts.ts.
 */

/** Espace insécable avant % € : ; ? ! : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1');

/*
 * Type DÉCLARÉ et non `satisfies` : `intro` est désormais facultative et absente de ce contenu.
 * Avec `satisfies`, le type déduit est celui du littéral, et le composant qui lit `highlights.intro`
 * ne compilait plus. L'annotation garde le contrôle du littéral et expose le champ optionnel.
 */
export const highlights: HighlightsContent = {
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
   * lettre). Trois d'entre elles s'écartaient des documents de référence ; l'équipe en a décidé
   * ainsi, et le contrôle de conformité les signale désormais en avertissement, à chaque
   * exécution :
   *  - « Niveau de risque 4/7 » : le DIC dit 3 sur 7 (il n'est plus hébergé sur ce site depuis le
   *    18/09/2026). Voir facts.risk, qui porte l'écart au complet. Plus aucune phrase du site
   *    n'attribue cette valeur au DIC ;
   *  - « Zone d'investissement : Monde » : le DIC borne la zone aux pays du Conseil de l'Europe, en
   *    zone euro et hors zone euro, et au Canada. Carte remplacée le 16/09/2026 par l'horizon
   *    d'investissement (voir plus bas) ;
   *  - « Approche : Diversifiée » : R Start n'a pas encore de patrimoine à diversifier.
   * Aucun chiffre en dur : tout vient de src/content/fr/facts.ts.
   */
  title: 'R Start en un clin d’œil',
  cards: [
    { label: 'Ticket d’entrée', value: nb(share.priceLabel) },
    { label: 'Niveau de risque', value: risk.sriLabel },
    /** income.frequency vaut « Mensuelle » ; accordé ici au libellé (« revenus »). */
    { label: 'Revenus potentiels', value: 'Mensuels' },
    /*
     * DEUX EXPLICATIONS DÉPLIABLES (15/09/2026, textes de l'équipe). « Diversifiée » et « Monde » sont
     * les deux valeurs du tableau qu'un mot ne suffit pas à rendre : elles nomment un mandat, pas une
     * caractéristique observable. Le bouton « i » les développe sans allonger la carte. Ce ne sont pas
     * des notes légales : celles des cartes, qui donnaient leur source et leur limite, ont quitté
     * l'écran le 14/09/2026 et le code le 22/09/2026 (archivées hors du dépôt, .claude/audits).
     */
    {
      label: 'Approche',
      value: 'Diversifiée',
      info: 'R Start investit dans tous secteurs, toutes zones géographiques et tous types d’immeubles pour ne pas dépendre d’une seule source de performance.',
    },
    /*
     * « HORIZON D'INVESTISSEMENT » REMPLACE « ZONE D'INVESTISSEMENT » le 16/09/2026, demande de
     * l'équipe. La carte disait « Monde », elle dit maintenant la durée.
     *
     * HUIT ANS, CHOIX DE L'ÉQUIPE RÉITÉRÉ APRÈS MISE EN GARDE, abandonné le 16/09/2026 : la carte
     * dit dix ans (commentaire suivant). Ce qui avait été signalé :
     *  - le DIC donne une durée de placement recommandée de DIX ans (facts.ts,
     *    `risk.recommendedHoldingLabel`, sourcé « DIC, bulletin ») ;
     *  - le site affiche ces dix ans PARTOUT AILLEURS : dans la FAQ de cette même page, dans celle de
     *    /faq, et dans les mentions légales. La carte les contredisait à quelques écrans d'écart ;
     *  - les huit ans sont autre chose dans les documents : le seuil au-delà duquel R Start ne prélève
     *    plus de commission de retrait (`fees.withdrawal.zeroAfterYears`) ;
     *  - une communication commerciale ne peut pas contredire le DIC, et l'AMF l'a déjà relevé sur ce
     *    projet à propos de l'indicateur de risque.
     * LA VALEUR ÉTAIT ÉCRITE EN DUR, et pas tirée de `zeroAfterYears` : c'eût été accréditer l'idée
     * que l'horizon se déduit du barème de retrait, et un ajustement du barème aurait changé
     * l'horizon en silence. `risk.recommendedHoldingLabel` était la source à reprendre pour
     * rétablir le DIC : c'est elle que la carte lit depuis le 16/09/2026.
     *
     * L'explication de la zone est partie avec elle : elle parlait de géographie.
     */
    {
      /*
       * DIX ANS depuis le 16/09/2026 (« mets à jour à 10 ans partout »). La carte a dit « 8 ans
       * minimum » entre le 15 et le 16/09/2026, sur décision de l'équipe ; elle revient à la valeur des
       * documents.
       *
       * C'ÉTAIT LA SEULE CONTRADICTION DU SITE, et elle est levée : le DIC, la note d'information, la
       * FAQ de l'accueil, celle de /faq et les mentions légales disent dix ans, la carte disait huit.
       * Une communication commerciale ne peut pas contredire le DIC.
       *
       * LES HUIT ANS QUI RESTENT AILLEURS SONT AUTRE CHOSE et ne bougent pas : c'est le seuil au-delà
       * duquel R Start ne prélève plus de commission de retrait (`fees.withdrawal.zeroAfterYears`).
       * Confondre les deux serait laisser croire qu'on peut sortir sans frais après huit ans ET que
       * c'est la durée conseillée.
       *
       * La valeur vient maintenant de `risk.recommendedHoldingLabel`, la source documentaire, et n'est
       * plus écrite en dur : c'est elle qui fait foi le jour où le DIC change.
       */
      label: 'Horizon d’investissement',
      value: nb(risk.recommendedHoldingLabel),
      /* Texte de l'équipe, 16/09/2026. La dernière phrase de la phrase fournie était interrompue
         (« les revenus ne sont pas garantis et le prix. ») : elle est complétée par la formule employée
         partout ailleurs sur le site, le prix de la part varie à la hausse comme à la baisse. */
      info: 'La durée de placement recommandée dans une SCPI est de 10 ans. Comme un investissement immobilier en direct, l’investissement en SCPI présente un risque de perte en capital, les revenus ne sont pas garantis et le prix de la part peut varier à la hausse comme à la baisse. Les performances passées ne préjugent pas des performances futures.',
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
    { label: 'Souscription', value: nb(subscription.onlineLabel) },
    {
      label: 'Versements automatiques',
      value: nb(`dès ${subscription.options.pei.minimumMonthlyLabel}`),
    },
    { label: 'Réinvestissement automatique', value: 'des dividendes' },
  ],
  /*
   * PAS DE CONTRE-POIDS SOUS LE TABLEAU depuis le 14/09/2026 (demande de l'équipe) : le document
   * n'en porte pas, le tableau s'arrête à ses sept lignes. Le texte retiré était : « Ces repères décrivent le
   * produit, ils ne réduisent aucun de ses risques. Le capital n'est pas garanti… Durée de placement
   * recommandée : 10 ans. »
   * Ce qu'il portait n'a plus d'équivalent près du tableau : la ligne risques du hero, qui ouvrait
   * la page avec la perte en capital, les revenus non garantis, la liquidité limitée et le risque
   * de change, a été retirée le même jour, comme les appels de note des lignes, qui donnaient leur
   * source et leur limite. Reste la section Risques, plus bas sur l'accueil.
   */
};
