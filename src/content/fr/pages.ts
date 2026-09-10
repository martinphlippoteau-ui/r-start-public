import { product } from '@/content/fr/facts';
import {
  commercialNotice,
  documentsNotice,
  gdpr,
  hosting,
  managementCompany,
  mediation,
  publisher,
  shortRiskLine,
  visaNotice,
} from '@/content/fr/legal';

/**
 * Pages secondaires : /mentions-legales, /politique-de-confidentialite, /cookies.
 * Les faits légaux (identités, agréments, DPO, médiation, hébergeur) viennent de legal.ts ;
 * les paramètres du consentement reprennent src/config/site.ts (cookie `rstart_consent`, 180 jours)
 * sans l'importer, pour que ce contenu reste lisible hors d'Astro (export des textes pour la Conformité).
 */

export interface LegalPage {
  path: string;
  title: string;
  description: string;
  sections: { title: string; paragraphs: string[] }[];
}

/** Nom et durée du cookie de consentement (src/config/site.ts → site.consent). */
const consentCookie = { name: 'rstart_consent', days: 180 } as const;
/** Durée de vie des cookies Google Analytics 4, à configurer dans le tag GA4 (cookie_expires). */
const analyticsCookieLifetime = '13 mois';

export const legalPages: LegalPage[] = [
  {
    path: '/mentions-legales',
    title: 'Mentions légales',
    description:
      'Mentions légales du site R Start : éditeur CORUM L’Épargne, société de gestion CORUM Asset Management, hébergeur, réclamations et médiation.',
    sections: [
      {
        title: 'Éditeur du site',
        paragraphs: [
          `Ce site est édité par ${publisher.name}, ${publisher.legalForm}, immatriculée au ${publisher.rcs}, dont le siège social est situé ${publisher.address}.`,
          `${publisher.orias}.`,
          `Statuts : ${publisher.statuses.join(' ; ')}. ${publisher.supervisors}.`,
          `Téléphone : ${publisher.phone}. E-mail : ${publisher.email}.`,
        ],
      },
      {
        title: 'Direction de la publication',
        paragraphs: [
          `La direction de la publication est assurée par ${publisher.publicationDirector}.`,
        ],
      },
      {
        title: 'Société de gestion de R Start',
        paragraphs: [
          `R Start est gérée par ${managementCompany.name}, ${managementCompany.legalForm}, immatriculée au ${managementCompany.rcs}, dont le siège social est situé ${managementCompany.address}.`,
          managementCompany.amfApproval,
          `${product.legalName}, ${product.rcs}, siège social ${product.address}. Dépositaire : ${product.depositary}.`,
        ],
      },
      {
        title: 'Hébergement',
        paragraphs: [
          `Le site est hébergé par ${hosting.provider} (${hosting.region}), opéré par ${hosting.company}.`,
        ],
      },
      {
        title: 'Informations sur le produit',
        paragraphs: [
          `Ce site est une communication commerciale de ${publisher.name}, distributeur de la SCPI R Start.`,
          commercialNotice,
          documentsNotice,
          visaNotice,
          shortRiskLine,
          'R Start est une SCPI récente, sans historique propre : aucune donnée de performance n’est présentée sur ce site. Les informations publiées ne constituent ni un conseil en investissement personnalisé, ni un conseil fiscal. En cas de divergence, la note d’information et le document d’informations clés prévalent.',
        ],
      },
      {
        title: 'Réclamations',
        paragraphs: [
          `Pour toute réclamation relative à R Start, écrivez à ${managementCompany.complaintsEmail}. La politique de traitement des réclamations est disponible sur ${managementCompany.complaintsPolicyUrl} ou sur simple demande à cette adresse.`,
          `Vous pouvez aussi contacter CORUM par téléphone au ${publisher.phone}.`,
        ],
      },
      {
        title: 'Médiation',
        paragraphs: [
          mediation.body,
          `Coordonnées : ${mediation.address}. Site : www.amf-france.org.`,
        ],
      },
      {
        title: 'Propriété intellectuelle',
        paragraphs: [
          `L’ensemble des éléments de ce site (textes, visuels, logos, pictogrammes, mise en page) est protégé par le droit de la propriété intellectuelle. Ils sont la propriété de ${publisher.name}, de sociétés du groupe CORUM ou de tiers ayant autorisé leur utilisation.`,
          'Toute reproduction, représentation, adaptation ou diffusion, totale ou partielle, sans autorisation écrite préalable est interdite. Les documents réglementaires proposés au téléchargement peuvent être conservés et imprimés pour un usage strictement personnel.',
        ],
      },
      {
        title: 'Données personnelles et cookies',
        paragraphs: [
          'Ce site ne comporte aucun formulaire et ne collecte pas de données d’identification. Seule une mesure d’audience est réalisée, avec votre accord. Les détails figurent dans la politique de confidentialité et la politique cookies.',
          `Délégué à la protection des données : ${gdpr.dpoEmail}.`,
        ],
      },
      {
        title: 'Liens',
        paragraphs: [
          'Les boutons « Souscrire » renvoient vers le tunnel de souscription en ligne de CORUM. Les liens vers corum.fr et vers des sites tiers sont fournis pour information ; leur contenu relève de la responsabilité de leurs éditeurs.',
        ],
      },
    ],
  },
  {
    path: '/politique-de-confidentialite',
    title: 'Politique de confidentialité',
    description:
      'Politique de confidentialité du site R Start : mesure d’audience sur consentement, durées de conservation, vos droits et contact du DPO.',
    sections: [
      {
        title: 'Responsable du traitement',
        paragraphs: [
          `Les traitements de données liés à ce site sont réalisés sous la responsabilité de ${gdpr.controller}, ${publisher.address}.`,
          `Délégué à la protection des données (DPO) : ${gdpr.dpoEmail}.`,
        ],
      },
      {
        title: 'Ce que ce site collecte',
        paragraphs: [
          'Ce site est un site de présentation. Il ne comporte aucun formulaire : il ne collecte ni votre nom, ni votre adresse e-mail, ni aucune donnée de souscription.',
          'La souscription se déroule sur le tunnel de souscription en ligne de CORUM, qui applique sa propre politique de protection des données, disponible sur www.corum.fr.',
          'Avec votre accord uniquement, des données de navigation sont collectées à des fins de mesure d’audience. Il s’agit des pages consultées, de la durée et du parcours de visite. S’y ajoutent le type d’appareil, de navigateur et de système, une localisation approximative (pays, ville) et un identifiant de cookie. L’adresse IP sert à la localisation approximative et n’est pas enregistrée par Google Analytics 4.',
          'L’hébergeur conserve des journaux techniques de connexion (adresse IP, horodatage, page demandée), nécessaires au fonctionnement et à la sécurité du service.',
        ],
      },
      {
        title: 'Finalités et bases légales',
        paragraphs: [
          'Mesure d’audience : comprendre comment le site est consulté pour l’améliorer. Base légale : votre consentement (article 6.1.a du RGPD et article 82 de la loi Informatique et Libertés). Vous pouvez le retirer à tout moment.',
          'Mémorisation de votre choix en matière de cookies : intérêt légitime à respecter votre choix et à ne pas vous solliciter à chaque visite. Ce cookie est exempté de consentement.',
          'Journaux techniques de l’hébergeur : intérêt légitime à assurer le fonctionnement et la sécurité du site.',
        ],
      },
      {
        title: 'Durées de conservation',
        paragraphs: [
          `Votre choix en matière de cookies : ${consentCookie.days} jours, dans le cookie ${consentCookie.name}. Passé ce délai, le bandeau s’affiche à nouveau.`,
          `Cookies de mesure d’audience (_ga, _ga_*) : ${analyticsCookieLifetime} au maximum à compter de leur dépôt.`,
          `Données de mesure d’audience associées à votre navigateur : ${analyticsCookieLifetime} au maximum. Au-delà, seules des statistiques agrégées sont conservées.`,
          'Journaux techniques : conservés par l’hébergeur pour la durée nécessaire à la sécurité du service, conformément à la réglementation applicable.',
        ],
      },
      {
        title: 'Destinataires et transferts',
        paragraphs: [
          'Les données de mesure d’audience sont traitées par Google Ireland Limited (Gordon House, Barrow Street, Dublin 4, Irlande), en qualité de sous-traitant, via Google Analytics 4 et Google Tag Manager.',
          'Elles peuvent être transférées vers les États-Unis. Ces transferts s’appuient sur les mécanismes prévus par le RGPD : la décision d’adéquation UE–États-Unis (Data Privacy Framework) et les clauses contractuelles types de la Commission européenne.',
          `${publisher.name} ne vend ni ne cède vos données de navigation à des tiers à des fins commerciales.`,
        ],
      },
      {
        title: 'Vos droits',
        paragraphs: [
          gdpr.body,
          'Vous pouvez aussi définir des directives sur le sort de vos données après votre décès. Vous pouvez retirer à tout moment votre consentement à la mesure d’audience. Il suffit de cliquer sur « Gérer les cookies », en bas de page.',
          `Pour exercer vos droits : ${gdpr.dpoEmail}, ou par courrier à ${managementCompany.name}, ${managementCompany.address}. Une réponse vous est apportée dans un délai d’un mois, prolongeable de deux mois si la demande est complexe.`,
          'Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL. En ligne : www.cnil.fr. Par courrier : CNIL, 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.',
        ],
      },
      {
        title: 'Mise à jour',
        paragraphs: [
          'Cette politique peut évoluer avec le site ou la réglementation. Dernière mise à jour : septembre 2026.',
        ],
      },
    ],
  },
  {
    path: '/cookies',
    title: 'Politique cookies',
    description:
      'Politique cookies du site R Start : liste des cookies utilisés (rstart_consent, _ga, _ga_*), durées, consentement et modification de votre choix.',
    sections: [
      {
        title: 'Qu’est-ce qu’un cookie ?',
        paragraphs: [
          'Un cookie est un petit fichier texte déposé sur votre appareil par le site que vous consultez. Il permet de mémoriser une information entre deux pages ou deux visites : un choix, un identifiant aléatoire, l’état d’une session. Certains sont indispensables au fonctionnement du site ; d’autres, comme la mesure d’audience, nécessitent votre accord.',
        ],
      },
      {
        title: 'Les cookies utilisés sur ce site',
        paragraphs: [
          'Ce site n’utilise que deux catégories de cookies : un cookie strictement nécessaire, et des cookies de mesure d’audience soumis à votre consentement. Aucun cookie publicitaire, aucun cookie de réseau social.',
          `Nom : ${consentCookie.name}. Déposé par : ce site. Finalité : mémoriser votre choix (accepter ou refuser la mesure d’audience) pour ne pas vous le redemander à chaque visite. Durée : ${consentCookie.days} jours. Consentement : non requis, cookie strictement nécessaire.`,
          `Nom : _ga. Déposé par : Google Analytics 4. Finalité : distinguer les visiteurs grâce à un identifiant aléatoire, sans vous identifier personnellement. Durée : ${analyticsCookieLifetime}. Consentement : requis, déposé uniquement après votre accord.`,
          `Nom : _ga_ suivi de l’identifiant de la propriété Google Analytics (par exemple _ga_XXXXXXXXXX). Déposé par : Google Analytics 4. Finalité : conserver l’état de la session en cours. Durée : ${analyticsCookieLifetime}. Consentement : requis, déposé uniquement après votre accord.`,
        ],
      },
      {
        title: 'Aucune mesure d’audience sans votre accord',
        paragraphs: [
          'À votre première visite, un bandeau vous propose d’accepter ou de refuser la mesure d’audience. Les deux boutons ont le même poids. Tant que vous n’avez pas choisi, aucun outil de mesure n’est chargé et aucun cookie de mesure d’audience n’est déposé.',
          'Si vous refusez, Google Tag Manager et Google Analytics ne sont jamais chargés. Si vous acceptez, ils sont chargés et informés de votre accord.',
          'Continuer votre navigation sans choisir ne vaut pas accord.',
        ],
      },
      {
        title: 'Modifier votre choix',
        paragraphs: [
          'Vous pouvez changer d’avis à tout moment. Cliquez sur « Gérer les cookies », en bas de chaque page : le bandeau s’affiche à nouveau et votre nouveau choix remplace le précédent.',
          'Après un refus, plus aucune donnée n’est envoyée à Google Analytics. Les cookies _ga et _ga_* déjà déposés peuvent être supprimés depuis les paramètres de votre navigateur.',
          `Votre choix, accord ou refus, est conservé ${consentCookie.days} jours. Passé ce délai, le bandeau s’affiche à nouveau.`,
          `Vous pouvez aussi configurer votre navigateur pour bloquer ou supprimer les cookies. Si le cookie ${consentCookie.name} est bloqué, le bandeau s’affiche à chaque visite.`,
        ],
      },
      {
        title: 'Pour en savoir plus',
        paragraphs: [
          'Sur les cookies et vos droits : le site de la CNIL, www.cnil.fr, rubrique « Cookies et autres traceurs ».',
          'Sur le traitement de vos données par Google : policies.google.com/privacy, et la politique de confidentialité de ce site.',
        ],
      },
    ],
  },
];
