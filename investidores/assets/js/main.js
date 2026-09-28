/* =====================================================================
   SEBASTIANI IMÓVEIS — investidores

   ATENÇÃO: esta LP é a ÚNICA do repositório em que o CTA vai DIRETO
   para o WhatsApp. As LPs de empreendimento abrem um formulário que
   grava no banco, porque lá o lead é dividido entre a equipe e um lead
   fora do painel não chega a ninguém. Aqui a decisão é outra, tomada em
   09/09/2026: o público é investidor, o volume é menor e a conversa
   começa antes.

   O que isso custa, para ficar registrado:

   - O lead NÃO entra na tabela `leads`. Não há score, não há
     deduplicação, não há histórico no CRM. O registro do contato passa
     a ser a própria conversa no WhatsApp.
   - A conversão do Google Ads passa a ser o CLIQUE, não o lead gravado.
     Clique é sinal mais fraco: alguém pode abrir o WhatsApp e nunca
     mandar mensagem. Se um dia o custo por lead parecer bom demais,
     é aqui que está a explicação.

   Se essa decisão for revertida, o caminho é o formulário das outras
   LPs — o padrão está em novo-mundo-carrao/assets/js/main.js.

   O JavaScript aqui é fino de propósito: o href de cada botão já é um
   link de WhatsApp completo. Sem JS a página continua funcionando; o
   script só acrescenta a mensagem pronta e a medição.
   ===================================================================== */
