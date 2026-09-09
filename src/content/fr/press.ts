import type { LegalNote } from '@/content/types';
import type { PressArticle, PressContact, PressContent, PressRelease } from '@/content/types-v2';
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
 * Page /presse — Espace presse.
 * Communiqués officiels : seuls les communiqués dont le PDF officiel est reçu (`available: true` dans
 * facts.press.releases) sont livrés au composant, qui affiche `emptyLabel` sinon. Aucun PDF n'est disponible
 * aujourd'hui : aucun titre rédigé par nous n'est publié comme communiqué « officiel », et aucun résumé ne
 * sera rédigé qu'à partir du PDF reçu. À réception, reprendre les titres officiels de CORUM dans facts.ts
 * (le titre provisoire « R Start obtient le visa de l'AMF » attribue le visa au produit : seule la note
 * d'information est visée).
 * Revue de presse limitée aux médias d'information (sans date tant que facts.press.coverage n'en porte pas :
 * les dates de publication restent à relever et à ajouter dans facts.ts, hors de ce fichier), typographie
 * française appliquée aux titres tiers, libellé neutre à la place de tout titre reprenant « sans frais »,
 * avertissement facts.press.coverageDisclaimer. Contacts presse relevés sur corum.fr et kit média (logos,
 * chiffres clés tracés vers le bulletin et le DIC, texte de présentation de CORUM L'Épargne).
 * Aucune donnée de performance, aucun chiffre repris des articles : seuls les faits de facts.ts sont cités.
 * L'indicateur de risque est absent du kit média tant que le DIC à jour (SRI 4 sur 7) n'est pas publié :
 * le DIC hébergé du 20/05/2026 indique encore 3 sur 7 (README, « Points en attente »).
 */

/** Espace insécable (U+00A0) avant % € : ; ? ! : les libellés de facts.ts utilisent une espace simple. */
const nb = (s: string): string => s.replace(/ ([%€:;?!])/g, ' $1');
/** Apostrophe typographique pour les libellés de facts.ts écrits avec une apostrophe droite, puis `nb`. */
const typo = (s: string): string => nb(s.replace(/'/g, '’'));

/** Date à laquelle les articles de facts.press.coverage ont été identifiés. */
const coverageCheckedOn = { label: '8 septembre 2026', iso: '2026-09-08' } as const;

/**
 * Médias de facts.press.coverage écartés de la revue de presse, en attendant la validation de la sélection
 * par la Conformité : MeilleureSCPI.com est une plateforme de distribution de SCPI ; Idéal Investisseur
 * publie un « avis investisseur ». Seuls les médias d'information sont relayés.
 */
const EXCLUDED_MEDIA: readonly string[] = ['MeilleureSCPI.com', 'Idéal Investisseur'];

/**
 * Un titre tiers qui affirme « sans frais » n'est jamais reproduit sur ce site (legal.forbiddenPhrases) :
 * l'article reste accessible sous un libellé neutre, qui nomme le média et le sujet.
 */
const FORBIDDEN_IN_TITLE = /sans frais/i;
const neutralTitle = (media: string): string =>
  `Article de ${media} sur le modèle de frais de R Start`;

/**
 * Communiqués publiés : uniquement ceux dont le fichier officiel est reçu (`available`), du plus récent au
 * plus ancien ; aucun résumé tant que le fichier officiel n'est pas reçu.
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

/**
 * Revue de presse : médias et URL de facts.ts, dans l'ordre de facts.ts. Les titres tiers reçoivent la
 * typographie française (`typo`) sans autre modification. Aucune date n'est affichée tant que
 * facts.press.coverage ne porte pas de champ `date` relevé contradictoirement par CORUM.
 */
const articles: PressArticle[] = pressFacts.coverage
  .filter((a) => !EXCLUDED_MEDIA.includes(a.media))
  .map((a) => ({
    media: a.media,
    title: FORBIDDEN_IN_TITLE.test(a.title) ? neutralTitle(a.media) : typo(a.title),
    url: a.url,
  }));

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

export const notes: LegalNote[] = [
  {
    id: 'presse-communiques',
    text: `Communiqués diffusés sous la responsabilité de ${publisher.name} ; les fichiers sont publiés dès réception. Dates de référence : visa SCPI n° ${product.visa.number} de l’AMF du ${product.visa.date} et ouverture des souscriptions le ${product.openingDate.label}, d’après le bulletin de souscription R Start, conditions générales de vente, mai 2026. Le détail des frais figure sur la page Frais et dans la note d’information.`,
  },
  {
    id: 'presse-revue',
    text: `Articles de médias d’information tiers, identifiés le ${coverageCheckedOn.label}. Chaque libellé renvoie vers l’article original ; il ne reproduit pas nécessairement son titre. Les dates de publication ne sont pas indiquées. Ces articles ne constituent pas une recommandation d’investissement. Ils peuvent citer des chiffres, des comparaisons ou des opinions absents des documents réglementaires de R Start : seuls le document d’informations clés et la note d’information font foi. Aucune donnée de performance de R Start n’est reprise sur ce site.`,
  },
  {
    id: 'presse-contacts',
    text: `Contacts réservés aux journalistes. Source : ${pressFacts.contactsSource}. Pour toute question sur R Start ou sur une souscription, contactez ${publisher.name} au ${product.phone} ou à l’adresse ${product.email}.`,
  },
  {
    id: 'presse-chiffres-cles',
    text: `Chiffres clés : prix de part, minimum, visa, ouverture des souscriptions, frais et fréquence de distribution d’après le bulletin de souscription R Start, conditions générales de vente, mai 2026 ; durée de placement recommandée, zone d’investissement et dépositaire d’après le document d’informations clés du ${product.dicDate.label}. Frais exprimés hors taxes, égaux au montant TTC. L’indicateur de risque figure dans le document d’informations clés. R Start n’a pas d’historique propre : aucune donnée de performance n’est communiquée.`,
  },
  {
    id: 'presse-kit',
    text: `Logos réservés à un usage éditorial, sans modification de forme ni de couleur. Le texte de présentation de ${publisher.name} se reproduit tel quel. Pour tout autre usage, contactez le service presse.`,
  },
];

export const press = {
  seo: {
    /** ≤ 60 caractères. Contient « R Start » et « CORUM ». */
    title: 'Espace presse R Start, SCPI CORUM : contacts et kit média',
    /** 140 à 155 caractères, avec rappel de risque. */
    description:
      'Communiqués, revue de presse, contacts et kit média de R Start, la SCPI de CORUM. Placement immobilier à risque de perte en capital, revenus non garantis.',
  },

  hero: {
    eyebrow: 'Presse',
    title: 'Espace presse',
    intro: `Cet espace réunit les communiqués, la revue de presse, les contacts et le kit média de R Start. R Start est une SCPI gérée par ${managementCompany.name} et distribuée par ${publisher.name}. Ses souscriptions sont ouvertes depuis le ${product.openingDate.label}. Chaque chiffre du kit média renvoie à un document réglementaire.`,
    riskLine: shortRiskLine,
  },

  releases: {
    title: 'Communiqués de presse',
    intro: `Les communiqués officiels de ${publisher.name} sur R Start, du visa de sa note d’information à l’ouverture des souscriptions.`,
    items: releases,
    emptyLabel: `Les communiqués seront publiés ici dès réception des fichiers officiels de ${publisher.name}.`,
  },

  coverage: {
    title: 'Revue de presse',
    intro: `Une sélection d’articles de médias d’information. Chaque lien renvoie vers l’article original. R Start n’est pas une SCPI sans frais : ${nb(fees.management.label)} de frais de gestion, commissions sur cessions et retraits s’appliquent.`,
    items: articles,
    disclaimer: pressFacts.coverageDisclaimer,
  },

  contacts: {
    title: 'Contacts presse',
    items: contacts,
    source: `Source : ${pressFacts.contactsSource}.`,
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
        value: `${managementCompany.name}, société de gestion agréée par l’AMF`,
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
        value: `${nb(fees.subscription.label)} de frais de souscription et d’acquisition, ${nb(fees.management.label)} de frais de gestion sur les loyers HT, commission sur les cessions d’immeubles de ${nb(fees.disposal.label)} selon la plus-value, commission de retrait de ${firstWithdrawalRate} à ${lastWithdrawalRate} selon la durée de détention`,
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

  /** Micro-textes du composant (libellés d'accessibilité et métadonnées de fichiers). */
  labels: {
    fileTypeLabel: 'PDF',
    sizeUnit: 'ko',
    newTabHint: 'nouvelle fenêtre',
    downloadLabel: 'Télécharger',
    releasesListLabel: 'Communiqués de presse de R Start',
    coverageListLabel: 'Articles de presse sur R Start',
    contactsListLabel: 'Contacts presse',
    logosListLabel: 'Logos R Start à télécharger',
    phoneLabel: 'Téléphone',
    emailLabel: 'E-mail',
    logosTitle: 'Logos',
    keyFactsTitle: 'Chiffres clés',
  },

  notes,
} satisfies PressContent;

export default press;
