# Déploiement Azure Static Web Apps

`staticwebapp.config.json` décrit les en-têtes de sécurité, les règles de cache, les types MIME et la
page 404 du site. **Azure le lit à la racine du site publié**, il doit donc être copié dans `dist/`
au moment du build Azure :

```bash
pnpm build && cp deploy/azure/staticwebapp.config.json dist/
```

## Pourquoi il n'est plus dans `public/`

Il y était jusqu'au 14/09/2026, donc copié dans `dist/` à chaque build. Deux conséquences, toutes
deux inutiles tant que l'hébergement est GitHub Pages :

- Pages ignore complètement ce fichier : aucun des en-têtes qu'il décrit n'était servi, alors que le
  dépôt donnait l'impression du contraire ;
- il était publié en clair à `/staticwebapp.config.json`, exposant la politique de sécurité prévue.

Le fichier reste donc versionné et prêt, mais hors du site tant qu'Azure n'est pas la cible.

## Ce que la bascule apporte

La politique de sécurité du contenu et la politique de référent sont déjà appliquées sur GitHub
Pages, posées en balise `<meta>` dans `src/layouts/Base.astro`. Azure apportera en plus ce qu'une
balise ne peut pas porter : `X-Frame-Options`, `frame-ancestors`, `Strict-Transport-Security`,
`X-Content-Type-Options`, `Permissions-Policy`, et les durées de cache.

Le jour de la bascule, **retirer les deux balises de `Base.astro`** : les en-têtes prennent le
relais, et deux politiques concurrentes se cumulent au plus strict, ce qui n'est jamais ce qu'on veut.

## La CSP est en mode bloquant

Elle l'est depuis le 14/09/2026 : le comparateur et les quatre simulateurs passent désormais leurs
données par `<script type="application/json">`, non exécutable, et leur logique par des modules
externes. Aucun script exécutable en ligne ne subsiste. Elle a été vérifiée sans violation sur huit
pages. Le contrôle, si le doute revient :

```bash
pnpm build
grep -roc '<script>(' dist --include=index.html | grep -v ':0' || echo "aucun script en ligne"
```

Si un jour une violation apparaît, elle bloquera pour de bon : il n'y a plus de filet `Report-Only`,
et aucun `report-uri` n'est configuré. En ajouter un reste une bonne idée le jour où le site sera
public.
