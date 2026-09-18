import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Toutes les pages publiées : un débordement horizontal se vérifie partout, pas au seul accueil. */
const PAGES = [
  '/',
  '/frais/',
  '/strategie/',
  '/a-propos/',
  '/documentation/',
  '/faq/',
  '/presse/',
];

/**
 * Défiler jusqu'à `y` PUIS attendre que la page se soit posée, au lieu d'un délai à l'aveugle.
 *
 * L'accueil épingle ses sections avec GSAP : après un `scrollTo`, la géométrie et les opacités menées
 * par le défilement sont recalculées dans la boucle d'animation de GSAP, qui n'est pas la nôtre. Lire
 * l'état juste après revenait à lire la frame d'avant, et le test tombait une fois sur trois en
 * parallèle, quand la machine est chargée.
 *
 * On lit donc l'empreinte de l'état jusqu'à ce que deux lectures consécutives soient identiques. C'est
 * une attente de STABILITÉ, pas une attente du résultat voulu : elle ne masque aucun défaut, elle
 * refuse seulement de juger une page en train de bouger.
 */
const allerA = async (page: Page, y: number, empreinte: () => Promise<string>) => {
  await page.evaluate(
    (v) =>
      new Promise<void>((resolve) => {
        window.scrollTo(0, v);
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
    y
  );
  let precedente = '';
  for (let essai = 0; essai < 20; essai += 1) {
    const courante = await empreinte();
    if (courante === precedente) return;
    precedente = courante;
    await page.waitForTimeout(100);
  }
};

/**
 * Descend jusqu'au bas RÉEL du document, puis attend que l'affichage se stabilise.
 * `document.body.scrollHeight` relevé au sommet ne vaut rien ici : les sections épinglées de l'accueil
 * posent leurs cales au fil du défilement et le document s'allonge en cours de route. Viser la hauteur
 * de départ laissait donc le test à un ou deux écrans du bas, là où la première pastille n'a pas encore
 * dépassé sa borne de fin. On redescend tant que la position gagne du terrain.
 */
const allerEnBas = async (page: Page, empreinte: () => Promise<string>) => {
  let precedent = -1;
  for (let essai = 0; essai < 30; essai += 1) {
    const y = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          window.scrollTo(0, document.documentElement.scrollHeight);
          requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve(Math.round(window.scrollY)))
          );
        })
    );
    if (y === precedent) break;
    precedent = y;
    await page.waitForTimeout(120);
  }
  /* Même stabilisation qu'ailleurs : deux relevés identiques d'affilée. */
  let avant = '';
  for (let essai = 0; essai < 20; essai += 1) {
    const courante = await empreinte();
    if (courante === avant) return;
    avant = courante;
    await page.waitForTimeout(100);
  }
};

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
   * LE TIROIR NE LAISSE PAS DÉFILER LA PAGE, et il garde sa barre de défilement (18/09/2026,
   * src/scripts/verrou.ts, le verrou partagé avec la recherche). Il posait `overflow: hidden` sur
   * <html> : la barre de défilement disparaissait et la page se recentrait de 7 px à chaque ouverture,
   * visible avec une souris branchée. Ce sont les gestes qui sont neutralisés désormais.
   * À 1000 px de large : sous le seuil « lg », le seul où le bouton Menu existe, et assez large pour
   * que la molette de Playwright soit celle d'un vrai bureau (en émulation mobile, elle contourne
   * l'événement de la page).
   */
  test('le tiroir du menu ne laisse pas défiler la page et n’en décale pas la mise en page', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'la molette est un geste de bureau');
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.goto('/presse/');
    await page.locator('[data-consent-refuse]').click();
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(300);
    const largeurs = () =>
      page.evaluate(() => [
        Math.round(document.querySelector('[data-sitenav-bar]')!.getBoundingClientRect().left),
        document.documentElement.clientWidth,
      ]);
    const avant = await largeurs();

    /* Clic par coordonnées : `locator.click` défile jusqu'au bouton et fausserait la mesure. */
    const menu = await page.locator('[data-menu-open]').boundingBox();
    if (!menu) throw new Error('bouton Menu introuvable');
    await page.mouse.click(menu.x + menu.width / 2, menu.y + menu.height / 2);
    await expect(page.locator('[data-menu-panel]')).toHaveAttribute('data-open', '');

    expect(await largeurs(), 'ni la barre ni la page ne se décalent').toEqual(avant);
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(200);
    await page.mouse.move(300, 600);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => Math.round(window.scrollY)), 'molette neutralisée').toBe(200);

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-menu-panel]')).not.toHaveAttribute('data-open', '');
    await page.mouse.wheel(0, 600);
    await expect
      .poll(() => page.evaluate(() => Math.round(window.scrollY)), 'la molette redéfile')
      .toBeGreaterThan(200);
  });

  /*
   * LE HERO SE FRANCHIT D'UN SEUL GESTE (17/09/2026, src/scripts/heroAvance.ts). Un cran de molette
   * depuis le haut mène au début du contenu, un cran vers le haut en revient ; plus bas, la molette est
   * native ; en mouvement réduit, rien n'est intercepté.
   */
  test('un cran de molette fait passer du hero au contenu, et retour', async ({ page, browser }) => {
    const position = () => page.evaluate(() => Math.round(window.scrollY));
    const cible = () =>
      page.evaluate(() =>
        Math.round(document.querySelector('#ce-qui-change')!.getBoundingClientRect().top + window.scrollY)
      );
    await page.goto('/');
    await page.locator('#consent-banner button').first().click();
    const haut = await cible();
    await page.mouse.move(200, 300);

    await page.mouse.wheel(0, 100);
    await expect.poll(position, { message: 'un cran vers le bas mène au contenu', timeout: 4000 }).toBe(haut);

    await page.waitForTimeout(1500);
    await page.mouse.wheel(0, -100);
    await expect.poll(position, { message: 'un cran vers le haut ramène au hero', timeout: 4000 }).toBe(0);

    await page.waitForTimeout(1500);
    await page.evaluate((y) => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, y);
    }, haut + 1200);
    await page.mouse.wheel(0, 100);
    await expect.poll(position, { message: 'plus bas, la molette est native', timeout: 3000 }).toBe(haut + 1300);

    const reduit = await browser.newContext({ reducedMotion: 'reduce', baseURL: new URL(page.url()).origin });
    const calme = await reduit.newPage();
    await calme.goto('/');
    await calme.locator('#consent-banner button').first().click();
    await calme.mouse.move(200, 300);
    await calme.mouse.wheel(0, 100);
    await calme.waitForTimeout(1200);
    expect(await calme.evaluate(() => Math.round(window.scrollY)), 'mouvement réduit : défilement natif').toBe(100);
    await reduit.close();
  });

  /*
   * UN HERO PLUS HAUT QUE LA FENÊTRE SE LIT AU DÉFILEMENT NATIF (audit du 18/09/2026). À 640 × 360, soit
   * un zoom de 200 % sur un écran de 1280 × 720, le hero mesure près de deux fenêtres : le passage
   * automatique sautait tout ce qui se trouve sous le premier écran, boutons et mention de la société
   * de gestion compris. Le test ci-dessus ne couvrait que le cas où le hero tient dans l'écran.
   */
  test('un hero qui dépasse de la fenêtre se lit au défilement natif', async ({ page, isMobile }) => {
    test.skip(isMobile, 'la molette est un geste de bureau');
    await page.setViewportSize({ width: 640, height: 360 });
    await page.goto('/');
    await page.locator('#consent-banner button').first().click();
    const mesures = await page.evaluate(() => ({
      hero: document.querySelector<HTMLElement>('#apercu')!.offsetHeight,
      fenetre: window.innerHeight,
    }));
    expect(mesures.hero, 'le cas testé : un hero plus haut que la fenêtre').toBeGreaterThan(
      mesures.fenetre
    );
    await page.mouse.move(200, 200);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(1200);
    expect(
      await page.evaluate(() => Math.round(window.scrollY)),
      'un cran de molette avance d’un cran, il ne saute pas le bas du hero'
    ).toBe(100);
  });

  /*
   * LE CONSENT MODE ARRIVE À GTM SOUS LA FORME QU'IL ATTEND (audit du 18/09/2026). GTM ne lit une
   * commande gtag que si l'entrée du dataLayer est un objet Arguments. `gtag(...args)` y poussait un
   * tableau : ni le refus par défaut, ni l'accord, ni le retrait n'arrivaient au conteneur, et rien ne
   * le signalait. Le test suit les trois temps, dont le retrait après accord, celui qui compte.
   */
  test('le Consent Mode arrive à GTM sous la forme qu’il attend', async ({ page }) => {
    /* Le conteneur lui-même n'a rien à faire ici, et la forge a un identifiant GTM. */
    await page.route(/googletagmanager\.com|google-analytics\.com/, (route) => route.abort());
    const commandes = () =>
      page.evaluate(() =>
        ((window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [])
          .filter((x) => Object.prototype.toString.call(x) === '[object Arguments]')
          .map((x) => Array.from(x as ArrayLike<unknown>))
      );
    const mesure = async () =>
      (await commandes()).map((c) => [
        c[0],
        c[1],
        (c[2] as Record<string, string> | undefined)?.analytics_storage,
      ]);

    await page.goto('/frais/');
    const [premiere] = await commandes();
    expect(premiere?.slice(0, 2), 'le refus par défaut passe avant tout le reste').toEqual([
      'consent',
      'default',
    ]);
    expect(premiere?.[2]).toMatchObject({ analytics_storage: 'denied', ad_storage: 'denied' });

    await page.locator('[data-consent-accept]').click();
    await expect.poll(mesure, { message: 'l’accord est transmis' }).toContainEqual([
      'consent',
      'update',
      'granted',
    ]);

    await page.locator('[data-consent-open]').first().click();
    await page.locator('[data-consent-refuse]').click();
    await expect.poll(mesure, { message: 'le retrait est transmis' }).toContainEqual([
      'consent',
      'update',
      'denied',
    ]);
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

    /* Les deux mesures sont prises dans le MÊME passage : comparer deux relevés pris à des instants
       différents ferait courir la géométrie contre l'état de la pastille, qui est calculé à la frame
       précédente. C'est ce qui rendait ce test instable en parallèle. */
    const releve = () =>
      page.evaluate(() => {
        const invitation = document.querySelector('[data-hero-scroll-hint]')!;
        const enveloppe = invitation.closest('[data-scrub]') ?? invitation;
        const r = invitation.getBoundingClientRect();
        return {
          invitation:
            r.bottom > 0 &&
            r.top < window.innerHeight &&
            parseFloat(getComputedStyle(enveloppe).opacity) > 0.05,
          pastille: document.querySelector('[data-sticky-cta]')!.hasAttribute('data-on'),
        };
      });

    const empreinte = async () => JSON.stringify(await releve());

    /*
     * On attend que l'invitation soit ENTRÉE, au lieu d'un délai fixe. Elle est au rang 7 de la cascade
     * d'ouverture et finit son entrée vers 2 350 ms : une attente de 2 400 ms ne laissait que cinquante
     * millisecondes de marge, que la moindre charge machine mangeait. Le test tombait alors ici, sur une
     * page qui n'avait pas fini de s'ouvrir.
     */
    await expect.poll(async () => (await releve()).invitation, { timeout: 8000 }).toBe(true);

    /* En haut de page : l'invitation est là, la pastille attend son tour. */
    expect(await releve()).toEqual({ invitation: true, pastille: false });

    const hauteur = await page.evaluate(() => document.body.scrollHeight);

    /*
     * Le contrat, c'est qu'elles ne se CHEVAUCHENT jamais, et que le relais a bien lieu. On balaie la
     * page sans mémoriser aucune position : les sections de l'accueil sont épinglées, et les cales
     * d'épinglage déplacent tout en cours de route. Exiger un état à une hauteur PRÉCISE reviendrait à
     * fixer une frontière qui bouge avec la longueur de la page et avec le format.
     */
    let relaisVu = false;
    for (let y = 0; y <= hauteur; y += Math.round(hauteur / 12)) {
      await allerA(page, y, empreinte);
      const { invitation, pastille } = await releve();
      expect(invitation && pastille, `les deux visibles à ${y} px`).toBe(false);
      if (pastille) relaisVu = true;
    }
    expect(relaisVu, 'la pastille ne s’est affichée nulle part sur la page').toBe(true);

    /*
     * Remontée : l'invitation revient, la pastille se replie. On ATTEND que l'invitation soit revenue
     * plutôt que de la lire une fois : remonter du bas au sommet traverse toutes les sections
     * épinglées, et leur opacité, menée par le défilement, met plusieurs frames à se rétablir. C'est une
     * attente du retour à l'état de repos, pas une attente du résultat voulu, la pastille est vérifiée
     * juste après, sans indulgence.
     */
    await allerA(page, 0, empreinte);
    await expect.poll(async () => (await releve()).invitation, { timeout: 5000 }).toBe(true);
    expect((await releve()).pastille, 'la pastille reste affichée au sommet').toBe(false);
  });

  /*
   * Les DEUX pastilles de l'accueil se relaient sans jamais se croiser : celle du comparateur se replie
   * à « L'expérience derrière R Start », celle de la souscription arrive à « Souscrire en 4 étapes »,
   * qui vient après, et reste jusqu'au bas de la page. Deux pastilles à la même place en bas d'écran
   * se recouvriraient : le test balaie la page et interdit qu'elles soient ouvertes ensemble.
   */
  test('les deux pastilles d’appel ne se croisent jamais', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-consent-refuse]').click();
    await page.waitForTimeout(2400);

    /*
     * L'ordre des deux sections est la garantie de fond : la première pastille se replie à « corum »,
     * la seconde arrive à « souscrire ». Si l'ordre s'inversait, elles se recouvriraient en bas d'écran.
     */
    const ordre = await page.evaluate(() => ({
      corum: document.querySelector('#corum')!.getBoundingClientRect().top,
      souscrire: document.querySelector('#souscrire')!.getBoundingClientRect().top,
    }));
    expect(ordre.corum, 'Corum doit précéder Souscrire').toBeLessThan(ordre.souscrire);

    /*
     * Balayage par FRACTIONS de la page, sans mémoriser aucune position : les sections de l'accueil sont
     * épinglées au défilement, et les cales d'épinglage allongent le document en cours de route. Une
     * position relevée au sommet ne vaut plus rien cent pixels plus bas, ce qui rendait ce test
     * dépendant du moment où il regardait.
     */
    const hauteur = await page.evaluate(() => document.body.scrollHeight);

    const empreinte = async () =>
      JSON.stringify(
        await page.evaluate(() =>
          [...document.querySelectorAll('[data-sticky-cta]')].map((b) => b.hasAttribute('data-on'))
        )
      );

    for (let y = 0; y <= hauteur; y += Math.round(hauteur / 12)) {
      await allerA(page, y, empreinte);
      const etats = await page.evaluate(() =>
        [...document.querySelectorAll('[data-sticky-cta]')].map((b) => b.hasAttribute('data-on'))
      );
      expect(etats, 'deux pastilles attendues sur l’accueil').toHaveLength(2);
      expect(
        etats.filter(Boolean).length,
        `deux pastilles ouvertes ensemble à ${y} px`
      ).toBeLessThanOrEqual(1);
    }

    /* Au bas de la page, c'est celle de la souscription qui tient : elle n'a pas de borne de fin. */
    await allerEnBas(page, empreinte);
    await expect
      .poll(() =>
        page.evaluate(() =>
          [...document.querySelectorAll('[data-sticky-cta]')].map((b) => b.hasAttribute('data-on'))
        )
      )
      .toEqual([false, true]);
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

  /*
   * Refonte du 13/09/2026 : /strategie, /a-propos et /presse tenaient chacune dans une ou deux sections
   * interminables (la Stratégie faisait à elle seule 8,5 écrans sur téléphone, sans titre intermédiaire).
   * Le garde-fou vérifie ce qui rendait ces pages illisibles, pas la mise en page du jour : plusieurs
   * sections, un titre visible par section, et aucune section qui reparte en pavé de plusieurs écrans.
   */
  const PAGES_REFONDUES = [
    /* 5 → 4 le 14/09/2026 : l'équipe a fourni le texte exact de /strategie. Il tenait d'abord en trois
       chapitres, le « Comment » est arrivé ensuite, et le bloc des risques ferme la page. Le garde-fou
       reste celui d'origine (plusieurs sections, chacune titrée et courte). */
    { chemin: '/strategie/', mini: 4 },
    { chemin: '/a-propos/', mini: 2 },
    { chemin: '/presse/', mini: 4 },
  ];
  for (const { chemin, mini } of PAGES_REFONDUES) {
    test(`${chemin} se lit en sections courtes et titrées`, async ({ page }) => {
      await page.goto(chemin);
      const releve = await page.evaluate(() => {
        const ecran = window.innerHeight;
        return [...document.querySelectorAll('main > section')].map((s) => {
          const titre = document.getElementById(s.getAttribute('aria-labelledby') ?? '');
          return {
            id: s.id,
            ecrans: s.getBoundingClientRect().height / ecran,
            titre: (titre?.textContent ?? '').trim(),
            cache: titre?.classList.contains('visually-hidden') ?? true,
          };
        });
      });
      /* Les notes ne comptent pas : elles fermaient toutes les pages sans faire leur structure. Aucune
         page n'en rend plus depuis le 14/09/2026 (LegalNotes.astro), le filtre est donc sans effet
         aujourd'hui ; il est gardé pour le jour où elles reviennent. */
      const contenu = releve.filter((s) => s.id !== 'notes');
      expect(contenu.length).toBeGreaterThanOrEqual(mini);
      expect(contenu.filter((s) => !s.titre || s.cache).map((s) => s.id)).toEqual([]);
      expect(
        contenu.filter((s) => s.ecrans > 4).map((s) => `${s.id} ${s.ecrans.toFixed(1)} écrans`)
      ).toEqual([]);
    });
  }

  /*
   * Demande de l'équipe du 13/09/2026 : jamais de bloc sombre juste après l'en-tête, lui-même sombre.
   * Sur /strategie, le mot d'ordre enchaînait deux pavés ink sans coupure et la page semblait commencer
   * au deuxième écran. La règle vaut pour toutes les sous-pages, pas seulement celle qui l'a révélée.
   */
  test('aucune sous-page n’enchaîne deux blocs sombres après l’en-tête', async ({ page }) => {
    const fautifs: string[] = [];
    for (const chemin of PAGES.filter((p) => p !== '/')) {
      await page.goto(chemin);
      const releve = await page.evaluate(() => {
        /* Luminance relative approchée du fond : 0 = noir, 1 = blanc. */
        const clarte = (el: Element) => {
          const canaux = getComputedStyle(el).backgroundColor.match(/\d+/g);
          if (!canaux) return 1;
          const [r, v, b] = canaux.map(Number);
          return (0.2126 * r + 0.7152 * v + 0.0722 * b) / 255;
        };
        const entete = document.querySelector('#en-tete');
        const premiere = document.querySelector('main > section:not(#en-tete)');
        if (!entete || !premiere) return null;
        return { entete: clarte(entete), premiere: clarte(premiere), id: premiere.id };
      });
      if (releve && releve.entete < 0.5 && releve.premiere < 0.5)
        fautifs.push(`${chemin} → #${releve.id}`);
    }
    expect(fautifs).toEqual([]);
  });

  /*
   * Tant que la souscription n'est pas ouverte (config/site.ts, subscribeOpen), AUCUN CTA « Souscrire »
   * ne doit quitter le site : le clic ouvre la fenêtre d'attente. Le repérage se faisait par le mot
   * « placeholder » dans l'URL du tunnel, et ce marqueur était mangé par le découpage des commentaires
   * du .env : la fenêtre n'était rendue nulle part et tous les boutons partaient sur corum.fr.
   */
  test('les CTA de souscription ouvrent la fenêtre d’attente', async ({ page }) => {
    for (const chemin of PAGES) {
      await page.goto(chemin);
      const nb = await page.locator('[data-cta="souscrire"]').count();
      expect(nb, `${chemin} ne porte aucun CTA de souscription`).toBeGreaterThan(0);

      /* Aucun CTA ne pointe hors du site : sans JavaScript, on reste sur la documentation. */
      const cibles = await page
        .locator('[data-cta="souscrire"]')
        .evaluateAll((liens) => liens.map((a) => a.getAttribute('href') ?? ''));
      expect(
        cibles.filter((h) => /^https?:/i.test(h)),
        chemin
      ).toEqual([]);

      const fenetre = page.locator('[data-subscribe-soon]');
      await expect(fenetre, chemin).toHaveCount(1);
      await page
        .locator('[data-cta="souscrire"]')
        .first()
        .evaluate((a: HTMLElement) => a.click());
      await expect(fenetre, chemin).toHaveAttribute('open', '');
      /* Échap referme, et le lien n'a pas navigué. */
      await page.keyboard.press('Escape');
      await expect(fenetre, chemin).not.toHaveAttribute('open', '');
      expect(new URL(page.url()).pathname.replace(/\/$/, '')).toContain(chemin.replace(/\/$/, ''));
    }
  });

  /*
   * CHAQUE BOUTON A SA PEAU ET SE VOIT SUR SON FOND (17/09/2026). Deux accidents rattrapés avant la mise
   * en ligne des quatre rôles de bouton : `btn-light` et `btn-lg`, composés dynamiquement dans
   * Button.astro, n'étaient pas générés par Tailwind (le « Souscrire en ligne » du hero s'affichait en
   * texte nu) ; et un bouton contour blanc avait été posé sur une section blanche (invisible). Le test
   * relève, pour chaque `.btn` visible, son rembourrage et le contraste texte / fond effectif, fond
   * obtenu en remontant les ancêtres et en composant les fonds translucides. Un ancêtre à image de fond
   * rend la mesure incertaine : ce bouton-là est sauté plutôt que jugé à tort.
   */
  test('chaque bouton a sa peau et se lit sur son fond', async ({ page }) => {
    for (const chemin of ['/', '/strategie/', '/frais/', '/a-propos/', '/documentation/', '/404.html']) {
      await page.goto(chemin);
      const mesures = await page.evaluate(() => {
        const toile = document.createElement('canvas');
        toile.width = toile.height = 1;
        const ctx = toile.getContext('2d', { willReadFrequently: true })!;
        const rgba = (c: string) => {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = '#000';
          ctx.fillStyle = c;
          ctx.fillRect(0, 0, 1, 1);
          const d = ctx.getImageData(0, 0, 1, 1).data;
          return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
        };
        type C = { r: number; g: number; b: number };
        const lum = ({ r, g, b }: C) => {
          const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const sur = (h: C & { a: number }, bas: C): C => ({
          r: h.r * h.a + bas.r * (1 - h.a),
          g: h.g * h.a + bas.g * (1 - h.a),
          b: h.b * h.a + bas.b * (1 - h.a),
        });
        return [...document.querySelectorAll<HTMLElement>('a.btn, button.btn')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return (
              r.width > 0 &&
              !el.classList.contains('skip-link') &&
              !el.closest('[hidden], dialog:not([open]), [aria-hidden="true"], .carte-verso')
            );
          })
          .flatMap((el) => {
            const couches = [];
            let fond: C | null = null;
            for (let n: HTMLElement | null = el; n; n = n.parentElement) {
              const s = getComputedStyle(n);
              if (s.backgroundImage !== 'none') return [];
              const c = rgba(s.backgroundColor);
              if (c.a > 0.99) {
                fond = c;
                break;
              }
              if (c.a > 0) couches.push(c);
            }
            let base: C = fond ?? { r: 255, g: 255, b: 255 };
            for (const c of couches.reverse()) base = sur(c, base);
            const texte = sur(rgba(getComputedStyle(el).color), base);
            const [x, y] = [lum(texte), lum(base)].sort((m, n) => n - m);
            return [
              {
                libelle: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
                rembourrage: parseFloat(getComputedStyle(el).paddingLeft),
                contraste: Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100,
              },
            ];
          });
      });
      expect(mesures.length, `${chemin} : aucun bouton mesuré`).toBeGreaterThan(0);
      for (const m of mesures) {
        expect(m.rembourrage, `${chemin} « ${m.libelle} » sans rembourrage`).toBeGreaterThanOrEqual(8);
        expect(m.contraste, `${chemin} « ${m.libelle} » illisible sur son fond`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  /*
   * Survol d'un lien de contenu (14/09/2026, « le trait est sur le texte ») : le soulignement doit
   * apparaître AU SURVOL, sous les jambages, et une seule fois. Avant, `hover:underline` posait le
   * trait d'un coup à 0,2 em du texte, et là où la classe accompagnait `nav-link`, deux traits se
   * dessinaient, celui du navigateur et celui du pseudo-élément.
   */
  test('le soulignement des liens apparaît au survol, sous le texte', async ({ page }) => {
    await page.goto('/presse/');
    /* Cible déplacée le 15/09/2026 : le renvoi vers la salle de presse a laissé la place aux
       contacts presse (zone 4). Même page, même utilitaire `link-underline`. */
    const lien = page.locator('#contacts-presse a').first();
    await lien.scrollIntoViewIfNeeded();

    /*
     * Relevés en `expect.poll` des deux côtés : la couleur du trait est en TRANSITION (220 ms), et la
     * feuille de style peut ne pas être encore appliquée au premier coup d'œil. Un relevé unique
     * tombait tantôt sur l'état de départ, tantôt sur un état intermédiaire.
     */
    const couleur = () => lien.evaluate((el) => getComputedStyle(el).textDecorationColor);
    await expect.poll(couleur, { message: 'au repos, aucun trait visible' }).toMatch(/,\s*0\)$/);

    await lien.hover();
    await expect
      .poll(couleur, { message: 'au survol, le trait se colore' })
      .not.toMatch(/,\s*0\)$/);

    /* Assez bas pour passer sous les jambages, et il les contourne. */
    const pose = await lien.evaluate((el) => {
      const s = getComputedStyle(el);
      return { ecart: parseFloat(s.textUnderlineOffset), skip: s.textDecorationSkipInk };
    });
    expect(pose.ecart).toBeGreaterThanOrEqual(3);
    expect(pose.skip).toBe('auto');
  });

  /*
   * Pied de page (refonte du 14/09/2026) : un retour en haut sur chaque page, et des liens réellement
   * cliquables au doigt. Les pages font jusqu'à quinze écrans, on n'y remontait qu'à la main.
   */
  test('le pied de page ramène en haut et ses liens se touchent au doigt', async ({ page }) => {
    for (const chemin of ['/', '/frais/', '/a-propos/']) {
      await page.goto(chemin);
      const retour = page.locator('footer [data-footer-top]');
      await expect(retour, chemin).toHaveCount(1);
      await expect(retour, chemin).toHaveAttribute('href', '#contenu');
      await expect(page.locator('#contenu'), chemin).toHaveCount(1);

      const petits = await page
        .locator('footer nav a')
        .evaluateAll((liens) => liens.filter((a) => a.getBoundingClientRect().height < 44).length);
      expect(petits, `${chemin} : cibles tactiles trop petites`).toBe(0);
    }
  });

  /*
   * Plan de taggage du 14/09/2026. Un plan sans test se dégrade au premier remaniement : un attribut
   * renommé, un sélecteur déplacé, et l'événement disparaît sans que rien ne le dise. Les mesures ne
   * reviennent jamais rétroactivement, contrairement à un bug d'affichage.
   * La file `dataLayer` existe avant le chargement de GTM et lui est rejouée : on peut donc tout
   * vérifier sans conteneur, ce qui est exactement l'état du site tant que PUBLIC_GTM_ID est vide.
   */
  const evenements = (page: Page) =>
    page.evaluate(() =>
      ((window as unknown as { dataLayer?: Record<string, unknown>[] }).dataLayer ?? [])
        .filter((x) => x && typeof x.event === 'string')
        .map((x) => x as Record<string, unknown>)
    );

  test('la campagne d’entrée est retenue puis jointe aux événements', async ({ page }) => {
    await page.goto('/?utm_source=linkedin&utm_medium=social&utm_campaign=lancement-2026');
    const retenue = await page.evaluate(() => sessionStorage.getItem('rstart_campagne'));
    expect(retenue, 'campagne retenue à l’arrivée').toContain('linkedin');

    /* PREMIÈRE CAMPAGNE GAGNANTE : une page sans paramètre ne doit pas l'effacer. */
    await page.goto('/frais/');
    expect(await page.evaluate(() => sessionStorage.getItem('rstart_campagne'))).toContain(
      'linkedin'
    );

    await page.locator('[data-comparator-select]').selectOption({ index: 1 });
    const [premier] = await evenements(page);
    expect(premier?.campagne_source, 'la campagne accompagne chaque événement').toBe('linkedin');
    expect(premier?.campagne_nom).toBe('lancement-2026');
    expect(premier?.page_type).toBe('frais');
  });

  test('les événements du plan de taggage partent bien', async ({ page }) => {
    /* Consentement : indispensable pour interpréter tout le reste. */
    await page.goto('/frais/');
    await page.locator('[data-consent-refuse]').click();
    await expect
      .poll(async () => (await evenements(page)).map((x) => x.event))
      .toContain('consentement');

    /* Comparateur : à quoi le visiteur compare R Start. */
    await page.locator('[data-comparator-select]').selectOption({ index: 1 });
    await expect
      .poll(async () => (await evenements(page)).map((x) => x.event))
      .toContain('comparateur_scpi');

    /* Profondeur de lecture : quatre paliers au maximum, jamais un par section. */
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect
      .poll(
        async () => (await evenements(page)).filter((x) => x.event === 'lecture_profondeur').length
      )
      .toBeGreaterThan(0);
    const paliers = (await evenements(page))
      .filter((x) => x.event === 'lecture_profondeur')
      .map((x) => x.palier);
    expect(paliers.length, 'quatre paliers au plus').toBeLessThanOrEqual(4);
    expect(new Set(paliers).size, 'aucun palier envoyé deux fois').toBe(paliers.length);

    /* Page introuvable : détecte les liens morts diffusés à l'extérieur. */
    await page.goto('/page-qui-nexiste-pas');
    await expect
      .poll(async () => (await evenements(page)).map((x) => x.event))
      .toContain('page_introuvable');
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
