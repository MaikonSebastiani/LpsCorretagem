/* =====================================================================
   NOVO MUNDO CARRÃO II — main.js

   Desde 30/09/2026 todo CTA vai direto para o WhatsApp, com a mesma
   mensagem, como nas outras LPs. O formulário de lead saiu da página —
   os leads daqui não passam mais pelo CRM.

   Conversão do Ads: esta LP precisa da PRÓPRIA ação de conversão, como
   Urban e Mérito têm. Enquanto o rótulo não for criado, ADS_CONVERSAO
   fica vazio e o clique só vai para o GA4 (evento whatsapp_click) — é
   melhor não reportar nada do que somar este lançamento no relatório de
   outro.
   ===================================================================== */
(function () {
  'use strict';

  var WHATSAPP = '5511953713310';
  var MENSAGEM = 'Oi gostaria de mais informações sobre o empreendimento Novo Mundo Carrão II';

  /* Rótulo próprio do Carrão, no formato 'AW-XXXXXXXXX/XXXXXXXXXXXX'.
     Vazio = nenhuma conversão disparada (ver comentário do topo). */
  var ADS_CONVERSAO = '';

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
     CTAs → WhatsApp

     Quem abre a conversa é o próprio link (href + target); o clique só
     registra evento e conversão. O href também está escrito no HTML, para
     o botão funcionar mesmo se o JavaScript falhar.
  ------------------------------------------------------------------ */
  var URL_WHATSAPP = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(MENSAGEM);

  document.querySelectorAll('.js-lead').forEach(function (el) {
    el.setAttribute('href', URL_WHATSAPP);
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');

    el.addEventListener('click', function () {
      rastrear('whatsapp_click', { source: el.getAttribute('data-source') || 'unknown' });
      reportarConversao();
    });
  });

  rastrear('view_carrao');
})();
