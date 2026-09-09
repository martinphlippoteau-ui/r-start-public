/**
 * Préfixe des liens internes par le chemin de base du site.
 *
 * Le site est servi à la racine (App Service, Static Web Apps, domaine propre) ou sous un
 * sous-chemin (GitHub Pages de projet : https://<compte>.github.io/<dépôt>/). Le chemin est fixé au
 * build par la variable PUBLIC_BASE_PATH, lue dans astro.config.mjs (`base`) et exposée par Astro
 * dans `import.meta.env.BASE_URL`.
 *
 * À utiliser sur tout chemin interne écrit en dur (« /frais », « /documents/….pdf »). Les ancres,
 * les URL absolues, `mailto:` et `tel:` sont renvoyées telles quelles.
 */
const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

export const withBase = (path: string): string => {
  if (!path.startsWith('/')) return path;
  return base + path;
};

/** Chemin de base normalisé, sans barre finale (chaîne vide quand le site est à la racine). */
export const basePath = base;
