import type { DocumentItem, LegalNote } from '@/content/types';
import type { DocumentationContent } from '@/content/types-v2';
import { pages } from '@/config/pages';
import {
  documents as documentFacts,
  documentsExtra,
  externalLinks,
  fees as feeFacts,
  income as incomeFacts,
  product,
  risk,
  share,
  subscription,
  trust,
} from '@/content/fr/facts';
import { faq } from '@/content/fr/faq';
import {
  documentsNotice,
  managementCompany,
  publisher,
  shortRiskLine,
  visaNotice,
} from '@/content/fr/legal';
import manifest from '@/content/fr/media.manifest.json';

/**
 * Page /documentation (périmètre v2, plan §12) : centre de documents de R Start.
 * Groupes (réglementaire, frais, formulaires) construits depuis facts.documents et facts.documentsExtra, poids
 * des PDF issus de media.manifest.json, guide de souscription en quatre étapes cohérent avec subscribe.ts,
 * FAQ importée de faq.ts (jamais recopiée) et mention 2 importée de legal.ts à l'identique.
 * Un groupe sans document publié n'est pas livré au composant.
 *
 * Documents en attente (voir PENDING_DOCUMENT_KEYS et README, « Points en attente ») :
 *  - statuts : PDF tronqué et illisible ;
 *  - DIC : le fichier hébergé (20/05/2026) classe R Start en 3 sur 7, valeur que le site affiche désormais
 *    (facts.risk) ; la brochure et CORUM (08/09/2026) annonçaient 4 sur 7. Publié dès que CORUM confirme la
 *    version du DIC en vigueur. Tant qu'il est en attente, le titre SEO, l'intro du hero, le lien corum.fr
 *    et l'intro du groupe réglementaire renvoient au DIC sur www.corum.fr ; la FAQ n'est plus filtrée sur ce
 *    point (elle cite la valeur du DIC avec sa date) ;
 *  - simulation des frais ex-ante (V2, 27/03/2026) : affiche 1,12 % de frais de souscription et des montants
 *    d'épargne espérée issus des scénarios du DIC ; publiée dès livraison d'une version corrigée et validée.
 * PENDING_DOCUMENT_KEYS est la décision unique de publication des pages v2 : feesPage.ts la consomme pour le
 * document de référence sur les coûts. La section Documents de l'accueil (documents.ts, hors périmètre v2)
 * doit suivre la même liste. Aucune donnée de performance. La brochure partenaires (B2B) n'est jamais publiée.
 */

/**
 * Typographie française : apostrophe typographique, espace insécable (U+00A0, en échappement) avant % € : ; ? !,
 * entre groupes de trois chiffres (ex. « 10 000 € ») et à l'intérieur des guillemets « ». Jamais appliquée aux
 * mentions de legal.ts reproduites à l'identique (documentsNotice, shortRiskLine, visaNotice).
 */
