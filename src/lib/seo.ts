/**
 * Données structurées (JSON-LD) générées depuis content/fr, jamais en dur.
 *  - organizationJsonLd()  : CORUM L'Épargne (legal.publisher), logo, sameAs corum.fr, contactPoint.
 *  - webPageJsonLd({…})    : WebPage de la page courante, about = InvestmentFund « R Start ».
 *  - breadcrumbJsonLd(key) : BreadcrumbList d'une sous-page (src/config/pages.ts → breadcrumb).
 *  - faqJsonLd(items)      : FAQPage, strictement les questions / réponses visibles.
 *  - socleJsonLd()         : organisation + site (WebSite) + le fonds (InvestmentFund), sur chaque page.
 *  - listeJsonLd(…)        : ItemList (articles de presse, documents), strictement ce qui est affiché.
 *  - applicationJsonLd(…)  : WebApplication (le simulateur).
 * DONNÉES STRUCTURÉES COMPLÈTES (25/09/2026, demande de Martin : « bien balisés pour être référencés
 * dans les LLMs ») : les moteurs et les assistants lisent ces blocs pour savoir QUI parle (CORUM
 * L'Épargne, distributeur ; CORUM Asset Management, société de gestion), DE QUOI (le fonds R Start,
 * son visa AMF, la page de ses frais) et CE QUE CONTIENT chaque page. Tout vient des contenus déjà
 * validés (facts.ts, legal.ts, press.ts, documentation.ts) : aucun texte nouveau, aucune promesse.
 * Interdits (signaux marchands trompeurs sur un produit financier) : Product, Offer, AggregateRating.
 * Appelé par les pages, l'accueil compris, qui passent le résultat à Base.astro (prop `jsonLd`).
 */
/* PNG et non SVG (audit SEO du 25/09/2026) : Google n'accepte pas de logo SVG dans les données
   structurées. 600 × 267 px, fond blanc, généré depuis le SVG du pied de page. */
import publisherLogo from '@/assets/logos/corum-lepargne-couleur.png';
import { breadcrumb, type PageKey } from '@/config/pages';
import { site } from '@/config/site';
import { externalLinks, product } from '@/content/fr/facts';
import { managementCompany, publisher } from '@/content/fr/legal';
import type { FaqItem } from '@/content/types';
import { withBase } from '@/lib/href';

export type JsonLd = Record<string, unknown>;

const CONTEXT = 'https://schema.org';

/** Identifiant stable de l'organisation, partagé entre les blocs (`publisher: { '@id': … }`). */
export const organizationId = externalLinks.corum + '#organization';

/** Date de la construction : `dateModified` des pages (la même pour toutes, comme le plan du site). */
const DATE_BUILD = new Date().toISOString().slice(0, 10);

/** URL absolue d'un chemin du site (« / » → site.url, « /frais » → site.url/frais). */
export const absoluteUrl = (path: string): string =>
  new URL(withBase(path), site.url + '/').toString();

/** Identifiants du site et du fonds, partagés entre les blocs et entre les pages. */
const websiteId = (): string => absoluteUrl('/') + '#website';
const fundId = (): string => absoluteUrl('/') + '#fonds';

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

/** Le site : son nom, sa langue, son éditeur. */
export function websiteJsonLd(): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'WebSite',
    '@id': websiteId(),
    url: absoluteUrl('/'),
    name: product.name,
    inLanguage: 'fr',
    publisher: { '@id': organizationId },
  };
}

/**
 * Le fonds R Start. Société de gestion (`provider`) et distributeur (`broker`) distingués, visa AMF
 * en identifiant, page des frais en spécification des frais. `description` : la nature juridique du
 * produit (facts.ts), pas une accroche.
 */
export function fundJsonLd(): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'InvestmentFund',
    '@id': fundId(),
    name: product.name,
    alternateName: product.legalName,
    description: product.type,
    url: absoluteUrl('/'),
    identifier: {
      '@type': 'PropertyValue',
      name: 'Visa AMF',
      value: `SCPI n° ${product.visa.number} du ${product.visa.date}`,
    },
    provider: {
      '@type': 'Organization',
      name: managementCompany.name,
      address: { '@type': 'PostalAddress', streetAddress: managementCompany.address, addressCountry: 'FR' },
    },
    broker: { '@id': organizationId },
    feesAndCommissionsSpecification: absoluteUrl('/frais'),
    areaServed: 'FR',
  };
}

/** Le socle, sur chaque page : qui publie, quel site, quel fonds. */
export const socleJsonLd = (): JsonLd[] => [organizationJsonLd(), websiteJsonLd(), fundJsonLd()];

export interface WebPageInput {
  /** Chemin de la page (ex. « / », « /frais »). */
  path: string;
  title: string;
  description: string;
  keywords?: string[];
  /** Type schema.org de la page : WebPage par défaut, AboutPage, CollectionPage… */
  type?: 'WebPage' | 'AboutPage' | 'CollectionPage' | 'ContactPage';
}

export function webPageJsonLd({ path, title, description, keywords, type = 'WebPage' }: WebPageInput): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': type,
    '@id': absoluteUrl(path) + '#page',
    url: absoluteUrl(path),
    name: title,
    description,
    inLanguage: 'fr',
    dateModified: DATE_BUILD,
    ...(keywords && keywords.length ? { keywords: keywords.join(', ') } : {}),
    isPartOf: { '@id': websiteId() },
    about: { '@id': fundId() },
    publisher: { '@id': organizationId },
  };
}

/** Une liste affichée par la page (articles de presse, documents), élément par élément. */
export function listeJsonLd(nom: string, elements: JsonLd[]): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'ItemList',
    name: nom,
    numberOfItems: elements.length,
    itemListElement: elements.map((item, i) => ({ '@type': 'ListItem', position: i + 1, item })),
  };
}

/** Le simulateur : une application en ligne gratuite, sans promesse de résultat. */
export function applicationJsonLd({ path, name, description }: { path: string; name: string; description: string }): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'WebApplication',
    name,
    description,
    url: absoluteUrl(path),
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Tous navigateurs',
    isAccessibleForFree: true,
    inLanguage: 'fr',
    about: { '@id': fundId() },
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
