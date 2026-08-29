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
  RENDAS, ENTRADAS, FGTS, REGIOES, MOMENTOS, PREFERENCIAS, daLista
} from './config.js';
import { texto, telefone, email, multiplos, origemDo } from './campos.js';
import { salvarLead } from './leads.js';

/* Corpo maior que isso não é lead, é abuso. */
const MAX_BYTES = 8192;

export async function onSimulacao(request, env) {
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
      preferencia: multiplos(dados.preferencia, PREFERENCIAS)
    };

    await salvarLead(env.DB, perfil, origemDo(dados), {
      consentimento: dados.consentimento === true
    });

    return new Response(null, { status: 204 });
  } catch (erro) {
    /* Aparece no `wrangler tail`. O cliente não recebe detalhe nenhum —
       mensagem de erro é superfície de ataque. */
    console.error('falha na simulacao:', erro && erro.message);
    return new Response(null, { status: 500 });
  }
}
