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
     1.1) Modal de qualificação — perguntas, opções e mensagem final.
     Só configuração aqui; a lógica fica em setupQualificationModal().
  ------------------------------------------------------------------ */
  var QUALIFICATION_QUESTIONS = [
    {
      key: 'renda',
      title: 'Qual é a renda familiar bruta aproximada?',
      helper: 'Considere a renda das pessoas que participarão do financiamento.',
      options: [
        { value: 'ate-3200', label: 'Até R$ 3.200' },
        { value: '3201-5000', label: 'R$ 3.201 a R$ 5.000' },
        { value: '5001-9600', label: 'R$ 5.001 a R$ 9.600' },
        { value: '9601-13000', label: 'R$ 9.601 a R$ 13.000' },
        { value: 'acima-13000', label: 'Acima de R$ 13.000' },
        { value: 'falar-direto', label: 'Prefiro falar diretamente' }
      ]
    },
    {
      key: 'entrada',
      title: 'Você possui FGTS ou algum valor disponível para entrada?',
      options: [
        { value: 'tem-fgts', label: 'Sim, tenho FGTS' },
        { value: 'tem-valor-entrada', label: 'Sim, tenho valor para entrada' },
        { value: 'tem-fgts-e-entrada', label: 'Tenho FGTS e valor para entrada' },
        { value: 'sem-recursos', label: 'Ainda não tenho' },
        { value: 'entender-melhor', label: 'Preciso entender melhor' }
      ]
    },
    {
      key: 'prazo',
      title: 'Quando você pretende comprar seu apartamento?',
      options: [
        { value: 'agora', label: 'Quero comprar agora' },
        { value: 'ate-3-meses', label: 'Nos próximos 3 meses' },
        { value: '3-a-6-meses', label: 'Entre 3 e 6 meses' },
        { value: 'pesquisando', label: 'Ainda estou pesquisando' }
      ]
    }
  ];

  function buildQualificationMessage(qualificationData) {
    function labelFor(questionKey, value) {
      var question, i, j;
      for (i = 0; i < QUALIFICATION_QUESTIONS.length; i++) {
        question = QUALIFICATION_QUESTIONS[i];
        if (question.key !== questionKey) continue;
        for (j = 0; j < question.options.length; j++) {
          if (question.options[j].value === value) return question.options[j].label;
        }
      }
      return '';
    }

    return 'Olá! Vi o Urban Vila Guilherme pelo site e gostaria de verificar quais ' +
      'unidades são compatíveis com meu perfil.\n\n' +
      'Renda familiar aproximada:\n' + labelFor('renda', qualificationData.renda) + '\n\n' +
      'FGTS / entrada:\n' + labelFor('entrada', qualificationData.entrada) + '\n\n' +
      'Pretensão de compra:\n' + labelFor('prazo', qualificationData.prazo) + '\n\n' +
      'Gostaria de entender quais opções fazem sentido para mim.';
  }

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

      // CTAs com [data-open-qualification] abrem o modal de qualificação em vez
      // de ir direto para o WhatsApp (o href acima fica só como fallback sem JS).
      // O clique e o evento whatsapp_click desses CTAs são tratados em
      // setupQualificationModal(), depois que as 3 perguntas são respondidas.
      if (link.hasAttribute('data-open-qualification')) return;

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
     8) Modal de qualificação de lead
     <dialog> nativo (mesmo padrão do lightbox das plantas): Esc e foco
     preso já vêm do navegador. As respostas ficam centralizadas em
     `qualificationData`; nada de estado espalhado pelo código.
  ------------------------------------------------------------------ */
  function setupQualificationModal() {
    var modal = document.getElementById('qualification-modal');
    if (!modal) return;

    var closeBtn = modal.querySelector('[data-qm-close]');
    var backBtn = document.getElementById('qm-back');
    var continueBtn = document.getElementById('qm-continue');
    var bodyEl = document.getElementById('qm-body');
    var stepCountEl = document.getElementById('qm-step-count');
    var barFillEl = document.getElementById('qm-bar-fill');

    var qualificationData = { renda: '', entrada: '', prazo: '' };
    var totalSteps = QUALIFICATION_QUESTIONS.length;
    var currentStep = 1;
    var lastFocusedTrigger = null;
    var advanceTimer = null;

    function currentQuestion() {
      return QUALIFICATION_QUESTIONS[currentStep - 1];
    }

    function renderStep() {
      var question = currentQuestion();

      stepCountEl.textContent = 'Passo ' + currentStep + ' de ' + totalSteps;
      barFillEl.style.width = (currentStep / totalSteps * 100) + '%';

      var optionsHtml = question.options.map(function (opt) {
        var selected = qualificationData[question.key] === opt.value;
        return '<button type="button" class="qm__option' + (selected ? ' is-selected' : '') +
          '" data-value="' + opt.value + '" aria-pressed="' + (selected ? 'true' : 'false') + '">' +
          opt.label + '</button>';
      }).join('');

      bodyEl.innerHTML =
        '<h2 class="qm__title" id="qm-title">' + question.title + '</h2>' +
        (question.helper ? '<p class="qm__helper">' + question.helper + '</p>' : '') +
        '<div class="qm__options" role="group" aria-label="' + question.title + '">' + optionsHtml + '</div>';

      bodyEl.classList.remove('qm__body--anim');
      void bodyEl.offsetWidth; // força reflow para reiniciar a animação a cada troca de etapa
      bodyEl.classList.add('qm__body--anim');
      bodyEl.scrollTop = 0;

      backBtn.hidden = currentStep === 1;

      var isLastStep = currentStep === totalSteps;
      var shouldShowContinue = isLastStep && !!qualificationData[question.key];

      if (shouldShowContinue && continueBtn.hidden) {
        continueBtn.classList.add('qm__continue--anim');
        // Remove a classe depois da animação: o estado visível final nunca
        // deve depender da animação terminar (aba em segundo plano, etc.).
        setTimeout(function () {
          continueBtn.classList.remove('qm__continue--anim');
        }, 250);
      } else if (!shouldShowContinue) {
        continueBtn.classList.remove('qm__continue--anim');
      }

      continueBtn.hidden = !shouldShowContinue;
    }

    function goToStep(step) {
      currentStep = step;
      renderStep();
    }

    function selectQualificationOption(value) {
      var question = currentQuestion();
      qualificationData[question.key] = value;

      trackEvent('qualification_step_' + currentStep, {
        question: question.key,
        value: value
      });

      clearTimeout(advanceTimer);
      renderStep();

      if (currentStep < totalSteps) {
        advanceTimer = setTimeout(function () {
          goToStep(currentStep + 1);
        }, 380);
      } else if (continueBtn) {
        continueBtn.focus();
      }
    }

    function openQualificationModal(trigger) {
      lastFocusedTrigger = trigger || document.activeElement;

      qualificationData.renda = '';
      qualificationData.entrada = '';
      qualificationData.prazo = '';
      currentStep = 1;
      renderStep();

      document.documentElement.classList.add('qm-open');
      modal.showModal();

      trackEvent('qualification_modal_open', {
        source: (trigger && trigger.getAttribute('data-source')) || 'unknown'
      });

      var firstOption = modal.querySelector('.qm__option');
      if (firstOption) firstOption.focus();
    }

    // Centraliza a limpeza pós-fechamento (destrava scroll, cancela o
    // auto-avanço pendente, devolve o foco). É chamada diretamente por quem
    // fecha o modal (X, clique fora, "Continuar no WhatsApp") em vez de
    // depender só do evento nativo `close` — mais previsível entre
    // navegadores — e também pelo listener de `close` abaixo, para cobrir
    // o fechamento pela tecla Esc (ação nativa do <dialog>). Idempotente:
    // não há problema em rodar duas vezes para o mesmo fechamento.
    function finishClose() {
      document.documentElement.classList.remove('qm-open');
      clearTimeout(advanceTimer);
      if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function') {
        lastFocusedTrigger.focus();
        lastFocusedTrigger = null;
      }
    }

    function closeQualificationModal() {
      if (modal.open) modal.close();
      finishClose();
    }

    // Conversão do Google Ads (snippet oficial "Event snippet for Lead
    // whatsapp conversion page"): dispara o evento de conversão e só então
    // abre o WhatsApp pelo event_callback, igual ao padrão recomendado pelo
    // Google — adaptado de `window.location = url` para `window.open(url, ...)`
    // porque aqui o WhatsApp sempre abre em nova aba, como todos os outros
    // CTAs do site. O timeout de segurança garante que o WhatsApp abre mesmo
    // se o gtag não carregar (bloqueador de anúncios, falha de rede etc.).
    function reportWhatsAppConversion(url) {
      var opened = false;

      function openWhatsAppOnce() {
        if (opened) return;
        opened = true;
        window.open(url, '_blank', 'noopener,noreferrer');
      }

      try {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'conversion', {
            send_to: 'AW-18388777321/7T_mCNngruEcEOnyucBE',
            value: 1.0,
            currency: 'BRL',
            event_callback: openWhatsAppOnce
          });
        }
      } catch (e) { /* segue para o fallback abaixo */ }

      setTimeout(openWhatsAppOnce, 300);
    }

    function handleContinueToWhatsApp() {
      if (!qualificationData.renda || !qualificationData.entrada || !qualificationData.prazo) return;

      trackEvent('qualification_complete', {
        income_range: qualificationData.renda,
        entry_status: qualificationData.entrada,
        purchase_timing: qualificationData.prazo
      });

      var message = buildQualificationMessage(qualificationData);

      trackEvent('whatsapp_click', { source: 'qualification_modal' });

      reportWhatsAppConversion(getWhatsAppUrl(message));

      closeQualificationModal();
    }

    bodyEl.addEventListener('click', function (event) {
      var btn = event.target.closest('.qm__option');
      if (btn) selectQualificationOption(btn.getAttribute('data-value'));
    });

    backBtn.addEventListener('click', function () {
      clearTimeout(advanceTimer);
      if (currentStep > 1) goToStep(currentStep - 1);
    });

    continueBtn.addEventListener('click', handleContinueToWhatsApp);
    closeBtn.addEventListener('click', closeQualificationModal);

    /* Clique fora do conteúdo (no "backdrop") fecha — mesmo padrão do lightbox.
       O alvo precisa ser o próprio <dialog>: cliques em qualquer filho têm o
       filho como alvo. Sem essa checagem, a ativação por teclado (Enter ou
       Espaço num card focado) fecharia o modal, porque o clique sintético do
       navegador chega com clientX/clientY = 0 — fora da caixa do modal. */
    modal.addEventListener('click', function (event) {
      if (event.target !== modal) return;

      var box = modal.getBoundingClientRect();
      var dentro = event.clientX >= box.left && event.clientX <= box.right &&
        event.clientY >= box.top && event.clientY <= box.bottom;
      if (!dentro) closeQualificationModal();
    });

    // Cobre o fechamento pela tecla Esc, que fecha o <dialog> nativamente
    // sem passar por closeQualificationModal().
    modal.addEventListener('close', finishClose);

    var triggers = document.querySelectorAll('[data-open-qualification]');
    Array.prototype.forEach.call(triggers, function (trigger) {
      trigger.addEventListener('click', function (event) {
        event.preventDefault();
        openQualificationModal(trigger);
      });
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
    setupQualificationModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
