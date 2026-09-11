/**
 * Curation visuelle du site R Start.
 *
 * Chemins relatifs à src/assets/images (visuels préparés par `pnpm images`, jamais les originaux).
 * Sélection faite après lecture de 36 photos d'immeubles et 30 photos d'ambiance (Assets R Start,
 * dossiers 3 et 6). Règles appliquées :
 *  - photos réelles uniquement : aucun rendu 3D (atelier-arsenal, brazza, cambaceres, cartoucherie,
 *    clichy-batignolles, immeuble-05, meridien-bordeaux, palermo, pavillon-des-fleurs) ni diptyque ;
 *  - aucun texte incrusté ni logo de locataire lisible (exclus : woodwork-2, nolistra, immeuble-06,
 *    et l'ensemble des portraits de locataires du dossier ambiance) ;
 *  - aucune personne identifiable au premier plan, sauf l'ambiance des bureaux CORUM ;
 *  - hors zone d'investissement exclu (moment-studio) ; bâtiments emblématiques d'autrui évités
 *    (cheval-blanc, arbre-blanc) pour ne pas suggérer qu'ils appartiennent à R Start.
 * Les alt décrivent l'architecture : aucun locataire ni adresse n'est nommé faute de certitude.
 * Les pictogrammes ne sont plus des images : ce sont des SVG au trait dessinés dans
 * src/components/ui/Picto.astro (clés du champ `icon` des contenus : type PictoKey exporté par le composant).
 */

export interface MediaImage {
  /** Chemin relatif à src/assets/images, ex. 'immeubles/arboretum.jpg'. */
  src: string;
  /** Texte alternatif en français, ≤ 125 caractères. Vide pour un visuel purement décoratif. */
  alt: string;
  /**
   * Crédit ou mention affichée sous l'image, dans le même corps que les légendes (à rendre par
   * l'intégrateur). Obligatoire sur les photos d'immeubles : R Start n'a pas encore de patrimoine.
   */
  credit?: string;
}

/** Mention sous chaque photo d'immeuble : aucun de ces bâtiments n'appartient à R Start. */
const illustration = 'Photo d’illustration. Immeuble non détenu par R Start.';

export interface MediaContent {
  /** Application MyCORUM : photo d'un téléphone affichant l'application (bloc « Après la souscription »). */
  app: MediaImage;
  /** Photo de second plan du hero (chargement eager, jamais animée) et solution de repli. */
  hero: { main: MediaImage; alt: MediaImage };
  /** Trois immeubles variés pour le défilement de la section Stratégie. */
  strategy: readonly MediaImage[];
  income: MediaImage;
  subscribe: MediaImage;
  /** Ambiance des bureaux CORUM (section « CORUM »). */
  corum: readonly MediaImage[];
  documents?: MediaImage;
  /**
   * Pas d'image Open Graph photographique : diffusée seule sur les réseaux sociaux, une photo d'immeuble
   * ne peut pas porter la mention « Immeuble non détenu par R Start ». L'image OG est le visuel logo +
   * dégradé public/og/og-rstart.jpg (src/config/site.ts, ogImagePath), décrit par seo.ogImageAlt.
   */
}

export const media = {
  // 768 × 1365, fournie par l'équipe le 11/09/2026 : téléphone affichant l'application MyCORUM.
  app: {
    src: 'app/iphone-rstart.jpeg',
    alt: 'Téléphone affichant l’application MyCORUM de CORUM L’Épargne',
  },
  hero: {
    // 2400 × 1600, 647 ko. Bureaux contemporains bois/verre, ciel bleu, lumière franche : la plus
    // « premium » du lot, avec une zone de ciel qui laisse respirer le titre et la ligne risques.
    main: {
      src: 'immeubles/arboretum.jpg',
      alt: 'Immeuble de bureaux contemporain en bois et verre, escaliers extérieurs blancs et jeunes arbres sous un ciel bleu',
      credit: illustration,
    },
    // 2400 × 1600, 669 ko. Verrière blanche très graphique, ton clair proche du blanc cassé du site.
    alt: {
      src: 'immeubles/bem.jpg',
      alt: 'Bâtiment tertiaire tout en verre abrité par une grande verrière blanche à claire-voie, arbres au premier plan',
      credit: illustration,
    },
  },
  strategy: [
    // Bureaux : siège en gradins, terrasses végétalisées et plan d'eau (2000 × 1332).
    {
      src: 'immeubles/soprema.jpg',
      alt: 'Immeuble de bureaux aux terrasses en gradins, plan d’eau au premier plan sous un ciel bleu',
      credit: illustration,
    },
    // Activité : immeuble de taille intermédiaire en zone d'activités, exactement la cible R Start
    // (2400 × 1602). Logo du locataire sur la porte illisible à l'écran.
    {
      src: 'immeubles/toul-kimmo.jpg',
      alt: 'Petit immeuble de bureaux de trois niveaux en zone d’activités, bardage métallique et menuiseries bois',
      credit: illustration,
    },
    // Immeuble urbain mixte en bord de fleuve, lumière dorée (2400 × 1351). Aucune photo réelle
    // d'actif hors de France n'est disponible dans le dossier : voir openQuestions.
    {
      src: 'immeubles/projet-241028-1.jpg',
      alt: 'Tour à trame en bois au bord d’un fleuve au coucher du soleil, pont et quais arborés en contrebas',
      credit: illustration,
    },
  ],
  // 2400 × 1599. Terrasse calme, horizon dégagé sur Paris : évoque la durée sans promettre un gain.
  income: {
    src: 'immeubles/woodwork-3.jpg',
    alt: 'Terrasse en bois d’un immeuble avec vue dégagée sur les toits de Paris, rayons de soleil entre les nuages',
    credit: illustration,
  },
  // 1700 × 1000. Plein soleil, horizon ouvert : « un nouveau départ » sans personne ni écran.
  subscribe: {
    src: 'immeubles/nicolas-laisne.jpg',
    alt: 'Terrasse en bois d’un immeuble à façade en lames métalliques, vue sur un fleuve en plein soleil',
    credit: illustration,
  },
  corum: [
    // 2000 × 1336. Accueil des bureaux CORUM, logo au mur, deux collaborateurs en arrière-plan.
    {
      src: 'ambiance/hero-a-propos.jpg',
      alt: 'Espace d’accueil des bureaux de CORUM, logo au mur, deux collaborateurs en discussion à l’arrière-plan',
    },
    // 2000 × 1336. Salon des bureaux CORUM, sans personne, teintes fauve et bleu canard.
    {
      src: 'ambiance/wttj-salon.jpg',
      alt: 'Salon des bureaux de CORUM, deux fauteuils en cuir fauve, tapis bleu canard et tables basses en verre',
    },
  ],
  // 2400 × 1359. Tombée du jour, salle de réunion éclairée : ambiance sombre qui suit la section
  // Risques (fond ink) sans rupture. Optionnelle.
  documents: {
    src: 'immeubles/lan-agence.jpg',
    alt: 'Terrasse d’un immeuble parisien à la tombée du jour, salle de réunion éclairée et rue animée en contrebas',
    credit: illustration,
  },
} as const satisfies MediaContent;
