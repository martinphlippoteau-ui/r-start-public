import type { LegalNote } from '@/content/types';
import type { PressArticle, PressContent, PressQuote } from '@/content/types-v2';
import { fees, press as pressFacts } from '@/content/fr/facts';

/**
 * Page /presse, « La presse en parle » (grand public, arbitrage du 10/09/2026).
 * Trois citations mises en avant, la revue des articles reliés avec leur média et leur date, puis
 * l'avertissement livré par CORUM. Les communiqués, les contacts et le kit média ont quitté cette page :
 * ils vivent sur /salle-de-presse (pressRoom.ts), en pied de page seulement.
 *
 * Règles appliquées :
 *  - les titres et les citations sont des propos de tiers, reproduits mot pour mot depuis facts.ts et
 *    couverts par `coverage.disclaimer` ; ils ne sont ni réécrits ni neutralisés (le filtre historique
 *    sur « sans frais » est retiré, plan §5). L'introduction de la revue rappelle, dans le même bloc,
 *    les frais réellement prélevés par R Start : R Start n'est pas une SCPI sans frais ;
 *  - un article dont l'adresse n'a pas été vérifiée N'EST PAS REPRIS (14/09/2026) : il reste dans
 *    facts.ts et revient de lui-même le jour où son adresse est renseignée ;
 *  - aucun logo de média (aucune licence) : les noms sont en typographie ;
 *  - aucune donnée de performance, aucun chiffre repris des articles : seuls les faits de facts.ts sont
 *    cités, et R Start n'a pas d'historique propre.
 */

