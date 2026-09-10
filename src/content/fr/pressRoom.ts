import type { LegalNote } from '@/content/types';
import type { PressContact, PressRelease, PressRoomContent } from '@/content/types-v2';
import { pages } from '@/config/pages';
import {
  fees,
  income,
  press as pressFacts,
  product,
  risk,
  share,
  strategy,
} from '@/content/fr/facts';
import { managementCompany, publisher, shortRiskLine } from '@/content/fr/legal';

/**
 * Page /salle-de-presse — destinée aux journalistes (arbitrage du 10/09/2026 : lien en pied de page
 * seulement, `inMenu: false`). Communiqués, contacts presse, kit média et texte de présentation.
 * La revue de presse et les citations vivent sur /presse (press.ts, « La presse en parle »).
 *
 * Communiqués officiels : seuls ceux dont le PDF est reçu (`available: true` dans facts.press.releases)
 * sont livrés au composant, qui affiche `emptyLabel` sinon. Aucun PDF n'est disponible aujourd'hui :
 * aucun titre rédigé par nous n'est publié comme communiqué « officiel », et aucun résumé ne sera rédigé
 * qu'à partir du PDF reçu. À réception, reprendre les titres officiels de CORUM dans facts.ts (le titre
 * provisoire « R Start obtient le visa de l'AMF » attribue le visa au produit : seule la note
 * d'information est visée).
 * Contacts presse relevés sur corum.fr ; kit média (logos, chiffres clés tracés vers le bulletin et le
 * DIC, texte de présentation de CORUM L'Épargne). Aucune donnée de performance.
 * L'indicateur de risque est absent du kit média tant que le DIC à jour (SRI 4 sur 7) n'est pas publié :
 * le DIC hébergé du 20/05/2026 indique encore 3 sur 7 (README, « Points en attente »).
 */

