/**
 * Bandeau de consentement (CNIL) + Google Consent Mode v2.
 *  - Par défaut : tout refusé (analytics_storage: denied). Aucun script Google avant accord.
 *  - Accord : consent update → injection de gtm.js (uniquement si un ID GTM est configuré).
 *  - Choix conservé 180 jours dans un cookie first-party (rstart_consent = granted | denied).
 *  - Réouverture via tout élément [data-consent-open] (lien « Gérer les cookies »).
 */

declare global {
  interface Window {
    dataLayer: unknown[];
    rstartConsent?: { open: () => void; status: () => ConsentStatus };
  }
}

type ConsentStatus = 'granted' | 'denied' | 'unset';

const banner = document.getElementById('consent-banner');
const gtmId = banner?.dataset.gtmId || '';
const cookieName = banner?.dataset.cookieName || 'rstart_consent';
const maxAgeDays = Number(banner?.dataset.maxAgeDays || 180);

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
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'consentement',
    choix,
    origine,
    page_type: document.body.dataset.pageType || 'inconnu',
  });
};

/** Le bandeau a-t-il été rouvert depuis le pied de page, ou est-ce le premier affichage ? */
let rouvert = false;

const applyConsent = (status: ConsentStatus) => {
  if (status === 'granted') {
    gtag('consent', 'update', { analytics_storage: 'granted' });
    loadGtm();
  } else if (status === 'denied') {
    gtag('consent', 'update', { analytics_storage: 'denied' });
  }
};

const show = () => {
  if (!banner) return;
  banner.hidden = false;
  banner.querySelector<HTMLElement>('[data-consent-accept]')?.focus();
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
