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

/* Faixas do Minha Casa Minha Vida. Lista fechada: valor fora daqui vira
   null em vez de sujar a coluna.

   Quando o programa reajustar os limites, muda aqui, nos dois main.js das
   LPs e no CRM (schema.ts e format.ts). Os leads já gravados mantêm a faixa
   vigente na data — é isso que se quer, não reescrever o passado. */
const RENDAS = [
  'faixa-1',
  'faixa-2',
  'faixa-3',
  'faixa-4',
  'acima-teto',
  'nao-informado'
];

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
 * Codifica um cabeçalho MIME que tenha caractere fora do ASCII.
 *
 * Um assunto com "João" ou "Mérito" cru quebra em vários clientes de
 * e-mail — o RFC 2047 exige base64 ou quoted-printable nesses casos.
 */
function cabecalhoMime(texto) {
  // eslint-disable-next-line no-control-regex
  if (!/[^\u0000-\u007F]/.test(texto)) return texto;

  const bytes = new TextEncoder().encode(texto);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);

  return `=?UTF-8?B?${btoa(bin)}?=`;
}

/** Corpo em base64: evita problema com acento e com linha longa. */
function corpoBase64(texto) {
  const bytes = new TextEncoder().encode(texto);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);

  /* Linhas de no máximo 76 caracteres, como manda o RFC 2045. */
  return (btoa(bin).match(/.{1,76}/g) || []).join('\r\n');
}

/**
 * Avisa a equipe que chegou lead, pelo Email Routing da Cloudflare.
 *
 * Escolhemos o send_email em vez de um serviço externo por três motivos:
 * não exige conta nova, não exige chave de API guardada como secret, e o
 * mesmo Email Routing dá a caixa privacidade@ que a LGPD exige.
 *
 * A limitação — só entrega para endereços verificados no Email Routing —
 * não atrapalha: o destino é a própria equipe. E é uma salvaguarda, porque
 * impede que alguém use esta função para escrever aos leads.
 *
 * Opcional: sem o binding EMAIL ou sem NOTIFY_TO, o lead é gravado do mesmo
 * jeito e ninguém é avisado — **notificar jamais pode derrubar a captura**.
 */
async function avisarEquipe(env, lead) {
  if (!env.EMAIL || !env.NOTIFY_TO || !env.NOTIFY_FROM) return;

  const linhas = [
    `Nome: ${lead.nome}`,
    `WhatsApp: ${lead.telefone}`,
    `Renda: ${lead.renda || 'não informou'}`,
    lead.planta ? `Planta que estava vendo: ${lead.planta}` : null,
    `Empreendimento: ${lead.empreendimento}`,
    `Origem na página: ${lead.origem || '—'}`,
    '',
    'Pegue o lead no CRM: https://crm.sebastianiimoveis.com.br/leads'
  ].filter(Boolean).join('\n');

  const assunto = `Novo lead: ${lead.nome} — ${lead.empreendimento}`;

  /* MIME montado à mão em vez de trazer uma biblioteca: é um e-mail de
     texto simples, e uma dependência a mais num Worker sem build não se
     paga. CRLF entre cabeçalhos e corpo é obrigatório. */
  const mime = [
    `From: Leads <${env.NOTIFY_FROM}>`,
    `To: <${env.NOTIFY_TO}>`,
    `Subject: ${cabecalhoMime(assunto)}`,
    `Message-ID: <${crypto.randomUUID()}@sebastianiimoveis.com.br>`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="utf-8"',
    'Content-Transfer-Encoding: base64',
    '',
    corpoBase64(linhas)
  ].join('\r\n');

  try {
    const { EmailMessage } = await import('cloudflare:email');

    await env.EMAIL.send(
      new EmailMessage(env.NOTIFY_FROM, env.NOTIFY_TO, mime)
    );
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
