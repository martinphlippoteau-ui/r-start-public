/**
 * Données structurées (JSON-LD) générées depuis content/fr, jamais en dur.
 *  - organizationJsonLd()  : CORUM L'Épargne (legal.publisher), logo, sameAs corum.fr, contactPoint.
 *  - webPageJsonLd({…})    : WebPage de la page courante, about = InvestmentFund « R Start ».
 *  - breadcrumbJsonLd(key) : BreadcrumbList d'une sous-page (src/config/pages.ts → breadcrumb).
 *  - faqJsonLd(items)      : FAQPage, strictement les questions / réponses visibles.
 * Interdits (signaux marchands trompeurs sur un produit financier) : Product, Offer, AggregateRating.
 * Appelé par les pages, l'accueil compris, qui passent le résultat à Base.astro (prop `jsonLd`).
 */
import publisherLogo from '@/assets/logos/corum-lepargne-couleur.svg';
import { breadcrumb, type PageKey } from '@/config/pages';
import { site } from '@/config/site';
import { externalLinks, product } from '@/content/fr/facts';
import { publisher } from '@/content/fr/legal';
import type { FaqItem } from '@/content/types';
import { withBase } from '@/lib/href';

export type JsonLd = Record<string, unknown>;

const CONTEXT = 'https://schema.org';

/** Identifiant stable de l'organisation, partagé entre les blocs (`publisher: { '@id': … }`). */
export const organizationId = externalLinks.corum + '#organization';

/** URL absolue d'un chemin du site (« / » → site.url, « /frais » → site.url/frais). */
export const absoluteUrl = (path: string): string =>
  new URL(withBase(path), site.url + '/').toString();

export function organizationJsonLd(): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'Organization',
    '@id': organizationId,
    name: publisher.name,
    url: externalLinks.corum,
    logo: absoluteUrl(publisherLogo.src),
    sameAs: [externalLinks.corum],
    address: { '@type': 'PostalAddress', streetAddress: publisher.address, addressCountry: 'FR' },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: product.phoneIntl,
      email: publisher.email,
      contactType: 'customer service',
      availableLanguage: 'fr',
    },
  };
}

export interface WebPageInput {
  /** Chemin de la page (ex. « / », « /frais »). */
  path: string;
  title: string;
  description: string;
  keywords?: string[];
}

export function webPageJsonLd({ path, title, description, keywords }: WebPageInput): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'WebPage',
    url: absoluteUrl(path),
    name: title,
    description,
    inLanguage: 'fr',
    ...(keywords && keywords.length ? { keywords: keywords.join(', ') } : {}),
    about: { '@type': 'InvestmentFund', name: product.name },
    publisher: { '@id': organizationId },
  };
}

export function breadcrumbJsonLd(key: PageKey): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumb(key).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      // Même intitulé que le fil d'Ariane affiché (Breadcrumb.astro) : Google demande que la donnée
      // structurée reprenne ce que voit le lecteur.
      name: p.navLabel ?? p.label,
      item: absoluteUrl(p.path),
    })),
  };
}

export function faqJsonLd(items: FaqItem[]): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      /* TOUT ce que la page affiche, dans le même ordre : paragraphes, puces, tableau, conclusion.
         Seul `answer` était repris : « Quels sont les frais de R Start ? » perdait son tableau et
         « Quel est le niveau de risque » s'arrêtait avant « le capital et les revenus ne sont pas
         garantis ». C'est la version que les moteurs et les assistants citent hors contexte (audit
         du 18/09/2026). */
      acceptedAnswer: {
        '@type': 'Answer',
        text: [
          ...item.answer,
          ...(item.bullets ?? []),
          ...(item.table
            ? [item.table.head.join(' : '), ...item.table.rows.map((ligne) => ligne.join(' : '))]
            : []),
          ...(item.tableAfter ?? []),
        ].join('\n\n'),
      },
    })),
  };
}
