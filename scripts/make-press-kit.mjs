// Génère le kit média de la page Presse : logos R Start en SVG (copie) et PNG haute définition.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOGOS = path.join(ROOT, 'src', 'assets', 'logos');
const OUT = path.join(ROOT, 'public', 'presse');
await fs.mkdir(OUT, { recursive: true });
for (const [src, base] of [
  ['r-start-couleur.svg', 'r-start-logo-couleur'],
  ['r-start-blanc.svg', 'r-start-logo-blanc'],
]) {
  const svg = await fs.readFile(path.join(LOGOS, src));
  await fs.writeFile(path.join(OUT, `${base}.svg`), svg);
  await sharp(svg, { density: 300 })
    .resize({ width: 2400 })
    .png()
    .toFile(path.join(OUT, `${base}.png`));
  console.log(`+ presse/${base}.svg, presse/${base}.png`);
}
