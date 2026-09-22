/**
 * Curation visuelle du site R Start.
 *
 * Chemins relatifs à src/assets/images. TOUT CE QUI EST DANS CE DOSSIER EST LIVRÉ AU NAVIGATEUR,
 * cité ou non (src/lib/images.ts) : ce qu'on écarte quitte le dossier, l'historique git le garde.
 *
 * LES IMMEUBLES SONT DES ILLUSTRATIONS DEPUIS LE 15/09/2026, fournies par l'équipe. Les photos du
 * dossier Assets qui les précédaient ont été retirées. Ce changement défait la règle qui ouvrait ce
 * fichier, « photos réelles uniquement, aucun rendu 3D » : elle visait à ne pas faire passer une
 * image de synthèse pour un actif existant. Un dessin franchement dessiné ne pose pas ce risque, il
 * l'écarte plutôt. La mention sous l'image, elle, reste (voir `illustration` plus bas).
 *
 * Ce qui tient toujours, et qui a servi à trier les quinze reçues :
 *  - aucun texte incrusté ni logo de tiers lisible ;
 *  - aucune personne identifiable : les silhouettes dessinées ne le sont pas. Les photos d'ambiance
 *    des bureaux CORUM, seule exception assumée, ont quitté le site le 15/09/2026 ;
 *  - aucun bâtiment réel reconnaissable qu'on pourrait croire détenu par R Start.
 *
 * LES FORMATS NE SONT PAS INTERCHANGEABLES. Chaque rapport a son cadre : 2,36 pour la bande pleine
 * largeur (03a-Immeuble, 2,0 à 2,7 selon l'écran), 1,25 pour le bloc « Ce qui change vraiment »
 * (`aspect-[4/3]`). Les portraits en 0,80 de l'ancienne section Stratégie, qui n'a plus de photo depuis
 * le 16/09/2026, ont été retirés le 22/09/2026 : ils partaient en production sans être cités.
 * Remplacer une image par une autre d'un rapport différent la fait recadrer de moitié.
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

/**
 * INTERRUPTEUR DES LÉGENDES, posé le 15/09/2026 : « supprime toutes les légendes sous les images ».
 * Même geste que pour les notes légales (src/components/LegalNotes.astro) et les « Bon à savoir » :
 * RIEN N'EST EFFACÉ, seul l'affichage est coupé. Les textes restent dans ce fichier, le service
 * conformité les replacera où il l'entend.
 * Les trois rendus concernés : 03a-Immeuble, 01b-Difference et CorumRange.
 * Pour les rétablir : passer cette constante à `true`, et rien d'autre.
 */
export const AFFICHER_LEGENDES = false;

/**
 * Mention sous chaque visuel d'immeuble : aucun de ces bâtiments n'appartient à R Start.
 * LIBELLÉ CHANGÉ LE 15/09/2026, avec le lot d'illustrations. « Photo d'illustration » était devenu
 * faux : ce sont des dessins. La mention reste, car c'est elle qui empêche de lire ces visuels comme
 * un patrimoine détenu ; c'est sa raison d'être, pas la nature du fichier. À faire valider par la
 * conformité avant la mise en ligne publique.
 */
const illustration = 'Illustration. R Start ne détient aucun des immeubles représentés.';

export interface MediaContent {
  /** Application MyCORUM : photo d'un téléphone affichant l'application (bloc « Après la souscription »). */
  app: MediaImage;
  /**
   * Visuel de la bande pleine largeur (03a-Immeuble). `alt` a été retiré le 15/09/2026 : la solution
   * de repli n'était plus lue depuis que le hero est passé aux aurores en dégradé.
   */
  hero: { main: MediaImage };
  /** Bande pleine largeur de la page /a-propos, entre les deux chapitres. */
  corum: MediaImage;
  documents?: MediaImage;
  /**
   * Pas d'image Open Graph photographique : diffusée seule sur les réseaux sociaux, une photo d'immeuble
   * ne peut pas porter la mention « Immeuble non détenu par R Start ». L'image OG est le visuel logo +
   * dégradé public/og/og-rstart.jpg (src/config/site.ts, ogImagePath), décrit par seo.ogImageAlt.
   */
}

export const media = {
  // 338 × 536, PNG DÉTOURÉ (fond transparent), fourni par l'équipe le 11/09/2026. Il remplace
  // app/iphone-rstart.jpeg, dont l'arrière-plan blanc devait être fondu au masque et dont les badges
  // incrustés portaient « Apple Store » et « Android Store » au lieu des marques déposées.
  // À REDEMANDER EN PLUS GRAND : 338 px de large, le visuel est déjà à sa taille native sur grand écran.
  app: {
    src: 'app/iphone-app-corum.png',
    alt: 'Téléphone affichant l’écran d’accueil de l’application, logo R Start sur fond sombre',
  },
  hero: {
    // 2400 × 1018, rapport 2,36. La bande de 03a-Immeuble fait entre 2,0 et 2,7 selon l'écran : ce
    // format s'y pose sans recadrage perceptible. Rez-de-chaussée vitrés et perspective ouverte sur
    // un ciel clair, la plus lumineuse du lot (clarté 51 %) pour une bande posée sur fond blanc.
    main: {
      src: 'immeubles/rue-commerces-vitres.png',
      alt: 'Illustration : rue bordée d’immeubles à commerces vitrés, perspective vers un ciel clair',
      credit: illustration,
    },
  },
  /*
   * LES DEUX MOTEURS DE PERFORMANCE n'ont plus d'images depuis le 16/09/2026 : leurs bandeaux sont
   * devenus des dessins animés (src/components/EngineRent.astro et EngineGain.astro), dans la même
   * grammaire que les trois tuiles de la sélection. Les deux illustrations qui occupaient la place
   * (rue-vitrines, rue-hotel-marquise) montraient un décor ; les dessins montrent le mécanisme.
   * L'entrée est retirée d'ici et de MediaContent : une donnée que personne ne lit induit en erreur.
   */
  /*
   * LES PHOTOS D'AMBIANCE SONT PARTIES LE 15/09/2026 : plus aucune photographie sur le site, tout
   * l'imagier est dessiné. Les deux vues des bureaux CORUM ont été supprimées, ainsi que l'atelier
   * de production que la section des savoir-faire lisait avant sa dépose. Le dossier src/assets/
   * images/ambiance n'existe plus.
   * Le rapport visé ici est le même que la bande d'accueil : 2,0 à 2,7 selon l'écran, pour un cadre
   * en 42vh à 60vh sur toute la largeur. Seule du lot à montrer des plateaux de bureaux éclairés,
   * ce qui est le sujet de la page.
   */
  corum: {
    src: 'immeubles/rue-bureaux-eclaires.png',
    alt: 'Illustration : rue vue de haut, immeuble de bureaux vitré aux plateaux éclairés sur la gauche',
    credit: illustration,
  },
  // 2304 × 1856, rapport 1,25, contre un cadre en `aspect-[4/3]` (1,33) : le recadrage se voit à
  // peine. Vue prise de haut, seule du lot à montrer une ville entière plutôt qu'une rue.
  documents: {
    src: 'immeubles/toits-depuis-balcon.png',
    alt: 'Illustration : vue depuis un balcon sur les toits d’une ville et une avenue en contrebas au lever du jour',
    credit: illustration,
  },
} as const satisfies MediaContent;