(function () {
  'use strict';

  /* DDI + DDD + número, só dígitos. Mesmo número das outras LPs.
     Quando a equipe tiver uma linha própria para investidor, é este
     valor e o href de cada botão no HTML que mudam — os dois, senão
     quem estiver sem JavaScript continua caindo no número antigo. */
  var WHATSAPP = '5511953713310';

  /* Rótulo de conversão do Google Ads. Vazio = nenhuma conversão
     disparada.

     Esta ação é PRÓPRIA desta LP, e precisa continuar sendo: o evento
     aqui é "clicou para abrir o WhatsApp", que não significa a mesma
     coisa que o "lead gravado" das outras LPs. Somar os dois na mesma
     ação faria o Smart Bidding otimizar por dois eventos de valor
     diferente como se fossem um.

     Cadastrada em 10/09/2026. Se um dia o relatório do Ads mostrar
     conversão zerada com cliques acontecendo, o primeiro lugar a olhar
     é se este rótulo ainda existe na conta. */
  var ADS_CONVERSAO = 'AW-18388777321/bzB-CI2f2vIcEOnyucBE';

  function rastrear(evento, dados) {
    try {
      if (window.Saitama && window.Saitama.rastrear) {
        window.Saitama.rastrear(evento, dados);
        return;
      }
      if (typeof window.gtag === 'function') window.gtag('event', evento, dados || {});
    } catch (e) { /* nunca quebrar a página por causa de medição */ }
  }

  function reportarConversao() {
    if (!ADS_CONVERSAO) return;
    try {
      if (typeof window.gtag === 'function') {
        /* transport_type beacon: a aba está prestes a perder o foco para
           o WhatsApp, e um XHR normal seria cancelado no caminho. */
        window.gtag('event', 'conversion', {
          send_to: ADS_CONVERSAO,
          value: 1.0,
          currency: 'BRL',
          transport_type: 'beacon'
        });
      }
    } catch (e) { /* conversão nunca pode atrapalhar o contato */ }
  }

  /* ------------------------------------------------------------------
     Menu do celular

     O painel é controlado por uma classe no .topo, e não por style
     inline: assim o CSS decide como ele aparece em cada largura, e o
     JavaScript só diz "aberto" ou "fechado".

     Sem JavaScript o botão simplesmente não faz nada, e é por isso que
     ele nasce com aria-expanded="false" no HTML em vez de ser criado
     aqui: um botão que aparece e não responde é pior do que um botão
     que não aparece.
  ------------------------------------------------------------------ */
  var topo = document.querySelector('.topo');
  var toggle = topo && topo.querySelector('.menu-toggle');

  if (topo && toggle) {
    var painel = topo.querySelector('.topo__nav');

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

    /* Clicar num link fecha o painel: as âncoras rolam a página, e o
       menu aberto por cima do destino esconde justamente o que a pessoa
       foi ver. */
    if (painel) {
      painel.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', fecharMenu);
      });
    }

    /* Esc fecha, e clique fora também. Menu que só fecha no próprio
       botão prende quem abriu por engano. */
    document.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape' && topo.classList.contains('aberto')) {
        fecharMenu();
        toggle.focus();
      }
    });

    document.addEventListener('click', function (evento) {
      if (!topo.classList.contains('aberto')) return;
      if (!topo.contains(evento.target)) fecharMenu();
    });
  }

  /* ------------------------------------------------------------------
     Link de WhatsApp

     A mensagem vem do data-message do botão. Desde 09/09/2026 todos os
     CTAs mandam o MESMO texto, por decisão do cliente: a pessoa abre o
     WhatsApp com uma frase só, independente de onde clicou.

     O que isso custa: quem atende não sabe mais, pela mensagem, se o
     clique veio do cartão do leilão ou do lançamento. Essa informação
     não se perdeu — continua indo para o GA4 no evento whatsapp_click,
     em `source` e `cta` —, mas ela deixou de chegar em quem responde.
     Se um dia isso incomodar no atendimento, é voltar a diferenciar o
     data-message por seção.

     UTM, gclid e fbclid NUNCA entram na mensagem. Vão só para o GA4.
     Mandar parâmetro de campanha dentro do texto que a pessoa envia é
     constrangedor e não ajuda ninguém a atender melhor.
  ------------------------------------------------------------------ */
  var PADRAO = 'Olá! Quero analisar o meu perfil de investidor com a Sebastiani e entender quais oportunidades fazem sentido para mim.';

  function linkDo(el) {
    var mensagem = el.getAttribute('data-message') || PADRAO;
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(mensagem);
  }

  document.querySelectorAll('.js-whatsapp').forEach(function (el) {
    /* O href já vem pronto do HTML como rede de segurança. Aqui ele é
       enriquecido com a mensagem — feito na carga, e não no clique,
       para que o link também funcione em "abrir em nova aba" pelo menu
       do navegador, que não dispara o handler de clique. */
    el.setAttribute('href', linkDo(el));

    el.addEventListener('click', function () {
      var source = el.getAttribute('data-source') || 'unknown';

      /* Rótulo do botão como estava escrito na tela. O data-source diz
         de que SEÇÃO veio; isto diz qual PROMESSA converteu — é o que
         permite trocar a copy de um CTA e medir se a troca funcionou. */
      var rotulo = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);

      rastrear('whatsapp_click', { source: source, cta: rotulo });
      reportarConversao();

      /* Sem preventDefault: o clique segue para o WhatsApp. */
    });
  });

  /* ------------------------------------------------------------------
     Engajamento

     Uma vez por sessão cada, porque o que interessa é "chegou até
     aqui", não "rolou para cima e para baixo dez vezes". Sem o
     controle, uma única visita inflaria o relatório inteiro.
  ------------------------------------------------------------------ */
  var jaVistas = {};

  function observarSecoes() {
    if (!('IntersectionObserver' in window)) return;

    /* As chaves são ids de seção do HTML; os valores, os nomes que vão
       para o GA4. Se um id mudar lá, muda aqui — o observador falha em
       silêncio quando o elemento não existe. */
    var alvos = {
      caminhos: 'caminhos',
      comparar: 'comparativo',
      remuneracao: 'remuneracao',
      contato: 'cta_final'
    };

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        var nome = alvos[entrada.target.id];
        if (!nome || jaVistas[nome]) return;
        jaVistas[nome] = true;
        rastrear('section_view', { section: nome });
      });
    }, { threshold: .35 });

    Object.keys(alvos).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) observador.observe(el);
    });
  }

  function observarFaq() {
    document.querySelectorAll('.faq').forEach(function (faq) {
      faq.addEventListener('toggle', function () {
        if (!faq.open) return;
        var titulo = faq.querySelector('summary');
        rastrear('faq_open', {
          question: titulo ? titulo.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) : ''
        });
      });
    });
  }

  observarSecoes();
  observarFaq();
  rastrear('view_investidores');
})();
