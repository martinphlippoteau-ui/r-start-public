import type { PictoKey } from '@/components/ui/Picto.astro';
import type { PageKey } from '@/config/pages';
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
export type CtaPosition =
  | 'nav'
  | 'hero'
  | 'frais'
  | 'simulateur'
  | 'simulateur-resultat'
  | 'souscrire'
  | 'strategie'
  | 'presse'
  | 'a-propos'
  | 'sticky'
  | 'faq'
  | 'footer'
  | 'mobile-bar';

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
  /** H1 unique de la page. */
  title: string;
  tagline: string;
  /** Note de périmètre de l'allégation de rang portée par l'accroche. */
  taglineNoteId?: string;
  /** Note des frais réels, accolée au contre-poids du hero. */
  riskNoteId?: string;
  /**
   * Ligne de définition du produit (facts.product.definition) : allégation de rang au périmètre du
   * groupe CORUM, toujours accompagnée de son appel de note (`definitionNoteId`).
   */
  definition?: string;
  /** Id de la LegalNote qui porte le périmètre de la définition (facts.product.definitionScope). */
  definitionNoteId?: string;
  /** Frais réellement prélevés, obligatoire dès que `definition` annonce une absence de frais (hors hero depuis le 10/09/2026). */
  subtitle?: string;
  /** Claim de la trame, en deux temps : l'énoncé puis la réponse (« Oui ! » / « Non ! »), en petit et animé. */
  claims?: { text: string; answer: string }[];
  /** Ligne risques visible sans scroller, même taille que le corps du hero. Jamais animée. */
  riskLine: string;
  primaryCta: Cta;
  secondaryCta: Cta;
  /** Invitation à descendre, au bas du hero : la flèche n'a pas de texte visible, ce libellé la nomme. */
  scrollHint?: { label: string };
  notes: LegalNote[];
}

export interface HighlightCard {
  /**
   * Libellé du repère (ex. « Ticket d'entrée »), au-dessus de la valeur. Facultatif depuis le
   * 14/09/2026 : le document de l'équipe termine son tableau par « 100 % Digital », qui se suffit à
   * lui-même. Sans libellé, le bloc ne rend que la valeur.
   */
  label?: string;
  /** Valeur mise en avant (ex. « 200 € »). */
  value: string;
  /** Appel de note : source et portée de la valeur. */
  noteId?: string;
  /**
   * Explication dépliable, derrière un bouton « i » posé après le libellé (15/09/2026). Elle dit ce que
   * la valeur RECOUVRE, quand le mot seul ne suffit pas : « Diversifiée », « Monde ». Ce n'est pas une
   * note légale, qui porte source et portée et vit dans `noteId` ; c'est de la pédagogie.
   */
  info?: string;
  /** Champs de l'ancienne carte détaillée, plus rendus depuis le 11/09/2026 (blocs simples). */
  icon?: string;
  description?: string;
  risk?: string;
}

