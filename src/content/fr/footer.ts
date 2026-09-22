import type { FooterContent, FooterLink } from '@/content/types';
import { menuPages } from '@/config/pages';
import { externalLinks, product } from '@/content/fr/facts';
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
import { nb } from '@/lib/texte';

/**
 * Pied de page : colonnes de liens, libellé « Gérer les cookies », copyright et blocs de mentions
 * légales. Les mentions obligatoires (mentions 1 et 2, visa AMF, identité CLE et CAM, RGPD, médiation,
 * hébergeur) sont importées de legal.ts et reproduites à l'identique ; ce fichier ne fait que les
 * assembler en paragraphes courts.
 */

export const footer = {
  columns: [
    {
      title: 'R Start',
      /* Les pages du menu, et rien d'autre (16/09/2026, demande de l'équipe) : /documentation n'est
         plus appelée d'ici, et /faq vient déjà par `menuPages`. */
      links: [...menuPages.map((p): FooterLink => ({ label: p.navLabel ?? p.label, href: p.path }))],
    },
    {
      title: 'Documents',
      /*
       * Les cinq documents réglementaires, liste et ordre donnés par l'équipe le 16/09/2026, tous
       * marqués `soon` : le clic déplie « Document bientôt disponible ». La note d'information et
       * le bulletin de souscription ne sont plus atteignables d'ici, /documentation les sert
       * toujours ; le bulletin trimestriel et le rapport annuel n'ont aucun fichier au dépôt.
       * « Document d'informations clés (DIC) » garde son intitulé réglementaire exact.
       */
      links: [
        { label: 'Note d’information', href: '', soon: true },
        { label: 'Statuts', href: '', soon: true },
        { label: 'Document d’informations clés (DIC)', href: '', soon: true },
        { label: 'Bulletin trimestriel d’information', href: '', soon: true },
        { label: 'Rapport annuel', href: '', soon: true },
      ] satisfies FooterLink[],
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
  /* Déplié par les cinq entrées de la colonne Documents, toutes en attente (16/09/2026). */
  soonMessage: 'Document bientôt disponible',
  manageCookiesLabel: 'Gérer les cookies',
  /** Retour en haut, à côté des logos : ancre vers #contenu, comme le lien d'évitement. */
  backToTopLabel: 'Haut de page',
  copyright: `© 2026 ${publisher.name}. Tous droits réservés.`,
  legalTitle: 'Mentions légales',
  externalLinkHint: 'nouvelle fenêtre',
  /* Signature « R Start par CORUM L'Épargne » : pas de logo CORUM seul au dépôt (src/assets/logos),
     c'est donc l'éditeur du site qui signe, comme le copyright et les mentions légales dessous. */
  logos: { brandAlt: product.name, publisherAlt: publisher.name, byLabel: 'par' },
  /** Repli des blocs d'identité (« alléger sans retirer ») ; le premier, « Communication
      commerciale », reste déplié : il porte les mentions obligatoires et le visa. */
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
