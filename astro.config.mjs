// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import recherche from './scripts/search-index.mjs';

// URL canonique du site. Placeholder tant que le domaine n'est pas connu.
const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://r-start.com';
// Chemin de base : '/' à la racine (App Service, Static Web Apps, domaine propre) ou '/depot' pour un
// site de projet GitHub Pages. Les liens internes passent par withBase() (src/lib/href.ts).
const RAW_BASE = process.env.PUBLIC_BASE_PATH || '/';
// Accepte « /depot/ », « /depot » ou « depot ». Seul le dernier segment est retenu : certains shells
// Windows réécrivent une valeur commençant par une barre oblique en chemin absolu.
const BASE_SEGMENTS = RAW_BASE.split('/').filter(Boolean);
const BASE_PATH = BASE_SEGMENTS.length ? '/' + BASE_SEGMENTS[BASE_SEGMENTS.length - 1] + '/' : '/';

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  compressHTML: true,
  /*
   * Préchargement au SURVOL (12/09/2026) : la page cible est demandée pendant que le doigt approche, la
   * transition n'attend donc jamais le réseau. `hover` et non `viewport` : précharger tout ce qui entre
   * à l'écran ferait télécharger huit pages à chaque visite, pour un site qui tient à sa légèreté.
   */
  prefetch: { defaultStrategy: 'hover' },
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Pas de scripts/assets inlinés : nécessaire pour tenir la CSP sans 'unsafe-inline' côté script.
      assetsInlineLimit: 0,
    },
  },
  integrations: [
    /* Recherche du site (17/09/2026) : écrit dist/recherche.json à partir des pages construites. */
    recherche(),
    sitemap({
      filter: (page) =>
        /* Pages d'erreur (25/09/2026) et /cookies, en noindex : hors du plan du site. */
        !/\/(403|404|500|503)(\/|\.html)?$/.test(page) &&
        !page.includes('/cookies'),
      changefreq: 'weekly',
      priority: 0.8,
      /* Date de mise à jour (audit SEO du 25/09/2026) : celle du build, la même pour toutes les pages ;
         elle invite les moteurs à revenir après chaque mise en ligne. */
      lastmod: new Date(),
    }),
  ],
  env: {
    schema: {
      // Domaine public (canonical, sitemap, OG). Sans valeur : placeholder de développement.
      PUBLIC_SITE_URL: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
        default: 'https://r-start.com',
      }),
      // URL du tunnel de souscription réglementé. Tous les CTA pointent ici (src/config/site.ts).
      PUBLIC_SUBSCRIBE_URL: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
        default: 'https://www.corum.fr/?tunnel=r-start#placeholder',
      }),
      // « true » le jour où le tunnel de souscription ouvre. Tant que la valeur est vide ou « false »,
      // tous les CTA « Souscrire » ouvrent la fenêtre « la souscription arrive bientôt » au lieu de
      // quitter le site. Interrupteur EXPLICITE : la détection précédente cherchait le mot
      // « placeholder » dans l'URL du tunnel, et ce marqueur était mangé par le découpage des
      // commentaires du .env (tout ce qui suit un « # »), donc la fenêtre ne s'affichait jamais.
      PUBLIC_SUBSCRIBE_OPEN: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
        default: '',
      }),
      // « true » sur une prévisualisation : robots.txt en Disallow et meta robots noindex partout.
      PUBLIC_NOINDEX: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
        default: '',
      }),
      // Conteneur Google Tag Manager. Vide = aucun tag chargé.
      PUBLIC_GTM_ID: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
        default: '',
      }),
    },
  },
});
