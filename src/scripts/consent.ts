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
function gtag(...args: unknown[]) {
  window.dataLayer.push(args);
}

const readCookie = (): ConsentStatus => {
  const match = document.cookie.match(new RegExp('(?:^|; )' + cookieName + '=([^;]*)'));
  const value = match ? decodeURIComponent(match[1] ?? '') : '';
  return value === 'granted' || value === 'denied' ? value : 'unset';
};

const writeCookie = (status: Exclude<ConsentStatus, 'unset'>) => {
  const maxAge = maxAgeDays * 24 * 60 * 60;
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    cookieName + '=' + status + '; Max-Age=' + maxAge + '; Path=/; SameSite=Lax' + secure;
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
  if (target?.closest('[data-consent-accept]')) {
    writeCookie('granted');
    applyConsent('granted');
    hide();
  } else if (target?.closest('[data-consent-refuse]')) {
    writeCookie('denied');
    applyConsent('denied');
    hide();
  } else if (target?.closest('[data-consent-save]')) {
    const checkbox = banner.querySelector<HTMLInputElement>('[data-consent-analytics]');
    const status = checkbox?.checked ? 'granted' : 'denied';
    writeCookie(status);
    applyConsent(status);
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
    show();
  }
});

window.rstartConsent = { open: show, status: readCookie };

export {};
