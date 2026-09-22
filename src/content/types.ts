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
  | 'subscribe'
  | 'corum'
  | 'risks'
  | 'faq'
  | 'notes';

export interface SectionMeta {
  /** Ancre HTML : l'id de la <section>. */
  id: string;
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
  primaryCta: Cta;
  /** Lien interne vers /frais : ce n'est pas un CTA de souscription, il ne porte pas de `position`. */
  secondaryCta: { label: string; href: string };
  /** Invitation à descendre, au bas du hero : la flèche n'a pas de texte visible, ce libellé la nomme. */
  scrollHint?: { label: string };
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
}

export interface HighlightsContent {
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
   * qui remplaçait `value` sous 640 px afin que le taux tienne sur une ligne. PLUS RENDUE depuis le
   * 16/09/2026 : le barème a quitté /frais, ses lignes restent EN VEILLE dans feesPage.ts.
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
 * liste, et la phrase qui la referme. Les quatre chapitres de la page (les deux moteurs, puis les
 * trois volets) ont cette forme dans le document fourni par l'équipe, c'est lui qui donne le type.
 */
export interface StrategyChapter {
  /** Mot-clé au-dessus du titre (« Sélective », « Diversifiée »…). Les moteurs n'en ont pas. */
  eyebrow?: string;
  title: string;
  /** Texte d'ouverture du chapitre. Les moteurs n'en ont pas. */
  intro?: string;
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
}

/**
 * /strategie, contenu du 14/09/2026, « ni plus ni moins » : les deux moteurs (`engines`), puis les
 * trois volets (`what`, `where`, `how`), réunis en tuiles le 16/09/2026.
 * Ce que le type ne porte plus, parce que la page ne le dit plus : le mot d'ordre et son contre-poids,
 * les trois piliers, la zone Conseil de l'Europe + Canada et sa carte, les types d'actifs du DIC,
 * l'effet de levier. Plus de `notes` non plus : la page n'appelle aucune source.
 */
export interface StrategyContent {
  /**
   * Titre commun aux trois volets (Sélective, Diversifiée, Opportuniste) de /strategie, depuis le
   * 16/09/2026. C'est le H2 qui nomme la section : 04-Strategy.astro le rend sans condition, et son
   * absence laisserait un H2 vide, le premier volet ne nommant plus la section comme avant.
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
  /** Titre (H2) du chapitre de l'accueil. */
  title: string;
  steps: StepItem[];
  /** aria-label de la liste des étapes (ex. « Les quatre étapes de la souscription »). */
  stepsLabel?: string;
  /** Mot lu par les lecteurs d'écran devant le numéro de chaque étape (ex. « Étape »). */
  stepPrefix?: string;
  /** Application MyCORUM : liens vers les deux magasins (accueil) et bloc de /documentation. */
  app?: {
    title: string;
    description: string;
    /** aria-label de la liste des liens de téléchargement. */
    storesLabel: string;
    stores: { label: string; href: string }[];
    /** Mention lue par les lecteurs d'écran : les liens ouvrent un nouvel onglet. */
    newTabHint: string;
  };
  cta: Cta;
}

export interface StatItem {
  /** Chiffre affiché tel quel, unité comprise (« 9,6 Md€ », « + 160 000 »). */
  value: string;
  label: string;
}

export interface CorumContent {
  title: string;
  /** Libellé du bouton vers la page À propos. */
  aboutLink?: string;
  /**
   * Appel sous les chiffres du groupe, sur /a-propos (16/09/2026). Il SORT DU SITE, vers corum.fr :
   * `newTabHint` est ce que les lecteurs d'écran annoncent, il n'est pas affiché.
   */
  siteLink?: { label: string; href: string; newTabHint: string };
}

export interface RiskItem {
  title: string;
  description: string;
  /** Appel de note légale porté par le titre du risque (id d'une LegalNote de la section). */
  noteId?: string;
}

export interface RisksContent {
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
  title: string;
  items: FaqItem[];
  /** Toutes les questions, pour la page qui porte la FAQ complète (/faq depuis le 16/09/2026). */
  allItems?: FaqItem[];
  /**
   * Micro-textes de /faq (16/09/2026) : en-tête propre à la page, et champ de recherche. Celui-ci
   * FILTRE une liste déjà rendue, il n'interroge rien : les questions sont toutes dans le HTML.
   */
  pageTitle?: string;
  /** Meta description de /faq (≤ 155 caractères, rappel de risque compris). */
  pageDescription: string;
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
  cta: Cta;
  /**
   * Libellé court du CTA de la barre (ex. « Souscrire ») ; à défaut, `cta.label` est utilisé. Il
   * fait tenir la barre sur une ligne : avec le logo, la loupe et le bouton Menu sur téléphone, avec
   * la liste des pages à partir de « lg ». Le nom vient de l'ancienne sous-navigation.
   */
  subnavCtaLabel?: string;
  skipLink: string;
  /** Libellé du lien de retour en haut de page porté par le logo (ex. « R Start, retour en haut »). */
  homeLinkLabel?: string;
  /** Libellé visible du bouton d'ouverture du menu mobile (ex. « Menu »). */
  menuLabel?: string;
  /** Libellé du bouton de fermeture du panneau de menu (ex. « Fermer »). */
  closeLabel?: string;
  /** aria-label de la navigation principale entre pages (ex. « Navigation principale »). */
  menuAriaLabel?: string;
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
  notesTitle: string;
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

