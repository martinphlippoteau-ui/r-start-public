/**
 * Bandeau de consentement (CNIL) + Google Consent Mode v2.
 *  - Par défaut : tout refusé (analytics_storage: denied). Aucun script Google avant accord.
 *  - Accord : consent update → injection de gtm.js (uniquement si un ID GTM est configuré).
 *  - Choix conservé 180 jours dans un cookie first-party (rstart_consent = granted | denied).
 *  - Réouverture via tout élément [data-consent-open] (lien « Gérer les cookies »).
 */

import { consentCookie } from '@/content/fr/consent';

declare global {
  interface Window {
    dataLayer: unknown[];
    rstartConsent?: { open: () => void; status: () => ConsentStatus };
  }
}

type ConsentStatus = 'granted' | 'denied' | 'unset';

const banner = document.getElementById('consent-banner');
const gtmId = banner?.dataset.gtmId || '';
/* Nom et durée du cookie : une seule source, le contenu, qui alimente aussi la politique cookies. */
const cookieName = consentCookie.name;
const maxAgeDays = consentCookie.days;

window.dataLayer = window.dataLayer || [];
/**
 * `arguments`, ET SURTOUT PAS UN TABLEAU (audit du 18/09/2026). GTM ne reconnaît une commande gtag que
 * si l'entrée du dataLayer est un objet Arguments ; un tableau, ce que donnait le paramètre de reste
 * `...args`, est lu comme un « command array » et ignoré sans un mot. Aucun signal du Consent Mode
 * n'arrivait donc au conteneur : ni le refus par défaut posé plus bas, ni l'accord, ni, surtout, le
 * RETRAIT, après lequel les tags continuaient. C'est la forme de la documentation de Google, à ne pas
 * « moderniser » : une fonction déclarée (une fléchée n'a pas d'`arguments`), et le paramètre de reste
 * n'est là que pour le typage des appels. tests/qualite.spec.ts vérifie la forme de l'entrée.
 */
function gtag(..._commande: unknown[]): void {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

const readCookie = (): ConsentStatus => {
  const match = document.cookie.match(new RegExp('(?:^|; )' + cookieName + '=([^;]*)'));
  /* SANS `decodeURIComponent` (audit du 18/09/2026) : les deux seules valeurs admises sont de l'ASCII
     pur, et un cookie mal encodé (« % », que tout sous-domaine peut écrire) levait une URIError à
     l'évaluation du module. Celui-ci est livré dans le même fichier que la mesure, la campagne et le
     moteur d'animation : tout tombait avec lui, à chaque page, pendant les 180 jours de vie du cookie. */
  const value = match?.[1] ?? '';
  return value === 'granted' || value === 'denied' ? value : 'unset';
};

/**
 * Domaine du cookie : `.r-start.com` dès que le site y est servi, pour que le choix vaille AUSSI sur le
 * sous-domaine du tunnel de souscription (14/09/2026) ; sans cela le tunnel redemanderait le
 * consentement à un visiteur qui vient de le donner. Vide partout ailleurs, sur localhost comme sur la
 * prévisualisation github.io : un cookie portant un domaine étranger à l'hôte est simplement rejeté.
 */
const cookieDomain = (): string => {
  const hote = location.hostname;
  return hote === 'r-start.com' || hote.endsWith('.r-start.com') ? '; Domain=.r-start.com' : '';
};

const writeCookie = (status: Exclude<ConsentStatus, 'unset'>) => {
  const maxAge = maxAgeDays * 24 * 60 * 60;
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    cookieName +
    '=' +
    status +
    '; Max-Age=' +
    maxAge +
    '; Path=/; SameSite=Lax' +
    cookieDomain() +
    secure;
};

let gtmLoaded = false;
const loadGtm = () => {
  if (gtmLoaded || !gtmId) return;
  gtmLoaded = true;
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(gtmId);
  document.head.appendChild(s);
};

/**
 * Le choix du visiteur, envoyé au dataLayer. Indispensable pour interpréter tout le reste : sans lui on
 * ne sait pas quelle part du trafic est mesurée, et les écarts avec les journaux serveur sont
 * inexplicables. Envoyé même sur un refus : la file est rejouée si le conteneur se charge un jour, et
 * un refus qui n'arrive jamais ressemble à une visite qui n'a rien choisi.
 */
const pousserChoix = (
  choix: 'accepte' | 'refuse' | 'personnalise',
  origine: 'bandeau' | 'reouverture'
) => {
  /* Par le canal commun (`rstart:mesure`, écouté par analytics.ts) et plus en écrivant dans le
     dataLayer : l'événement ne recevait que `page_type`, sans `souscription_ouverte` ni la campagne
     d'entrée que le plan de taggage promet « à chaque événement ». */
  document.dispatchEvent(
    new CustomEvent('rstart:mesure', { detail: { event: 'consentement', choix, origine } })
  );
};

/** Le bandeau a-t-il été rouvert depuis le pied de page, ou est-ce le premier affichage ? */
let rouvert = false;

/**
 * Efface les cookies de Google Analytics (`_ga`, `_ga_<propriété>`) sur l'hôte et sur chacun de ses
 * domaines parents : on ne sait pas sur lequel GA4 les a posés, et un cookie ne s'efface que sur le
 * domaine exact où il a été écrit.
 */
const effacerCookiesMesure = () => {
  const noms = document.cookie
    .split(';')
    .map((c) => c.split('=')[0]?.trim() ?? '')
    .filter((nom) => /^_ga($|_)/.test(nom));
  if (!noms.length) return;
  const segments = location.hostname.split('.');
  const domaines = [''];
  for (let i = 0; i < segments.length - 1; i += 1) domaines.push('.' + segments.slice(i).join('.'));
  for (const nom of noms) {
    for (const domaine of domaines) {
      document.cookie =
        nom + '=; Max-Age=0; Path=/' + (domaine ? '; Domain=' + domaine : '') + '; SameSite=Lax';
    }
  }
};

/** Dernier choix appliqué sur cette page : il dit si un refus est un RETRAIT, et un accord un revirement. */
let applique: ConsentStatus = 'unset';

/**
 * CE QUE « REFUSER APRÈS AVOIR ACCEPTÉ » DOIT VRAIMENT FAIRE (audit du 18/09/2026). Le signal de refus
 * était envoyé, mais les cookies `_ga` posés pendant l'accord restaient en place pour treize mois, alors
 * que la politique du site dit « plus aucune donnée n'est envoyée ». Ils sont effacés au retrait.
 *
 * ET L'INVERSE : ACCEPTER APRÈS AVOIR REFUSÉ. La file `dataLayer` garde tout ce que la page y a poussé,
 * et GTM la rejoue en entier à son chargement : les gestes faits PENDANT le refus seraient envoyés à
 * GA4 après coup. Ils sont retirés de la file avant le chargement du conteneur. La file n'est PAS
 * purgée pour un visiteur qui n'a encore rien choisi : c'est le fonctionnement voulu du plan de
 * taggage, rien n'est perdu entre l'arrivée et l'accord.
 */
const applyConsent = (status: ConsentStatus) => {
  if (status === 'granted') {
    if (applique === 'denied') {
      const gardes = window.dataLayer.filter(
        (x) =>
          Object.prototype.toString.call(x) === '[object Arguments]' ||
          (x as { event?: unknown } | null)?.event === 'consentement'
      );
      window.dataLayer.splice(0, window.dataLayer.length, ...gardes);
    }
    gtag('consent', 'update', { analytics_storage: 'granted' });
    loadGtm();
  } else if (status === 'denied') {
    gtag('consent', 'update', { analytics_storage: 'denied' });
    effacerCookiesMesure();
  }
  applique = status;
};

/**
 * LE FOCUS VA AU TITRE DU BANDEAU, pas à « Tout accepter » (audit du 18/09/2026). Les deux boutons ont
 * le même poids à l'écran, mais au clavier Entrée acceptait d'office : le choix n'était neutre que pour
 * la souris. Le titre est lu par le lecteur d'écran, et Tab mène ensuite aux boutons dans leur ordre.
 */
const show = () => {
  if (!banner) return;
  banner.hidden = false;
  const titre = banner.querySelector<HTMLElement>('#consent-title');
  if (titre) {
    titre.tabIndex = -1;
    /* Un titre n'est pas un contrôle : il reçoit le focus pour être lu, sans l'anneau des éléments
       interactifs. Par le CSSOM, la CSP n'a rien à dire. */
    titre.style.setProperty('outline', 'none');
    titre.style.setProperty('box-shadow', 'none');
    titre.focus({ preventScroll: true });
  }
};
const hide = () => {
  if (banner) banner.hidden = true;
};

// Consent Mode v2 : valeurs par défaut AVANT tout tag.
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
  wait_for_update: 500,
});

