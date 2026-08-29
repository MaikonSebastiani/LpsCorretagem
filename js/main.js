/**
 * Home do Grupo Saitama.
 *
 * A página funciona inteira sem JavaScript: os links são links, o FAQ usa
 * <details> nativo. Isto aqui só acrescenta medição — se falhar, nada na
 * página deixa de funcionar.
 */
(function () {
  'use strict';

  if (!window.Saitama) return;

  /* Qual CTA levou a pessoa para a análise de perfil. Sem isso, dá para
     saber quantos entraram na /simulacao mas não de onde vieram — e é essa
     informação que diz qual bloco da home está puxando o seu peso. */
  document.addEventListener('click', function (evento) {
    var alvo = evento.target.closest('[data-cta]');
    if (!alvo) return;

    var destino = alvo.getAttribute('href') || '';
    var nome = alvo.getAttribute('data-cta');

    if (destino.indexOf('/simulacao') === 0) {
      window.Saitama.rastrear('simulation_cta_click', { cta: nome });
    } else {
      window.Saitama.rastrear('property_view', { cta: nome, destino: destino });
    }
  });

  /* Região escolhida na home. Vai como evento próprio porque responde uma
     pergunta que o funil sozinho não responde: qual região a demanda
     procura — inclusive as que ainda não temos empreendimento para
     oferecer. É o que orienta onde buscar o próximo produto. */
  document.querySelectorAll('.regiao').forEach(function (link) {
    link.addEventListener('click', function () {
      var url = link.getAttribute('href') || '';
      var regiao = (url.split('regiao=')[1] || '').split('&')[0];
      window.Saitama.rastrear('region_select', { regiao: regiao });
    });
  });

  /* Abertura de pergunta do FAQ: dúvida repetida é assunto de conteúdo. */
  document.querySelectorAll('.faq').forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      var pergunta = item.querySelector('summary');
      window.Saitama.rastrear('faq_open', {
        question: pergunta ? pergunta.textContent.trim() : ''
      });
    });
  });
})();
