/** Types des blocs de confiance et des pages Frais, Documentation et Presse. Fichier distinct de
    types.ts, dont il n'importe que des types ; la fusion des deux n'a jamais été faite. */
import type { Cta, DocumentItem, FaqItem, StatItem, StepItem } from '@/content/types';

export interface PageSeo {
  /** ≤ 60 caractères, contient « R Start » et « CORUM ». */
  title: string;
  /** 140-155 caractères, avec rappel de risque. */
  description: string;
}

export interface PageHero {
  /** H1 unique de la page. */
  title: string;
  /** Facultative (/strategie s'en passe). Un TABLEAU rend plusieurs paragraphes (/a-propos). */
  intro?: string | string[];
  /** Phrase-clé sous l'introduction, en gras et dans le MÊME corps de texte : le gras marque
      l'insistance, jamais une taille plus grande, ce que l'AMF a déjà reproché à la brochure. */
  punchline?: string;
}

/** Bloc « Confiance » : cadre réglementaire, avis Trustpilot, chiffres clés CORUM. */
export interface TrustContent {
  amf: {
    title: string;
    items: {
      label: string;
      value: string;
    }[];
    /** Phrase standard : le visa n'implique ni approbation ni authentification. */
    disclaimer: string;
    /** Cadre réglementaire de /a-propos : visa de R Start et agrément de la société de gestion. */
    aboutSentence: string;
  };
  trustpilot: {
    title: string;
    linkLabel: string;
    url: string;
    /** Mention lue par les lecteurs d'écran sur le lien externe (ex. « nouvelle fenêtre »). */
    externalLinkHint?: string;
    /** Nom accessible des TrustBox officiels (contenu rendu par Trustpilot dans une iframe). */
    widgetLabel?: string;
  };
  stats: {
    title: string;
    items: StatItem[];
  };
}

/**
 * Section « Ce qui change vraiment » de l'accueil (brochure partenaires 2026 p.4 et p.6) : quand la
 * société de gestion se rémunère, les deux situations où des frais sont prélevés (loyers encaissés,
 * plus-value réalisée à la vente), puis la démonstration de l'équipe.
 */
export interface DifferenceContent {
  title: string;
  intro: string;
  /** Phrase qui annonce les deux situations, juste avant la liste. */
  lead?: string;
  /** Les deux situations où des frais sont prélevés. `strong` est le mot mis en valeur dans `text`. */
  situations?: { text: string; strong?: string }[];
  /**
   * Conclusion de l'équipe, sous les deux situations (« nous, on ne touche rien tant que vous
   * n'avez pas gagné d'argent »). Son contre-poids chiffré (frais de gestion prélevés sur les
   * loyers même quand la valeur des parts baisse, commissions de cession et de retrait) a quitté
   * l'écran le 11/09/2026 et le code le 22/09/2026, comme l'allégation de rang qui ouvrait le bloc.
   */
  counterweight: { pedagogy?: string[] };
  /** Lien interne vers la page Frais : ce n'est pas un CTA de souscription, il ne porte pas de `position`. */
  cta: { label: string; href: string };
  /** Appel rendu DANS le bloc, sous la démonstration ; `cta` alimente la pastille flottante. */
  secondaryCta?: { label: string; href: string };
}

/** Contenu de /frais : l'en-tête et le CTA ; le comparateur a le sien dans comparator.ts. */
export interface FeesPageContent {
  seo: PageSeo;
  hero: PageHero;
  cta: Cta;
}

export type DocumentGroupKey = 'reglementaire' | 'frais' | 'formulaire';

