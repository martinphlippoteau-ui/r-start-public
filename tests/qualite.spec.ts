import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Toutes les pages publiées : un débordement horizontal se vérifie partout, pas au seul accueil. */
const PAGES = [
  '/',
  '/frais/',
  '/simulateur/',
  '/strategie/',
  '/a-propos/',
  '/documentation/',
  '/faq/',
  '/presse/',
];

/**
 * Défiler jusqu'à `y` PUIS attendre que la page se soit posée : l'accueil épingle ses sections avec
 * GSAP, dont la boucle recalcule géométrie et opacités après le `scrollTo` ; lire l'état juste
 * après revenait à lire la frame d'avant, et le test tombait une fois sur trois en parallèle. On
 * lit l'empreinte jusqu'à deux lectures identiques : une attente de STABILITÉ, pas du résultat
 * voulu.
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
 * Descend jusqu'au bas RÉEL du document, puis attend que l'affichage se stabilise. `scrollHeight`
 * relevé au sommet ne vaut rien : les sections épinglées posent leurs cales au fil du défilement et
 * le document s'allonge en cours de route. On redescend tant que la position gagne du terrain.
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
  test('les CTA pointent vers le tunnel et alimentent le dataLayer', async ({ page }) => {
    await page.goto('/');
    const ctas = page.locator('[data-cta="souscrire"]');
    expect(await ctas.count()).toBeGreaterThanOrEqual(3);
    const hrefs = await ctas.evaluateAll((a) => a.map((x) => (x as HTMLAnchorElement).href));
    for (const h of hrefs) expect(h).toMatch(/^https?:\/\//);
    await page.evaluate(() => document.addEventListener('click', (e) => e.preventDefault(), true));
    // Playwright considère un élément d'opacité 0 comme visible, et un CTA de la barre a pu être
    // inerte au premier écran (opacité 0, `pointer-events: none`) : on cherche donc le premier CTA
    // réellement ACTIONNABLE plutôt que le premier du DOM.
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
    expect(events[0]?.cta_position).toBeTruthy();
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

  /* Toutes les pages : /frais a débordé de 154 px sur téléphone sans qu'un test limité à l'accueil
     le voie. */
  for (const route of PAGES) {
    test(`pas de débordement horizontal (${route})`, async ({ page }) => {
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  /* La barre de navigation est IDENTIQUE sur toutes les pages (12/09/2026, demande de l'équipe) :
     une empreinte par page, avant tout défilement (hauteur, verre, flou, quatre repères), une
     seule valeur. */
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

  /* UNE SEULE FORME D'ADRESSE : l'hébergeur renvoie « /frais » vers « /frais/ », chaque lien sans
     barre finale payait une redirection. Le serveur de test redirige comme lui. */
  test('aucun lien du menu ne paie de redirection, et le canonical est l’adresse servie', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'la liste des pages n’est dans la barre qu’à partir de « lg »');
    const redirections: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 300 && r.status() < 400) redirections.push(`${r.status()} ${r.url()}`);
    });
    await page.goto('/');
    await page.locator('[data-consent-refuse]').click();
    const liens = page.locator('[data-sitenav-list] a');
    const nombre = await liens.count();
    for (let i = 0; i < nombre; i += 1) {
      await Promise.all([page.waitForLoadState('load'), liens.nth(i).click()]);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/$/);
      /* /simulateur s'ouvre sur sa fenêtre d'accès, qui rend le reste de la page inerte, barre
         comprise : on l'accepte pour pouvoir cliquer l'entrée suivante. */
      const accepter = page.locator('[data-simu-acces-voile]:not([hidden]) [data-simu-accepter]');
      if (await accepter.count()) await accepter.click();
    }
    expect(redirections, 'aucune redirection pendant la navigation').toEqual([]);
    expect(new URL(page.url()).pathname.endsWith('/')).toBe(true);
  });

  /* LA BARRE TIENT À TOUTES LES LARGEURS DE BUREAU : entre 1024 et 1180 px, la liste ÉCRASAIT le
     logo (36 px à 1024) et passait sous la loupe. Elle doit alors défiler dans sa colonne, logo et
     loupe entiers, et ne pas défiler du tout quand elle tient. */
  test('la barre garde son logo et sa loupe entiers, que la liste des pages tienne ou non', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'la liste des pages n’est dans la barre qu’à partir de « lg »');
    for (const largeur of [1024, 1100, 1280, 1440]) {
      await page.setViewportSize({ width: largeur, height: 800 });
      await page.goto('/frais/');
      const m = await page.evaluate(() => {
        const cadre = (s: string) => document.querySelector(s)!.getBoundingClientRect();
        const liste = document.querySelector<HTMLElement>('[data-sitenav-list]')!;
        return {
          logo: Math.round(cadre('[data-nav-brand]').width),
          logoDroite: cadre('[data-nav-brand]').right,
          listeGauche: liste.getBoundingClientRect().left,
          listeDroite: liste.getBoundingClientRect().right,
          loupeGauche: cadre('[data-recherche-ouvrir]').left,
          defile: liste.scrollWidth - liste.clientWidth,
        };
      });
      expect(m.logo, `logo entier à ${largeur} px`).toBeGreaterThan(80);
      expect(
        m.listeGauche,
        `la liste ne recouvre pas le logo à ${largeur} px`
      ).toBeGreaterThanOrEqual(m.logoDroite);
      expect(
        m.listeDroite,
        `la liste ne passe pas sous la loupe à ${largeur} px`
      ).toBeLessThanOrEqual(m.loupeGauche + 1);
      if (largeur >= 1280) expect(m.defile, `rien à faire défiler à ${largeur} px`).toBe(0);
      else expect(m.defile, `la liste défile à ${largeur} px`).toBeGreaterThan(0);
    }
  });

  /* TOUS LES ÉVÉNEMENTS PASSENT PAR LE MÊME CANAL : « souscription_indisponible », écrit
     directement dans le dataLayer, partait sans le type de page ni la campagne d'entrée. */
  test('« souscription indisponible » porte le type de page et la campagne d’entrée', async ({
    page,
  }) => {
    await page.goto('/frais/?utm_source=lettre&utm_campaign=rentree');
    await page.locator('[data-consent-refuse]').click();
    await page.locator('main [data-cta="souscrire"]').first().click();
    await expect
      .poll(async () =>
        (await evenements(page)).find((x) => x.event === 'souscription_indisponible')
      )
      .toMatchObject({ page_type: 'frais', campagne_source: 'lettre', campagne_nom: 'rentree' });
    const consentement = (await evenements(page)).find((x) => x.event === 'consentement');
    expect(consentement, 'le choix de consentement aussi').toMatchObject({
      page_type: 'frais',
      campagne_source: 'lettre',
    });
  });

  /* DONNÉES STRUCTURÉES ET ANCRES : la réponse balisée reprend TOUT ce que la page affiche (le
     tableau des frais manquait) ; /frais ne balise pas une FAQ que personne ne peut lire ; les
     ancres des pages légales plient les accents au lieu de les remplacer par des tirets. */
  /* PAGES D'ERREUR (25/09/2026) : jamais dans l'index mais leurs liens suivis, sans canonique, hors
     du plan du site, et toutes renvoient à l'accueil. Le vrai code HTTP dépend de l'hébergeur. */
  test('pages d’erreur : noindex, follow, sans canonique, hors sitemap', async ({ page, request }) => {
    const plan = await (await request.get('/sitemap-0.xml')).text();
    for (const chemin of ['/404.html', '/403/', '/500.html', '/503/']) {
      await page.goto(chemin);
      await expect(page.locator('meta[name="robots"]'), chemin).toHaveAttribute('content', 'noindex, follow');
      await expect(page.locator('link[rel="canonical"]'), chemin).toHaveCount(0);
      await expect(page.locator('h1'), chemin).toHaveCount(1);
      await expect(page.locator('main a[href$="/"]').first(), chemin).toBeVisible();
      expect(plan, chemin).not.toContain(chemin.replace(/\/$/, '').replace('.html', ''));
    }
  });

  test('données structurées fidèles à la page, ancres légales lisibles', async ({
    page,
  }) => {
    const faqPages = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('script[type="application/ld+json"]')]
          .flatMap((s) => [JSON.parse(s.textContent ?? 'null')].flat())
          .filter((b) => b && b['@type'] === 'FAQPage')
      );
    await page.goto('/faq/');
    const [faq] = await faqPages();
    const frais = (faq.mainEntity as { name: string; acceptedAnswer: { text: string } }[]).find((q) =>
      /Quels sont les frais/.test(q.name)
    );
    expect(frais?.acceptedAnswer.text, 'le tableau des frais est dans la réponse balisée').toContain('15 %');

    await page.goto('/frais/');
    expect(await faqPages(), '/frais : aucune FAQ balisée sans FAQ visible').toEqual([]);

    await page.goto('/mentions-legales/');
    await expect(page.locator('#s-editeur-du-site')).toHaveCount(1);
    await expect(page.locator('#s-reclamations')).toHaveCount(1);

  });

  /* COMPARATEUR DE FRAIS : 1. une SCPI sans valeur sur une ligne héritait de la pastille « taux le
     plus bas » de la SCPI précédente (le cas n'existe pas dans les données, la page est servie avec
     une valeur retirée exprès) ; 2. sur téléphone, l'en-tête « Frais » en `display: none` sortait
     de l'arbre d'accessibilité, les taux étaient annoncés sous la mauvaise SCPI ; 3. un panneau « i
     » replié restait lu par les lecteurs d'écran. */
  test('comparateur : pas de faux gagnant, en-tête présent pour les lecteurs d’écran, panneau replié muet', async ({
    page,
  }) => {
    let gagnante = -1;
    let videe = -1;
    await page.route('**/frais/', async (route) => {
      const reponse = await route.fetch();
      let html = await reponse.text();
      html = html.replace(
        /(<script[^>]*data-reglages="comparateur"[^>]*>)([\s\S]*?)(<\/script>)/,
        (_tout, debut: string, json: string, fin: string) => {
          const reglages = JSON.parse(json) as { data: { values: string[] }[] };
          gagnante = reglages.data.findIndex((d) => /^0\s*%/.test(d.values[0] ?? ''));
          videe = reglages.data.findIndex((_d, i) => i !== gagnante);
          reglages.data[videe]!.values[0] = '';
          return debut + JSON.stringify(reglages).replace(/</g, '\\u003c') + fin;
        }
      );
      await route.fulfill({ response: reponse, body: html });
    });
    await page.goto('/frais/');
    await page.locator('[data-consent-refuse]').click();
    expect(gagnante, 'une SCPI à 0 % de frais de souscription existe dans les données').toBeGreaterThan(-1);

    const choix = page.locator('[data-comparator-select]');
    const premiere = page.locator('[data-comparator-cell="0"]');
    await choix.selectOption({ index: gagnante });
    await expect(premiere).toHaveClass(/fee-gagnant/);
    await choix.selectOption({ index: videe });
    await expect(premiere, 'la case vide ne garde pas la pastille du gagnant').not.toHaveClass(/fee-gagnant/);
    await expect(premiere).toHaveClass(/text-slate-700/);

    /* 2. À 390 px, l'en-tête « Frais » n'est plus en `display: none`. */
    await page.setViewportSize({ width: 390, height: 800 });
    const entete = page.locator('[data-comparator] thead th').first();
    expect(await entete.evaluate((th) => getComputedStyle(th).display)).not.toBe('none');

    /* 3. Replié : invisible pour tous. Déplié : visible. */
    const bouton = page.locator('[data-comparator] [data-info-bouton]').first();
    const contenu = page.locator(`[id="${await bouton.getAttribute('aria-controls')}"] > *`).first();
    await expect(contenu).toBeHidden();
    await bouton.click();
    await expect(contenu).toBeVisible();
  });

  /* SANS JAVASCRIPT, LE DÉTAIL DES CARTES DE /strategie SE LIT : écrit en sable pour le dos sombre,
     il restait sur le fond clair de la section, à 1,17:1. */
  test('sans JavaScript, le détail des cartes de /strategie est posé sur un fond sombre', async ({
    browser,
    baseURL,
  }) => {
    const contexte = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await contexte.newPage();
    await page.goto('/strategie/');
    const fonds = await page
      .locator('[data-carte-detail-hote]')
      .evaluateAll((hotes) => hotes.map((h) => getComputedStyle(h).backgroundColor));
    expect(fonds.length).toBeGreaterThan(0);
    expect(new Set(fonds), 'le fond du dos des cartes : ink').toEqual(new Set(['rgb(13, 46, 61)']));
    await contexte.close();
  });

  /* SANS JAVASCRIPT, SOUS « lg », ON NAVIGUE ENCORE : le bouton Menu disparaît, la liste des pages
     revient dans la barre, et la loupe, qui n'ouvrirait rien, reste masquée. */
  test('sans JavaScript, la barre d’un téléphone porte la liste des pages, pas un bouton mort', async ({
    browser,
    baseURL,
  }) => {
    const contexte = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 800 },
      baseURL,
    });
    const page = await contexte.newPage();
    await page.goto('/frais/');
    await expect(page.locator('[data-menu-open]')).toBeHidden();
    await expect(page.locator('[data-recherche-ouvrir]')).toBeHidden();
    const liens = page.locator('[data-sitenav-list] a');
    /* Six entrées, simulateur compris. */
    await expect(liens).toHaveCount(6);
    await expect(liens.first()).toBeVisible();
    await contexte.close();
  });

  /* À L'IMPRESSION, TOUT CE QUI EST ÉCRIT SORT SUR LE PAPIER : les moteurs d'animation posent
     `opacity: 0` en ligne sur ce qui attend sous l'écran, et ces blocs s'imprimaient blancs. */
  test('à l’impression, aucun contenu ne reste invisible et la barre disparaît', async ({ page }) => {
    await page.goto('/frais/');
    await page.emulateMedia({ media: 'print' });
    const bilan = await page.evaluate(() => {
      const invisibles = [...document.querySelectorAll<HTMLElement>('main [data-animate], main [data-reveal-text]')]
        .filter((el) => getComputedStyle(el).opacity !== '1').length;
      const affiche = (sel: string) => {
        const el = document.querySelector<HTMLElement>(sel);
        return el ? getComputedStyle(el).display !== 'none' : false;
      };
      return { invisibles, barre: affiche('[data-sitenav]'), bandeau: affiche('#consent-banner') };
    });
    expect(bilan).toEqual({ invisibles: 0, barre: false, bandeau: false });
  });

  /* LE TIROIR NE LAISSE PAS DÉFILER LA PAGE, et il garde sa barre de défilement
     (src/scripts/verrou.ts dit pourquoi). À 1000 px de large : sous « lg », seul seuil où le bouton
     Menu existe, et assez large pour que la molette de Playwright soit celle d'un vrai bureau (en
     émulation mobile, elle contourne l'événement de la page). */
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
    /* Sous le tiroir, tout est inerte, la barre comprise : il la recouvre. */
    expect(
      await page.evaluate(() => [
        document.querySelector<HTMLElement>('main')!.inert,
        document.querySelector<HTMLElement>('[data-sitenav-bar]')!.inert,
      ])
    ).toEqual([true, true]);
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

  /* LE HERO DÉFILE COMME LE RESTE DE LA PAGE (19/09/2026, demande de Martin) : un cran avance d'un
     cran, et aucun écouteur `wheel` ou `touchmove` non passif n'attend sur la page (lus par le
     protocole du navigateur). */
  test('le hero défile nativement, sans aucun écouteur bloquant', async ({ page, isMobile }) => {
    test.skip(isMobile, 'la molette est un geste de bureau');
    await page.goto('/');
    await page.locator('#consent-banner button').first().click();
    const position = () => page.evaluate(() => Math.round(window.scrollY));
    await page.mouse.move(200, 300);

    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(1200);
    expect(await position(), 'un cran vers le bas avance d’un cran, pas jusqu’au contenu').toBe(
      100
    );
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(1200);
    expect(await position(), 'un cran vers le haut en revient').toBe(0);

    const cdp = await page.context().newCDPSession(page);
    for (const cible of ['window', 'document']) {
      const { result } = await cdp.send('Runtime.evaluate', { expression: cible });
      const { listeners } = await cdp.send('DOMDebugger.getEventListeners', {
        objectId: result.objectId!,
      });
      expect(
        listeners
          .filter((l) => (l.type === 'wheel' || l.type === 'touchmove') && !l.passive)
          .map((l) => l.type),
        `aucun écouteur bloquant sur ${cible}`
      ).toEqual([]);
    }
  });

  /* L'INVITATION À DÉFILER RESTE UN LIEN QUI MARCHE SEUL : une ancre ordinaire, la section visée
     arrive sous la barre (`scroll-padding-top`). */
  test('l’invitation à défiler du hero mène au contenu', async ({ page }) => {
    await page.goto('/');
    await page.locator('#consent-banner button').first().click();
    const invitation = page.locator('[data-hero-scroll-hint]');
    await expect(invitation).toBeVisible();
    const ancre = await invitation.getAttribute('href');
    expect(ancre, 'un vrai lien d’ancre').toMatch(/^#.+/);
    await invitation.click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe(ancre);
    const haut = () =>
      page.evaluate(
        (id) => Math.round(document.getElementById(id)!.getBoundingClientRect().top),
        ancre!.slice(1)
      );
    await expect
      .poll(haut, { message: 'la section arrive en haut de l’écran', timeout: 5000 })
      .toBeLessThanOrEqual(160);
    expect(await haut(), 'et pas au-dessus : son titre reste sous la barre').toBeGreaterThanOrEqual(
      0
    );
  });

  /* TOUTE PASTILLE FLOTTANTE A SON ÉQUIVALENT DANS LE FLUX : rendues après </main>, elles ne sont
     atteintes au clavier qu'en bas de page, où celle du comparateur est déjà repliée. Un lien de
     <main> doit offrir la même destination. */
  test('chaque pastille flottante a un lien de même destination dans le contenu', async ({
    page,
  }) => {
    await page.goto('/');
    const releve = await page.evaluate(() => {
      const chemin = (a: HTMLAnchorElement) => a.pathname.replace(/\/+$/, '') + a.hash;
      const dansLeFlux = new Set(
        [...document.querySelectorAll<HTMLAnchorElement>('main a[href]')].map(chemin)
      );
      return [...document.querySelectorAll<HTMLAnchorElement>('[data-sticky-cta] a[href]')].map(
        (a) => ({
          pastille: (a.textContent ?? '').replace(/\s+/g, ' ').trim(),
          vers: chemin(a),
          equivalent: dansLeFlux.has(chemin(a)),
        })
      );
    });
    expect(releve.length, 'les deux pastilles de l’accueil').toBe(2);
    expect(releve.filter((r) => !r.equivalent)).toEqual([]);
  });

  /* LE CONSENT MODE ARRIVE À GTM SOUS LA FORME QU'IL ATTEND : un objet Arguments, pas un tableau
     (consent.ts dit pourquoi). Le test suit les trois temps, dont le retrait après accord.
     UN RETRAIT QUI RETIRE VRAIMENT : les cookies `_ga` survivaient treize mois à un refus donné
     après un accord, et l'identifiant de clic continuait de partir vers le tunnel. Le lien du tunnel
     est simulé : tant que la souscription est fermée, les CTA sont internes et n'ont rien à
     étiqueter. */
  test('un retrait de consentement efface les cookies de mesure et retire les identifiants des liens', async ({
    page,
    context,
    baseURL,
  }) => {
    await page.route(/googletagmanager\.com|google-analytics\.com/, (route) => route.abort());
    const url = baseURL ?? 'http://127.0.0.1:4321';
    await context.addCookies([
      { name: 'rstart_consent', value: 'granted', url },
      { name: '_ga', value: 'GA1.1.123456789.1700000000', url },
      { name: '_ga_ABC123', value: 'GS1.1.1700000000.1.0.1700000000.0.0.0', url },
    ]);
    await page.goto('/frais/?utm_source=essai&gclid=clic123');

    const lienDuTunnel = () =>
      page.evaluate(() => {
        let a = document.querySelector<HTMLAnchorElement>('a[data-essai-tunnel]');
        if (!a) {
          a = document.createElement('a');
          a.setAttribute('data-cta', 'souscrire');
          a.setAttribute('data-essai-tunnel', '');
          a.href = 'https://tunnel.example/';
          document.body.append(a);
        }
        a.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        return a.href;
      });

    const avec = await lienDuTunnel();
    expect(avec, 'avec accord : l’identifiant de clic part').toContain('gclid=clic123');

    await page.locator('[data-consent-open]').first().click();
    await page.locator('[data-consent-refuse]').click();
    const sans = await lienDuTunnel();
    expect(sans, 'après retrait : plus d’identifiant de clic').not.toContain('gclid=');
    expect(sans, 'la campagne, elle, reste').toContain('utm_source=essai');
    const restants = (await context.cookies()).map((c) => c.name).filter((n) => n.startsWith('_ga'));
    expect(restants, 'les cookies de mesure sont effacés').toEqual([]);
  });

  test('le bandeau de consentement ne donne pas le focus à « Tout accepter »', async ({ page }) => {
    await page.goto('/frais/');
    await expect(page.locator('#consent-banner')).toBeVisible();
    await expect(page.locator('#consent-title')).toBeFocused();
  });

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


  /* La pastille d'appel et l'invitation à défiler se relaient : jamais visibles ensemble, jamais
     absentes ensemble une fois le hero passé. Sur grand écran le hero est ÉPINGLÉ, la boîte de
     l'invitation ne quitte jamais l'écran et c'est son opacité qui tombe : les deux mesures
     comptent. */
  test('la pastille d’appel prend le relais de l’invitation à défiler', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-consent-refuse]').click();
    /* Après la séquence d'ouverture : avant, l'invitation n'est pas encore entrée. */
    await page.waitForTimeout(2400);

    /* Les deux mesures sont prises dans le MÊME passage : l'état de la pastille est calculé à la
       frame précédente, deux relevés séparés rendaient ce test instable en parallèle. */
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

    /* On attend que l'invitation soit ENTRÉE (vers 2 350 ms) : un délai fixe de 2 400 ms ne
       laissait que cinquante millisecondes de marge. */
    await expect.poll(async () => (await releve()).invitation, { timeout: 8000 }).toBe(true);

    /* En haut de page : l'invitation est là, la pastille attend son tour. */
    expect(await releve()).toEqual({ invitation: true, pastille: false });

    const hauteur = await page.evaluate(() => document.body.scrollHeight);

    /* Le contrat : jamais de CHEVAUCHEMENT, et un relais qui a lieu. On balaie la page sans
       mémoriser aucune position : les cales d'épinglage déplacent tout en cours de route, une
       frontière à hauteur PRÉCISE bougerait avec la longueur de la page et le format. */
    let relaisVu = false;
    for (let y = 0; y <= hauteur; y += Math.round(hauteur / 12)) {
      await allerA(page, y, empreinte);
      const { invitation, pastille } = await releve();
      expect(invitation && pastille, `les deux visibles à ${y} px`).toBe(false);
      if (pastille) relaisVu = true;
    }
    expect(relaisVu, 'la pastille ne s’est affichée nulle part sur la page').toBe(true);

    /* Remontée : on ATTEND que l'invitation soit revenue (l'opacité des sections épinglées met
       plusieurs frames à se rétablir), puis la pastille est vérifiée sans indulgence. */
    await allerA(page, 0, empreinte);
    await expect.poll(async () => (await releve()).invitation, { timeout: 5000 }).toBe(true);
    expect((await releve()).pastille, 'la pastille reste affichée au sommet').toBe(false);
  });

  /* Les DEUX pastilles de l'accueil se relaient sans se croiser : celle du comparateur se replie à
     « L'expérience derrière R Start », celle de la souscription arrive à « Souscrire en 4 étapes ».
     À la même place en bas d'écran, elles se recouvriraient. */
  test('les deux pastilles d’appel ne se croisent jamais', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-consent-refuse]').click();
    await page.waitForTimeout(2400);

    /* L'ordre des deux sections est la garantie de fond : inversé, elles se recouvriraient. */
    const ordre = await page.evaluate(() => ({
      corum: document.querySelector('#corum')!.getBoundingClientRect().top,
      souscrire: document.querySelector('#souscrire')!.getBoundingClientRect().top,
    }));
    expect(ordre.corum, 'Corum doit précéder Souscrire').toBeLessThan(ordre.souscrire);

    /* Balayage par FRACTIONS de la page, sans mémoriser aucune position (voir le test
       précédent). */
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

  /* D'une page à l'autre, la barre ne bouge pas d'un pixel et l'indicateur se pose sur le nouveau
     lien : les `view-transition-name` de global.css ; un nom effacé casserait la continuité en
     silence. */
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

  /* Le comparateur ne compare que si ses DEUX colonnes sont à l'écran : sur téléphone (cartes sous
     48 rem), la liste déroulante de l'en-tête collant est le seul moyen de changer de SCPI. */
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

  /* Garde-fou de lisibilité : /strategie, /a-propos et /presse ont tenu dans une ou deux sections
     interminables (8,5 écrans sans titre). On vérifie ce qui les rendait illisibles, pas la mise en
     page du jour : plusieurs sections, un titre visible par section, aucun pavé de plusieurs
     écrans. */
  const PAGES_REFONDUES: { chemin: string; mini: number; plafonds?: Record<string, number> }[] = [
    /* Quatre sur /strategie : le texte exact fourni par l'équipe tient en trois chapitres, plus le
       bloc des risques qui ferme la page. */
    { chemin: '/strategie/', mini: 4 },
    /* #gamme dépasse quatre écrans sur téléphone depuis le 22/09/2026 : quatre cartes titrées, de
       quatre indicateurs chacune (ceux des pages produit de corum.fr), et cinq notes
       réglementaires en corps de texte (demande de Martin). Ce n'est pas un pavé sans titre, ce
       que le garde-fou traque ; plafond porté à six écrans pour cette section seule (elle en fait
       cinq sur l'iPhone 13, dont la fenêtre ne fait que 664 px de haut). */
    { chemin: '/a-propos/', mini: 2, plafonds: { gamme: 6 } },
    { chemin: '/presse/', mini: 4 },
  ];
  for (const { chemin, mini, plafonds = {} } of PAGES_REFONDUES) {
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
      const contenu = releve;
      expect(contenu.length).toBeGreaterThanOrEqual(mini);
      expect(contenu.filter((s) => !s.titre || s.cache).map((s) => s.id)).toEqual([]);
      expect(
        contenu
          .filter((s) => s.ecrans > (plafonds[s.id] ?? 4))
          .map((s) => `${s.id} ${s.ecrans.toFixed(1)} écrans`)
      ).toEqual([]);
    });
  }

  /* Demande de l'équipe : jamais de bloc sombre juste après l'en-tête, lui-même sombre (sur
     /strategie, la page semblait commencer au deuxième écran). Vaut pour toutes les sous-pages. */
  test('aucune sous-page n’enchaîne deux blocs sombres après l’en-tête', async ({ page }) => {
    const fautifs: string[] = [];
    for (const chemin of PAGES.filter((p) => p !== '/')) {
      await page.goto(chemin);
      const releve = await page.evaluate(() => {
        /* Luminance relative approchée du fond : 0 = noir, 1 = blanc. */
        const clarte = (el: Element) => {
          const canaux = getComputedStyle(el).backgroundColor.match(/\d+/g);
          if (!canaux) return 1;
          const [r = 0, v = 0, b = 0] = canaux.map(Number);
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

  /* Tant que la souscription n'est pas ouverte (config/site.ts, subscribeOpen), AUCUN CTA «
     Souscrire » ne quitte le site : le clic ouvre la fenêtre d'attente. Un repérage par le mot «
     placeholder » dans l'URL du tunnel était mangé par le découpage des commentaires du .env : tous
     les boutons partaient sur corum.fr. */
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

  /* CHAQUE BOUTON A SA PEAU ET SE VOIT SUR SON FOND : `btn-light` et `btn-lg`, composés
     dynamiquement dans Button.astro, n'étaient pas générés par Tailwind (texte nu), et un contour
     blanc a été posé sur une section blanche. Pour chaque `.btn` visible : rembourrage et contraste
     texte / fond effectif, en remontant les ancêtres et en composant les fonds translucides ; un
     ancêtre à image de fond rend la mesure incertaine, ce bouton-là est sauté. */
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
          const [r = 0, g = 0, b = 0, a = 0] = ctx.getImageData(0, 0, 1, 1).data;
          return { r, g, b, a: a / 255 };
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
            const [x = 0, y = 0] = [lum(texte), lum(base)].sort((m, n) => n - m);
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

  /* Survol d'un lien de contenu (14/09/2026, « le trait est sur le texte ») : le soulignement
     apparaît AU SURVOL, sous les jambages, et une seule fois. */
  test('le soulignement des liens apparaît au survol, sous le texte', async ({ page }) => {
    await page.goto('/presse/');
    /* Cible : les contacts presse (zone 4), qui portent l'utilitaire `link-underline`. */
    const lien = page.locator('#contacts-presse a').first();
    await lien.scrollIntoViewIfNeeded();

    /* Relevés en `expect.poll` : la couleur du trait est en TRANSITION (220 ms), un relevé unique
       tombait sur un état intermédiaire. */
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

  /* Pied de page : un retour en haut sur chaque page (jusqu'à quinze écrans), des liens cliquables
     au doigt. */
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

  /* Plan de taggage : sans test, un attribut renommé fait disparaître un événement sans que rien ne
     le dise, et les mesures ne reviennent jamais rétroactivement. La file `dataLayer` existe avant
     GTM et lui est rejouée : tout se vérifie sans conteneur. */
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

  /* ARRIVÉE DEPUIS GOOGLE SANS PARAMÈTRE : la convention de corum.fr, dont les trois valeurs existent
     dans le référentiel du CRM (src/scripts/campagne.ts). Elle vaut pour la visite, comme une
     campagne d'entrée, et accompagne les événements. */
  test('une arrivée depuis Google sans paramètre vaut la campagne « organique » de corum.fr', async ({
    page,
  }) => {
    await page.goto('/', { referer: 'https://www.google.com/' });
    const lue = () =>
      page.evaluate(() => JSON.parse(sessionStorage.getItem('rstart_campagne') ?? '{}'));
    expect(await lue()).toEqual({
      utm_source: 'google',
      utm_medium: 'organic',
      utm_campaign: 'fr_g_organic',
    });

    await page.goto('/frais/');
    expect(await lue(), 'une page interne ne l’efface pas').toMatchObject({ utm_source: 'google' });
    await page.locator('[data-comparator-select]').selectOption({ index: 1 });
    const [premier] = await evenements(page);
    expect(premier?.campagne_source).toBe('google');
    expect(premier?.campagne_nom).toBe('fr_g_organic');
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
});
