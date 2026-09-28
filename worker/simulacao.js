/**
 * POST /api/simulacao — análise de perfil.
 *
 * Diferente de /api/lead (que nasce dentro de um empreendimento), aqui a
 * pessoa é captada ANTES de saber o que quer comprar — "tenho renda de X, o
 * que consigo?". Por isso o lead entra com `empreendimento` nulo e com os
 * campos de qualificação preenchidos.
 *
 * Este arquivo só faz o que é do HTTP: validar o corpo e traduzir para o
 * formato do banco. Deduplicação, score, distribuição e histórico ficam em
 * leads.js, compartilhados com o formulário das landing pages.
 *
 * Não existe rota de LEITURA de propósito: a tabela tem dado pessoal, e uma
 * URL pública sem autenticação exporia a base inteira. Quem lê é o CRM,
 * atrás do Cloudflare Access.
 */

import {
  RENDAS, ENTRADAS, FGTS, REGIOES, MOMENTOS, PREFERENCIAS, OBJETIVOS, daLista
} from './config.js';
import { texto, telefone, email, multiplos, origemDo } from './campos.js';
import { salvarLead } from './leads.js';
import { avisarEquipe } from './aviso.js';

/* Corpo maior que isso não é lead, é abuso. */
const MAX_BYTES = 8192;

/**
 * Monta o e-mail deste formulário; o envio em si é compartilhado — ver
 * aviso.js. Diferente do /api/lead: não tem empreendimento nem planta, e
 * pergunta entrada/FGTS/região/preferência que a LP não pergunta.
 */
function avisoDaSimulacao(lead) {
  const preferencia = lead.preferencia
    ? JSON.parse(lead.preferencia).join(', ')
    : null;

  const linhas = [
    `Nome: ${lead.nome}`,
    `WhatsApp: ${lead.telefone}`,
    /* Só sai quando existe: a /simulacao e a home não perguntam objetivo,
       e uma linha "não informou" fixa em todo aviso vira ruído. */
    lead.objetivo ? `Objetivo com o imóvel: ${lead.objetivo}` : null,
    `Renda: ${lead.renda || 'não informou'}`,
    `Entrada disponível: ${lead.entrada || 'não informou'}`,
    `FGTS: ${lead.fgts || 'não informou'}`,
    `Região de interesse: ${lead.regiao || 'não informou'}`,
    preferencia ? `Preferência de imóvel: ${preferencia}` : null,
    `Quando pretende comprar: ${lead.momento || 'não informou'}`,
    `Origem na página: ${lead.origem || '—'}`,
    lead.reentrada ? '' : null,
    lead.reentrada ? 'ATENÇÃO: esta pessoa já estava na base. O cadastro foi' : null,
    lead.reentrada ? 'atualizado em vez de duplicado — confira o histórico.' : null,
    '',
    'Pegue o lead no CRM: https://crm.gruposaitama.com.br/leads'
  ];

  return { assunto: `Novo lead (análise de perfil): ${lead.nome}`, linhas };
}

export async function onSimulacao(request, env, ctx) {
  if (request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  }

  try {
    if (!env.DB) return new Response(null, { status: 503 });

    const bruto = await request.text();
    if (bruto.length > MAX_BYTES) return new Response(null, { status: 413 });

    let dados;
    try {
      dados = JSON.parse(bruto);
    } catch {
      return new Response(null, { status: 400 });
    }

    /* Armadilha para robô: campo invisível que nenhum humano preenche.
       Responde 204 como se tivesse gravado, para não ensinar o robô. */
    if (texto(dados.site, 200)) return new Response(null, { status: 204 });

    const nome = texto(dados.nome, 120);
    const fone = telefone(dados.telefone);

    /* O cliente valida, mas nunca confiar: o corpo pode vir de qualquer
       lugar. Sem nome ou telefone o registro não serve para nada. */
    if (!nome || !fone) return new Response(null, { status: 400 });

    const perfil = {
      nome,
      telefone: fone,
      email: email(dados.email),
      renda: daLista(dados.renda, RENDAS),
      entrada: daLista(dados.entrada, ENTRADAS),
      fgts: daLista(dados.fgts, FGTS),
      regiao: daLista(dados.regiao, REGIOES),
      momento: daLista(dados.momento, MOMENTOS),
      preferencia: multiplos(dados.preferencia, PREFERENCIAS),
      objetivo: daLista(dados.objetivo, OBJETIVOS)
    };

    const extra = { consentimento: dados.consentimento === true };
    const salvo = await salvarLead(env.DB, perfil, origemDo(dados), extra);

    /* O aviso sai depois da resposta: a pessoa não espera o e-mail.
       ctx.waitUntil segura a resposta aberta até o envio terminar.
       Faltava isto até 14/09/2026: o lead sempre chegava certo no banco,
       mas ninguém era avisado — só o /api/lead tinha esta chamada. */
    const aviso = avisarEquipe(env, avisoDaSimulacao({
      ...perfil,
      origem: texto(dados.origem, 40),
      reentrada: salvo.reentrada
    }));

    if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(aviso);

    return new Response(null, { status: 204 });
  } catch (erro) {
    /* Aparece no `wrangler tail`. O cliente não recebe detalhe nenhum —
       mensagem de erro é superfície de ataque. */
    console.error('falha na simulacao:', erro && erro.message);
    return new Response(null, { status: 500 });
  }
}
