/**
 * Curation visuelle du site R Start. Chemins relatifs à src/assets/images ; TOUT CE QUI EST DANS CE
 * DOSSIER EST LIVRÉ AU NAVIGATEUR, cité ou non (src/lib/images.ts) : ce qu'on écarte quitte le
 * dossier, l'historique git le garde. Les pictogrammes ne sont pas des images mais des SVG au trait
 * de src/components/ui/Picto.astro (type PictoKey).
 *
 * Les immeubles sont des ILLUSTRATIONS fournies par l'équipe (15/09/2026), plus aucune
 * photographie : un dessin franchement dessiné ne fait pas passer une image de synthèse pour un
 * actif existant. La mention « Illustration. R Start ne détient aucun des immeubles représentés. »
 * n'est plus affichée depuis le 15/09/2026 et a quitté le code le 22/09/2026 (archivée hors du
 * dépôt, .claude/audits) : les alt disent « Illustration », rien d'autre ne le dit. Règles de tri :
 * aucun texte incrusté ni logo de tiers lisible ; aucune personne identifiable ; aucun bâtiment
 * réel reconnaissable qu'on pourrait croire détenu par R Start. Les alt décrivent l'architecture,
 * sans locataire ni adresse.
 *
 * LES FORMATS NE SONT PAS INTERCHANGEABLES : 2,36 pour les bandes pleine largeur (2,0 à 2,7 selon
 * l'écran), 1,25 pour le bloc « Ce qui change vraiment » (`aspect-[4/3]`). Remplacer une image par
 * une autre d'un rapport différent la fait recadrer de moitié.
 */

export interface MediaImage {
  /** Chemin relatif à src/assets/images, ex. 'immeubles/arboretum.jpg'. */
  src: string;
  /** Texte alternatif en français, ≤ 125 caractères. Vide pour un visuel purement décoratif. */
  alt: string;
}

export interface MediaContent {
  /** Application MyCORUM : photo d'un téléphone affichant l'application (bloc « Après la souscription »). */
  app: MediaImage;
  /** Visuel de la bande pleine largeur (03a-Immeuble). */
  hero: { main: MediaImage };
  /** Bande pleine largeur de la page /a-propos, entre les deux chapitres. */
  corum: MediaImage;
  /** Bloc « Ce qui change vraiment » (01b-Difference), face à la démonstration. */
  documents: MediaImage;
  /*
   * Pas d'image Open Graph photographique : diffusée seule sur les réseaux sociaux, une image
   * d'immeuble se lirait comme un patrimoine détenu. L'image OG est le visuel logo + dégradé
   * public/og/og-rstart.jpg (src/config/site.ts, ogImagePath), décrit par seo.ogImageAlt.
   */
}

export const media = {
  // 397 × 769 (rapport 1,94), PNG DÉTOURÉ (fond transparent), fourni par Martin le 24/09/2026 :
  // illustration d'un téléphone de face affichant le logo R Start. La source (1000 × 1000) portait
  // le téléphone dans son tiers gauche et, à droite, des immeubles et un ciel présents dans les
  // couleurs mais à alpha zéro, donc invisibles ; recadrée au dépôt sur les pixels visibles (sharp)
  // pour que le téléphone se centre. Pour montrer les immeubles, il faudrait réexporter le fichier
  // avec ce fond opaque.
  app: {
    src: 'app/iphone-app-r-start.png',
    alt: 'Illustration : téléphone affichant le logo R Start sur un écran bleu-vert',
  },
  hero: {
    // 2400 × 1018, rapport 2,36. La bande de 03a-Immeuble fait entre 2,0 et 2,7 selon l'écran : ce
    // format s'y pose sans recadrage perceptible. Rez-de-chaussée vitrés et perspective ouverte sur
    // un ciel clair, la plus lumineuse du lot (clarté 51 %) pour une bande posée sur fond blanc.
    main: {
      src: 'immeubles/rue-commerces-vitres.png',
      alt: 'Illustration : rue bordée d’immeubles à commerces vitrés, perspective vers un ciel clair',
    },
  },
  // Même rapport que la bande d'accueil (2,0 à 2,7 selon l'écran, cadre en 42vh à 60vh sur toute la
  // largeur). Seule du lot à montrer des plateaux de bureaux éclairés, le sujet de la page.
  corum: {
    src: 'immeubles/rue-bureaux-eclaires.png',
    alt: 'Illustration : rue vue de haut, immeuble de bureaux vitré aux plateaux éclairés sur la gauche',
  },
  // 2304 × 1856, rapport 1,25, contre un cadre en `aspect-[4/3]` (1,33) : le recadrage se voit à
  // peine. Vue prise de haut, seule du lot à montrer une ville entière plutôt qu'une rue.
  documents: {
    src: 'immeubles/toits-depuis-balcon.png',
    /* Raccourci sous 100 caractères (25/09/2026, audit Screaming Frog). */
      alt: 'Illustration : toits d’une ville et avenue vus d’un balcon au lever du jour',
  },
} as const satisfies MediaContent;
