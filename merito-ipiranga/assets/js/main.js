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
  /* Conversão do Google Ads disparada no clique de qualquer CTA (desde
     30/09/2026 não há mais formulário),
     no formato 'AW-XXXXXXXXX/XXXXXXXXXXXXXXXX'.
     Em branco ('') = nenhuma conversão é disparada.

     Ação de conversão PRÓPRIA do Mérito Ipiranga (criada em 28/08/2026).
     O Urban tem a dele em urban-vila-guilherme/js/main.js — separadas de
     propósito, para o Smart Bidding otimizar cada campanha pelo próprio
     resultado e o relatório mostrar o custo por lead de cada
     empreendimento. Antes as duas dividiam o mesmo rótulo e os leads
     caíam somados num relatório só. */
  adsConversionLabel: 'AW-18388777321/oA-1CMHMyOkcEOnyucBE'
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

function getWhatsAppUrl() {
  return `https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;
}

/* ------------------------------------------------------------------
   4) WhatsApp — todos os CTAs vão direto para a conversa, com a MESMA
   mensagem (30/09/2026). O formulário de lead saiu da página.
------------------------------------------------------------------ */
const DEFAULT_MESSAGE =
  'Oi gostaria de mais informações sobre o empreendimento Mérito Ipiranga';

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

/* Um lead só: o evento próprio mais a conversão do Ads, sempre juntos,
   uma vez por clique num CTA. */
function reportLead(source, extra = {}) {
  trackEvent('whatsapp_click', { source: source || 'unknown', ...extra });
  reportWhatsAppConversion();
}

function setupWhatsAppLinks() {
  document.querySelectorAll('.js-open-lead').forEach(link => {
    /* Quem abre a conversa é o próprio link (href + target); o clique só
       registra evento e conversão. */
    link.setAttribute('href', getWhatsAppUrl());
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');

    link.addEventListener('click', () => reportLead(link.dataset.source));
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
   Vídeo do decorado

   A capa é só uma imagem: o iframe do YouTube só entra quando a pessoa
   clica no play. Um embed carregado de saída custa perto de 1 MB e
   derrubaria a primeira dobra no celular — em tráfego pago, isso é
   dinheiro jogado fora.
------------------------------------------------------------------ */
function setupTour() {
  const caixa = document.querySelector('.tour__video');
  if (!caixa) return;

  const botao = caixa.querySelector('[data-tour-play]');
  const id = caixa.dataset.videoId;

  // Sem id preenchido não há o que tocar: a seção fica só com a foto.
  if (!botao || !id || id === 'COLE_O_ID_AQUI') return;

  botao.addEventListener('click', () => {
    const frame = document.createElement('iframe');

    /* nocookie: não grava cookie de rastreamento do YouTube enquanto a
       pessoa não der play, o que evita exigir consentimento à toa. */
    frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    frame.title = 'Apresentação do Mérito Ipiranga';
    frame.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
    frame.allowFullscreen = true;

    caixa.innerHTML = '';
    caixa.appendChild(frame);

    trackEvent('video_play', { video: 'apresentacao' });
  });
}

/* ------------------------------------------------------------------
   Eventos de engajamento

   Marca quatro momentos da rolagem e a abertura do FAQ. Sem isso, uma
   campanha que performa mal não diz se o problema é o anúncio, a
   primeira dobra ou o preço — só o resultado final.

   Cada evento dispara UMA vez por sessão.
------------------------------------------------------------------ */
const SECOES_RASTREADAS = [
  { id: 'como-comprar', nome: 'preco' },
  { id: 'plantas', nome: 'plantas' },
  { id: 'contato', nome: 'cta_final' }
];

function setupEngagement() {
  if (typeof window.IntersectionObserver !== 'function') return;

  const vistos = new Set();

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const nome = entry.target.dataset.trackSection;
      if (!nome || vistos.has(nome)) return;

      vistos.add(nome);
      trackEvent('section_view', { section: nome });
      observer.unobserve(entry.target);
    });
  /* Faixa fina no meio da viewport em vez de porcentagem da seção:
     com threshold, uma seção mais alta que a tela nunca atinge a fração
     pedida (a de "como comprar" tem 1487px). Assim o evento dispara
     quando a seção cruza o centro da tela, seja qual for a altura. */
  }, { threshold: 0, rootMargin: "-35% 0px -35% 0px" });

  SECOES_RASTREADAS.forEach(({ id, nome }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.dataset.trackSection = nome;
    observer.observe(el);
  });

  // FAQ: só a primeira abertura interessa, e só quando abre.
  let faqAberto = false;

  document.querySelectorAll('.accordion details').forEach(item => {
    item.addEventListener('toggle', () => {
      if (!item.open || faqAberto) return;
      faqAberto = true;
      trackEvent('faq_open', { question: item.querySelector('summary')?.textContent || '' });
    });
  });
}
/* ------------------------------------------------------------------
   Init
------------------------------------------------------------------ */
function init() {
  setupWhatsAppLinks();
  setupMobileMenu();
  setupReveal();
  setupTour();
  setupEngagement();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
