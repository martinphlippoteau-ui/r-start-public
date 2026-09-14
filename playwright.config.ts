import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: 0,
  reporter: [['list']],
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
