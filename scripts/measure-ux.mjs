/**
 * Mesures UX comparables avant / après un chantier : hauteur de page, position des CTA du hero par
 * rapport au bandeau cookies, poids JavaScript transféré, et scan axe complet.
 *
 * Usage : node scripts/measure-ux.mjs <étiquette>   (le serveur `pnpm preview` doit tourner)
 * Le résultat est écrit dans tests/mesures/<étiquette>.json et résumé sur la sortie standard.
 *
 * Le scan axe ferme d'abord le bandeau cookies et ouvre tous les <details> : une violation cachée
 * dans un bloc replié compte autant qu'une autre.
 */
import { chromium, devices } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.PREVIEW_URL ?? 'http://localhost:4321';
const LABEL = process.argv[2] ?? 'mesure';
const OUT = 'tests/mesures';

const PAGES = [
  '/',
  '/frais/',
  '/documentation/',
  '/presse/',
  '/salle-de-presse/',
  '/mentions-legales/',
  '/cookies/',
];
const VIEWPORTS = [
  { name: 'mobile', options: { ...devices['Pixel 5'] } },
  { name: 'desktop', options: { viewport: { width: 1440, height: 900 } } },
];
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Octets réellement transférés pour les réponses JavaScript d'une page. */
const trackJs = (page) => {
  const state = { bytes: 0, engine: false, files: [] };
  page.on('response', async (res) => {
    const url = res.url();
    if (!/\.m?js(\?|$)/.test(url)) return;
    if (/engine\..*\.js/.test(url)) state.engine = true;
    try {
      const sizes = await res.request().sizes();
      state.bytes += sizes.responseBodySize || 0;
      state.files.push(url.split('/').pop());
    } catch {
      /* réponse déjà libérée : on ignore, la comparaison reste homogène */
    }
  });
  return state;
};

const dismissConsent = async (page) => {
  const refuse = page.locator('[data-consent-refuse]');
  if (await refuse.count()) {
    await refuse
      .first()
      .click()
      .catch(() => {});
    await page.waitForTimeout(150);
  }
};

const run = async () => {
  const browser = await chromium.launch();
  const result = {
    label: LABEL,
    date: new Date().toISOString(),
    pages: {},
    axe: { violations: [] },
  };

  for (const vp of VIEWPORTS) {
    for (const route of PAGES) {
      const context = await browser.newContext(vp.options);
      const page = await context.newPage();
      const js = trackJs(page);
      await page.goto(BASE + route, { waitUntil: 'load' });
      // Le moteur d'animation est chargé au premier temps d'inactivité : on lui laisse sa chance.
      await page.waitForTimeout(1800);

      const geo = await page.evaluate(() => {
        const q = (s) => document.querySelector(s);
        const box = (el) => (el ? el.getBoundingClientRect() : null);
        const banner = box(q('#consent-banner'));
        const cta = box(q('#apercu [data-hero-cta]')) ?? box(q('#apercu a[data-cta="souscrire"]'));
        const risk = box(q('#apercu [data-risk]')) ?? box(q('[data-risk]'));
        return {
          hauteur: document.documentElement.scrollHeight,
          viewport: window.innerHeight,
          debordement: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          ctaBas: cta ? Math.round(cta.bottom) : null,
          risqueBas: risk ? Math.round(risk.bottom) : null,
          bandeauHaut: banner && banner.height ? Math.round(banner.top) : null,
        };
      });

      const key = `${vp.name} ${route}`;
      result.pages[key] = {
        ...geo,
        ecrans: +(geo.hauteur / geo.viewport).toFixed(1),
        margeCtaBandeau:
          geo.ctaBas !== null && geo.bandeauHaut !== null ? geo.bandeauHaut - geo.ctaBas : null,
        margeRisqueBandeau:
          geo.risqueBas !== null && geo.bandeauHaut !== null
            ? geo.bandeauHaut - geo.risqueBas
            : null,
        jsKo: +(js.bytes / 1024).toFixed(1),
        moteurGsap: js.engine,
      };

      // Scan axe : bandeau fermé, tous les <details> dépliés.
      await dismissConsent(page);
      await page.evaluate(() =>
        document.querySelectorAll('details').forEach((d) => (d.open = true))
      );
      await page.waitForTimeout(200);
      const axe = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      for (const v of axe.violations) {
        result.axe.violations.push({
          page: key,
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.length,
          help: v.help,
        });
      }
      await context.close();
    }
  }

  await browser.close();
  await fs.mkdir(OUT, { recursive: true });
  await fs.writeFile(path.join(OUT, LABEL + '.json'), JSON.stringify(result, null, 2), 'utf8');

  console.log(`\n=== ${LABEL} ===`);
  for (const [key, p] of Object.entries(result.pages)) {
    console.log(
      `${key.padEnd(30)} h=${String(p.hauteur).padStart(6)} px (${String(p.ecrans).padStart(4)} écrans)  ` +
        `js=${String(p.jsKo).padStart(6)} Ko  gsap=${p.moteurGsap ? 'oui' : 'non '}  ` +
        `CTA/bandeau=${p.margeCtaBandeau ?? ','}  risque/bandeau=${p.margeRisqueBandeau ?? ','}  débordement=${p.debordement}`
    );
  }
  console.log(`\naxe : ${result.axe.violations.length} violation(s)`);
  for (const v of result.axe.violations)
    console.log(`  ${v.page}, ${v.id} (${v.impact}, ${v.nodes})`);
};

await run();
