import { test, expect } from '@playwright/test';

/**
 * Poids embarqué par page. Le moteur d'animation GSAP (motion/engine.ts, ≈ 45 Ko gzip avec
 * ScrollTrigger) n'a de raison d'être que sur l'accueil, seule page à déclarer des effets qui en
 * dépendent (scènes épinglées, compteurs, tracés, texte mot à mot, vol de la marque, barre de
 * progression). Les sous-pages ne déclarent que des révélations `data-animate`, rendues par le moteur
 * léger (motion/lite.ts). Ce test empêche un attribut ajouté par inadvertance de ramener GSAP partout.
 */
const SOUS_PAGES = ['/frais/', '/documentation/', '/presse/', '/salle-de-presse/'];

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

  /**
   * Les notes légales sont repliées dans un <details> : suivre un appel de note doit rester immédiat.
   * On clique un appel, le bloc s'ouvre, la note visée est visible et porte le focus.
   */
  test('un appel de note ouvre le bloc des notes et y amène le focus', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-consent-refuse]').click();
    const details = page.locator('[data-legal-notes]');
    await expect(details).toHaveJSProperty('open', false);

    const ref = page.locator('a[href^="#notes-"]').first();
    const href = await ref.getAttribute('href');
    await ref.click();
    await expect(details).toHaveJSProperty('open', true);

    const note = page.locator(href!);
    await expect(note).toBeVisible();
    await expect(note).toBeFocused();
  });
});
