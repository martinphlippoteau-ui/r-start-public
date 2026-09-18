// Génère l'image Open Graph (1200×630) : dégradé de marque + logo R Start blanc + accroche + rappel risque.
// Usage : node scripts/make-og.mjs [--photo src/assets/images/immeubles/xxx.jpg]
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { lignesOg } from './og-lignes.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'og', 'og-rstart.jpg');
const W = 1200;
const H = 630;
const photoArg = process.argv.indexOf('--photo');
const photo = photoArg > -1 ? path.resolve(ROOT, process.argv[photoArg + 1]) : null;

const logoSvg = await fs.readFile(path.join(ROOT, 'src', 'assets', 'logos', 'r-start-blanc.svg'));
const logo = await sharp(logoSvg).resize({ width: 420 }).png().toBuffer();

/* Aucun chiffre en dur : les lignes viennent de facts.ts et legal.ts (scripts/og-lignes.mjs), et ce qui
   est réellement peint est consigné plus bas, pour que check-compliance.mjs puisse le comparer. */
const lignes = lignesOg();
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const fonts = "'Plus Jakarta Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const overlay = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0d2e3d"/>
      <stop offset="0.5" stop-color="#024b68"/>
      <stop offset="1" stop-color="#1198af"/>
    </linearGradient>
    <radialGradient id="r" cx="85%" cy="15%" r="60%">
      <stop offset="0" stop-color="#f3e6cf" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#f3e6cf" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect width="${W}" height="${H}" fill="url(#r)"/>
  <text x="80" y="330" font-family="${fonts}" font-size="54" font-weight="700" fill="#ffffff">${esc(lignes.accroche)}</text>
  <text x="80" y="395" font-family="${fonts}" font-size="30" fill="#dcf1f5">${esc(lignes.chiffres)}</text>
  <text x="80" y="540" font-family="${fonts}" font-size="22" fill="#ffffff" opacity="0.92">${esc(lignes.risques[0])}</text>
  <text x="80" y="572" font-family="${fonts}" font-size="22" fill="#ffffff" opacity="0.92">${esc(lignes.risques[1])}</text>
</svg>`);

let base = sharp(overlay).png();
if (photo) {
  const img = await sharp(photo)
    .resize(W, H, { fit: 'cover' })
    .modulate({ brightness: 0.55, saturation: 0.8 })
    .toBuffer();
  base = sharp(img).composite([
    { input: await sharp(overlay).png().toBuffer(), blend: 'multiply' },
  ]);
}
const buf = await base.png().toBuffer();
await fs.mkdir(path.dirname(OUT), { recursive: true });
await sharp(buf)
  .composite([{ input: logo, left: 80, top: 120 }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(OUT);
await fs.writeFile(
  path.join(ROOT, 'scripts', 'og-lignes.json'),
  JSON.stringify(lignes, null, 2) + '\n'
);
console.log(
  `OG écrit : ${path.relative(ROOT, OUT)} (lignes consignées dans scripts/og-lignes.json)`
);
