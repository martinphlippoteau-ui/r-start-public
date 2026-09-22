import type { CorumContent, LegalNote } from '@/content/types';
import { corumGroup, externalLinks } from '@/content/fr/facts';
import { managementCompany } from '@/content/fr/legal';
import { notes as trustNotes } from '@/content/fr/trust';

/**
 * Section « Le groupe CORUM en quelques chiffres » (id : corum, « L'expérience derrière R Start »
 * jusqu'au 15/09/2026), rendue sur l'accueil par 07-Trust.astro : le titre `corum.title`, le
 * bandeau des chiffres du groupe, qui vient de trust.ts (`trust.stats`, seul élément de ce
 * fichier-là rendu dans la section), et le bouton `aboutLink`. Zone 4 de la page d'accueil, réunion
 * produit du 10/09/2026. Les chiffres (trust.experienceStats) viennent de la brochure partenaires
 * 2026, p. 7. La formule « objectifs tenus » de la brochure EST reprise depuis le 14/09/2026, dans
 * le libellé du premier chiffre (« d'expertise et d'objectifs tenus », texte de l'équipe) : c'est
 * une allégation de performance, que le contrôle de conformité signale en avertissement. Le montant
 * de plus-values redistribuées cité dans la brochure reste hors du site tant que CORUM n'a pas
 * répondu à l'AMF. Contre-poids risque des blocs, EN VEILLE : `intro` (l'expérience du groupe ne
 * préjuge de rien), `statsRisk` (chiffres du groupe, pas de R Start), `disclaimer` (les cessions
 * passées ne préjugent pas des performances futures) et `alignmentBody` (effets de seuil de la
 * commission d'arbitrage, énoncés dans le même paragraphe que l'alignement d'intérêts). Aucun n'est
 * rendu, ni sur l'accueil ni sur /a-propos : les textes sont gardés, prêts à resservir.
 * Les chiffres du groupe restent gouvernés par facts.corumGroup : aucun arbitrage ici.
 * `alignmentBody` : « ne touche une commission que si l'ensemble des ventes est gagnant » décrit le
 * mécanisme de réserve (note d'information ch. III § 4), pas un alignement sur votre résultat.
 * Notes : `notes` agrège les notes de trust.ts (cadre réglementaire, visa, Trustpilot, chiffres) et
 * celles définies ici (mention légale de l'agrément, gamme, compensation), dans l'ordre de lecture
 * de l'ancienne section Confiance ; aboutPage.ts en tire la liste de /a-propos. Aucune n'est
 * affichée (NoteRef et LegalNotes coupés), et notes.ts n'importe plus rien.
 */

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

/**
 * Ordre de lecture des appels de note de l'ancienne section Confiance (07-Trust.astro, quand elle
 * portait encore le cadre réglementaire, les avis et la gamme) ; une note non listée irait en fin.
 */
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
 * Notes appelées par la section telle qu'elle était rendue sur l'accueil le 11/09/2026 : le cadre
 * réglementaire est passé sur /documentation, la gamme et l'ambiance sur /a-propos, et le bloc
 * « rémunération sur les ventes » a été retiré,
 * leurs notes n'ont donc plus d'appel ici. `notes` reste l'export complet pour les autres pages.
 * EN VEILLE : `homeNotes` n'est plus importé nulle part depuis que le registre de l'accueil
 * (notes.ts) est vide. La liste n'est plus à jour : les avis, et avec eux `confiance-trustpilot`,
 * sont partis sur /a-propos le 15/09/2026, et la section appelle aujourd'hui `confiance-chiffres`.
 */
const APPELEES_SUR_ACCUEIL = ['confiance-trustpilot'];
export const homeNotes: LegalNote[] = notes.filter((n) => APPELEES_SUR_ACCUEIL.includes(n.id));
if (homeNotes.length !== APPELEES_SUR_ACCUEIL.length) {
  throw new Error(
    `corum.ts : ${homeNotes.length} note(s) trouvée(s) sur ${APPELEES_SUR_ACCUEIL.length}, un id a changé.`
  );
}

export const corum = {
  /*
   * « Le groupe CORUM en quelques chiffres » depuis le 15/09/2026, ex-« L'expérience derrière
   * R Start ». La section ne porte plus les avis Trustpilot mais le bandeau des quatre chiffres du
   * groupe : son titre dit maintenant ce qu'elle montre. Le libellé est celui de `trust.stats.title`,
   * qui titrait ce bandeau jusqu'ici en sous-titre et faisait donc doublon.
   */
  title: 'Le groupe CORUM en quelques chiffres',
  /** Bouton vers /a-propos (chiffres du groupe, gamme des autres SCPI et avis Trustpilot). */
  /* « Découvrir le groupe CORUM » depuis le 15/09/2026, ex-« En savoir plus sur CORUM » : même
     forme que « Découvrir notre approche », l'autre appel secondaire de l'accueil. */
  aboutLink: 'Découvrir le groupe CORUM',
  /*
   * Appel SOUS LES CHIFFRES DU GROUPE, sur /a-propos (16/09/2026). Il sort du site, vers corum.fr :
   * c'est le seul appel du site à le faire depuis le corps d'une page, d'où la mention de nouvelle
   * fenêtre lue par les lecteurs d'écran. Le libellé est plus court que celui de l'accueil, qui reste
   * interne et mène ici même.
   */
  siteLink: {
    label: 'Découvrir CORUM',
    href: externalLinks.corum,
    newTabHint: 'nouvelle fenêtre',
  },
} satisfies CorumContent;
