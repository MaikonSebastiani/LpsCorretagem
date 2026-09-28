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
  /* Conversão do Google Ads disparada no envio do formulário de lead,
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
   Formulário de lead — DUAS FASES (mesmo do Urban e do WL Boa Vista)

   Fase 1 qualifica (renda, entrada, FGTS), fase 2 pede o contato. Três
   toques custam menos que digitar, e quem não tem perfil sai antes de
   virar lead. As três perguntas são obrigatórias: desde que os valores
   saíram da página, este formulário é o único lugar que qualifica.

   Substituiu em 28/09/2026 o formulário de fase única (nome e telefone
   primeiro, renda e "quando pretende comprar" opcionais).

   As opções vivem no HTML e espelham worker/config.js (RENDAS, ENTRADAS,
   FGTS): o servidor recusa valor fora da lista.
------------------------------------------------------------------ */
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

/* DDDs reais da Anatel — a lista tem buracos (20, 23, 30, 36, 40, 50…)
   que "dois dígitos quaisquer" deixava passar. Espelha worker/campos.js:
   se um mudar, o outro precisa mudar junto. */
const DDDS = ('11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,' +
  '37,38,41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,' +
  '69,71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,' +
  '98,99').split(',');

/* Celular discável: 11 dígitos, DDD que existe e o 9 do assinante. O campo
   é o WhatsApp — fixo não recebe mensagem, e número truncado (chegou
   "55119727727") é lead que ninguém consegue atender. */
