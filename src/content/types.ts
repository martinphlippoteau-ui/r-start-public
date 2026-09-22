import type { PictoKey } from '@/components/ui/Picto.astro';
import type { PageKey } from '@/config/pages';
/** Types partagés du contenu éditorial (src/content/fr/*).
    Les composants ne contiennent aucun texte en dur : tout vient de ces structures. */

export type SectionKey =
  | 'hero'
  | 'difference'
  | 'essentials'
  | 'highlights'
  | 'fees'
  | 'strategy'
  | 'subscribe'
  | 'corum'
  | 'risks'
  | 'faq';

export interface SectionMeta {
  /** Ancre HTML : l'id de la <section>. */
  id: string;
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
  /** Libellé du repère (ex. « Ticket d'entrée »), au-dessus de la valeur. Sans libellé
      (« 100 % Digital »), le bloc ne rend que la valeur. */
  label?: string;
  /** Valeur mise en avant (ex. « 200 € »). */
  value: string;
  /** Explication dépliable derrière un bouton « i » : ce que la valeur RECOUVRE quand le mot seul
      ne suffit pas (« Diversifiée », « Monde »). De la pédagogie, pas une note légale. */
  info?: string;
}

export interface HighlightsContent {
  title: string;
  /** Facultative : le tableau ouvre la section sans introduction depuis le 14/09/2026. */
  intro?: string;
  cards: HighlightCard[];
  /** Bloc à part sous les repères, plus sobre : comment on souscrit et ce qu'on peut automatiser,
      des modalités et non des caractéristiques du produit. */
  subscriptionTitle?: string;
  subscriptionItems?: { label: string; value: string }[];
  /** Appel secondaire au pied de la section : vers une page du site, pas le tunnel, donc sans
      `position`. */
  secondaryCta?: { label: string; href: string };
  /** Micro-textes : rien n'est écrit en dur dans le composant. */
  labels?: {
    /** Nom du bouton « i » pour les lecteurs d'écran, complété par le libellé de la carte. */
    info: string;
  };
}

/** Un chapitre de /strategie : surtitre facultatif, titre, phrase qui annonce la liste, liste,
    phrase qui la referme. Le document de l'équipe donne cette forme aux quatre chapitres. */
export interface StrategyChapter {
  /** Mot-clé au-dessus du titre (« Sélective », « Diversifiée »…). Les moteurs n'en ont pas. */
  eyebrow?: string;
  title: string;
  /** Texte d'ouverture du chapitre. Les moteurs n'en ont pas. */
  intro?: string;
  /** Annonce de la liste, deux points compris, quand `intro` sert déjà à autre chose (zone
      « Quoi »). Sans `lead`, c'est `intro` qui annonce la liste. */
  lead?: string;
  /**
   * `lead` porte l'accent (gras du document), `rest` la suite de la phrase. `icon` met une puce en
   * pictogramme à la place du point (clé de ui/Picto.astro). `benefit` : ce que le moteur apporte à
   * l'épargnant, en une ligne sous le titre de la carte, côté recto.
   */
  items: { lead: string; rest?: string; icon?: PictoKey; benefit?: string }[];
  /** Phrase qui referme le chapitre, sous la liste. Les moteurs n'en ont pas. */
  outro?: string;
}

/**
 * /strategie, contenu du 14/09/2026, « ni plus ni moins » : les deux moteurs (`engines`), puis les
 * trois volets (`what`, `where`, `how`) en tuiles. Le type ne porte plus ce que la page ne dit
 * plus : mot d'ordre, trois piliers, zone du DIC et sa carte, types d'actifs, effet de levier.
 */