const current = readCookie();
if (current === 'unset') {
  /**
   * Le bandeau n'est déplié qu'une fois les polices prêtes. Affiché avant, il se compose en police de
   * repli, puis se recompose quand Plus Jakarta Sans arrive : sa hauteur change et son contenu saute.
   * C'était l'unique source de décalage de mise en page mesurée par Lighthouse sur l'accueil
   * (CLS 0,123 en 1440×900, imputé au bandeau, cause « Web font loaded »).
   * `document.fonts.ready` se résout aussi lorsque le chargement échoue ; le repli couvre les
   * navigateurs sans l'API. L'attente se compte en dizaines de millisecondes : aucun tag n'est chargé
   * entre-temps, le consentement reste refusé par défaut.
   */
  if (document.fonts?.ready) void document.fonts.ready.then(show);
  else show();
} else applyConsent(current);

banner?.addEventListener('click', (e) => {
  const target = e.target as HTMLElement | null;
  const origine = rouvert ? 'reouverture' : 'bandeau';
  if (target?.closest('[data-consent-accept]')) {
    writeCookie('granted');
    applyConsent('granted');
    pousserChoix('accepte', origine);
    hide();
  } else if (target?.closest('[data-consent-refuse]')) {
    writeCookie('denied');
    applyConsent('denied');
    pousserChoix('refuse', origine);
    hide();
  } else if (target?.closest('[data-consent-save]')) {
    const checkbox = banner.querySelector<HTMLInputElement>('[data-consent-analytics]');
    const status = checkbox?.checked ? 'granted' : 'denied';
    writeCookie(status);
    applyConsent(status);
    pousserChoix('personnalise', origine);
    hide();
  } else if (target?.closest('[data-consent-customize]')) {
    const panel = banner.querySelector<HTMLElement>('[data-consent-panel]');
    if (panel) {
      panel.hidden = !panel.hidden;
      banner
        .querySelector<HTMLElement>('[data-consent-customize]')
        ?.setAttribute('aria-expanded', String(!panel.hidden));
    }
  }
});

document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement | null;
  if (target?.closest('[data-consent-open]')) {
    e.preventDefault();
    const checkbox = banner?.querySelector<HTMLInputElement>('[data-consent-analytics]');
    if (checkbox) checkbox.checked = readCookie() === 'granted';
    rouvert = true;
    show();
  }
});

window.rstartConsent = { open: show, status: readCookie };

export {};
