import { test, expect, type Page } from '@playwright/test';
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

/**
 * Accusé de lecture des outils, posé AVANT le script de la page : la fenêtre d'acceptation
 * (ToolsGate.astro) ne s'ouvre pas. À utiliser dans les tests qui visent les outils eux-mêmes ; la
 * fenêtre a son propre test, plus bas.
 */
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

const sauterLaFenetreOutils = (page: Page) =>
  page.addInitScript(() => {
    try {
      sessionStorage.setItem('rstart_outils_compris', '1');
    } catch {
      /* stockage indisponible : la fenêtre s'ouvrira, le test le dira */
    }
  });

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
    await allerA(page, hauteur, empreinte);
    expect(
      await page.evaluate(() =>
        [...document.querySelectorAll('[data-sticky-cta]')].map((b) => b.hasAttribute('data-on'))
      )
    ).toEqual([false, true]);
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
   * Fenêtre d'acceptation des outils : elle barre l'entrée tant que le visiteur n'a pas accusé lecture.
   * Ce qui est vérifié : elle s'ouvre en MODALE (le reste de la page devient inerte, ce qu'aucun
   * bricolage maison ne reproduit), Échap ne la referme pas, le bouton reste inerte tant que la case
   * n'est pas cochée, et l'accusé vaut pour la session entière.
   */
  test('la fenêtre d’acceptation barre l’entrée des outils', async ({ page }) => {
    await page.goto('/outils/');

    const fenetre = page.locator('[data-tools-gate]');
    const entrer = page.locator('[data-tools-gate-enter]');

    expect(
      await page.evaluate(() => document.querySelector('[data-tools-gate]')!.matches(':modal'))
    ).toBe(true);
    /* Le contenu déplacé depuis la page est bien là, avantage ET contre-poids. */
    await expect(fenetre.locator('[data-advantage]')).toHaveCount(1);
    await expect(fenetre.locator('[data-risk]')).toHaveCount(1);
    await expect(entrer).toBeDisabled();

    await page.keyboard.press('Escape');
    expect(await fenetre.evaluate((d: HTMLDialogElement) => d.open)).toBe(true);

    await page.locator('[data-tools-gate-check]').check();
    await expect(entrer).toBeEnabled();
    await entrer.click();
    expect(await fenetre.evaluate((d: HTMLDialogElement) => d.open)).toBe(false);
    expect(await page.evaluate(() => sessionStorage.getItem('rstart_outils_compris'))).toBe('1');

    /* L'accusé vaut pour la session : la page d'outil suivante n'ouvre plus rien. */
    await page.goto('/outil/simulateur-de-frais/');
    expect(await fenetre.evaluate((d: HTMLDialogElement) => d.open)).toBe(false);
  });

  /*
   * Niveaux d'expertise des outils. La bascule est en CSS pure (global.css) : aucun typage ne la
   * protège, et un sélecteur déplacé la casserait en silence. Le test vérifie les trois paliers, et
   * surtout que le RÉSULTAT ne dépend pas du niveau : un champ masqué garde sa valeur, le calcul est
   * le même. C'est la promesse faite au visiteur sous le sélecteur.
   */
  test('les niveaux d’expertise révèlent les champs sans changer le calcul', async ({ page }) => {
    await sauterLaFenetreOutils(page);
    await page.goto('/outil/simulateur-de-frais/');

    /*
     * On compte les champs OUVERTS par le niveau, pas les champs à l'écran : depuis le passage en
     * tunnel, une seule étape s'affiche à la fois. Un champ masqué par le niveau a `display: none` sur
     * son enveloppe, et cette valeur reste lisible même quand son étape est repliée, là où une mesure
     * de visibilité ne verrait que l'étape courante.
     */
    const champs = () =>
      page.evaluate(
        () =>
          [...document.querySelectorAll('[data-tool="frais"] [data-level]')].filter(
            (e) => e.querySelector('input') && getComputedStyle(e).display !== 'none'
          ).length
      );

    expect(await champs()).toBe(2);
    const totalDebutant = await page.locator('#frais-out-rstart').textContent();

    await page.click('label[for="frais-niveau-intermediaire"]');
    expect(await champs()).toBe(4);

    await page.click('label[for="frais-niveau-expert"]');
    expect(await champs()).toBe(6);
    expect(await page.locator('#frais-out-rstart').textContent()).toBe(totalDebutant);

    await page.click('label[for="frais-niveau-debutant"]');
    expect(await champs()).toBe(2);
  });

  /*
   * Le tunnel de simulation : une étape à la fois, un fil qui suit, et le niveau qui décide du nombre
   * d'étapes. Sans script toutes les étapes seraient là, ce qui reste le repli ; avec script il ne doit
   * y en avoir qu'une, et « Suivant » doit mener au résultat en enjambant les étapes fermées.
   */
  test('le tunnel de simulation avance étape par étape', async ({ page }) => {
    await sauterLaFenetreOutils(page);
    await page.goto('/outil/simulateur-de-frais/');
    await expect(page.locator('[data-funnel][data-funnel-ready]')).toHaveCount(1);

    const visibles = () =>
      page.evaluate(
        () =>
          [...document.querySelectorAll('[data-funnel-step]')].filter(
            (e) => !(e as HTMLElement).hidden
          ).length
      );
    const progres = () => page.locator('[data-funnel-progress]').textContent();

    /* Débutant : deux questions, puis le résultat. */
    expect(await visibles()).toBe(1);
    expect(await progres()).toBe('Étape 1 sur 3');

    await page.click('[data-funnel-next]');
    expect(await progres()).toBe('Étape 2 sur 3');
    await page.click('[data-funnel-next]');
    expect(await progres()).toBe('Étape 3 sur 3');
    expect(await visibles()).toBe(1);
    await expect(page.locator('[data-funnel-next]')).toBeHidden();
    await expect(page.locator('[data-funnel-restart]')).toBeVisible();

    /*
     * Expert depuis le résultat : deux étapes s'ouvrent, et l'on RESTE sur le résultat. La position est
     * tenue par l'étape, pas par son rang ; un rang mémorisé aurait désigné la troisième question.
     */
    await page.click('label[for="frais-niveau-expert"]');
    /* Six questions au niveau expert, plus le résultat : le fil s'allonge sans qu'on quitte la réponse. */
    expect(await progres()).toBe('Étape 7 sur 7');
    await expect(page.locator('[data-funnel-restart]')).toBeVisible();

    await page.click('[data-funnel-restart]');
    expect(await progres()).toBe('Étape 1 sur 7');
  });

  /* Chaque carte de /outils doit mener à une page qui existe et porte son titre. */
  test('les cartes de la page Outils mènent aux quatre outils', async ({ page }) => {
    await sauterLaFenetreOutils(page);
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
