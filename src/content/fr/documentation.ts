import type { DocumentItem } from '@/content/types';
import type { DocumentationContent } from '@/content/types-v2';
import { pages } from '@/config/pages';
import {
  documents as documentFacts,
  documentsExtra,
  externalLinks,
  fees as feeFacts,
  income as incomeFacts,
  risk,
  share,
  subscription,
} from '@/content/fr/facts';
import { faq } from '@/content/fr/faq';
import { documentsNotice } from '@/content/fr/legal';
import manifest from '@/content/fr/media.manifest.json';
import { PENDING_DOCUMENT_KEYS } from '@/content/fr/pendingDocuments';
import { lowerFirst, nb } from '@/lib/texte';

/**
 * Page /documentation : centre de documents de R Start. Groupes (réglementaire, frais, formulaires)
 * construits depuis facts.documents et facts.documentsExtra, poids des PDF issus de
 * media.manifest.json, guide de souscription cohérent avec subscribe.ts, FAQ importée de faq.ts
 * (jamais recopiée) et mention 2 importée de legal.ts à l'identique. Un groupe sans document publié
 * n'est pas livré au composant. PENDING_DOCUMENT_KEYS est la décision unique de publication : cette
 * page la lit, et les raisons de chaque attente sont au-dessus d'`isDocumentPublished`. Aucune
 * donnée de performance. La brochure partenaires (B2B) n'est jamais publiée.
 */

/** Poids (ko) des PDF indexé par chemin public, depuis le manifeste des médias (`documents[].kb`). */
const kbByFile = new Map<string, number>(
  manifest.documents.map((d) => ['/' + d.file.replace(/^\/+/, ''), d.kb] as const)
);

/** Convertit une entrée de facts.ts en DocumentItem (clé analytics data-doc), avec son poids lorsque le manifeste le connaît. */
const toItem = (d: {
  key: string;
  title: string;
  description: string;
  file: string;
  version: string;
}): DocumentItem => {
  const kb = kbByFile.get(d.file);
  return {
    key: d.key,
    title: nb(d.title),
    description: nb(d.description),
    file: d.file,
    version: nb(d.version),
    ...(kb !== undefined ? { kb } : {}),
  };
};

/**
 * DOCUMENTS EN ATTENTE, clés de pendingDocuments.ts (retirer la clé dès réception, et revoir alors
 * le seuil de liens PDF de scripts/check-compliance.mjs pour les statuts) :
 *  - statuts : PDF tronqué à la source, illisible ;
 *  - DIC : le fichier fourni par CORUM (V7, 20/05/2026) classe R Start en 3 sur 7 et le site
 *    affiche 4 sur 7 (valeur de l'équipe ; facts.risk porte l'écart, que l'AMF avait relevé sur la
 *    brochure) : une communication commerciale ne peut pas contredire le document réglementaire.
 *    Non servi depuis le 18/09/2026 tant que CORUM n'a pas confirmé la version en vigueur ; entre
 *    temps, le titre SEO, l'intro du hero, le lien corum.fr et l'intro du groupe réglementaire
 *    renvoient au DIC sur www.corum.fr ;
 *  - simulation des frais ex-ante (V2, 27/03/2026) : affiche 1,12 % de frais de souscription et des
 *    montants d'épargne espérée issus des scénarios du DIC, qui contredisent le 0 % du site et
 *    publient une donnée de performance (interdite tant que R Start a moins de 12 mois).
 * Un document en attente n'est ni lié ici ni copié dans public/documents (prepare-images.mjs).
 */
/** Un document de facts.ts est-il publié sur les pages v2 ? */
const isDocumentPublished = (key: string): boolean => !PENDING_DOCUMENT_KEYS.includes(key);
const isPublished = (d: { key: string }): boolean => isDocumentPublished(d.key);

const dicPublished = isDocumentPublished('dic');

const regulatoryDocuments = documentFacts.filter(isPublished);

const feeDocuments = documentsExtra.filter((d) => d.group === 'frais').filter(isPublished);
const formDocuments = documentsExtra.filter((d) => d.group === 'formulaire').filter(isPublished);

/* La question de la FAQ sur le niveau de risque n'est plus écartée : elle donne 4 sur 7 sans
   l'attribuer au DIC. */
const availableFaqItems = faq.allItems ?? faq.items;

/**
 * Les QUATRE PREMIÈRES questions (16/09/2026, demande de l'équipe : « 4 questions sur chaque page
 * puis un CTA secondaire pour aller vers la page /faq »), et non une sélection par sujet : le
 * filtre par mot-clé qui a existé ici dérivait au premier ajustement d'un libellé dans faq.ts.
 */
const faqItems = availableFaqItems.slice(0, 4);
const pei = subscription.options.pei;
const rd = subscription.options.rd;
const zeroAfter = feeFacts.withdrawal.zeroAfterYears;
const documentsList = subscription.documentsRequired.map(lowerFirst).join(', ');
const paymentMethods = subscription.paymentMethods.map(lowerFirst).join(' ou ');