export interface HighlightsContent {
  eyebrow: string;
  title: string;
  /**
   * Facultative depuis le 14/09/2026 : le document de l'équipe ouvre la section sur le tableau, sans
   * texte d'introduction, et la définition de la SCPI qui vivait ici ouvre désormais la FAQ.
   */
  intro?: string;
  cards: HighlightCard[];
  /**
   * Bloc à part sous les six repères (11/09/2026) : comment on souscrit et ce qu'on peut automatiser.
   * Séparé des repères par un filet et un titre, et rendu plus sobre : ce ne sont pas des
   * caractéristiques du produit mais des modalités.
   */
  subscriptionTitle?: string;
  subscriptionItems?: { label: string; value: string; noteId?: string }[];
  /** Contre-poids unique de la section, sous les repères. */
  risk?: string;
  /**
   * Appel à l'action secondaire, au pied de la section (15/09/2026). Il mène à une page du site, pas
   * au tunnel : il ne porte donc pas de `position`, contrairement aux CTA de souscription.
   */
  secondaryCta?: { label: string; href: string };
  /** Micro-textes : rien n'est écrit en dur dans le composant. */
  labels?: {
    /** Nom du bouton « i » pour les lecteurs d'écran, complété par le libellé de la carte. */
    info: string;
  };
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

/**
 * Un chapitre de /strategie : un surtitre facultatif, un titre, la phrase qui annonce la liste, la
 * liste, et la phrase qui la referme. Les trois chapitres de la page ont exactement cette forme dans
 * le document fourni par l'équipe, c'est lui qui donne le type.
 */
export interface StrategyChapter {
  /** Mot-clé au-dessus du titre (« Quoi », « Où »). Le premier chapitre n'en a pas. */
  eyebrow?: string;
  title: string;
  /** Texte d'ouverture du chapitre. */
  intro: string;
  /**
   * Annonce de la liste, deux points compris, quand `intro` sert déjà à autre chose (16/09/2026 : la
   * zone « Quoi » a reçu une phrase de méthode en ouverture, et son « L'équipe cible… » est descendu
   * ici). Sans `lead`, c'est `intro` qui annonce la liste, comme avant.
   */
  lead?: string;
  /**
   * `lead` porte l'accent (gras du document), `rest` la suite de la phrase quand il y en a une.
   * `icon` met une puce en pictogramme à la place du point (16/09/2026, demande de l'équipe sur les
   * deux items de la zone « Où ») : clé de ui/Picto.astro.
   * `benefit` : ce que le moteur apporte à l'épargnant, en une ligne sous le titre de la carte, côté
   * recto (17/09/2026, demande de l'équipe, cartes des deux moteurs de /strategie).
   */
  items: { lead: string; rest?: string; icon?: PictoKey; benefit?: string }[];
  /**
   * Phrase qui referme le chapitre, sous la liste. Facultative depuis le 16/09/2026 : celle des deux
   * moteurs est descendue dans la zone « Quoi », où elle ouvre le propos au lieu de fermer le précédent.
   */
  outro?: string;
  /** Mention placée par la Conformité sous le chapitre (ui/NoteConformite.astro). */
  disclaimer?: string;
  /** Légende de la carte de la zone d'investissement (zone « Où »), rendue hors du SVG. */
  map?: { legend: string };
}

/**
 * /strategie, contenu du 14/09/2026 : trois chapitres, ni plus ni moins.
 * Ce que le type ne porte plus, parce que la page ne le dit plus : le mot d'ordre et son contre-poids,
 * les trois piliers, la zone Conseil de l'Europe + Canada et sa carte, les types d'actifs du DIC,
 * l'effet de levier. Plus de `notes` non plus : la page n'appelle aucune source.
 */
export interface StrategyContent {
  /**
   * Titre commun aux trois volets (Sélective, Diversifiée, Opportuniste) de /strategie. Absent : le
   * bloc n'a pas d'en-tête et c'est le premier volet qui nomme la section, comme avant le 16/09/2026.
   */
  tilesTitle?: string;
  /**
   * Libellés VISIBLES des cartes qui se retournent : le bouton du recto (« En savoir plus ») et celui
   * du dos (« Fermer »), que src/scripts/carteRetournee.ts crée. Obligatoires depuis le 19/09/2026 :
   * facultatifs, ils laissaient au script un « Fermer » écrit en dur pour repli, seul texte du site à
   * ne pas venir du contenu.
   */
  dialogOpen: string;
  dialogClose: string;
  /* Ni `eyebrow` ni `title` : le H1 de la page vit dans strategyPage.ts, et un second titre ici aurait
     dérivé du premier à la première correction. Le corps commence directement au premier chapitre. */
  engines: StrategyChapter;
  what: StrategyChapter;
  where: StrategyChapter;
  how: StrategyChapter;
}

export interface StepItem {
  title: string;
  /** Détail de l'étape : plus rendu sur l'accueil depuis le 11/09/2026 (intitulés seuls). */
  description?: string;
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
    /**
     * Année de création par nom de SCPI, rendue sous chaque tuile. Une SCPI absente de l'objet n'a
     * pas de ligne de date : la tuile se referme sur son seul nom, sans trou.
     */
    scpiCreated?: Record<string, string>;
    /** Gabarit de la ligne de date, `{year}` remplacé par l'année (« Créée en 2012 »). */
    scpiCreatedLabel?: string;
    /** Pastille sur la tuile de R Start dans la gamme (« Nouveau ») ; absente : rien. */
    currentBadge?: string;
  };
  /**
   * Les familles de solutions d'épargne du groupe (page /a-propos). Absent = section non rendue.
   * `risk` est le contre-poids du bloc, rendu avec lui et à la même taille, jamais animé.
   */
  expertise?: {
    title: string;
    intro: string;
    items: { kicker: string; icon: string; title: string; description: string }[];
    risk: string;
  };
  /** Titre du bloc facultatif sur la rémunération de CORUM lors des cessions. Absent = bloc non rendu. */
  alignmentTitle?: string;
  /** Corps du bloc « rémunération sur les ventes ». À défaut, le composant retombe sur `intro`. */
  alignmentBody?: string;
  /** Libellé du bouton vers la page À propos. */
  aboutLink?: string;
  /**
   * Appel sous les chiffres du groupe, sur /a-propos (16/09/2026). Il SORT DU SITE, vers corum.fr :
   * `newTabHint` est ce que les lecteurs d'écran annoncent, il n'est pas affiché.
   */
  siteLink?: { label: string; href: string; newTabHint: string };
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
  /**
   * Facultative depuis le 15/09/2026 : l'équipe a demandé de retirer celle de l'accueil. Le texte reste
   * dans risks.ts, en commentaire, prêt à revenir.
   */
  intro?: string;
  items: RiskItem[];
  /** Titre (H2) de la section qui regroupe les avertissements reproduits in extenso (/documentation). */
  warningsTitle?: string;
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
  /**
   * Rubrique de la question (16/09/2026). Elle ne sert QUE sur /faq, qui groupe les vingt-deux
   * questions ; les sélections courtes des autres pages l'ignorent.
   */
  category?: string;
  /**
   * Tableau à deux colonnes rendu APRÈS les paragraphes de `answer` (barème des frais, commission sur
   * les plus-values, commission de retrait). Deux colonnes et pas davantage : au-delà, un tableau ne
   * tient plus sur un téléphone sans défilement latéral.
   */
  table?: { head: [string, string]; rows: [string, string][] };
  /** Puces rendues après les paragraphes, avant le tableau s'il y en a un. */
  bullets?: string[];
  /**
   * Paragraphes rendus APRÈS le tableau ou les puces. Ce sont des phrases de conclusion qui ne se
   * lisent qu'une fois le tableau vu (« Ainsi, CORUM gagne davantage seulement quand vous gagnez
   * davantage. ») : les mettre dans `answer` les aurait placées avant lui.
   */
  tableAfter?: string[];
}

