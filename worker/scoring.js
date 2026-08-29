/**
 * Score do lead — 0 a 100.
 *
 * Roda SÓ no servidor. O navegador nunca recebe o número nem a
 * classificação: é informação de operação interna, e mostrar "você é um
 * lead frio" para a pessoa seria constrangedor além de inútil.
 *
 * Os pesos ficam em config.js justamente para poderem ser calibrados sem
 * mexer nesta lógica.
 */

import { PESOS, CLASSIFICACAO } from './config.js';

/**
 * Maior pontuação que a configuração atual permite.
 *
 * Calculado a partir dos próprios pesos em vez de escrito à mão: assim,
 * quando alguém ajustar um peso em config.js, a escala continua sendo 0–100
 * de verdade. Com um teto fixo, aumentar um peso faria todo mundo pontuar
 * mais e as faixas de classificação passariam a significar outra coisa em
 * silêncio.
 */
function tetoDaConfiguracao() {
  const maiorDe = (grupo) => Math.max(...Object.values(grupo));

  return (
    maiorDe(PESOS.momento) +
    maiorDe(PESOS.renda) +
    maiorDe(PESOS.entrada) +
    maiorDe(PESOS.fgts) +
    PESOS.regiaoDefinida +
    PESOS.empreendimentoDefinido +
    PESOS.temEmail +
    PESOS.preferenciaDefinida
  );
}

/**
 * @param {object} lead campos já validados contra as listas de config.js
 * @returns {{ score: number, classificacao: string }}
 */
export function calcularScore(lead) {
  let bruto = 0;

  bruto += PESOS.momento[lead.momento] || 0;
  bruto += PESOS.renda[lead.renda] || 0;
  bruto += PESOS.entrada[lead.entrada] || 0;
  bruto += PESOS.fgts[lead.fgts] || 0;

  /* "Ainda não sei" é resposta válida na etapa de região, mas não conta:
     o ponto existe porque região definida encurta o atendimento. */
  if (lead.regiao && lead.regiao !== 'nao-sei') {
    bruto += PESOS.regiaoDefinida;
  }

  if (lead.empreendimento) bruto += PESOS.empreendimentoDefinido;

  if (lead.email) bruto += PESOS.temEmail;

  /* Mesma lógica da região: "sem preferência" não é preferência. */
  const pref = Array.isArray(lead.preferencia) ? lead.preferencia : [];
  if (pref.length && !pref.includes('sem-preferencia')) {
    bruto += PESOS.preferenciaDefinida;
  }

  const score = Math.min(100, Math.round((bruto / tetoDaConfiguracao()) * 100));

  return { score, classificacao: classificar(score) };
}

/** Traduz o número na etiqueta que o CRM usa para ordenar a fila. */
export function classificar(score) {
  /* Da menor faixa para a maior: a primeira que couber vence. */
  const faixas = [...CLASSIFICACAO].sort((a, b) => a.ate - b.ate);

  for (const faixa of faixas) {
    if (score <= faixa.ate) return faixa.nome;
  }

  return faixas[faixas.length - 1].nome;
}
