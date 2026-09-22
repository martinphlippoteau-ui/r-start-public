/**
 * RECHERCHE DU SITE : L'INDEX (17/09/2026). Intégration Astro, déclarée dans astro.config.mjs.
 *
 * L'INDEX EST TIRÉ DU HTML PUBLIÉ, pas des fichiers de contenu : c'est ce que le visiteur lit qu'il
 * cherche, et une section ajoutée, déplacée ou renommée entre dans l'index au build suivant sans que
 * personne n'ait à tenir une table de correspondance entre pages et contenus.
 *
 * CE QUI EST INDEXÉ (arbitrage de Martin du 17/09/2026) : les pages du menu (src/config/pages.ts,
 * `menuPages`) et les questions de /faq. Ni /documentation, ni les PDF, ni les pages légales.
 *  - rubrique « Pages » : pour chaque page, son en-tête (le h1 et son introduction, lien vers la page),
 *    puis chacune de ses sections titrées (`<section id>` portant un h2, lien vers la section) ;
 *  - rubrique « Questions » : chaque question de /faq, lien vers son ancre (src/lib/ancre.ts).
 * Les sections FAQ courtes des autres pages sont écartées : leurs questions sont déjà dans la rubrique
 * « Questions ». Une section présente sur plusieurs pages (les risques, les chiffres du groupe) n'est
 * gardée qu'une fois, sur la sous-page plutôt que sur l'accueil : le détail vit sur les sous-pages.
 *
 * CE QUI N'EST PAS LU dans une section : scripts, styles, images, boutons et liens-boutons (« Souscrire
 * en ligne » n'apprend rien), fils d'Ariane et autres <nav>, contenus masqués (`hidden`,
 * `aria-hidden="true"`, `sr-only`).
 * Les segments répétés dans une même section (recto et verso d'une carte retournée) ne comptent qu'une
 * fois.
 *
 * SORTIE : dist/recherche.json, chargé par le panneau à la première ouverture seulement
 * (src/scripts/recherche/panneau.ts). En développement, le même index est construit à la volée à partir des
 * pages servies par le serveur de dev.
 */
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parse, ELEMENT_NODE, TEXT_NODE } from 'ultrahtml';
import { querySelector, querySelectorAll } from 'ultrahtml/selector';
import { menuPages, pages } from '../src/config/pages.ts';
import { plier } from '../src/lib/texte.ts';

export const FICHIER_INDEX = 'recherche.json';

/** Sections qui ne donnent pas de résultat « Pages ». */
const SECTIONS_ECARTEES = new Set(['faq']);
/** En-têtes de page : ils donnent le résultat de la page elle-même. */
const EN_TETES = new Set(['en-tete', 'apercu']);

const ELEMENTS_IGNORES = new Set([
  'button',
  'canvas',
  'dialog',
  'iframe',
  'img',
  'input',
  'nav',
  'noscript',
  'picture',
  'script',
  'select',
  'style',
  'svg',
  'template',
  'textarea',
  'video',
]);
const BLOCS =
  /^(address|article|aside|blockquote|br|caption|dd|details|div|dl|dt|figcaption|figure|footer|h[1-6]|header|hr|li|main|ol|p|section|summary|table|tbody|td|tfoot|th|thead|tr|ul)$/;

const ENTITES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' };
const decoder = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (tout, e) => {
    if (e[0] === '#') {
      const code =
        e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : tout;
    }
    return ENTITES[e.toLowerCase()] ?? tout;
  });

/**
 * `titre` : un titre de section peut être masqué à l'écran et rester le nom de la section pour les
 * lecteurs d'écran (`sr-only`) ; il est alors lu. Dans le corps d'une section, il ne l'est pas.
 */
const ignore = (n, { titre = false } = {}) => {
  const a = n.attributes ?? {};
  const classes = ` ${a.class ?? ''} `;
  return (
    ELEMENTS_IGNORES.has(n.name) ||
    'hidden' in a ||
    a['aria-hidden'] === 'true' ||
    'data-cta' in a ||
    / btn /.test(classes) ||
    (!titre && / (sr-only|visually-hidden) /.test(classes))
  );
};

