/**
 * Types du périmètre v2 (08/09/2026) : blocs de confiance, page Frais, page Documentation, page Presse.
 * Fichier séparé de types.ts pour ne pas interférer avec le lot design ; fusion prévue à l'intégration.
 */
import type {
  AdvantageRisk,
  Cta,
  DocumentItem,
  FaqItem,
  FeeKind,
  FeeRow,
  LegalNote,
  StatItem,
  StepItem,
  WithdrawalStep,
} from '@/content/types';

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
    /** Nom accessible des TrustBox officiels (contenu rendu par Trustpilot dans une iframe). */
    widgetLabel?: string;
    /** Portée des avis, affichée sous le bandeau du hero. */
    heroCaption?: string;
  };
  stats: {
    title: string;
    items: StatItem[];
    source: string;
    risk: string;
  };
  notes: LegalNote[];
}

/**
 * Section « Ce qui change vraiment » (zone 2 de l'accueil, brochure partenaires 2026 p.4 et p.6).
 * Explique quand la société de gestion se rémunère : les deux moteurs (loyers encaissés, plus-value
 * réalisée à la vente), le mécanisme de réserve en cas de moins-value, et le contre-poids chiffré des
 * frais réellement prélevés. Chaque avantage porte son risque dans le même bloc et à la même taille.
 */
export interface DifferenceContent {
  eyebrow: string;
  title: string;
  intro: string;
  /** Surtitre du bloc des deux moteurs (ex. « Deux moteurs »). */
  enginesTitle?: string;
  /** aria-label de la liste des moteurs (ex. « Les deux moteurs de rémunération »). */
  enginesLabel?: string;
  /** Les deux moteurs. `description` est l'avantage, `risk` son contre-poids (même taille, même carte). */
  engines: {
    title: string;
    description: string;
    risk: string;
    noteId?: string;
    /** Index de la photo d'illustration dans media.strategy (carte du modèle). */
    image?: number;
  }[];
  /**
   * Formule d'alignement (advantage) : « la société de gestion se rémunère sur les loyers encaissés et
   * les plus-values réalisées, jamais sur le montant que vous versez » (jamais « nous ne touchons rien
   * tant que vous n'avez pas gagné d'argent » : les 15 % sont prélevés sur les loyers même quand la
   * valeur des parts baisse), et son contre-poids chiffré : frais de gestion, commission sur les
   * cessions, commission de retrait, coût total inconnu à la souscription (risk).
   */
  counterweight: AdvantageRisk & {
    title?: string;
    noteId?: string;
    /** Les deux phrases « Payer des frais… oui / … non » de la trame, en ouverture du bloc (hero minimal). */
    pedagogy?: string[];
    /** Allégation de rang bornée (facts.product.definition) : jamais sans son appel de note. */
    claim?: { text: string; noteId: string };
  };
  /** Mécanisme de réserve en cas de moins-value, résumé en deux phrases (brochure partenaires 2026, p.4). */
  lossMechanism: { title: string; body: string[]; risk: string; noteId?: string };
  /** Lien interne vers la page Frais : ce n'est pas un CTA de souscription, il ne porte pas de `position`. */
  cta: { label: string; href: string };
  notes: LegalNote[];
}

/**
 * Une étape du parcours de l'épargnant dans la bascule des frais (§3 bis du plan) : ce que l'on paie à
 * la souscription, à l'achat des immeubles, pendant la détention, à la vente d'un immeuble et à la
 * sortie. Le même parcours est rejoué des deux côtés de la bascule, dans le même ordre.
 */
export interface FeeJourneyStep {
  /** Moment du parcours, identique des deux côtés (ex. « À la souscription »). */
  moment: string;
  /** Nom du frais tel qu'affiché (ex. « Frais sur les achats d'immeubles »). */
  label: string;
  /**
   * Valeur affichée (ex. « 4 % », « 0 / 6 / 12 % »). Toutes les valeurs de frais de la bascule sont
   * rendues dans la même taille de police, des deux côtés : exigence AMF.
   */
  value: string;
  /** Assiette du prélèvement (ex. « prélevés sur le prix d'achat »). */
  base: string;
  /** Moment et fréquence du prélèvement (ex. « Frais unique à l'entrée »). */
  timing: string;
  /** Précision facultative affichée sous la valeur (ex. le détail des paliers). */
  detail?: string;
}

/** Une position de la bascule : un intitulé, une phrase de synthèse et le parcours complet. */
export interface FeeComparisonSide {
  /** Identifiant technique (ancre, id des onglets) : « marche » ou « rstart ». */
  key: string;
  /** Intitulé du bouton (ex. « SCPI avec frais d'acquisition »). Aucun nom de concurrent. */
  label: string;
  /** Phrase de synthèse de la position, sans avantage isolé. */
  summary: string;
  steps: FeeJourneyStep[];
}

/**
 * Bascule pédagogique des frais de la page /frais (brochure partenaires 2026, p.6).
 * Garde-fous : aucune SCPI tierce nommée dans la partie visible (le panel et la source vivent dans
 * `perimeter`, toujours affiché), une seule taille de police pour toutes les valeurs de frais, et
 * l'encadré « Une innovation, pas une révolution » (legal.ts) reproduit à l'identique sous la bascule.
 */
