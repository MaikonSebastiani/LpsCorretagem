/* =====================================================================
   SEBASTIANI IMÓVEIS — Casa à venda na Vila Ester

   Imóvel de revenda, anúncio único. Os CTAs vão DIRETO para o WhatsApp,
   como na LP de investidores (mesma marca, mesmo domínio): o layout
   aprovado pede "Falar no WhatsApp" e "Agendar uma visita", e não há
   equipe dividindo lead de um imóvel só.

   O que isso custa: o lead NÃO entra na tabela `leads` nem no CRM. Se
   um dia esta página receber campanha com volume, o caminho é o
   formulário das LPs de empreendimento (novo-mundo-carrao/assets/js/main.js)
   e acrescentar 'casa-vila-ester' em EMPREENDIMENTOS no worker/config.js.

   Sem JavaScript a página funciona: todo href já é um link de WhatsApp.
   ===================================================================== */
(function () {
  'use strict';

  var WHATSAPP = '5511953713310';

  /* Rótulo de conversão do Google Ads. Vazio = nenhuma conversão
     disparada. Criar uma ação PRÓPRIA quando houver campanha: "clicou
     no WhatsApp de um imóvel de revenda" não vale o mesmo que o lead
     gravado das LPs de lançamento. */
  var ADS_CONVERSAO = '';

  var PADRAO = 'Olá! Vi a casa à venda na Vila Ester e gostaria de mais informações.';

  function rastrear(evento, dados) {
    try {
      if (window.Saitama && window.Saitama.rastrear) {
        window.Saitama.rastrear(evento, dados);
        return;
      }
      if (typeof window.gtag === 'function') window.gtag('event', evento, dados || {});
    } catch (e) { /* medição nunca quebra a página */ }
  }

  function reportarConversao() {
    if (!ADS_CONVERSAO) return;
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', {
          send_to: ADS_CONVERSAO, value: 1.0, currency: 'BRL', transport_type: 'beacon'
        });
      }
    } catch (e) { /* idem */ }
  }

  /* ------------------------------------------------------------------
     Menu do celular
  ------------------------------------------------------------------ */
  var topo = document.querySelector('.topo');
  var toggle = topo && topo.querySelector('.menu-toggle');

  if (topo && toggle) {
    var fecharMenu = function () {
      topo.classList.remove('aberto');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menu');
    };

    toggle.addEventListener('click', function () {
      var aberto = topo.classList.toggle('aberto');
      toggle.setAttribute('aria-expanded', String(aberto));
      toggle.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });

    topo.querySelectorAll('.topo__nav a').forEach(function (a) {
      a.addEventListener('click', fecharMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && topo.classList.contains('aberto')) { fecharMenu(); toggle.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (topo.classList.contains('aberto') && !topo.contains(e.target)) fecharMenu();
    });
  }

  /* ------------------------------------------------------------------
     WhatsApp — mensagem pronta no href (na carga, não no clique, para
     "abrir em nova aba" também levar a mensagem). UTM nunca entra no
     texto; vai só para o GA4.
  ------------------------------------------------------------------ */
  document.querySelectorAll('.js-whatsapp').forEach(function (el) {
    var mensagem = el.getAttribute('data-message') || PADRAO;
    el.setAttribute('href', 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(mensagem));

    el.addEventListener('click', function () {
      rastrear('whatsapp_click', {
        source: el.getAttribute('data-source') || 'unknown',
        cta: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80)
      });
      reportarConversao();
    });
  });

  /* ------------------------------------------------------------------
     Antes e depois

     Só ambientes que têm as duas versões: a foto real e a ambientação
     com IA. Os arquivos saem de assets/images/comparar/, sempre em pares
     <nome>-antes-<largura> e <nome>-depois-<largura>. A ordem aqui é a
     das abas no HTML (data-par). [nome, rótulo, altura a 1200px, aviso]

     O aviso (opcional) aparece embaixo do comparador quando a ambientação
     mostra algo que é OBRA, não decoração. Sem ele, quem visita espera
     encontrar aquilo na casa.
  ------------------------------------------------------------------ */
  var BASE = '/casa-vila-ester/assets/images/comparar/';
  var PARES = [
    ['sala', 'Sala de estar', 675],
    /* Par mais fraco no alinhamento: a IA mudou a geometria (pôs uma
       janela na parede da esquerda). É a mesma ambientação do hero. */
    ['sala-escada', 'Sala e escada', 675,
      'Nesta ambientação a IA acrescentou uma janela na parede da esquerda. Na casa, essa parede não tem janela.'],
    ['copa', 'Copa', 675],
    ['copa-2', 'Copa e cozinha', 675],
    ['cozinha', 'Cozinha', 675],
    ['banheiro', 'Banheiro', 675],
    ['lavabo', 'Lavabo', 900],
    ['quarto', 'Dormitório', 675],
    ['lavanderia', 'Área de serviço', 900],
    ['quintal', 'Quintal', 675,
      'A churrasqueira desta ambientação é uma sugestão de projeto: ela não existe hoje no imóvel.'],
    ['garagem', 'Garagem', 675]
  ];

  var comparador = document.querySelector('.comparador');
  if (comparador) {
    var range = comparador.querySelector('.comparador__range');
    var jaMexeu = false;

    var posicionar = function () {
      comparador.style.setProperty('--pos', range.value + '%');
      if (!jaMexeu) {
        jaMexeu = true;
        rastrear('compare_drag', { room: PARES[atualPar][0] });
      }
    };
    range.addEventListener('input', posicionar);

    var LARGURAS = [480, 800, 1200];
    /* Igual ao sizes do HTML. Mudou lá, muda aqui e em LARGURA_SLOT. */
    var SIZES = '(max-width: 640px) 60vw, (max-width: 1160px) 100vw, 1120px';

    var srcsetDe = function (nome, versao, ext) {
      return LARGURAS.map(function (w) {
        return BASE + nome + '-' + versao + '-' + w + '.' + ext + ' ' + w + 'w';
      }).join(', ');
    };

    /* Caminho de reserva (só quando a pré-montagem falha): refaz a
       <picture> com srcset e deixa o navegador baixar. Depois da primeira
       troca a <picture> já não tem <source>, por isso ele é recriado. */
    var trocar = function (picture, nome, versao, altura) {
      while (picture.firstChild) picture.removeChild(picture.firstChild);
      var source = document.createElement('source');
      source.type = 'image/avif';
      source.sizes = SIZES;
      source.srcset = srcsetDe(nome, versao, 'avif');
      var img = document.createElement('img');
      img.alt = '';
      img.width = 1200;
      img.sizes = SIZES;
      picture.appendChild(source);
      picture.appendChild(img);
      img.srcset = srcsetDe(nome, versao, 'webp');
      img.src = BASE + nome + '-' + versao + '-800.webp';
      img.height = altura;
    };

    /* Pré-carregamento.

       Cada ambiente é montado de antemão como dois <img> fora da tela, já
       baixados e DECODIFICADOS. Na troca, esses elementos entram no lugar
       dos atuais — a imagem aparece no mesmo quadro, sem baixar nem
       decodificar de novo. (A versão anterior pré-baixava com new Image()
       e depois trocava o srcset: o arquivo vinha do cache, mas o celular
       decodificava o AVIF uma segunda vez, e era aí que estava a demora.)

       A pré-carga começa assim que a página termina de carregar, em fila,
       um par de cada vez, sem esperar a pessoa chegar na seção.

       Formato e largura são os que o navegador escolheria pelo srcset: o
       formato vem do hero (se ele veio em AVIF, o navegador aceita AVIF) e
       a largura segue o mesmo cálculo do atributo sizes. */
    var LARGURA_SLOT = function () {
      var vw = window.innerWidth;
      return vw <= 640 ? vw * 0.6 : Math.min(vw, 1120);
    };

    var escolha = function () {
      var hero = document.querySelector('.hero__bg img');
      var ext = hero && /\.avif(?:$|\?)/.test(hero.currentSrc || '') ? 'avif' : 'webp';
      var alvo = LARGURA_SLOT() * (window.devicePixelRatio || 1);
      var largura = LARGURAS[LARGURAS.length - 1];
      for (var k = 0; k < LARGURAS.length; k++) {
        if (LARGURAS[k] >= alvo) { largura = LARGURAS[k]; break; }
      }
      return { largura: largura, ext: ext };
    };

    var montar = function (url) {
      var im = new Image();
      im.alt = '';
      im.decoding = 'async';
      im.src = url;
      var pronto = im.decode ? im.decode() : new Promise(function (ok, erro) {
        im.onload = ok; im.onerror = erro;
      });
      return pronto.then(function () { return im; }, function () { return null; });
    };

    var cache = {};

    var carregar = function (i) {
      if (cache[i]) return cache[i];
      var e = escolha();
      var nome = PARES[i][0];
      var base = BASE + nome + '-';
      var fim = '-' + e.largura + '.' + e.ext;
      cache[i] = Promise.all([montar(base + 'antes' + fim), montar(base + 'depois' + fim)]);
      return cache[i];
    };

    var preCarregarTodos = function () {
      var fila = Promise.resolve();
      PARES.slice(1).concat([PARES[0]]).forEach(function (par) {
        var i = PARES.indexOf(par);
        /* O primeiro entra também, por último: a foto dele já está no cache
           HTTP, mas o <img> da tela é descartado na primeira troca, e sem
           isto voltar para ele baixava e decodificava tudo de novo. */
        fila = fila.then(function () { return carregar(i); });
      });
    };

    var aoOcioso = function (fn) {
      if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 3000 });
      else setTimeout(fn, 1200);
    };
    if (document.readyState === 'complete') aoOcioso(preCarregarTodos);
    else window.addEventListener('load', function () { aoOcioso(preCarregarTodos); }, { once: true });

    /* Coloca o <img> pronto dentro da <picture> e tira o que estava lá.
       O <source> sai junto: com ele presente, o navegador reavaliaria o
       srcset e poderia baixar outro arquivo. Se a montagem falhou (rede),
       cai no caminho antigo, trocando o srcset. */
    var colocar = function (picture, im, nome, versao, altura) {
      if (!im) return trocar(picture, nome, versao, altura);
      im.width = 1200;
      im.height = altura;
      /* O <img> original do HTML tem srcset: se o <source> saísse antes
         dele, o navegador reavaliaria e baixaria o WebP à toa. Esvaziar
         o srcset primeiro evita isso. Os <img> do cache não têm srcset. */
      var velho = picture.querySelector('img');
      if (velho && velho.hasAttribute('srcset')) {
        velho.removeAttribute('srcset');
        velho.removeAttribute('src');
      }
      while (picture.firstChild) picture.removeChild(picture.firstChild);
      picture.appendChild(im);
    };

    var atualPar = 0;
    var pedido = 0;
    var abas = document.querySelectorAll('.aba');
    var avisoPar = document.querySelector('.comparador__aviso-par');

    var mostrarAviso = function (i) {
      if (!avisoPar) return;
      var texto = PARES[i][3] || '';
      avisoPar.textContent = texto;
      avisoPar.hidden = !texto;
    };

    /* Setas da faixa de miniaturas (desktop). Rolam uma "página" de
       miniaturas por clique e somem nas pontas. Só aparecem quando a
       faixa transborda e o aparelho tem mouse — no celular a faixa já
       rola com o dedo. */
    var faixa = document.querySelector('.abas');
    var setaAnt = document.querySelector('.abas-seta--ant');
    var setaProx = document.querySelector('.abas-seta--prox');
    var temMouse = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    var atualizarSetas = function () {
      if (!faixa || !setaAnt || !setaProx) return;
      var sobra = faixa.scrollWidth - faixa.clientWidth;
      var usar = temMouse && sobra > 2;
      setaAnt.hidden = !usar;
      setaProx.hidden = !usar;
      if (!usar) return;
      setaAnt.disabled = faixa.scrollLeft <= 2;
      setaProx.disabled = faixa.scrollLeft >= sobra - 2;
    };

    if (faixa && setaAnt && setaProx) {
      var rolar = function (sentido) {
        faixa.scrollBy({ left: sentido * faixa.clientWidth * 0.8, behavior: 'smooth' });
      };
      setaAnt.addEventListener('click', function () { rolar(-1); });
      setaProx.addEventListener('click', function () { rolar(1); });
      faixa.addEventListener('scroll', atualizarSetas, { passive: true });
      window.addEventListener('resize', atualizarSetas);
      atualizarSetas();
    }
    var aguardando = null;

    abas.forEach(function (aba) {
      aba.addEventListener('click', function () {
        var i = parseInt(aba.getAttribute('data-par'), 10) || 0;
        if (i === atualPar) return;
        atualPar = i;
        var par = PARES[i];
        var meu = ++pedido;

        abas.forEach(function (a) { a.setAttribute('aria-pressed', a === aba ? 'true' : 'false'); });
        aba.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });

        /* O loading só aparece se a troca passar de 120 ms: com o par já
           pronto, a troca é imediata e um piscar de spinner só atrapalharia. */
        clearTimeout(aguardando);
        aguardando = setTimeout(function () {
          if (meu === pedido) comparador.classList.add('carregando');
        }, 120);

        /* Troca só quando o par inteiro chegou, para a linha nunca dividir
           dois cômodos diferentes. Toques rápidos em sequência valem só o
           último (pedido). */
        carregar(i).then(function (imgs) {
          if (meu !== pedido) return;
          clearTimeout(aguardando);
          /* O mesmo elemento não pode estar em dois lugares: ao sair da
             tela ele é devolvido ao cache pela referência, e continua
             decodificado para quando a pessoa voltar a este ambiente. */
          colocar(comparador.querySelector('.comparador__depois'), imgs[1], par[0], 'depois', par[2]);
          colocar(comparador.querySelector('.comparador__antes'), imgs[0], par[0], 'antes', par[2]);
          comparador.style.aspectRatio = '1200 / ' + par[2];
          range.value = 50;
          comparador.style.setProperty('--pos', '50%');
          range.setAttribute('aria-label', 'Comparar antes e depois: ' + par[1] +
            '. Arraste para a esquerda para ver a ambientação, para a direita para ver a foto real.');
          mostrarAviso(i);
          comparador.classList.remove('carregando');
        });
        /* Medição fora do caminho da troca: o gtag processa o evento na
           hora, e no celular isso chegava a atrasar a imagem nova. */
        setTimeout(function () { rastrear('compare_room', { room: par[0] }); }, 400);
      });
    });
  }

  finalizar();

  /* ------------------------------------------------------------------
     Engajamento — uma vez por sessão cada.
  ------------------------------------------------------------------ */
  function finalizar() {
    var vistas = {};
    if ('IntersectionObserver' in window) {
      var alvos = { fotos: 'antes_depois', localizacao: 'localizacao', contato: 'cta_final' };
      var obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          var nome = alvos[en.target.id];
          if (!en.isIntersecting || !nome || vistas[nome]) return;
          vistas[nome] = true;
          rastrear('section_view', { section: nome });
        });
      }, { threshold: .35 });
      Object.keys(alvos).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) obs.observe(el);
      });
    }

    document.querySelectorAll('.faq').forEach(function (faq) {
      faq.addEventListener('toggle', function () {
        if (!faq.open) return;
        var s = faq.querySelector('summary');
        rastrear('faq_open', { question: s ? s.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) : '' });
      });
    });

    rastrear('view_casa_vila_ester');
  }
})();