/**
 * Texte lisible d'un nœud, en segments : un segment par bloc. Les segments identiques ne sont gardés
 * qu'une fois, et ceux qui ne finissent pas une phrase (libellé de chiffre, titre de carte) sont joints
 * par un point médian, pour que l'extrait affiché reste lisible.
 */
const texte = (racine, { sauf, titre = false } = {}) => {
  const segments = [];
  let courant = '';
  const vider = () => {
    const s = courant.replace(/[ \t\n\r\f\v]+/g, ' ').trim();
    if (s && !segments.includes(s)) segments.push(s);
    courant = '';
  };
  const visiter = (n) => {
    if (n === sauf) return;
    if (n.type === TEXT_NODE) {
      courant += decoder(n.value);
      return;
    }
    if (n.type !== ELEMENT_NODE) return;
    if (ignore(n, { titre })) return;
    const bloc = BLOCS.test(n.name);
    if (bloc) vider();
    for (const enfant of n.children ?? []) visiter(enfant);
    if (bloc) vider();
  };
  for (const enfant of racine.children ?? []) visiter(enfant);
  vider();
  return segments.reduce(
    (tout, s) => (tout ? tout + (/[.!?:;…»)]$/.test(tout) ? ' ' : ' · ') + s : s),
    ''
  );
};

/** Clé de comparaison de deux titres de section : le pliage du site (src/lib/texte.ts), mots seuls. */
const normaliser = (s) =>
  plier(s)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Un ancêtre `<section id>` : la section est alors une sous-partie, portée par sa section mère. */
const imbriquee = (n) => {
  for (let p = n.parent; p; p = p.parent) if (p.name === 'section' && p.attributes?.id) return true;
  return false;
};

/**
 * Construit les documents de l'index.
 * @param {{ key: string, html: string }[]} rendus  HTML de chaque page du menu, dans l'ordre du menu
 * @param {(chemin: string) => string} avecBase      préfixe le chemin de base du site
 */
export const construireIndex = (rendus, avecBase) => {
  const sections = [];
  const entetes = [];
  const questions = [];

  rendus.forEach(({ key, html }, rang) => {
    const page = pages[key];
    const main = querySelector(parse(html), 'main');
    if (!main) throw new Error(`recherche : <main> introuvable sur ${page.path}`);
    const contexte = page.navLabel ?? page.label;

    for (const section of querySelectorAll(main, 'section[id]')) {
      const id = section.attributes.id;
      if (imbriquee(section) || SECTIONS_ECARTEES.has(id)) continue;
      if (EN_TETES.has(id)) {
        entetes.push({
          rang,
          doc: {
            type: 'page',
            titre: key === 'home' ? page.label : contexte,
            url: avecBase(page.path),
            texte: texte(section),
          },
        });
        continue;
      }
      const titre = querySelector(section, 'h2') ?? querySelector(section, 'h1');
      if (!titre) continue;
      const libelle = texte({ children: [titre] }, { titre: true });
      if (!libelle) continue;
      sections.push({
        rang,
        accueil: key === 'home',
        doc: {
          type: 'page',
          titre: libelle,
          contexte,
          url: `${avecBase(page.path)}#${id}`,
          texte: texte(section, { sauf: titre }),
        },
      });
    }

    if (key === 'faq') {
      const liste = querySelector(main, '[data-faq-liste]');
      let rubrique = '';
      for (const li of liste?.children ?? []) {
        if (li.type !== ELEMENT_NODE) continue;
        /* Sur l'attribut du <li>, et non plus sur le <p> : chaque question porte son libellé depuis le
           18/09/2026, masqué sauf sur la première de la rubrique, et `texte()` ignore ce qui est masqué. */
        if (li.attributes?.['data-rubrique']) rubrique = decoder(li.attributes['data-rubrique']);
        const details = querySelector(li, 'details[data-faq]');
        if (!details?.attributes.id) continue;
        const reponse = querySelector(details, '.faq-answer');
        questions.push({
          type: 'question',
          titre: decoder(details.attributes['data-faq']),
          contexte: rubrique || undefined,
          url: `${avecBase(page.path)}#${details.attributes.id}`,
          texte: reponse ? texte(reponse) : '',
        });
      }
    }
  });

  /* Doublons : une section de même titre n'est gardée qu'une fois, sur la sous-page de préférence. */
  const gardees = new Set();
  const vus = new Set();
  [...sections]
    .sort((a, b) => Number(a.accueil) - Number(b.accueil) || a.rang - b.rang)
    .forEach((s) => {
      const cle = normaliser(s.doc.titre);
      if (vus.has(cle)) return;
      vus.add(cle);
      gardees.add(s);
    });

  const pagesDocs = [];
  rendus.forEach((_, rang) => {
    entetes.filter((e) => e.rang === rang).forEach((e) => pagesDocs.push(e.doc));
    sections.filter((s) => s.rang === rang && gardees.has(s)).forEach((s) => pagesDocs.push(s.doc));
  });

  if (!questions.length) throw new Error('recherche : aucune question relevée sur /faq');
  return { version: 1, docs: [...pagesDocs, ...questions] };
};

