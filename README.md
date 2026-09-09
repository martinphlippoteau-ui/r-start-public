# Site one-page R Start — CORUM L'Épargne

Site statique (Astro 7 + Tailwind 4 + GSAP) de présentation de la SCPI R Start, façon page produit
Apple, avec renvoi vers le tunnel de souscription réglementé. Hébergement Azure Static Web Apps.

## Démarrer

```bash
pnpm install
pnpm images                # prépare les visuels depuis ../Assets R Start (scripts/prepare-images.mjs)
cp .env.example .env       # renseigner PUBLIC_SITE_URL, PUBLIC_SUBSCRIBE_URL, PUBLIC_GTM_ID
pnpm dev                   # http://localhost:4321
pnpm verify                # build + HTML + conformité + e2e + Lighthouse
```

## Règles d'écriture (valables pour toute personne ou agent qui contribue)

1. **Aucun chiffre inventé.** Toute donnée produit vient de `src/content/fr/facts.ts` (source de vérité,
   tracée vers le DIC, le bulletin de souscription et la brochure). Un chiffre absent de ce fichier ne
   s'affiche pas.
2. **Aucun texte en dur dans les composants.** Les textes vivent dans `src/content/fr/<section>.ts` et
   sont typés par `src/content/types.ts`. Les mentions obligatoires sont dans `src/content/fr/legal.ts`
   et se reproduisent à l'identique.
3. **Équilibre avantages / risques (AMF).** Chaque avantage mis en avant est accompagné, dans le même
   bloc et dans la même taille de texte, de son contre-poids risque (`RiskPair` / `RiskNote`). Les
   risques ne vont jamais en note de bas de page ni en gris clair. La ligne risques du hero est visible
   sans scroller et n'est jamais animée.
4. **Aucune donnée de performance** (taux de distribution, TRI, rendement cible, scénarios) : R Start a
   moins de 12 mois d'historique. Aucun superlatif non sourcé, jamais « sans frais », « garanti »,
   « sécurisé », « meilleure SCPI » (liste dans `legal.ts`, contrôlée par `scripts/check-compliance.mjs`).
5. **Contrat de section.** Un composant par section dans `src/components/sections/NN-Nom.astro`, racine
   `<Section id={sections.<clé>.id}>`, contenu importé depuis `src/content/fr/<clé>.ts`, notes légales
   exportées via `export const notes: LegalNote[]`. Un contributeur de section ne modifie que ses
   fichiers : `sections/NN-Nom.astro`, `content/fr/<clé>.ts`, `assets/images/<clé>/`. Il ne touche pas à
   `index.astro`, `global.css`, `scripts/*`, `components/ui/*`, `package.json`.
6. **CTA unique.** Tout bouton « Souscrire » est un `<Button position="…">` sans `href` : l'URL vient de
   `src/config/site.ts` (`PUBLIC_SUBSCRIBE_URL`), l'analytics est automatique.
7. **Animations déclaratives.** Uniquement par attributs (`data-animate`, `data-counter`, `data-scene`…,
   vocabulaire complet dans la section « Motion » ci-dessous et en tête de `src/scripts/motion.ts`).
   Interdit sur le H1, l'image hero et tout `[data-risk]` — y compris par un ancêtre animé (on anime
   l'avantage seul, jamais l'enveloppe qui contient son risque). Jamais d'état initial invisible en CSS.
8. **Images.** Jamais les originaux : `pnpm images` produit `src/assets/images/*` (≤ 2400 px). Utiliser
   `<Picture>` / `<Image>` d'`astro:assets` avec un `alt` descriptif en français.
9. **HTML strict.** Compilateur Astro 7 : toute balise non vide doit être fermée.
10. **Chemins.** Le dossier du projet contient des espaces : toujours citer les chemins dans les scripts.

## Motion (chorégraphie au scroll)

