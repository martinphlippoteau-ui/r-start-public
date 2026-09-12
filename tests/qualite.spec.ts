import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Toutes les pages publiées : un débordement horizontal se vérifie partout, pas au seul accueil. */
const PAGES = [
  '/',
  '/frais/',
  '/outils/',
  '/strategie/',
  '/a-propos/',
  '/documentation/',
  '/presse/',
  '/salle-de-presse/',
];

test.describe('Qualité', () => {
  test('structure de page et SEO', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('h1')).toHaveCount(1);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(20);
    expect(title.length).toBeLessThanOrEqual(70);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.length).toBeGreaterThan(0);
    for (const block of ld) expect(() => JSON.parse(block)).not.toThrow();
  });

  test('les CTA pointent vers le tunnel et alimentent le dataLayer', async ({ page }) => {
    await page.goto('/');
    const ctas = page.locator('[data-cta="souscrire"]');
    expect(await ctas.count()).toBeGreaterThanOrEqual(3);
    const hrefs = await ctas.evaluateAll((a) => a.map((x) => (x as HTMLAnchorElement).href));
    for (const h of hrefs) expect(h).toMatch(/^https?:\/\//);
    await page.evaluate(() => document.addEventListener('click', (e) => e.preventDefault(), true));
    // Le premier CTA du DOM est celui de la barre. Il est INERTE tant que la page n'a pas défilé : sur une
    // page à en-tête sombre, la barre n'a ni matière ni contenu visible au premier écran (global.css,
    // `--nav-glass-on`), donc opacité 0 et `pointer-events: none`. Playwright considère un élément
    // d'opacité 0 comme visible : on cherche donc le premier CTA réellement ACTIONNABLE.
    const index = await ctas.evaluateAll((els) =>
      els.findIndex((node) => {
        const el = node as HTMLElement & {
          checkVisibility?: (options?: Record<string, boolean>) => boolean;
        };
        const shown =
          typeof el.checkVisibility === 'function'
            ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
            : el.offsetParent !== null;
        return shown && getComputedStyle(el).pointerEvents !== 'none';
      })
    );
    expect(index, 'aucun CTA actionnable au premier écran').toBeGreaterThanOrEqual(0);
    await ctas.nth(index).click();
    const events = await page.evaluate(() =>
      (window as unknown as { dataLayer: Record<string, unknown>[] }).dataLayer.filter(
        (e) => e && e.event === 'cta_souscrire_click'
      )
    );
    expect(events.length).toBe(1);
    expect(events[0].cta_position).toBeTruthy();
  });

  test('aucun appel Google avant consentement, cookie posé après refus', async ({
    page,
    context,
  }) => {
    const google: string[] = [];
    page.on('request', (req) => {
      if (/google|gstatic|doubleclick/i.test(req.url())) google.push(req.url());
    });
    await page.goto('/');
    await expect(page.locator('#consent-banner')).toBeVisible();
    expect(google, 'requêtes Google avant consentement').toEqual([]);
    await page.locator('[data-consent-refuse]').click();
    await expect(page.locator('#consent-banner')).toBeHidden();
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'rstart_consent')?.value).toBe('denied');
    expect(google).toEqual([]);
  });

  test('accessibilité (axe) sans violation sérieuse', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-consent-refuse]').click();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });

  /*
   * Toutes les pages, pas seulement l'accueil. Le 12/09/2026, /frais débordait de 154 px sur téléphone :
   * le comparateur était un tableau à largeur minimale posé dans une enveloppe à défilement, et la
   * colonne de la SCPI comparée, sa liste déroulante comprise, tombait hors de l'écran. Le test ne
   * visitait que l'accueil, il n'a rien vu.
   */
  for (const route of PAGES) {
    test(`pas de débordement horizontal (${route})`, async ({ page }) => {
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  /*
   * Le comparateur ne compare que si ses DEUX colonnes sont à l'écran. Sur téléphone il se lit en cartes
   * (global.css, sous 48 rem) et la liste déroulante reste dans l'en-tête collant : c'est le seul moyen
   * de changer de SCPI, elle doit rester atteignable et entièrement visible.
   */
  test('le comparateur de frais tient dans la largeur de l’écran', async ({ page }) => {
    await page.goto('/frais/');
    const select = page.locator('[data-comparator-select]');
    await expect(select).toBeVisible();
    const debord = await page.evaluate(() => {
      const largeur = document.documentElement.clientWidth;
      const cases = [
        document.querySelector('[data-comparator-select]'),
        document.querySelector('[data-comparator] thead img'),
        ...document.querySelectorAll('[data-comparator] tbody [data-fee-value]'),
        ...document.querySelectorAll('[data-comparator-cell]'),
      ].filter(Boolean) as Element[];
      return cases
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.right > largeur + 1 || r.left < -1).length;
    });
    expect(debord).toBe(0);
  });

  test('captures d’écran de la page', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.locator('[data-consent-refuse]').click();
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(800);
    await page.screenshot({
      path: `tests/screenshots/${testInfo.project.name}-full.png`,
      fullPage: true,
    });
  });
});
