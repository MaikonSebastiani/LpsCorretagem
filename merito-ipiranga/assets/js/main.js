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
  /* Conversão do Google Ads disparada no clique que leva ao WhatsApp,
     no formato 'AW-XXXXXXXXX/XXXXXXXXXXXXXXXX'.
     Em branco ('') = nenhuma conversão é disparada.
     Hoje aponta para a mesma ação de conversão do Urban Vila Guilherme —
     os leads dos dois empreendimentos caem juntos nesse relatório. Para
     separar, crie uma ação de conversão só do Mérito e troque o rótulo. */
  adsConversionLabel: 'AW-18388777321/7T_mCNngruEcEOnyucBE'
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

/* Um lead só: o evento próprio mais a conversão do Ads, sempre juntos.
   Todo CTA passa por aqui, com ou sem porteira de qualificação. */
function reportLead(source, extra = {}) {
  trackEvent('whatsapp_click', { source: source || 'unknown', ...extra });
  reportWhatsAppConversion();
}

function setupWhatsAppLinks() {
  document.querySelectorAll('.js-open-lead').forEach(link => {
    const planta = link.dataset.planta || '';
    const message = link.dataset.message || DEFAULT_MESSAGE;

    link.setAttribute('href', getWhatsAppUrl(message));
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');

    /* O href do WhatsApp fica só como rede de segurança para quem estiver
       sem JavaScript — o clique normal é interceptado pelo formulário, que
       chama preventDefault. Sem isso o botão viraria um link morto.

       Nada de evento nem de conversão aqui: quem dispara é o envio do
       formulário. */
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
   Pergunta de qualificação

   Uma pergunta, um toque, e ninguém fica bloqueado: a última opção é a
   saída para quem não quer informar. Os três eventos (shown / answered /
   abandoned) existem para medir a queda que a porteira causa — se ela
   custar mais leads do que qualifica, dá para ver no relatório.
------------------------------------------------------------------ */
const QUALIFIER_OPTIONS = [
  { value: 'faixa-1', label: 'Até R$ 3.200' },
  { value: 'faixa-2', label: 'R$ 3.200 – 5.000' },
  { value: 'faixa-3', label: 'R$ 5.000 – 9.600' },
  { value: 'faixa-4', label: 'R$ 9.600 – 13.000' },
  { value: 'acima-teto', label: 'Acima de R$ 13.000' },
  { value: 'nao-informado', label: 'Prefiro não dizer' }
];

const LEAD_ENDPOINT = '/api/lead';
const EMPREENDIMENTO = 'merito-ipiranga';

/* Formata enquanto digita, só para leitura: (11) 98765-4321.
   O que vai para o banco são os dígitos crus. */
function formatarTelefone(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
  if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
  return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
}

/* Frouxa de propósito: 10 dígitos (fixo) ou 11 (celular). Rejeitar número
   válido custa um lead; aceitar um com typo custa uma ligação. */
function telefoneValido(valor) {
  const d = valor.replace(/\D/g, '');
  return d.length === 10 || d.length === 11;
}

/* Grava o lead e ESPERA a resposta.

   Antes o WhatsApp era a rede de segurança e dava para disparar e seguir
   em frente. Agora o formulário é o fim do caminho: se a gravação falhar
   e ninguém avisar, o lead some. Por isso o await e a tela de erro. */
function gravarLead(dados) {
  return fetch(LEAD_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  }).then(function (r) { return r.ok; }).catch(function () { return false; });
}

function setupQualifier() {
  const modal = document.getElementById('qualifier');
  const form = document.getElementById('qz-form');
  const optionsEl = document.getElementById('qz-options');
  /* Todo CTA abre o formulário. Não existe mais caminho direto para o
     WhatsApp: lead que não passa pelo painel não é dividido com ninguém. */
  const gated = document.querySelectorAll('.js-open-lead');

  if (!modal || !form || !optionsEl || !gated.length) return;

  const campoNome = document.getElementById('qz-nome');
  const campoFone = document.getElementById('qz-fone');
  const campoConsent = document.getElementById('qz-consent');
  const campoIsca = document.getElementById('qz-site');
  const botao = document.getElementById('qz-submit');

  const erros = {
    nome: document.getElementById('qz-erro-nome'),
    fone: document.getElementById('qz-erro-fone'),
    consent: document.getElementById('qz-erro-consent')
  };

  const paineis = {};
  Array.prototype.forEach.call(modal.querySelectorAll('[data-qz-panel]'), function (p) {
    paineis[p.getAttribute('data-qz-panel')] = p;
  });

  let trigger = null;
  let concluiu = false;
  let ativo = false;
  let enviando = false;

  /* Renda é opcional: exigir a faixa só aumentaria o abandono, e nome e
     telefone já bastam para a equipe atender. */
  optionsEl.innerHTML = QUALIFIER_OPTIONS.map(function (o) {
    return '<label class="qz__option">' +
      '<input type="radio" name="renda" value="' + o.value + '">' +
      '<span>' + o.label + '</span></label>';
  }).join('');

  function mostrarPainel(qual) {
    Object.keys(paineis).forEach(function (k) {
      paineis[k].hidden = k !== qual;
    });
  }

  function sourceDo() {
    return (trigger && trigger.getAttribute('data-source')) || 'unknown';
  }

  /* Metragem do card, quando o formulário abriu por um CTA de planta.
     O Mérito marca com data-planta; o Urban não tem o atributo, então
     lê do próprio card. */
  function plantaDo() {
    if (!trigger) return null;
    if (trigger.getAttribute('data-planta')) return trigger.getAttribute('data-planta');
    const card = trigger.closest('.plan, .plan-card');
    const area = card && card.querySelector('.plan__area, .plan-info strong');
    return area ? area.textContent.trim() : null;
  }

  function rendaEscolhida() {
    const marcada = form.querySelector('input[name="renda"]:checked');
    return marcada ? marcada.value : null;
  }

  function abrir(el) {
    trigger = el;
    concluiu = false;
    ativo = true;

    mostrarPainel('form');
    document.documentElement.classList.add('qz-open');
    modal.showModal();

    trackEvent('lead_form_shown', { source: sourceDo() });

    if (campoNome) campoNome.focus();
  }

  /* Encerra o ciclo uma vez só, venha o fechamento de onde vier. */
  function finalizar() {
    if (!ativo) return;
    ativo = false;

    document.documentElement.classList.remove('qz-open');

    if (!concluiu) {
      trackEvent('lead_form_abandoned', { source: sourceDo() });
    }

    if (trigger && typeof trigger.focus === 'function') trigger.focus();
  }

  function fechar() {
    if (modal.open) modal.close();
    finalizar();
  }

  function mostrarErro(el, mostrar) {
    if (el) el.hidden = !mostrar;
  }

  if (campoFone) {
    campoFone.addEventListener('input', function () {
      campoFone.value = formatarTelefone(campoFone.value);
    });
  }

  function enviar() {
    if (enviando) return;

    const nome = (campoNome.value || '').trim();
    const fone = (campoFone.value || '').trim();
    const aceitou = !!(campoConsent && campoConsent.checked);

    mostrarErro(erros.nome, !nome);
    mostrarErro(erros.fone, !telefoneValido(fone));
    mostrarErro(erros.consent, !aceitou);

    if (!nome) { campoNome.focus(); return; }
    if (!telefoneValido(fone)) { campoFone.focus(); return; }
    if (!aceitou) { campoConsent.focus(); return; }

    enviando = true;
    botao.disabled = true;
    botao.textContent = 'Enviando…';

    const renda = rendaEscolhida();
    const source = sourceDo();

    gravarLead({
      empreendimento: EMPREENDIMENTO,
      nome: nome,
      telefone: fone,
      renda: renda,
      planta: plantaDo(),
      origem: source,
      campanha: campaign,
      pagina: location.pathname,
      consentimento: true,
      site: campoIsca ? campoIsca.value : ''
    }).then(function (ok) {
      enviando = false;
      botao.disabled = false;
      botao.textContent = 'Quero receber os valores';

      if (!ok) {
        /* Não marca concluiu: se a pessoa fechar agora, conta como
           abandono, que é o que de fato aconteceu. */
        mostrarPainel('erro');
        trackEvent('lead_form_error', { source: source });
        return;
      }

      concluiu = true;
      mostrarPainel('ok');

      /* A conversão agora é o formulário enviado, não mais o clique no
         WhatsApp. É este o evento que o Ads deve otimizar. */
      trackEvent('lead_submit', {
        source: source,
        income_range: renda || 'nao-informado'
      });
      reportWhatsAppConversion();
    });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    enviar();
  });

  const retry = modal.querySelector('[data-qz-retry]');
  if (retry) {
    retry.addEventListener('click', function () {
      mostrarPainel('form');
      enviar();
    });
  }

  Array.prototype.forEach.call(modal.querySelectorAll('[data-qz-close]'), function (b) {
    b.addEventListener('click', fechar);
  });

  /* Clique no backdrop fecha. O alvo precisa ser o próprio <dialog>: sem
     essa checagem, a ativação por teclado chegaria com clientX/clientY = 0
     e fecharia o diálogo. */
  modal.addEventListener('click', function (event) {
    if (event.target !== modal) return;

    const box = modal.getBoundingClientRect();
    const dentro = event.clientX >= box.left && event.clientX <= box.right &&
      event.clientY >= box.top && event.clientY <= box.bottom;

    if (!dentro) fechar();
  });

  modal.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' || event.key === 'Esc') fechar();
  });

  modal.addEventListener('close', finalizar);

  Array.prototype.forEach.call(gated, function (el) {
    el.addEventListener('click', function (event) {
      event.preventDefault();
      abrir(el);
    });
  });
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
  setupQualifier();
  setupTour();
  setupEngagement();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
