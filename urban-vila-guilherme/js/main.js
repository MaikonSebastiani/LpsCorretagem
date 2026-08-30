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

  /* Dispara o par evento + conversão e devolve o controle. Usado tanto pelo
     clique direto quanto pela resposta da pergunta de qualificação, para o
     WhatsApp nunca ser contado duas vezes. */
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
      /* O href do WhatsApp fica só como rede de segurança para quem estiver
         sem JavaScript — o clique normal é interceptado pelo formulário, que
         chama preventDefault. Sem isso o botão viraria um link morto.

         Nada de evento nem de conversão aqui: quem dispara é o envio do
         formulário. */
      link.setAttribute('href', getWhatsAppUrl(link.getAttribute('data-message')));
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
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
     9) Pergunta de qualificação (um toque)
     Faixas largas de propósito: o objetivo é separar quem já tem renda
     para o financiamento de quem ainda não tem, não levantar cadastro.
     A última opção existe para ninguém ficar sem caminho — e "prefiro
     não informar" também é sinal útil.
  ------------------------------------------------------------------ */
  const QUALIFIER_OPTIONS = [
    { value: 'ate-3200', label: 'Até R$ 3.200' },
    { value: '3200-5000', label: 'R$ 3.200 – 5.000' },
    { value: '5000-9600', label: 'R$ 5.000 – 9.600' },
    { value: '9600-13000', label: 'R$ 9.600 – 13.000' },
    { value: 'acima-13000', label: 'Acima de R$ 13.000' },
    { value: 'nao-informado', label: 'Prefiro não dizer' }
  ];

  const LEAD_ENDPOINT = '/api/lead';
  const EMPREENDIMENTO = 'urban-vila-guilherme';

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
    const gated = document.querySelectorAll('.whatsapp-link');

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

    /* Momento de compra: string vazia (= "prefiro não dizer") vira null,
       para o servidor não tentar validar "" contra a lista. */
    function momentoDo() {
      var campo = document.getElementById('qz-momento');
      return campo && campo.value ? campo.value : null;
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
        momento: momentoDo(),
        planta: plantaDo(),
        referrer: referrerExterno(),
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
    setupQualifier();
    setupTour();
    setupEngagement();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
