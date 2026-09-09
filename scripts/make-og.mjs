// Génère l'image Open Graph (1200×630) : dégradé de marque + logo R Start blanc + accroche + rappel risque.
// Usage : node scripts/make-og.mjs [--photo src/assets/images/immeubles/xxx.jpg]
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { product } from '../src/content/fr/facts.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'og', 'og-rstart.jpg');
const W = 1200;
const H = 630;
const photoArg = process.argv.indexOf('--photo');
const photo = photoArg > -1 ? path.resolve(ROOT, process.argv[photoArg + 1]) : null;

const logoSvg = await fs.readFile(path.join(ROOT, 'src', 'assets', 'logos', 'r-start-blanc.svg'));
const logo = await sharp(logoSvg).resize({ width: 420 }).png().toBuffer();

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
  <text x="80" y="330" font-family="${fonts}" font-size="54" font-weight="700" fill="#ffffff">${esc(product.tagline)}</text>
  <text x="80" y="395" font-family="${fonts}" font-size="30" fill="#dcf1f5">${esc('0 % de frais de souscription · 15 % de frais de gestion · à partir de 200 €')}</text>
  <text x="80" y="540" font-family="${fonts}" font-size="22" fill="#ffffff" opacity="0.92">${esc('Investissement immobilier de long terme (10 ans recommandés). Risque de perte en capital,')}</text>
  <text x="80" y="572" font-family="${fonts}" font-size="22" fill="#ffffff" opacity="0.92">${esc('revenus non garantis, liquidité limitée, risque de change. CORUM L’Épargne.')}</text>
</svg>`);

let base = sharp(overlay).png();
if (photo) {
  const img = await sharp(photo).resize(W, H, { fit: 'cover' }).modulate({ brightness: 0.55, saturation: 0.8 }).toBuffer();
  base = sharp(img).composite([{ input: await sharp(overlay).png().toBuffer(), blend: 'multiply' }]);
}
const buf = await base.png().toBuffer();
await fs.mkdir(path.dirname(OUT), { recursive: true });
await sharp(buf)
  .composite([{ input: logo, left: 80, top: 120 }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(OUT);
console.log(`OG écrit : ${path.relative(ROOT, OUT)}`);