/** Espace insécable (U+00A0) avant % € : ; ? ! : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1');
/** Apostrophe typographique pour les libellés de facts.ts écrits avec une apostrophe droite, puis `nb`. */
const typo = (s: string): string => nb(s.replace(/'/g, '’'));

/**
 * Communiqués publiés : uniquement ceux dont le fichier officiel est reçu (`available`), du plus récent
 * au plus ancien ; aucun résumé tant que le fichier officiel n'est pas reçu.
 */
const releases: PressRelease[] = pressFacts.releases
  .filter((r) => r.available)
  .map((r) => ({
    title: typo(r.title),
    date: r.date.label,
    dateIso: r.date.iso,
    file: r.file,
    available: r.available,
  }))
  .sort((a, b) => b.dateIso.localeCompare(a.dateIso));

/** Contacts presse ; l'e-mail n'est renseigné que s'il est confirmé (le composant masque la ligne sinon). */
const contacts: PressContact[] = pressFacts.contacts.map((c) => ({
  organisation: typo(c.organisation),
  name: c.name,
  role: c.role,
  phone: c.phone,
  ...(c.email ? { email: c.email } : {}),
}));

const firstWithdrawalRate = nb(fees.withdrawal.steps[0].rate);
const lastWithdrawalRate = nb(fees.withdrawal.steps[4].rate);

const rawNotes: LegalNote[] = [
  {
    id: 'salle-presse-communiques',
    text: `Communiqués diffusés sous la responsabilité de ${publisher.name} ; les fichiers sont publiés dès réception. Dates de référence : visa SCPI n° ${product.visa.number} de l’AMF du ${product.visa.date} et ouverture des souscriptions le ${product.openingDate.label}, d’après le bulletin de souscription R Start, conditions générales de vente, mai 2026. Le détail des frais figure sur la page Frais et dans la note d’information.`,
  },
  {
    id: 'salle-presse-contacts',
    text: `Contacts réservés aux journalistes. Source : ${pressFacts.contactsSource}. Pour toute question sur R Start ou sur une souscription, contactez ${publisher.name} au ${product.phone} ou à l’adresse ${product.email}.`,
  },
  {
    id: 'salle-presse-chiffres-cles',
    text: `Chiffres clés : prix de part, minimum, visa, ouverture des souscriptions, frais et fréquence de distribution d’après le bulletin de souscription R Start, conditions générales de vente, mai 2026 ; durée de placement recommandée, zone d’investissement et dépositaire d’après le document d’informations clés du ${product.dicDate.label}. Frais exprimés hors taxes, à l’exception des frais sur cessions immobilières et de la commission de retrait anticipé, exprimés toutes taxes comprises. L’indicateur de risque figure dans le document d’informations clés. R Start n’a pas d’historique propre : aucune donnée de performance n’est communiquée.`,
  },
  {
    id: 'salle-presse-kit',
    text: `Logos réservés à un usage éditorial, sans modification de forme ni de couleur. Le texte de présentation de ${publisher.name} se reproduit tel quel. Pour tout autre usage, contactez le service presse.`,
  },
];

/** Notes de la page, typographiées (espace insécable avant : ; ? ! % €). */
export const notes: LegalNote[] = rawNotes.map((n) => ({ ...n, text: nb(n.text) }));

export const pressRoom = {
  seo: {
    /** ≤ 60 caractères. Contient « R Start » et « CORUM ». */
    title: 'Salle de presse R Start, SCPI CORUM : contacts et kit',
    /** 140 à 155 caractères, avec rappel de risque. */
    description:
      'Communiqués, contacts presse et kit média de R Start, la SCPI du groupe CORUM. Placement à risque de perte en capital, revenus non garantis.',
  },

  hero: {
    eyebrow: 'Salle de presse',
    title: 'Salle de presse',
    intro: `Cet espace réunit les communiqués, les contacts presse et le kit média de R Start. R Start est une SCPI gérée par ${managementCompany.name} et distribuée par ${publisher.name}. Ses souscriptions sont ouvertes depuis le ${product.openingDate.label}. Chaque chiffre du kit média renvoie à un document réglementaire.`,
    riskLine: shortRiskLine,
  },

  releases: {
    title: 'Communiqués de presse',
    intro: `Les communiqués officiels de ${publisher.name} sur R Start, du visa de sa note d’information à l’ouverture des souscriptions.`,
    items: releases,
    emptyLabel: `Les communiqués seront publiés ici dès réception des fichiers officiels de ${publisher.name}.`,
  },

  contacts: {
    title: 'Contacts presse',
    items: contacts,
    source: nb(`Source : ${pressFacts.contactsSource}.`),
  },

  mediaKit: {
    title: 'Kit média',
    intro:
      'Logos R Start et fiche de chiffres clés, à reproduire sans modification. Chaque chiffre renvoie au bulletin de souscription ou au document d’informations clés.',
    logos: pressFacts.mediaKit.logos.map((l) => ({ label: l.label, file: l.file })),
    keyFacts: [
      { label: 'Nom', value: `${product.name}, ${product.type}` },
      {
        label: 'Société de gestion',
        value: `${managementCompany.name}, société de gestion agréée et réglementée par l’AMF`,
      },
      { label: 'Distributeur', value: publisher.name },
      {
        label: 'Visa de l’AMF',
        value: `Note d’information visée le ${product.visa.date}, visa SCPI n° ${product.visa.number}`,
      },
      { label: 'Ouverture des souscriptions', value: product.openingDate.label },
      {
        label: 'Prix de la part',
        value: `${nb(share.priceLabel)}, minimum ${share.minimumShares} part`,
      },
      {
        label: 'Frais',
        value: `${nb(fees.subscription.label)} de frais de souscription et sur les achats d’immeubles, ${nb(fees.management.label)} de frais de gestion sur les loyers HT, commission sur les cessions d’immeubles de ${nb(fees.disposal.label)} selon la plus-value, commission de retrait de ${firstWithdrawalRate} à ${lastWithdrawalRate} selon la durée de détention`,
      },
      { label: 'Zone d’investissement', value: typo(strategy.zoneLabel) },
      { label: 'Distribution', value: income.frequencyLabel },
      { label: 'Durée de placement recommandée', value: risk.recommendedHoldingLabel },
      { label: 'Dépositaire', value: product.depositary },
    ],
    riskLine: shortRiskLine,
    boilerplate: {
      title: `À propos de ${publisher.name}`,
      body: pressFacts.mediaKit.boilerplate,
    },
  },

  /** Renvoi vers /presse, dans le menu principal. */
  coverageLink: {
    title: 'La presse en parle',
    body: 'Les citations et la revue des articles publiés au lancement de R Start sont réunies sur une page dédiée.',
    label: 'Voir la revue de presse',
    href: pages.press.path,
  },

  /** Micro-textes des composants (libellés d'accessibilité et métadonnées de fichiers). */
  labels: {
    fileTypeLabel: 'PDF',
    sizeUnit: 'ko',
    newTabHint: 'nouvelle fenêtre',
    downloadLabel: 'Télécharger',
    releasesListLabel: 'Communiqués de presse de R Start',
    contactsListLabel: 'Contacts presse',
    logosListLabel: 'Logos R Start à télécharger',
    phoneLabel: 'Téléphone',
    emailLabel: 'E-mail',
    logosTitle: 'Logos',
    keyFactsTitle: 'Chiffres clés',
  },

  notes,
} satisfies PressRoomContent;

export default pressRoom;
