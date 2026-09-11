/**
 * Visuel du hero : plus aucune image depuis le 11/09/2026 (la photo plein cadre du 10/09 a cédé la place
 * au fond ink + halo de marque et au vol du logo, src/components/sections/01-Hero.astro). Ce module ne
 * partage donc plus de largeurs, de format ni de `sizes` entre le hero et le préchargement d'index.astro ;
 * il est conservé vide pour qu'un futur visuel du hero retrouve son point d'entrée unique (une seule
 * définition, reprise par la balise <Image> et par <link rel="preload">).
 */
export {};
