/* =====================================================================
   URBAN VILA GUILHERME — main.js
   JavaScript puro, sem dependências. Responsável por:
   1) configuração central (WhatsApp)
   2) montagem automática de todos os links de WhatsApp
   3) menu mobile
   4) tracking preparado para GA4 / GTM / Google Ads
   5) leitura e preservação de parâmetros de campanha (UTM / gclid)
   ===================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1) CONFIGURAÇÃO — ALTERE APENAS AQUI
     whatsapp: DDI + DDD + número, somente dígitos.
     Exemplo para (11) 91234-5678 => "5511912345678"
  ------------------------------------------------------------------ */
  var SITE_CONFIG = {
    whatsapp: '5511953713310',
    /* Anexa a origem da campanha (utm/gclid) na mensagem do WhatsApp.
       Deixe false enquanto não for necessário. */
    appendCampaignToMessage: false
  };

  /* Mensagem ÚNICA para todos os CTAs (30/09/2026). Antes cada botão tinha
     a sua, e depois o formulário ficou no meio do caminho; agora todo CTA
     abre o WhatsApp direto com este texto. */
  var DEFAULT_MESSAGE =
    'Oi gostaria de mais informações sobre o empreendimento Urban Vila Guilherme';

  /* ------------------------------------------------------------------
     2) Parâmetros de campanha (Google Ads)
     Lidos da URL e guardados na sessão para não se perderem na navegação.
  ------------------------------------------------------------------ */
  var CAMPAIGN_KEYS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'
  ];

  var campaign = readCampaign();

  function readCampaign() {
    var stored = {};

    try {
      stored = JSON.parse(sessionStorage.getItem('uvg_campaign') || '{}') || {};
    } catch (e) {
      stored = {};
    }

    var params = new URLSearchParams(window.location.search);
    var found = false;

    CAMPAIGN_KEYS.forEach(function (key) {
      var value = params.get(key);
      if (value) {
        stored[key] = value;
        found = true;
      }
    });

    if (found) {
      try {
        sessionStorage.setItem('uvg_campaign', JSON.stringify(stored));
      } catch (e) { /* modo privado: segue sem persistir */ }
    }

    return stored;
  }

  function campaignSuffix() {
    if (!SITE_CONFIG.appendCampaignToMessage) return '';

    var parts = CAMPAIGN_KEYS
      .filter(function (key) { return campaign[key]; })
      .map(function (key) { return key + '=' + campaign[key]; });

    return parts.length ? '\n\n[' + parts.join(' | ') + ']' : '';
  }

  /* ------------------------------------------------------------------
     3) Tracking — preparado para GA4 / GTM / Google Ads.
     Se nada estiver instalado, a função simplesmente não faz nada.
  ------------------------------------------------------------------ */
  function trackEvent(eventName, data) {
    var payload = data || {};

    CAMPAIGN_KEYS.forEach(function (key) {
      if (campaign[key]) payload[key] = campaign[key];
    });

    try {
      if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push(Object.assign({ event: eventName }, payload));
      }

      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, payload);
      }

      /* Conversão do Google Ads (opcional):
         window.gtag('event', 'conversion', { send_to: 'AW-XXXXXXXXX/XXXXXXXX' }); */
    } catch (e) { /* nunca quebrar a página por causa de tracking */ }
  }

  window.trackEvent = trackEvent;

  /* ------------------------------------------------------------------
     4) WhatsApp
  ------------------------------------------------------------------ */
  function getWhatsAppUrl() {
    var text = DEFAULT_MESSAGE + campaignSuffix();
    return 'https://wa.me/' + SITE_CONFIG.whatsapp + '?text=' + encodeURIComponent(text);
  }

  window.getWhatsAppUrl = getWhatsAppUrl;

  /* Conversão do Google Ads — é a conversão principal da campanha.

     Quem abre o WhatsApp é o próprio link (href + target="_blank"), não o
     JavaScript. Isso é deliberado:

     - `window.open(url, '_blank', 'noopener')` devolve `null` mesmo quando
       abre com sucesso (é o que a spec manda quando `noopener` está
       presente), então qualquer verificação de "pop-up bloqueado" pelo
       retorno dispara sempre e acaba abrindo o WhatsApp duas vezes — em
       nova aba e na aba atual;
     - navegação nativa de link nunca é barrada por bloqueador de pop-up.

     Não é preciso segurar a navegação com `event_callback`: como a aba atual
     continua aberta (target="_blank"), a requisição da conversão tem tempo
     de sair. O `transport_type: 'beacon'` garante o envio mesmo se o
     navegador for para segundo plano quando o app do WhatsApp assumir. */
  function reportWhatsAppConversion() {
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', {
          send_to: 'AW-18388777321/3SSRCK-m0OkcEOnyucBE',
          value: 1.0,
          currency: 'BRL',
          transport_type: 'beacon'
        });
      }
    } catch (e) { /* nunca impedir o lead de chegar ao WhatsApp */ }
  }

  /* Dispara o par evento + conversão, uma vez por clique num CTA. */
  function reportLead(source, extra) {
    var payload = { source: source || 'unknown' };
    if (extra) {
      Object.keys(extra).forEach(function (k) { payload[k] = extra[k]; });
    }
    trackEvent('whatsapp_click', payload);
    reportWhatsAppConversion();
  }

  function setupWhatsAppLinks() {
    var links = document.querySelectorAll('.whatsapp-link');

    Array.prototype.forEach.call(links, function (link) {
      /* Desde 30/09/2026 todo CTA vai direto para o WhatsApp — o formulário
         de lead saiu da página. Quem abre a conversa é o próprio link
         (href + target), e o clique só registra evento e conversão. */
      link.setAttribute('href', getWhatsAppUrl());
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');

      link.addEventListener('click', function () {
        reportLead(link.getAttribute('data-source'));
      });
    });

    if (SITE_CONFIG.whatsapp.indexOf('X') !== -1) {
      console.warn(
        '[Urban Vila Guilherme] Configure o número do WhatsApp em js/main.js ' +
        '(SITE_CONFIG.whatsapp).'
      );
    }
  }

  /* ------------------------------------------------------------------
     6) Menu mobile
  ------------------------------------------------------------------ */
  function setupMobileMenu() {
    var header = document.querySelector('.site-header');
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('menu-principal');

    if (!header || !toggle || !nav) return;

    function close() {
      header.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menu');
    }

    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) close();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && header.classList.contains('is-open')) {
        close();
        toggle.focus();
      }
    });
  }

  /* ------------------------------------------------------------------
     7) Lightbox das plantas
     <dialog> nativo: Esc para fechar e foco preso já vêm do navegador,
     sem precisar reimplementar nada disso aqui.
  ------------------------------------------------------------------ */
  function setupPlanLightbox() {
    var dialog = document.getElementById('plan-lightbox');
    var img = document.getElementById('lightbox-img');
    var closeBtn = dialog ? dialog.querySelector('[data-lightbox-close]') : null;
    var triggers = document.querySelectorAll('.plan__img-btn');

    if (!dialog || !img || !triggers.length) return;

    Array.prototype.forEach.call(triggers, function (btn) {
      btn.addEventListener('click', function () {
        var src = btn.getAttribute('data-lightbox-src');
        var sourceImg = btn.querySelector('img');
        if (!src) return;

        img.src = src;
        img.alt = sourceImg ? sourceImg.getAttribute('alt') : '';
        dialog.showModal();

        trackEvent('plan_zoom', {
          area: (btn.closest('.plan').querySelector('.plan__area') || {}).textContent || ''
        });
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        dialog.close();
      });
    }

    // Clique fora da imagem (no "backdrop") fecha. Esc já fecha sozinho.
    /* O alvo precisa ser o próprio <dialog>: a ativação por teclado (Enter
       num botão focado) chega com clientX/clientY = 0 e cairia fora da caixa.
       Mesmo cuidado do diálogo de qualificação. */
    dialog.addEventListener('click', function (event) {
      if (event.target !== dialog) return;

      var box = dialog.getBoundingClientRect();
      var dentro = event.clientX >= box.left && event.clientX <= box.right &&
        event.clientY >= box.top && event.clientY <= box.bottom;
      if (!dentro) dialog.close();
    });

    dialog.addEventListener('close', function () {
      // removeAttribute, não src = '': string vazia dispara uma requisição
      // ao próprio documento.
      img.removeAttribute('src');
    });
  }

  /* ------------------------------------------------------------------
     Vídeo de apresentação

     A capa é só uma imagem: o iframe do YouTube só entra quando a pessoa
     clica no play. Um embed carregado de saída custa perto de 1 MB e
     derrubaria a primeira dobra no celular — em tráfego pago, isso é
     dinheiro jogado fora.
  ------------------------------------------------------------------ */
  function setupTour() {
    var caixa = document.querySelector(".tour__video");
    if (!caixa) return;

    var botao = caixa.querySelector("[data-tour-play]");
    var id = caixa.getAttribute("data-video-id");

    // Sem id preenchido não há o que tocar: a seção fica só com a foto.
    if (!botao || !id || id === "COLE_O_ID_AQUI") return;

    botao.addEventListener("click", function () {
      var frame = document.createElement("iframe");

      /* nocookie: não grava cookie de rastreamento do YouTube enquanto a
         pessoa não der play, o que evita exigir consentimento à toa. */
      frame.src = "https://www.youtube-nocookie.com/embed/" + id +
        "?autoplay=1&rel=0&modestbranding=1";
      frame.title = "Apresentação do Urban Vila Guilherme";
      frame.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
      frame.allowFullscreen = true;

      caixa.innerHTML = "";
      caixa.appendChild(frame);

      trackEvent("video_play", { video: "apresentacao" });
    });
  }

  /* ------------------------------------------------------------------
     Eventos de engajamento

     Marca quatro momentos da rolagem e a abertura do FAQ. Sem isso, uma
     campanha que performa mal não diz se o problema é o anúncio, a
     primeira dobra ou o preço — só o resultado final.

     Cada evento dispara UMA vez por sessão: repetir a cada rolagem
     inflaria o relatório e não diria nada a mais.
  ------------------------------------------------------------------ */
  var SECOES_RASTREADAS = [
    { id: 'como-comprar', nome: 'preco' },
    { id: 'plantas', nome: 'plantas' },
    { id: 'contato', nome: 'cta_final' }
  ];

  function setupEngagement() {
    if (typeof window.IntersectionObserver !== 'function') return;

    var vistos = {};

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var nome = entry.target.getAttribute('data-track-section');
        if (!nome || vistos[nome]) return;

        vistos[nome] = true;
        trackEvent('section_view', { section: nome });
        observer.unobserve(entry.target);
      });
    /* Faixa fina no meio da viewport em vez de porcentagem da seção:
       com threshold, uma seção mais alta que a tela nunca atinge a fração
       pedida (a de "como comprar" tem 1487px). Assim o evento dispara
       quando a seção cruza o centro da tela, seja qual for a altura. */
    }, { threshold: 0, rootMargin: "-35% 0px -35% 0px" });

    SECOES_RASTREADAS.forEach(function (s) {
      var el = document.getElementById(s.id);
      if (!el) return;
      el.setAttribute('data-track-section', s.nome);
      observer.observe(el);
    });

    // FAQ: só a primeira abertura interessa, e só quando abre.
    var faqAberto = false;
    var itens = document.querySelectorAll('.faq__item');

    Array.prototype.forEach.call(itens, function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open || faqAberto) return;
        faqAberto = true;
        trackEvent('faq_open', {
          question: (item.querySelector('summary') || {}).textContent || ''
        });
      });
    });
  }
  /* ------------------------------------------------------------------
     Init
  ------------------------------------------------------------------ */
  function init() {
    setupWhatsAppLinks();
    setupMobileMenu();
    setupPlanLightbox();
    setupTour();
    setupEngagement();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
