/**
 * Types du périmètre v2 (08/09/2026) : blocs de confiance, page Frais, page Documentation, page Presse.
 * Fichier séparé de types.ts pour ne pas interférer avec le lot design ; fusion prévue à l'intégration.
 */
import type { AdvantageRisk, Cta, DocumentItem, FaqItem, FeeKind, FeeRow, LegalNote, StatItem, StepItem, WithdrawalStep } from '@/content/types';

export interface PageSeo {
  /** ≤ 60 caractères, contient « R Start » et « CORUM ». */
  title: string;
  /** 140-155 caractères, avec rappel de risque. */
  description: string;
}

export interface PageHero {
  eyebrow: string;
  /** H1 unique de la page. */
  title: string;
  intro: string;
  /** Ligne risques visible sans scroller, même taille que l'intro. Jamais animée. */
  riskLine: string;
}

/** Bloc « Confiance » : cadre réglementaire, avis Trustpilot, chiffres clés CORUM. */
export interface TrustContent {
  eyebrow: string;
  title: string;
  intro: string;
  amf: {
    title: string;
    items: {
      label: string;
      value: string;
      /** Appel de note légale porté par la valeur de la carte (id d'une LegalNote de la section). */
      noteId?: string;
    }[];
    /** Phrase standard : le visa n'implique ni approbation ni authentification. */
    disclaimer: string;
    risk: string;
  };
  trustpilot: {
    title: string;
    scoreLabel: string;
    reviewsLabel: string;
    dateLabel: string;
    linkLabel: string;
    url: string;
    /** Précision : avis sur le distributeur CORUM L'Épargne, pas sur R Start. */
    scope: string;
    /** Valeur numérique de la note pour le compteur animé (ex. 4.5) ; scoreLabel reste la valeur affichée. */
    score?: number;
    /** Suffixe du compteur (ex. « /5 »), dérivé de scoreLabel. */
    scoreSuffix?: string;
    /** Mention lue par les lecteurs d'écran sur le lien externe (ex. « nouvelle fenêtre »). */
    externalLinkHint?: string;
  };
  stats: {
    title: string;
    items: StatItem[];
    source: string;
    risk: string;
  };
  notes: LegalNote[];
}

export interface FeeGroup {
  title: string;
  intro?: string;
  rows: FeeRow[];
  /** Appel de note légale porté par le titre du tableau (id d'une LegalNote de la page). */
  noteId?: string;
}

/**
 * Micro-textes de la page /frais (aria-label, en-têtes de colonnes, surtitres, libellés de fichier) :
 * aucun texte en dur dans src/pages/frais.astro.
 */
export interface FeesPageLabels {
  /** aria-label de la liste des trois « 0 % » (ex. « Les trois frais à 0 % »). */
  zeroHighlights: string;
  /** En-têtes de colonnes des tableaux de frais. */
  columns: { fee: string; base: string; value: string; detail: string };
  /** Libellé de la nature de chaque frais (FeeRow.kind), affiché en pastille dans les tableaux. */
  kinds: Record<FeeKind, string>;
  /** aria-label de la frise des paliers de la commission de retrait. */
  steps: string;
  /** En-têtes des deux colonnes de l'incidence des coûts (durée, incidence annuelle). */
  costColumns: { period: string; impact: string };
  /** Surtitres des blocs de la page. */
  eyebrows: { schedule: string; withdrawal: string; lossMechanism: string; costImpact: string; document: string; faq: string };
  /** Libellé du type de fichier du document de référence (ex. « PDF »). */
  fileTypeLabel: string;
  /** Unité du poids affiché après le nombre (ex. « ko »). */
  sizeUnit: string;
  /** Mention lue par les lecteurs d'écran sur les liens ouvrant un nouvel onglet (ex. « nouvelle fenêtre »). */
  newTabHint: string;
  /** aria-label de la liste des questions de la FAQ. */
  faqList: string;
}

