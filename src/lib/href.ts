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
 * UNE PAGE S'ADRESSE AVEC SA BARRE FINALE (audit du 18/09/2026). Le site est publié en dossiers
 * (dist/frais/index.html) et l'hébergeur renvoie « /frais » vers « /frais/ » par une redirection 301 :
 * chaque clic du menu, chaque résultat de recherche et chaque préchargement au survol payait cet
 * aller-retour. Trois formes coexistaient : les liens et le canonical sans barre, le sitemap avec, et
 * la page servie en « /frais/ » déclarait pour adresse canonique une URL qui redirige vers elle-même.
 * Une seule forme maintenant, celle que l'hébergeur sert, posée ICI parce que tous les liens internes
 * passent par `withBase`. Un fichier (« .pdf », « .json », « .xml »…) n'est pas une page : inchangé.
 * La suite de l'adresse, ancre ou requête, reste à sa place : « /faq#question-… » donne
 * « /faq/#question-… ».
 */
const avecBarreFinale = (chemin: string): string => {
  const coupe = chemin.search(/[?#]/);
  const page = coupe === -1 ? chemin : chemin.slice(0, coupe);
  const suite = coupe === -1 ? '' : chemin.slice(coupe);
  if (page.endsWith('/') || /\.[a-z0-9]+$/i.test(page)) return chemin;
  return page + '/' + suite;
};

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
  const complet = avecBarreFinale(path);
  if (base && complet.startsWith(base + '/')) return complet;
  return base + complet;
};
