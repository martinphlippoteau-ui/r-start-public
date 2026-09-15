import type { CorumContent, LegalNote } from '@/content/types';
import { corumGroup, product } from '@/content/fr/facts';
import { managementCompany } from '@/content/fr/legal';
import { experienceStats, notes as trustNotes } from '@/content/fr/trust';

/**
 * Section « L'expérience derrière R Start » (id : corum), rendue avec trust.ts dans la section
 * « Confiance » (07-Trust.astro). Zone 4 de la page d'accueil, réunion produit du 10/09/2026.
 * Quatre chiffres repris de la brochure partenaires 2026, p. 7 : ancienneté, épargne gérée,
 * épargnants, SCPI gérées depuis 2012. La formule « objectifs tenus » de la brochure n'est pas
 * reprise (allégation de performance) : l'ancienneté est décrite comme une durée d'activité,
 * « 15 ans à investir en immobilier d'entreprise ». Le montant de plus-values redistribuées cité
 * dans la brochure reste hors du site tant que CORUM n'a pas répondu à l'AMF.
 * Chaque bloc porte son contre-poids risque, à la même taille : `intro` (l'expérience du groupe ne
 * préjuge de rien), `statsRisk` (chiffres du groupe, pas de R Start), `disclaimer` (les cessions
 * passées ne préjugent pas des performances futures) et `alignmentBody` (effets de seuil de la
 * commission d'arbitrage, énoncés dans le même paragraphe que l'alignement d'intérêts).
 * Les chiffres du groupe restent gouvernés par facts.corumGroup : aucun arbitrage ici.
 * Sur l'accueil, la bande de chiffres rendue est celle de trust.stats, qui expose les quatre chiffres
 * de la zone 4 (trust.experienceStats) ; `stats` les reprend à l'identique, gouvernés par STATS_DATED.
 * `alignmentBody` : « ne touche une commission que si l'ensemble des ventes est gagnant » décrit le
 * mécanisme de réserve (note d'information ch. III § 4), pas un alignement sur votre résultat.
 * Notes : `notes` agrège les notes de trust.ts (cadre réglementaire, visa, Trustpilot, chiffres) et
 * celles définies ici (mention légale de l'agrément, gamme, compensation) dans l'ordre de lecture de
 * 07-Trust.astro ; notes.ts n'importe que ce fichier.
 */

/** Espace insécable avant % € : ; ? ! et devant « Md€ » : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1').replace(/ (Md€)/g, ' $1');

/**
 * Passer à true une fois la date d'arrêté des chiffres groupe confirmée par CORUM et reportée dans
 * facts.corumGroup.statsSource (« données au … »). Aujourd'hui false : le dépôt ne contient qu'une date
 * de consultation de corum.fr (08/09/2026, facts.corumGroup.statsDate), la brochure partenaires 2026
 * n'en donne pas non plus. Une date de consultation n'est pas une date d'arrêté : `stats` reste donc
 * vide ici. La bande rendue sur l'accueil (trust.stats, 07-Trust.astro) affiche les mêmes chiffres avec
 * une source qui dit explicitement que la date d'arrêté n'est pas communiquée, faute d'état vide dans le
 * composant ; lui appliquer ce même drapeau demande d'y ajouter un état vide (hors périmètre contenu).
 */
const STATS_DATED = false;

const others = corumGroup.scpiNames.slice(0, -1);
const otherScpi = `${others.slice(0, -1).join(', ')} et ${others[others.length - 1]}`;

/** Notes propres à ce fichier (mention légale de l'agrément, gamme, compensation). */
const corumNotes: LegalNote[] = [
  {
    id: 'corum-agrement',
    text: `${managementCompany.name} : ${managementCompany.amfApproval}`,
  },
  {
    id: 'corum-gamme',
    text: `Nombre de SCPI gérées, ancienneté du groupe et nombre de bureaux : source CORUM, brochure partenaires 2026, p. 7. ${otherScpi} sont des SCPI distinctes de R Start. Chacune a sa propre stratégie et ses propres frais. Leurs résultats ne préjugent pas de ceux de R Start.`,
  },
  {
    id: 'corum-savoir-faire',
    text: `Familles de solutions d’épargne du groupe CORUM (SCPI, fonds obligataires, assurance vie et plan d’épargne retraite) : texte de présentation de CORUM L’Épargne remis avec le kit média, et corum.fr consulté le ${corumGroup.statsDate.label}. Ces solutions sont distinctes de R Start. Elles ne sont ni proposées ni décrites sur ce site : chacune a ses propres documents réglementaires, ses propres frais et ses propres risques.`,
  },
  {
    id: 'corum-compensation',
    text: 'Mécanisme de compensation des moins-values : lorsqu’une vente génère une moins-value, celle-ci est enregistrée dans une réserve dédiée. Aucune commission sur les cessions n’est perçue tant que cette réserve n’est pas intégralement compensée par des plus-values futures. Détail au chapitre III, section 4 de la note d’information de R Start.',
  },
];

