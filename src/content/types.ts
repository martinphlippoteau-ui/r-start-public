/**
 * Types partagés du contenu éditorial (src/content/fr/*).
 * Les composants ne contiennent aucun texte en dur : tout vient de ces structures.
 */

export type SectionKey =
  | 'hero'
  | 'difference'
  | 'highlights'
  | 'fees'
  | 'strategy'
  | 'income'
  | 'subscribe'
  | 'corum'
  | 'risks'
  | 'press'
  | 'documents'
  | 'faq'
  | 'notes';

export interface SectionMeta {
  /** Ancre HTML (id de la <section>) et cible de la sous-navigation. */
  id: string;
  /** Libellé affiché dans la sous-navigation. */
  label: string;
  /** Ordre d'apparition dans la page. */
  order: number;
  /** Présent dans la sous-navigation sticky ? */
  inNav: boolean;
}

/** Note légale numérotée (façon Apple « ◊ 1, 2… »), agrégée par LegalNotes.astro dans l'ordre des sections. */
export interface LegalNote {
  /** Identifiant stable, référencé via <NoteRef id="…" />. */
  id: string;
  text: string;
}

/** Position d'un CTA « Souscrire » pour l'analytics (dataLayer cta_position). */
export type CtaPosition = 'nav' | 'hero' | 'frais' | 'souscrire' | 'faq' | 'footer' | 'mobile-bar';

export interface Cta {
  label: string;
  position: CtaPosition;
  /** Lien secondaire interne (#ancre) ; absent = URL du tunnel de souscription. */
  href?: string;
}

/** Bloc avantage + contre-poids risque, toujours affichés côte à côte, même taille. */
export interface AdvantageRisk {
  advantage: string;
  risk: string;
}

export interface HeroContent {
  eyebrow: string;
  /** Pastille courte affichée devant le surtitre (« Nouveau ») ; vide ou absente : rien. */
  badge?: string;
  /** H1 unique de la page. */
  title: string;
  tagline: string;
  /**
   * Ligne de définition du produit (facts.product.definition) : allégation de rang au périmètre du
   * groupe CORUM, toujours accompagnée de son appel de note (`definitionNoteId`).
   */
  definition?: string;
  /** Id de la LegalNote qui porte le périmètre de la définition (facts.product.definitionScope). */
  definitionNoteId?: string;
  /** Frais réellement prélevés, obligatoire dès que `definition` annonce une absence de frais (hors hero depuis le 10/09/2026). */
  subtitle?: string;
  /** Ligne risques visible sans scroller, même taille que le corps du hero. Jamais animée. */
  /** Claim de la trame, en deux temps : l'énoncé puis la réponse (« Oui ! » / « Non ! »), en petit et animé. */
  claims?: { text: string; answer: string }[];
  riskLine: string;
  primaryCta: Cta;
  secondaryCta: Cta;
  notes: LegalNote[];
}

export interface HighlightCard {
  /** Clé du pictogramme 3D (voir media.ts). */
  icon: string;
  value: string;
  label: string;
  description: string;
  /** Contre-poids risque de la carte, même taille que description. */
  risk: string;
  noteId?: string;
}

export interface HighlightsContent {
  eyebrow: string;
  title: string;
  intro: string;
  cards: HighlightCard[];
  notes: LegalNote[];
}

export type FeeKind = 'entree' | 'investissement' | 'gestion' | 'transaction' | 'sortie';

export interface FeeRow {
  kind: FeeKind;
  label: string;
  /** Assiette de calcul (ex. « prélevés sur les loyers HT encaissés »). */
  base: string;
  /** Valeur affichée (ex. « 0 % », « 15 % », « 0 / 6 / 12 % »). */
  value: string;
  /**
   * Variante courte de `value` pour les écrans étroits (ex. « 10 à 0 % » pour « 10 / 7 / 5 / 3 / 0 % »),
   * affichée à la place de `value` sous 640 px afin que le taux tienne sur une ligne.
   */
  valueShort?: string;
  detail?: string;
  /** Appel de note légale porté par le libellé de la ligne (id d'une LegalNote de la section). */
  noteId?: string;
}

