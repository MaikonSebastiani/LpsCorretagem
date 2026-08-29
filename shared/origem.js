/**
 * Origem do visitante + eventos de medição.
 *
 * Um arquivo só, carregado por todas as páginas novas, porque "de onde veio
 * este lead" precisa significar exatamente a mesma coisa em qualquer
 * formulário do site. Sem isso o custo por lead por campanha vira chute.
 *
 * Sem dependência, sem build: define window.Saitama e sai do caminho.
 *
 * As landing pages de empreendimento têm a própria cópia dessa lógica em
 * js/main.js. Elas continuam assim de propósito por enquanto — são a
 * conversão que está no ar com campanha ativa, e reescrever o rastreamento
 * delas agora arriscaria o que já funciona. Quando a poeira das campanhas
 * baixar, elas passam a carregar este arquivo.
 */
(function () {
  'use strict';

  /* Chaves preservadas na sessão. gclid/fbclid entram junto porque são o
     que liga o lead de volta ao clique pago no Google e no Meta. */
  var CHAVES = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'gclid', 'fbclid'
  ];

  var GUARDA = 'saitama:campanha';
  var GUARDA_REFERRER = 'saitama:referrer';

  /**
   * Lê os parâmetros da URL e guarda na sessão.
   *
   * Guardar importa porque a pessoa entra por /?utm_source=google, navega
   * para /simulacao e o parâmetro some da URL. Sem a sessão, todo lead que
   * desse mais de um clique antes de converter apareceria como orgânico.
   *
   * A primeira captura vence: quem trouxe a pessoa foi o primeiro clique.
   */
  function capturar() {
    var salvo = ler(GUARDA);
    var params = new URLSearchParams(window.location.search);
    var atual = {};
    var achou = false;

    CHAVES.forEach(function (chave) {
      var valor = params.get(chave);
      if (valor) {
        atual[chave] = valor.slice(0, 200);
        achou = true;
      }
    });

    if (achou) {
      gravar(GUARDA, atual);
      salvo = atual;
    }

    /* O referrer só existe no primeiro carregamento da sessão: depois a
       navegação interna sobrescreveria com o próprio site. */
    if (!ler(GUARDA_REFERRER) && document.referrer) {
      var externo = ehExterno(document.referrer);
      gravar(GUARDA_REFERRER, { valor: externo ? document.referrer : '' });
    }

    return salvo || {};
  }

  function ehExterno(url) {
    try {
      return new URL(url).hostname !== window.location.hostname;
    } catch (e) {
      return false;
    }
  }

  /** Pacote de origem pronto para ir junto de qualquer formulário. */
  function pacote(origemDoBotao) {
    var ref = ler(GUARDA_REFERRER);

    return {
      origem: origemDoBotao || 'desconhecida',
      pagina: window.location.pathname,
      referrer: (ref && ref.valor) || '',
      campanha: capturar()
    };
  }

  /* --------------------------------------------------------------
     Eventos

     Nomes fixos, definidos uma vez. Evento com nome improvisado em cada
     página é o motivo clássico de relatório que não fecha.
     -------------------------------------------------------------- */
  function rastrear(evento, dados) {
    var carga = dados || {};
    var campanha = capturar();

    /* A campanha viaja junto do evento: assim dá para cruzar etapa
       abandonada com anúncio dentro do próprio GA4. */
    Object.keys(campanha).forEach(function (k) {
      carga[k] = campanha[k];
    });

    try {
      if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push(Object.assign({ event: evento }, carga));
      }
      if (typeof window.gtag === 'function') {
        window.gtag('event', evento, carga);
      }
    } catch (e) {
      /* Medição nunca pode derrubar a página. */
    }
  }

  /* --------------------------------------------------------------
     sessionStorage, sempre defensivo

     Navegador em aba anônima ou com cookies bloqueados lança ao só
     ACESSAR sessionStorage. Sem o try, a página inteira morria antes de
     desenhar o formulário.
     -------------------------------------------------------------- */
  function ler(chave) {
    try {
      var cru = window.sessionStorage.getItem(chave);
      return cru ? JSON.parse(cru) : null;
    } catch (e) {
      return null;
    }
  }

  function gravar(chave, valor) {
    try {
      window.sessionStorage.setItem(chave, JSON.stringify(valor));
    } catch (e) {
      /* Sem persistência a atribuição fica pior, mas o lead ainda entra. */
    }
  }

  window.Saitama = {
    capturar: capturar,
    pacote: pacote,
    rastrear: rastrear
  };

  capturar();
})();
