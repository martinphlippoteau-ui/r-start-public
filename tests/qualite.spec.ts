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
   * UNE SEULE FORME D'ADRESSE (audit du 18/09/2026). Le site est publié en dossiers, et l'hébergeur
   * renvoie « /frais » vers « /frais/ » : chaque lien sans barre finale payait une redirection. Le
   * serveur de test redirige maintenant comme lui, et ce test échoue au premier lien qui en paie une.
   */
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

  /*
   * LA BARRE TIENT À TOUTES LES LARGEURS DE BUREAU (20/09/2026). Avec le simulateur, elle porte six
   * entrées, qui ne tiennent pas entre 1024 et 1180 px environ : la liste gardait toute sa largeur,
   * ÉCRASAIT le logo (36 px de large à 1024) et passait sous la loupe. Elle doit alors défiler dans sa
   * colonne, avec son fondu, logo et loupe entiers ; et ne pas défiler du tout quand elle tient.
   */
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

  /*
   * TOUS LES ÉVÉNEMENTS PASSENT PAR LE MÊME CANAL (audit du 18/09/2026). « souscription_indisponible »
   * est l'issue de tous les clics Souscrire tant que le tunnel est fermé, et il partait sans le type
   * de page ni la campagne d'entrée, écrit directement dans le dataLayer.
   */
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

  /*
   * DONNÉES STRUCTURÉES ET ANCRES (audit du 18/09/2026).
   *  - La réponse balisée reprend TOUT ce que la page affiche : le tableau des frais manquait, et la
   *    réponse sur les frais ne disait plus que « aucun frais quand vous investissez ».
   *  - /frais ne balise plus une FAQ que personne ne peut lire.
   *  - Les ancres des pages légales plient les accents au lieu de les remplacer par des tirets.
   *  - La page d'essai interne n'est jamais indexable.
   */
  test('données structurées fidèles à la page, ancres légales lisibles, page d’essai hors index', async ({
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

    await page.goto('/test/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  /*
   * COMPARATEUR DE FRAIS, trois défauts de l'audit du 18/09/2026.
   *  1. Une SCPI sans valeur sur une ligne héritait de la pastille « taux le plus bas » de la SCPI
   *     choisie avant elle. Le cas n'existe pas dans les données d'aujourd'hui : la page est servie avec
   *     une valeur retirée exprès.
   *  2. Sur téléphone, l'en-tête de colonne « Frais » était en `display: none`, donc hors de l'arbre
   *     d'accessibilité : les taux étaient annoncés sous l'en-tête de la mauvaise SCPI.
   *  3. Un panneau « i » replié restait lu par les lecteurs d'écran.
   */
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

  /*
   * SANS JAVASCRIPT, LE DÉTAIL DES CARTES DE /strategie SE LIT (audit du 18/09/2026) : écrit en sable et
   * blanc pour le dos sombre des cartes, il restait sur le fond clair de la section, à 1,17:1.
   */
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

  /*
   * SANS JAVASCRIPT, SOUS « lg », ON NAVIGUE ENCORE (audit du 18/09/2026). Le bouton Menu n'ouvre rien
   * sans script : il disparaît, et la liste des pages revient dans la barre. Et la loupe, qui n'ouvre
   * rien non plus sans script, reste masquée.
   */
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
    /* Six entrées depuis le 19/09/2026 : le simulateur est entré au menu. */
    await expect(liens).toHaveCount(6);
    await expect(liens.first()).toBeVisible();
    await contexte.close();
  });

  /*
   * À L'IMPRESSION, TOUT CE QUI EST ÉCRIT SORT SUR LE PAPIER (audit du 18/09/2026). Les moteurs
   * d'animation posent `opacity: 0` en ligne sur ce qui attend sous l'écran : sans règle d'impression,
   * ces blocs s'imprimaient blancs, sous la barre et le bandeau de consentement.
   */
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

  /*
   * LE HERO DÉFILE COMME LE RESTE DE LA PAGE (19/09/2026, demande de Martin). Du 17 au 19/09/2026, un
   * script le faisait franchir d'un seul geste : le premier cran de molette menait au contenu, le
   * suivant vers le haut ramenait au hero. Il est retiré. Un cran avance d'un cran, dès le premier
   * pixel, et plus aucun écouteur `wheel` ou `touchmove` non passif n'attend sur la page : le navigateur
   * défile sans consulter aucun script. Les écouteurs sont lus par le protocole du navigateur.
   */
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

  /*
   * L'INVITATION À DÉFILER RESTE UN LIEN QUI MARCHE SEUL. Le script retiré l'interceptait pour jouer son
   * propre trajet ; c'est maintenant une ancre ordinaire, que le navigateur suit : la section visée
   * arrive en haut de l'écran, sous la barre (`scroll-padding-top`).
   */
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

  /*
   * TOUTE PASTILLE FLOTTANTE A SON ÉQUIVALENT DANS LE FLUX (audit du 18/09/2026). Les pastilles sont
   * rendues après </main> : au clavier, on ne les atteint qu'en bas de page, où celle du comparateur est
   * repliée depuis longtemps (`visibility: hidden`). Ce n'est acceptable que si la même destination est
   * offerte par un lien de <main>, que la tabulation rencontre en chemin.
   */
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

  /*
   * LE CONSENT MODE ARRIVE À GTM SOUS LA FORME QU'IL ATTEND (audit du 18/09/2026). GTM ne lit une
   * commande gtag que si l'entrée du dataLayer est un objet Arguments. `gtag(...args)` y poussait un
   * tableau : ni le refus par défaut, ni l'accord, ni le retrait n'arrivaient au conteneur, et rien ne
   * le signalait. Le test suit les trois temps, dont le retrait après accord, celui qui compte.
   */
  /*
   * UN RETRAIT DE CONSENTEMENT QUI RETIRE VRAIMENT (audit du 18/09/2026). Les cookies `_ga` survivaient
   * treize mois à un refus donné après un accord, et l'identifiant client, lu dans `_ga` sans regarder
   * le consentement, continuait de partir vers le tunnel. Le lien du tunnel est simulé : tant que la
   * souscription est fermée, les CTA du site sont internes et le module n'a rien à étiqueter.
   */
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
    expect(avec, 'avec accord : l’identifiant client part').toContain('cid=123456789.1700000000');
    expect(avec).toContain('gclid=clic123');

    await page.locator('[data-consent-open]').first().click();
    await page.locator('[data-consent-refuse]').click();
    const sans = await lienDuTunnel();
    expect(sans, 'après retrait : plus d’identifiant client').not.toContain('cid=');
    expect(sans, 'ni d’identifiant de clic').not.toContain('gclid=');
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
