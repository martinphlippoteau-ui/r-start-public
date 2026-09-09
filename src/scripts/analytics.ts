/**
 * Événements dataLayer (GTM). Fonctionne avant le chargement de GTM : la file est rejouée
 * lorsque le conteneur se charge après consentement.
 *  - cta_souscrire_click : clic sur un CTA vers le tunnel ([data-cta="souscrire"])
 *  - document_download   : clic sur un document réglementaire ([data-doc])
 *  - faq_open            : ouverture d'une question ([data-faq] <details>)
 *  - section_view        : section visible à 50 % (une fois) ([data-section])
 */

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

const push = (event: Record<string, unknown>) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
};

const init = () => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    const cta = target?.closest<HTMLAnchorElement>('[data-cta="souscrire"]');
    if (cta) {
      push({
        event: 'cta_souscrire_click',
        cta_position: cta.dataset.ctaPosition || 'unknown',
        cta_label: cta.textContent?.trim() || '',
      });
      return;
    }
    const doc = target?.closest<HTMLAnchorElement>('[data-doc]');
    if (doc) {
      push({ event: 'document_download', doc: doc.dataset.doc || doc.getAttribute('href') || '' });
    }
  });

  document.querySelectorAll<HTMLDetailsElement>('details[data-faq]').forEach((d) => {
    d.addEventListener('toggle', () => {
      if (d.open) push({ event: 'faq_open', question: d.dataset.faq || '' });
    });
  });

  if ('IntersectionObserver' in window) {
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.section || entry.target.id;
          if (entry.isIntersecting && id && !seen.has(id)) {
            seen.add(id);
            push({ event: 'section_view', section: id });
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.5 }
    );
    document.querySelectorAll<HTMLElement>('[data-section]').forEach((s) => io.observe(s));
  }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

export {};