export interface FeeComparison {
  enabled: boolean;
  eyebrow?: string;
  title: string;
  intro: string;
  /** aria-label du groupe de boutons de la bascule. */
  switchLabel: string;
  /** [position de marché, position R Start] ; la première est affichée par défaut. */
  sides: [FeeComparisonSide, FeeComparisonSide];
  /** En-têtes de colonnes de la lecture sans JavaScript (moment, frais, valeur). */
  columns: { moment: string; fee: string; value: string };
  /** Périmètre et sources, toujours affichés sous la bascule (les neuf SCPI y sont citées). */
  perimeter: string;
  /** Note de bas de tableau (frais d'agent immobilier) ; affichée avec le périmètre. */
  footnote?: string;
  /** Contre-poids risque, dans la même taille que le reste du bloc. */
  risk: string;
  /** Encadré « Une innovation, pas une révolution », reproduit à l'identique depuis legal.ts. */
  innovationBox: { title: string; body: string };
  /** Appel de note légale porté par le titre du bloc. */
  noteId?: string;
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
  eyebrows: {
    schedule: string;
    withdrawal: string;
    lossMechanism: string;
    costImpact: string;
    document: string;
    faq: string;
  };
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
  /**
   * Frais réellement prélevés (gestion, cessions, retrait), affichés à la même taille que les trois
   * « 0 % » ci-dessus : exigence AMF de taille de police uniforme pour tous les frais.
   */
  counterweightRates: { value: string; label: string }[];
  groups: FeeGroup[];
  withdrawal: {
    title: string;
    intro: string;
    steps: WithdrawalStep[];
    exemptionsTitle: string;
    exemptions: string[];
    note: string;
  };
  /** Mécanisme de réserve en cas de moins-value (brochure p.4). */
  lossMechanism: { title: string; body: string[]; risk: string };
  arbitrageWarning: { title: string; bullets: string[] };
  innovationBox: { title: string; body: string };
  /** Incidence des coûts du DIC (coûts, jamais de rendement). */
  costImpact: {
    title: string;
    intro: string;
    rows: { period: string; impact: string }[];
    note: string;
    risk: string;
  };
  /** Bascule pédagogique des frais (brochure p.6) ; enabled=false pour la retirer en une ligne. */
  marketComparison: FeeComparison;
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
  /** Décompte d'un groupe dans le sommaire de l'en-tête. `{n}` : nombre ; `{s}` : marque du pluriel. */
  anchorsCountLabel?: string;
  /**
   * Nom du sommaire rendu dans l'en-tête. Distinct de `anchorsLabel` (la barre d'ancres collante) :
   * deux repères de navigation d'une même page ne peuvent pas porter le même nom accessible.
   */
  anchorsAsideLabel?: string;
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
  /** Amorce du lien de note placé sous la réponse (le marqueur de la question n'est pas focusable). */
  faqNoteLead?: string;
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
  /**
   * FAQ de la page : seulement les questions dont le sujet est un document ou la souscription (la
   * sélection est faite dans documentation.ts). `fullFaqLink` renvoie vers la foire aux questions
   * complète de l'accueil, où les autres questions restent lisibles — elles ne sont plus dupliquées.
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

/**
 * Article de presse tiers. Le titre est une citation : il est reproduit tel qu'il a été publié, jamais
 * réécrit, et il est couvert par l'avertissement de fin de page. `url` est vide tant que l'adresse de
 * l'article n'a pas été vérifiée : l'article s'affiche alors avec son média et sa date, sans lien.
 */
export interface PressArticle {
  media: string;
  title: string;
  date?: string;
  dateIso?: string;
  url?: string;
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
  /** Type de fichier des communiqués (ex. « PDF »), affiché avant le poids et lu avec le lien. */
  fileTypeLabel?: string;
  /** Unité du poids des fichiers (ex. « ko »). */
  sizeUnit?: string;
  /** Mention lue par les lecteurs d'écran sur les liens ouvrant une nouvelle fenêtre. */
  newTabHint?: string;
  /** Libellé de l'action de téléchargement des logos (ex. « Télécharger »). */
  downloadLabel?: string;
  /** aria-label des listes (communiqués, articles, citations, contacts, logos). */
  releasesListLabel?: string;
  coverageListLabel?: string;
  quotesListLabel?: string;
  contactsListLabel?: string;
  logosListLabel?: string;
  /** Intitulés des lignes d'une carte contact. */
  phoneLabel?: string;
  emailLabel?: string;
  /** Sous-titres du kit média. */
  logosTitle?: string;
  keyFactsTitle?: string;
}

/**
 * Page /presse « La presse en parle » (grand public) : trois citations mises en avant, la revue des
 * articles et l'avertissement de fin. Aucun logo de média (aucune licence), les noms sont en
 * typographie. Les communiqués, contacts et kit média vivent sur /salle-de-presse (PressRoomContent).
 */
export interface PressContent {
  seo: PageSeo;
  hero: PageHero;
  quotes: { title: string; intro?: string; items: PressQuote[] };
  coverage: { title: string; intro: string; items: PressArticle[]; disclaimer: string };
  /** Renvoi vers /salle-de-presse, absente du menu principal. */
  pressRoomLink: { title: string; body: string; label: string; href: string };
  labels?: PressLabels;
  notes: LegalNote[];
}

/** Page /salle-de-presse (journalistes) : communiqués, contacts, kit média et texte de présentation. */
export interface PressRoomContent {
  seo: PageSeo;
  hero: PageHero;
  releases: { title: string; intro: string; items: PressRelease[]; emptyLabel: string };
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
  /** Renvoi vers /presse, dans le menu principal. */
  coverageLink: { title: string; body: string; label: string; href: string };
  labels?: PressLabels;
  notes: LegalNote[];
}