/** Micro-textes de la page Documentation (libellés d'interface, jamais de contenu réglementaire). */
export interface DocumentationLabels {
  /** Type de fichier affiché sur chaque carte (ex. « PDF »). */
  fileTypeLabel?: string;
  /** Unité du poids affiché après le nombre (ex. « ko »). */
  sizeUnit?: string;
  /** Mention lue par les lecteurs d'écran sur les liens qui ouvrent un nouvel onglet (ex. « nouvelle fenêtre »). */
  newTabHint?: string;
  /** aria-label de la navigation d'ancres vers les groupes de documents (ex. « Groupes de documents »). */
  anchorsLabel?: string;
  /** Décompte d'un groupe dans le sommaire de l'en-tête. `{n}` : nombre ; `{s}` : marque du pluriel. */
  anchorsCountLabel?: string;
  /** Nom du sommaire rendu dans l'en-tête. Distinct de `anchorsLabel` (la barre d'ancres collante)
      : deux repères de navigation d'une même page ne peuvent pas porter le même nom accessible. */
  anchorsAsideLabel?: string;
  /** aria-label de la liste des étapes (ex. « Les quatre étapes de la souscription »). */
  stepsLabel?: string;
  /** Mot lu par les lecteurs d'écran devant le numéro de chaque étape (ex. « Étape »). */
  stepPrefix?: string;
  /** Surtitre de la FAQ (ex. « FAQ »). */
  faqEyebrow?: string;
  /** aria-label de la liste des questions (ex. « Questions fréquentes sur R Start »). */
  faqListLabel?: string;
}

export interface DocumentationContent {
  seo: PageSeo;
  hero: PageHero;
  groups: { key: DocumentGroupKey; title: string; intro: string; items: DocumentItem[] }[];
  /** Guide de souscription. */
  howTo: { title: string; intro: string; steps: StepItem[] };
  /** FAQ de la page : seulement les questions dont le sujet est un document ou la souscription
      (sélection dans documentation.ts). `fullFaqLink` renvoie vers /faq pour les autres. */
  faq: {
    title: string;
    items: FaqItem[];
    fullFaqLink?: { intro: string; label: string; href: string };
  };
  corumLink: { label: string; href: string };
  mention: string;
  cta: Cta;
  labels?: DocumentationLabels;
}

/** Article de presse tiers. Le titre est une citation, reproduit tel que publié, jamais réécrit.
    `url` est vide tant que l'adresse n'a pas été vérifiée, et press.ts écarte alors l'article. */
export interface PressArticle {
  media: string;
  title: string;
  date: string;
  dateIso: string;
  url: string;
}

/** Citation de presse mise en avant : propos d'un tiers, avec son média et sa date. */
export interface PressQuote {
  text: string;
  media: string;
  date: string;
  dateIso: string;
}

export interface PressContact {
  organisation: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
}

/** Micro-textes de la page Presse (libellés d'accessibilité et de métadonnées de fichiers). */
export interface PressLabels {
  /** Mention lue par les lecteurs d'écran sur les liens ouvrant une nouvelle fenêtre. */
  newTabHint?: string;
  /** aria-label des listes (articles, citations, contacts). */
  coverageListLabel?: string;
  quotesListLabel?: string;
  contactsListLabel?: string;
  /** Intitulés des lignes d'une carte contact. */
  phoneLabel?: string;
  emailLabel?: string;
}

/** Page /presse « La presse en parle » : trois citations mises en avant, la revue des articles, les
    contacts. Aucun logo de média (aucune licence), les noms sont en typographie. */
export interface PressContent {
  seo: PageSeo;
  hero: PageHero;
  quotes: { title: string; items: PressQuote[] };
  coverage: {
    title: string;
    items: PressArticle[];
    /** Sous la liste : les médias cités déterminent librement leur ligne et leurs contenus. */
    notice: string;
  };
  /** Appel à l'action de la page : en-tête et pastille flottante. */
  cta: Cta;
  /** Zone 4, « Vous êtes journaliste ? » (Contacts.astro). */
  contacts: {
    title: string;
    /** Phrase d'appel sous le titre. Absente : la liste suit directement le titre. */
    intro?: string;
    items: PressContact[];
  };
  labels?: PressLabels;
}
