import { test, expect } from '@playwright/test';

/**
 * Poids embarqué par page. Le moteur d'animation GSAP (motion/engine.ts, ≈ 45 Ko gzip avec
 * ScrollTrigger) n'a de raison d'être que sur les pages qui déclarent des effets qui en dépendent
 * (rideaux, parallaxe, scrub, tracé, texte mot à mot). La navigation n'en fait pas partie, le CTA
 * compact est géré par le script inline de SiteNav. Les sous-pages ne déclarent que des révélations
 * `data-animate`, rendues par le moteur léger (motion/lite.ts). Ce test empêche un attribut ajouté
 * par inadvertance de ramener GSAP partout.
 * /strategie n'y figure pas : elle déclare des effets qui exigent GSAP, texte mot à mot et rideau
 * du bloc Risques (04-Strategy.astro).
 */
const SOUS_PAGES = [
  '/frais/',
  '/simulateur/',
  '/a-propos/',
  '/documentation/',
  '/presse/',
  '/faq/',
];

test.describe('Performance', () => {
  for (const route of SOUS_PAGES) {
    test(`aucun chargement de GSAP sur ${route}`, async ({ page }) => {
      const scripts: string[] = [];
      page.on('request', (req) => {
        if (/\.m?js(\?|$)/.test(req.url())) scripts.push(req.url().split('/').pop() ?? '');
      });
      await page.goto(route);
      // Le moteur est chargé au premier temps d'inactivité (requestIdleCallback, 1 s au plus).
      await page.waitForTimeout(2000);
      expect(
        scripts.filter((f) => /^engine\./.test(f)),
        `GSAP chargé sur ${route} : ${scripts.join(', ')}`
      ).toEqual([]);
      expect(
        scripts.filter((f) => /^lite\./.test(f)).length,
        `moteur léger absent sur ${route}`
      ).toBeGreaterThan(0);
    });
  }

  /* L'ACCUEIL NE CHARGE PAS LA FEUILLE DE /strategie. Un `import.meta.glob` qui prenait toutes les
     sections, et Astro rattache à une page la CSS de tout module importé : 20 Ko de feuille
     bloquante dont aucun sélecteur n'existe sur l'accueil. */
  test('l’accueil ne charge pas la feuille de style de /strategie', async ({ page }) => {
    await page.goto('/');
    const feuilles = await page
      .locator('link[rel="stylesheet"]')
      .evaluateAll((liens) => liens.map((l) => l.getAttribute('href') ?? ''));
    expect(feuilles.filter((f) => /04-Strategy/.test(f))).toEqual([]);
  });

  test('l’accueil charge bien le moteur GSAP', async ({ page }) => {
    const scripts: string[] = [];
    page.on('request', (req) => {
      if (/\.m?js(\?|$)/.test(req.url())) scripts.push(req.url().split('/').pop() ?? '');
    });
    await page.goto('/');
    await page.waitForTimeout(2000);
    expect(
      scripts.filter((f) => /^engine\./.test(f)).length,
      'moteur GSAP absent de l’accueil'
    ).toBeGreaterThan(0);
  });
});
