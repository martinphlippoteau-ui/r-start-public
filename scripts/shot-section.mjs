// Capture d'écran d'une section (ou d'une page entière) depuis un serveur de dev/preview déjà lancé.
// Usage : node scripts/shot-section.mjs --url http://127.0.0.1:4331/sections-preview --id points-forts \
//         --out tests/screenshots/A-points-forts-desktop.png [--width 1440 --height 900] [--full]
// Le cookie de consentement est posé (refus) pour ne pas masquer la page. Les animations GSAP sont déclenchées
// par un défilement complet avant la capture.
import { chromium } from '@playwright/test';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true']);
    return acc;
  }, [])
);
const url = args.url || 'http://127.0.0.1:4321/';
const width = Number(args.width || 1440);
const height = Number(args.height || 900);
if (!args.out) throw new Error('--out requis');

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, locale: 'fr-FR' });
const origin = new URL(url).origin;
await context.addCookies([{ name: 'rstart_consent', value: 'denied', url: origin }]);
const page = await context.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
await page.evaluate(async () => {
  // scroll-behavior: smooth (global.css) empêcherait d'atteindre chaque position : défilement instantané, pas fins.
  document.documentElement.style.scrollBehavior = 'auto';
  for (let y = 0; y < document.body.scrollHeight; y += 160) {
    window.scrollTo({ top: y, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 45));
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
});
await page.waitForTimeout(500);
if (args.id) {
  const el = page.locator('#' + args.id).first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await el.screenshot({ path: args.out });
  const box = await el.boundingBox();
  console.log(`OK ${args.out} (#${args.id} ${Math.round(box?.width ?? 0)}×${Math.round(box?.height ?? 0)})`);
} else {
  await page.screenshot({ path: args.out, fullPage: args.full === 'true' });
  console.log(`OK ${args.out}`);
}
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
if (overflow > 1) console.log(`⚠ débordement horizontal : ${overflow}px`);
await browser.close();
