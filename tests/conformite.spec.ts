import { test, expect } from '@playwright/test';

/** Règles AMF vérifiées dans le DOM rendu (complète scripts/check-compliance.mjs). */
test.describe('Conformité', () => {
  /**
   * Le hero a porté cinq blocs de texte avant ses boutons, qui tombaient sous le bandeau cookies au
   * premier chargement : le lecteur voyait le produit mais pas comment y souscrire. Ce test empêche
   * le hero de regrossir.
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

  /**
   * Retour AMF sur la brochure : un frais ne peut pas être affiché dans une police plus petite que les
   * autres frais présentés à côté de lui. Chaque groupe de frais porte le même `data-fee-block` ; toutes
   * les valeurs qu'il contient doivent partager la même taille de police rendue, sur les deux pages qui
   * exposent des frais.
   */
  /**
   * `requis` : la page DOIT exposer des valeurs de frais. L'accueil n'en expose pas (la section
   * Frais vit sur /frais) ; la règle de taille y reste vérifiée si des valeurs réapparaissent un
   * jour.
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

  /* LE COMPTE EST VÉRIFIÉ SUR /documentation, PAS SUR L'ACCUEIL : l'accueil n'offre aucun PDF, à la
     demande de l'équipe (« dans tous les cas ne rends rien dispo là »), la colonne Documents
     annonce les cinq documents en « bientôt disponible ».
     CE QUI EST GARANTI : les documents réglementaires restent servis quelque part sur le site, et
     aucun lien PDF du site ne pointe dans le vide, ceux de l'accueil compris.
     Seuil de 2 tant que deux des quatre documents sont retenus dans src/content/fr/documentation.ts
     (PENDING_DOCUMENT_KEYS) : les statuts, dont le PDF fourni est tronqué, et le DIC hébergé, qui
     classe R Start en 3 sur 7 quand le site affiche 4 sur 7. Remonter ce seuil à chaque document
     republié : 3 à la réception du DIC en vigueur, 4 avec les statuts complets. */
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