Moteur déclaratif GSAP 3 + ScrollTrigger : `src/scripts/motion.ts` (point d'entrée léger, référence en
tête de fichier) et `src/scripts/motion/*.ts` (`engine.ts` = moteur GSAP, chunk séparé chargé via
`import()` au premier temps d'inactivité, jamais en reduced-motion). Une section n'écrit jamais de
code GSAP : elle pose des attributs. `<Section>` transmet les `data-*` à sa balise.

### Vocabulaire

| Attribut | Effet | Options |
| --- | --- | --- |
| `data-intro="1"` | Cascade d'entrée au premier rendu, en CSS pur (opacity + translateY 18 px, 500 ms, expo.out, 70 ms par rang, 6 rangs max) : classe `intro` rendue côté serveur sur `<html>` — déterministe, aucun flash, aucun GSAP. | `data-intro-move` : transform seul (obligatoire sur un candidat LCP) |
| `data-on-load="classe"` | Classe ajoutée à `load` (états CSS, ex. dézoom de l'image du hero). | |
| `data-in-view="classe"` | Classe posée tant que l'élément est dans le viewport (IntersectionObserver) : une animation CSS continue ne tourne qu'à l'écran (halo du hero). | |
| `data-animate="fade-up"` | Révélation unique à 88 % du viewport, 0,7 s / 24 px / expo.out (grands titres : 0,9 s) : `fade-up`, `fade`, `scale`, `tilt` (cartes, rotation 3D légère), `clip` (médias seulement, sinon fade-up), `stagger` (enfants directs en cascade, 20 px, 0,07 s). Un élément déjà à l'écran à l'initialisation n'est pas animé. | `data-animate-delay` (s), `data-animate-stagger` (s), `data-animate-y` (px) |
| `data-reveal-text` | Mot à mot à l'entrée, **titres courts (≤ 12 mots) uniquement** ; texte original conservé pour les lecteurs d'écran, mots visuels non sélectionnables. `="scrub"` : les mots s'allument au fil du défilement. | `data-reveal-start`, `data-reveal-end` |
| `data-counter="160000"` | Compteur (power3, 1,6 s, fr-FR) à 85 % du viewport, une fois ; valeur finale dans le HTML, largeur réservée pendant le comptage. Via `<Stat numeric>`. | `-prefix`, `-suffix`, `-decimals`, `-from`, `-duration` |
| `data-draw` | Tracé progressif des formes SVG (stroke-dashoffset, cascade). `="width"` : barre qui s'étire (scaleX, origine gauche). | `data-draw-scrub` (piloté par le scroll), `data-draw-start/-end`, `data-draw-stagger` |
| `data-fill="0.57"` | Jauge remplie à l'entrée (scaleX 0 → 1 ; `data-fill-axis="y"` pour scaleY). L'état statique (largeur 57 % dans le HTML) est la vérité ; la valeur règle la durée. | |
| `data-parallax="0.15"` | translateY proportionnel au défilement (0 → −0,15 × hauteur du viewport sur la traversée ; valeur négative = arrière-plan). | `data-parallax-trigger` (sélecteur ou `parent`), `-start`, `-end` |
| `data-scrub="scale:1,1.08\|opacity:1,0"` | Interpolation `prop:from,to` par propriété (x, y, xPercent, yPercent, scale, scaleX, scaleY, rotate, opacity) sur la traversée du viewport. | `data-scrub-trigger`, `-start` (`top bottom`), `-end` (`bottom top`), `-ease` |
| `data-scene` + `data-scene-end="+=120%"` | Scène épinglée (pinSpacing, anticipatePin, `will-change` pendant l'activité seulement) : les enfants `[data-step]` s'enchaînent (le premier visible d'emblée, chaque suivant entre pendant que le précédent sort). `data-step-stay` : le step reste. **La RiskNote se place hors des `[data-step]` et hors du `scene-stack`** (visible du début à la fin) ; un step qui contient un `[data-risk]` n'est jamais animé. Superposer les steps avec la classe `scene-stack`. La scène doit tenir dans un viewport. | `data-scene-start` |
| `data-curtain` | La section recouvre la précédente : celle-ci est épinglée sans espace réservé pendant que la section rideau (coins arrondis, ombre) monte. Le recul (scale 0.96 + opacity 0.6) n'est appliqué que si la précédente ne contient **aucun** `[data-risk]` (section purement visuelle) ; sinon pin + recouvrement seuls. La section rideau doit mesurer au moins la hauteur du viewport. | |
| `data-pin` + `data-pin-end` | Épinglage simple dans le parent (compatibilité). | |
| `data-progress` | Barre de lecture (scaleX sur `<main>`), masquée en reduced-motion. `data-compact-at="0.4"` : attribut `data-compact` posé après 40 % de la page (CTA compacté par `transform: scale(0.92)`). | `data-progress-for` |
| `data-brand-flight` | Vol de la marque : le grand logo du hero (dans le H1, dont le texte reste en visually-hidden) se détache dans un calque fixe, glisse vers le coin supérieur gauche, y attend la sous-navigation, puis lui passe le relais en fondu quand elle se colle. Le H1 réserve la place du logo en CSS (aucun décalage). Cible : `data-brand-target` (logo de la barre) ; `data-brand-rest` (logo du header) est masqué pendant le vol. Sans effet si la cible est masquée (sous `sm`). | |
| `data-no-motion` | Exclut l'élément et ses descendants de tout effet. | |

Micro-interactions CSS (`global.css`) : `btn-motion` (boutons : élévation + halo, scale 0.98 à l'appui),
`card-lift` (cartes : −4 px + ombre ; `<Card lift={false}>` pour un encadré statique), `nav-link`
(soulignement scaleX), `subnav-pill` (indicateur glissant, transform + width), `subnav-cta` (compact
par transform), `brand-halo-drift` (halo du hero, 20 s, en pause hors écran via `data-in-view`).

### Garde-fous (appliqués par le moteur, contrôlés par `scripts/check-compliance.mjs` et `tests/`)

- **Jamais d'effet** sur le H1, sur un `[data-risk]` (ligne risques, contre-poids, avertissements
  bulletin / DIC / commission d'arbitrage) ni sur les mentions du footer — **ni directement, ni par un
  ancêtre** : le moteur refuse tout attribut sur un élément qui contient un risque (`data-animate`,
  `data-scrub`, `data-parallax`, `data-intro`, `data-reveal-text`, `data-step`), les enfants d'un
  `stagger` qui en contiennent restent visibles, et le recul du rideau est supprimé si la section
  précédente en contient un. **Une révélation ne peut pas envelopper un risque : animer l'avantage
  seul, comme 02-Highlights** (avertissement en développement sinon). Contrôle : aucune
  transform/opacité ≠ 1 sur un `[data-risk]` à aucune position de scroll (`tests/conformite.spec.ts`).
  La ligne risques du hero reste visible sans scroller à 375 × 812 (≥ 24 px au-dessus du bandeau de
  consentement) et 1440 × 900.
- **LCP** : l'image du hero n'est jamais transformée par JS avant le LCP ; seul un dézoom CSS après
  `load` est admis (`data-on-load`), puis zoom/parallaxe au scroll à partir de la position 0. **Ne jamais
  poser `data-intro` (opacité) ni `data-animate` sur un candidat LCP** (grande image, plus grand
  paragraphe du premier viewport) : un élément à opacité 0 est ignoré par le LCP, qui glisse alors
  vers la fin du fondu — utiliser `data-intro-move` (transform seul) ou rien.
- **`prefers-reduced-motion: reduce`** : GSAP n'est pas chargé, rien n'est créé (gsap.matchMedia si la
  préférence change en cours de visite) — aucun pin, aucun scrub, contenu visible et stable ; cascade
  d'entrée et transitions CSS coupées par `@media`.
- **Performance** : transform et opacity uniquement (mini-syntaxe filtrée ; `clip` réservé aux médias ;
  pill de la sous-nav : width en plus, élément absolu vide), `will-change` posé le temps de l'animation
  (onToggle pour les scènes et scrubs), lectures groupées avant écritures, scrub ≤ 1, `anticipatePin` +
  `fastScrollEnd` sur les pins, `ScrollTrigger.config({ ignoreMobileResize })`, pas de ScrollSmoother
  ni de scroll hijacking, aucune dépendance supplémentaire. **Budget JS** : moteur hors du chemin
  critique (chunk `engine` chargé par `import()`, pas de modulepreload, jamais en reduced-motion) ;
  poids mesuré GSAP core + ScrollTrigger ≈ 45 Ko gzip + moteur ≈ 4 Ko — le budget « < 40 Ko gzip »
  n'est pas atteignable avec ScrollTrigger et reste à arbitrer (acter ≈ 50 Ko, ou remplacer
  ScrollTrigger).
- **Anti-CLS** : jamais d'état initial invisible en CSS (GSAP pose l'état de départ ; la cascade
  d'entrée CSS se résout seule en 850 ms au plus, `animation-fill-mode: backwards`) ; pins avec
  `pinSpacing` ; compteurs avec largeur réservée ; `scene-stack` actif seulement quand le moteur tourne ;
  un élément déjà à l'écran à l'initialisation du moteur n'est pas ré-animé (arrivée par une ancre).
- **Accessibilité** : rien ne dépend d'un survol pour être lu ; révélations `once` (interruptibles),
  scènes en scrub ; steps masqués non focusables et ramenés à l'écran si le focus y entre ; texte
  original conservé pour les lecteurs d'écran et mots visuels non sélectionnables (`data-reveal-text`,
  titres courts seulement).
- **Contenu** : valeurs finales (compteurs, jauges, textes) dans le HTML ; sans JS, tout est exact.
- **Vérification** : `pnpm check` (0 erreur), captures avant/après, mesure CLS < 0,05 et LCP via
  Playwright (PerformanceObserver), test en `reducedMotion: 'reduce'` (aucune transformation).

## Structure

`src/config/sections.ts` fixe l'ordre des sections : Aperçu · Points forts · Frais · Stratégie ·
Revenus · Souscrire · CORUM · Risques · Documents · FAQ · Notes.

## Déploiement Azure Static Web Apps

- Automatique : `.github/workflows/azure-swa.yml` (secret `AZURE_STATIC_WEB_APPS_API_TOKEN`, variables
  `PUBLIC_SITE_URL`, `PUBLIC_SUBSCRIBE_URL`, `PUBLIC_GTM_ID`).
- Manuel : `pnpm build` puis
  `npx @azure/static-web-apps-cli deploy ./dist --env production --deployment-token <token>`.
- En-têtes, cache, CSP (en mode Report-Only au départ) et 404 : `public/staticwebapp.config.json`.

## Points en attente de validation CORUM

- SRI : 4/7 confirmé par CORUM le 08/09/2026. Le DIC V7 hébergé (20/05/2026) indique encore 3/7 : fournir le DIC à jour
  pour remplacer `public/documents/r-start-dic.pdf`.
- PDF des statuts tronqué à la source (61 Ko, illisible) : exclu de la section Documents tant qu'un fichier complet
  n'est pas fourni (puis repasser le seuil à 4 dans `scripts/check-compliance.mjs` et `tests/conformite.spec.ts`).
- Note d'information : le fichier fourni est intitulé « projet V8 » ; confirmer qu'il s'agit de la version visée ou le
  remplacer par celle publiée sur corum.fr.
- Allégation « seule SCPI sans frais de souscription ni frais d'acquisition » : non utilisée par défaut
  (formulation factuelle « 0 % de frais de souscription, 0 % de frais d'acquisition »).
- Versements programmés (PEI) à partir de 50 € par mois : affiché (adhésion PEI d'avril 2026) ; cas d'exonération de la
  commission de retrait affichés (note d'information ch. III § 6, libellé exact à confirmer).
- Date de référence des chiffres groupe CORUM (9,6 Md€, +160 000 épargnants) : bloc masqué (`STATS_DATED = false` dans
  `src/content/fr/corum.ts`) jusqu'à ce que `facts.corumGroup.statsSource` soit daté.
- Domaine : r-start.com (URL canonique https://r-start.com).
- Directeur de la publication (Anne Carrizo, d'après corum.fr) et police de marque.
- Validation Conformité CLE de l'ensemble des textes (`src/content/fr/*.ts`) avant mise en ligne.
