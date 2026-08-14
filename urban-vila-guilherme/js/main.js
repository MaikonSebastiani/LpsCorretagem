/* =====================================================================
   URBAN VILA GUILHERME — main.js
   JavaScript puro, sem dependências. Responsável por:
   1) configuração central (WhatsApp / consultor)
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
    consultantName: 'Sebastiani Imóveis',
    creci: '',
    legalText: '',
    /* Anexa a origem da campanha (utm/gclid) na mensagem do WhatsApp.
       Deixe false enquanto não for necessário. */
    appendCampaignToMessage: false
  };

  var DEFAULT_MESSAGE =
    'Olá! Vi o Urban Vila Guilherme pelo site e gostaria de saber quais unidades ' +
    'são compatíveis com o meu perfil.';

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
  function getWhatsAppUrl(message) {
    var text = (message || DEFAULT_MESSAGE) + campaignSuffix();
    return 'https://wa.me/' + SITE_CONFIG.whatsapp + '?text=' + encodeURIComponent(text);
  }

  window.getWhatsAppUrl = getWhatsAppUrl;

  function setupWhatsAppLinks() {
    var links = document.querySelectorAll('.whatsapp-link');

    Array.prototype.forEach.call(links, function (link) {
      link.setAttribute('href', getWhatsAppUrl(link.getAttribute('data-message')));
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');

      link.addEventListener('click', function () {
        trackEvent('whatsapp_click', {
          source: link.getAttribute('data-source') || 'unknown'
        });
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
     5) Dados do consultor (nome / CRECI / texto jurídico)
  ------------------------------------------------------------------ */
  function setupConsultant() {
    var nameEl = document.querySelector('[data-consultant-name]');
    var creciEl = document.querySelector('[data-consultant-creci]');
    var legalEl = document.querySelector('[data-legal]');

    if (nameEl && SITE_CONFIG.consultantName) {
      nameEl.textContent = SITE_CONFIG.consultantName;
    }

    if (creciEl && SITE_CONFIG.creci) {
      creciEl.textContent = 'CRECI ' + SITE_CONFIG.creci;
      creciEl.hidden = false;
    }

    if (legalEl && SITE_CONFIG.legalText) {
      legalEl.textContent = SITE_CONFIG.legalText;
      legalEl.hidden = false;
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
    dialog.addEventListener('click', function (event) {
      var box = dialog.getBoundingClientRect();
      var dentro = event.clientX >= box.left && event.clientX <= box.right &&
        event.clientY >= box.top && event.clientY <= box.bottom;
      if (!dentro) dialog.close();
    });

    dialog.addEventListener('close', function () {
      img.src = '';
    });
  }

  /* ------------------------------------------------------------------
     Init
  ------------------------------------------------------------------ */
  function init() {
    setupWhatsAppLinks();
    setupConsultant();
    setupMobileMenu();
    setupPlanLightbox();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