const fichierDePage = (chemin) =>
  chemin === '/' ? 'index.html' : path.join(chemin.replace(/^\/+|\/+$/g, ''), 'index.html');

export default function rechercheIntegration() {
  let base = '/';
  /* Même forme que `withBase` (src/lib/href.ts) : une page s'adresse avec sa barre finale, l'hébergeur
     redirige sinon. « /frais » donne « /frais/ », et l'ancre s'ajoute derrière. Un fichier reste tel quel. */
  const avecBase = (chemin) =>
    base.replace(/\/+$/, '') +
    (chemin.endsWith('/') || /\.[a-z0-9]+$/i.test(chemin) ? chemin : chemin + '/');

  return {
    name: 'r-start:recherche',
    hooks: {
      'astro:config:done': ({ config }) => {
        base = config.base || '/';
      },

      'astro:build:done': async ({ dir, logger }) => {
        const racine = fileURLToPath(dir);
        const rendus = await Promise.all(
          menuPages.map(async (p) => ({
            key: p.key,
            html: await fs.readFile(path.join(racine, fichierDePage(p.path)), 'utf8'),
          }))
        );
        const index = construireIndex(rendus, avecBase);
        await fs.writeFile(path.join(racine, FICHIER_INDEX), JSON.stringify(index));
        const nb = (type) => index.docs.filter((d) => d.type === type).length;
        logger.info(
          `${FICHIER_INDEX} : ${nb('page')} passages de pages, ${nb('question')} questions`
        );
      },

      /* En développement : les pages sont rendues à la demande, l'index aussi. */
      'astro:server:setup': ({ server, logger }) => {
        server.middlewares.use(async (req, res, next) => {
          if ((req.url ?? '').split('?')[0] !== avecBase('/' + FICHIER_INDEX)) return next();
          try {
            /* L'adresse du serveur lui-même, pas celle de l'en-tête `Host` de la requête : un en-tête
               forgé faisait aller chercher les pages sur un hôte au choix de l'appelant. */
            const port = server.httpServer?.address()?.port ?? server.config.server.port ?? 4321;
            const origine = `http://localhost:${port}`;
            const rendus = await Promise.all(
              menuPages.map(async (p) => ({
                key: p.key,
                html: await (await fetch(origine + avecBase(p.path))).text(),
              }))
            );
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            res.end(JSON.stringify(construireIndex(rendus, avecBase)));
          } catch (erreur) {
            logger.error(`recherche : index de développement impossible, ${erreur}`);
            res.statusCode = 500;
            res.end();
          }
        });
      },
    },
  };
}
