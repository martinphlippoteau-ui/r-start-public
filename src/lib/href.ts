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

/**
 * IDEMPOTENTE DEPUIS LE 16/09/2026, et ce n'est pas une précaution théorique : deux liens de l'accueil
 * sortaient en production sur « /r-start-public/r-start-public/a-propos ». Les composants Button,
 * StickyCta et Footer appellent déjà `withBase` sur le `href` qu'on leur passe ; quand l'appelant
 * l'avait appliqué de son côté, le préfixe était posé deux fois. Invisible en local, où la base vaut
 * « / » et où doubler une chaîne vide ne change rien : le défaut n'apparaît qu'avec PUBLIC_BASE_PATH.
 *
 * Les deux appels en trop sont corrigés, mais la fonction se protège désormais elle-même : c'est le
 * seul endroit qui connaît la base, c'est donc à lui de garantir qu'elle n'est posée qu'une fois.
 */
export const withBase = (path: string): string => {
  if (!path.startsWith('/')) return path;
  if (base && (path === base || path.startsWith(base + '/'))) return path;
  return base + path;
};
