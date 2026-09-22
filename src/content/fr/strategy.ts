import type { StrategyContent } from '@/content/types';

/**
 * Page /strategie, « Stratégie d'investissement ». CONTENU FOURNI PAR L'ÉQUIPE le 14/09/2026 et repris
 * mot pour mot, « ni plus ni moins » : les deux moteurs de performance, puis trois volets (`what`,
 * `where`, `how` : Sélective, Diversifiée, Opportuniste). L'en-tête de la page porte le titre
 * (strategyPage.ts) ; ce fichier porte le corps.
 *
 * CE QUI A QUITTÉ LA PAGE, et ne vit plus nulle part sur le site : le mot d'ordre « Acheter décoté,
 * valoriser, revendre » et son contre-poids, les trois piliers avec les leurs, la carte des pays du
 * Conseil de l'Europe et du Canada (elle disait l'inverse de « partout dans le monde »), la liste des
 * types d'actifs du DIC, l'effet de levier et son plafond d'endettement, et les quatre notes de sources
 * (la page n'a donc plus de bloc « Notes » : il n'aurait rien à déplier). Les chiffres correspondants
 * restent dans facts.ts, d'où les autres pages les tirent.
 *
 * PAS DE MENTION DE RISQUE DANS CE CORPS : celle qui suivait les deux moteurs (mention de la
 * Conformité du 14/09/2026) a quitté l'écran le 16/09/2026 et le code le 22/09/2026 ; son texte est
 * archivé hors du dépôt (.claude/audits/archive-contenus-2026-09-22.json). Les risques sont portés par
 * le bloc Risques que la page rend ensuite.
 */