export interface WithdrawalStep {
  period: string;
  rate: string;
}

export interface FeesContent {
  eyebrow: string;
  title: string;
  intro: string;
  /** Les trois « 0 % » mis en avant. */
  zeroHighlights: { value: string; label: string; base: string }[];
  /** aria-label de la liste des trois « 0 % » (ex. « Les trois frais à 0 % »). */
  zeroHighlightsLabel?: string;
  /**
   * Libellé accessible de la rangée des frais réellement prélevés, face aux « 0 % ». Depuis le
   * retrait du barème complet de l'accueil, cette rangée n'est plus une répétition : elle est lue.
   */
  counterRowsLabel?: string;
  /** Contre-poids immédiat des 0 % (même taille). */
  /** Optionnel depuis le 11/09/2026 : l'accueil ne rend plus de couple rédigé sous les frais. */
  counterweight?: AdvantageRisk;
  rows: FeeRow[];
  /**
   * Micro-textes du tableau compact du barème : légende visible, en-têtes de colonnes et libellé de
   * chaque groupe de lignes (par nature de frais, FeeRow.kind).
   */
  table?: {
    caption: string;
    columns: { fee: string; base: string; value: string };
    groups: Record<FeeKind, string>;
  };
  withdrawal: {
    title: string;
    intro: string;
    steps: WithdrawalStep[];
    note: string;
    /** aria-label de la frise des paliers (ex. « Commission de retrait selon la durée de détention »). */
    stepsLabel?: string;
  };
  /** Encadré « Une innovation, pas une révolution ». */
  innovationBox: { title: string; body: string };
  /** Avertissement commission d'arbitrage (3 puces du DIC, à l'identique). */
  arbitrageWarning: { title: string; bullets: string[] };
  htNote: string;
  cta: Cta;
  /** Lien secondaire vers la page Frais détaillée (config/pages.ts). */
  detailsLink?: { label: string; href: string };
  /**
   * Résumé du comparatif des frais sur l'accueil (plan V2, zone 5) : la bascule complète vit sur /frais.
   * Aucune SCPI tierce n'est nommée ; le périmètre et la source sont portés par la note `noteId`.
   */
  marketSummary?: {
    title: string;
    intro: string;
    /** Intitulés des deux modèles comparés, dans l'ordre des valeurs de chaque ligne. */
    sides: [string, string];
    rows: { moment: string; values: [string, string] }[];
    noteId?: string;
    link: { label: string; href: string };
  };
  notes: LegalNote[];
}

export interface StrategyPillar {
  icon: string;
  /** Mot-clé court au-dessus du titre (« Comment », « Où », « Quoi »). */
  kicker?: string;
  title: string;
  description: string;
  risk: string;
}

export interface StrategyContent {
  eyebrow: string;
  title: string;
  /** Titre du chapitre court sur l'accueil (zone 6 de la trame), si différent de `title`. */
  homeTitle?: string;
  intro: string;
  /** Mot d'ordre affiché en très grand au-dessus de l'introduction (ex. « Acheter décoté, valoriser, revendre »). */
  motto?: string;
  /**
   * Contre-poids visible du mot d'ordre et de l'introduction, rendu dans le même bloc en RiskNote
   * (même taille que l'introduction, jamais animé) : ex. « les cessions réalisées par les SCPI CORUM
   * ne préjugent pas de leurs performances futures ».
   */
  mottoRisk?: string;
  /** Surtitre du bloc des deux leviers (ex. « Deux leviers »). */
  leversTitle?: string;
  levers: { title: string; description: string }[];
  /** Surtitre du bloc des piliers (ex. « Trois piliers »). */
  pillarsTitle?: string;
  pillars: StrategyPillar[];
  zone: {
    title: string;
    description: string;
    countriesLabel: string;
    risk: string;
    /** Libellés des deux volets de la carte (Canada, Conseil de l’Europe) et de sa légende. */
    mapLabels?: { canada: string; europe: string; legend: string };
  };
  /** Libellé de la liste des types d'actifs (ex. « Types d'actifs visés »). */
  assetTypesLabel?: string;
  assetTypes: string[];
  /** Titre du bloc effet de levier (ex. « L'effet de levier »). */
  leverageTitle?: string;
  leverage: AdvantageRisk;
  /** Sur l'accueil (chapitre court), lien vers la page Stratégie d'investissement. */
  pageLink?: { label: string; href: string };
  notes: LegalNote[];
}

