/**
 * Mentions obligatoires et identité légale. Textes à reproduire À L'IDENTIQUE (validés Conformité CORUM).
 * Sources : Formation Documentation Marketing AMF/ACPR (mentions 1 et 2), DIC V7, Bulletin de souscription 2026.05,
 * corum.fr/mentions-legales.
 */

/** Mention 1 — caractère commercial (obligatoire depuis août 2021). */
export const commercialNotice =
  "Cette communication a un caractère commercial, n'est pas un document contractuel ou d'information requis par une disposition législative, et n'est pas suffisante pour prendre une décision d'investissement.";

/** Mention 2 — invitation à consulter les documents d'information. */
export const documentsNotice =
  "Vous êtes invité à consulter les documents d'information (Note d'information et DIC) présentant les caractéristiques, risques et frais avant toute décision. Disponibles sur www.corum.fr.";

/** Visa AMF (bulletin de souscription, p.4). */
export const visaNotice =
  "La note d'information prévue par le Code monétaire et financier a obtenu le visa S.C.P.I. n° 26-06 en date du 4 mars 2026 de l'Autorité des marchés financiers.";

/** Avertissement DIC (p.1), à reproduire tel quel. */
export const dicWarning =
  "Vous êtes sur le point d'acheter un produit qui n'est pas simple et qui peut être difficile à comprendre comportant un risque de perte en capital et un risque de change.";

/** Avertissement commission d'arbitrage (DIC p.1, brochure p.2, bulletin p.4) — 3 puces à l'identique. */
export const arbitrageWarningTitle =
  "L'attention des investisseurs est attirée sur certaines caractéristiques de la commission d'arbitrage, à savoir :";
export const arbitrageWarningBullets = [
  "Le prélèvement de la commission d'arbitrage a des effets de seuil, la commission d'arbitrage peut capter une partie significative de la plus-value.",
  'La société de gestion peut bénéficier de rémunération sur les plus-values même en cas de diminution de la valeur de vos parts.',
  "Les décisions relatives à la cession des immeubles reposent sur des critères objectifs mis en œuvre par ladite société, dans le respect des règles applicables en matière de prévention et de gestion des conflits d'intérêts.",
] as const;

/** Avertissement du bulletin de souscription (p.4), in extenso. */
export const bulletinWarning =
  "Acheter des parts de R Start est un investissement immobilier. Comme tout placement immobilier, il s'agit d'un investissement long terme dont la liquidité est limitée. Nous vous recommandons une durée de placement de 10 ans. Contrairement au livret A par exemple, ce placement comporte des risques. Il existe tout d'abord un risque de perte en capital. De plus, les revenus ne sont pas garantis et dépendront de l'évolution du marché immobilier et du cours des devises. Nous précisons que CORUM Asset Management ne garantit pas le rachat de vos parts. Enfin, comme pour tout placement, les performances passées ne présagent pas des performances futures.";

/** Ligne risques courte, visible sans scroller (hero) et en rappel. */
export const shortRiskLine =
  'Investissement immobilier de long terme, durée de placement recommandée de 10 ans. Risque de perte en capital, revenus non garantis, liquidité limitée, risque de change.';

/** Préfixe lu par les lecteurs d'écran devant chaque contre-poids risque (RiskNote) ; masqué visuellement. */
export const riskPrefix = 'Risque : ';

/** Encadré brochure p.4 « Une innovation, pas une révolution », adapté au grand public (« Vos clients » → « Vous »). */
export const innovationNotRevolution = {
  title: 'Une innovation, pas une révolution',
  body:
    "R Start n'est pas une SCPI sans frais : ce modèle n'existe pas. R Start n'est pas non plus moins chère qu'une SCPI traditionnelle. Son modèle de frais est différent : si les reventes d'immeubles génèrent de fortes plus-values, les commissions peuvent dépasser ce qu'aurait coûté une commission de souscription classique. Vous ne connaissez pas votre coût total à la souscription.",
};

