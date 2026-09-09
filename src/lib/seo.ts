/**
 * Données structurées (JSON-LD) générées depuis content/fr, jamais en dur.
 *  - organizationJsonLd()  : CORUM L'Épargne (legal.publisher), logo, sameAs corum.fr, contactPoint.
 *  - webPageJsonLd({…})    : WebPage de la page courante, about = InvestmentFund « R Start ».
 *  - breadcrumbJsonLd(key) : BreadcrumbList d'une sous-page (src/config/pages.ts → breadcrumb).
 *  - faqJsonLd(items)      : FAQPage, strictement les questions / réponses visibles.
 * Interdits (signaux marchands trompeurs sur un produit financier) : Product, Offer, AggregateRating.
 * Logique extraite de src/pages/index.astro ; l'intégrateur y remplace le bloc inline par ces appels.
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
export const absoluteUrl = (path: string): string => new URL(withBase(path), site.url + '/').toString();

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
      name: p.label,
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
      acceptedAnswer: { '@type': 'Answer', text: item.answer.join('\n\n') },
    })),
  };
}
