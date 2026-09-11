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
const APPELEES_SUR_ACCUEIL = ['confiance-trustpilot', 'confiance-chiffres'];
export const homeNotes: LegalNote[] = notes.filter((n) => APPELEES_SUR_ACCUEIL.includes(n.id));
if (homeNotes.length !== APPELEES_SUR_ACCUEIL.length) {
  throw new Error(
    `corum.ts : ${homeNotes.length} note(s) trouvée(s) sur ${APPELEES_SUR_ACCUEIL.length} — un id a changé.`
  );
}

export const corum = {
  eyebrow: 'CORUM',
  title: 'L’expérience derrière R Start',
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

  range: {
    title: `Des SCPI gérées depuis ${corumGroup.scpiSince}`,
    description: `CORUM gère des SCPI depuis ${corumGroup.scpiSince} et en compte aujourd’hui ${corumGroup.scpiCount}, avec ${corumGroup.offices} bureaux. ${product.name} est la plus récente. Elle a ouvert ses souscriptions le ${product.openingDate.label} et n’a pas encore d’historique propre. Les résultats des autres SCPI CORUM ne préjugent pas des siens.`,
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
  aboutLink: 'En savoir plus sur CORUM',
  disclaimer: corumGroup.disposalsDisclaimer,

  notes,
} satisfies CorumContent;

export default corum;
