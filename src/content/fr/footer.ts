import type { FooterContent, FooterLink } from '@/content/types';
import { menuPages, pages } from '@/config/pages';
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
      /*
       * LES PAGES DU MENU, ET RIEN D'AUTRE depuis le 16/09/2026. Le lien vers /documentation a été
       * retiré à la demande de l'équipe ; la page existe toujours, elle n'est plus appelée d'ici.
       * /faq est arrivée au menu le même jour, elle vient donc par `menuPages` : la répéter la ferait
       * figurer deux fois dans la même colonne.
       * La salle de presse était sortie le 15/09/2026, sa route étant désactivée
       * (src/pages/_salle-de-presse.astro) : le lien aurait pointé dans le vide.
       */
      links: [...menuPages.map((p): FooterLink => ({ label: p.navLabel ?? p.label, href: p.path }))],
    },
    {
      title: 'Documents',
      /*
       * LES CINQ DOCUMENTS RÉGLEMENTAIRES, liste et ordre donnés par l'équipe le 16/09/2026. Aucun
       * n'est servi : tous sont marqués `soon`, et le clic déplie « Document bientôt disponible » au
       * lieu d'ouvrir un fichier.
       * C'EST UN CHANGEMENT DE FOND. La colonne servait deux PDF réellement hébergés, la note
       * d'information et le bulletin de souscription ; ils ne sont plus atteignables depuis le pied
       * de page. Les fichiers restent dans public/documents, et /documentation les sert toujours.
       * DEUX ENTRÉES N'ONT AUCUN FICHIER au dépôt : le bulletin trimestriel d'information et le
       * rapport annuel. Le bulletin de souscription, lui, n'est plus listé : la demande énumère cinq
       * documents, il n'en fait pas partie.
       * « Document d'informations clés (DIC) » garde son intitulé réglementaire exact, celui que
       * porte le document, et non la forme abrégée de la demande.
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
  notesTitle: 'Notes et sources',
  /** `{n}` : nombre de notes de la page, calculé par LegalNotes.astro. */
  notesToggleLabel: 'Notes et sources ({n})',
  legalTitle: 'Mentions légales',
  externalLinkHint: 'nouvelle fenêtre',
  /*
   * Signature « R Start par CORUM L'Épargne » (14/09/2026). Il n'existe pas de logo CORUM seul
   * dans le dépôt (src/assets/logos ne contient que corum-lepargne-couleur.svg) : c'est donc
   * l'éditeur du site qui signe, ce que répète le copyright et que détaillent les mentions
   * légales (éditeur, société de gestion) juste en dessous.
   */
  logos: { brandAlt: product.name, publisherAlt: publisher.name, byLabel: 'par' },
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
