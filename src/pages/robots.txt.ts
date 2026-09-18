import type { APIRoute } from 'astro';
import { site as reglages } from '@/config/site';
import { withBase } from '@/lib/href';

/**
 * robots.txt. Sur une prévisualisation (PUBLIC_NOINDEX = "true"), toute indexation est refusée :
 * une page de communication sur un produit financier ne doit pas être référencée avant validation.
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
        'Disallow: ' + withBase('/cookies'),
        '',
        'Sitemap: ' + origin + withBase('/sitemap-index.xml'),
        '',
      ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
