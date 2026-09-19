import type { APIRoute } from 'astro';
import { site as reglages } from '@/config/site';
import { withBase } from '@/lib/href';

/**
 * robots.txt. Sur une prévisualisation (PUBLIC_NOINDEX = "true"), toute indexation est refusée :
 * une page de communication sur un produit financier ne doit pas être référencée avant validation.
 *
 * CE FICHIER NE PROTÈGE RIEN SOUS UN SOUS-CHEMIN (audit du 18/09/2026). Les robots ne lisent que la
 * racine de l'hôte : sur un site de projet GitHub Pages il est servi à /r-start-public/robots.txt, et
 * la racine répond 404. La prévisualisation tient donc par la balise meta `noindex` de chaque page
 * (Seo.astro), et par le fait que rien qui ne doive pas être lu n'est copié dans dist.
 *
 * /cookies N'EST PLUS EN `Disallow` : la page porte déjà `noindex`, et un robot qui respecte le
 * Disallow ne lit jamais la page, donc jamais le noindex. Les deux signaux s'annulaient, et l'adresse
 * pouvait rester indexée sans contenu si un site la liait.
 */
export const GET: APIRoute = ({ site }) => {
  const origin = (site?.toString() ?? '').replace(/\/$/, '');
  /* `reglages` et non `site` : la route reçoit déjà un paramètre `site`, l'adresse du site. */
  const preview = reglages.noindex;
  const body = preview
    ? ['# Prévisualisation : indexation refusée.', 'User-agent: *', 'Disallow: /', ''].join('\n')
    : [
        'User-agent: *',
        'Allow: /',
        '',
        'Sitemap: ' + origin + withBase('/sitemap-index.xml'),
        '',
      ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
