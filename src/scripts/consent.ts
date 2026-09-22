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
 * `arguments`, ET SURTOUT PAS UN TABLEAU. GTM ne reconnaît une commande gtag que si l'entrée du
 * dataLayer est un objet Arguments ; un tableau (`...args`) est ignoré sans un mot, et aucun signal
 * du Consent Mode n'arrivait au conteneur, surtout pas le RETRAIT, après lequel les tags
 * continuaient. Forme de la documentation de Google, à ne pas « moderniser » : une fonction
 * déclarée (une fléchée n'a pas d'`arguments`), le paramètre de reste ne sert qu'au typage.
 * tests/qualite.spec.ts le vérifie.
 */
function gtag(..._commande: unknown[]): void {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

const readCookie = (): ConsentStatus => {
  const match = document.cookie.match(new RegExp('(?:^|; )' + cookieName + '=([^;]*)'));
  /* SANS `decodeURIComponent` : les valeurs admises sont de l'ASCII pur, et un cookie mal encodé («
     % », que tout sous-domaine peut écrire) levait une URIError à l'évaluation du module, livré
     avec la mesure, la campagne et le moteur d'animation : tout tombait avec lui, à chaque page,
     180 jours. */
  const value = match?.[1] ?? '';
  return value === 'granted' || value === 'denied' ? value : 'unset';
};

/** Domaine du cookie : `.r-start.com` dès que le site y est servi, pour que le choix vaille AUSSI
    sur le sous-domaine du tunnel. Vide ailleurs (localhost, github.io) : un cookie portant un
    domaine étranger à l'hôte est rejeté. */
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

/** Le choix du visiteur, envoyé au dataLayer : sans lui on ne sait pas quelle part du trafic est
    mesurée. Envoyé même sur un refus, sinon la file rejouée plus tard ressemble à une visite qui
    n'a rien choisi. */
const pousserChoix = (
  choix: 'accepte' | 'refuse' | 'personnalise',
  origine: 'bandeau' | 'reouverture'
) => {
  /* Par le canal commun (`rstart:mesure`, écouté par analytics.ts), pas en écrivant dans le
     dataLayer : l'événement partirait sans `souscription_ouverte` ni la campagne d'entrée que le
     plan de taggage promet « à chaque événement ». */
  document.dispatchEvent(
    new CustomEvent('rstart:mesure', { detail: { event: 'consentement', choix, origine } })
  );
};

/** Le bandeau a-t-il été rouvert depuis le pied de page, ou est-ce le premier affichage ? */
let rouvert = false;

/** Efface les cookies de Google Analytics (`_ga`, `_ga_<propriété>`) sur l'hôte et chacun de ses
    domaines parents : un cookie ne s'efface que sur le domaine exact où il a été écrit. */
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

/** Dernier choix appliqué sur cette page : il dit si un refus est un RETRAIT, et un accord un
    revirement. */
let applique: ConsentStatus = 'unset';

/**
 * REFUSER APRÈS AVOIR ACCEPTÉ : le signal ne suffit pas, les cookies `_ga` resteraient treize mois
 * alors que la politique dit « plus aucune donnée n'est envoyée ». Ils sont effacés au retrait.
 * ACCEPTER APRÈS AVOIR REFUSÉ : GTM rejoue la file `dataLayer` en entier à son chargement, et les
 * gestes faits PENDANT le refus partiraient après coup. Ils sont retirés de la file avant. Rien
 * n'est purgé pour un visiteur qui n'a encore rien choisi : c'est le plan de taggage.
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

/** LE FOCUS VA AU TITRE DU BANDEAU, pas à « Tout accepter » : au clavier, Entrée acceptait d'office
    et le choix n'était neutre que pour la souris. Tab mène ensuite aux boutons dans leur ordre. */
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
  /* Le bandeau n'est déplié qu'une fois les polices prêtes : affiché avant, il se recomposait à
     l'arrivée de Plus Jakarta Sans, seule source de CLS mesurée sur l'accueil (0,123).
     `document.fonts.ready` se résout aussi en cas d'échec ; le repli couvre les navigateurs sans
     l'API. Aucun tag n'est chargé entre-temps. */
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
