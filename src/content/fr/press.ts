import type { PressArticle, PressContact, PressContent, PressQuote } from '@/content/types-v2';
import { press as pressFacts } from '@/content/fr/facts';
import { nb } from '@/lib/texte';

/**
 * Page /presse, « La presse en parle » : trois citations mises en avant, la revue des articles
 * reliés avec leur média et leur date, puis les contacts presse (`contacts`).
 *
 * CE QU'IL FAUT SAVOIR CÔTÉ CONFORMITÉ : titres et citations sont des propos de tiers, reproduits
 * mot pour mot depuis facts.ts, ni réécrits ni neutralisés, alors qu'ils emploient « sans frais »
 * et que R Start n'est pas une SCPI sans frais. L'introduction qui rappelait les frais réellement
 * prélevés et l'avertissement (les articles n'engagent pas la société de gestion et ne valent pas
 * conseil) ont été retirés le 16/09/2026 à la demande de l'équipe, en connaissance de cause, et ont
 * quitté le code le 22/09/2026 (archivés hors du dépôt, .claude/audits) ; seule la mention
 * obligatoire du pied de page couvre la page. Un article sans adresse vérifiée N'EST PAS REPRIS
 * (voir `articles`). Aucun logo de média (aucune licence), aucun chiffre repris des articles.
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
 * Revue de presse : la sélection de facts.ts, dans son ordre, RÉDUITE AUX ARTICLES QUI ONT UNE
 * ADRESSE (14/09/2026, « mets uniquement les parutions presse avec des liens »). Le filtre est ici,
 * pas dans facts.ts : les articles écartés y restent entiers et reviennent seuls le jour où leur
 * `url` est renseignée (Les Echos et Business Immo ont leur adresse candidate notée sur place).
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
    /* Textes de l'équipe (15/09/2026). « dans les médias » et non « dans vos médias » : la page
       parle de ce que la presse a écrit. */
    title: 'R Start dans les médias',
    intro: 'Découvrez les derniers articles parus',
    /* Plus de ligne risques dans l'en-tête (14/09/2026, « supprime les bon à savoir de tous les
       hero sauf celui de la home ») ; restent les mentions du contenu et le pied de page. */
  },

  quotes: {
    /* Titre du 15/09/2026 ; les trois citations ne bougent pas (« Garder les 3 exemples »). */
    title: 'Le verdict des journalistes',
    /* Plus d'introduction (16/09/2026, demande de l'équipe) ; chaque citation porte sa source. */
    items: quotes,
  },

  coverage: {
    /* Titre du 15/09/2026, texte de l'équipe. */
    title: 'Revue de presse',
    /* Introduction et avertissement retirés le 16/09/2026 : voir l'en-tête. */
    items: articles,
  },

  cta: { label: 'Souscrire en ligne', position: 'presse' as const },

  /* « Vous êtes journaliste ? » (15/09/2026, texte de l'équipe), rendue par
     components/pages/presse/Contacts.astro ; au singulier, la question s'adresse à un lecteur. */
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
