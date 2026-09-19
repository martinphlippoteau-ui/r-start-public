import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * RECHERCHE DU SITE (17/09/2026) : la loupe de la barre, le panneau qui s'allonge sous elle, l'index
 * tiré du HTML au build (scripts/search-index.mjs) et l'arrivée sur le passage (src/scripts/recherche.ts,
 * src/scripts/faqAncre.ts).
 *
 * Ce que ces tests tiennent : il n'y a PAS de page de résultats, les résultats se rangent en « Pages »
 * puis « Questions », les fautes de frappe et les synonymes sont tolérés, un résultat mène au passage
 * exact, l'index n'est pas téléchargé par une visite qui ne cherche rien, et les recherches partent
 * dans le plan de taggage.
 */

const ouvrir = async (page: Page) => {
  await page.locator('[data-consent-refuse]').click();
  await page.locator('[data-recherche-ouvrir]').click();
  await expect(page.locator('[data-recherche-champ]')).toBeFocused();
};

/* Espaces normalisées : les libellés portent une espace fine insécable avant « ? » et « : ». */
const titres = async (page: Page, rubrique: 'pages' | 'questions') =>
  (
    await page
      .locator(`[data-recherche-resultats] a[data-rubrique="${rubrique}"] [data-titre]`)
      .allTextContents()
  ).map((t) => t.replace(/\s/g, ' '));

const evenements = (page: Page) =>
  page.evaluate(() =>
    ((window as unknown as { dataLayer?: Record<string, unknown>[] }).dataLayer ?? [])
      .filter((x) => x && typeof x.event === 'string')
      .map((x) => x as Record<string, unknown>)
  );

