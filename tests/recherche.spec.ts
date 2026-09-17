import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * RECHERCHE DU SITE (17/09/2026) : la loupe de la barre, le panneau qui s'allonge sous elle, l'index
 * tiré du HTML au build (scripts/search-index.mjs) et l'arrivée sur le passage (src/scripts/recherche.ts,
 * src/scripts/faqAncre.ts).
 *
 * Ce que ces tests tiennent : il n'y a PAS de page de résultats, les résultats se rangent en « Pages »
 * puis « Questions », les fautes de frappe et les synonymes sont tolérés, un résultat mène au passage
 * exact, l'index n'est pas téléchargé par une visite qui ne cherche rien, et les recherches partent
 * dans le plan de taggage.
 */

const ouvrir = async (page: Page) => {
  await page.locator('[data-consent-refuse]').click();
  await page.locator('[data-recherche-ouvrir]').click();
  await expect(page.locator('[data-recherche-champ]')).toBeFocused();
};

/* Espaces normalisées : les libellés portent une espace fine insécable avant « ? » et « : ». */
const titres = async (page: Page, rubrique: 'pages' | 'questions') =>
  (
    await page
      .locator(`[data-recherche-resultats] a[data-rubrique="${rubrique}"] [data-titre]`)
      .allTextContents()
  ).map((t) => t.replace(/\s/g, ' '));

const evenements = (page: Page) =>
  page.evaluate(() =>
    ((window as unknown as { dataLayer?: Record<string, unknown>[] }).dataLayer ?? [])
      .filter((x) => x && typeof x.event === 'string')
      .map((x) => x as Record<string, unknown>)
  );

test.describe('Recherche du site', () => {
  test('la loupe ouvre le panneau sur les liens rapides, Échap le referme', async ({ page }) => {
    const index: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('recherche.json')) index.push(req.url());
    });
    await page.goto('/frais/');
    await page.waitForLoadState('load');
    expect(index, 'aucun index téléchargé sans intention de chercher').toEqual([]);

    const loupe = page.locator('[data-recherche-ouvrir]');
    await ouvrir(page);
    await expect(loupe).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[data-recherche-rapides] a')).toHaveCount(5);
    await expect(page.locator('[data-recherche-rapides] a').first()).toBeVisible();
    await expect.poll(() => index.length, 'index demandé à l’ouverture').toBeGreaterThan(0);

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-recherche-panneau]')).toBeHidden();
    await expect(loupe).toHaveAttribute('aria-expanded', 'false');
    await expect(loupe).toBeFocused();
  });

  test('les résultats se rangent en Pages puis Questions, fautes et synonymes compris', async ({
    page,
  }) => {
    await page.goto('/presse/');
    await ouvrir(page);
    const champ = page.locator('[data-recherche-champ]');

    await champ.fill('frais');
    await expect(page.locator('[data-recherche-resultats] [data-rubrique-titre]')).toHaveText([
      'Pages',
      'Questions',
    ]);
    expect((await titres(page, 'pages')).length).toBeGreaterThan(0);
    expect(await titres(page, 'questions')).toContain('Quels sont les frais de R Start ?');
    await expect(page.locator('[data-recherche-resultats] mark').first()).toBeVisible();

    /* Faute de frappe : une lettre en moins. */
    await champ.fill('jouisance');
    await expect
      .poll(() => titres(page, 'questions'))
      .toContainEqual(expect.stringContaining('délai de jouissance'));

    /* Synonyme : « impôts » n'est écrit nulle part, « imposés » l'est. */
    await champ.fill('impôts');
    await expect
      .poll(() => titres(page, 'questions'))
      .toContain('Comment sont imposés les revenus de R Start ?');
  });

  test('sans résultat, le panneau le dit et renvoie vers toutes les questions', async ({
    page,
  }) => {
    await page.goto('/a-propos/');
    await ouvrir(page);
    await page.locator('[data-recherche-champ]').fill('xylophone');
    const vide = page.locator('[data-recherche-vide]');
    await expect(vide).toBeVisible();
    await expect(vide).toContainText('« xylophone »');
    await expect(vide.locator('a')).toHaveAttribute('href', /\/faq$/);
  });

  test('Entrée mène à la question, ouverte sous la barre', async ({ page }) => {
    await page.goto('/presse/');
    await ouvrir(page);
    await page.locator('[data-recherche-champ]').fill('démembrement');
    await expect(page.locator('[data-recherche-resultats] a').first()).toBeVisible();

    await Promise.all([page.waitForURL(/\/faq\/?#question-/), page.keyboard.press('Enter')]);
    expect(new URL(page.url()).search, 'aucune page de résultats').toBe('');

    const question = page.locator('details[data-faq]:target');
    await expect(question).toHaveAttribute('open', '');
    await expect
      .poll(() => question.evaluate((d) => Math.round(d.getBoundingClientRect().top)))
      .toBeLessThan(160);
    await expect(page.locator('[data-recherche-panneau]')).toBeHidden();
  });

  test('un résultat cliqué part dans le plan de taggage', async ({ page }) => {
    await page.goto('/faq/');
    await ouvrir(page);
    await page.locator('[data-recherche-champ]').fill('change');
    const lien = page.locator('[data-recherche-resultats] a[data-rubrique="questions"]').first();
    await expect(lien).toBeVisible();
    await lien.click();

    await expect
      .poll(async () => (await evenements(page)).map((x) => x.event))
      .toEqual(expect.arrayContaining(['recherche', 'recherche_clic']));
    const clic = (await evenements(page)).find((x) => x.event === 'recherche_clic');
    expect(clic?.terme).toBe('change');
    expect(clic?.rubrique).toBe('questions');
    expect(clic?.rang).toBe(1);
  });

  test('le panneau ouvert ne présente aucune violation d’accessibilité sérieuse', async ({
    page,
  }) => {
    await page.goto('/strategie/');
    await ouvrir(page);
    await page.locator('[data-recherche-champ]').fill('risque');
    await expect(page.locator('[data-recherche-resultats] a').first()).toBeVisible();
    /* Le découpage du panneau doit avoir fini de descendre : axe mesure les contrastes à l'écran. */
    await page.waitForTimeout(500);
    const results = await new AxeBuilder({ page })
      .include('[data-recherche-panneau]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });

  test('la loupe tient dans la barre, jusqu’à 360 px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/frais/');
    const barre = await page.locator('[data-sitenav-bar]').evaluate((b) => {
      const r = b.getBoundingClientRect();
      const enfants = [...b.children].filter((c) => getComputedStyle(c).display !== 'none');
      return {
        deborde: b.scrollWidth - b.clientWidth,
        sortis: enfants.filter((c) => c.getBoundingClientRect().right > r.right + 0.5).length,
      };
    });
    expect(barre).toEqual({ deborde: 0, sortis: 0 });
    await expect(page.locator('[data-recherche-ouvrir]')).toBeVisible();
  });
});