/** Frise « mois 1 → mois N » de l'entrée en jouissance (micro-textes de la section Revenus). */
export interface EnjoymentTimeline {
  /** aria-label de la liste (ex. « Calendrier de l'entrée en jouissance… »). */
  label: string;
  /** Préfixe de chaque pastille (ex. « Mois »). */
  monthPrefix: string;
  /** Nombre de pastilles (la dernière est mise en avant). */
  count: number;
  /** Légende sous la première pastille (ex. « Souscription réglée »). */
  startCaption: string;
  /** Légende sous la dernière pastille (ex. « Premiers dividendes potentiels »). */
  endCaption: string;
}

export interface IncomeContent {
  eyebrow: string;
  title: string;
  intro: string;
  distribution: AdvantageRisk & { value: string; label: string };
  enjoyment: AdvantageRisk & { value: string; label: string; timeline?: EnjoymentTimeline };
  sri: {
    value: number;
    max: number;
    label: string;
    description: string;
    /** aria-label complet de la jauge (ex. « Indicateur synthétique de risque : 3 sur 7… »). */
    ariaLabel?: string;
    /** Légendes des extrémités de la jauge. */
    scaleLow?: string;
    scaleHigh?: string;
  };
  horizon: { value: string; label: string; description: string };
  notes: LegalNote[];
}

export interface StepItem {
  title: string;
  description: string;
  /** Appel de note légale porté par le titre de l'étape (id d'une LegalNote de la section). */
  noteId?: string;
}

export interface SubscribeContent {
  eyebrow: string;
  title: string;
  /** Titre du chapitre court sur l'accueil (prop `compact` de 06-Subscribe), si différent de `title`. */
  homeTitle?: string;
  intro: string;
  /** Introduction du chapitre court (≤ 30 mots, factuelle) ; à défaut, `intro`. */
  homeIntro?: string;
  /**
   * Contre-poids unique du chapitre court (RiskNote, même parent que la liste des étapes qui porte
   * data-advantage) : ≥ 60 % du texte cumulé des étapes ; à défaut, `withdrawalReminder`.
   */
  homeRisk?: string;
  steps: StepItem[];
  /** aria-label de la liste des étapes (ex. « Les quatre étapes de la souscription »). */
  stepsLabel?: string;
  /** Mot lu par les lecteurs d'écran devant le numéro de chaque étape (ex. « Étape »). */
  stepPrefix?: string;
  /** Titre (H3) du bloc des options facultatives. */
  optionsTitle?: string;
  /**
   * Options facultatives. `description` est l'avantage (data-advantage) ; `risk`, s'il est renseigné,
   * est son contre-poids rendu en RiskPair (même taille, jamais animé).
   */
  options: { title: string; description: string; badge?: string; risk?: string }[];
  beforeYouSubscribe: string;
  withdrawalReminder: string;
  /** Bloc MyCORUM (à la place de la photo) : application de suivi, liens vers les deux stores. */
  app?: {
    eyebrow?: string;
    title: string;
    description: string;
    /** aria-label de la liste des liens de téléchargement. */
    storesLabel: string;
    stores: { label: string; href: string }[];
    /** Mention lue par les lecteurs d'écran : les liens ouvrent un nouvel onglet. */
    newTabHint: string;
  };
  cta: Cta;
  notes: LegalNote[];
}

