import { test, expect } from '@playwright/test';

/** Règles AMF vérifiées dans le DOM rendu (complète scripts/check-compliance.mjs). */
test.describe('Conformité', () => {
  test('la ligne risques du hero est visible sans scroller', async ({ page }) => {
    await page.goto('/');
    /*
     * EN SOMMEIL depuis le 14/09/2026 : « supprime tous les bon à savoir du site. Le service conformité
     * va les placer manuellement plus tard. » RiskNote.astro ne rend plus rien, il n'y a plus de
     * [data-risk] dans le DOM. Le test est CONSERVÉ ENTIER, pas supprimé : il se réarme tout seul le
     * jour où la Conformité replace les mentions, et il vérifiera exactement ce qu'il vérifiait avant.
     */
    test.skip(
      (await page.locator('[data-risk]').count()) === 0,
      'aucun [data-risk] rendu : voir src/components/ui/RiskNote.astro'
    );
    const risk = page.locator('#apercu [data-risk]').first();
    await expect(risk).toBeVisible();
    const box = await risk.boundingBox();
    expect(box).not.toBeNull();
    const height = page.viewportSize()?.height ?? 800;
    expect(box!.y + box!.height, 'ligne risques sous la ligne de flottaison').toBeLessThanOrEqual(
      height
    );
    // Référence : le libellé des CTA, seul texte courant du hero depuis le hero minimal du 10/09/2026
    // (plus aucun corps de texte hors la ligne risques). L'ancienne référence, le paragraphe des frais
    // réels (`data-hero-subtitle`), a disparu avec lui.
    const reference = page.locator('#apercu [data-hero-cta] a').first();
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
    /*
     * EN SOMMEIL depuis le 14/09/2026 : « supprime tous les bon à savoir du site. Le service conformité
     * va les placer manuellement plus tard. » RiskNote.astro ne rend plus rien, il n'y a plus de
     * [data-risk] dans le DOM. Le test est CONSERVÉ ENTIER, pas supprimé : il se réarme tout seul le
     * jour où la Conformité replace les mentions, et il vérifiera exactement ce qu'il vérifiait avant.
     */
    test.skip(
      (await page.locator('[data-risk]').count()) === 0,
      'aucun [data-risk] rendu : voir src/components/ui/RiskNote.astro'
    );
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
   * cookies au premier chargement, le lecteur voyait le produit mais pas comment y souscrire. Les deux
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
    /*
     * EN SOMMEIL depuis le 14/09/2026 : « supprime tous les bon à savoir du site. Le service conformité
     * va les placer manuellement plus tard. » RiskNote.astro ne rend plus rien, il n'y a plus de
     * [data-risk] dans le DOM. Le test est CONSERVÉ ENTIER, pas supprimé : il se réarme tout seul le
     * jour où la Conformité replace les mentions, et il vérifiera exactement ce qu'il vérifiait avant.
     */
    test.skip(
      (await page.locator('[data-risk]').count()) === 0,
      'aucun [data-risk] rendu : voir src/components/ui/RiskNote.astro'
    );
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

  /**
   * Un avertissement de risque ne doit jamais dépendre d'une action du visiteur pour apparaître : une
   * révélation AU SCROLL (`data-animate`, `data-scrub`, `data-reveal-text`) est donc interdite au-dessus
   * d'un [data-risk], on peut ne jamais atteindre le point qui la déclenche.
   * `data-intro` a été SORTI de cette liste le 11/09/2026 : c'est la cascade de chargement du hero, elle
   * se joue seule dès l'ouverture de la page, se termine en moins de trois secondes sans aucune action,
   * et son état final est toujours l'élément pleinement visible (`animation-fill-mode: backwards`, aucun
   * `forwards`). La ligne risques y entre entre les CTA et les avis, donc le risque précède la
   * réassurance. Le contrôle de l'état final ci-dessous (opacité, visibilité, affichage) reste entier :
   * il s'exécute après le chargement et échouerait si la cascade laissait quoi que ce soit masqué.
   */
  test('aucun risque n’est masqué ou animé', async ({ page }) => {
    await page.goto('/');
    /*
     * EN SOMMEIL depuis le 14/09/2026, comme les trois autres contrôles de risque de ce fichier : plus
     * aucun [data-risk] n'est rendu (RiskNote.astro). Sans ce saut, le test passait en parcourant une
     * liste VIDE : il annonçait « aucun risque masqué » alors qu'il n'y a plus de risque du tout, ce
     * qui est plus trompeur qu'un test absent. Il se réarme seul au retour des mentions.
     */
    test.skip(
      (await page.locator('[data-risk]').count()) === 0,
      'aucun [data-risk] rendu : voir src/components/ui/RiskNote.astro'
    );
    // L'assertion porte sur l'état APRÈS la cascade d'ouverture : on la laisse se terminer.
    await page.waitForTimeout(3000);
    const hidden = await page.locator('[data-risk]').evaluateAll(
      (nodes) =>
        nodes.filter((n) => {
          const cs = getComputedStyle(n);
          const animatedAncestor = n.closest('[data-animate],[data-scrub],[data-reveal-text]');
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
  /**
   * `requis` : la page DOIT exposer des valeurs de frais. L'accueil ne le fait plus depuis le 11/09/2026
   * (la section Frais vit sur /frais, atteinte par le CTA « Découvrir les frais ») ; la règle de taille y
   * reste vérifiée si des valeurs réapparaissent un jour, sans exiger qu'il y en ait.
   */
  for (const { path, requis } of [
    { path: '/', requis: false },
    { path: '/frais/', requis: true },
  ]) {
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

      if (requis) {
        expect(
          Object.keys(blocks).length,
          `aucune valeur de frais repérée sur ${path}`
        ).toBeGreaterThan(0);
      }
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

  /*
   * LE COMPTE EST VÉRIFIÉ SUR /documentation, PLUS SUR L'ACCUEIL, depuis le 16/09/2026.
   *
   * L'accueil n'offrait plus aucun PDF : la colonne Documents du pied de page annonce les cinq
   * documents réglementaires en « bientôt disponible » et le lien vers /documentation a été retiré de
   * la colonne R Start, à la demande de l'équipe (« dans tous les cas ne rends rien dispo là »).
   * Le test échouait donc pour une décision, pas pour un défaut.
   *
   * CE QU'IL GARANTIT TOUJOURS, et c'est l'essentiel : les documents réglementaires restent servis
   * quelque part sur le site, et aucun lien PDF du site ne pointe dans le vide. Le seuil de deux est
   * inchangé, il est seulement demandé à la page qui les sert. L'accueil, lui, n'est plus contraint
   * d'en porter, mais ses éventuels liens PDF sont toujours vérifiés.
   *
   * 2 tant que deux des quatre documents sont retenus dans src/content/fr/documentation.ts
   * (PENDING_DOCUMENT_KEYS) : les statuts, dont le PDF fourni est tronqué, et le DIC hébergé, qui
   * classe R Start en 3 sur 7 quand le site affiche 4 sur 7. Remonter ce seuil à chaque document
   * republié : 3 à la réception du DIC en vigueur, 4 avec les statuts complets.
   */
  test('les documents réglementaires répondent', async ({ page, request }) => {
    const liens = async (chemin: string): Promise<string[]> => {
      await page.goto(chemin);
      return page
        .locator('a[href$=".pdf"]')
        .evaluateAll((a) => [
          ...new Set(a.map((x) => (x as HTMLAnchorElement).getAttribute('href') || '')),
        ]);
    };

    const servis = await liens('/documentation/');
    expect(servis.length, 'documents servis par /documentation').toBeGreaterThanOrEqual(2);

    for (const href of [...new Set([...servis, ...(await liens('/'))])]) {
      if (!href.startsWith('/')) continue;
      const res = await request.get(href);
      expect(res.status(), href).toBe(200);
      expect(res.headers()['content-type'] || '').toContain('pdf');
    }
  });
});
