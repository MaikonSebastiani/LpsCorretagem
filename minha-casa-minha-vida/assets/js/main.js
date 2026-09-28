/* =====================================================================
   GRUPO SAITAMA — home / Minha Casa Minha Vida

   Sem framework e sem build: o arquivo é servido como está. São ~250
   linhas de estado simples — qual tela do formulário está aberta e o que
   já foi respondido.

   O formulário é o ÚNICO caminho de conversão desta página. Ele não abre
   o WhatsApp: se a gravação falhar em silêncio, o lead se perde de vez.
   Por isso o cliente espera a resposta do servidor e mostra a tela de
   erro quando ela não vem — nunca uma tela de sucesso otimista.

   As listas de valores espelham worker/config.js (RENDAS, ENTRADAS,
   REGIOES, MOMENTOS). A autoridade é o servidor: ele recusa qualquer
   valor que não esteja lá.
   ===================================================================== */
(function () {
  'use strict';

  var ENDPOINT = '/api/simulacao';

  /* Cabe em `texto(dados.origem, 40)` no worker. Se crescer além disso, o
     campo chega cortado no banco e a atribuição fica errada em silêncio. */
  var ORIGEM = 'minha-casa-minha-vida';

  /* Rótulo próprio desta LP — "Saitama | Solicitação de opções | Site
     conversion page", cadastrado em 14/09/2026. Dispara em converter(),
     chamado só depois do POST em /api/simulacao voltar 204: é o lead
     gravado que conta como conversão, não o clique no botão. */
  var ADS_CONVERSAO = 'AW-18388777321/0EzSCKr2xPccEOnyucBE';

  /* TRÊS etapas, não cinco. As perguntas continuam as mesmas quatro — o
     que mudou é que elas vêm agrupadas duas a duas, porque o que trava o
     preenchimento é o TAMANHO APARENTE do formulário, não o número de
     cliques. Cada pergunta é um [data-campo] dentro da etapa. */
  var TELAS = ['perfil', 'preferencias', 'contato'];

  /* As 4 faixas oficiais do programa. 'acima-13000' está fora do teto e
     'nao-informado' não permite afirmar nada — nesses casos a tela final
     não promete enquadramento. */
  var FAIXAS_MCMV = ['ate-3200', '3200-5000', '5000-9600', '9600-13000'];

  var formulario = document.querySelector('[data-quiz]');
  if (!formulario) return;

  var telas = {};
  ['pronto', 'erro'].concat(TELAS).forEach(function (nome) {
    telas[nome] = formulario.querySelector('[data-tela="' + nome + '"]');
  });

  var trilha = formulario.querySelectorAll('[data-trilha]');
  var numero = formulario.querySelector('[data-passo-numero]');
  var passoAtual = formulario.querySelector('[data-passo-atual]');
  var anuncio = formulario.querySelector('[data-anuncio]');
  var botaoVoltar = formulario.querySelector('[data-voltar]');
  var rodapeQuiz = formulario.querySelector('.quiz__rodape');

  var respostas = {};
  var atual = 'perfil';
  var comecou = false;
  var enviando = false;

  /* ------------------------------------------------------------------
     Medição
  ------------------------------------------------------------------ */

  function rastrear(evento, dados) {
    if (window.Saitama) window.Saitama.rastrear(evento, dados);
  }

  /* ------------------------------------------------------------------
     Navegação entre as telas
  ------------------------------------------------------------------ */

  function mostrar(nome) {
    Object.keys(telas).forEach(function (chave) {
      if (telas[chave]) telas[chave].hidden = chave !== nome;
    });

    atual = nome;

    var indice = TELAS.indexOf(nome);
    var ehPergunta = indice >= 0;

    var passo = String(ehPergunta ? indice + 1 : TELAS.length);
    if (numero) numero.textContent = passo;
    if (passoAtual) passoAtual.textContent = passo;

    for (var i = 0; i < trilha.length; i++) {
      var estado = 'vazio';
      if (!ehPergunta) estado = 'feito';
      else if (i < indice) estado = 'feito';
      else if (i === indice) estado = 'atual';
      trilha[i].setAttribute('data-estado', estado);
    }

    if (botaoVoltar) botaoVoltar.hidden = !ehPergunta || indice === 0;
    if (rodapeQuiz) rodapeQuiz.hidden = !ehPergunta;

    /* Anúncio em aria-live em vez de mover o foco: o formulário está no
       meio da página, e roubar o foco a cada resposta faria o leitor de
       tela recomeçar a leitura do zero. */
    if (anuncio && ehPergunta) {
      var rotulo = telas[nome].querySelector('.quiz__rotulo');
      anuncio.textContent = 'Etapa ' + (indice + 1) + ' de ' + TELAS.length +
        (rotulo ? '. ' + rotulo.textContent : '');
    }
  }

  function proxima() {
    var indice = TELAS.indexOf(atual);
    if (indice >= 0 && indice < TELAS.length - 1) mostrar(TELAS[indice + 1]);
  }

  if (botaoVoltar) {
    botaoVoltar.addEventListener('click', function () {
      var indice = TELAS.indexOf(atual);
      if (indice > 0) mostrar(TELAS[indice - 1]);
    });
  }

  /* ------------------------------------------------------------------
     As opções
  ------------------------------------------------------------------ */

  /* Cada [data-campo] é UMA pergunta; a etapa tem duas. Marcar uma opção
     não avança mais de tela — avançar é o "Continuar", porque com duas
     perguntas por etapa o avanço automático tiraria a segunda da frente
     da pessoa antes de ela responder. */
  formulario.querySelectorAll('[data-campo]').forEach(function (grupo) {
    var campo = grupo.getAttribute('data-campo');
    var opcoes = grupo.querySelectorAll('.opcao');

    opcoes.forEach(function (botao) {
      botao.addEventListener('click', function () {
        if (!comecou) {
          comecou = true;
          rastrear('lead_form_started', { form: 'perfil' });
        }

        opcoes.forEach(function (outro) {
          outro.setAttribute('aria-checked', String(outro === botao));
        });

        respostas[campo] = botao.getAttribute('data-valor');
        rastrear('lead_form_step', { step: campo });

        /* Some com o erro no instante em que a pessoa escolhe algo — não
           precisa esperar o próximo clique em "Continuar" para o aviso
           de campo obrigatório sumir. */
        erro(campo, '');
      });
    });
  });

  /* Todo campo é obrigatório (decisão de 14/09/2026, revertendo a regra
     anterior — "nunca bloquear o lead" — a pedido). As saídas honestas
     ("Prefiro não dizer", "Ainda não sei") continuam nas opções por
     transparência, mas agora precisam ser clicadas: não dá mais para
     avançar sem escolher NENHUMA opção da etapa. */
  formulario.querySelectorAll('[data-continuar]').forEach(function (botao) {
    botao.addEventListener('click', function () {
      var tela = telas[atual];
      var grupos = tela ? tela.querySelectorAll('[data-campo]') : [];
      var primeiroFaltando = null;

      grupos.forEach(function (grupo) {
        var campo = grupo.getAttribute('data-campo');
        var respondida = !!respostas[campo];
        erro(campo, respondida ? '' : 'Escolha uma opção para continuar.');
        if (!respondida && !primeiroFaltando) primeiroFaltando = grupo;
      });

      if (primeiroFaltando) {
        rastrear('lead_form_error', { motivo: 'validacao' });
        var opcaoFaltando = primeiroFaltando.querySelector('.opcao');
        if (opcaoFaltando) opcaoFaltando.focus({ preventScroll: true });
        return;
      }

      proxima();

      /* No modal (celular) a etapa nova começa rolada para onde parou a
         anterior; sem isto a pessoa cai no meio da segunda pergunta. */
      var cartao = formulario;
      if (cartao && cartao.scrollTop) cartao.scrollTop = 0;

      var primeira = telas[atual] && telas[atual].querySelector('.opcao, input');
      if (primeira) primeira.focus({ preventScroll: true });
    });
  });

  /* ------------------------------------------------------------------
     Telefone
  ------------------------------------------------------------------ */

  /* DDDs reais da Anatel — a lista tem buracos (20, 23, 30, 36, 40, 50…)
     que "dois dígitos quaisquer" deixava passar. Espelha worker/campos.js:
     se um mudar, o outro precisa mudar junto. */
  var DDDS = ('11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,' +
    '37,38,41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,' +
    '69,71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,' +
    '98,99').split(',');

  /* Celular discável: 11 dígitos, DDD que existe e o 9 do assinante. O
     campo é o WhatsApp — fixo não recebe mensagem, e número truncado
     (já chegou "55119727727") é lead que ninguém consegue atender. */
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

  /* ------------------------------------------------------------------
     Envio
  ------------------------------------------------------------------ */

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
      erro('nome', 'Como podemos te chamar?');
      falhou = true;
    }
    if (!telefoneValido(fone)) {
      erro('telefone', 'Informe um celular com DDD, como (11) 98765-4321.');
      falhou = true;
    }
    if (!aceite) {
      erro('consentimento', 'Precisamos da sua autorização para entrar em contato.');
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
      renda: respostas.renda || null,
      entrada: respostas.entrada || null,
      regiao: respostas.regiao || null,
      momento: respostas.momento || null
    });
  });

  function enviar(dados) {
    enviando = true;

    var botao = formulario.querySelector('[data-enviar]');
    var rotulo = botao ? botao.innerHTML : '';
    if (botao) {
      botao.disabled = true;
      botao.textContent = 'Enviando...';
    }

    /* O pacote de origem vem do módulo compartilhado: UTM, gclid, fbclid,
       referrer e página. É o que liga este lead à campanha que o trouxe.
       `cta` não vem do pacote — é acrescentado aqui. */
    var origem = window.Saitama
      ? window.Saitama.pacote(ORIGEM)
      : { origem: ORIGEM, pagina: location.pathname, referrer: '', campanha: {} };

    origem.cta = 'quiz-perfil';

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({}, dados, origem))
    })
      .then(function (resposta) {
        if (!resposta.ok) throw new Error('http ' + resposta.status);

        rastrear('lead_submit', { form: 'perfil' });
        rastrear('lead_generated', { tipo: 'minha-casa-minha-vida' });
        converter();

        /* A mensagem final não promete enquadramento a quem está fora das
           faixas do programa nem a quem preferiu não dizer a renda —
           dizer "você se enquadra" sem saber é promessa que o banco
           desmente depois. */
        var mensagem = formulario.querySelector('[data-mensagem-pronto]');
        if (mensagem && FAIXAS_MCMV.indexOf(dados.renda) === -1) {
          mensagem.textContent = 'Vamos comparar os lançamentos disponíveis ' +
            'para o seu perfil e chamamos você no WhatsApp com o que fizer sentido.';
        }

        mostrar('pronto');
        telas.pronto.scrollIntoView({ block: 'center', behavior: rolagem() });
      })
      .catch(function () {
        rastrear('lead_form_error', { motivo: 'rede' });
        mostrar('erro');
      })
      .finally(function () {
        enviando = false;
        if (botao) {
          botao.disabled = false;
          botao.innerHTML = rotulo;
        }
      });
  }

  var botaoTentar = formulario.querySelector('[data-tentar]');
  if (botaoTentar) {
    botaoTentar.addEventListener('click', function () { mostrar('contato'); });
  }

  /**
   * Conversão do Google Ads. Dispara UMA vez por lead: o `disparou`
   * fecha a porta antes de qualquer reenvio, porque contar o mesmo lead
   * duas vezes distorce o custo por conversão e o Smart Bidding passa a
   * mirar no alvo errado.
   */
  var disparou = false;
  function converter() {
    if (disparou || !ADS_CONVERSAO || typeof window.gtag !== 'function') return;
    disparou = true;
    window.gtag('event', 'conversion', { send_to: ADS_CONVERSAO });
  }

  /* ------------------------------------------------------------------
     Os CTAs da página levam ao formulário

     O formulário mora no HERO, aberto, em qualquer largura — não existe
     mais CTA que "abre" o formulário na primeira dobra, porque ele já
     está lá. Estes CTAs são os que vêm DEPOIS dele na página
     (cabeçalho, MCMV, fechamento, barra fixa).

     No desktop eles rolam de volta até o hero. No celular rolar 5.000px
     para cima é desorientador, então o MESMO <dialog> reabre como modal
     por cima de tudo — e como é o mesmo DOM, o que a pessoa já tinha
     respondido continua marcado.

     `mqPerfil` decide qual dos dois caminhos vale a cada clique, no mesmo
     corte de 860px do CSS; o 'change' devolve o formulário para o hero se
     a janela crescer com o modal aberto.
  ------------------------------------------------------------------ */

  var mqPerfil = window.matchMedia('(max-width: 860px)');
  var modalPerfil = document.getElementById('modal-perfil');
  var MODAL = 'modal-perfil--modal';

  function rolagem() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto' : 'smooth';
  }

  /* Foco para dentro do quiz, na tela que já estiver aberta — vale para
     os dois caminhos (rolar até o card ou abrir o modal). Sem isto,
     quem navega por teclado ou leitor de tela chega ao lado do
     formulário mas não DENTRO dele. */
  function focarQuiz() {
    var opcao = telas[atual] && telas[atual].querySelector('.opcao, input, button');
    if (opcao) window.setTimeout(function () { opcao.focus({ preventScroll: true }); }, 420);
  }

  document.querySelectorAll('.js-ir-perfil').forEach(function (botao) {
    botao.addEventListener('click', function (evento) {
      evento.preventDefault();
      fecharMenu();

      rastrear('lead_form_shown', { source: botao.getAttribute('data-source') || 'desconhecida' });

      if (mqPerfil.matches && modalPerfil) {
        abrirModalPerfil();
        focarQuiz();
        return;
      }

      var alvo = document.getElementById('inicio');
      if (!alvo) return;
      alvo.scrollIntoView({ behavior: rolagem(), block: 'start' });
      focarQuiz();
    });
  });

  /* ------------------------------------------------------------------
     Modal do formulário — só no celular

     O <dialog> nunca existe em duplicidade: é o MESMO quiz do hero, e é
     por isso que o que já foi respondido sobrevive à troca. O estado de
     repouso dele é ABERTO e embutido no hero; virar modal é a exceção,
     e quem marca essa exceção é a classe .modal-perfil--modal — o CSS
     não consegue distinguir <dialog open> comum de showModal().

     Esc e o foco preso já vêm de fábrica do navegador.
  ------------------------------------------------------------------ */

  function abrirModalPerfil() {
    if (!modalPerfil || modalPerfil.classList.contains(MODAL)) return;

    /* removeAttribute em vez de close(): showModal() recusa um <dialog>
       que já esteja aberto, e close() dispararia o evento 'close' — que
       é justamente quem devolve o formulário ao hero. Tirar o atributo
       na mão não dispara evento nenhum. */
    modalPerfil.removeAttribute('open');

    try {
      modalPerfil.showModal();
    } catch (e) {
      modalPerfil.setAttribute('open', '');   // devolve ao hero e desiste
      return;
    }

    modalPerfil.classList.add(MODAL);
    document.documentElement.classList.add('modal-aberto');
  }

  if (modalPerfil) {
    /* Janela cresceu além dos 860px com o modal aberto: fecha, e o
       handler de 'close' logo abaixo devolve o formulário para dentro do
       hero, onde no desktop ele deve estar. */
    mqPerfil.addEventListener('change', function () {
      if (!mqPerfil.matches && modalPerfil.classList.contains(MODAL)) modalPerfil.close();
    });

    var botaoFecharPerfil = modalPerfil.querySelector('[data-fechar-perfil]');
    if (botaoFecharPerfil) {
      botaoFecharPerfil.addEventListener('click', function () { modalPerfil.close(); });
    }

    /* Clique no backdrop fecha. O alvo precisa ser o próprio <dialog>: a
       ativação por teclado (Enter num botão focado) chega com
       clientX/clientY = 0 e cairia fora da caixa por engano — mesma
       guarda usada no lightbox de planta e no qualifier das outras LPs.

       A caixa comparada é a do CARTÃO do quiz, não a do <dialog>: aqui o
       <dialog> ocupa a tela inteira (position: fixed; inset: 0, no
       celular) para poder pintar o backdrop atrás de tudo, então a
       própria caixa dele sempre contém o clique — testar contra ela
       nunca fecharia nada. */
    modalPerfil.addEventListener('click', function (evento) {
      if (evento.target !== modalPerfil) return;

      var cartao = modalPerfil.querySelector('.quiz');
      var caixa = cartao ? cartao.getBoundingClientRect() : modalPerfil.getBoundingClientRect();
      var dentro = evento.clientX >= caixa.left && evento.clientX <= caixa.right &&
        evento.clientY >= caixa.top && evento.clientY <= caixa.bottom;
      if (!dentro) modalPerfil.close();
    });

    /* Fechar o modal não é "sumir com o formulário": ele volta a ser o
       bloco aberto dentro do hero, que é onde mora. Sem isso a primeira
       dobra ficaria sem o único caminho de conversão da página.

       Quem observa o fechamento é um MutationObserver no atributo `open`,
       e NÃO o evento 'close' do <dialog>. Dois motivos:

       1. o Esc fecha o diálogo sem passar por código nosso, e o
          observador pega isso do mesmo jeito que pega o clique no X;
       2. o evento 'close' não é confiável em todo lugar — no navegador
          embutido usado para testar esta página ele simplesmente não
          chega, e um formulário que desaparece da home é caro demais
          para depender de um evento que pode não vir.

       As callbacks do observador são entregues em microtask, no fim da
       tarefa atual: durante o abrirModalPerfil() o par
       removeAttribute + showModal() já aconteceu, então a callback vê o
       diálogo aberto e não faz nada. */
    function devolverAoHero() {
      modalPerfil.classList.remove(MODAL);
      document.documentElement.classList.remove('modal-aberto');
      if (!modalPerfil.open) modalPerfil.setAttribute('open', '');
    }

    new MutationObserver(function () {
      if (!modalPerfil.open) devolverAoHero();
    }).observe(modalPerfil, { attributes: true, attributeFilter: ['open'] });
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
      var aberto = menu.getAttribute('data-aberto') === 'sim';
      if (aberto) {
        fecharMenu();
      } else {
        menu.setAttribute('data-aberto', 'sim');
        alternador.setAttribute('aria-expanded', 'true');
        alternador.setAttribute('aria-label', 'Fechar menu');
      }
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', fecharMenu);
    });

    document.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape') fecharMenu();
    });
  }

  /* ------------------------------------------------------------------
     Eventos de rolagem e de FAQ

     As chaves do observador são IDS DE SEÇÃO. Se um id mudar no HTML, o
     evento correspondente para de disparar em silêncio.
  ------------------------------------------------------------------ */

  var SECOES = { mcmv: 'mcmv', contato: 'cta_final' };
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

  /* ------------------------------------------------------------------
     Partida
  ------------------------------------------------------------------ */

  mostrar('perfil');
  rastrear('view_minha_casa_minha_vida');
})();
