/**
 * Monta os cartões da equipe a partir de js/consultores.js.
 *
 * Se a lista estiver vazia, a grade não aparece e fica só o bloco de
 * convite que já está no HTML — nada de "em breve" nem de cartão fantasma.
 */
(function () {
  'use strict';

  var lista = Array.isArray(window.CONSULTORES) ? window.CONSULTORES : [];
  var grade = document.querySelector('[data-equipe]');
  var vazio = document.querySelector('[data-vazio]');

  if (!grade) return;

  if (lista.length === 0) {
    if (window.Saitama) window.Saitama.rastrear('team_view', { consultores: 0 });
    return;
  }

  grade.hidden = false;
  /* O bloco de convite continua visível abaixo dos cartões: ele explica
     como o grupo trabalha, o que vale com ou sem consultor cadastrado. */
  if (vazio) vazio.classList.add('convite--apos');

  grade.innerHTML = lista.map(cartao).join('');

  /* Delegação em vez de um ouvinte por cartão: um só, que continua
     funcionando se a lista mudar. */
  grade.addEventListener('click', function (evento) {
    var link = evento.target.closest('[data-consultor]');
    if (!link || !window.Saitama) return;

    window.Saitama.rastrear('team_contact', {
      consultor: link.getAttribute('data-consultor')
    });
  });

  if (window.Saitama) {
    window.Saitama.rastrear('team_view', { consultores: lista.length });
  }

  function cartao(c) {
    var nome = texto(c.nome || '');
    if (!nome) return '';

    var partes = [];

    partes.push('<article class="consultor">');

    /* Sem foto, a inicial do nome. Melhor do que um ícone genérico de
       pessoa, que faz o cartão parecer um lugar reservado vazio. */
    if (c.foto) {
      partes.push(
        '<img class="consultor__foto" src="' + texto(c.foto) + '" ' +
        'alt="' + nome + '" width="96" height="96" loading="lazy" decoding="async">'
      );
    } else {
      partes.push(
        '<span class="consultor__inicial" aria-hidden="true">' +
        nome.charAt(0).toUpperCase() + '</span>'
      );
    }

    partes.push('<h3 class="consultor__nome">' + nome + '</h3>');

    /* CRECI só aparece quando existe. Rótulo com valor em branco levanta
       exatamente a dúvida que a credencial deveria encerrar. */
    if (c.creci) {
      partes.push('<p class="consultor__creci">' + texto(c.creci) + '</p>');
    }

    if (Array.isArray(c.regioes) && c.regioes.length) {
      partes.push(
        '<p class="consultor__regioes">' +
        c.regioes.map(texto).join(' &bull; ') + '</p>'
      );
    }

    if (c.apresentacao) {
      partes.push('<p class="consultor__sobre">' + texto(c.apresentacao) + '</p>');
    }

    if (Array.isArray(c.especialidades) && c.especialidades.length) {
      partes.push(
        '<ul class="consultor__tags">' +
        c.especialidades.map(function (e) {
          return '<li>' + texto(e) + '</li>';
        }).join('') +
        '</ul>'
      );
    }

    /* Sem WhatsApp cadastrado, o cartão manda para a análise de perfil —
       que é o caminho que o grupo prefere de qualquer forma, porque
       qualifica antes de ocupar o tempo do consultor. */
    var destino = c.whatsapp
      ? 'https://wa.me/' + texto(c.whatsapp).replace(/\D/g, '')
      : '/simulacao/';
    var rotulo = c.whatsapp ? 'Falar com ' + primeiroNome(nome) : 'Falar com a equipe';
    var externo = c.whatsapp ? ' target="_blank" rel="noopener noreferrer"' : '';

    partes.push(
      '<a class="botao botao--vazado consultor__cta" href="' + destino + '"' +
      externo + ' data-consultor="' + nome + '">' + rotulo + '</a>'
    );

    partes.push('</article>');
    return partes.join('');
  }

  function primeiroNome(nome) {
    return nome.split(' ')[0];
  }

  /**
   * Escapa antes de injetar no HTML.
   *
   * O conteúdo vem de um arquivo nosso, não de usuário — mas quem edita
   * consultores.js pode colar um "&" de um nome comercial sem pensar, e
   * essa função evita que isso quebre a página em silêncio.
   */
  function texto(valor) {
    return String(valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