const allGroups: DocumentationContent['groups'] = [
  {
    key: 'reglementaire',
    title: 'Documents réglementaires',
    intro: nb(
      `À lire avant toute souscription. Le DIC et la note d’information décrivent le fonctionnement, les frais et les risques de R Start. Le bulletin de souscription fixe les conditions générales de vente et reproduit l’avertissement réglementaire.${dicPublished ? '' : ' Le DIC est disponible sur www.corum.fr (lien en bas de page), dans l’attente de sa mise en ligne ici.'} En cas de divergence avec ce site, ces documents prévalent.`
    ),
    items: regulatoryDocuments.map(toItem),
  },
  {
    key: 'frais',
    title: 'Frais et coûts',
    intro: nb(
      `Avant de souscrire, pour mesurer l’ensemble des coûts. La page Frais détaille le barème : ${feeFacts.management.label} de gestion, commissions sur les cessions et sur les retraits. Le DIC en donne l’incidence selon la durée de détention.`
    ),
    items: feeDocuments.map(toItem),
  },
  {
    key: 'formulaire',
    title: 'Formulaires',
    intro: nb(
      `Ces formulaires complètent la souscription en ligne. Versements programmés, réinvestissement des dividendes, règlement par prélèvement, retrait de parts, changement de compte bancaire. Complétés et signés, ils sont transmis à la société de gestion selon les modalités indiquées sur chaque formulaire (espace personnel corum.fr ou courrier). Un retrait avant ${zeroAfter} ans de détention entraîne une commission dégressive. Le rachat des parts n’est pas garanti.`
    ),
    items: formDocuments.map(toItem),
  },
];

/** Groupes livrés au composant : uniquement ceux qui publient au moins un document. */
const groups: DocumentationContent['groups'] = allGroups.filter((g) => g.items.length > 0);

export const documentation = {
  seo: {
    /** ≤ 60 caractères, contient « R Start » et « CORUM » ; n'annonce le DIC que s'il est publié sur la page. */
    title: nb(
      dicPublished
        ? 'Documentation R Start, SCPI CORUM : DIC et formulaires'
        : 'Documentation R Start, SCPI CORUM : note d’information'
    ),
    /** 140-155 caractères, avec rappel de risque. */
    description: nb(
      `Documents de la SCPI R Start (CORUM) : ${dicPublished ? 'DIC, ' : ''}note d’information visée par l’AMF, bulletin et formulaires. Risque de perte en capital, revenus non garantis.`
    ),
  },

  hero: {
    title: 'Documentation',
    intro: nb(
      `Les documents de R Start, au même endroit : documents réglementaires et formulaires. Ce sont eux qui font foi. Lisez le DIC${dicPublished ? '' : ', disponible sur corum.fr,'} et la note d’information avant toute décision`
    ),
    /* Sans point final (24/09/2026, Martin : aucun point final dans les en-têtes). */
    /* Plus de ligne risques dans l'en-tête (14/09/2026, « supprime les bon à savoir de tous les
       hero sauf celui de la home ») ; restent les mentions du contenu et le pied de page. */
  },

  groups,

  howTo: {
    title: 'Souscrire en ligne, en quatre étapes.',
    intro: nb(
      `La souscription se fait ${subscription.onlineLabel}, à partir d’une part de ${share.priceLabel}. Le ${pei.name} permet ensuite des versements dès ${pei.minimumMonthlyLabel}, si vous détenez déjà une part entière. Le ${lowerFirst(rd.name)} convertit automatiquement tout ou partie de vos dividendes potentiels en nouvelles parts.`
    ),
    steps: [
      {
        title: 'Créer votre profil investisseur',
        description: nb(
          `Vous renseignez votre identité, votre situation financière et vos objectifs. Ce questionnaire réglementaire vérifie que R Start est adaptée à votre situation et à votre horizon de placement. Préparez vos pièces : ${documentsList}.`
        ),
      },
      {
        title: 'Signer en ligne',
        description: nb(
          `Vous choisissez votre nombre de parts, puis signez le bulletin de souscription par signature électronique. Vous pouvez y ajouter les versements programmés ou le réinvestissement des dividendes. Le bulletin reproduit l’avertissement réglementaire et les conditions générales de vente : lisez-le en entier.`
        ),
      },
      {
        title: 'Régler par virement ou prélèvement',
        description: nb(
          `Vous réglez votre souscription par ${paymentMethods}. Vos parts entrent en jouissance ${incomeFacts.enjoymentDate.toLowerCase()}. Aucun dividende n’est versé avant cette date.`
        ),
      },
      {
        title: 'Suivre votre épargne',
        description: nb(
          `Vous retrouvez vos parts, vos dividendes potentiels et vos documents dans votre espace en ligne, sur corum.fr. Ces revenus potentiels ne sont pas garantis : ils varient à la hausse comme à la baisse. Durée de placement recommandée : ${risk.recommendedHoldingLabel}. Un retrait avant ${zeroAfter} ans de détention entraîne une commission dégressive.`
        ),
      },
    ],
  },

  faq: {
    title: 'Questions fréquentes',
    items: faqItems,
    /* Renvoi vers /faq depuis le 16/09/2026 : la page n'en rend plus que quatre. */
    fullFaqLink: {
      intro:
        'Documents, souscription, revenus, risques, fiscalité et stratégie : toutes les questions sont réunies sur une page, avec un champ de recherche.',
      label: 'Voir toutes les questions',
      href: pages.faq.path,
    },
  },

  corumLink: {
    label: dicPublished
      ? 'Documentation complète sur corum.fr'
      : 'DIC et documentation complète sur corum.fr',
    href: externalLinks.corum,
  },

  mention: documentsNotice,

  cta: { label: 'Souscrire en ligne', position: 'souscrire' },

  /** Micro-textes d'interface (aucun contenu réglementaire). */
  labels: {
    fileTypeLabel: 'PDF',
    sizeUnit: 'ko',
    newTabHint: 'nouvelle fenêtre',
    anchorsLabel: 'Groupes de documents',
    anchorsCountLabel: '{n} document{s}',
    anchorsAsideLabel: 'Sommaire des documents',
    stepsLabel: 'Les quatre étapes de la souscription',
    stepPrefix: 'Étape',
    faqEyebrow: 'FAQ',
    faqListLabel: 'Questions fréquentes sur R Start',
  },
} satisfies DocumentationContent;
