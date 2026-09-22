import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * SIMULATEUR (/simulateur). Trois choses tiennent la page : la FENÊTRE D'ACCÈS, là dès le premier
 * pixel ; AUCUN TAUX SUPPOSÉ À R START, rien n'est présélectionné et le parcours ne se termine pas
 * sans que le visiteur ait choisi un taux (le build vérifie le HTML d'arrivée, la suite ne se lit
 * que dans un navigateur) ; le PARCOURS, une question à la fois. Le calcul est éprouvé sans
 * navigateur dans tests/simulateur-moteur.spec.ts.
 */

const texte = (page: Page, selecteur: string) =>
  page
    .locator(selecteur)
    .evaluateAll((els) => els.map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim()));

/** Arrive sur la page, accepte la fenêtre d'accès, écarte le bandeau de consentement. */
const entrer = async (page: Page) => {
  await page.goto('/simulateur/');
  await page.locator('[data-simu-accepter]').click();
  await expect(page.locator('[data-simu-acces]')).toBeHidden();
  await page.locator('[data-consent-refuse]').click();
};
const continuer = (page: Page) => page.locator('[data-simu-suivant]').click();
/** Le montant part de zéro : on le pose par une suggestion. */
const montant = (page: Page, euros = 20_000) =>
  page.locator(`[data-simu-puce="initial"][data-v="${euros}"]`).click();
/** L'écran change dans une transition de vue, une image après le clic : l'étape se lit en attendant. */
const etape = (page: Page, n: number) =>
  expect(page.locator('[data-simu-etape-libelle]')).toHaveText(new RegExp(`${n} sur 4`));

/** Va jusqu'à l'écran de résultat : 20 000 €, versement et revenus au choix, repère de marché. */
const simuler = async (page: Page, { mensuel = 0, reinvestir = false } = {}) => {
  await entrer(page);
  await montant(page);
  await continuer(page);
  if (mensuel) await page.locator(`[data-simu-puce="monthly"][data-v="${mensuel}"]`).click();
  await continuer(page);
  if (reinvestir) await page.locator('[data-simu-reinvestir="1"]').click();
  await continuer(page);
  await page.locator('[data-simu-repere]').first().click();
  await continuer(page);
  await expect(page.locator('[data-simu-etat="sorties"]')).toBeVisible();
};

