/**
 * Types du périmètre v2 (08/09/2026) : blocs de confiance, page Frais, page Documentation, page Presse.
 * Fichier séparé de types.ts, à l'origine pour ne pas interférer avec le lot design. La fusion annoncée
 * alors n'a pas été faite : les deux fichiers coexistent, celui-ci n'importe de l'autre que des types.
 */
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
  /**
   * Facultative depuis le 14/09/2026 : /strategie ouvre directement sur son premier chapitre.
   * Un TABLEAU rend plusieurs paragraphes, quand le texte fourni en compte plusieurs (/a-propos).
   */
  intro?: string | string[];
  /**
   * Phrase-clé sous l'introduction, en gras (14/09/2026, /frais). Elle reste dans le MÊME corps de
   * texte que l'introduction : le gras marque l'insistance, jamais une taille plus grande, ce que
   * l'AMF a déjà reproché à la brochure.
   */
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
    /**
     * Pastille de réassurance du hero, à côté des avis Trustpilot (15/09/2026). Elle porte l'agrément
     * de la SOCIÉTÉ DE GESTION, jamais celui de R Start, qui n'est pas agréé mais visé : le détail de
     * cette distinction, et la raison pour laquelle l'écusson n'est pas le logo de l'AMF, sont dans
     * trust.ts au-dessus du champ.
     */
    heroBadge: {
      label: string;
      /** Ce que les lecteurs d'écran entendent à la place du logo. */
      logoAlt: string;
    };
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
 * Section « Ce qui change vraiment » (zone 2 de l'accueil, brochure partenaires 2026 p.4 et p.6).
 * Explique quand la société de gestion se rémunère : les deux situations où des frais sont prélevés
 * (loyers encaissés, plus-value réalisée à la vente), puis la démonstration de l'équipe. Les cartes
 * des deux moteurs et le mécanisme de réserve en cas de moins-value l'ont quittée le 11/09/2026, et
 * le contre-poids chiffré l'a suivie (voir `counterweight`).
 */
export interface DifferenceContent {
  title: string;
  intro: string;
  /** Phrase qui annonce les deux situations, juste avant la liste. */
  lead?: string;
  /** Les deux situations où des frais sont prélevés. `strong` est le mot mis en valeur dans `text`. */
  situations?: { text: string; strong?: string }[];
  /**
   * Conclusion de l'équipe, sous les deux situations (« nous, on ne touche rien tant que vous n'avez
   * pas gagné d'argent »). Son contre-poids chiffré (frais de gestion prélevés sur les loyers même
   * quand la valeur des parts baisse, commission sur les cessions, commission de retrait) a quitté
   * l'écran le 11/09/2026 et le code le 22/09/2026, comme l'allégation de rang qui ouvrait le bloc.
   */
  counterweight: { pedagogy?: string[] };
  /** Lien interne vers la page Frais : ce n'est pas un CTA de souscription, il ne porte pas de `position`. */
  cta: { label: string; href: string };
  /**
   * Appel à l'action rendu DANS le bloc, sous la démonstration (15/09/2026). Distinct de `cta`
   * ci-dessus, qui alimente la pastille flottante de la page.
   */
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
  /**
   * Nom du sommaire rendu dans l'en-tête. Distinct de `anchorsLabel` (la barre d'ancres collante) :
   * deux repères de navigation d'une même page ne peuvent pas porter le même nom accessible.
   */
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
  /**
   * FAQ de la page : seulement les questions dont le sujet est un document ou la souscription (la
   * sélection est faite dans documentation.ts). `fullFaqLink` renvoie vers la foire aux questions
   * complète (/faq depuis le 16/09/2026), où les autres questions restent lisibles, elles ne sont
   * plus dupliquées.
   */
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

/**
 * Article de presse tiers. Le titre est une citation : il est reproduit tel qu'il a été publié, jamais
 * réécrit, et il est couvert par l'avertissement de fin de page. `url` est vide tant que l'adresse de
 * l'article n'a pas été vérifiée : l'article s'affiche alors avec son média et sa date, sans lien.
 */
/** Article de la revue de presse : toujours relié à sa publication (press.ts écarte les autres). */
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

/**
 * Page /presse « La presse en parle » (grand public) : trois citations mises en avant, la revue des
 * articles et l'avertissement de fin. Aucun logo de média (aucune licence), les noms sont en
 * typographie. Les contacts presse sont en zone 4 ; la salle de presse (communiqués, kit média) a été
 * supprimée le 22/09/2026.
 */
export interface PressContent {
  seo: PageSeo;
  hero: PageHero;
  quotes: { title: string; items: PressQuote[] };
  coverage: { title: string; items: PressArticle[] };
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
