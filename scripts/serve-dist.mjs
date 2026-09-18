// Sert `dist/` au premier plan, pour les tests de bout en bout.
//
// Pourquoi ne pas utiliser `astro preview` : il SE DÉTACHE. La commande rend la main aussitôt en
// affichant « Preview server running (pid …) », et un serveur indépendant continue de tourner.
// Playwright, qui surveille le processus qu'il a lancé, le voit sortir et abandonne avec
// « Process from config.webServer exited early » : les tests ne s'exécutaient donc pas du tout en
// intégration continue. Ce serveur-ci reste au premier plan et meurt avec son parent, ce qui est
// exactement le contrat attendu par `webServer`.
//
// Il reproduit ce que sert GitHub Pages : /page et /page/ mènent à page/index.html, la racine à
// index.html, et tout le reste à 404.html avec le bon code.
//
// Usage : node scripts/serve-dist.mjs [port]
import { createServer } from 'node:http';
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.argv[2] || process.env.PORT || 4321);
const HOST = '127.0.0.1';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
};

/*
 * Sous-chemin de publication. En CI, le site est construit avec PUBLIC_BASE_PATH=r-start-public et
 * tous ses liens portent donc ce préfixe, alors que ce serveur sert `dist/` À LA RACINE : sans ce
 * retrait, chaque lien interne tombait en 404 et les trente tests de bout en bout examinaient la page
 * d'erreur au lieu de la page demandée (audit du 14/09/2026). Même règle que scripts/check-compliance.mjs.
 */
const SEGMENTS = (process.env.PUBLIC_BASE_PATH || '').split('/').filter(Boolean);
const PREFIXE = SEGMENTS.length ? '/' + SEGMENTS[SEGMENTS.length - 1] : '';
const sansPrefixe = (chemin) =>
  PREFIXE && (chemin === PREFIXE || chemin.startsWith(PREFIXE + '/'))
    ? chemin.slice(PREFIXE.length) || '/'
    : chemin;

/** Chemin sur le disque, ou null si la demande sort de `dist/` (traversée de répertoire). */
const resoudre = (url) => {
  /* Une adresse mal encodée (« /% ») levait une URIError non rattrapée : le serveur tombait, et toute la
     suite de tests avec lui. Elle vaut « introuvable ». */
  let chemin;
  try {
    chemin = decodeURIComponent(new URL(url, 'http://x').pathname);
  } catch {
    return null;
  }
  const brut = sansPrefixe(chemin);
  const cible = path.normalize(path.join(DIST, brut));
  return cible === DIST || cible.startsWith(DIST + path.sep) ? cible : null;
};

const lisible = async (p) => {
  try {
    return (await fs.stat(p)).isFile() ? p : null;
  } catch {
    return null;
  }
};

const envoyer = (res, code, fichier) => {
  res.writeHead(code, {
    'Content-Type': TYPES[path.extname(fichier).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  createReadStream(fichier).pipe(res);
};

const serveur = createServer(async (req, res) => {
  const base = resoudre(req.url ?? '/');
  if (!base) {
    res.writeHead(400).end('Requête refusée');
    return;
  }
  const candidats = [base, path.join(base, 'index.html'), base + '.html'];
  for (const c of candidats) {
    const trouve = await lisible(c);
    if (trouve) {
      envoyer(res, 200, trouve);
      return;
    }
  }
  const page404 = await lisible(path.join(DIST, '404.html'));
  if (page404) envoyer(res, 404, page404);
  else res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Introuvable');
});

serveur.listen(PORT, HOST, () => {
  console.log(`dist/ servi sur http://${HOST}:${PORT}`);
});

/** Arrêt propre : Playwright envoie SIGTERM en fin de série. */
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => serveur.close(() => process.exit(0)));
}
