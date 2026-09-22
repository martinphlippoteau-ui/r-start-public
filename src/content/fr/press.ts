import type { PressArticle, PressContact, PressContent, PressQuote } from '@/content/types-v2';
import { press as pressFacts } from '@/content/fr/facts';
import { nb } from '@/lib/texte';

/**
 * Page /presse, « La presse en parle » (grand public, arbitrage du 10/09/2026).
 * Trois citations mises en avant, la revue des articles reliés avec leur média et leur date, puis
 * les contacts presse (zone 4, `contacts`). L'avertissement livré par CORUM a été retiré le
 * 16/09/2026 (voir `coverage`). La salle de presse (/salle-de-presse), qui portait les
 * communiqués et le kit média, a été désactivée le 15/09/2026 puis supprimée le 22/09/2026, avec
 * pressRoom.ts : les contacts, sa seule partie vivante, sont venus ici.
 *
 * Règles appliquées :
 *  - les titres et les citations sont des propos de tiers, reproduits mot pour mot depuis
 *    facts.ts ; ils ne sont ni réécrits ni neutralisés (le filtre historique sur « sans frais » est
 *    retiré, plan §5). Ils étaient couverts par l'avertissement de la revue et par son
 *    introduction, qui rappelait dans le même bloc les frais réellement prélevés : les deux ont été
 *    retirés le 16/09/2026 (voir `coverage`), R Start n'est pourtant pas une SCPI sans frais ;
 *  - un article dont l'adresse n'a pas été vérifiée N'EST PAS REPRIS (14/09/2026) : il reste dans
 *    facts.ts et revient de lui-même le jour où son adresse est renseignée ;
 *  - aucun logo de média (aucune licence) : les noms sont en typographie ;
 *  - aucune donnée de performance, aucun chiffre repris des articles : seuls les faits de facts.ts sont
 *    cités, et R Start n'a pas d'historique propre.
 */

/** Contacts presse ; l'e-mail n'est renseigné que s'il est confirmé (le composant masque la ligne sinon). */
const contacts: PressContact[] = pressFacts.contacts.map((c) => ({
  organisation: nb(c.organisation),
  name: c.name,
  role: c.role,
  phone: c.phone,
  ...(c.email ? { email: c.email } : {}),
}));

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
    title: nb(a.title),
    date: a.date.label,
    dateIso: a.date.iso,
    url: a.url,
  }));

/** Citations mises en avant : propos de tiers, avec leur média et leur date. */
const quotes: PressQuote[] = pressFacts.quotes.map((q) => ({
  text: nb(q.text),
  media: q.media,
  date: q.date.label,
  dateIso: q.date.iso,
}));

export const press = {
  seo: {
    /** ≤ 60 caractères. Contient « R Start » et « CORUM ». */
    title: 'La presse en parle : R Start, SCPI CORUM',
    /** 140 à 155 caractères, avec rappel de risque. */
    description:
      'Ce que la presse a écrit sur R Start, la SCPI du groupe CORUM, à son lancement. Placement à risque de perte en capital, revenus non garantis.',
  },

  hero: {
    /* Zones réécrites le 15/09/2026, texte fourni par l'équipe. */
    /* « dans les médias » depuis le 16/09/2026, ex-« dans vos médias » : le possessif s'adressait au
       lecteur alors que la page parle de ce que la presse a écrit. */
    title: 'R Start dans les médias',
    intro: 'Découvrez les derniers articles parus',
    /* Plus de ligne risques dans l'en-tête (14/09/2026, demande de l'équipe : « supprime les bon à
       savoir de tous les hero sauf celui de la home », puis celui de l'accueil le même jour). Il
       reste les mentions de risque du contenu, quand il en porte, et le pied de page, commun à tout
       le site. */
  },

  quotes: {
    /* Zone 2, titre du 15/09/2026. Les trois citations ne bougent pas : « Garder les 3 exemples ». */
    title: 'Le verdict des journalistes',
    /* Plus d'introduction depuis le 16/09/2026 (demande de l'équipe) : elle disait que les citations
       n'engagent que leurs auteurs. Chaque citation porte toujours le nom de son média et sa date. */
    items: quotes,
  },

  coverage: {
    /* Zone 3, titre du 15/09/2026, ex-« La revue de presse ». */
    title: 'Revue de presse',
    /*
     * INTRODUCTION ET AVERTISSEMENT SUPPRIMÉS le 16/09/2026, demande de l'équipe, en connaissance de
     * cause. L'introduction rappelait les frais réellement prélevés, « R Start n'est pas une SCPI sans
     * frais », en contre-poids des titres de presse qui, eux, emploient la formule ; l'avertissement,
     * sous le titre « À lire avec cette revue de presse », disait que les articles n'engagent pas la
     * société de gestion et ne valent pas conseil. Les frais restent décrits sur /frais et sur
     * l'accueil, et la mention obligatoire du pied de page vaut pour toute la page. Les deux textes
     * ont quitté le code le 22/09/2026 (archivés hors du dépôt, .claude/audits).
     */
    items: articles,
  },

  /* Appel à l'action de la page (13/09/2026) : elle n'en portait aucun, on lisait la revue de presse et
     la page s'arrêtait là. */
  cta: { label: 'Souscrire en ligne', position: 'presse' as const },

  /*
   * ZONE 4, « Vous êtes journaliste ? » (15/09/2026, texte de l'équipe), rendue par
   * components/pages/presse/Contacts.astro. Elle portait un renvoi vers une salle de presse que
   * l'équipe n'a pas voulu ouvrir (« pas assez d'infos, pas de CP ») ; les contacts y sont venus à sa
   * place. La salle de presse, en veille depuis, a été supprimée le 22/09/2026.
   * Singulier depuis le 16/09/2026 : la question s'adresse à un lecteur, pas à une assemblée. La phrase
   * d'appel date du même jour : le titre posait une question et la liste arrivait sans transition.
   * La ligne de source (« corum.fr, rubrique Contacts presse, consultée le… »), retirée de l'écran le
   * 14/09/2026 avec toutes les sources du site, a quitté le code le 22/09/2026.
   */
  contacts: {
    title: 'Vous êtes journaliste ?',
    intro: 'Pour toute question, demande d’information ou d’interview, merci de contacter :',
    items: contacts,
  },

  /** Micro-textes des composants (libellés d'accessibilité). */
  labels: {
    newTabHint: 'nouvelle fenêtre',
    coverageListLabel: 'Articles de presse sur R Start',
    quotesListLabel: 'Citations de la presse sur R Start',
    contactsListLabel: 'Contacts presse',
    phoneLabel: 'Téléphone',
    emailLabel: 'E-mail',
  },
} satisfies PressContent;