test.describe('Simulateur : la fenêtre d’accès', () => {
  /* ELLE EST LÀ AVANT TOUT SCRIPT (« la première étape du simulateur se charge en effet flicker
     avant la popup », Martin) : ouverte par `showModal()`, elle n'apparaissait qu'à l'exécution
     d'un module différé. Le test retarde tous les scripts d'une demi-seconde et regarde la page
     pendant ce temps. ET ON LA VOIT, IMAGE PAR IMAGE (« il y a toujours un effet flick ») : lire le
     DOM ne suffit pas, la fenêtre y était alors que son voile entrait en fondu. Le relevé porte sur
     l'opacité effective, celle de l'élément multipliée par celles de ses ancêtres : ce qui est
     réellement peint. */
  test('elle est affichée avant que le moindre script ne s’exécute', async ({ page }) => {
    await page.addInitScript(() => {
      const opacite = (el: Element | null): number => {
        let o = 1;
        for (let n = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
        return el ? o : 0;
      };
      const releves: { voile: number; fenetre: number; question: number }[] = [];
      (window as unknown as { __releves: typeof releves }).__releves = releves;
      const image = () => {
        releves.push({
          voile: opacite(document.querySelector('[data-simu-acces-voile]')),
          fenetre: opacite(document.querySelector('[data-simu-acces]')),
          question: opacite(document.querySelector('[data-simu-corps="initial"]')),
        });
        requestAnimationFrame(image);
      };
      requestAnimationFrame(image);
    });
    await page.route(/\.js(\?|$)/, async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.continue();
    });
    await page.goto('/simulateur/', { waitUntil: 'commit' });
    await page.waitForTimeout(900);
    const releves = await page.evaluate(
      () =>
        (window as unknown as { __releves: { voile: number; fenetre: number; question: number }[] })
          .__releves
    );
    expect(releves.length, 'images relevées').toBeGreaterThan(10);
    const nu = releves
      .map((r, i) => ({ ...r, i }))
      .filter((r) => r.question > 0 && (r.voile < 1 || r.fenetre < 1));
    expect(nu, 'images où la question se voit sans la fenêtre pleinement opaque').toEqual([]);
    expect(
      releves.filter((r) => r.voile < 1 || r.fenetre < 1),
      'images où la fenêtre n’est pas pleinement opaque'
    ).toEqual([]);
  });

  /* RIEN NE PASSE AU-DESSUS D'ELLE EN ARRIVANT PAR LE MENU (« le chargement de cette page n'est
     toujours pas ok », Martin). La transition entre pages peint tout élément nommé dans sa propre
     couche, au-dessus du reste : la carte du simulateur et la barre recouvraient la fenêtre
     d'accès, ce qu'une arrivée directe ne peut pas voir. La fenêtre est extraite à son tour et doit
     venir APRÈS la barre. Relevé à `pagereveal` : la barre, sa pastille, la fenêtre, rien
     d'autre. */
  test('en arrivant par le menu, rien du simulateur ne passe devant la fenêtre', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.addEventListener('pagereveal', (e) => {
        /* Le plan d'un élément : le `z-index` de l'enfant de <body> qui le porte. */
        const plan = (el: Element): number => {
          let n: Element | null = el;
          while (n?.parentElement && n.parentElement !== document.body) n = n.parentElement;
          return n ? Number(getComputedStyle(n).zIndex) || 0 : 0;
        };
        /* `root` est le nom que le navigateur donne à la page elle-même, pas une extraction. */
        const noms: Record<string, number> = {};
        for (const el of document.querySelectorAll('*')) {
          const nom = getComputedStyle(el).viewTransitionName;
          if (nom && nom !== 'none' && nom !== 'root') noms[nom] = plan(el);
        }
        (window as unknown as { __revele: unknown }).__revele = {
          transition: !!(e as Event & { viewTransition?: unknown }).viewTransition,
          noms,
        };
      });
    });
    await page.goto('/');
    await page.evaluate(() => {
      const lien = document.querySelector<HTMLAnchorElement>('a[href$="/simulateur/"]');
      if (lien) location.href = lien.href;
    });
    await page.waitForURL('**/simulateur/');
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __revele?: unknown }).__revele))
      .toBeTruthy();
    const revele = (await page.evaluate(
      () => (window as unknown as { __revele: unknown }).__revele
    )) as { transition: boolean; noms: Record<string, number> };
    expect(revele.transition, 'la page est arrivée par une transition de vue').toBe(true);
    expect(Object.keys(revele.noms).sort()).toEqual(['barre-nav', 'pastille-nav', 'simu-acces']);
    expect(
      revele.noms['simu-acces'],
      'la fenêtre sur un plan plus haut que la barre'
    ).toBeGreaterThan(revele.noms['barre-nav'] ?? 0);
  });

  test('le simulateur est hors d’atteinte derrière elle', async ({ page }) => {
    await page.goto('/simulateur/');
    const fenetre = page.locator('[data-simu-acces]');
    await expect(fenetre).toBeVisible();
    expect(
      await page.locator('[data-simulateur]').evaluate((el) => (el as HTMLElement).inert)
    ).toBe(true);
    /* Le focus est sur le titre, pas sur « J'ai compris » : Entrée ne valide pas ce qu'on n'a pas lu. */
    await expect(fenetre.locator('h2')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(fenetre).toBeVisible();
    /* Ni Échap, ni un clic sur le voile ne la referment. */
    await page.keyboard.press('Escape');
    await page.mouse.click(5, 5);
    await expect(fenetre).toBeVisible();
    /* La page derrière est inerte (src/scripts/verrou.ts) : la tabulation ne peut pas en sortir. */
    const dehors: string[] = [];
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Tab');
      const ou = await page.evaluate(() => {
        const actif = document.activeElement;
        if (!actif || actif === document.body) return null;
        return actif.closest('[data-simu-acces]')
          ? null
          : `${actif.tagName} ${(actif.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 30)}`;
      });
      if (ou) dehors.push(ou);
    }
    expect(dehors, 'le focus ne sort jamais de la fenêtre').toEqual([]);
    /* Deux issues : accepter, ou repartir vers l'accueil. */
    await expect(fenetre.locator('a[href]')).toHaveAttribute('href', /\/$/);
  });

  test('« J’ai compris » libère le simulateur et mène à la première question', async ({ page }) => {
    await page.goto('/simulateur/');
    await page.locator('[data-simu-accepter]').click();
    await expect(page.locator('[data-simu-acces]')).toBeHidden();
    expect(
      await page.locator('[data-simulateur]').evaluate((el) => (el as HTMLElement).inert)
    ).toBe(false);
    await expect(page.locator('[data-simu-corps="initial"] [data-simu-question]')).toBeFocused();
    /* Elle a attendu « J'ai compris » pour entrer, invisible derrière le voile : elle doit arriver. */
    await expect(page.locator('[data-simu-corps="initial"]')).toHaveCSS('opacity', '1');
  });

  /* Le revers du test précédent : d'une question à l'autre, la carte porte bien son nom quand la
     transition capture l'état de départ, et le perd une fois la transition finie. */
  test('le passage d’une question à l’autre nomme la carte, le temps de la transition', async ({
    page,
  }) => {
    await entrer(page);
    await montant(page);
    await page.evaluate(() => {
      const doc = document as Document & { startViewTransition?: (f: () => void) => unknown };
      const origine = doc.startViewTransition?.bind(document);
      if (!origine) return;
      doc.startViewTransition = (f) => {
        const scene = document.querySelector('[data-simu-scene]');
        (window as unknown as { __nom: string }).__nom = scene
          ? getComputedStyle(scene).viewTransitionName
          : '';
        return origine(f);
      };
    });
    await continuer(page);
    await etape(page, 2);
    expect(await page.evaluate(() => (window as unknown as { __nom: string }).__nom)).toBe(
      'simu-scene'
    );
    await expect
      .poll(() =>
        page.locator('[data-simu-scene]').evaluate((el) => getComputedStyle(el).viewTransitionName)
      )
      .toBe('none');
  });

  test('elle tient en trois points, et garde l’avertissement du bulletin mot pour mot', async ({
    page,
  }) => {
    await page.goto('/simulateur/');
    const fenetre = page.locator('[data-simu-acces]');
    await expect(fenetre.locator('.simu-acces-point')).toHaveCount(3);
    const complet = fenetre.locator('details');
    await complet.locator('summary').click();
    await expect(complet).toContainText(
      'Acheter des parts de R Start est un investissement immobilier.'
    );
    await expect(complet).toContainText(
      'CORUM Asset Management ne garantit pas le rachat de vos parts.'
    );
    await expect(complet).toContainText(
      'ne constitue pas un indicateur fiable quant aux performances futures'
    );
  });

  test('accessibilité (axe) de la fenêtre, sans violation sérieuse', async ({ page }) => {
    await page.goto('/simulateur/');
    await expect(page.locator('[data-simu-acces]')).toBeVisible();
    await page.waitForTimeout(900);
    const resultats = await new AxeBuilder({ page })
      .include('[data-simu-acces]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    const serieuses = resultats.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(serieuses.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });
});

test.describe('Simulateur : aucun taux n’est supposé à R Start', () => {
  test('à l’arrivée, rien n’est choisi et aucun résultat n’existe', async ({ page }) => {
    await entrer(page);
    await expect(page.locator('[data-simu-resultats]')).toBeHidden();
    const curseur = page.locator('[data-simu-taux]');
    expect(await curseur.evaluate((el) => (el as HTMLInputElement).value)).toBe(
      await curseur.getAttribute('min')
    );
    await expect(curseur).toHaveAttribute('aria-valuetext', 'Aucun taux choisi');
    expect(await texte(page, '[data-simu-repere][aria-pressed="true"]')).toEqual([]);
  });

  test('la dernière question ne se franchit pas sans avoir choisi un taux', async ({ page }) => {
    await entrer(page);
    await montant(page);
    await continuer(page);
    await continuer(page);
    await continuer(page);
    await etape(page, 4);
    await expect(page.locator('[data-simu-taux-valeur]')).toHaveText('à choisir');
    await continuer(page);
    await expect(page.locator('[data-simu-alerte-taux]')).toBeVisible();
    await expect(page.locator('[data-simu-resultats]')).toBeHidden();
    await expect(page.locator('[data-simu-taux]')).toBeFocused();
    /* Un taux choisi, et la porte s'ouvre. */
    await page.locator('[data-simu-repere]').first().click();
    await expect(page.locator('[data-simu-alerte-taux]')).toBeHidden();
    await continuer(page);
    await expect(page.locator('[data-simu-etat="sorties"]')).toBeVisible();
  });

  test('« Recommencer » efface le taux comme le reste', async ({ page }) => {
    await simuler(page);
    await page.locator('[data-simu-recommencer]').click();
    await etape(page, 1);
    await expect(page.locator('[data-simu-resultats]')).toBeHidden();
    await expect(page.locator('[data-simu-taux]')).toHaveAttribute(
      'aria-valuetext',
      'Aucun taux choisi'
    );
  });

  /* LE REPÈRE « SCPI CORUM » NE PEUT PAS DIVERGER DE /a-propos : le test refait la moyenne à partir
     des quatre taux qu'un visiteur y lit. Depuis le 22/09/2026 les cartes reprennent les pages
     produit de corum.fr : trois affichent la performance globale annuelle 2025 (égale au taux de
     distribution, prix de souscription inchangé en 2025), CORUM USA son rendement 2025 ; le test
     lit la ligne « Rendement 2025 » quand elle existe, sinon « Performance globale annuelle
     2025 » : le premier « n,nn % » qui suit l'intitulé (entre les deux, les renvois « (3) » et le
     libellé masqué du bouton « i »). Une carte par SCPI (les `li` de la liste nommée), et non
     tout `li` : les mesures sont elles-mêmes des `li`. */
  test('le repère CORUM est la moyenne des taux publiés sur /a-propos', async ({ page }) => {
    await page.goto('/a-propos/');
    const taux = await page.evaluate(() =>
      [...document.querySelectorAll('#gamme ul[aria-label] > li')]
        .map((carte) => (carte.textContent ?? '').replace(/\s+/g, ' '))
        .map(
          (t) =>
            /Rendement 2025[^%]*?(\d+,\d+)\s*%/.exec(t) ??
            /Performance globale annuelle 2025[^%]*?(\d+,\d+)\s*%/.exec(t)
        )
        .filter((m): m is RegExpExecArray => m !== null)
        .map((m) => parseFloat((m[1] ?? '').replace(',', '.')))
    );
    expect(taux.length, 'quatre SCPI, quatre taux lus sur /a-propos').toBe(4);
    const uniques = taux;
    const moyenne = uniques.reduce((s, t) => s + t, 0) / uniques.length;
    await page.goto('/simulateur/');
    const repere = page.locator('[data-simu-repere]').nth(1);
    expect(Number(await repere.getAttribute('data-taux'))).toBeCloseTo(moyenne, 2);
    await expect(repere).toContainText('2025');
  });
});

test.describe('Simulateur : le parcours', () => {
  test('une question à la fois ; « Vos hypothèses » arrive à la deuxième et se remplit', async ({
    page,
  }) => {
    await entrer(page);
    await montant(page);
    const panneau = page.locator('[data-simu-panneau]');
    await etape(page, 1);
    await expect(panneau).toBeHidden();
    await expect(page.locator('[data-simu-corps]:visible')).toHaveCount(1);

    await continuer(page);
    await etape(page, 2);
    await expect(panneau).toBeVisible();
    expect(await texte(page, '[data-simu-champ]:not([hidden]) [data-simu-resume-valeur]')).toEqual([
      '20 000 € · 100 parts',
    ]);
    await expect(page.locator('[data-simu-corps="monthly"] [data-simu-question]')).toBeFocused();

    await page.locator('[data-simu-puce="monthly"][data-v="250"]').click();
    await continuer(page);
    await page.locator('[data-simu-reinvestir="1"]').click();
    await continuer(page);
    await etape(page, 4);
    expect(await texte(page, '[data-simu-champ]:not([hidden]) [data-simu-resume-valeur]')).toEqual([
      '20 000 € · 100 parts',
      '250 € / mois',
      '100 % réinvestis',
    ]);
  });

  test('une ligne de « Vos hypothèses » ramène à sa question, et « Retour » à la précédente', async ({
    page,
  }) => {
    await entrer(page);
    await montant(page);
    await continuer(page);
    await continuer(page);
    await etape(page, 3);
    await page.locator('[data-simu-champ="initial"] [data-simu-resume]').click();
    await etape(page, 1);
    await expect(page.locator('[data-simu-panneau]')).toBeHidden();
    await continuer(page);
    await continuer(page);
    await page.locator('[data-simu-retour]').click();
    await etape(page, 2);
  });

  test('un montant sous le minimum arrête le parcours, avec la raison', async ({ page }) => {
    await entrer(page);
    const champ = page.locator('[data-simu-initial]');
    await champ.fill('150');
    await continuer(page);
    await etape(page, 1);
    await expect(page.locator('[data-simu-erreur="initial"]')).toContainText('200 €');
    await expect(champ).toBeFocused();
    /* Entrée vaut « Continuer ». */
    await champ.fill('5000');
    await champ.press('Enter');
    await etape(page, 2);
    /* Un versement programmé sous le minimum aussi ; zéro, lui, passe. */
    await page.locator('[data-simu-mensuel]').fill('30');
    await continuer(page);
    await etape(page, 2);
    await expect(page.locator('[data-simu-erreur="monthly"]')).toContainText('50 €');
    await page.locator('[data-simu-mensuel]').fill('0');
    await continuer(page);
    await etape(page, 3);
  });

  /* L'ÉTAPE 1 PART DE ZÉRO ET PARLE EN PARTS (demande de Martin) : champ vide, aucune erreur à
     l'arrivée, suggestions en parts entières, complément proposé entre deux parts. */
  test('le montant part de zéro, se lit en parts et se complète à la part entière', async ({
    page,
  }) => {
    await entrer(page);
    const champ = page.locator('[data-simu-initial]');
    const ligne = page.locator('[data-simu-parts]');
    const completer = page.locator('[data-simu-completer]');
    await expect(champ).toHaveValue('');
    await expect(champ).toHaveAttribute('placeholder', '0');
    await expect(page.locator('[data-simu-erreur="initial"]')).toBeHidden();
    await expect(page.locator('[data-simu-parts-zone]')).toBeHidden();
    expect(await texte(page, '[data-simu-puce="initial"]')).toEqual([
      '2 000 €',
      '5 000 €',
      '10 000 €',
      '20 000 €',
    ]);
    /* Rien de saisi : l'erreur attend qu'on veuille continuer. */
    await continuer(page);
    await etape(page, 1);
    await expect(page.locator('[data-simu-erreur="initial"]')).toBeVisible();
    await expect(champ).toBeFocused();

    await champ.fill('150');
    await expect(ligne).toHaveText('Soit 0,75 part, à 200 € la part.');
    await expect(completer).toHaveText('+ 50 € pour 1 part entière');
    await champ.fill('5150');
    await expect(ligne).toHaveText('Soit 25,75 parts, à 200 € la part.');
    await expect(completer).toHaveText('+ 50 € pour 26 parts entières');
    await completer.click();
    await expect(champ).toHaveValue(/^5\s200$/);
    await expect(ligne).toHaveText('Soit 26 parts, à 200 € la part.');
    await expect(ligne).toBeFocused();
    await expect(completer).toBeHidden();
    await expect(page.locator('[data-simu-erreur="initial"]')).toBeHidden();

    await continuer(page);
    await etape(page, 2);
    expect(await texte(page, '[data-simu-champ]:not([hidden]) [data-simu-resume-valeur]')).toEqual([
      '5 200 € · 26 parts',
    ]);
  });
});

test.describe('Simulateur : le résultat', () => {
  test('revenus perçus : deux chiffres, l’avertissement à côté, le graphique et son tableau', async ({
    page,
  }) => {
    await simuler(page);
    await expect(page.locator('#simulateur-resultats-titre')).toBeFocused();
    /* 20 000 € à 4,91 % : 81,83 € par mois, arrondis à l'euro. */
    await expect(page.locator('[data-n="monthlyNow"]')).toHaveText('82 €');
    await expect(page.locator('[data-simu-kpi="growth"]:visible')).toHaveCount(0);
    await expect(page.locator('[data-simu-avertissement]')).toBeVisible();
    await expect(page.locator('[data-simu-avertissement]')).toContainText(
      'ni un objectif, ni une prévision'
    );
    /* Rien à retirer de façon anticipée après 25 ans : pas de note sur la commission. */
    await expect(page.locator('[data-simu-note-retrait]')).toBeHidden();
    await expect(page.locator('[data-simu-bascule]')).toBeHidden();
    await page.locator('details:has([data-simu-table]) summary').click();
    await expect(page.locator('[data-simu-table="revenus"] tbody tr')).toHaveCount(26);
    expect(await texte(page, '[data-simu-champ]:not([hidden]) [data-simu-resume-valeur]')).toEqual([
      '20 000 € · 100 parts',
      'Aucun',
      'Chaque mois',
      '4,91 %',
      '25 ans',
    ]);
  });

  test('versement et réinvestissement : le capital, la commission de retrait, les deux vues', async ({
    page,
  }) => {
    await simuler(page, { mensuel: 250, reinvestir: true });
    await expect(page.locator('[data-simu-kpi="growth"]:visible')).toHaveCount(2);
    await expect(page.locator('[data-t="growthLabel"]')).toHaveText('Capital projeté à 25 ans');
    await expect(page.locator('[data-t="growthSub"]')).toContainText('95 000 €');
    await expect(page.locator('[data-simu-note-retrait]')).toBeVisible();
    await page.locator('[data-simu-vue="capital"]').click();
    await expect(page.locator('[data-simu-titre-graphique]')).toHaveText(
      'Composition du capital projeté'
    );
    expect(await texte(page, '[data-legende]:not([hidden])')).toEqual([
      'Investissement initial',
      'Versements programmés',
      'Revenus réinvestis',
      'Total versé',
    ]);
    await page.locator('details:has([data-simu-table]) summary').click();
    await expect(page.locator('[data-simu-table="capital"]')).toBeVisible();
    await expect(page.locator('[data-simu-table="revenus"]')).toBeHidden();
  });

  test('une hypothèse se modifie sur place, et le résultat suit', async ({ page, isMobile }) => {
    await simuler(page);
    /* Rien n'est ouvert d'emblée et une seule ligne s'ouvre à la fois : le bloc reste court, et
       « Commencer ma souscription » est à l'écran sans défiler sur grand écran. */
    await expect(page.locator('[data-simu-resume][aria-expanded="true"]')).toHaveCount(0);
    const souscrire = page.locator('[data-simu-panneau] [data-simu-suite] a[data-cta]');
    await expect(souscrire).toBeVisible();
    if (!isMobile) await expect(souscrire).toBeInViewport();
    await page.locator('[data-simu-champ="years"] [data-simu-resume]').click();
    await page.locator('[data-simu-puce="years"][data-v="10"]').click();
    await expect(page.locator('[data-t="incomeLabel"]')).toHaveText(
      'Revenus potentiels cumulés sur 10 ans'
    );
    await page.locator('[data-simu-champ="initial"] [data-simu-resume]').click();
    await expect(page.locator('[data-simu-resume][aria-expanded="true"]')).toHaveCount(1);
    await expect(page.locator('[data-simu-corps="years"]')).toBeHidden();
    const champ = page.locator('[data-simu-initial]');
    await champ.fill('100');
    await expect(page.locator('[data-simu-etat="erreur"]')).toBeVisible();
    await expect(page.locator('[data-simu-etat="sorties"]')).toBeHidden();
    await champ.fill('40000');
    await expect(page.locator('[data-simu-etat="sorties"]')).toBeVisible();
    await expect(page.locator('[data-n="monthlyNow"]')).toHaveText('164 €');
  });

  /* « COMMENCER MA SOUSCRIPTION », tunnel fermé : la fenêtre « bientôt », et RIEN N'EST TRANSMIS,
     son adresse ne porte aucun montant. Tunnel ouvert : tests/simulateur-moteur.spec.ts. */
  test('« Commencer ma souscription » : tunnel fermé, la fenêtre « bientôt », et aucun montant transmis', async ({
    page,
  }) => {
    await simuler(page, { mensuel: 250, reinvestir: true });
    const bouton = page.locator('[data-simu-suite] a[data-cta="souscrire"]');
    await expect(bouton).toHaveText('Commencer ma souscription');
    await expect(bouton).toHaveAttribute('data-cta-position', 'simulateur-resultat');
    expect(await page.evaluate(() => document.body.dataset.souscriptionOuverte)).toBe('non');
    expect(await bouton.getAttribute('href')).not.toMatch(/montant|versement|20000|250/);
    await bouton.click();
    await expect(page.locator('[data-subscribe-soon]')).toBeVisible();
    expect(new URL(page.url()).pathname).toMatch(/\/simulateur\/$/);
  });

  test('le graphique se lit au clavier, année par année', async ({ page, isMobile }) => {
    test.skip(isMobile, 'les flèches sont un geste de clavier');
    await simuler(page);
    const graphique = page.locator('[data-simu-graphique]');
    await graphique.focus();
    const bulle = page.locator('[data-simu-bulle]');
    await expect(bulle.locator('[data-bulle-titre]')).toHaveText('Année 25');
    await page.keyboard.press('Home');
    await expect(bulle.locator('[data-bulle-titre]')).toHaveText('Départ');
    await page.keyboard.press('ArrowRight');
    await expect(bulle.locator('[data-bulle-titre]')).toHaveText('Année 1');
  });

  /* LA BULLE GARDE SA FORME JUSQU'AU BORD DROIT (signalé par Martin) : une boîte absolue ne dispose
     que de la largeur qui reste jusqu'au bord, et `text-wrap: pretty`, posé sur tout <p> par
     global.css, annulait son `nowrap`. Elle doit avoir partout la hauteur qu'elle a au milieu. */
  test('la bulle du graphique ne se resserre pas sur les dernières années', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'les flèches sont un geste de clavier');
    await simuler(page, { mensuel: 250, reinvestir: true });
    for (const vue of ['revenus', 'capital']) {
      await page.locator(`[data-simu-vue="${vue}"]`).click();
      await page.locator('[data-simu-graphique]').focus();
      const mesure = () =>
        page.evaluate(() => {
          const bulle = document.querySelector<HTMLElement>('[data-simu-bulle]')!;
          const cadre = document.querySelector('[data-simu-graphique]')!.getBoundingClientRect();
          const b = bulle.getBoundingClientRect();
          const lignes = [...bulle.querySelectorAll<HTMLElement>('p:not([hidden])')];
          const uneLigne = lignes[0]?.offsetHeight ?? 0;
          return {
            hauteur: Math.round(b.height),
            /* Le titre tient toujours sur une ligne : une ligne plus haute que lui est cassée. */
            cassees: lignes.filter((p) => p.offsetHeight > uneLigne * 1.5).length,
            dansLeCadre: b.left >= cadre.left - 1 && b.right <= cadre.right + 1,
          };
        });
      await page.keyboard.press('End');
      const auBord = await mesure();
      for (let i = 0; i < 12; i += 1) await page.keyboard.press('ArrowLeft');
      const auMilieu = await mesure();
      expect(auBord.cassees, `aucune ligne cassée au bord droit (vue ${vue})`).toBe(0);
      expect(auBord.hauteur, `même hauteur au bord qu’au milieu (vue ${vue})`).toBe(
        auMilieu.hauteur
      );
      expect(auBord.dansLeCadre, `la bulle reste dans le cadre (vue ${vue})`).toBe(true);
      expect(auMilieu.dansLeCadre).toBe(true);
    }
  });

  /* LE GRAPHIQUE PARLE DANS LES COULEURS DE LA MARQUE (« ces couleurs-là ne sont pas les couleurs
     R Start », Martin) : pas de corail, couleur des mentions de risque ; marine et turquoises, du
     plus sombre au plus clair. */
  test('les couches du graphique n’emploient que le marine et les turquoises de la marque', async ({
    page,
  }) => {
    await simuler(page, { mensuel: 250, reinvestir: true });
    await page.locator('[data-simu-vue="capital"]').click();
    /* Le passage d'une vue à l'autre est animé : on attend que les trois couches soient tracées. */
    await expect(page.locator('[data-couche][d^="M"]')).toHaveCount(3);
    const releve = await page.evaluate(() => {
      const jeton = (nom: string) => {
        const sonde = document.createElement('i');
        sonde.style.color = `var(${nom})`;
        document.body.append(sonde);
        const couleur = getComputedStyle(sonde).color;
        sonde.remove();
        return couleur;
      };
      return {
        marque: ['--color-navy', '--color-teal-500', '--color-teal-200'].map(jeton),
        corail: ['--color-coral', '--color-coral-700'].map(jeton),
        couches: [...document.querySelectorAll<SVGPathElement>('[data-couche]')]
          .filter((c) => c.getAttribute('d'))
          .map((c) => getComputedStyle(c).fill),
        puces: [...document.querySelectorAll<HTMLElement>('[data-legende]:not([hidden]) span')]
          .map((p) => getComputedStyle(p).backgroundColor)
          .filter((c) => c !== 'rgba(0, 0, 0, 0)'),
      };
    });
    expect(releve.couches).toHaveLength(3);
    for (const couleur of [...releve.couches, ...releve.puces]) {
      expect(releve.marque, `couleur hors palette : ${couleur}`).toContain(couleur);
      expect(releve.corail).not.toContain(couleur);
    }
    expect(new Set(releve.couches).size, 'trois couches, trois couleurs distinctes').toBe(3);
  });

  /* L'AVERTISSEMENT N'EST JAMAIS ANIMÉ, règle du site pour toute mention de risque : il est là,
     entier, à la première image. Et rien ne bouge en mouvement réduit. */
  test('l’avertissement n’est pas animé ; en mouvement réduit, rien ne l’est', async ({
    page,
    browser,
  }) => {
    await simuler(page);
    const animation = (p: Page, selecteur: string) =>
      p
        .locator(selecteur)
        .first()
        .evaluate((el) => getComputedStyle(el).animationName);
    expect(await animation(page, '[data-simu-avertissement]')).toBe('none');
    expect(await animation(page, '[data-simu-kpi]:not([hidden])')).not.toBe('none');

    const calme = await browser.newContext({
      reducedMotion: 'reduce',
      baseURL: new URL(page.url()).origin,
    });
    const autre = await calme.newPage();
    await simuler(autre);
    expect(await animation(autre, '[data-simu-kpi]:not([hidden])')).toBe('none');
    /* Les chiffres sont posés d'un coup, à leur valeur. */
    await expect(autre.locator('[data-n="monthlyNow"]')).toHaveText('82 €');
    await calme.close();
  });

  test('accessibilité (axe) de l’écran de résultat, sans violation sérieuse', async ({ page }) => {
    await simuler(page, { mensuel: 250, reinvestir: true });
    await page.waitForTimeout(1200);
    const resultats = await new AxeBuilder({ page })
      .include('#simulateur')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    const serieuses = resultats.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(serieuses.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });

  test('sur téléphone, la barre de synthèse suit quand les résultats quittent l’écran', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'la barre n’existe que sous « lg »');
    const barre = page.locator('[data-simu-barre]');
    await simuler(page);
    await expect(barre).toBeHidden();
    /* On règle la durée, dernier réglage du panneau : les résultats sont sortis de l'écran par le haut,
       le pied de page pointe en bas. C'est là que la barre sert. */
    await page.locator('[data-simu-champ="years"] [data-simu-resume]').click();
    await page
      .locator('[data-simu-duree]')
      .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(barre).toBeVisible();
    await expect(barre.locator('[data-barre-valeur]')).toHaveText('82 €');
    /* Tout en bas, elle laisse le pied de page se lire en entier. */
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
    );
    await expect(barre).toBeHidden();
  });
});

test('sans JavaScript, le simulateur cède la place à un message', async ({ browser, baseURL }) => {
  const contexte = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await contexte.newPage();
  await page.goto('/simulateur/');
  await expect(page.locator('.simu-sans-script')).toBeVisible();
  await expect(page.locator('[data-simulateur]')).toBeHidden();
  await contexte.close();
});