/** Espace insécable (U+00A0) avant % € : ; ? ! : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1');
/** Apostrophe typographique pour les libellés écrits avec une apostrophe droite, puis `nb`. */
const typo = (s: string): string => nb(s.replace(/'/g, '’'));

/** Date à laquelle la sélection d'articles a été livrée par CORUM et les adresses vérifiées. */
const coverageCheckedOn = { label: '10 septembre 2026', iso: '2026-09-10' } as const;

/**
 * Revue de presse : la sélection de facts.ts, dans son ordre, RÉDUITE AUX ARTICLES QUI ONT UNE ADRESSE
 * (14/09/2026, demande de l'équipe : « mets uniquement les parutions presse avec des liens »). Un titre
 * de presse sans lien demande au lecteur de croire sur parole ; avec le lien, il vérifie lui-même.
 *
 * LE FILTRE EST ICI, PAS DANS facts.ts : les cinq articles écartés y restent entiers, avec leur média,
 * leur titre et leur date. Ils REVIENNENT TOUT SEULS le jour où leur `url` est renseignée, sans qu'il
 * y ait rien d'autre à faire. Deux d'entre eux sont à une vérification près, leur adresse candidate est
 * notée sur place dans facts.ts : Les Echos et Business Immo, tous deux bloqués par un 403 anti-robot.
 *
 * Le titre est reproduit tel qu'il a été publié.
 */
const articles: PressArticle[] = pressFacts.coverage
  .filter((a) => a.url.trim() !== '')
  .map((a) => ({
    media: a.media,
    title: typo(a.title),
    date: a.date.label,
    dateIso: a.date.iso,
    url: a.url,
  }));

/** Citations mises en avant : propos de tiers, avec leur média et leur date. */
const quotes: PressQuote[] = pressFacts.quotes.map((q) => ({
  text: typo(q.text),
  media: q.media,
  date: q.date.label,
  dateIso: q.date.iso,
}));

const rawNotes: LegalNote[] = [
  {
    id: 'presse-citations',
    text: `Citations extraites d’articles publiés par des médias tiers, reproduites mot pour mot avec leur média et leur date, telles que transmises par CORUM L’Épargne le ${coverageCheckedOn.label}. Elles n’engagent que leurs auteurs et ne constituent ni une recommandation, ni un avis de CORUM Asset Management sur R Start.`,
  },
  {
    id: 'presse-revue',
    text: `Revue de presse : ${articles.length} articles de médias tiers publiés au lancement de R Start, sélection transmise par CORUM L’Épargne le ${coverageCheckedOn.label} et complétée depuis. Chacun renvoie vers sa publication d’origine ; les articles dont l’adresse n’a pas pu être vérifiée ne sont pas repris ici. Certains éditeurs réservent la lecture complète à leurs abonnés. Les titres sont ceux des articles : ils peuvent employer des formulations, des comparaisons ou des chiffres absents des documents réglementaires de R Start. Seuls le document d’informations clés et la note d’information font foi. Aucune donnée de performance de R Start n’est communiquée : la SCPI a moins de douze mois d’existence.`,
  },
];

/** Notes de la page, typographiées (espace insécable avant : ; ? ! % €). */
export const notes: LegalNote[] = rawNotes.map((n) => ({ ...n, text: nb(n.text) }));

/* ANNOTÉ, et non `satisfies` seul : `satisfies` conserve le type du littéral, et l'avertissement de la
   revue de presse ayant été retiré le 16/09/2026, le composant ne voyait plus la propriété du tout.
   L'annotation lui donne le type complet, champs facultatifs compris. */
export const press: PressContent = {
  seo: {
    /** ≤ 60 caractères. Contient « R Start » et « CORUM ». */
    title: 'La presse en parle : R Start, SCPI CORUM',
    /** 140 à 155 caractères, avec rappel de risque. */
    description:
      'Ce que la presse a écrit sur R Start, la SCPI du groupe CORUM, à son lancement. Placement à risque de perte en capital, revenus non garantis.',
  },

  hero: {
    eyebrow: 'La presse en parle',
    /* Zones réécrites le 15/09/2026, texte fourni par l'équipe. */
    /* « dans les médias » depuis le 16/09/2026, ex-« dans vos médias » : le possessif s'adressait au
       lecteur alors que la page parle de ce que la presse a écrit. */
    title: 'R Start dans les médias',
    intro: 'Découvrez les derniers articles parus',
    /* Plus de ligne risques dans l'en-tête (14/09/2026, demande de l'équipe : « supprime les bon à
       savoir de tous les hero sauf celui de la home »). Le « Bon à savoir : … » sous le H1 a disparu de
       TOUTES les sous-pages ; seul l'accueil le garde, sous ses appels à l'action. Ces pages n'ont donc
       plus de mention de risque dans leur en-tête : il reste celles de leur contenu quand elles en ont,
       et le pied de page, commun à tout le site. À rétablir en remettant `riskLine: shortRiskLine`. */
  },

  quotes: {
    /* Zone 2, titre du 15/09/2026. Les trois citations ne bougent pas : « Garder les 3 exemples ». */
    title: 'Le verdict des journalistes',
    /* INTRODUCTION SUPPRIMÉE le 16/09/2026, demande de l'équipe. Elle disait que les citations sont des
       extraits d'articles de tiers, qu'elles n'engagent que leurs auteurs et ne portent sur aucun
       résultat de R Start. Chaque citation porte toujours le nom de son média et sa date. */
    intro: '',
    items: quotes,
  },

  coverage: {
    /* Zone 3, titre du 15/09/2026, ex-« La revue de presse ». */
    title: 'Revue de presse',
    /*
     * INTRODUCTION SUPPRIMÉE le 16/09/2026, demande de l'équipe. Elle annonçait le nombre d'articles et
     * leur nature, puis rappelait les frais réellement prélevés — « R Start n'est pas une SCPI sans
     * frais » — en contre-poids des titres de presse qui, eux, emploient la formule.
     * CE CONTRE-POIDS ÉTAIT LÀ POUR ÇA. Les titres des articles sont reproduits tels quels et certains
     * disent « sans frais » ; c'est cette phrase qui les qualifiait dans le même bloc. Elle part à la
     * demande de l'équipe, en connaissance de cause. Les frais restent décrits sur /frais et sur
     * l'accueil, et la mention obligatoire du pied de page vaut pour toute la page.
     * Pour la rétablir : reprendre le gabarit dans l'historique de ce fichier.
     */
    intro: '',
    items: articles,
    /*
     * BLOC D'AVERTISSEMENT SUPPRIMÉ le 16/09/2026, demande de l'équipe. Sous le titre « À lire avec
     * cette revue de presse », il rappelait que les articles sont des publications indépendantes qui
     * n'engagent pas la société de gestion et ne valent pas conseil en investissement, que les
     * informations reflètent le contexte du lancement, et que l'investissement comporte un risque de
     * perte en capital. Le texte lui-même reste dans facts.ts (`press.coverageDisclaimer`).
     * Pour le rétablir : `disclaimer: pressFacts.coverageDisclaimer` et son titre.
     */
  },

  /** Renvoi vers /salle-de-presse, absente du menu principal (arbitrage du 10/09/2026). */
  /*
   * ZONE 4 : LE RENVOI VERS LA SALLE DE PRESSE EST RETIRÉ (15/09/2026). Il disait « Vous êtes
   * journaliste ? » et envoyait sur /salle-de-presse. L'équipe a tranché : « Ne pas activer encore la
   * page presse pour les journalistes : pas assez d'infos, pas de CP, ça va plus nous desservir
   * qu'autre chose. » De fait, la salle de presse annonçait des communiqués dont aucun fichier n'a
   * jamais été livré. La route est donc désactivée (src/pages/_salle-de-presse.astro), et la zone 4
   * porte maintenant les contacts presse eux-mêmes, par le composant Contacts déjà écrit pour elle.
   * Pour rétablir : renommer la page sans le tiret bas, remettre ce bloc et son lien en pied de page,
   * et les entrées retirées des listes de tests et de scripts.
   */

  /** Micro-textes du composant (libellés d'accessibilité). */
  /* Appel à l'action de la page (13/09/2026) : elle n'en portait aucun, on lisait la revue de presse et
     la page s'arrêtait là. */
  cta: { label: 'Souscrire en ligne', position: 'presse' as const },

  labels: {
    newTabHint: 'nouvelle fenêtre',
    coverageListLabel: 'Articles de presse sur R Start',
    quotesListLabel: 'Citations de la presse sur R Start',
  },

  notes,
} satisfies PressContent;

export default press;