/** Ordre de lecture des appels de note dans 07-Trust.astro ; une note non listée irait en fin. */
const readingOrder = [
  'confiance-agrement',
  'corum-agrement',
  'confiance-visa',
  'confiance-trustpilot',
  'confiance-chiffres',
  'corum-savoir-faire',
  'corum-gamme',
  'corum-compensation',
];
const rank = (id: string): number => {
  const i = readingOrder.indexOf(id);
  return i === -1 ? readingOrder.length : i;
};

/** Toutes les notes de la section Confiance (trust.ts + corum.ts), numérotées dans l'ordre de lecture. */
export const notes: LegalNote[] = [...trustNotes, ...corumNotes].sort(
  (a, b) => rank(a.id) - rank(b.id)
);

/**
 * Notes appelées par la section telle qu'elle est rendue sur l'accueil (11/09/2026) : le cadre
 * réglementaire est passé sur /documentation, la gamme et l'ambiance sur /a-propos, et le bloc
 * « rémunération sur les ventes » a été retiré,
 * leurs notes n'ont donc plus d'appel ici. `notes` reste l'export complet pour les autres pages.
 */
const APPELEES_SUR_ACCUEIL = ['confiance-trustpilot'];
export const homeNotes: LegalNote[] = notes.filter((n) => APPELEES_SUR_ACCUEIL.includes(n.id));
if (homeNotes.length !== APPELEES_SUR_ACCUEIL.length) {
  throw new Error(
    `corum.ts : ${homeNotes.length} note(s) trouvée(s) sur ${APPELEES_SUR_ACCUEIL.length}, un id a changé.`
  );
}

/**
 * ZONE 2 de /a-propos (14/09/2026) : texte fourni par l'équipe, repris mot pour mot. Elle raconte d'où
 * vient CORUM et pourquoi R Start arrive maintenant. Aucun chiffre de performance, aucune comparaison
 * de résultats : que des caractéristiques de modèle.
 *
 * DEUX PHRASES À FAIRE VALIDER PAR LA CONFORMITÉ, signalées à l'équipe le jour même :
 *  - « Aujourd'hui, la société est leader sur le marché » est une allégation de rang SANS PÉRIMÈTRE
 *    (leader de quoi, mesuré comment, à quelle date) et SANS SOURCE. C'est la même famille que le
 *    « la seule SCPI » de /frais ; check-compliance.mjs la signale désormais en avertissement ;
 *  - « d'objectifs tenus », dans les chiffres juste en dessous, est déjà signalé depuis le 14/09/2026.
 */
export const history = {
  title: 'En 2011, CORUM a une conviction',
  lead: 'L’immobilier professionnel doit être accessible à tous, et pas réservé aux initiés ou aux plus aisés.',
  transformIntro: 'Très vite, CORUM transforme le modèle des SCPI de fond en comble :',
  transformItems: [
    'Un faible ticket d’entrée à partir de quelques dizaines d’euros,',
    'Des explications sans jargon,',
    'Des revenus potentiels qui tombent tous les mois,',
    'Des SCPI qui se mettent à acheter des immeubles hors de France puis hors d’Europe,',
    'La possibilité de réinvestir automatiquement ses revenus ou de mettre en place un programme d’investissement progressif…',
  ],
  transformOutro: 'Tout ça, c’est CORUM.',
  today: 'Aujourd’hui, la société est leader sur le marché.',
  /** La phrase de bascule : c'est elle qui amène R Start, le gras est dans le document fourni. */
  chapter: {
    lead: '14 ans et quatre SCPI plus tard,',
    strong: 'R Start ouvre un nouveau chapitre.',
  },
} as const;

