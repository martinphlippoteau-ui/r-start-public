/**
 * Préfixe des liens internes par le chemin de base du site, servi à la racine (App Service, Static
 * Web Apps, domaine propre) ou sous un sous-chemin (GitHub Pages de projet). Le chemin est fixé au
 * build par PUBLIC_BASE_PATH, lu dans astro.config.mjs (`base`) et exposé dans
 * `import.meta.env.BASE_URL`. À utiliser sur tout chemin interne écrit en dur (« /frais »,
 * « /documents/….pdf ») ; ancres, URL absolues, `mailto:` et `tel:` sont renvoyées telles quelles.
 */
const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

/**
 * UNE PAGE S'ADRESSE AVEC SA BARRE FINALE (audit du 18/09/2026). Le site est publié en dossiers
 * (dist/frais/index.html) et l'hébergeur renvoie « /frais » vers « /frais/ » par une redirection
 * 301 que chaque clic du menu, chaque résultat de recherche et chaque préchargement payait ; le
 * canonical sans barre redirigeait même vers lui-même. Une seule forme maintenant, celle que
 * l'hébergeur sert, posée ICI parce que tous les liens internes passent par `withBase`. Un fichier
 * (« .pdf », « .json », « .xml »…) n'est pas une page : inchangé. La suite de l'adresse, ancre ou
 * requête, reste à sa place : « /faq#question-… » donne « /faq/#question-… ».
 */
const avecBarreFinale = (chemin: string): string => {
  const coupe = chemin.search(/[?#]/);
  const page = coupe === -1 ? chemin : chemin.slice(0, coupe);
  const suite = coupe === -1 ? '' : chemin.slice(coupe);
  if (page.endsWith('/') || /\.[a-z0-9]+$/i.test(page)) return chemin;
  return page + '/' + suite;
};

/**
 * IDEMPOTENTE (16/09/2026), et ce n'est pas une précaution théorique : deux liens de l'accueil
 * sortaient en production sur « /r-start-public/r-start-public/a-propos ». Button, StickyCta et
 * Footer appellent déjà `withBase` sur le `href` qu'on leur passe ; quand l'appelant l'avait
 * appliqué de son côté, le préfixe était posé deux fois, invisible en local où la base vaut « / ».
 * C'est le seul endroit qui connaît la base, c'est donc à lui de garantir qu'elle n'est posée
 * qu'une fois.
 */
export const withBase = (path: string): string => {
  if (!path.startsWith('/')) return path;
  const complet = avecBarreFinale(path);
  if (base && complet.startsWith(base + '/')) return complet;
  return base + complet;
};