/** Éditeur du site et distributeur (communication commerciale). */
export const publisher = {
  name: "CORUM L'Épargne",
  legalForm: 'Société par actions simplifiée au capital social de 1 000 000 €',
  rcs: 'RCS Paris 851 245 183',
  address: '1 rue Euler, 75008 Paris',
  orias: 'Immatriculée à l’ORIAS sous le numéro 20002932 (www.orias.fr)',
  statuses: [
    'Conseiller en investissements financiers (CIF), membre de la CNCEF',
    "Intermédiaire en assurance",
    "Mandataire non exclusif en opérations de banque et services de paiement",
  ],
  supervisors: "Placée sous le contrôle de l'ACPR et de l'AMF",
  publicationDirector: 'Anne Carrizo', // corum.fr/mentions-legales — à confirmer
  phone: '01 53 75 87 48',
  email: 'corum@corum.fr',
} as const;

/** Société de gestion de portefeuille. */
export const managementCompany = {
  name: 'CORUM Asset Management',
  legalForm: 'Société par actions simplifiée au capital social de 600 000 €',
  rcs: 'RCS Paris 531 636 546',
  address: '1 rue Euler, 75008 Paris',
  amfApproval:
    "Société de gestion de portefeuille agréée par l'AMF sous le numéro GP-11000012 le 14 avril 2011, agrément AIFM en date du 10 juillet 2014 au titre de la directive 2011/61/UE.",
  amfAddress: 'Autorité des marchés financiers, 17 place de la Bourse, 75082 Paris Cedex 02',
  complaintsEmail: 'conformite@corum-am.com',
  complaintsPolicyUrl: 'https://www.corumbutler.com/mentions-legales',
} as const;

/** Bloc RGPD (responsable de traitement, droits, DPO). */
export const gdpr = {
  controller: "CORUM L'Épargne et CORUM Asset Management",
  body:
    "Vos données à caractère personnel sont collectées par CORUM Asset Management et CORUM L'Épargne conformément à la politique de protection des données personnelles disponible sur www.corum.fr. Vous disposez de droits d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité, que vous pouvez exercer à tout moment en contactant le délégué à la protection des données.",
  dpoEmail: 'dpo@corumbutler.com',
  privacyPolicyUrl: 'https://www.corum.fr',
} as const;

/** Médiation AMF (DIC p.4). */
export const mediation = {
  body:
    "Conformément aux dispositions de l'article L. 621-19 du Code monétaire et financier et à la charte de la médiation de l'Autorité des marchés financiers, l'associé peut saisir gratuitement le médiateur de l'AMF, sous réserve d'avoir préalablement adressé une réclamation écrite à CORUM Asset Management et de ne pas être satisfait de la réponse, et qu'aucune procédure contentieuse ni aucune enquête de l'AMF portant sur les mêmes faits ne soit en cours.",
  address: "Le Médiateur de l'Autorité des marchés financiers, 17 place de la Bourse, 75082 Paris Cedex 02",
  url: 'https://www.amf-france.org',
} as const;

export const hosting = {
  provider: 'Microsoft Azure',
  region: 'Région France Central',
  company: 'Microsoft Ireland Operations Ltd, One Microsoft Place, South County Business Park, Leopardstown, Dublin 18, Irlande',
} as const;

/** Mots et formulations interdits dans les textes (contrôle automatisé, voir scripts/check-compliance.mjs). */
export const forbiddenPhrases = [
  'sans frais', // sauf dans la phrase « n'est pas une SCPI sans frais »
  'sans risque',
  'garanti', // sauf « non garanti » / « pas garanti » / « ne garantit pas »
  'sécurisé',
  'protection du capital',
  'capital protégé',
  'meilleure scpi',
  'meilleures scpi',
  'en toute confiance',
  'rendement cible',
  'objectif de rendement',
  'taux de distribution',
  'tri ',
  'gratuit',
] as const;
