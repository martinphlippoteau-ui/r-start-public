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
   * Aucune reprise, nulle part. Elle avait été autorisée en intégration continue pour qu'un hoquet de
   * runner ne bloque pas une mise en ligne ; l'étape n'étant plus bloquante, elle ne sert plus à rien
   * et double le temps dès qu'un échec est systématique, ce qui était le cas. À reconsidérer le jour
   * où l'étape redeviendra bloquante.
   */
  retries: 0,
  /*
   * `list` pour lire la console, `html` pour le rapport que l'intégration continue téléverse.
   * Sans le second, l'étape « Rapport des tests » du workflow archivait un dossier qu'aucun rapporteur
   * n'écrivait : l'artefact était vide à chaque exécution, et l'étape rassurait sans rien livrer
   * (audit du 14/09/2026). `open: 'never'` : en local, on ne veut pas qu'un navigateur s'ouvre seul.
   */
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'retain-on-failure',
    locale: 'fr-FR',
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