export interface FeesPageContent {
  seo: PageSeo;
  hero: PageHero;
  /** Micro-textes de la page ; sans eux, les libellés correspondants ne sont pas rendus. */
  labels?: FeesPageLabels;
  zeroHighlights: { value: string; label: string; base: string }[];
  counterweight: AdvantageRisk;
  groups: FeeGroup[];
  withdrawal: { title: string; intro: string; steps: WithdrawalStep[]; exemptionsTitle: string; exemptions: string[]; note: string };
  /** Mécanisme de réserve en cas de moins-value (brochure p.4). */
  lossMechanism: { title: string; body: string[]; risk: string };
  arbitrageWarning: { title: string; bullets: string[] };
  innovationBox: { title: string; body: string };
  /** Incidence des coûts du DIC (coûts, jamais de rendement). */
  costImpact: { title: string; intro: string; rows: { period: string; impact: string }[]; note: string; risk: string };
  /** Tableau comparatif brochure p.6 ; enabled=false tant que la Conformité n'a pas validé. */
  marketComparison: {
    enabled: boolean;
    title: string;
    intro: string;
    columns: [string, string];
    rows: { label: string; other: string; rstart: string }[];
    perimeter: string;
    risk: string;
  };
  simulationDoc: DocumentItem;
  faq: { title: string; items: FaqItem[] };
  htNote: string;
  cta: Cta;
  notes: LegalNote[];
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
  /** Surtitre commun des groupes de documents (ex. « Documents »). */
  groupsEyebrow?: string;
  /** Surtitre du guide de souscription (ex. « Souscrire »). */
  howToEyebrow?: string;
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
  /**
   * Guide de souscription. `intro` est l'avantage (data-advantage) ; `risk`, s'il est renseigné, est son
   * contre-poids rendu en RiskNote dans le même bloc et la même taille (jamais animé).
   */
  howTo: { title: string; intro: string; risk?: string; steps: StepItem[] };
  faq: { title: string; items: FaqItem[] };
  corumLink: { label: string; href: string };
  mention: string;
  cta: Cta;
  labels?: DocumentationLabels;
  notes: LegalNote[];
}

export interface PressRelease {
  title: string;
  date: string;
  dateIso: string;
  /** Chemin public du PDF ; vide tant que CORUM ne l'a pas fourni. */
  file: string;
  available: boolean;
  summary?: string;
}

export interface PressArticle {
  media: string;
  title: string;
  date?: string;
  dateIso?: string;
  url: string;
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
  /** Type de fichier des communiqués (ex. « PDF »), affiché avant le poids et lu avec le lien. */
  fileTypeLabel?: string;
  /** Unité du poids des fichiers (ex. « ko »). */
  sizeUnit?: string;
  /** Mention lue par les lecteurs d'écran sur les liens ouvrant une nouvelle fenêtre. */
  newTabHint?: string;
  /** Libellé de l'action de téléchargement des logos (ex. « Télécharger »). */
  downloadLabel?: string;
  /** aria-label des listes (communiqués, articles, contacts, logos). */
  releasesListLabel?: string;
  coverageListLabel?: string;
  contactsListLabel?: string;
  logosListLabel?: string;
  /** Intitulés des lignes d'une carte contact. */
  phoneLabel?: string;
  emailLabel?: string;
  /** Sous-titres du kit média. */
  logosTitle?: string;
  keyFactsTitle?: string;
}

export interface PressContent {
  seo: PageSeo;
  hero: PageHero;
  releases: { title: string; intro: string; items: PressRelease[]; emptyLabel: string };
  coverage: { title: string; intro: string; items: PressArticle[]; disclaimer: string };
  contacts: { title: string; items: PressContact[]; source: string };
  mediaKit: {
    title: string;
    intro: string;
    logos: { label: string; file: string }[];
    keyFacts: { label: string; value: string }[];
    /** Rappel des risques sous la fiche de chiffres clés, même taille que la fiche ; jamais animé. */
    riskLine?: string;
    boilerplate: { title: string; body: string };
  };
  labels?: PressLabels;
  notes: LegalNote[];
}