function telefoneValido(valor) {
  let d = valor.replace(/\D/g, '');
  if (d.length === 13 && d.slice(0, 2) === '55') d = d.slice(2);
  return d.length === 11 && DDDS.indexOf(d.slice(0, 2)) !== -1 && d[2] === '9';
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
  /* Todo CTA abre o formulário. Não existe mais caminho direto para o
     WhatsApp: lead que não passa pelo painel não é dividido com ninguém. */
  const gated = document.querySelectorAll('.js-open-lead');

  if (!modal || !form || !gated.length) return;

  const campoNome = document.getElementById('qz-nome');
  const campoFone = document.getElementById('qz-fone');
  const campoConsent = document.getElementById('qz-consent');
  const campoIsca = document.getElementById('qz-site');
  const botao = document.getElementById('qz-submit');
  const botaoContinuar = form.querySelector('[data-qz-continuar]');
  const botaoVoltar = form.querySelector('[data-qz-voltar]');
  const helper = modal.querySelector('[data-qz-helper]');
  const anuncio = modal.querySelector('[data-qz-anuncio]');
  const passos = modal.querySelectorAll('[data-qz-step]');

  const erros = {
    nome: document.getElementById('qz-erro-nome'),
    fone: document.getElementById('qz-erro-fone'),
    consent: document.getElementById('qz-erro-consent')
  };

  const paineis = {};
  Array.prototype.forEach.call(modal.querySelectorAll('[data-qz-panel]'), function (p) {
    paineis[p.getAttribute('data-qz-panel')] = p;
  });

  const fases = {};
  Array.prototype.forEach.call(form.querySelectorAll('[data-qz-fase]'), function (f) {
    fases[f.getAttribute('data-qz-fase')] = f;
  });

  /* Cada pergunta da fase 1: o `name` do radio e o texto de ajuda da
     fase. A ordem importa — é a ordem em que o foco vai para a primeira
     pergunta sem resposta. */
  const PERGUNTAS = ['renda', 'entrada', 'fgts'];

  const AJUDA = {
    perfil: 'Três perguntas rápidas. Um consultor retorna com as unidades compatíveis com o seu perfil.',
    contato: 'Só falta o contato. O retorno vem pelo WhatsApp, no número que você deixar.'
  };

  let trigger = null;
  let concluiu = false;
  let ativo = false;
  let enviando = false;
  let fase = 'perfil';

  function mostrarPainel(qual) {
    Object.keys(paineis).forEach(function (k) {
      paineis[k].hidden = k !== qual;
    });
  }

  /* Troca a fase visível e acerta rodapé, trilha e texto de apoio. */
  function mostrarFase(qual) {
    fase = qual;

    Object.keys(fases).forEach(function (k) {
      fases[k].hidden = k !== qual;
    });

    const indice = qual === 'contato' ? 1 : 0;

    for (let i = 0; i < passos.length; i++) {
      let estado = 'vazio';
      if (i < indice) estado = 'feito';
      else if (i === indice) estado = 'atual';
      passos[i].setAttribute('data-estado', estado);
    }

    if (helper) helper.textContent = AJUDA[qual] || '';
    if (botaoVoltar) botaoVoltar.hidden = indice === 0;
    if (botaoContinuar) botaoContinuar.hidden = indice !== 0;
    if (botao) botao.hidden = indice === 0;

    if (anuncio) {
      anuncio.textContent = 'Etapa ' + (indice + 1) + ' de ' + passos.length + '. ' +
        (AJUDA[qual] || '');
    }

    /* O modal rola: sem isto a fase 2 abre na altura em que a fase 1
       tinha parado, ou seja, no meio do formulário. */
    if (modal.scrollTop) modal.scrollTop = 0;
  }

  /** Valor marcado de um radio da fase 1, ou null. */
  function respostaDe(nome) {
    const marcada = form.querySelector('input[name="' + nome + '"]:checked');
    return marcada ? marcada.value : null;
  }

  function erroDaPergunta(nome, mostrar) {
    const el = form.querySelector('[data-qz-erro="' + nome + '"]');
    if (el) el.hidden = !mostrar;
  }

  /* Some com o aviso assim que a pessoa responde — não precisa esperar o
     próximo clique em "Continuar" para o vermelho sair da tela. */
  PERGUNTAS.forEach(function (nome) {
    Array.prototype.forEach.call(
      form.querySelectorAll('input[name="' + nome + '"]'),
      function (radio) {
        radio.addEventListener('change', function () { erroDaPergunta(nome, false); });
      }
    );
  });

  function sourceDo() {
    return (trigger && trigger.getAttribute('data-source')) || 'unknown';
  }

  /* Rótulo do botão clicado, como estava escrito na tela. O data-source
     diz de que seção veio; isto diz qual PROMESSA converteu — dá para
     trocar a copy de um CTA e medir se a troca funcionou. O textContent
     ignora o SVG do ícone, então sobra só o texto. */
  function ctaDo() {
    if (!trigger) return null;
    var rotulo = (trigger.textContent || '').replace(/\s+/g, ' ').trim();
    return rotulo ? rotulo.slice(0, 80) : null;
  }

  /* Só o referrer EXTERNO interessa: navegação dentro do próprio site
     sobrescreveria a origem real por uma página nossa. */
  function referrerExterno() {
    try {
      if (!document.referrer) return null;
      var de = new URL(document.referrer);
      return de.hostname === location.hostname ? null : document.referrer;
    } catch (e) {
      return null;
    }
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

  function abrir(el) {
    trigger = el;
    concluiu = false;
    ativo = true;

    mostrarPainel('form');

    /* Sempre volta para a fase 1, mas o que já foi respondido continua
       marcado: o modal é o MESMO DOM em todos os CTAs. Quem desistiu no
       telefone e voltou dá dois toques e está de novo na fase 2. */
    mostrarFase('perfil');

    document.documentElement.classList.add('qz-open');
    modal.showModal();

    trackEvent('lead_form_shown', { source: sourceDo() });

    const primeira = fases.perfil && fases.perfil.querySelector('input');
    if (primeira) primeira.focus({ preventScroll: true });
  }

  /* Avanço da fase 1: as três perguntas são obrigatórias. O foco vai
     para a primeira sem resposta, não para o topo — no celular a
     pergunta que falta pode estar fora da tela. */
  if (botaoContinuar) {
    botaoContinuar.addEventListener('click', function () {
      let faltando = null;

      PERGUNTAS.forEach(function (nome) {
        const respondida = !!respostaDe(nome);
        erroDaPergunta(nome, !respondida);
        if (!respondida && !faltando) faltando = nome;
      });

      if (faltando) {
        trackEvent('lead_form_error', { source: sourceDo(), motivo: 'validacao' });
        const alvo = form.querySelector('input[name="' + faltando + '"]');
        if (alvo) alvo.focus();
        return;
      }

      trackEvent('lead_form_step', { source: sourceDo(), step: 'perfil' });
      mostrarFase('contato');
      if (campoNome) campoNome.focus({ preventScroll: true });
    });
  }

  if (botaoVoltar) {
    botaoVoltar.addEventListener('click', function () { mostrarFase('perfil'); });
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

    const renda = respostaDe('renda');
    const source = sourceDo();

    gravarLead({
      empreendimento: EMPREENDIMENTO,
      nome: nome,
      telefone: fone,
      renda: renda,
      entrada: respostaDe('entrada'),
      fgts: respostaDe('fgts'),
      planta: plantaDo(),
      referrer: referrerExterno(),
      origem: source,
      cta: ctaDo(),
      campanha: campaign,
      pagina: location.pathname,
      consentimento: true,
      site: campoIsca ? campoIsca.value : ''
    }).then(function (ok) {
      enviando = false;
      botao.disabled = false;
      botao.textContent = 'Falar com um corretor';

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

    /* Enter num radio da fase 1 dispara o submit implícito do formulário.
       Sem esta guarda, o envio saía com nome e telefone vazios e a pessoa
       via erros apontando para campos que nem estão na tela. Na fase 1,
       Enter faz o mesmo que "Continuar". */
    if (fase !== 'contato') {
      if (botaoContinuar) botaoContinuar.click();
      return;
    }

    enviar();
  });

  const retry = modal.querySelector('[data-qz-retry]');
  if (retry) {
    retry.addEventListener('click', function () {
      mostrarPainel('form');
      mostrarFase('contato');
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
