/**
 * Análise de perfil — formulário de 6 etapas.
 *
 * Uma pergunta por tela. O ganho não é estético: cada tela pede uma decisão
 * só, o que reduz o abandono no celular em relação a um formulário longo
 * onde a pessoa vê 20 campos de uma vez e desiste antes do primeiro.
 *
 * Nada de framework. São ~200 linhas de estado simples: qual tela está
 * aberta e o que já foi respondido.
 */
(function () {
  'use strict';

  /* Ordem das telas. A contagem de etapas exclui a abertura, que não é
     pergunta — anunciar "etapa 1 de 8" com a primeira sendo só um botão
     faria o formulário parecer mais longo do que é. */
  var TELAS = [
    'abertura', 'renda', 'entrada', 'fgts', 'regiao',
    'momento', 'dados'
  ];

  var PRIMEIRA_PERGUNTA = 1;
  var TOTAL_ETAPAS = TELAS.length - PRIMEIRA_PERGUNTA;

  var respostas = {};
  var atual = 'abertura';
  var comecou = false;
  var enviando = false;

  var telas = {};
  var barra = document.querySelector('[data-barra]');
  var barraPreenchida = document.querySelector('[data-barra-preenchida]');
  var conta = document.querySelector('[data-conta]');
  var passoAtual = document.querySelector('[data-passo-atual]');
  var formulario = document.querySelector('[data-formulario]');

  TELAS.concat(['pronto', 'erro']).forEach(function (nome) {
    telas[nome] = document.querySelector('[data-tela="' + nome + '"]');
  });

  var totalNoHtml = document.querySelector('[data-passo-total]');
  if (totalNoHtml) totalNoHtml.textContent = String(TOTAL_ETAPAS);

  /* ------------------------------------------------------------------
     Navegação
  ------------------------------------------------------------------ */

  function mostrar(nome, comHistorico) {
    if (!telas[nome]) return;

    Object.keys(telas).forEach(function (chave) {
      var tela = telas[chave];
      if (!tela) return;
      tela.hidden = chave !== nome;
      tela.classList.toggle('tela--ativa', chave === nome);
    });

    atual = nome;
    atualizarProgresso(nome);

    /* O foco vai para o título da tela nova. Sem isso, quem usa leitor de
       tela continuaria ouvindo a pergunta anterior depois de responder. */
    var titulo = telas[nome].querySelector('h1, h2');
    if (titulo) {
      titulo.setAttribute('tabindex', '-1');
      titulo.focus({ preventScroll: true });
    }

    window.scrollTo(0, 0);

    if (comHistorico) {
      try {
        history.pushState({ tela: nome }, '', '#' + nome);
      } catch (e) {
        /* Sem history a navegação ainda funciona pelos botões. */
      }
    }
  }

  function atualizarProgresso(nome) {
    var indice = TELAS.indexOf(nome);
    var ehPergunta = indice >= PRIMEIRA_PERGUNTA;

    if (conta) conta.hidden = !ehPergunta;

    if (ehPergunta && passoAtual) {
      passoAtual.textContent = String(indice);
    }

    /* Na abertura a barra fica zerada; nas telas finais, cheia. */
    var pct = 0;
    if (nome === 'pronto' || nome === 'erro') pct = 100;
    else if (ehPergunta) pct = Math.round((indice / TOTAL_ETAPAS) * 100);

    if (barraPreenchida) barraPreenchida.style.width = pct + '%';
    if (barra) barra.setAttribute('aria-valuenow', String(pct));
  }

  function proxima() {
    var indice = TELAS.indexOf(atual);
    if (indice >= 0 && indice < TELAS.length - 1) {
      mostrar(TELAS[indice + 1], true);
    }
  }

  /* Voltar pelo botão do navegador é o gesto natural no celular. Sem isso,
     quem tenta corrigir a resposta anterior sai do site inteiro. */
  window.addEventListener('popstate', function (evento) {
    var destino = (evento.state && evento.state.tela) || 'abertura';
    if (telas[destino]) mostrar(destino, false);
  });

  /* ------------------------------------------------------------------
     Respostas
  ------------------------------------------------------------------ */

  function registrarInicio() {
    if (comecou) return;
    comecou = true;
    rastrear('simulation_started');
  }

  document.querySelectorAll('.tela[data-campo]').forEach(function (tela) {
    var campo = tela.getAttribute('data-campo');

    tela.querySelectorAll('.opcao').forEach(function (botao) {
      botao.addEventListener('click', function () {
        registrarInicio();

        tela.querySelectorAll('.opcao').forEach(function (outro) {
          outro.setAttribute('aria-checked', String(outro === botao));
        });

        respostas[campo] = botao.getAttribute('data-valor');
        rastrear('simulation_step_completed', { step: campo });

        /* Pequena pausa antes de avançar: sem ela a tela troca no mesmo
           instante do toque e a pessoa não vê o que acabou de marcar,
           ficando na dúvida se o clique pegou. */
        window.setTimeout(proxima, 180);
      });
    });
  });

  var botaoComecar = document.querySelector('[data-comecar]');
  if (botaoComecar) {
    botaoComecar.addEventListener('click', function () {
      registrarInicio();
      proxima();
    });
  }

  /* ------------------------------------------------------------------
     Etapa 7 — dados
  ------------------------------------------------------------------ */

  var campoTelefone = document.getElementById('telefone');
  if (campoTelefone) {
    campoTelefone.addEventListener('input', function () {
      campoTelefone.value = mascara(campoTelefone.value);
    });
  }

  /* DDDs reais da Anatel — a lista tem buracos (20, 23, 30, 36, 40, 50…)
     que "dois dígitos quaisquer" deixava passar. Espelha worker/campos.js:
     se um mudar, o outro precisa mudar junto. */
  var DDDS = ('11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,' +
    '37,38,41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,' +
    '69,71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,' +
    '98,99').split(',');

  /* Celular discável: 11 dígitos, DDD que existe e o 9 do assinante. O
     campo é o WhatsApp — fixo não recebe mensagem, e número truncado
     (chegou "55119727727") é lead que ninguém consegue atender. */
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

  function erro(campo, mensagem) {
    var alvo = document.querySelector('[data-erro-de="' + campo + '"]');
    var entrada = document.querySelector('[name="' + campo + '"]');

    if (alvo) {
      alvo.textContent = mensagem || '';
      alvo.hidden = !mensagem;
    }
    if (entrada && entrada.type !== 'checkbox') {
      entrada.setAttribute('aria-invalid', mensagem ? 'true' : 'false');
    }
  }

  if (formulario) {
    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      if (enviando) return;

      var nome = formulario.nome.value.trim();
      var telefone = formulario.telefone.value.replace(/\D/g, '');
      var aceite = formulario.consentimento.checked;

      erro('nome', '');
      erro('telefone', '');
      erro('consentimento', '');

      var falhou = false;

      if (nome.length < 2) {
        erro('nome', 'Como podemos te chamar?');
        falhou = true;
      }
      if (!telefoneValido(telefone)) {
        erro('telefone', 'Informe um celular com DDD, como (11) 98765-4321.');
        falhou = true;
      }
      if (!aceite) {
        erro('consentimento', 'Precisamos da sua autorização para entrar em contato.');
        falhou = true;
      }

      if (falhou) {
        var primeiro = formulario.querySelector('[aria-invalid="true"]');
        if (primeiro) primeiro.focus();
        return;
      }

      enviar({
        nome: nome,
        telefone: telefone,
        email: formulario.email.value.trim(),
        site: formulario.site.value,
        consentimento: true,
        renda: respostas.renda || null,
        entrada: respostas.entrada || null,
        fgts: respostas.fgts || null,
        regiao: respostas.regiao || null,
        momento: respostas.momento || null
      });
    });
  }

  /* As 4 faixas oficiais do Minha Casa Minha Vida — mesmas chaves de
     worker/config.js (RENDAS). 'acima-13000' está fora do teto do
     programa e 'nao-informado'/null não permite afirmar nada: nesses
     casos o bloco de elegibilidade fica oculto, sem inventar resposta. */
  var FAIXAS_MCMV = ['ate-3200', '3200-5000', '5000-9600', '9600-13000'];

  function enviar(dados) {
    enviando = true;
    var botao = formulario.querySelector('[data-enviar]');
    var rotulo = botao ? botao.textContent : '';

    if (botao) {
      botao.disabled = true;
      botao.textContent = 'Enviando...';
    }

    /* O pacote de origem vem do módulo compartilhado: UTM, gclid, fbclid,
       referrer e página. É o que liga este lead à campanha que o trouxe. */
    var origem = window.Saitama
      ? window.Saitama.pacote('simulacao')
      : { origem: 'simulacao', pagina: location.pathname, referrer: '', campanha: {} };

    fetch('/api/simulacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({}, dados, origem))
    })
      .then(function (resposta) {
        if (!resposta.ok) throw new Error('http ' + resposta.status);

        rastrear('simulation_completed', { score_enviado: true });
        rastrear('lead_generated', { tipo: 'simulacao' });

        var elegibilidade = telas.pronto.querySelector('[data-elegibilidade]');
        if (elegibilidade) {
          elegibilidade.hidden = FAIXAS_MCMV.indexOf(dados.renda) === -1;
        }

        /* replaceState, não pushState: depois de enviar, o botão voltar
           deve sair da página — não recarregar um formulário já enviado. */
        try {
          history.replaceState({ tela: 'pronto' }, '', '#pronto');
        } catch (e) { /* sem history, segue igual */ }

        mostrar('pronto', false);
      })
      .catch(function () {
        /* A pessoa PRECISA saber que não foi: este formulário é o fim do
           caminho, não há WhatsApp abrindo atrás para salvar o contato. */
        mostrar('erro', false);
      })
      .finally(function () {
        enviando = false;
        if (botao) {
          botao.disabled = false;
          botao.textContent = rotulo;
        }
      });
  }

  var botaoTentar = document.querySelector('[data-tentar]');
  if (botaoTentar) {
    botaoTentar.addEventListener('click', function () {
      mostrar('dados', false);
    });
  }

  /* ------------------------------------------------------------------
     Medição
  ------------------------------------------------------------------ */

  function rastrear(evento, dados) {
    if (window.Saitama) window.Saitama.rastrear(evento, dados);
  }

  /* ------------------------------------------------------------------
     Região vinda da home (/simulacao/?regiao=zona-norte)

     Os cards de região da home já são uma escolha. Pedir a mesma coisa de
     novo na etapa 4 seria fazer a pessoa repetir o que acabou de dizer —
     ela marca, mas fica com a impressão de que o site não prestou atenção.

     A etapa continua aparecendo, só que já respondida: dá para trocar,
     e ninguém fica preso a um clique dado por engano na home.
  ------------------------------------------------------------------ */
  (function preSelecionarRegiao() {
    var pedida = new URLSearchParams(location.search).get('regiao');
    if (!pedida) return;

    var tela = telas.regiao;
    if (!tela) return;

    /* Comparação em vez de seletor montado com o valor da URL: o parâmetro
       é público e pode vir com qualquer coisa dentro. Interpolar isso num
       querySelector faz o seletor lançar e derrubar o formulário inteiro —
       e CSS.escape não existe em todo navegador. Assim, valor inválido
       simplesmente não casa com nada. */
    var botoes = tela.querySelectorAll('.opcao');

    for (var i = 0; i < botoes.length; i++) {
      if (botoes[i].getAttribute('data-valor') === pedida) {
        respostas.regiao = pedida;
        botoes[i].setAttribute('aria-checked', 'true');
        return;
      }
    }
  })();

  /* Se a pessoa chegou por um link com #renda, respeita — mas só nas
     telas de pergunta, para ninguém cair direto em "pronto" sem enviar. */
  var inicial = (location.hash || '').replace('#', '');
  var comeco = TELAS.indexOf(inicial) > 0 ? inicial : 'abertura';

  mostrar(comeco, false);
  try {
    history.replaceState({ tela: comeco }, '', '#' + comeco);
  } catch (e) { /* segue sem histórico */ }

  rastrear('view_simulation');
})();
