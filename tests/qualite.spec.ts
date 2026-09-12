import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Toutes les pages publiées : un débordement horizontal se vérifie partout, pas au seul accueil. */
const PAGES = [
  '/',
  '/frais/',
  '/outils/',
  '/outil/simulateur-de-frais/',
  '/outil/date-de-jouissance/',
  '/outil/cout-de-sortie/',
  '/outil/versements-programmes/',
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
   * La barre de navigation est IDENTIQUE sur toutes les pages (12/09/2026, demande de l'équipe). Elle
   * portait jusque-là un voile propre à l'accueil, transparent au premier écran. Le test relève une
   * empreinte par page, avant tout défilement, et exige qu'elles se réduisent à UNE SEULE : hauteur,
   * verre, flou, et présence de chacun des quatre repères.
   */
  test('la barre de navigation est identique sur toutes les pages', async ({ page }) => {
    const empreintes = new Map<string, string>();

    for (const route of PAGES) {
      await page.goto(route);
      /* Après la séquence d'ouverture de l'accueil : c'est l'état stable qui doit coïncider. */
      await page.waitForTimeout(2200);
      empreintes.set(
        route,
        await page.evaluate(() => {
          const nav = document.querySelector('[data-sitenav]')!;
          const pastille = nav.querySelector('.nav-glass')!;
          const cs = getComputedStyle(pastille);
          const vu = (sel: string) => {
            const el = nav.querySelector(sel);
            if (!el) return 'absent';
            const r = el.getBoundingClientRect();
            return r.width > 0 && getComputedStyle(el).opacity !== '0' ? 'visible' : 'masqué';
          };
          return [
            Math.round(nav.getBoundingClientRect().height),
            Math.round(pastille.getBoundingClientRect().height),
            cs.backgroundColor,
            cs.backdropFilter,
            vu('[data-nav-brand]'),
            vu('[data-sitenav-list]'),
            vu('.subnav-cta'),
            vu('[data-menu-open]'),
          ].join(' | ');
        })
      );
    }

    const distinctes = new Set(empreintes.values());
    expect([...distinctes], JSON.stringify([...empreintes], null, 1)).toHaveLength(1);
  });

  /*
   * La pastille d'appel et l'invitation à défiler du hero se relaient : jamais visibles ensemble, jamais
   * absentes ensemble une fois le hero passé. Le test descend la page et vérifie la complémentarité à
   * chaque palier. Sur grand écran le hero est ÉPINGLÉ, la boîte de l'invitation ne quitte donc jamais
   * l'écran et c'est son opacité qui tombe : les deux mesures comptent, et une seule des deux laisserait
   * passer un décalage de mille pixels.
   */
  test('la pastille d’appel prend le relais de l’invitation à défiler', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-consent-refuse]').click();
    /* Après la séquence d'ouverture : avant, l'invitation n'est pas encore entrée. */
    await page.waitForTimeout(2400);

    const releve = async () =>
      page.evaluate(() => {
        const pastille = document.querySelector('[data-sticky-cta]')!;
        const invitation = document.querySelector('[data-hero-scroll-hint]')!;
        const enveloppe = invitation.closest('[data-scrub]') ?? invitation;
        const r = invitation.getBoundingClientRect();
        return {
          invitation:
            r.bottom > 0 &&
            r.top < window.innerHeight &&
            parseFloat(getComputedStyle(enveloppe).opacity) > 0.05,
          pastille: pastille.hasAttribute('data-on'),
        };
      });

    for (const y of [0, 400, 1000, 3000]) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(350);
      const { invitation, pastille } = await releve();
      expect(pastille, `à ${y} px, invitation visible = ${invitation}`).toBe(!invitation);
    }

    /* Remontée : l'invitation revient, la pastille se replie. */
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    expect(await releve()).toEqual({ invitation: true, pastille: false });
  });

  /*
   * Navigation d'une page à l'autre : la barre ne doit pas bouger d'un pixel, et l'indicateur doit se
   * poser sur le nouveau lien actif. C'est ce que garantissent les `view-transition-name` posés sur la
   * barre et sur l'indicateur (global.css) ; un nom effacé casserait la continuité en silence.
   */
  test('la barre ne bouge pas d’une page à l’autre et l’indicateur suit', async ({ page }) => {
    const boite = () =>
      page.evaluate(() => {
        const r = document.querySelector('[data-sitenav-bar]')!.getBoundingClientRect();
        return [r.x, r.y, r.width, r.height].map(Math.round).join(',');
      });

    await page.goto('/frais/');
    const noms = await page.evaluate(() => ({
      barre: getComputedStyle(document.querySelector('[data-sitenav-bar]')!).viewTransitionName,
      indicateur: getComputedStyle(document.querySelector('[data-subnav-pill]')!)
        .viewTransitionName,
    }));
    expect(noms.barre).toBe('barre-nav');
    expect(noms.indicateur).toBe('pastille-nav');

    const avant = await boite();
    await page.goto('/a-propos/');
    expect(await boite()).toBe(avant);

    /* L'indicateur n'existe qu'à partir de « lg », là où la liste est affichée. */
    const aLaListe = await page.locator('[data-sitenav-list]').isVisible();
    if (aLaListe) {
      const aligne = await page.evaluate(() => {
        const pastille = document.querySelector('[data-subnav-pill]')!.getBoundingClientRect();
        const actif = document.querySelector('[data-sitenav-list] a[aria-current="page"]')!;
        return {
          texte: actif.textContent?.trim(),
          ecart: Math.abs(pastille.x - actif.getBoundingClientRect().x),
        };
      });
      expect(aligne.texte).toBe('À propos');
      expect(aligne.ecart).toBeLessThan(4);
    }
  });

  /*
   * Niveaux d'expertise des outils. La bascule est en CSS pure (global.css) : aucun typage ne la
   * protège, et un sélecteur déplacé la casserait en silence. Le test vérifie les trois paliers, et
   * surtout que le RÉSULTAT ne dépend pas du niveau : un champ masqué garde sa valeur, le calcul est
   * le même. C'est la promesse faite au visiteur sous le sélecteur.
   */
  test('les niveaux d’expertise révèlent les champs sans changer le calcul', async ({ page }) => {
    await page.goto('/outil/simulateur-de-frais/');
    const champs = () => page.locator('[data-tool="frais"] input:visible').count();

    expect(await champs()).toBe(2);
    const totalDebutant = await page.locator('#frais-out-rstart').textContent();

    await page.click('label[for="frais-niveau-intermediaire"]');
    expect(await champs()).toBe(4);

    await page.click('label[for="frais-niveau-expert"]');
    expect(await champs()).toBe(6);
    await expect(page.locator('#frais-out-detail-gestion')).toBeVisible();
    expect(await page.locator('#frais-out-rstart').textContent()).toBe(totalDebutant);

    await page.click('label[for="frais-niveau-debutant"]');
    expect(await champs()).toBe(2);
  });

  /* Chaque carte de /outils doit mener à une page qui existe et porte son titre. */
  test('les cartes de la page Outils mènent aux quatre outils', async ({ page }) => {
    await page.goto('/outils/');
    const liens = await page.locator('#liste article h3 a').all();
    expect(liens).toHaveLength(4);

    for (const lien of liens) {
      const href = await lien.getAttribute('href');
      const titre = (await lien.textContent())?.trim();
      const reponse = await page.goto(href!);
      expect(reponse?.status(), href!).toBe(200);
      await expect(page.locator('h1')).toHaveText(titre!);
      await expect(page.locator('[data-tool-level] fieldset')).toBeVisible();
      await page.goBack();
    }
  });

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
