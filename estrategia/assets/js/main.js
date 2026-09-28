/* =====================================================================
   SEBASTIANI | ESTRATÉGIA IMOBILIÁRIA

   Sem framework e sem build: o arquivo é servido como está.

   O formulário de cenário é o ÚNICO caminho de conversão medido desta
   página. Ele NÃO abre o WhatsApp ao final — se a gravação falhar em
   silêncio, o lead se perde de vez. Por isso o cliente espera a resposta
   do servidor e mostra a tela de erro quando ela não vem, nunca uma tela
   de sucesso otimista.

   As listas de valores espelham worker/config.js (OBJETIVOS, RENDAS,
   ENTRADAS, MOMENTOS, FGTS, REGIOES). A autoridade é o servidor: ele
   recusa qualquer valor que não esteja lá. Mexer numa lista aqui sem
   mexer lá faz o lead entrar com o campo vazio, sem erro nenhum.
   ===================================================================== */
(function () {
  'use strict';

  var ENDPOINT = '/api/simulacao';

  /* Cabe em `texto(dados.origem, 40)` no worker. Se crescer além disso, o
     campo chega cortado no banco e a atribuição fica errada em silêncio. */
  var ORIGEM = 'estrategia';

  /* PENDENTE: esta LP precisa da PRÓPRIA ação de conversão no Google Ads,
     no formato 'AW-XXXXXXXXX/XXXXXXXXXXXX'. Enquanto o rótulo não for
     criado, fica vazio e nenhuma conversão é disparada — é melhor não
     reportar nada do que somar este lead no relatório de outra campanha,
     onde ele significaria outra coisa e o Smart Bidding passaria a mirar
     no alvo errado. */
  var ADS_CONVERSAO = '';

  var WHATSAPP = '5511953713310';

  function rastrear(evento, dados) {
    if (window.Saitama) window.Saitama.rastrear(evento, dados);
  }

  /* ------------------------------------------------------------------
     Cabeçalho: transparente sobre o hero, sólido ao rolar
  ------------------------------------------------------------------ */

  var topo = document.querySelector('[data-topo]');

  if (topo) {
    var rolado = false;

    var conferirRolagem = function () {
      var passou = window.scrollY > 24;
      if (passou === rolado) return;
      rolado = passou;
      if (passou) topo.setAttribute('data-rolado', '');
      else topo.removeAttribute('data-rolado');
    };

    window.addEventListener('scroll', conferirRolagem, { passive: true });
    conferirRolagem();
  }

  /* ------------------------------------------------------------------
     Menu do celular
  ------------------------------------------------------------------ */

  var alternador = document.querySelector('.menu-toggle');
  var menu = document.getElementById('menu-principal');

  function fecharMenu() {
    if (!alternador || !menu) return;
    menu.removeAttribute('data-aberto');
    alternador.setAttribute('aria-expanded', 'false');
    alternador.setAttribute('aria-label', 'Abrir menu');
  }

  if (alternador && menu) {
    alternador.addEventListener('click', function () {
      if (menu.getAttribute('data-aberto') === 'sim') {
        fecharMenu();
        return;
      }
      menu.setAttribute('data-aberto', 'sim');
      alternador.setAttribute('aria-expanded', 'true');
      alternador.setAttribute('aria-label', 'Fechar menu');
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', fecharMenu);
    });

    document.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape') fecharMenu();
    });
  }

  /* ------------------------------------------------------------------
     Diálogos

     O <dialog> nativo entrega Esc, prisão de foco e inércia do fundo. O
     que falta é fechar no clique fora — e é aí que mora a armadilha
     abaixo.
  ------------------------------------------------------------------ */

  /* O que rodar quando cada diálogo fechar, por id. Preenchido mais
     abaixo (o formulário registra o evento de abandono aqui) e lido pelo
     observador, que só existe depois — por isso um objeto mutável em vez
     de passar a função como argumento. */
  var aoFechar = {};

  /**
   * Trava a rolagem da página enquanto houver diálogo aberto.
   *
   * Chamada pelo observador de `open`, e não pelo evento 'close' do
   * <dialog>: esse evento NÃO chega em todo navegador — não chega no
   * embutido usado para testar esta página, e o mesmo já tinha sido
   * descoberto na home (ver minha-casa-minha-vida/assets/js/main.js).
   * Quando ele falta, a classe fica grudada no <html> e a página inteira
   * deixa de rolar depois que a pessoa fecha o modal.
   */
  function sincronizarTrava() {
    var algumAberto = !!document.querySelector('dialog[open]');
    document.documentElement.classList.toggle('modal-aberto', algumAberto);
  }

  function abrirDialogo(dialogo) {
    if (!dialogo || dialogo.open) return false;
    try {
      dialogo.showModal();
    } catch (e) {
      return false;   // navegador sem <dialog>: o link simplesmente não abre
    }
    sincronizarTrava();
    return true;
  }

  document.querySelectorAll('dialog').forEach(function (dialogo) {
    var fechar = dialogo.querySelector('[data-fechar]');
    if (fechar) {
      fechar.addEventListener('click', function () { dialogo.close(); });
    }

    /* Clique no backdrop fecha. A guarda `evento.target !== dialogo` é
       obrigatória: a ativação por TECLADO (Enter num botão focado dentro
       do diálogo) chega como clique com clientX/clientY = 0, que cai fora
       da caixa e fecharia o diálogo justamente para quem navega por
       teclado. */
    dialogo.addEventListener('click', function (evento) {
      if (evento.target !== dialogo) return;

      var caixa = dialogo.getBoundingClientRect();
      var dentro = evento.clientX >= caixa.left && evento.clientX <= caixa.right &&
                   evento.clientY >= caixa.top && evento.clientY <= caixa.bottom;
      if (!dentro) dialogo.close();
    });

    /* Observa o ATRIBUTO `open` em vez de escutar o evento 'close'. Pega
       do mesmo jeito o X, o Esc (que fecha sem passar por código nosso) e
       um close() chamado daqui — e funciona onde o evento não chega.

       As callbacks são entregues em microtask, no fim da tarefa atual.
       Isso é o que faz a troca de um modal para outro não piscar: no
       `fecha um, abre o outro` do handoff, quando a callback roda o
       segundo diálogo JÁ está aberto, então a trava nunca é solta no
       meio do caminho. */
    new MutationObserver(function () {
      sincronizarTrava();
      if (!dialogo.open && typeof aoFechar[dialogo.id] === 'function') {
        aoFechar[dialogo.id]();
      }
    }).observe(dialogo, { attributes: true, attributeFilter: ['open'] });
  });

  /* Modais das três estratégias. */
  document.querySelectorAll('[data-modal]').forEach(function (botao) {
    botao.addEventListener('click', function () {
      var id = botao.getAttribute('data-modal');
      var dialogo = document.getElementById(id);
      if (abrirDialogo(dialogo)) rastrear('strategy_modal_open', { strategy: id });
    });
  });

  /* ------------------------------------------------------------------
     Cliques de WhatsApp

     O href continua no HTML como rede de segurança para quem estiver sem
     JavaScript; aqui só medimos. UTM e gclid NUNCA entram na mensagem —
     vão só para o GA4, junto do evento.
  ------------------------------------------------------------------ */

  var MENSAGEM = 'Olá! Quero fazer uma análise do meu cenário e entender ' +
    'qual estratégia de compra faz sentido para mim.';

  document.querySelectorAll('.js-whatsapp').forEach(function (botao) {
    botao.setAttribute('href',
      'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(MENSAGEM));

    botao.addEventListener('click', function () {
      rastrear('whatsapp_click', {
        source: botao.getAttribute('data-source') || 'desconhecida',
        cta: (botao.textContent || '').trim().slice(0, 80)
      });
    });
  });

  /* ------------------------------------------------------------------
     Formulário de cenário
  ------------------------------------------------------------------ */

  var modalCenario = document.getElementById('modal-cenario');
  var formulario = document.querySelector('[data-quiz]');

  /* Quatro etapas. Cada [data-campo] é UMA pergunta; algumas etapas têm
     duas, porque o que trava o preenchimento no celular é o TAMANHO
     APARENTE do formulário, não o número de cliques. */
  var TELAS = ['objetivo', 'financeiro', 'momento', 'contato'];
  var ULTIMA = TELAS[TELAS.length - 1];

  if (formulario && modalCenario) {
    var telas = {};
    TELAS.concat(['pronto', 'erro']).forEach(function (nome) {
      telas[nome] = formulario.querySelector('[data-tela="' + nome + '"]');
    });

    var trilha = formulario.querySelectorAll('[data-trilha]');
    var anuncio = formulario.querySelector('[data-anuncio]');
    var botaoVoltar = formulario.querySelector('[data-voltar]');
    var botaoContinuar = formulario.querySelector('[data-continuar]');
    var rodapeQuiz = formulario.querySelector('.quiz__rodape');

    var respostas = {};
    var atual = TELAS[0];
    var comecou = false;
    var enviando = false;
    var enviado = false;

    /* --------------------------------------------------------------
       Navegação entre as telas
    -------------------------------------------------------------- */

    function mostrar(nome) {
      Object.keys(telas).forEach(function (chave) {
        if (telas[chave]) telas[chave].hidden = chave !== nome;
      });

      atual = nome;

      var indice = TELAS.indexOf(nome);
      var ehPergunta = indice >= 0;

      for (var i = 0; i < trilha.length; i++) {
        var estado = 'vazio';
        if (!ehPergunta) estado = 'feito';
        else if (i < indice) estado = 'feito';
        else if (i === indice) estado = 'atual';
        trilha[i].setAttribute('data-estado', estado);
      }

      /* Nas telas finais o rodapé inteiro some; na última pergunta some
         só o "Continuar", porque lá quem avança é o botão de enviar. */
      if (rodapeQuiz) rodapeQuiz.hidden = !ehPergunta;
      if (botaoVoltar) botaoVoltar.hidden = !ehPergunta || indice === 0;
      if (botaoContinuar) botaoContinuar.hidden = nome === ULTIMA;

      /* Anúncio em aria-live em vez de mover o foco: roubar o foco a cada
         resposta faria o leitor de tela recomeçar a leitura do zero. */
      if (anuncio && ehPergunta) {
        var rotulo = telas[nome].querySelector('.quiz__rotulo');
        anuncio.textContent = 'Etapa ' + (indice + 1) + ' de ' + TELAS.length +
          (rotulo ? '. ' + rotulo.textContent : '');
      }

      /* O modal rola: a etapa nova começaria na altura em que a anterior
         parou, ou seja, no meio da segunda pergunta. */
      if (modalCenario.scrollTop) modalCenario.scrollTop = 0;
    }

    function erro(campo, mensagem) {
      var alvo = formulario.querySelector('[data-erro-de="' + campo + '"]');
      var entrada = formulario.querySelector('[name="' + campo + '"]');

      if (alvo) {
        alvo.textContent = mensagem || '';
        alvo.hidden = !mensagem;
      }
      if (entrada && entrada.type !== 'checkbox') {
        entrada.setAttribute('aria-invalid', mensagem ? 'true' : 'false');
      }
    }

    /* --------------------------------------------------------------
       As opções
    -------------------------------------------------------------- */

    formulario.querySelectorAll('[data-campo]').forEach(function (grupo) {
      var campo = grupo.getAttribute('data-campo');
      var opcoes = grupo.querySelectorAll('.opcao');

      opcoes.forEach(function (botao) {
        botao.addEventListener('click', function () {
          if (!comecou) {
            comecou = true;
            rastrear('lead_form_started', { form: 'cenario' });
          }

          opcoes.forEach(function (outro) {
            outro.setAttribute('aria-checked', String(outro === botao));
          });

          respostas[campo] = botao.getAttribute('data-valor');
          rastrear('lead_form_step', { step: campo });

          /* Some com o erro no instante da escolha — não precisa esperar
             o próximo clique em "Continuar" para o aviso sumir. */
          erro(campo, '');
        });
      });
    });

    /* Marcar uma opção NÃO avança de tela: com duas perguntas por etapa o
       avanço automático tiraria a segunda da frente da pessoa antes de
       ela responder. Quem avança é o "Continuar".

       Toda pergunta é obrigatória. As saídas honestas ("Ainda estou
       avaliando", "Não sei") continuam nas opções por transparência, mas
       precisam ser clicadas. */
    if (botaoContinuar) {
      botaoContinuar.addEventListener('click', function () {
        var tela = telas[atual];
        var grupos = tela ? tela.querySelectorAll('[data-campo]') : [];
        var faltando = null;

        grupos.forEach(function (grupo) {
          var campo = grupo.getAttribute('data-campo');
          var respondida = !!respostas[campo];
          erro(campo, respondida ? '' : 'Escolha uma opção para continuar.');
          if (!respondida && !faltando) faltando = grupo;
        });

        if (faltando) {
          rastrear('lead_form_error', { motivo: 'validacao' });
          var opcao = faltando.querySelector('.opcao');
          if (opcao) opcao.focus({ preventScroll: true });
          return;
        }

        var indice = TELAS.indexOf(atual);
        if (indice >= 0 && indice < TELAS.length - 1) mostrar(TELAS[indice + 1]);

        var primeira = telas[atual] && telas[atual].querySelector('.opcao, input');
        if (primeira) primeira.focus({ preventScroll: true });
      });
    }

    if (botaoVoltar) {
      botaoVoltar.addEventListener('click', function () {
        var indice = TELAS.indexOf(atual);
        if (indice > 0) mostrar(TELAS[indice - 1]);
      });
    }

    /* --------------------------------------------------------------
       Telefone
    -------------------------------------------------------------- */

    /* DDDs reais da Anatel — a lista tem buracos (20, 23, 30, 36, 40, 50…)
       que "dois dígitos quaisquer" deixava passar. Espelha
       worker/campos.js: se um mudar, o outro precisa mudar junto. */
    var DDDS = ('11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,' +
      '37,38,41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,' +
      '69,71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,' +
      '98,99').split(',');

    /* Celular discável: 11 dígitos, DDD que existe e o 9 do assinante. O
       campo é o WhatsApp — fixo não recebe mensagem, e número truncado é
       lead que ninguém consegue atender. */
    function telefoneValido(digitos) {
      var d = digitos;
      if (d.length === 13 && d.slice(0, 2) === '55') d = d.slice(2);
      return d.length === 11 && DDDS.indexOf(d.slice(0, 2)) !== -1 && d[2] === '9';
    }

    /** (11) 99999-9999 — só formatação; quem valida de verdade é o servidor. */
    function mascara(valor) {
      var d = valor.replace(/\D/g, '').slice(0, 11);
      if (d.length <= 2) return d;
      if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
      if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
      return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    }

    var campoTelefone = formulario.querySelector('[name="telefone"]');
    if (campoTelefone) {
      campoTelefone.addEventListener('input', function () {
        campoTelefone.value = mascara(campoTelefone.value);
      });
    }

    /* --------------------------------------------------------------
       Envio
    -------------------------------------------------------------- */

    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      if (enviando) return;

      var nome = formulario.nome.value.trim();
      var fone = formulario.telefone.value.replace(/\D/g, '');
      var aceite = formulario.consentimento.checked;

      erro('nome', '');
      erro('telefone', '');
      erro('consentimento', '');

      var falhou = false;

      if (nome.length < 2) {
        erro('nome', 'Como posso te chamar?');
        falhou = true;
      }
      if (!telefoneValido(fone)) {
        erro('telefone', 'Informe um celular com DDD, como (11) 98765-4321.');
        falhou = true;
      }
      if (!aceite) {
        erro('consentimento', 'Preciso da sua autorização para entrar em contato.');
        falhou = true;
      }

      if (falhou) {
        rastrear('lead_form_error', { motivo: 'validacao' });
        var primeiro = formulario.querySelector('[aria-invalid="true"]') ||
                       formulario.consentimento;
        if (primeiro) primeiro.focus();
        return;
      }

      enviar({
        nome: nome,
        telefone: fone,
        site: formulario.site.value,
        consentimento: true,
        objetivo: respostas.objetivo || null,
        renda: respostas.renda || null,
        entrada: respostas.entrada || null,
        momento: respostas.momento || null,
        fgts: respostas.fgts || null,
        /* String vazia é a opção "prefiro falar na conversa". Vai como
           null para o COALESCE do servidor não sobrescrever uma região
           que a pessoa já tenha informado em outro formulário. */
        regiao: formulario.regiao.value || null
      });
    });

    function enviar(dados) {
      enviando = true;

      var botao = formulario.querySelector('[data-enviar]');
      var rotulo = botao ? botao.textContent : '';
      if (botao) {
        botao.disabled = true;
        botao.textContent = 'Enviando...';
      }

      /* O pacote de origem vem do módulo compartilhado: UTM, gclid,
         fbclid, referrer e página. É o que liga este lead à campanha que
         o trouxe. `cta` não vem do pacote — é acrescentado aqui. */
      var origem = window.Saitama
        ? window.Saitama.pacote(ORIGEM)
        : { origem: ORIGEM, pagina: location.pathname, referrer: '', campanha: {} };

      origem.cta = 'analise-de-cenario';

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({}, dados, origem))
      })
        .then(function (resposta) {
          if (!resposta.ok) throw new Error('http ' + resposta.status);

          enviado = true;
          rastrear('lead_submit', { form: 'cenario' });
          rastrear('lead_generated', { tipo: 'estrategia' });
          converter();

          mostrar('pronto');
        })
        .catch(function () {
          rastrear('lead_form_error', { motivo: 'rede' });
          mostrar('erro');
        })
        .finally(function () {
          enviando = false;
          if (botao) {
            botao.disabled = false;
            botao.textContent = rotulo;
          }
        });
    }

    var botaoTentar = formulario.querySelector('[data-tentar]');
    if (botaoTentar) {
      botaoTentar.addEventListener('click', function () { mostrar(ULTIMA); });
    }

    /**
     * Conversão do Google Ads. Dispara UMA vez por lead: contar o mesmo
     * lead duas vezes distorce o custo por conversão e o Smart Bidding
     * passa a mirar no alvo errado.
     */
    var disparou = false;
    function converter() {
      if (disparou || !ADS_CONVERSAO || typeof window.gtag !== 'function') return;
      disparou = true;
      window.gtag('event', 'conversion', { send_to: ADS_CONVERSAO });
    }

    /* --------------------------------------------------------------
       Abertura do modal

       Todos os CTAs da página chegam aqui. O modal é o MESMO DOM sempre,
       então o que já foi respondido sobrevive a fechar e reabrir — quem
       desiste na etapa 3 e volta não recomeça do zero.
    -------------------------------------------------------------- */

    document.querySelectorAll('.js-cenario').forEach(function (botao) {
      botao.addEventListener('click', function () {
        fecharMenu();

        /* Fecha o modal de estratégia antes de abrir este: dois diálogos
           empilhados deixam o Esc fechando o de cima e a pessoa presa no
           de baixo, sem entender o que aconteceu. */
        var aberto = document.querySelector('dialog[open]');
        if (aberto && aberto !== modalCenario) aberto.close();

        rastrear('lead_form_shown', {
          source: botao.getAttribute('data-source') || 'desconhecida'
        });

        if (!abrirDialogo(modalCenario)) return;

        var primeira = telas[atual] && telas[atual].querySelector('.opcao, input, button');
        if (primeira) primeira.focus({ preventScroll: true });
      });
    });

    /* Fechou no meio do preenchimento sem ter enviado: é abandono, e é o
       número que diz em qual etapa a página perde gente.

       Registrado no mapa em vez de num listener de 'close' pelo mesmo
       motivo da trava de rolagem — ver sincronizarTrava(). */
    aoFechar[modalCenario.id] = function () {
      if (!comecou || enviado) return;
      rastrear('lead_form_abandoned', { step: atual });
    };

    mostrar(TELAS[0]);
  }

  /* ------------------------------------------------------------------
     Eventos de rolagem e de FAQ

     As chaves do observador são IDS DE SEÇÃO. Se um id mudar no HTML, o
     evento correspondente para de disparar em silêncio.

     'casos' não está aqui de propósito: a seção nasce com `hidden` e só
     entra quando houver caso real (ver o comentário no HTML).
  ------------------------------------------------------------------ */

  var SECOES = {
    metodo: 'metodo',
    estrategias: 'estrategias',
    'como-funciona': 'processo',
    contato: 'cta_final'
  };
  var vistas = {};

  if ('IntersectionObserver' in window) {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        var chave = SECOES[entrada.target.id];
        if (!entrada.isIntersecting || !chave || vistas[chave]) return;
        vistas[chave] = true;
        rastrear('section_view', { section: chave });
      });
    }, { threshold: .35 });

    Object.keys(SECOES).forEach(function (id) {
      var alvo = document.getElementById(id);
      if (alvo) observador.observe(alvo);
    });
  }

  document.querySelectorAll('.faq').forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      var titulo = item.querySelector('summary');
      rastrear('faq_open', { question: titulo ? titulo.textContent.trim() : '' });
    });
  });

  rastrear('view_estrategia');
})();
