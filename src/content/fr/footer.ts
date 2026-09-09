import type { FooterContent, FooterLink, SectionKey } from '@/content/types';
import { sections } from '@/config/sections';
import { externalLinks, product } from '@/content/fr/facts';
import { publishedDocuments } from '@/content/fr/documents';
import {
  commercialNotice,
  documentsNotice,
  gdpr,
  hosting,
  managementCompany,
  mediation,
  publisher,
  visaNotice,
} from '@/content/fr/legal';
import { legalPages } from '@/content/fr/pages';

/**
 * Pied de page : colonnes de liens, libellé « Gérer les cookies », copyright et blocs de mentions
 * légales. Les mentions obligatoires (mentions 1 et 2, visa AMF, identité CLE et CAM, RGPD, médiation,
 * hébergeur) sont importées de legal.ts et reproduites à l'identique ; ce fichier ne fait que les
 * assembler en paragraphes courts.
 */

/** Espace insécable avant « : » et « ; » dans les paragraphes assemblés ici. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, '\u00A0$1');

/** Sections principales de la page, dans l'ordre de src/config/sections.ts. */
const mainSectionKeys: readonly SectionKey[] = [
  'hero',
  'fees',
  'strategy',
  'income',
  'subscribe',
  'risks',
  'documents',
  'faq',
];

const anchor = (key: SectionKey): FooterLink => ({
  label: sections[key].label,
  href: `/#${sections[key].id}`, // préfixé pour fonctionner depuis les sous-pages
});

export const footer = {
  columns: [
    { title: 'R Start', links: mainSectionKeys.map(anchor) },
    {
      title: 'Documents',
      // Même liste que la section Documents (statuts exclus tant que le PDF n'est pas remplacé).
      links: publishedDocuments.map((d): FooterLink => ({ label: d.title, href: d.file })),
    },
    {
      title: 'Informations légales',
      links: legalPages.map((p): FooterLink => ({ label: p.title, href: p.path })),
    },
    {
      title: 'CORUM',
      links: [
        { label: 'corum.fr', href: externalLinks.corum, external: true },
        { label: 'Mentions légales CORUM', href: externalLinks.corumLegal, external: true },
      ],
    },
  ],
  navLabel: 'Pied de page',
  manageCookiesLabel: 'Gérer les cookies',
  copyright: `© 2026 ${publisher.name}. Tous droits réservés.`,
  notesTitle: 'Notes et sources',
  legalTitle: 'Mentions légales',
  externalLinkHint: 'nouvelle fenêtre',
  logos: { brandAlt: product.name, publisherAlt: publisher.name },
  legalBlocks: [
    {
      title: 'Communication commerciale',
      paragraphs: [commercialNotice, documentsNotice, visaNotice],
    },
    {
      title: 'Éditeur du site',
      paragraphs: [
        nb(
          `${publisher.name}, ${publisher.legalForm}, ${publisher.rcs}, ${publisher.address}. ${publisher.orias}. ${publisher.statuses.join(' ; ')}. ${publisher.supervisors}. Directeur de la publication : ${publisher.publicationDirector}. Téléphone : ${publisher.phone}. E-mail : ${publisher.email}.`
        ),
      ],
    },
    {
      title: 'Société de gestion',
      paragraphs: [
        `${managementCompany.name}, ${managementCompany.legalForm}, ${managementCompany.rcs}, ${managementCompany.address}. ${managementCompany.amfApproval}`,
        nb(
          `${product.legalName}, ${product.rcs}, ${product.address}. Dépositaire : ${product.depositary}.`
        ),
      ],
    },
    {
      title: 'Données personnelles',
      paragraphs: [
        nb(
          `Responsable de traitement : ${gdpr.controller}. ${gdpr.body} Délégué à la protection des données : ${gdpr.dpoEmail}.`
        ),
      ],
    },
    {
      title: 'Réclamation et médiation',
      paragraphs: [
        nb(
          `Pour toute réclamation relative à R Start, écrivez à ${managementCompany.complaintsEmail}. ${mediation.body} ${mediation.address}. Site : www.amf-france.org.`
        ),
      ],
    },
    {
      title: 'Hébergeur',
      paragraphs: [`${hosting.provider} (${hosting.region}), ${hosting.company}.`],
    },
  ],
} satisfies FooterContent;