const nb = (s: string): string =>
  s
    .replace(/'/g, '’')
    .replace(/ ([%€:;?!])/g, ' $1')
    .replace(/(\d) (?=\d{3}(?!\d))/g, '$1 ')
    .replace(/« /g, '« ')
    .replace(/ »/g, ' »');
const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

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
 * Clés de facts.documents et facts.documentsExtra exclues de la publication tant que CORUM n'a pas livré le
 * fichier attendu (voir en-tête). Décision unique pour les pages v2 (/documentation et /frais). Retirer une clé
 * dès réception, en même temps que l'exclusion de documents.ts (accueil) et le seuil de liens PDF de
 * scripts/check-compliance.mjs pour les statuts.
 */
// Retours AMF de la réunion produit du 10/09/2026 (voir plan §0) :
//  - DIC : le fichier hébergé (V7, 20/05/2026) classe R Start en 3 sur 7 ; le site s'y est aligné le
//    10/09/2026 (facts.risk.sri), une communication commerciale ne pouvant contredire le document
//    réglementaire consultable (écart relevé par l'AMF). Il reste en attente parce que CORUM annonçait
//    4 sur 7 (brochure p.3, 08/09/2026) : CORUM doit confirmer la version en vigueur avant publication
//    (voir README, « Points en attente ») ; retirer alors la clé ici et dans documents.ts ;
//  - simulation des frais ex-ante (V2, 27/03/2026) : affiche 1,12 % de frais de souscription et des
//    montants d'épargne espérée issus des scénarios du DIC, qui contredisent le 0 % affiché sur tout le
//    site et publient une donnée de performance (interdite tant que R Start a moins de 12 mois).
// Les statuts restent en attente pour une autre raison (PDF tronqué à la source, illisible).
export const PENDING_DOCUMENT_KEYS: readonly string[] = ['statuts', 'dic', 'simulation'];
/** Un document de facts.ts est-il publié sur les pages v2 ? */
export const isDocumentPublished = (key: string): boolean => !PENDING_DOCUMENT_KEYS.includes(key);
const isPublished = (d: { key: string }): boolean => isDocumentPublished(d.key);

const dicPublished = isDocumentPublished('dic');
const statutsPublished = isDocumentPublished('statuts');

const regulatoryDocuments = documentFacts.filter(isPublished);
/** Entrées de facts.ts en attente, conservées pour les notes « à venir » (titre). */
const statuts = documentFacts.find((d) => d.key === 'statuts');
const dic = documentFacts.find((d) => d.key === 'dic');

const feeDocuments = documentsExtra.filter((d) => d.group === 'frais').filter(isPublished);
const formDocuments = documentsExtra.filter((d) => d.group === 'formulaire').filter(isPublished);

/**
 * La question de la FAQ sur les risques n'est plus écartée : depuis le 10/09/2026, elle cite l'indicateur
 * synthétique de risque tel que le DIC du 20/05/2026 le donne (3 sur 7), avec sa date. Elle reste hors de
 * cette page par son sujet (FAQ_SUJETS_DOCUMENTAIRES), comme les autres questions non documentaires.
 */
const availableFaqItems = faq.allItems ?? faq.items;

/**
 * La page reprenait la FAQ entière de l'accueil : seize questions rendues deux fois sur le site, dont
 * les revenus, la fiscalité, la stratégie ou la zone d'investissement, qui n'ont rien à faire dans un
 * centre de documents. Elle ne garde que ce qu'un lecteur venu chercher un document a besoin de savoir :
 * comment souscrire, ce qu'il signe, quand les revenus commencent, comment sortir. Les autres questions
 * restent lisibles à un lien d'ici, par le renvoi vers la FAQ complète de l'accueil.
 *
 * La sélection porte sur le SUJET de la question, pas sur le texte de la réponse : presque toutes les
 * réponses citent la souscription, filtrer dessus ne retirait rien. Les libellés ne sont pas recopiés
 * (ils dériveraient au premier ajustement de faq.ts) : on reconnaît le sujet à un mot. Le garde-fou
 * ci-dessous fait échouer le build si une reformulation dans faq.ts vidait ou gonflait la liste, plutôt
 * que de changer la page en silence.
 */
/**
 * Depuis le 11/09/2026, cette page porte la FAQ COMPLÈTE : l'accueil n'en rend plus que six questions
 * (faq.ts, HOME_FAQ) et renvoie ici. Plus aucun filtre par sujet : les seize questions sont rendues.
 */
const faqItems = availableFaqItems;
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

/** Tous les documents publiés sur la page, pour la note des versions. */
const publishedItems = groups.flatMap((g) => g.items);

/** Notes dont le texte commence par une mention de legal.ts reproduite à l'identique : `nb` n'y est appliquée qu'à la suite. */
const VERBATIM_NOTE_IDS: readonly string[] = ['documentation-note-visa'];

const rawNotes: LegalNote[] = [
  {
    id: 'documentation-versions',
    text:
      'Versions publiées sur ce site : ' +
      publishedItems.map((d) => `${d.title} : ${d.version}`).join(' ; ') +
      '. En cas de mise à jour, les versions disponibles sur www.corum.fr prévalent.',
  },
  ...(dicPublished
    ? []
    : [
        {
          id: 'documentation-dic',
          text: `${dic?.title ?? 'Document d’informations clés (DIC)'} de R Start : mise en ligne à venir, dès réception de la version à jour. Dans l’attente, il est disponible sur www.corum.fr et sur simple demande auprès de ${managementCompany.name}. Sa lecture est obligatoire avant toute souscription.`,
        },
      ]),
  ...(statutsPublished
    ? []
    : [
        {
          id: 'documentation-statuts',
          text: `${statuts?.title ?? 'Statuts'} de R Start : mise en ligne à venir, dès réception d’un fichier complet. Dans l’attente, ils sont disponibles sur www.corum.fr et sur simple demande auprès de ${managementCompany.name}.`,
        },
      ]),
  {
    id: 'documentation-note-visa',
    text: `${visaNotice} ${nb(
      `${trust.amf.disclaimer} La note d’information est disponible ci-dessus, sur www.corum.fr et sur simple demande auprès de la société de gestion.`
    )}`,
  },
  {
    id: 'documentation-formulaires',
    text: `Formulaires établis par R Start et ${managementCompany.name} ; la version et la date figurent sur chaque fichier. ${pei.name} : ${lowerFirst(pei.description)}, versement minimum de ${pei.minimumLabel} ; ${lowerFirst(pei.requirement)}. Source : conditions générales d’adhésion au ${pei.name}, avril 2026. ${rd.name} : ${lowerFirst(rd.description)}. Les formulaires complétés et signés sont à transmettre à ${managementCompany.name} selon les modalités indiquées sur chaque formulaire : espace personnel sur corum.fr ou courrier (${managementCompany.address}).`,
  },
  {
    id: 'documentation-souscription',
    text: `Souscription ${subscription.onlineLabel}, à partir de ${share.minimumLabel} (${share.minimumShares} part). Règlement par ${paymentMethods}. ${subscription.coolingOff}. Modalités non proposées pour R Start : ${subscription.notEligible.join(', ')}. Sources : bulletin de souscription, mai 2026 ; brochure R Start 2026.`,
  },
  {
    id: 'documentation-poids',
    text: 'Le poids indiqué pour chaque fichier est exprimé en kilooctets (ko) et arrondi.',
  },
];

/**
 * Notes de la page, suivies des notes de la FAQ importées de faq.ts, limitées aux identifiants réellement
 * appelés par les questions retenues : la page n'importait que `faq.notes` en bloc, ce qui laissait des
 * notes que plus rien ne référençait une fois la FAQ réduite. Une note orpheline est du bruit
 * réglementaire : elle occupe la liste sans qu'aucun appel n'y mène.
 */
const faqNoteIds = new Set(
  faqItems.map((item) => item.noteId).filter((id): id is string => Boolean(id))
);

export const notes: LegalNote[] = [
  ...rawNotes.map((n) => (VERBATIM_NOTE_IDS.includes(n.id) ? n : { ...n, text: nb(n.text) })),
  ...faq.notes.filter((n) => faqNoteIds.has(n.id)),
];

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
    eyebrow: `SCPI ${product.name} · ${publisher.name}`,
    title: 'Documentation',
    intro: nb(
      `Les documents de R Start, au même endroit : documents réglementaires et formulaires. Ce sont eux qui font foi. Lisez le DIC${dicPublished ? '' : ', disponible sur corum.fr,'} et la note d’information avant toute décision.`
    ),
    riskLine: shortRiskLine,
  },

  groups,

  howTo: {
    title: 'Souscrire en ligne, en quatre étapes.',
    /** Avantages (en ligne, versements programmés, réinvestissement), rendus en data-advantage. */
    intro: nb(
      `La souscription se fait ${subscription.onlineLabel}, à partir d’une part de ${share.priceLabel}. Le ${pei.name} permet ensuite des versements dès ${pei.minimumMonthlyLabel}, si vous détenez déjà une part entière. Le ${lowerFirst(rd.name)} convertit automatiquement tout ou partie de vos dividendes potentiels en nouvelles parts.`
    ),
    /** Contre-poids risque de l'intro, de longueur comparable, rendu en RiskNote dans le même bloc et la même taille. */
    risk: nb(
      `Avant de vous engager, lisez le DIC et la note d’information. R Start comporte un risque de perte en capital et une liquidité limitée. Les revenus ne sont pas garantis, le rachat des parts non plus. Un retrait avant ${zeroAfter} ans de détention entraîne une commission dégressive. La durée de placement recommandée est de ${risk.recommendedHoldingLabel}.`
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
          `Vous retrouvez vos parts, vos dividendes potentiels et vos documents dans votre espace en ligne, sur corum.fr. Ces revenus ne sont pas garantis : ils varient à la hausse comme à la baisse. Durée de placement recommandée : ${risk.recommendedHoldingLabel}. Un retrait avant ${zeroAfter} ans de détention entraîne une commission dégressive.`
        ),
      },
    ],
  },

  faq: {
    title: 'Questions fréquentes',
    items: faqItems,
    /** Cette page porte désormais la FAQ complète : le renvoi vers l'accueil n'a plus lieu d'être. */
    fullFaqLink: {
      intro:
        'Ces questions reprennent l’intégralité de la foire aux questions du site : documents, souscription, revenus, risques, fiscalité et stratégie.',
      label: 'Revenir à l’accueil',
      href: pages.home.path,
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
    groupsEyebrow: 'Documents',
    howToEyebrow: 'Souscrire',
    stepsLabel: 'Les quatre étapes de la souscription',
    stepPrefix: 'Étape',
    faqEyebrow: 'FAQ',
    faqListLabel: 'Questions fréquentes sur R Start',
    faqNoteLead: 'Source de cette réponse :',
  },

  notes,
} satisfies DocumentationContent;

export default documentation;
