/* =====================================================================
   MÉRITO IPIRANGA — main.js
   JavaScript puro, sem dependências. Responsável por:
   1) configuração central (WhatsApp / Google Ads)
   2) leitura e preservação de parâmetros de campanha (UTM / gclid)
   3) tracking preparado para GA4 / GTM / Google Ads
   4) links de WhatsApp + conversão do Google Ads
   5) menu mobile e animações de entrada
   ===================================================================== */

/* ------------------------------------------------------------------
   1) CONFIGURAÇÃO — ALTERE APENAS AQUI
   whatsapp: DDI + DDD + número, somente dígitos.
   Exemplo para (11) 95371-3310 => "5511953713310"
------------------------------------------------------------------ */
const SITE_CONFIG = {
  whatsapp: '5511953713310',
  /* Conversão do Google Ads disparada quando o lead qualificado segue para
     o WhatsApp, no formato 'AW-XXXXXXXXX/XXXXXXXXXXXXXXXX'.
     Em branco ('') = nenhuma conversão é disparada.
     Esta página ainda não tem tag do Google Ads instalada: para ativar,
     cole a tag do gtag.js no <head> do index.html e preencha aqui. */
  adsConversionLabel: ''
};

/* ------------------------------------------------------------------
   2) Parâmetros de campanha (Google Ads)
   Lidos da URL e guardados na sessão para não se perderem na navegação.
------------------------------------------------------------------ */
const CAMPAIGN_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'];

const campaign = readCampaign();

function readCampaign() {
  let stored = {};

  try {
    stored = JSON.parse(sessionStorage.getItem('merito_campaign') || '{}') || {};
  } catch (e) {
    stored = {};
  }

  const params = new URLSearchParams(window.location.search);
  let found = false;

  CAMPAIGN_KEYS.forEach(key => {
    const value = params.get(key);
    if (value) {
      stored[key] = value;
      found = true;
    }
  });

  if (found) {
    try {
      sessionStorage.setItem('merito_campaign', JSON.stringify(stored));
    } catch (e) { /* modo privado: segue sem persistir */ }
  }

  return stored;
}

/* ------------------------------------------------------------------
   3) Tracking — preparado para GA4 / GTM / Google Ads.
   Se nada estiver instalado, a função simplesmente não faz nada.
------------------------------------------------------------------ */
function trackEvent(eventName, data = {}) {
  const payload = { ...data };

  CAMPAIGN_KEYS.forEach(key => {
    if (campaign[key]) payload[key] = campaign[key];
  });

  try {
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...payload });
    }

    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    }
  } catch (e) { /* nunca quebrar a página por causa de tracking */ }
}

function getWhatsAppUrl(message) {
  return `https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
}

/* ------------------------------------------------------------------
   4) WhatsApp — todos os CTAs vão direto para a conversa.
   Cada CTA traz sua própria mensagem em data-message; os cards de planta
   ainda acrescentam a metragem via data-planta.
------------------------------------------------------------------ */
const DEFAULT_MESSAGE =
  'Olá! Vi o Mérito Ipiranga pelo site e gostaria de mais informações.';

/* Conversão do Google Ads.

   Quem abre o WhatsApp é o próprio link (href + target="_blank"), não o
   JavaScript. Isso é deliberado:

   - `window.open(url, '_blank', 'noopener')` devolve `null` mesmo quando abre
     com sucesso (é o que a spec manda quando `noopener` está presente), então
     qualquer verificação de "pop-up bloqueado" pelo retorno dispara sempre e
     acaba abrindo o WhatsApp duas vezes — em nova aba e na aba atual;
   - navegação nativa de link nunca é barrada por bloqueador de pop-up.

   Não é preciso segurar a navegação com `event_callback`: como a aba atual
   continua aberta (target="_blank"), a requisição da conversão tem tempo de
   sair. O `transport_type: 'beacon'` garante o envio mesmo se o navegador for
   para segundo plano quando o app do WhatsApp assumir.

   Sem tag do Ads instalada (adsConversionLabel vazio) nada é disparado. */
function reportWhatsAppConversion() {
  if (!SITE_CONFIG.adsConversionLabel) return;

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', {
        send_to: SITE_CONFIG.adsConversionLabel,
        value: 1.0,
        currency: 'BRL',
        transport_type: 'beacon'
      });
    }
  } catch (e) { /* nunca impedir o lead de chegar ao WhatsApp */ }
}

function setupWhatsAppLinks() {
  document.querySelectorAll('.js-open-lead').forEach(link => {
    const planta = link.dataset.planta || '';
    const message = link.dataset.message || DEFAULT_MESSAGE;

    link.setAttribute('href', getWhatsAppUrl(message));
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');

    link.addEventListener('click', () => {
      trackEvent('whatsapp_click', {
        source: link.dataset.source || 'unknown',
        planta
      });

      reportWhatsAppConversion();
    });
  });
}

/* ------------------------------------------------------------------
   5) Menu mobile
------------------------------------------------------------------ */
function setupMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (!menuToggle || !nav) return;

  menuToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });

  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
  }));
}

/* ------------------------------------------------------------------
   6) Animações de entrada
------------------------------------------------------------------ */
function setupReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  // Sem IntersectionObserver (ou com movimento reduzido): mostra tudo.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .08 });

  items.forEach(el => observer.observe(el));
}

/* ------------------------------------------------------------------
   Init
------------------------------------------------------------------ */
function init() {
  setupWhatsAppLinks();
  setupMobileMenu();
  setupReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
