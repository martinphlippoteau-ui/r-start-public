/**
 * Types du périmètre v2 (08/09/2026) : blocs de confiance, page Frais, page Documentation, page Presse.
 * Fichier séparé de types.ts, à l'origine pour ne pas interférer avec le lot design. La fusion annoncée
 * alors n'a pas été faite : les deux fichiers coexistent, celui-ci n'importe de l'autre que des types.
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
  /** H1 unique de la page. */
  title: string;
  /**
   * Facultative depuis le 14/09/2026 : /strategie ouvre directement sur son premier chapitre.
   * Un TABLEAU rend plusieurs paragraphes, quand le texte fourni en compte plusieurs (/a-propos).
   */
  intro?: string | string[];
  /**
   * Phrase-clé sous l'introduction, en gras (14/09/2026, /frais). Elle reste dans le MÊME corps de
   * texte que l'introduction et que la ligne risques : le gras marque l'insistance, jamais une taille
   * plus grande qu'un contre-poids, ce que l'AMF a déjà reproché à la brochure.
   */
  punchline?: string;
  /**
   * Ligne risques visible sans scroller, même taille que l'intro. Jamais animée.
   * FACULTATIVE depuis le 14/09/2026, et AUCUNE page ne la passe plus : l'équipe a demandé le même
   * jour de retirer les « Bon à savoir » de tous les en-têtes de sous-page (voir ui/PageHero.astro).
   * Leur en-tête n'a donc plus de mention de risque ; restent celles de leur contenu, quand il en
   * porte, et du pied de page. Le texte reste EN VEILLE dans le contenu de chaque page.
   */
  riskLine?: string;
}

/** Bloc « Confiance » : cadre réglementaire, avis Trustpilot, chiffres clés CORUM. */
export interface TrustContent {
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
 * le contre-poids chiffré n'y est plus rendu (voir `counterweight.risk`).
 */
export interface DifferenceContent {
  title: string;
  intro: string;
  /** Phrase qui annonce les deux situations, juste avant la liste. */
  lead?: string;
  /** Les deux situations où des frais sont prélevés. `strong` est le mot mis en valeur dans `text`. */
  situations?: { text: string; strong?: string }[];
  /**
   * Formule d'alignement (advantage) : « la société de gestion se rémunère sur les loyers encaissés et
   * les plus-values réalisées, jamais sur le montant que vous versez » (jamais « nous ne touchons rien
   * tant que vous n'avez pas gagné d'argent » : les 15 % sont prélevés sur les loyers même quand la
   * valeur des parts baisse), et son contre-poids chiffré : frais de gestion, commission sur les
   * cessions, commission de retrait, coût total inconnu à la souscription (risk).
   */
  counterweight: {
    /**
     * Contre-poids chiffré (frais réels et commission d'arbitrage). Plus rendu depuis le 11/09/2026,
     * sur demande réitérée de l'équipe ; le texte reste, c'est un texte de conformité.
     */
    risk: string;
    noteId?: string;
    /** Conclusion de l'équipe, en ouverture du bloc de démonstration. */
    pedagogy?: string[];
    /**
     * Allégation de rang. `noteId` est FACULTATIF depuis le 14/09/2026 : quand la phrase porte son
     * périmètre en elle (facts.product.definition, « du groupe CORUM »), elle n'a plus besoin d'un
     * appel de note pour le dire, et l'accueil n'en rend plus.
     */
    claim?: { text: string; noteId?: string };
  };
  /** Lien interne vers la page Frais : ce n'est pas un CTA de souscription, il ne porte pas de `position`. */
  cta: { label: string; href: string };
  /**
   * Appel à l'action rendu DANS le bloc, sous la démonstration (15/09/2026). Distinct de `cta`
   * ci-dessus, qui alimente la pastille flottante de la page.
   */
  secondaryCta?: { label: string; href: string };
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
 * Bascule pédagogique des frais de la page /frais (brochure partenaires 2026, p.6). PLUS RENDUE :
 * son composant a été supprimé le 14/09/2026, le contenu reste EN VEILLE dans feesPage.ts (voir
 * SHOW_MARKET_COMPARISON). Garde-fous à tenir si elle revient : aucune SCPI tierce nommée dans la
 * partie visible (`perimeter` ne nomme pas le panel), une seule taille de police pour toutes les
 * valeurs de frais, et l'encadré « Une innovation, pas une révolution » (legal.ts) reproduit à
 * l'identique sous la bascule.
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
  /** Phrase de périmètre, sous la bascule. Elle ne nomme pas les SCPI du panel. */
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
 * Micro-textes des anciens blocs de /frais (aria-label, en-têtes de colonnes, surtitres, libellés
 * de fichier). PLUS LUS depuis le 16/09/2026 : src/pages/frais.astro n'appelle plus ces blocs, et
 * ces libellés restent EN VEILLE dans feesPage.ts avec eux.
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

/**
 * Contenu de /frais. La page ne lit plus que `seo`, `hero` et `cta` (src/pages/frais.astro) : le
 * reste est EN VEILLE, gardé exprès et non affiché (blocs retirés entre le 11 et le 16/09/2026). Les
 * commentaires des champs décrivent le rendu qu'ils avaient et retrouveraient.
 */
export interface FeesPageContent {
  seo: PageSeo;
  hero: PageHero;
  /** Micro-textes des blocs en veille (voir FeesPageLabels). */
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
  /**
   * Bascule pédagogique des frais (brochure p.6), en veille (voir FeeComparison). Son `enabled`
   * n'est lu par rien : il ne la retire ni ne la rétablit.
   */
  marketComparison: FeeComparison;
  simulationDoc: DocumentItem;
  faq: { title: string; items: FaqItem[] };
  htNote: string;
  /** Titre de la note HT/TTC (« Bon à savoir : »), écrit en dur : il ne passe pas par RiskNote. */
  htNoteLabel?: string;
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
  notes: LegalNote[];
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
  /** Zone 4, « Vous êtes journaliste ? » (Contacts.astro). `source` n'est plus affichée. */
  contacts: {
    title: string;
    /** Phrase d'appel sous le titre. Absente : la liste suit directement le titre. */
    intro?: string;
    items: PressContact[];
    source: string;
  };
  labels?: PressLabels;
  notes: LegalNote[];
}
