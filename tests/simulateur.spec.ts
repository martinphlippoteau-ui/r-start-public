import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * SIMULATEUR (/simulateur, 19-20/09/2026). Trois choses tiennent la page, et chacune a ses tests :
 *  - la FENÊTRE D'ACCÈS : on ne touche pas au simulateur avant d'avoir lu l'avertissement ;
 *  - AUCUN TAUX SUPPOSÉ À R START : rien n'est présélectionné, et le parcours ne se termine pas sans
 *    que le visiteur ait choisi lui-même un taux. Le contrôle de conformité du build vérifie le HTML
 *    d'arrivée ; ce qui se joue ensuite ne se lit que dans un navigateur, donc ici ;
 *  - le PARCOURS : une question à la fois, « Vos hypothèses » qui se remplit à partir de la deuxième.
 * Le calcul lui-même est éprouvé sans navigateur dans tests/simulateur-moteur.spec.ts.
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
/** L'écran change dans une transition de vue, une image après le clic : l'étape se lit en attendant. */
const etape = (page: Page, n: number) =>
  expect(page.locator('[data-simu-etape-libelle]')).toHaveText(new RegExp(`${n} sur 4`));

/** Va jusqu'à l'écran de résultat : 20 000 €, versement et revenus au choix, repère de marché. */
const simuler = async (page: Page, { mensuel = 0, reinvestir = false } = {}) => {
  await entrer(page);
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
  test('elle s’ouvre à l’arrivée, et le simulateur est hors d’atteinte derrière elle', async ({
    page,
  }) => {
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

  /*
   * LE REPÈRE « SCPI CORUM » NE PEUT PAS DIVERGER DE /a-propos : il est calculé depuis les quatre taux
   * que cette page publie. Le test refait la moyenne à partir de ce qu'un visiteur y lit.
   */
  test('le repère CORUM est la moyenne des taux publiés sur /a-propos', async ({ page }) => {
    await page.goto('/a-propos/');
    const taux = await page.evaluate(() =>
      [...document.querySelectorAll('#gamme li, #gamme article')]
        .map((carte) => (carte.textContent ?? '').replace(/\s+/g, ' '))
        .map((t) => /(\d+,\d+)\s*%\s*Rendement 2025|Rendement 2025\s*(\d+,\d+)\s*%/.exec(t))
        .filter((m): m is RegExpExecArray => m !== null)
        .map((m) => parseFloat((m[1] ?? m[2] ?? '').replace(',', '.')))
    );
    const uniques = [...new Set(taux)];
    expect(uniques.length, 'quatre SCPI, quatre taux lus sur /a-propos').toBe(4);
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
    const panneau = page.locator('[data-simu-panneau]');
    await etape(page, 1);
    await expect(panneau).toBeHidden();
    await expect(page.locator('[data-simu-corps]:visible')).toHaveCount(1);

    await continuer(page);
    await etape(page, 2);
    await expect(panneau).toBeVisible();
    expect(await texte(page, '[data-simu-champ]:not([hidden]) [data-simu-resume-valeur]')).toEqual([
      '20 000 €',
    ]);
    await expect(page.locator('[data-simu-corps="monthly"] [data-simu-question]')).toBeFocused();

    await page.locator('[data-simu-puce="monthly"][data-v="250"]').click();
    await continuer(page);
    await page.locator('[data-simu-reinvestir="1"]').click();
    await continuer(page);
    await etape(page, 4);
    expect(await texte(page, '[data-simu-champ]:not([hidden]) [data-simu-resume-valeur]')).toEqual([
      '20 000 €',
      '250 € / mois',
      '100 % réinvestis',
    ]);
  });

  test('une ligne de « Vos hypothèses » ramène à sa question, et « Retour » à la précédente', async ({
    page,
  }) => {
    await entrer(page);
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
      '20 000 €',
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
    /* Rien n'est ouvert d'emblée : le bloc reste court. Sur grand écran, où il est collé à côté des
       résultats, « Commencer ma souscription » est donc à l'écran sans défiler ; sur téléphone il
       ferme le bloc, sous les résultats. Une seule ligne s'ouvre à la fois. */
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

  /*
   * « COMMENCER MA SOUSCRIPTION » (20/09/2026). Tant que la souscription n'est pas ouverte, le bouton
   * se comporte comme tous les CTA du site : il ouvre la fenêtre « bientôt », et RIEN N'EST TRANSMIS,
   * son adresse ne porte aucun montant. La fabrication de l'adresse, tunnel ouvert, est éprouvée dans
   * tests/simulateur-moteur.spec.ts.
   */
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

  /*
   * L'AVERTISSEMENT N'EST JAMAIS ANIMÉ : règle du site pour toute mention de risque. Tout le reste du
   * simulateur bouge (demande de Martin du 20/09/2026), lui est là, entier, à la première image.
   * Et rien ne bouge en mouvement réduit.
   */
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