export interface StatItem {
  value: string;
  /** Valeur numérique pour le compteur animé (optionnel). */
  numeric?: number;
  /** Préfixe du compteur (ex. « + » pour « + 160 000 ») : sans lui, le comptage perdrait le signe. */
  prefix?: string;
  suffix?: string;
  label: string;
}

export interface CorumContent {
  eyebrow: string;
  title: string;
  intro: string;
  stats: StatItem[];
  statsSource: string;
  /** Contre-poids risque des chiffres du groupe, rendu avec eux et à la même taille. Jamais animé. */
  statsRisk?: string;
  range: {
    title: string;
    description: string;
    scpiNames: string[];
    /** Pastille sur la tuile de R Start dans la gamme (« Nouveau ») ; absente : rien. */
    currentBadge?: string;
  };
  /** Titre du bloc facultatif sur la rémunération de CORUM lors des cessions. Absent = bloc non rendu. */
  alignmentTitle?: string;
  /** Corps du bloc « rémunération sur les ventes ». À défaut, le composant retombe sur `intro`. */
  alignmentBody?: string;
  disclaimer: string;
  notes: LegalNote[];
}

export interface RiskItem {
  title: string;
  description: string;
  /** Appel de note légale porté par le titre du risque (id d'une LegalNote de la section). */
  noteId?: string;
}

export interface RisksContent {
  eyebrow: string;
  title: string;
  intro: string;
  items: RiskItem[];
  /** Avertissement du bulletin de souscription, in extenso. */
  bulletinWarning: string;
  /** Titre (H3) du bloc reproduisant l'avertissement du bulletin. */
  bulletinWarningTitle?: string;
  /** Avertissement du DIC (« produit qui n'est pas simple… »). */
  dicWarning: string;
  /** Titre (H3) du bloc reproduisant l'avertissement du DIC. */
  dicWarningTitle?: string;
  /** Phrase d'introduction des puces de la commission d'arbitrage (legal.ts, à l'identique). */
  arbitrageTitle?: string;
  arbitrageBullets: string[];
  notes: LegalNote[];
}

export interface DocumentItem {
  /** Clé stable du document (facts.documents[].key), portée par data-doc pour l'analytics. */
  key?: string;
  title: string;
  description: string;
  /** Chemin public (ex. /documents/r-start-dic.pdf). */
  file: string;
  version: string;
  kb?: number;
}

export interface DocumentsContent {
  eyebrow: string;
  title: string;
  intro: string;
  items: DocumentItem[];
  corumLink: { label: string; href: string };
  /** Lien interne vers la page Documentation (ex. « Toute la documentation »). */
  allDocumentsLink?: { label: string; href: string };
  /** Libellé du type de fichier affiché sur chaque carte (ex. « PDF »). */
  fileTypeLabel?: string;
  /** Unité du poids affiché après le nombre (ex. « ko »). */
  sizeUnit?: string;
  /** Mention lue par les lecteurs d'écran sur les liens qui ouvrent un nouvel onglet (ex. « nouvelle fenêtre »). */
  newTabHint?: string;
  /** aria-label de la liste des documents (ex. « Documents réglementaires de R Start »). */
  listLabel?: string;
  mention: string;
  notes: LegalNote[];
}

export interface FaqItem {
  question: string;
  /** Paragraphes de réponse (texte brut, pas de HTML). */
  answer: string[];
  /**
   * Index, dans `answer`, du premier paragraphe de contre-poids risque : les paragraphes précédents
   * sont l'avantage (data-advantage), ceux à partir de cet index sont rendus en RiskNote (data-risk),
   * même taille. Absent = réponse purement factuelle, sans paire avantage / risque.
   */
  riskFrom?: number;
  /** Appel de note légale porté par la question (id d'une LegalNote de la section). */
  noteId?: string;
}

