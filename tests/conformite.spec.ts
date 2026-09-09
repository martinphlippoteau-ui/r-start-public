import { test, expect } from '@playwright/test';

/** Règles AMF vérifiées dans le DOM rendu (complète scripts/check-compliance.mjs). */
test.describe('Conformité', () => {
  test('la ligne risques du hero est visible sans scroller', async ({ page }) => {
    await page.goto('/');
    const risk = page.locator('#apercu [data-risk]').first();
    await expect(risk).toBeVisible();
    const box = await risk.boundingBox();
    expect(box).not.toBeNull();
    const height = page.viewportSize()?.height ?? 800;
    expect(box!.y + box!.height, 'ligne risques sous la ligne de flottaison').toBeLessThanOrEqual(height);
    // Le sous-titre est le <p> qui précède immédiatement la ligne risques dans l'ordre du document
    // (indépendant de la présence d'un surtitre ou de l'accroche, et de l'enveloppe `data-scrub` qui
    // regroupe accroche + sous-titre : ce n'est donc pas forcément un frère direct).
    const subtitleSize = await risk
      .locator('xpath=preceding::p[1]')
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    const riskSize = await risk.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(riskSize, 'ligne risques plus petite que le sous-titre').toBeGreaterThanOrEqual(subtitleSize * 0.85);
  });

  test('chaque avantage a un risque de longueur comparable', async ({ page }) => {
    await page.goto('/');
    const pairs = await page.locator('[data-advantage]').evaluateAll((nodes) =>
      nodes.map((adv) => {
        const parent = adv.parentElement;
        const risk = parent?.querySelector('[data-risk]');
        const advSize = parseFloat(getComputedStyle(adv).fontSize);
        const riskSize = risk ? parseFloat(getComputedStyle(risk).fontSize) : 0;
        return {
          advantage: adv.textContent?.trim().length ?? 0,
          risk: risk?.textContent?.trim().length ?? 0,
          advSize,
          riskSize,
          text: adv.textContent?.trim().slice(0, 60),
        };
      })
    );
    for (const p of pairs) {
      expect(p.risk, `avantage sans risque : ${p.text}`).toBeGreaterThan(0);
      expect(p.risk, `risque trop court pour : ${p.text}`).toBeGreaterThanOrEqual(p.advantage * 0.6);
      expect(p.riskSize, `risque plus petit que l'avantage : ${p.text}`).toBeGreaterThanOrEqual(p.advSize * 0.95);
    }
  });

  test('aucun risque n’est masqué ou animé', async ({ page }) => {
    await page.goto('/');
    const hidden = await page.locator('[data-risk]').evaluateAll((nodes) =>
      nodes.filter((n) => {
        const cs = getComputedStyle(n);
        const animatedAncestor = n.closest('[data-animate],[data-scrub],[data-reveal-text],[data-intro]');
        return !!animatedAncestor || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.99 || cs.display === 'none';
      }).length
    );
    expect(hidden).toBe(0);
  });

  test('les documents réglementaires répondent', async ({ page, request }) => {
    await page.goto('/');
    const hrefs = await page.locator('a[href$=".pdf"]').evaluateAll((a) => [...new Set(a.map((x) => (x as HTMLAnchorElement).getAttribute('href') || ''))]);
    // 3 tant que les statuts (PDF tronqué) sont exclus dans src/content/fr/documents.ts ; repasser à 4 ensuite.
    expect(hrefs.length).toBeGreaterThanOrEqual(3);
    for (const href of hrefs) {
      if (!href.startsWith('/')) continue;
      const res = await request.get(href);
      expect(res.status(), href).toBe(200);
      expect(res.headers()['content-type'] || '').toContain('pdf');
    }
  });

  test('mentions obligatoires en pied de page', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toContainText('caractère commercial');
    await expect(footer).toContainText('26-06');
    await expect(footer).toContainText('dpo@corumbutler.com');
  });
});
