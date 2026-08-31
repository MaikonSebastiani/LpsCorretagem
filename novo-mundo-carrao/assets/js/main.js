/* =====================================================================
   NOVO MUNDO CARRÃO II — main.js

   Mesma arquitetura das outras duas LPs: o formulário é o fim do caminho
   (não abre WhatsApp), espera a resposta do servidor e mostra tela de
   erro quando a gravação falha — se falhasse em silêncio, o lead sumia.

   O que muda aqui: nada de conversão do Ads ainda. Esta LP precisa da
   PRÓPRIA ação de conversão no Google Ads, como Urban e Mérito têm, para
   o Smart Bidding otimizar por empreendimento. Enquanto o rótulo não for
   criado, ADS_CONVERSAO fica vazio e nenhuma conversão é disparada — é
   melhor não reportar nada do que somar este lançamento no relatório de
   outro.
   ===================================================================== */
(function () {
  'use strict';

  var EMPREENDIMENTO = 'novo-mundo-carrao';
  var LEAD_ENDPOINT = '/api/lead';

  /* Rótulo próprio do Carrão, no formato 'AW-XXXXXXXXX/XXXXXXXXXXXX'.
     Vazio = nenhuma conversão disparada (ver comentário do topo). */
  var ADS_CONVERSAO = '';

  /* As 4 faixas oficiais do Minha Casa Minha Vida mais as duas saídas de
     fora do programa. Espelha RENDAS em worker/config.js — a lista
     canônica vive lá, e o servidor recusa valor que não esteja nela. */
  var FAIXAS_RENDA = [
    { value: 'ate-3200', label: 'Até R$ 3.200' },
    { value: '3200-5000', label: 'R$ 3.200 – 5.000' },
    { value: '5000-9600', label: 'R$ 5.000 – 9.600' },
    { value: '9600-13000', label: 'R$ 9.600 – 13.000' },
    { value: 'acima-13000', label: 'Acima de R$ 13.000' },
    { value: 'nao-informado', label: 'Prefiro não dizer' }
  ];

  /* DDDs reais da Anatel — a lista tem buracos (20, 23, 30, 36, 40, 50…)
     que "dois dígitos quaisquer" deixava passar. Espelha worker/campos.js:
     se um mudar, o outro precisa mudar junto. */
  var DDDS = ('11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,' +
    '37,38,41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,' +
    '69,71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,' +
    '98,99').split(',');

  /* Celular discável: 11 dígitos, DDD que existe e o 9 do assinante. O
     campo é o WhatsApp — fixo não recebe mensagem, e número truncado é
     lead que ninguém consegue atender. */
  function telefoneValido(valor) {
    var d = valor.replace(/\D/g, '');
    if (d.length === 13 && d.slice(0, 2) === '55') d = d.slice(2);
    return d.length === 11 && DDDS.indexOf(d.slice(0, 2)) !== -1 && d[2] === '9';
  }

  /* Formata enquanto digita, só para leitura: (11) 98765-4321.
     O que vai para o banco são os dígitos crus. */
  function formatarTelefone(valor) {
    var d = valor.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  function rastrear(evento, dados) {
    try {
      if (window.Saitama && window.Saitama.rastrear) {
        window.Saitama.rastrear(evento, dados);
        return;
      }
      if (typeof window.gtag === 'function') window.gtag('event', evento, dados || {});
    } catch (e) { /* nunca quebrar a página por causa de tracking */ }
  }

  function reportarConversao() {
    if (!ADS_CONVERSAO) return;
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', {
          send_to: ADS_CONVERSAO,
          value: 1.0,
          currency: 'BRL',
          transport_type: 'beacon'
        });
      }
    } catch (e) { /* conversão nunca pode derrubar o fluxo do lead */ }
  }

  /* ------------------------------------------------------------------
     Menu do celular
  ------------------------------------------------------------------ */
  var topo = document.querySelector('.topo');
  var toggle = document.querySelector('.menu-toggle');

  if (topo && toggle) {
    toggle.addEventListener('click', function () {
      var aberto = topo.classList.toggle('aberto');
      toggle.setAttribute('aria-expanded', String(aberto));
      toggle.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });

    topo.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        topo.classList.remove('aberto');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ------------------------------------------------------------------
     Modal de captação
  ------------------------------------------------------------------ */
  var modal = document.getElementById('qualifier');
  if (!modal) return;

  var form = document.getElementById('qz-form');
  var opcoesEl = document.getElementById('qz-options');
  var campoNome = document.getElementById('qz-nome');
  var campoFone = document.getElementById('qz-fone');
  var campoConsent = document.getElementById('qz-consent');
  var campoIsca = document.getElementById('qz-site');
  var botao = document.getElementById('qz-submit');

  var erros = {
    nome: document.getElementById('qz-erro-nome'),
    fone: document.getElementById('qz-erro-fone'),
    consent: document.getElementById('qz-erro-consent')
  };

  var paineis = {};
  modal.querySelectorAll('[data-qz-panel]').forEach(function (p) {
    paineis[p.getAttribute('data-qz-panel')] = p;
  });

  var trigger = null;
  var enviando = false;
  var concluiu = false;

  opcoesEl.innerHTML = FAIXAS_RENDA.map(function (o) {
    return '<label class="qz__option">' +
      '<input type="radio" name="renda" value="' + o.value + '">' +
      '<span>' + o.label + '</span></label>';
  }).join('');

  function mostrarPainel(qual) {
    Object.keys(paineis).forEach(function (k) { paineis[k].hidden = k !== qual; });
  }

  function mostrarErro(el, mostrar) {
    if (el) el.hidden = !mostrar;
  }

  function sourceDo() {
    return (trigger && trigger.getAttribute('data-source')) || 'unknown';
  }

  /* Rótulo do botão clicado, como estava escrito na tela. O data-source
     diz de que seção veio; isto diz qual promessa converteu. */
  function ctaDo() {
    if (!trigger) return null;
    var rotulo = (trigger.textContent || '').replace(/\s+/g, ' ').trim();
    return rotulo ? rotulo.slice(0, 80) : null;
  }

  function plantaDo() {
    return trigger ? trigger.getAttribute('data-planta') : null;
  }

  function momentoDo() {
    var campo = document.getElementById('qz-momento');
    return campo && campo.value ? campo.value : null;
  }

  function rendaEscolhida() {
    var marcada = form.querySelector('input[name="renda"]:checked');
    return marcada ? marcada.value : null;
  }

  /* Só o referrer EXTERNO interessa: navegação dentro do próprio site
     sobrescreveria a origem real por uma página nossa. */
  function referrerExterno() {
    try {
      if (!document.referrer) return null;
      var de = new URL(document.referrer);
      return de.hostname === location.hostname ? null : document.referrer;
    } catch (e) { return null; }
  }

  function abrir(el) {
    trigger = el;
    concluiu = false;
    mostrarPainel('form');
    document.documentElement.classList.add('qz-open');
    modal.showModal();
    rastrear('lead_form_open', { source: sourceDo() });
    if (campoNome) campoNome.focus();
  }

  function fechar() {
    modal.close();
  }

  modal.addEventListener('close', function () {
    document.documentElement.classList.remove('qz-open');
    if (!concluiu) rastrear('lead_form_abandoned', { source: sourceDo() });
  });

  document.querySelectorAll('.js-lead').forEach(function (el) {
    el.addEventListener('click', function (evento) {
      evento.preventDefault();
      abrir(el);
    });
  });

  modal.querySelectorAll('[data-qz-close]').forEach(function (b) {
    b.addEventListener('click', fechar);
  });

  var tentar = modal.querySelector('[data-qz-retry]');
  if (tentar) tentar.addEventListener('click', function () { mostrarPainel('form'); });

  if (campoFone) {
    campoFone.addEventListener('input', function () {
      campoFone.value = formatarTelefone(campoFone.value);
    });
  }

  function gravarLead(dados) {
    return fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    }).then(function (r) { return r.ok; }).catch(function () { return false; });
  }

  function enviar() {
    if (enviando) return;

    var nome = (campoNome.value || '').trim();
    var fone = (campoFone.value || '').trim();
    var aceitou = !!(campoConsent && campoConsent.checked);

    mostrarErro(erros.nome, !nome);
    mostrarErro(erros.fone, !telefoneValido(fone));
    mostrarErro(erros.consent, !aceitou);

    if (!nome) { campoNome.focus(); return; }
    if (!telefoneValido(fone)) { campoFone.focus(); return; }
    if (!aceitou) { campoConsent.focus(); return; }

    enviando = true;
    botao.disabled = true;
    var rotuloBotao = botao.textContent;
    botao.textContent = 'Enviando…';

    var renda = rendaEscolhida();
    var source = sourceDo();

    /* O pacote de origem vem do módulo compartilhado: UTM, gclid, fbclid,
       referrer e página. É o que liga este lead à campanha que o trouxe.
       O referrer dele vale mais que o do documento: fica guardado na
       sessão, então sobrevive à navegação interna antes da conversão. */
    var pacote = (window.Saitama && window.Saitama.pacote)
      ? window.Saitama.pacote(source)
      : null;

    gravarLead({
      empreendimento: EMPREENDIMENTO,
      nome: nome,
      telefone: fone,
      renda: renda,
      momento: momentoDo(),
      planta: plantaDo(),
      referrer: (pacote && pacote.referrer) || referrerExterno(),
      origem: source,
      cta: ctaDo(),
      campanha: (pacote && pacote.campanha) || {},
      pagina: location.pathname,
      consentimento: true,
      site: campoIsca ? campoIsca.value : ''
    }).then(function (ok) {
      enviando = false;
      botao.disabled = false;
      botao.textContent = rotuloBotao;

      if (!ok) {
        /* Não marca concluiu: se a pessoa fechar agora, conta como
           abandono, que é o que de fato aconteceu. */
        mostrarPainel('erro');
        rastrear('lead_form_error', { source: source });
        return;
      }

      concluiu = true;
      mostrarPainel('ok');
      rastrear('lead_submit', { source: source, income_range: renda || 'nao-informado' });
      reportarConversao();
    });
  }

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    enviar();
  });

  rastrear('view_carrao');
})();
