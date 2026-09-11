import type { FooterContent, FooterLink } from '@/content/types';
import { menuPages, pages } from '@/config/pages';
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

export const footer = {
  columns: [
    {
      title: 'R Start',
      // Pages du menu (jamais d'ancre de section), puis les deux pages hors menu : la documentation
      // (sortie du menu le 11/09/2026) et la salle de presse, réservée aux journalistes. : réservée aux journalistes, elle n'est pas au
      // menu (src/config/pages.ts, inMenu: false) et n'est accessible que d'ici.
      links: [
        ...menuPages.map((p): FooterLink => ({ label: p.navLabel ?? p.label, href: p.path })),
        { label: pages.documentation.label, href: pages.documentation.path } satisfies FooterLink,
        { label: pages.pressRoom.label, href: pages.pressRoom.path } satisfies FooterLink,
      ],
    },
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
  /** aria-label de la navigation du pied de page ; sert aussi de H2 masqué au-dessus des colonnes (H3). */
  navLabel: 'Pied de page',
  manageCookiesLabel: 'Gérer les cookies',
  copyright: `© 2026 ${publisher.name}. Tous droits réservés.`,
  notesTitle: 'Notes et sources',
  /** `{n}` : nombre de notes de la page, calculé par LegalNotes.astro. */
  notesToggleLabel: 'Notes et sources ({n})',
  legalTitle: 'Mentions légales',
  externalLinkHint: 'nouvelle fenêtre',
  logos: { brandAlt: product.name, publisherAlt: publisher.name },
  /**
   * Libellé du repli des blocs d'identité (plan V2 §4, « alléger sans retirer »). Le premier bloc,
   * « Communication commerciale », reste déplié : il porte les mentions obligatoires et le visa.
   */
  legalToggleLabel: 'Mentions légales détaillées',
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