export interface FaqContent {
  eyebrow: string;
  title: string;
  intro: string;
  items: FaqItem[];
  /** Toutes les questions, pour la page qui porte la FAQ complète (/faq depuis le 16/09/2026). */
  allItems?: FaqItem[];
  /**
   * Micro-textes de /faq (16/09/2026) : en-tête propre à la page, et champ de recherche. Celui-ci
   * FILTRE une liste déjà rendue, il n'interroge rien : les questions sont toutes dans le HTML.
   */
  pageTitle?: string;
  pageIntro?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  /** `{n}` y est remplacé par le nombre de questions trouvées (pluriel). */
  searchCount?: string;
  /** Une seule question trouvée. */
  searchCountOne?: string;
  searchEmpty?: string;
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
  /** Vide quand `soon` est vrai : l'entrée n'est alors pas un lien mais un dépliant. */
  href: string;
  external?: boolean;
  /**
   * Document annoncé mais pas encore publié (16/09/2026). L'entrée est rendue en <details> : au clic,
   * elle déplie `footer.soonMessage` au lieu d'ouvrir un fichier. Voir Footer.astro.
   */
  soon?: boolean;
}

export interface FooterContent {
  columns: { title: string; links: FooterLink[] }[];
  /** Message déplié par une entrée `soon` (« Document bientôt disponible »). */
  soonMessage?: string;
  /** aria-label de la navigation unique du pied de page qui englobe les colonnes de liens. */
  navLabel?: string;
  manageCookiesLabel: string;
  /** Libellé du retour en haut de page. Absent : le lien n'est pas rendu. */
  backToTopLabel?: string;
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
  /**
   * Signature du pied de page : logo R Start, `byLabel` (« par »), logo de l'éditeur, et leurs textes
   * alternatifs. Sans `byLabel`, les deux logos sont simplement posés côte à côte.
   */
  logos?: { brandAlt: string; publisherAlt: string; byLabel?: string };
  /** Blocs de mentions légales, composés depuis legal.ts (reproduits à l'identique). */
  legalBlocks?: { title: string; paragraphs: string[] }[];
}

export interface SeoContent {
  title: string;
  description: string;
  ogImageAlt: string;
  keywords: string[];
}

/**
 * Recherche du site (17/09/2026) : loupe de la barre, panneau, liens rapides et synonymes.
 * Voir src/content/fr/search.ts.
 */
export interface SearchContent {
  /** aria-label de la loupe, panneau fermé puis ouvert. */
  openLabel: string;
  closeLabel: string;
  /** Nom du dialogue et libellé (masqué) du champ. */
  dialogLabel: string;
  inputLabel: string;
  placeholder: string;
  quickLinksTitle: string;
  /**
   * Liens rapides du panneau vide. Une cible et une seule par lien : une page du plan du site, une
   * question de la FAQ (libellé exact, l'ancre en est dérivée), ou une section d'une page.
   */
  quickLinks: ({ label?: string } & (
    | { page: PageKey; section?: string }
    | { question: string }
  ))[];
  /** Titres des deux rubriques de résultats. */
  groups: { pages: string; questions: string };
  /** Décompte lu par les lecteurs d'écran ; `{n}` est remplacé. */
  countOne: string;
  countMany: string;
  /** Aucun résultat ; `{q}` est remplacé par la recherche. */
  empty: string;
  emptyLink: { label: string; page: PageKey };
  loading: string;
  error: string;
  /**
   * Groupes de synonymes : chercher l'un trouve les autres. Écrits en français courant, accents
   * compris ; la comparaison les retire.
   */
  synonyms: string[][];
}