export const strategy: StrategyContent = {
  /* Libellés des cartes qui se retournent, AFFICHÉS en toutes lettres depuis le 16/09/2026 :
     « En savoir plus » sur le bouton du recto, « Fermer » sur celui du dos
     (src/scripts/carteRetournee.ts). */
  dialogOpen: 'En savoir plus',
  dialogClose: 'Fermer',
  engines: {
    /* « R Start : 2 moteurs au service de la performance » depuis le 16/09/2026, texte de l'équipe.
       Chiffre et non lettre, comme dans « 4 étapes pour souscrire » : un titre se balaie, un
       chiffre s'y repère plus vite. */
    title: 'R Start : 2 moteurs au service de la performance',
    /*
     * TEXTES DE L'ÉQUIPE, 16/09/2026. Les deux cartes portaient une ligne chacune (« versés par les
     * entreprises locataires », « réalisées sur les ventes d'immeuble ») ; elles portent maintenant
     * le paragraphe qui explique le moteur.
     *
     * DEUX RETOUCHES SUR LE TEXTE FOURNI, et rien d'autre : « la cherche » corrigé en « la
     * recherche », et un point final ajouté à la carte des loyers, qui n'en avait pas.
     *
     * « de façon plus systématique que d'autres SCPI » est une COMPARAISON avec le reste du marché,
     * sans périmètre et sans source. check-compliance.mjs la signale comme allégation à défendre :
     * c'est voulu, la mention reste visible dans le rapport tant que CORUM n'a pas fourni la base de
     * la comparaison. Les autres comparaisons du site (« la première SCPI », « la seule SCPI »)
     * portent une note de périmètre ; celle-ci n'en a pas encore.
     */
    items: [
      /* `benefit` : la ligne sous le titre de la carte (17/09/2026, texte de l'équipe mot pour mot).
         « tous les mois » est exact : distribution mensuelle (facts.ts, `frequency`). « potentiels »
         est indispensable, les revenus d'une SCPI n'étant pas garantis. */
      {
        lead: 'Les loyers',
        benefit: 'Pour vous : des revenus potentiels tous les mois',
        rest: 'Comme toute SCPI de rendement, R Start distribue à ses épargnants des revenus potentiels (appelés « dividendes ») issus des loyers facturés aux entreprises locataires de ses immeubles.',
      },
      {
        lead: 'Les plus-values',
        benefit: 'Pour vous : des revenus potentiels à chaque vente d’immeuble',
        rest:
          'R Start met au cœur de sa démarche la recherche de plus-values sur les ventes d’immeubles. C’est une particularité de cette SCPI. En clair, R Start vise à dégager des plus-values sur vente d’immeubles de façon plus systématique que d’autres SCPI. Les plus-values réalisées sont redistribuées aux épargnants sous forme de dividendes. C’est la deuxième source de revenus potentiels pour les clients de la SCPI R Start.',
      },
    ],
    /* La phrase de méthode (« Les opportunités ne tombent pas du ciel… ») est descendue sous « Tout
       commence par le choix des immeubles » le 16/09/2026 : elle y annonce ce qui suit au lieu de
       fermer les deux moteurs. */
  },

  /*
   * EN-TÊTE DES TROIS VOLETS (16/09/2026, texte de l'équipe). « pour les alimenter » renvoie aux deux
   * moteurs du bloc précédent : le titre fait donc la jointure entre les deux blocs, et doit rester
   * juste après eux.
   * Chiffre et non lettre (« 3 volets »), comme « 2 moteurs » et « 4 étapes pour souscrire ».
   */
  tilesTitle: 'Une approche en 3 volets pour les alimenter',

  what: {
    /*
     * SURTITRES REMPLACÉS LE 16/09/2026 : « Quoi », « Où », « Comment » deviennent trois adjectifs.
     * LA CORRESPONDANCE EST FAITE PAR LE SENS, pas par l'ordre de la liste fournie (« Opportuniste,
     * Sélective et diversifiée ») : l'équipe a joint le contenu de la diversification, et ce contenu
     * est celui de l'ancienne zone « Où », partout dans le monde et dans tous les secteurs. Les deux
     * autres suivent : choisir les immeubles, c'est être SÉLECTIVE ; les acheter moins cher que leur
     * valeur et choisir le moment de vendre, c'est être OPPORTUNISTE. À intervertir si l'équipe
     * voulait l'ordre de sa liste.
     */
    eyebrow: 'Sélective',
    /* « Tout commence par le choix des immeubles » depuis le 16/09/2026, ex-« Des immeubles offrant un
       double potentiel ». */
    title: 'Tout commence par le choix des immeubles',
    /* Phrase de méthode remontée de la zone 1 le 16/09/2026 : elle ouvre le propos au lieu de fermer
       le précédent. */
    intro:
      'Les opportunités ne tombent pas du ciel : nous suivons une méthode d’investissement précise pour dénicher les bons immeubles, loués par les bonnes entreprises, et générer du rendement potentiel.',
    lead: 'L’équipe cible des immeubles avec à la fois :',
    items: [
      { lead: 'Un fort potentiel de rendement locatif ;' },
      { lead: 'Et un fort potentiel de plus-value.' },
    ],
    outro:
      'Il s’agit principalement d’immeubles de taille intermédiaire, un secteur où la concurrence est relativement limitée.',
  },

  where: {
    eyebrow: 'Diversifiée',
    /* Contenu fourni par l'équipe le 16/09/2026. Il remplace « Une vaste zone d'investissement » et
       son « Pas de limite ! R Start investit : ». */
    title: 'Viser large pour viser juste.',
    intro: 'R Start diversifiera ses acquisitions :',
    /* Pictogrammes sur les deux items (16/09/2026, demande de l'équipe) : ce sont les deux éléments
       importants de la zone, ils prennent une puce dessinée à la place du point.
       « PARTOUT DANS LE MONDE », ET CE QUI RESTE À TRANCHER : le DIC du 20/05/2026 borne la zone aux
       pays du Conseil de l'Europe et au Canada. Le site dit « Monde » depuis le 14/09/2026, décision
       de l'équipe (facts.strategy.zoneLabel). La carte qui illustrait la zone a quitté la page le
       16/09/2026, sa légende le 22/09/2026 ; cette réserve, elle, vaut pour le texte. */
    items: [
      { lead: 'partout dans le monde', icon: 'exploration' },
      { lead: 'dans tous les secteurs', icon: 'equipe' },
    ],
    outro: 'Un seul mot d’ordre : identifier une opportunité',
  },

  /**
   * Volet « Opportuniste », ex-« Comment » (zone 5 du document de l'équipe, reçue le 14/09/2026
   * après les trois autres).
   */
  how: {
    eyebrow: 'Opportuniste',
    title: 'Les bons immeubles, au bon prix',
    intro: 'La base de notre travail ?',
    items: [
      {
        lead: 'Repérer des immeubles moins chers que leur vraie valeur et les acheter aux meilleures conditions ;',
      },
      { lead: 'Travailler à leur donner plus de valeur au fil des années ;' },
      {
        lead: 'Choisir le bon moment pour vendre un immeuble afin d’en tirer la plus-value la plus intéressante possible.',
      },
    ],
    outro:
      'Bien acheter ne suffit pas. Ce qui crée de la valeur, c’est aussi de savoir bien gérer et bien vendre !',
  },
};