export interface FaqContent {
  eyebrow: string;
  title: string;
  intro: string;
  items: FaqItem[];
  /** Toutes les questions, pour la page qui porte la FAQ complète (/documentation). */
  allItems?: FaqItem[];
  /** aria-label de la liste des questions (ex. « Questions fréquentes sur R Start »). */
  listLabel?: string;
  /** Renvoi vers la FAQ complète, rendu sous la liste de l'accueil. */
  moreLink?: { label: string; href: string };
  cta: Cta;
  notes: LegalNote[];
}

export interface NavContent {
  brand: string;
  brandSuffix: string;
  cta: Cta;
  /**
   * Libellé court du CTA de la sous-navigation sticky (ex. « Souscrire »), pour laisser la place à la
   * liste des sections à 375 px ; à défaut, `cta.label` est utilisé.
   */
  subnavCtaLabel?: string;
  skipLink: string;
  /** aria-label de la sous-navigation locale (ex. « Sections »). */
  sectionsLabel?: string;
  /** Libellé du lien de retour en haut de page porté par le logo (ex. « R Start, retour en haut »). */
  homeLinkLabel?: string;
  /** Libellé visible du bouton d'ouverture du menu mobile (ex. « Menu »). */
  menuLabel?: string;
  /** Libellé du bouton de fermeture du panneau de menu (ex. « Fermer »). */
  closeLabel?: string;
  /** aria-label de la navigation principale entre pages (ex. « Navigation principale »). */
  menuAriaLabel?: string;
  /** aria-label de la liste des pages dans le panneau de menu mobile (ex. « Pages du site »). */
  pagesLabel?: string;
  /** aria-label du fil d'Ariane des sous-pages (ex. « Fil d'Ariane »). */
  breadcrumbLabel?: string;
  /** Début de l'aria-label des appels de note (ex. « Voir la note » → « Voir la note 3 »). */
  noteRefLabel?: string;
}

/** Bandeau de consentement cookies (CNIL). */
export interface ConsentContent {
  title: string;
  body: string;
  /** Version courte de `body`, affichée sur petit écran pour ne pas masquer la ligne risques du hero. */
  bodyShort?: string;
  accept: string;
  refuse: string;
  customize: string;
  save: string;
  analyticsLabel: string;
  analyticsDescription: string;
  necessaryLabel: string;
  necessaryDescription: string;
  policyLabel: string;
  policyHref: string;
  manageLabel: string;
}

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterContent {
  columns: { title: string; links: FooterLink[] }[];
  /** aria-label de la navigation unique du pied de page qui englobe les colonnes de liens. */
  navLabel?: string;
  manageCookiesLabel: string;
  copyright: string;
  /** Titre H2 de la section Notes (ex. « Notes et sources »). */
  notesTitle?: string;
  /**
   * Libellé du repli de la liste des notes. `{n}` est remplacé par le nombre de notes de la page.
   * Le titre reste `notesTitle` ; ce libellé n'ajoute que le décompte.
   */
  notesToggleLabel?: string;
  /** Titre (masqué visuellement) du bloc de mentions légales du pied de page. */
  legalTitle?: string;
  /** Libellé du <summary> qui replie les blocs d'identité (le premier bloc reste déplié). */
  legalToggleLabel?: string;
  /** Mention lue par les lecteurs d'écran sur les liens externes (ex. « nouvelle fenêtre »). */
  externalLinkHint?: string;
  /** Alt des logos du pied de page. */
  logos?: { brandAlt: string; publisherAlt: string };
  /** Blocs de mentions légales, composés depuis legal.ts (reproduits à l'identique). */
  legalBlocks?: { title: string; paragraphs: string[] }[];
}

export interface SeoContent {
  title: string;
  description: string;
  ogImageAlt: string;
  keywords: string[];
}
