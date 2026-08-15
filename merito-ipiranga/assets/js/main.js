/* =====================================================================
   MÉRITO IPIRANGA — main.js
   JavaScript puro, sem dependências. Responsável por:
   1) configuração central (WhatsApp / Google Ads)
   2) leitura e preservação de parâmetros de campanha (UTM / gclid)
   3) tracking preparado para GA4 / GTM / Google Ads
   4) modal de qualificação de lead (3 perguntas -> WhatsApp)
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
   4) Modal de qualificação — perguntas, opções e mensagem final.
   Só configuração aqui; a lógica fica em setupQualificationModal().
------------------------------------------------------------------ */
const QUALIFICATION_QUESTIONS = [
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

function labelFor(questionKey, value) {
  const question = QUALIFICATION_QUESTIONS.find(q => q.key === questionKey);
  const option = question && question.options.find(o => o.value === value);
  return option ? option.label : '';
}

/* `planta` vem do CTA de cada card de planta (data-planta) e só entra na
   mensagem quando o lead abriu o modal por ali. */
function buildWhatsAppMessage(data, planta) {
  return [
    'Olá! Vi o Mérito Ipiranga pelo site e gostaria de verificar quais unidades são compatíveis com meu perfil.',
    planta ? `\nPlanta de interesse:\n${planta}` : '',
    `\nRenda familiar aproximada:\n${labelFor('renda', data.renda)}`,
    `\nFGTS / entrada:\n${labelFor('entrada', data.entrada)}`,
    `\nPretensão de compra:\n${labelFor('prazo', data.prazo)}`,
    '\nGostaria de entender quais opções fazem sentido para mim.'
  ].filter(Boolean).join('\n');
}

/* ------------------------------------------------------------------
   5) Modal de qualificação de lead
   <dialog> nativo: Esc e foco preso já vêm do navegador. As respostas
   ficam centralizadas em `qualificationData`; nada de estado espalhado.
------------------------------------------------------------------ */
function setupQualificationModal() {
  const modal = document.getElementById('leadModal');
  if (!modal) return;

  const closeBtn = modal.querySelector('.js-close-lead');
  const backBtn = document.getElementById('qmBack');
  const continueBtn = document.getElementById('qmContinue');
  const bodyEl = document.getElementById('modalBody');
  const stepCountEl = document.getElementById('stepCount');
  const progressBar = document.getElementById('progressBar');

  const qualificationData = { renda: '', entrada: '', prazo: '' };
  const totalSteps = QUALIFICATION_QUESTIONS.length;
  let currentStep = 1;
  let plantaInteresse = '';
  let lastFocusedTrigger = null;
  let advanceTimer = null;

  const currentQuestion = () => QUALIFICATION_QUESTIONS[currentStep - 1];

  function renderStep() {
    const question = currentQuestion();

    stepCountEl.textContent = `Passo ${currentStep} de ${totalSteps}`;
    progressBar.style.width = `${(currentStep / totalSteps) * 100}%`;

    const optionsHtml = question.options.map(opt => {
      const selected = qualificationData[question.key] === opt.value;
      return `<button type="button" class="qm-option${selected ? ' is-selected' : ''}" data-value="${opt.value}" aria-pressed="${selected}">${opt.label}</button>`;
    }).join('');

    bodyEl.innerHTML =
      `<h3 id="leadTitle">${question.title}</h3>` +
      (question.helper ? `<p class="modal-help">${question.helper}</p>` : '') +
      `<div class="qm-options" role="group" aria-label="${question.title}">${optionsHtml}</div>`;

    bodyEl.classList.remove('modal-body--anim');
    void bodyEl.offsetWidth; // força reflow para reiniciar a animação a cada etapa
    bodyEl.classList.add('modal-body--anim');
    modal.scrollTop = 0;

    backBtn.hidden = currentStep === 1;

    const shouldShowContinue = currentStep === totalSteps && !!qualificationData[question.key];

    if (shouldShowContinue && continueBtn.hidden) {
      continueBtn.classList.add('qm-continue--anim');
      // O estado visível final nunca depende da animação terminar.
      setTimeout(() => continueBtn.classList.remove('qm-continue--anim'), 250);
    } else if (!shouldShowContinue) {
      continueBtn.classList.remove('qm-continue--anim');
    }

    continueBtn.hidden = !shouldShowContinue;
  }

  function goToStep(step) {
    currentStep = step;
    renderStep();
  }

  function selectQualificationOption(value) {
    const question = currentQuestion();
    qualificationData[question.key] = value;

    trackEvent(`qualification_step_${currentStep}`, { question: question.key, value });

    clearTimeout(advanceTimer);
    renderStep();

    if (currentStep < totalSteps) {
      // Pequeno delay para o usuário ver a opção marcada antes de avançar.
      advanceTimer = setTimeout(() => goToStep(currentStep + 1), 380);
    } else {
      continueBtn.focus();
    }
  }

  function openQualificationModal(trigger) {
    lastFocusedTrigger = trigger || document.activeElement;
    plantaInteresse = (trigger && trigger.dataset.planta) || '';

    qualificationData.renda = '';
    qualificationData.entrada = '';
    qualificationData.prazo = '';
    currentStep = 1;
    renderStep();

    document.body.classList.add('modal-open');
    modal.showModal();

    trackEvent('qualification_modal_open', {
      source: (trigger && trigger.dataset.source) || 'unknown',
      planta: plantaInteresse
    });

    modal.querySelector('.qm-option')?.focus();
  }

  /* Centraliza a limpeza pós-fechamento (destrava o scroll, cancela o
     auto-avanço pendente, devolve o foco). Chamada diretamente por quem
     fecha o modal e também pelo evento `close`, que cobre a tecla Esc.
     Idempotente: rodar duas vezes no mesmo fechamento não causa problema. */
  function finishClose() {
    document.body.classList.remove('modal-open');
    clearTimeout(advanceTimer);
    if (typeof lastFocusedTrigger?.focus === 'function') {
      lastFocusedTrigger.focus();
      lastFocusedTrigger = null;
    }
  }

  function closeQualificationModal() {
    if (modal.open) modal.close();
    finishClose();
  }

  /* Snippet oficial de conversão do Google Ads: dispara o evento e só
     então abre o WhatsApp pelo event_callback. O timeout de segurança
     garante que o WhatsApp abre mesmo se o gtag não carregar (bloqueador
     de anúncios, falha de rede etc.). */
  function reportWhatsAppConversion(url) {
    const abrirWhatsApp = () => window.open(url, '_blank', 'noopener,noreferrer');

    /* Sem conversão configurada (ou sem gtag na página): abre na hora, ainda
       dentro do clique — o que também evita bloqueio de pop-up. */
    if (!SITE_CONFIG.adsConversionLabel || typeof window.gtag !== 'function') {
      abrirWhatsApp();
      return;
    }

    let opened = false;
    const openWhatsAppOnce = () => {
      if (opened) return;
      opened = true;
      abrirWhatsApp();
    };

    try {
      window.gtag('event', 'conversion', {
        send_to: SITE_CONFIG.adsConversionLabel,
        value: 1.0,
        currency: 'BRL',
        event_callback: openWhatsAppOnce
      });
    } catch (e) { /* segue para o fallback abaixo */ }

    setTimeout(openWhatsAppOnce, 300);
  }

  function handleContinueToWhatsApp() {
    const { renda, entrada, prazo } = qualificationData;
    if (!renda || !entrada || !prazo) return;

    trackEvent('qualification_complete', {
      income_range: renda,
      entry_status: entrada,
      purchase_timing: prazo,
      planta: plantaInteresse
    });

    const message = buildWhatsAppMessage(qualificationData, plantaInteresse);

    trackEvent('whatsapp_click', { source: 'qualification_modal' });

    reportWhatsAppConversion(getWhatsAppUrl(message));

    closeQualificationModal();
  }

  bodyEl.addEventListener('click', event => {
    const btn = event.target.closest('.qm-option');
    if (btn) selectQualificationOption(btn.dataset.value);
  });

  backBtn.addEventListener('click', () => {
    clearTimeout(advanceTimer);
    if (currentStep > 1) goToStep(currentStep - 1);
  });

  continueBtn.addEventListener('click', handleContinueToWhatsApp);
  closeBtn.addEventListener('click', closeQualificationModal);

  /* Clique fora do conteúdo (no "backdrop") fecha.
     O alvo precisa ser o próprio <dialog>: cliques em qualquer filho têm o
     filho como alvo. Sem essa checagem, a ativação por teclado (Enter ou
     Espaço num card focado) fecharia o modal, porque o clique sintético do
     navegador chega com clientX/clientY = 0 — fora da caixa do modal. */
  modal.addEventListener('click', event => {
    if (event.target !== modal) return;

    const box = modal.getBoundingClientRect();
    const dentro = event.clientX >= box.left && event.clientX <= box.right &&
      event.clientY >= box.top && event.clientY <= box.bottom;
    if (!dentro) closeQualificationModal();
  });

  // Cobre o fechamento pela tecla Esc, que fecha o <dialog> nativamente.
  modal.addEventListener('close', finishClose);

  document.querySelectorAll('.js-open-lead').forEach(trigger => {
    trigger.addEventListener('click', event => {
      event.preventDefault();
      openQualificationModal(trigger);
    });
  });
}

/* ------------------------------------------------------------------
   6) Menu mobile
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
   7) Animações de entrada
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
  setupQualificationModal();
  setupMobileMenu();
  setupReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