export const corum = {
  eyebrow: 'CORUM',
  /*
   * « Le groupe CORUM en quelques chiffres » depuis le 15/09/2026, ex-« L'expérience derrière
   * R Start ». La section ne porte plus les avis Trustpilot mais le bandeau des quatre chiffres du
   * groupe : son titre dit maintenant ce qu'elle montre. Le libellé est celui de `trust.stats.title`,
   * qui titrait ce bandeau jusqu'ici en sous-titre et faisait donc doublon.
   */
  title: 'Le groupe CORUM en quelques chiffres',
  /** Phrase d'ouverture de la zone 4, suivie de son contre-poids dans le même bloc et à la même taille. */
  intro: nb(
    `R Start s’appuie sur ${corumGroup.experienceLabel} d’expertise du groupe CORUM dans l’investissement immobilier. Cette expérience ne préjuge pas des résultats de R Start. La SCPI a ouvert ses souscriptions le ${product.openingDate.label} et n’a pas d’historique propre.`
  ),

  /** Bloc vide tant que STATS_DATED est false : le composant n'affiche alors ni chiffres ni source. */
  stats: STATS_DATED ? experienceStats : [],
  statsSource: STATS_DATED
    ? nb(
        `${corumGroup.statsSource} Ancienneté du groupe et nombre de SCPI gérées : brochure partenaires 2026, p. 7.`
      )
    : '',
  /** Contre-poids des quatre chiffres, rendu avec eux et à la même taille. */
  statsRisk: nb(
    `Ces chiffres décrivent le groupe CORUM, pas R Start. Ils peuvent évoluer. La taille du groupe ne préjuge ni des résultats de R Start, ni de la liquidité de ses parts. Le capital investi n’est pas garanti.`
  ),

  /**
   * Les trois familles de solutions du groupe (page /a-propos, demande du 13/09/2026). Le site ne parle
   * que de R Start : ce bloc dit ce que fait le groupe, il ne propose rien d'autre et ne décrit aucun
   * de ces produits. Chaque description reste au niveau de l'activité (ce que c'est), jamais du produit
   * (ce qu'il rapporte) : aucun chiffre, aucune performance, aucune comparaison.
   * SOURCE À VALIDER PAR CORUM : le texte de présentation du kit média (facts.press.mediaKit.boilerplate,
   * lui-même « à valider ») cite « SCPI, assurance vie, fonds obligataires » ; le plan d'épargne retraite
   * vient du nommage des visuels livrés par CORUM (assets, dossier ambiance). À confirmer avant diffusion.
   */
  expertise: {
    title: 'Les trois savoir-faire de CORUM L’Épargne',
    intro: `CORUM L’Épargne est la marque de distribution du groupe CORUM, indépendant, créé en 2011. Le groupe conçoit et gère trois familles de solutions d’épargne. R Start relève de la première.`,
    items: [
      {
        kicker: 'Immobilier',
        icon: 'equipe',
        title: 'Les SCPI',
        description: `CORUM Asset Management gère ${corumGroup.scpiCount} SCPI depuis ${corumGroup.scpiSince}. Une SCPI achète et loue des immeubles d’entreprise, puis reverse à ses associés les loyers encaissés, après frais. R Start est la plus récente des cinq.`,
      },
      {
        kicker: 'Obligations',
        icon: 'argent',
        title: 'Les fonds obligataires',
        description:
          'Le groupe gère aussi des fonds investis en obligations d’entreprises, c’est-à-dire en dette émise par des sociétés. Le fonctionnement, l’horizon de placement et les risques n’ont rien de commun avec ceux d’une SCPI.',
      },
      {
        kicker: 'Épargne de long terme',
        icon: 'calendrier',
        title: 'L’assurance vie et le plan d’épargne retraite',
        description:
          'CORUM L’Épargne distribue un contrat d’assurance vie et un plan d’épargne retraite. Ce sont des enveloppes, avec leur propre fiscalité, leurs propres frais et leurs propres conditions de sortie.',
      },
    ],
    risk: 'Chacune de ces solutions a ses propres risques et ses propres frais, décrits dans ses documents réglementaires. L’étendue de la gamme ne réduit aucun des risques de R Start : le capital investi y reste exposé à une perte.',
  },

  /*
   * ZONE 4 de /a-propos, texte fourni par l'équipe le 14/09/2026 et repris MOT POUR MOT.
   *
   * À FAIRE VALIDER PAR LA CONFORMITÉ, signalé à l'équipe le jour même, et c'est le point le plus lourd
   * de la page : « les SCPI du groupe CORUM ont toujours atteint ou dépassé leurs objectifs de
   * performance » est une ALLÉGATION DE PERFORMANCE PASSÉE, portant sur quatre SCPI tierces, sans
   * source, sans période, sans définition de l'objectif, et sans la mention que les performances
   * passées ne préjugent pas des performances futures.
   * Elle remplace un texte qui disait exactement l'inverse : « R Start n'a pas encore d'historique
   * propre ; les résultats des autres SCPI CORUM ne préjugent pas des siens ». Ce texte-là reste dans
   * l'en-tête de la note 3 de la page, c'est désormais le seul endroit qui le dit.
   * check-compliance.mjs la signale à chaque exécution.
   */
  range: {
    title: `Des SCPI gérées depuis ${corumGroup.scpiSince}`,
    description: `Depuis ${corumGroup.scpiSince}, les SCPI du groupe CORUM ont toujours atteint ou dépassé leurs objectifs de performance.`,
    scpiNames: [...corumGroup.scpiNames],
    currentBadge: 'Nouveau',
  },

  /** Titre du bloc facultatif de la section : `alignmentBody` en est le corps (brochure p. 4). */
  alignmentTitle: 'La rémunération de CORUM sur les ventes',
  /** Avantage et contrepartie dans le même paragraphe, à la même taille (exigence AMF). */
  alignmentBody: nb(
    'Quand R Start revend un immeuble, CORUM ne touche une commission (dite « d’arbitrage ») que si l’ensemble des ventes est gagnant. Cette commission a des effets de seuil et peut capter une partie significative de la plus-value. CORUM peut aussi être rémunérée sur une plus-value alors même que la valeur de vos parts diminue.'
  ),

  /** Bouton vers /a-propos (la gamme et l'ambiance y sont depuis le 11/09/2026). */
  /* « Découvrir le groupe CORUM » depuis le 15/09/2026, ex-« En savoir plus sur CORUM » : même
     forme que « Découvrir notre approche », l'autre appel secondaire de l'accueil. */
  aboutLink: 'Découvrir le groupe CORUM',
  disclaimer: corumGroup.disposalsDisclaimer,

  notes,
} satisfies CorumContent;

export default corum;
