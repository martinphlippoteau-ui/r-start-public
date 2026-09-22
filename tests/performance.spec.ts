import { test, expect } from '@playwright/test';

/**
 * Poids embarqué par page. Le moteur d'animation GSAP (motion/engine.ts, ≈ 45 Ko gzip avec
 * ScrollTrigger) n'a de raison d'être que sur les pages qui déclarent des effets qui en dépendent
 * (rideaux, parallaxe, scrub, tracé, texte mot à mot). La navigation n'en fait pas partie : plus de
 * vol de la marque ni de barre de progression depuis le 10/09/2026, le CTA compact est géré par le
 * script inline de SiteNav. Les sous-pages ne déclarent que des révélations `data-animate`, rendues par
 * le moteur léger (motion/lite.ts). Ce test empêche un attribut ajouté par inadvertance de ramener GSAP
 * partout.
 */
/**
 * /strategie n'y figure pas : elle déclare des effets qui exigent GSAP, texte mot à mot et rideau
 * du bloc Risques ; ni tracé ni parallaxe, relevé sur dist du 19/09/2026 (04-Strategy.astro). La
 * scène épinglée du mot d'ordre, elle, est partie avec son texte le 14/09/2026.
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

  /*
   * L'ACCUEIL NE CHARGE PAS LA FEUILLE DE /strategie (audit du 18/09/2026). Son `import.meta.glob`
   * prenait toutes les sections, et Astro rattache à une page la CSS de tout module importé : 20 Ko de
   * feuille bloquante, dont aucun sélecteur n'existe sur l'accueil.
   */
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

  /**
   * Les notes légales sont repliées dans un <details> : suivre un appel de note doit rester immédiat.
   * On clique un appel, le bloc s'ouvre, la note visée est visible et porte le focus.
   */
  /*
   * EN SOMMEIL : plus aucune page ne rend d'appel de note depuis le 14/09/2026 (voir le test.skip
   * ci-dessous et src/components/ui/NoteRef.astro). /documentation reste la cible parce qu'elle en
   * comptait vingt-huit, le plus du site : c'est là que le mécanisme se réarmera en premier.
   */
  test('un appel de note ouvre le bloc des notes et y amène le focus', async ({ page }) => {
    await page.goto('/documentation/');
    await page.locator('[data-consent-refuse]').click();
    /*
     * EN SOMMEIL depuis le 14/09/2026 : « enlève les notes et les sources de tout le site sauf du
     * tableau de la page frais ». LegalNotes et les cinq composants d'appel de note ne rendent plus
     * rien, il n'y a donc plus ni bloc ni exposant à ouvrir. Le test est CONSERVÉ ENTIER : il se réarme
     * tout seul le jour où un appel de note reparaît, et vérifiera exactement ce qu'il vérifiait avant.
     */
    test.skip(
      (await page.locator('a[href^="#notes-"]').count()) === 0,
      'aucun appel de note rendu : voir src/components/ui/NoteRef.astro'
    );
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
