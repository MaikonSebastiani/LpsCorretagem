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
 * Telefone brasileiro, guardado só com dígitos.
 *
 * Validação deliberadamente frouxa: 10 dígitos (fixo com DDD) ou 11
 * (celular). Rejeitar número válido custa um lead; aceitar um com erro de
 * digitação custa uma ligação perdida — o segundo é muito mais barato.
 */
export function telefone(valor) {
  if (typeof valor !== 'string') return null;
  const digitos = valor.replace(/\D/g, '');
  return digitos.length === 10 || digitos.length === 11 ? digitos : null;
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