test.describe('Recherche du site', () => {
  test('la loupe ouvre le panneau sur les liens rapides, Échap le referme', async ({ page }) => {
    const index: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('recherche.json')) index.push(req.url());
    });
    await page.goto('/frais/');
    await page.waitForLoadState('load');
    expect(index, 'aucun index téléchargé sans intention de chercher').toEqual([]);

    const loupe = page.locator('[data-recherche-ouvrir]');
    await ouvrir(page);
    await expect(loupe).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[data-recherche-rapides] a')).toHaveCount(5);
    await expect(page.locator('[data-recherche-rapides] a').first()).toBeVisible();
    await expect.poll(() => index.length, 'index demandé à l’ouverture').toBeGreaterThan(0);

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-recherche-panneau]')).toBeHidden();
    await expect(loupe).toHaveAttribute('aria-expanded', 'false');
    await expect(loupe).toBeFocused();
  });

  test('les résultats se rangent en Pages puis Questions, fautes et synonymes compris', async ({
    page,
  }) => {
    await page.goto('/presse/');
    await ouvrir(page);
    const champ = page.locator('[data-recherche-champ]');

    await champ.fill('frais');
    await expect(page.locator('[data-recherche-resultats] [data-rubrique-titre]')).toHaveText([
      'Pages',
      'Questions',
    ]);
    expect((await titres(page, 'pages')).length).toBeGreaterThan(0);
    expect(await titres(page, 'questions')).toContain('Quels sont les frais de R Start ?');
    await expect(page.locator('[data-recherche-resultats] mark').first()).toBeVisible();

    /* Faute de frappe : une lettre en moins. */
    await champ.fill('jouisance');
    await expect
      .poll(() => titres(page, 'questions'))
      .toContainEqual(expect.stringContaining('délai de jouissance'));

    /* Synonyme : « impôts » n'est écrit nulle part, « imposés » l'est. */
    await champ.fill('impôts');
    await expect
      .poll(() => titres(page, 'questions'))
      .toContain('Comment sont imposés les revenus de R Start ?');
  });

  /*
   * LA HAUTEUR NE BOUGE PAS (17/09/2026, demande de Martin) : le panneau ouvert a la hauteur du panneau
   * vide, et les résultats sont rognés pour y tenir, sans défilement. Le verre est celui de la barre.
   */
  test('le panneau garde la hauteur du panneau vide et le verre de la barre', async ({ page }) => {
    await page.goto('/frais/');
    const barre = page.locator('[data-sitenav-bar]');
    const verreBarre = await barre.evaluate((b) => getComputedStyle(b).backgroundColor);
    await ouvrir(page);
    const panneau = page.locator('[data-recherche-panneau]');
    /* Le mouvement d'ouverture doit être fini : la hauteur du panneau vide est la référence. */
    await expect
      .poll(() => panneau.evaluate((p) => Math.round(p.getBoundingClientRect().height)))
      .toBe(await panneau.evaluate((p) => Math.round(parseFloat(p.style.height))));
    const hauteurVide = await panneau.evaluate((p) => Math.round(p.getBoundingClientRect().height));
    expect(hauteurVide).toBeGreaterThan(200);
    /* Le panneau est `fixed` : il doit se caler exactement sur la boîte de la barre. */
    const boite = (cible: typeof barre) =>
      cible.evaluate((el) => {
        const b = el.getBoundingClientRect();
        return [Math.round(b.left), Math.round(b.top), Math.round(b.width)];
      });
    expect(await boite(panneau), 'panneau calé sur la barre').toEqual(await boite(barre));
    /* Un seul verre à la fois : le panneau a pris la teinte de la barre, la barre l'a éteinte. */
    expect(await panneau.evaluate((p) => getComputedStyle(p).backgroundColor)).toBe(verreBarre);
    expect(await barre.evaluate((b) => getComputedStyle(b).backgroundColor)).toMatch(/, 0\)$/);

    await page.locator('[data-recherche-champ]').fill('frais');
    await expect(page.locator('[data-recherche-resultats] a').first()).toBeVisible();
    expect(await panneau.evaluate((p) => Math.round(p.getBoundingClientRect().height))).toBe(
      hauteurVide
    );
    const liste = page.locator('[data-recherche-defilement]');
    expect(
      await liste.evaluate((l) => l.scrollHeight - l.clientHeight),
      'les résultats tiennent sans défiler'
    ).toBeLessThanOrEqual(1);
    expect(await page.locator('[data-recherche-resultats] a').count()).toBeGreaterThanOrEqual(2);

    /* Fermé : le panneau est masqué et la barre a retrouvé son verre. */
    await page.keyboard.press('Escape');
    await expect(panneau).toBeHidden();
    expect(await barre.evaluate((b) => getComputedStyle(b).backgroundColor)).toBe(verreBarre);
  });

  /*
   * La page ne défile pas sous le panneau, SANS `overflow: hidden` : ce verrou retirait la barre de
   * défilement et recentrait la page, ou laissait une gouttière vide. Ce sont les gestes qui sont
   * neutralisés (src/scripts/verrou.ts, partagé avec le tiroir du menu). Et la fermeture rend le
   * défilement.
   */
  test('la page ne défile pas sous le panneau, et redéfile après', async ({ page, isMobile }) => {
    /* Bureau seulement : au doigt, c'est `touchmove` qui est neutralisé, et Playwright n'a pas de geste
       de défilement tactile ; sa molette en émulation mobile contourne l'événement `wheel` de la page. */
    test.skip(isMobile, 'la molette est un geste de bureau');
    await page.goto('/strategie/');
    await page.locator('[data-consent-refuse]').click();
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(300);
    /* Clic par coordonnées : `locator.click` fait défiler jusqu'au bouton et fausserait la mesure. */
    const loupe = await page.locator('[data-recherche-ouvrir]').boundingBox();
    if (!loupe) throw new Error('loupe introuvable');
    await page.mouse.click(loupe.x + loupe.width / 2, loupe.y + loupe.height / 2);
    await expect(page.locator('[data-recherche-champ]')).toBeFocused();
    expect(
      await page.evaluate(() => [
        document.documentElement.style.overflow,
        document.documentElement.hasAttribute('data-verrou'),
      ]),
      'la barre de défilement reste, le verrou est marqué'
    ).toEqual(['', true]);

    const vue = page.viewportSize() ?? { width: 1440, height: 900 };
    await page.mouse.move(vue.width / 2, vue.height * 0.8);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => Math.round(window.scrollY)), 'molette neutralisée').toBe(200);

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-recherche-panneau]')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-verrou'))).toBe(
      false
    );
    await page.mouse.wheel(0, 600);
    await expect
      .poll(() => page.evaluate(() => Math.round(window.scrollY)), 'la molette redéfile')
      .toBeGreaterThan(200);
  });

  /*
   * TAPER NE DÉPLACE PAS LA PAGE (18/09/2026). Le panneau était `absolute` dans l'enveloppe `sticky` de
   * la barre : Chromium déplaçait la page de quatre pixels à chaque frappe pour « révéler » le champ,
   * dont il calculait la position statique. Vingt pixels perdus en tapant « frais », sans retour.
   */
  test('taper dans le champ ne déplace pas la page', async ({ page }) => {
    await page.goto('/presse/');
    await page.locator('[data-consent-refuse]').click();
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(300);
    const loupe = await page.locator('[data-recherche-ouvrir]').boundingBox();
    if (!loupe) throw new Error('loupe introuvable');
    await page.mouse.click(loupe.x + loupe.width / 2, loupe.y + loupe.height / 2);
    await expect(page.locator('[data-recherche-champ]')).toBeFocused();
    const depart = await page.evaluate(() => Math.round(window.scrollY));

    await page.keyboard.type('frais', { delay: 80 });
    await expect(page.locator('[data-recherche-resultats] a').first()).toBeVisible();
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(depart);
  });

  test('sans résultat, le panneau le dit et renvoie vers toutes les questions', async ({
    page,
  }) => {
    await page.goto('/a-propos/');
    await ouvrir(page);
    await page.locator('[data-recherche-champ]').fill('xylophone');
    const vide = page.locator('[data-recherche-vide]');
    await expect(vide).toBeVisible();
    await expect(vide).toContainText('« xylophone »');
    await expect(vide.locator('a')).toHaveAttribute('href', /\/faq\/$/);
  });

  test('Entrée mène à la question, ouverte sous la barre', async ({ page }) => {
    await page.goto('/presse/');
    await ouvrir(page);
    await page.locator('[data-recherche-champ]').fill('démembrement');
    await expect(page.locator('[data-recherche-resultats] a').first()).toBeVisible();

    await Promise.all([page.waitForURL(/\/faq\/?#question-/), page.keyboard.press('Enter')]);
    expect(new URL(page.url()).search, 'aucune page de résultats').toBe('');

    const question = page.locator('details[data-faq]:target');
    await expect(question).toHaveAttribute('open', '');
    await expect
      .poll(() => question.evaluate((d) => Math.round(d.getBoundingClientRect().top)))
      .toBeLessThan(160);
    await expect(page.locator('[data-recherche-panneau]')).toBeHidden();
  });

  test('un résultat cliqué part dans le plan de taggage', async ({ page }) => {
    await page.goto('/faq/');
    await ouvrir(page);
    await page.locator('[data-recherche-champ]').fill('change');
    const lien = page.locator('[data-recherche-resultats] a[data-rubrique="questions"]').first();
    await expect(lien).toBeVisible();
    await lien.click();

    await expect
      .poll(async () => (await evenements(page)).map((x) => x.event))
      .toEqual(expect.arrayContaining(['recherche', 'recherche_clic']));
    const clic = (await evenements(page)).find((x) => x.event === 'recherche_clic');
    expect(clic?.terme).toBe('change');
    expect(clic?.rubrique).toBe('questions');
    expect(clic?.rang).toBe(1);
  });

  test('le panneau ouvert ne présente aucune violation d’accessibilité sérieuse', async ({
    page,
  }) => {
    await page.goto('/strategie/');
    await ouvrir(page);
    await page.locator('[data-recherche-champ]').fill('risque');
    await expect(page.locator('[data-recherche-resultats] a').first()).toBeVisible();
    /* Le découpage du panneau doit avoir fini de descendre : axe mesure les contrastes à l'écran. */
    await page.waitForTimeout(500);
    const results = await new AxeBuilder({ page })
      .include('[data-recherche-panneau]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });

  /*
   * AUDIT DU 18/09/2026 : sept défauts relevés dans la recherche et le verrou de page, écrits la veille.
   * Chacun a ici le test qui l'aurait attrapé.
   */
  /*
   * SOUS UNE SURFACE MODALE, LA PAGE EST INERTE (audit du 18/09/2026). `aria-modal` et le piège à
   * tabulation n'arrêtent ni le curseur virtuel d'un lecteur d'écran ni le balayage tactile : plusieurs
   * technologies d'assistance laissaient lire la page recouverte par le voile. La barre reste active
   * pendant la recherche, c'est voulu.
   */
  test('la page est inerte sous la recherche, et ne l’est plus après', async ({ page }) => {
    await page.goto('/frais/');
    const inertes = () =>
      page.evaluate(() => ({
        contenu: document.querySelector<HTMLElement>('main')!.inert,
        pied: document.querySelector<HTMLElement>('footer')!.inert,
        barre: document.querySelector<HTMLElement>('[data-sitenav-bar]')!.inert,
      }));
    await ouvrir(page);
    expect(await inertes()).toEqual({ contenu: true, pied: true, barre: false });
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-recherche-panneau]')).toBeHidden();
    expect(await inertes()).toEqual({ contenu: false, pied: false, barre: false });
  });

  test('le verrou de page laisse agrandir, et ses écouteurs partent avec lui', async ({ page }) => {
    await page.goto('/frais/');
    /* Une molette synthétique : on lit seulement si le site l'annule. */
    const annulee = (ctrlKey: boolean) =>
      page.evaluate((ctrl) => {
        const e = new WheelEvent('wheel', {
          deltaY: 100,
          ctrlKey: ctrl,
          bubbles: true,
          cancelable: true,
        });
        document.body.dispatchEvent(e);
        return e.defaultPrevented;
      }, ctrlKey);

    /* Les écouteurs RÉELLEMENT posés sur `document`, lus par le protocole du navigateur : un écouteur
       `wheel` non passif oblige le défilement à attendre le script, il ne doit exister que le temps du
       verrou. Une molette synthétique ne le prouverait pas, le gestionnaire sort sans rien faire. */
    const cdp = await page.context().newCDPSession(page);
    const bloquants = async () => {
      const { result } = await cdp.send('Runtime.evaluate', { expression: 'document' });
      const { listeners } = await cdp.send('DOMDebugger.getEventListeners', {
        objectId: result.objectId!,
      });
      return listeners.filter((l) => (l.type === 'wheel' || l.type === 'touchmove') && !l.passive)
        .length;
    };

    expect(await annulee(false), 'fermé : la page défile librement').toBe(false);
    expect(await bloquants(), 'fermé : aucun écouteur bloquant').toBe(0);
    await ouvrir(page);
    expect(await bloquants(), 'ouvert : la molette et le doigt sont retenus').toBe(2);
    expect(await annulee(false), 'ouvert : la molette ne fait plus défiler la page').toBe(true);
    expect(await annulee(true), 'ouvert : Ctrl + molette agrandit toujours').toBe(false);
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-recherche-panneau]')).toBeHidden();
    expect(await annulee(false), 'refermé : la molette n’est plus retenue').toBe(false);
    expect(await bloquants(), 'refermé : les écouteurs bloquants sont partis').toBe(0);
  });

  test('le tiroir du menu referme la recherche, et Tab y circule', async ({ page, isMobile }) => {
    /* Sous « lg », le seul seuil où le bouton Menu existe ; le clic par coordonnées évite le défilement
       que `locator.click` provoque sur un élément de la barre collante. */
    if (!isMobile) await page.setViewportSize({ width: 800, height: 800 });
    await page.goto('/faq/');
    await ouvrir(page);
    const menu = await page.locator('[data-menu-open]').boundingBox();
    if (!menu) throw new Error('bouton Menu introuvable');
    await page.mouse.click(menu.x + menu.width / 2, menu.y + menu.height / 2);
    await expect(page.locator('[data-menu-panel]')).toHaveAttribute('data-open', '');
    await expect(page.locator('[data-sitenav]')).not.toHaveAttribute('data-recherche-ouverte', '');

    const focus = () =>
      page.evaluate(() => {
        const a = document.activeElement;
        return (a?.textContent ?? '').trim() + '|' + !!a?.closest('[data-menu-panel]');
      });
    const parcours = new Set<string>();
    for (let i = 0; i < 4; i += 1) {
      await page.keyboard.press('Tab');
      parcours.add(await focus());
    }
    expect(parcours.size, 'Tab avance d’un élément à l’autre').toBeGreaterThan(2);
    expect(
      [...parcours].every((f) => f.endsWith('|true')),
      'et reste dans le tiroir'
    ).toBe(true);
  });

  test('Souscrire pendant la recherche : une fenêtre, un Échap, le focus revient à la loupe', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'le bouton de la barre est couvert par le champ sur un petit écran');
    await page.goto('/presse/');
    await ouvrir(page);
    await page.locator('[data-sitenav-bar] [data-cta="souscrire"]').click();
    await expect(page.locator('[data-subscribe-soon]')).toHaveAttribute('open', '');
    await expect(page.locator('[data-sitenav]')).not.toHaveAttribute('data-recherche-ouverte', '');

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-subscribe-soon]')).not.toHaveAttribute('open', '');
    await expect(page.locator('[data-recherche-ouvrir]')).toBeFocused();
  });

  test('le message « aucun résultat » cite ce qui a été tapé, signes « $ » compris', async ({
    page,
  }) => {
    await page.goto('/frais/');
    await ouvrir(page);
    await page.locator('[data-recherche-champ]').fill("$&zzqq$'");
    await expect(page.locator('[data-recherche-vide-texte]')).toHaveText(/« \$&zzqq\$' »/);
  });

  test('sur une fenêtre très basse, il reste toujours un résultat à lire', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'le cas visé est un zoom de 400 % sur un écran de bureau');
    await page.setViewportSize({ width: 320, height: 256 });
    await page.goto('/frais/');
    await ouvrir(page);
    await page.locator('[data-recherche-champ]').fill('frais');
    await expect(page.locator('[data-recherche-resultats] a').first()).toBeAttached();
    expect(await page.locator('[data-recherche-resultats] a').count()).toBeGreaterThanOrEqual(1);
  });

  test('tant que l’index n’est pas arrivé, le panneau le dit à l’écran', async ({ page }) => {
    let liberer: () => void = () => undefined;
    const attente = new Promise<void>((resolve) => (liberer = resolve));
    await page.route('**/recherche.json', async (route) => {
      await attente;
      await route.continue();
    });
    await page.goto('/frais/');
    await ouvrir(page);
    await page.locator('[data-recherche-champ]').fill('frais');
    await expect(page.locator('[data-recherche-vide-texte]')).toHaveText('Recherche en cours…');
    await expect(page.locator('[data-recherche-vide-lien]')).toBeHidden();
    liberer();
    await expect(page.locator('[data-recherche-resultats] a').first()).toBeVisible();
    await expect(page.locator('[data-recherche-vide]')).toBeHidden();
  });

  /*
   * LE FILTRE DE /faq GARDE CHAQUE QUESTION SOUS SA RUBRIQUE (audit du 18/09/2026). Le libellé vivait
   * dans la première question de la rubrique et partait avec elle : « démembrement » ne retient que la
   * deuxième question de « Souscrire et accéder à R Start », qui s'affichait sans intitulé, ou sous
   * celui de la rubrique précédente.
   */
  test('le filtre de la FAQ affiche la rubrique de la première question retenue', async ({
    page,
  }) => {
    await page.goto('/faq/');
    await page.locator('[data-consent-refuse]').click();
    await page.locator('[data-faq-recherche] input').fill('démembrement');
    const retenues = page.locator('[data-faq-liste] > li:not([hidden])');
    await expect(retenues).toHaveCount(1);
    const libelle = retenues.first().locator('[data-faq-rubrique]');
    await expect(libelle).toBeVisible();
    await expect(libelle).toHaveText('Souscrire et accéder à R Start');
    /* Le décompte, écrit à la fin de la frappe, au singulier et sans parenthèses. */
    await expect(page.locator('[data-faq-compte]')).toHaveText('1 question trouvée');

    /* Champ vidé : retour au rendu d'origine, un libellé par rubrique et pas un de plus. */
    await page.locator('[data-faq-recherche] input').fill('');
    await expect(page.locator('[data-faq-liste] [data-faq-rubrique]:visible')).toHaveCount(6);
  });

  test('une ancre mal encodée ne casse pas l’ouverture des questions', async ({ page }) => {
    const erreurs: string[] = [];
    page.on('pageerror', (e) => erreurs.push(String(e)));
    await page.goto('/faq/#%E0');
    await page.locator('[data-consent-refuse]').click();
    const id = await page.locator('details[data-faq]').nth(3).getAttribute('id');
    await page.evaluate((h) => {
      location.hash = h ?? '';
    }, id);
    await expect(page.locator(`[id="${id}"]`)).toHaveAttribute('open', '');
    expect(erreurs, 'aucune erreur de script').toEqual([]);
  });

  test('la loupe tient dans la barre, jusqu’à 360 px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/frais/');
    const barre = await page.locator('[data-sitenav-bar]').evaluate((b) => {
      const r = b.getBoundingClientRect();
      const enfants = [...b.children].filter((c) => getComputedStyle(c).display !== 'none');
      return {
        deborde: b.scrollWidth - b.clientWidth,
        sortis: enfants.filter((c) => c.getBoundingClientRect().right > r.right + 0.5).length,
      };
    });
    expect(barre).toEqual({ deborde: 0, sortis: 0 });
    await expect(page.locator('[data-recherche-ouvrir]')).toBeVisible();
  });
});