export interface StrategyContent {
  /** Titre commun aux trois volets : c'est le H2 qui nomme la section, 04-Strategy.astro le rend
      sans condition, et son absence laisserait un H2 vide. */
  tilesTitle?: string;
  /** Libellés VISIBLES des cartes qui se retournent, créés par src/scripts/carteRetournee.ts.
      Obligatoires : facultatifs, ils laissaient au script un « Fermer » écrit en dur pour repli. */
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
  /** Détail de l'étape ; l'accueil ne rend que les intitulés. */
  description?: string;
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
  /** Appel sous les chiffres du groupe, sur /a-propos. Il SORT DU SITE, vers corum.fr :
      `newTabHint` est ce que les lecteurs d'écran annoncent, il n'est pas affiché. */
  siteLink?: { label: string; href: string; newTabHint: string };
}

export interface RiskItem {
  title: string;
  description: string;
}

/**
 * Bloc « Points essentiels à connaître » (accueil, 22/09/2026, demande de Martin) : la mention de
 * CORUM L'Épargne reprise mot pour mot, dans l'UI du bloc Risques. Un titre, un paragraphe.
 */
export interface EssentialsContent {
  title: string;
  text: string;
}

export interface RisksContent {
  title: string;
  /** Facultative : celle de l'accueil a été retirée le 15/09/2026 à la demande de l'équipe. */
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
  /** Rubrique de la question. Ne sert QUE sur /faq ; les sélections courtes l'ignorent. */
  category?: string;
  /** Tableau à deux colonnes rendu APRÈS les paragraphes de `answer`. Deux colonnes et pas
      davantage : au-delà, un tableau ne tient plus sur un téléphone sans défilement latéral. */
  table?: { head: [string, string]; rows: [string, string][] };
  /** Puces rendues après les paragraphes, avant le tableau s'il y en a un. */
  bullets?: string[];
  /** Paragraphes rendus APRÈS le tableau ou les puces : des conclusions qui ne se lisent qu'une
      fois le tableau vu ; dans `answer`, elles seraient placées avant lui. */
  tableAfter?: string[];
}

export interface FaqContent {
  title: string;
  items: FaqItem[];
  /** Toutes les questions, pour la page qui porte la FAQ complète (/faq depuis le 16/09/2026). */
  allItems?: FaqItem[];
  /** Micro-textes de /faq : en-tête propre à la page, et champ de recherche. Celui-ci FILTRE une
      liste déjà rendue, il n'interroge rien : les questions sont toutes dans le HTML. */
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
}

export interface NavContent {
  brand: string;
  cta: Cta;
  /** Libellé court du CTA de la barre (ex. « Souscrire ») ; à défaut, `cta.label`. Il fait tenir la
      barre sur une ligne avec le logo, la loupe et le bouton Menu sur téléphone. */
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
  /** Document annoncé mais pas encore publié : l'entrée est rendue en <details> et déplie
      `footer.soonMessage` au lieu d'ouvrir un fichier (Footer.astro). */
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
  /** Titre (masqué visuellement) du bloc de mentions légales du pied de page. */
  legalTitle?: string;
  /** Libellé du <summary> qui replie les blocs d'identité (le premier bloc reste déplié). */
  legalToggleLabel?: string;
  /** Mention lue par les lecteurs d'écran sur les liens externes (ex. « nouvelle fenêtre »). */
  externalLinkHint?: string;
  /** Signature du pied de page : logo R Start, `byLabel` (« par »), logo de l'éditeur, et leurs
      textes alternatifs. Sans `byLabel`, les deux logos sont simplement posés côte à côte. */
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

/** Recherche du site : loupe de la barre, panneau, liens rapides et synonymes (search.ts). */
export interface SearchContent {
  /** aria-label de la loupe, panneau fermé puis ouvert. */
  openLabel: string;
  closeLabel: string;
  /** Nom du dialogue et libellé (masqué) du champ. */
  dialogLabel: string;
  inputLabel: string;
  placeholder: string;
  quickLinksTitle: string;
  /** Liens rapides du panneau vide. Une cible et une seule par lien : une page du plan du site, une
      question de la FAQ (libellé exact, l'ancre en est dérivée), ou une section d'une page. */
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
  /** Groupes de synonymes : chercher l'un trouve les autres. Écrits en français courant, accents
      compris ; la comparaison les retire. */
  synonyms: string[][];
}

