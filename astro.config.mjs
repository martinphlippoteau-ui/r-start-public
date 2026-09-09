// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

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
  trailingSlash: 'ignore',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Pas de scripts/assets inlinés : nécessaire pour tenir la CSP sans 'unsafe-inline' côté script.
      assetsInlineLimit: 0,
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/cookies') && !page.includes('/sections-preview'),
      changefreq: 'weekly',
      priority: 0.8,
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
