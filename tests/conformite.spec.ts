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
    expect(box!.y + box!.height, 'ligne risques sous la ligne de flottaison').toBeLessThanOrEqual(
      height
    );
    // Référence : le paragraphe des frais réels (`data-hero-subtitle`, text-lead), corps de texte du hero
    // qui porte l'avantage (absence de frais d'entrée) dont la ligne risques est le contre-poids. L'ancienne
    // référence (`preceding::p[1]`) tombait sur le paragraphe des deux phrases de la trame, en 12 px : le
    // test ne pouvait plus échouer. Repli si le repère disparaît : le premier <p> en text-lead du hero.
    // Hero minimal (10/09/2026) : plus aucun corps de texte hors la ligne risques ; la référence devient
    // alors le libellé des CTA, seul autre texte courant du hero.
    const subtitle = page.locator('#apercu [data-hero-subtitle]');
    const reference =
      (await subtitle.count()) > 0
        ? subtitle.first()
        : page.locator('#apercu [data-hero-cta] a').first();
    await expect(reference, 'aucun corps de texte de référence dans le hero').toBeVisible();
    const subtitleSize = await reference.evaluate((el) =>
      parseFloat(getComputedStyle(el).fontSize)
    );
    const riskSize = await risk.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(riskSize, 'ligne risques plus petite que le sous-titre').toBeGreaterThanOrEqual(
      subtitleSize * 0.85
    );
  });

  test('le bandeau cookies ne recouvre pas la ligne risques du hero', async ({ page }) => {
    await page.goto('/');
    // Le bandeau n'est déplié que par le script de consentement, au premier chargement.
    await expect(page.locator('#consent-banner')).toBeVisible();
    const geo = await page.evaluate(() => {
      const risk = document.querySelector('#apercu [data-risk]')!.getBoundingClientRect();
      const banner = document.getElementById('consent-banner')!.getBoundingClientRect();
      return { basRisque: risk.bottom, hautBandeau: banner.top };
    });
    expect(
      geo.hautBandeau - geo.basRisque,
      `ligne risques recouverte par le bandeau cookies (bas ${Math.round(geo.basRisque)} px, bandeau à ${Math.round(geo.hautBandeau)} px)`
    ).toBeGreaterThanOrEqual(16);
  });

  /**
   * Audit UX : le hero portait cinq blocs de texte avant ses boutons, qui tombaient sous le bandeau
   * cookies au premier chargement — le lecteur voyait le produit mais pas comment y souscrire. Les deux
   * phrases pédagogiques sont descendues dans « Ce qui change vraiment » ; ce test empêche le hero de
   * regrossir. Il ne dit rien de la ligne risques, vérifiée par les deux tests précédents.
   */
  test('les CTA du hero sont visibles sans scroller', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('#apercu [data-hero-cta]');
    await expect(cta).toBeVisible();
    const geo = await page.evaluate(() => {
      const box = document.querySelector('#apercu [data-hero-cta]')!.getBoundingClientRect();
      const banner = document.getElementById('consent-banner')?.getBoundingClientRect();
      return {
        basCta: box.bottom,
        hautCta: box.top,
        hauteurEcran: window.innerHeight,
        hautBandeau: banner && banner.height ? banner.top : null,
      };
    });
    expect(geo.basCta, 'CTA du hero sous la ligne de flottaison').toBeLessThanOrEqual(
      geo.hauteurEcran
    );
    if (geo.hautBandeau !== null) {
      expect(
        geo.hautBandeau - geo.basCta,
        `CTA du hero recouverts par le bandeau cookies (bas ${Math.round(geo.basCta)} px, bandeau à ${Math.round(geo.hautBandeau)} px)`
      ).toBeGreaterThanOrEqual(0);
    }
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
      expect(p.risk, `risque trop court pour : ${p.text}`).toBeGreaterThanOrEqual(
        p.advantage * 0.6
      );
      expect(p.riskSize, `risque plus petit que l'avantage : ${p.text}`).toBeGreaterThanOrEqual(
        p.advSize * 0.95
      );
    }
  });

  test('aucun risque n’est masqué ou animé', async ({ page }) => {
    await page.goto('/');
    const hidden = await page.locator('[data-risk]').evaluateAll(
      (nodes) =>
        nodes.filter((n) => {
          const cs = getComputedStyle(n);
          const animatedAncestor = n.closest(
            '[data-animate],[data-scrub],[data-reveal-text],[data-intro]'
          );
          return (
            !!animatedAncestor ||
            cs.visibility === 'hidden' ||
            parseFloat(cs.opacity) < 0.99 ||
            cs.display === 'none'
          );
        }).length
    );
    expect(hidden).toBe(0);
  });

  /**
   * Retour AMF sur la brochure : un frais ne peut pas être affiché dans une police plus petite que les
   * autres frais présentés à côté de lui. Chaque groupe de frais porte le même `data-fee-block` ; toutes
   * les valeurs qu'il contient doivent partager la même taille de police rendue, sur les deux pages qui
   * exposent des frais et dans la bascule pédagogique.
   */
  for (const path of ['/', '/frais/']) {
    test(`taille de police identique pour toutes les valeurs de frais (${path})`, async ({
      page,
    }) => {
      await page.goto(path);
      const blocks = await page.locator('[data-fee-value]').evaluateAll((nodes) => {
        const groups: Record<string, { size: number; text: string }[]> = {};
        for (const node of nodes) {
          const key = node.getAttribute('data-fee-block') ?? 'sans-groupe';
          (groups[key] ??= []).push({
            size: parseFloat(getComputedStyle(node).fontSize),
            text: (node.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40),
          });
        }
        return groups;
      });

      expect(
        Object.keys(blocks).length,
        `aucune valeur de frais repérée sur ${path}`
      ).toBeGreaterThan(0);
      for (const [key, values] of Object.entries(blocks)) {
        expect(values.length, `un seul frais dans le groupe ${key}`).toBeGreaterThan(1);
        const sizes = [...new Set(values.map((v) => v.size))];
        expect(
          sizes.length,
          `tailles différentes dans « ${key} » : ${values.map((v) => `${v.text} = ${v.size}px`).join(' | ')}`
        ).toBe(1);
      }
    });
  }

  test('la bascule des frais affiche les deux modèles dans la même taille', async ({ page }) => {
    await page.goto('/frais/');
    const tabs = page.locator('[data-fee-tab]');
    const count = await tabs.count();
    test.skip(count < 2, 'comparatif masqué (SHOW_MARKET_COMPARISON à false)');
    const sizes: number[] = [];
    for (let i = 0; i < count; i += 1) {
      await tabs.nth(i).click();
      const visible = await page
        .locator('[data-fee-panel]:not([hidden]) [data-fee-value]')
        .evaluateAll((nodes) => nodes.map((n) => parseFloat(getComputedStyle(n).fontSize)));
      expect(visible.length, 'panneau de comparatif sans valeur de frais').toBeGreaterThan(0);
      sizes.push(...visible);
    }
    expect([...new Set(sizes)].length, `tailles relevées : ${sizes.join(', ')}`).toBe(1);
  });

  test('les documents réglementaires répondent', async ({ page, request }) => {
    await page.goto('/');
    const hrefs = await page
      .locator('a[href$=".pdf"]')
      .evaluateAll((a) => [
        ...new Set(a.map((x) => (x as HTMLAnchorElement).getAttribute('href') || '')),
      ]);
    // 2 tant que deux des quatre documents sont retenus dans src/content/fr/documentation.ts
    // (PENDING_DOCUMENT_KEYS) : les statuts, dont le PDF fourni est tronqué, et le DIC hébergé, qui
    // classe R Start en 3 sur 7 quand le site affiche 4 sur 7. Remonter ce seuil à chaque document
    // republié : 3 à la réception du DIC en vigueur, 4 avec les statuts complets.
    expect(hrefs.length).toBeGreaterThanOrEqual(2);
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
