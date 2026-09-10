// Protège la prévisualisation par mot de passe : chaque page HTML de dist/ est chiffrée (AES-GCM,
// clé dérivée par PBKDF2) et remplacée par un écran de saisie autonome qui la déchiffre côté
// navigateur. Sans le mot de passe, le HTML livré ne contient que du texte chiffré.
//
// Limite assumée : les fichiers servis directement (PDF, images, CSS, JS) restent téléchargeables
// par leur adresse exacte. Pour une protection complète, il faut une authentification en amont
// (Cloudflare Access, App Service, etc.).
//
// Usage : PREVIEW_PASSWORD="…" node scripts/encrypt-preview.mjs
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PASSWORD = process.env.PREVIEW_PASSWORD || '';
const ITERATIONS = 250_000;

if (!PASSWORD) {
  console.error(
    'PREVIEW_PASSWORD est vide : la prévisualisation ne sera pas publiée sans protection.\n' +
      'Définissez le secret PREVIEW_PASSWORD dans le dépôt (Settings → Secrets and variables → Actions).'
  );
  process.exit(1);
}

const enc = new TextEncoder();

const deriveKey = async (salt) => {
  const material = await webcrypto.subtle.importKey('raw', enc.encode(PASSWORD), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return webcrypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
};

// Logo intégré au fichier : l'écran de saisie ne dépend d'aucune ressource externe.
const LOGO = (
  await fs.readFile(path.join(ROOT, 'src', 'assets', 'logos', 'r-start-blanc.svg'), 'utf8')
)
  .replace(/<\?xml[^>]*\?>/, '')
  .replace(/<svg /, '<svg role="img" aria-label="R Start" class="logo" ')
  .trim();

/** Écran de saisie autonome : aucune requête réseau, la page chiffrée est dans le fichier. */
const gate = ({ salt, iv, payload }) => `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Accès protégé — R Start</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0; min-height: 100svh; display: grid; place-items: center; padding: 1.5rem;
        font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
        background: linear-gradient(160deg, #0d2e3d 0%, #024b68 45%, #0b7a93 100%); color: #fff;
      }
      main { width: min(26rem, 100%); }
      .logo { display: block; width: 11rem; height: auto; margin: 0 0 2rem; }
      h1 { font-size: 1.5rem; line-height: 1.2; margin: 0 0 .5rem; letter-spacing: -.02em; }
      p { margin: 0 0 1.5rem; color: #dcf1f5; line-height: 1.5; }
      label { display: block; font-size: .875rem; font-weight: 600; margin-bottom: .5rem; }
      input {
        width: 100%; padding: .875rem 1rem; border-radius: 9999px; border: 1px solid rgba(255,255,255,.35);
        background: rgba(255,255,255,.08); color: #fff; font-size: 1rem;
      }
      input:focus-visible { outline: 3px solid #14a4ba; outline-offset: 2px; }
      button {
        margin-top: .75rem; width: 100%; padding: .875rem 1rem; border-radius: 9999px; border: 0;
        background: #fff; color: #024b67; font-size: 1rem; font-weight: 600; cursor: pointer;
      }
      button:hover { background: #dcf1f5; }
      .error { margin-top: .875rem; color: #f7e4e0; font-size: .875rem; min-height: 1.25rem; }
    </style>
  </head>
  <body>
    <main>
      ${LOGO}
      <h1>Accès protégé</h1>
      <p>Cette prévisualisation du site R Start est réservée aux équipes CORUM. Saisissez le mot de passe qui vous a été communiqué.</p>
      <form id="f">
        <label for="p">Mot de passe</label>
        <input id="p" type="password" autocomplete="current-password" autofocus required />
        <button type="submit">Afficher le site</button>
        <p class="error" id="e" role="status" aria-live="polite"></p>
      </form>
    </main>
    <script>
      const SALT = '${salt}';
      const IV = '${iv}';
      const DATA = '${payload}';
      const KEY = 'rstart-preview-password';
      const bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const form = document.getElementById('f');
      const input = document.getElementById('p');
      const error = document.getElementById('e');

      async function unlock(password, silent) {
        try {
          const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
          const key = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: bytes(SALT), iterations: ${ITERATIONS}, hash: 'SHA-256' },
            material,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
          );
          const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(IV) }, key, bytes(DATA));
          try { sessionStorage.setItem(KEY, password); } catch (err) { /* navigation privée */ }
          const html = new TextDecoder().decode(plain);
          document.open();
          document.write(html);
          document.close();
        } catch (err) {
          if (!silent) error.textContent = 'Mot de passe incorrect.';
          try { sessionStorage.removeItem(KEY); } catch (e2) { /* ignore */ }
        }
      }

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        error.textContent = '';
        unlock(input.value, false);
      });

      let saved = null;
      try { saved = sessionStorage.getItem(KEY); } catch (err) { saved = null; }
      if (saved) unlock(saved, true);
    </script>
  </body>
</html>
`;

async function* htmlFiles(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

let count = 0;
for await (const file of htmlFiles(DIST)) {
  const html = await fs.readFile(file, 'utf8');
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(salt);
  const cipher = new Uint8Array(
    await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(html))
  );
  await fs.writeFile(
    file,
    gate({
      salt: Buffer.from(salt).toString('base64'),
      iv: Buffer.from(iv).toString('base64'),
      payload: Buffer.from(cipher).toString('base64'),
    }),
    'utf8'
  );
  count += 1;
}

// Le plan du site listerait les adresses des pages : inutile en prévisualisation (déjà en noindex).
for (const name of ['sitemap-index.xml', 'sitemap-0.xml']) {
  await fs.rm(path.join(DIST, name), { force: true });
}

console.log(`Prévisualisation protégée : ${count} page(s) chiffrée(s), plan du site retiré.`);
console.log(
  'Rappel : les fichiers PDF, images et scripts restent accessibles par adresse directe.'
);
