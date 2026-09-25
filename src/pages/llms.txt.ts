import type { APIRoute } from 'astro';
import { pages } from '@/config/pages';
import { aboutPage } from '@/content/fr/aboutPage';
import { documentation } from '@/content/fr/documentation';
import { faq } from '@/content/fr/faq';
import { product } from '@/content/fr/facts';
import { feesPage } from '@/content/fr/feesPage';
import { managementCompany, publisher, shortRiskLine, visaNotice } from '@/content/fr/legal';
import { press } from '@/content/fr/press';
import { seo } from '@/content/fr/seo';
import { simulator } from '@/content/fr/simulator';
import { strategyPage } from '@/content/fr/strategyPage';
import { absoluteUrl } from '@/lib/seo';

/**
 * /llms.txt (25/09/2026, demande de Martin : contenus « référencés dans les LLMs »). Format proposé
 * par llmstxt.org, lu par les assistants et leurs robots : un résumé du site et la liste de ses
 * pages, chacune avec sa description. RIEN N'EST ÉCRIT ICI : titres et descriptions sont les balises
 * SEO de chaque page, la nature du produit et les mentions viennent de facts.ts et legal.ts, déjà
 * validés. Servi même en prévisualisation : il ne fait qu'énumérer ce que les pages publient.
 */
export const GET: APIRoute = () => {
  const ligne = (titre: string, chemin: string, description: string): string =>
    `- [${titre}](${absoluteUrl(chemin)}): ${description}`;
  const docs = documentation.groups.flatMap((g) => g.items);
  const corps = [
    `# ${product.name}`,
    '',
    `> ${seo.description}`,
    '',
    `${product.legalName}. Société de gestion : ${managementCompany.name}. Distributeur et éditeur du site : ${publisher.name}. ${visaNotice}`,
    '',
    shortRiskLine,
    '',
    '## Pages',
    '',
    ligne(seo.title, pages.home.path, seo.description),
    ligne(feesPage.seo.title, pages.fees.path, feesPage.seo.description),
    ligne(simulator.seo.title, pages.simulator.path, simulator.seo.description),
    ligne(strategyPage.seo.title, pages.strategy.path, strategyPage.seo.description),
    ligne(faq.pageTitle ?? faq.title, pages.faq.path, faq.pageDescription ?? ''),
    ligne(press.seo.title, pages.press.path, press.seo.description),
    ligne(aboutPage.seo.title, pages.about.path, aboutPage.seo.description),
    ligne(documentation.seo.title, pages.documentation.path, documentation.seo.description),
    '',
    '## Documents',
    '',
    ...docs.map((d) => `- [${d.title}](${absoluteUrl(d.file)}): ${d.description}`),
    '',
    '## Optional',
    '',
    `- [Mentions légales](${absoluteUrl('/mentions-legales')})`,
    `- [Politique de confidentialité](${absoluteUrl('/politique-de-confidentialite')})`,
    '',
  ].join('\n');
  return new Response(corps, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
