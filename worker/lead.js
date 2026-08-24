/**
 * POST /api/lead — grava um lead no D1.
 *
 * Handler do Worker, chamado pelo roteador em worker/index.js. O binding do
 * banco (DB) vem do wrangler.toml.
 *
 * O formulário é o fim do caminho: ele NÃO abre o WhatsApp. Isso significa que
 * uma gravação que falhe em silêncio perde o lead de vez — por isso o cliente
 * espera a resposta e mostra tela de erro quando não vem 204.
 *
 * Não existe rota de LEITURA de propósito. A tabela tem dado pessoal; uma URL
 * pública sem autenticação exporia a base inteira. Para consultar, use o
 * wrangler ou o painel do Cloudflare — ver schema.sql.
 */

const CAMPOS_UTM = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content'
];

const EMPREENDIMENTOS = ['urban-vila-guilherme', 'merito-ipiranga'];

const RENDAS = ['ate-4000', '4000-8000', 'acima-8000', 'nao-informado'];

/* Corpo maior que isso não é lead, é abuso. */
const MAX_BYTES = 4096;

/** Corta e limpa um campo de texto vindo do cliente. */
function texto(valor, limite) {
  if (typeof valor !== 'string') return null;
  const limpo = valor.trim().slice(0, limite);
  return limpo === '' ? null : limpo;
}

/** Aceita só valores de uma lista fechada — evita lixo na coluna. */
function daLista(valor, lista) {
  return typeof valor === 'string' && lista.includes(valor) ? valor : null;
}

/**
 * Telefone brasileiro, guardado só com dígitos.
 *
 * Validação deliberadamente frouxa: 10 dígitos (fixo com DDD) ou 11 (celular).
 * Rejeitar número válido custa um lead; aceitar um com erro de digitação custa
 * uma ligação perdida — o segundo é muito mais barato.
 */
function telefone(valor) {
  if (typeof valor !== 'string') return null;
  const digitos = valor.replace(/\D/g, '');
  return digitos.length === 10 || digitos.length === 11 ? digitos : null;
}

/**
 * Avisa a equipe que chegou lead.
 *
 * Opcional: só roda se RESEND_API_KEY, NOTIFY_TO e NOTIFY_FROM estiverem
 * configurados. Sem eles, o lead é gravado do mesmo jeito e ninguém é avisado
 * — **notificar jamais pode derrubar a captura**.
 *
 * Vai por waitUntil: a resposta ao navegador não espera o e-mail sair.
 */
async function avisarEquipe(env, lead) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_TO || !env.NOTIFY_FROM) return;

  const linhas = [
    `Nome: ${lead.nome}`,
    `WhatsApp: ${lead.telefone}`,
    `Renda: ${lead.renda || 'não informou'}`,
    lead.planta ? `Planta que estava vendo: ${lead.planta}` : null,
    `Empreendimento: ${lead.empreendimento}`,
    `Origem na página: ${lead.origem || '—'}`,
    '',
    'Pegue o lead no painel: https://sebastianiimoveis.com.br/painel/'
  ].filter(Boolean).join('\n');

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: env.NOTIFY_FROM,
        /* Aceita vários destinos separados por vírgula. */
        to: env.NOTIFY_TO.split(',').map(e => e.trim()).filter(Boolean),
        subject: `Novo lead: ${lead.nome} — ${lead.empreendimento}`,
        text: linhas
      })
    });
  } catch (erro) {
    console.error('falha ao avisar equipe:', erro && erro.message);
  }
}

/* Um handler só, checando o método na mão. Exportar onRequestPost e onRequest
   juntos depende de uma regra de precedência do Pages que, se falhar, manda o
   POST para o 405 e nenhum lead é gravado — falha silenciosa e total. */
export async function onLead(request, env, ctx) {
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

    /* Armadilha para robô: o campo é invisível e nenhum humano preenche.
       Responde 204 como se tivesse gravado, para não ensinar o robô. */
    if (texto(dados.site, 200)) return new Response(null, { status: 204 });

    const nome = texto(dados.nome, 120);
    const fone = telefone(dados.telefone);
    const empreendimento = daLista(dados.empreendimento, EMPREENDIMENTOS);

    /* O cliente já valida, mas nunca confiar: o corpo pode vir de qualquer
       lugar. Sem nome ou telefone o registro não serve para nada. */
    if (!nome || !fone || !empreendimento) {
      return new Response(null, { status: 400 });
    }

    const campanha = dados.campanha && typeof dados.campanha === 'object'
      ? dados.campanha
      : {};

    await env.DB.prepare(
      `INSERT INTO leads (
         criado_em, empreendimento, nome, telefone, renda, planta, origem,
         gclid, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
         pagina, consentimento
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      /* Data do servidor: a do cliente pode vir errada ou forjada. */
      new Date().toISOString(),
      empreendimento,
      nome,
      fone,
      daLista(dados.renda, RENDAS),
      texto(dados.planta, 40),
      texto(dados.origem, 40),
      texto(campanha.gclid, 200),
      ...CAMPOS_UTM.map(k => texto(campanha[k], 200)),
      texto(dados.pagina, 300),
      dados.consentimento === true ? 1 : 0
    ).run();

    /* O aviso sai depois da resposta: a pessoa não espera o e-mail. */
    const aviso = avisarEquipe(env, {
      nome: nome,
      telefone: fone,
      renda: daLista(dados.renda, RENDAS),
      planta: texto(dados.planta, 40),
      empreendimento: empreendimento,
      origem: texto(dados.origem, 40)
    });

    /* ctx.waitUntil segura a resposta aberta até o e-mail sair, sem fazer a
       pessoa esperar por ele. */
    if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(aviso);

    return new Response(null, { status: 204 });
  } catch (erro) {
    /* Aparece no log do Pages (wrangler tail). O cliente
       não recebe detalhe nenhum — mensagem de erro é superfície de ataque. */
    console.error('falha ao gravar lead:', erro && erro.message);
    return new Response(null, { status: 500 });
  }
}
