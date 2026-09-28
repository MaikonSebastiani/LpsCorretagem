/**
 * Aviso de lead novo por e-mail, pelo Email Routing da Cloudflare.
 *
 * Compartilhado entre /api/lead e /api/simulacao — ANTES desta divisão,
 * só o /api/lead avisava a equipe; a /simulacao (e a home, que passou a
 * usar o mesmo endpoint em 10/09/2026) gravava o lead e ninguém era
 * notificado. Descoberto em 14/09/2026, sem ninguém ter percebido antes
 * porque o lead sempre chegava certo no banco — só o e-mail nunca saía.
 *
 * A montagem do e-mail (cabeçalho MIME, base64 do corpo) é idêntica nos
 * dois chamadores; só o CONTEÚDO do corpo muda, porque cada formulário
 * pede campos diferentes. Por isso mora aqui, e cada endpoint só monta
 * as próprias `linhas` e o próprio `assunto`.
 *
 * Opcional: sem o binding EMAIL ou sem NOTIFY_TO/NOTIFY_FROM, a função
 * não faz nada — notificar jamais pode derrubar a captura do lead.
 */

/**
 * Codifica um cabeçalho MIME que tenha caractere fora do ASCII.
 *
 * Um assunto com "João" ou "Mérito" cru quebra em vários clientes de
 * e-mail — o RFC 2047 exige base64 ou quoted-printable nesses casos.
 */
function cabecalhoMime(valor) {
  // eslint-disable-next-line no-control-regex
  if (!/[^ -]/.test(valor)) return valor;

  const bytes = new TextEncoder().encode(valor);

  /* Uma palavra codificada não pode passar de 75 caracteres. Descontando
     o "=?UTF-8?B?" e o "?=", sobram 63 para o base64; como base64 anda de
     4 em 4, usamos 60 — o que corresponde a 45 bytes de entrada. */
  const palavras = [];

  for (let i = 0; i < bytes.length; ) {
    let fim = Math.min(i + 45, bytes.length);

    /* O corte precisa cair ENTRE caracteres. Byte de continuação em UTF-8
       começa com 10xxxxxx; enquanto for um deles, estamos no meio de um
       caractere — recua. Partir um "ç" ao meio produz exatamente o lixo
       que esta função existe para evitar. */
    while (fim < bytes.length && (bytes[fim] & 0xc0) === 0x80) fim--;

    palavras.push(`=?UTF-8?B?${base64(bytes.subarray(i, fim))}?=`);
    i = fim;
  }

  /* Palavras seguidas se separam com CRLF + espaço (a "dobra"). Esse
     espaço some na leitura, então não vira espaço extra no assunto. */
  return palavras.join('\r\n ');
}

/** Bytes em base64. Sem Buffer: o Worker não roda Node. */
function base64(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** Corpo em base64: evita problema com acento e com linha longa. */
function corpoBase64(valor) {
  /* Linhas de no máximo 76 caracteres, como manda o RFC 2045. */
  return (base64(new TextEncoder().encode(valor)).match(/.{1,76}/g) || [])
    .join('\r\n');
}

/**
 * Avisa a equipe que chegou lead.
 *
 * @param {object} env
 * @param {object} carga
 * @param {string} carga.assunto  linha do Subject (vai para cabecalhoMime)
 * @param {Array<string|null>} carga.linhas  corpo, uma linha por item;
 *   `null` é descartado — assim o chamador pode incluir uma linha
 *   condicional com `condicao ? 'texto' : null` sem montar array à parte.
 */
export async function avisarEquipe(env, { assunto, linhas }) {
  if (!env.EMAIL || !env.NOTIFY_TO || !env.NOTIFY_FROM) return;

  const corpo = linhas.filter((l) => l !== null).join('\n');

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
    corpoBase64(corpo)
  ].join('\r\n');

  try {
    const { EmailMessage } = await import('cloudflare:email');
    await env.EMAIL.send(new EmailMessage(env.NOTIFY_FROM, env.NOTIFY_TO, mime));
  } catch (erro) {
    console.error('falha ao avisar equipe:', erro && erro.message);
  }
}
