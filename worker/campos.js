/**
 * Saneamento dos campos que chegam do navegador.
 *
 * Vive num arquivo próprio porque /api/lead e /api/simulacao precisam das
 * mesmas garantias. Duplicar essas funções significaria, mais cedo ou mais
 * tarde, corrigir um bug de validação em um endpoint e esquecer o outro.
 */

/** Corta e limpa um campo de texto. String vazia vira null, não ''. */
export function texto(valor, limite) {
  if (typeof valor !== 'string') return null;
  const limpo = valor.trim().slice(0, limite);
  return limpo === '' ? null : limpo;
}

/**
 * DDDs que existem de verdade no Brasil (lista da Anatel).
 *
 * A lista tem buracos que não são óbvios — 20, 23, 25, 26, 29, 30, 36, 39,
 * 40, 50, 52, 56 a 60, 70, 72, 76, 78, 80 e 90 nunca foram atribuídos.
 * Conferir só "dois dígitos" deixava passar todos eles.
 */
const DDDS = new Set([
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28',
  '31', '32', '33', '34', '35', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '51', '53', '54', '55',
  '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '71', '73', '74', '75', '77', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99'
]);

/**
 * Celular brasileiro, guardado só com dígitos.
 *
 * Antes a regra era só o comprimento (10 ou 11 dígitos) e entrou lead com
 * "55119727727": o país colado na frente, o número truncado, e ninguém
 * para atender do outro lado. Um telefone que não completa a chamada não é
 * um lead — é um custo de mídia sem retorno.
 *
 * Por isso agora exige as três coisas que tornam o número discável:
 * 11 dígitos, DDD que existe, e o 9 na frente do assinante.
 *
 * Fixo é recusado de propósito: o campo é o WhatsApp, que no Brasil só
 * funciona em celular.
 */
export function telefone(valor) {
  if (typeof valor !== 'string') return null;

  let d = valor.replace(/\D/g, '');

  /* Código do país que a pessoa colou junto (5511987654321). Só sai quando
     o que sobra tem tamanho de celular — "55" também é o DDD de Santa
     Maria/RS, e remover cedo demais destruiria um número legítimo. */
  if (d.length === 13 && d.startsWith('55')) d = d.slice(2);

  if (d.length !== 11) return null;
  if (!DDDS.has(d.slice(0, 2))) return null;
  if (d[2] !== '9') return null;

  return d;
}

/**
 * E-mail. Campo opcional em todo o projeto, então formato inválido vira
 * null em vez de recusar o lead inteiro — o WhatsApp é o canal que importa.
 */
export function email(valor) {
  const limpo = texto(valor, 160);
  if (!limpo) return null;
  return /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(limpo) ? limpo.toLowerCase() : null;
}

/**
 * Múltipla escolha: devolve JSON de um array filtrado pela lista fechada,
 * ou null se sobrar nada. JSON porque a coluna é TEXT — ver o comentário
 * de `preferencia` na migração 0002.
 */
export function multiplos(valor, lista, maximo = 10) {
  if (!Array.isArray(valor)) return null;

  const limpos = valor
    .filter((v) => typeof v === 'string' && lista.includes(v))
    .slice(0, maximo);

  return limpos.length ? JSON.stringify(limpos) : null;
}

/**
 * Dados de origem do visitante.
 *
 * Montados aqui, no servidor, a partir do que a página enviou — mas a
 * página é quem lê a URL, então o conteúdo vem do cliente e é tratado como
 * suspeito: tudo passa por `texto()` com limite.
 */
export function origemDo(dados) {
  const c = dados.campanha && typeof dados.campanha === 'object' ? dados.campanha : {};

  return {
    origem: texto(dados.origem, 40),
    /* Rótulo do botão clicado. Vem do textContent do CTA, então é texto
       que NÓS escrevemos na página — mas chega pelo cliente como todo o
       resto, e por isso passa pelo mesmo corte. */
    cta: texto(dados.cta, 80),
    pagina: texto(dados.pagina, 300),
    referrer: texto(dados.referrer, 300),
    gclid: texto(c.gclid, 200),
    fbclid: texto(c.fbclid, 200),
    utm_source: texto(c.utm_source, 200),
    utm_medium: texto(c.utm_medium, 200),
    utm_campaign: texto(c.utm_campaign, 200),
    utm_term: texto(c.utm_term, 200),
    utm_content: texto(c.utm_content, 200)
  };
}
