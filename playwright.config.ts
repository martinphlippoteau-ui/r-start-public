import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  /*
   * Le délai de garde est DOUBLÉ en intégration continue. Le runner tourne environ cinq fois moins
   * vite que la machine de développement : le seul build y passe de dix à cinquante-sept secondes.
   * La suite, qui tient en une minute en local, y demande plusieurs minutes, et les tests qui
   * attendent la stabilisation d'un défilement épinglé dépassaient soixante secondes.
   */
  timeout: process.env.CI ? 120_000 : 60_000,
  /*
   * Deux exécutants en intégration continue : Playwright n'en prend qu'un par défaut sur un runner,
   * alors qu'ubuntu-latest en offre quatre. Deux suffisent à diviser le temps d'attente par deux sans
   * affamer le processeur, ce qui rallongerait les mêmes tests d'attente.
   */
  workers: process.env.CI ? 2 : undefined,
  /*
   * Une reprise en intégration continue, aucune en local. Le but n'est pas de masquer une
   * intermittence, qui doit rester visible là où on développe, mais d'éviter qu'un hoquet de runner
   * bloque une mise en ligne. Une reprise qui devient habituelle est un test à réparer, pas à tolérer.
   */
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'retain-on-failure',
    locale: 'fr-FR',
    /*
     * `--disable-dev-shm-usage` : sur un runner GitHub, /dev/shm est minuscule et Chromium y place ses
     * tampons de rendu. Mesure de prudence, pas un correctif ciblé : la première exécution en CI du
     * 14/09/2026 a vu quatre-vingt-treize tests tomber sur les trois profils, et le temps d'attente
     * du runner est l'explication qui tient, pas la mémoire partagée. Le drapeau reste parce qu'il
     * écarte une cause classique d'instabilité en conteneur, sans effet sur une machine de
     * développement, où /dev/shm est généreux.
     */
    launchOptions: { args: ['--disable-dev-shm-usage'] },
  },
  /*
   * `pnpm preview` SE DÉTACHE : `astro preview` rend la main aussitôt et laisse un serveur
   * indépendant derrière lui. Playwright, qui surveille le processus lancé, le voyait sortir et
   * abandonnait avec « exited early » : les tests ne pouvaient donc pas tourner en intégration
   * continue. `scripts/serve-dist.mjs` reste au premier plan et sert exactement ce que sert
   * GitHub Pages. `reuseExistingServer` garde l'habitude locale : un serveur déjà ouvert sur le
   * port est réutilisé, il n'y en a jamais deux.
   */
  webServer: {
    command: 'pnpm serve',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    // WebKit binaire indisponible (téléchargement impossible dans cet environnement) :
    // repli sur Chromium + émulation Pixel 5 pour le projet mobile, et Chromium forcé (browserName)
    // pour l'émulation iPhone 13 (390 × 664 utiles : le viewport le plus court des tests de géométrie
    // du hero), dont le descripteur Playwright vise WebKit par défaut.
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-iphone13', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
