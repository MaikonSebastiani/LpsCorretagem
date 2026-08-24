/**
 * /api/painel — leitura e atribuição dos leads. USO INTERNO.
 *
 *   GET  /api/painel            lista os leads
 *   POST /api/painel            { id, acao: 'pegar' | 'devolver' | 'fechar' }
 *
 * ---------------------------------------------------------------------------
 * SEGURANÇA
 *
 * Esta rota devolve nome e telefone de pessoas reais. Ela é protegida em duas
 * camadas, e as duas precisam estar configuradas:
 *
 *   1. Cloudflare Access na frente de /painel* e /api/painel*, com a política
 *      liberando só os e-mails da equipe.
 *   2. A verificação do JWT abaixo, que confere a assinatura do token que o
 *      Access injeta. É defesa em profundidade: se alguém desconfigurar a
 *      política no painel, esta checagem ainda barra.
 *
 * Sem as variáveis ACCESS_TEAM_DOMAIN e ACCESS_AUD configuradas, a rota
 * **recusa tudo**. Falhar fechado é de propósito: uma rota de leads aberta por
 * engano vaza a base inteira.
 * ---------------------------------------------------------------------------
 */

const ACOES = {
  pegar: { status: 'em_atendimento', atribui: true },
  devolver: { status: 'novo', atribui: false },
  fechar: { status: 'fechado', atribui: true }
};

/** base64url → Uint8Array */
function base64url(texto) {
  const b64 = texto.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '==='.slice((b64.length + 3) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function jsonDoSegmento(seg) {
  return JSON.parse(new TextDecoder().decode(base64url(seg)));
}

/**
 * Confere o token do Cloudflare Access e devolve o e-mail de quem entrou,
 * ou null se qualquer coisa não bater.
 */
async function emailAutenticado(request, env) {
  const time = env.ACCESS_TEAM_DOMAIN;
  const aud = env.ACCESS_AUD;
  if (!time || !aud) return null;

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return null;

  const partes = token.split('.');
  if (partes.length !== 3) return null;

  let cabecalho, corpo;
  try {
    cabecalho = jsonDoSegmento(partes[0]);
    corpo = jsonDoSegmento(partes[1]);
  } catch {
    return null;
  }

  /* Público e validade — antes de gastar CPU verificando assinatura. */
  const agora = Math.floor(Date.now() / 1000);
  const publicos = Array.isArray(corpo.aud) ? corpo.aud : [corpo.aud];
  if (!publicos.includes(aud)) return null;
  if (typeof corpo.exp !== 'number' || corpo.exp < agora) return null;
  if (typeof corpo.nbf === 'number' && corpo.nbf > agora) return null;

  /* Chaves públicas do Access. */
  let chaves;
  try {
    const r = await fetch(`https://${time}/cdn-cgi/access/certs`, {
      cf: { cacheTtl: 3600, cacheEverything: true }
    });
    if (!r.ok) return null;
    chaves = (await r.json()).keys || [];
  } catch {
    return null;
  }

  const jwk = chaves.find(k => k.kid === cabecalho.kid);
  if (!jwk) return null;

  try {
    const chave = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const assinado = new TextEncoder().encode(partes[0] + '.' + partes[1]);
    const ok = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      chave,
      base64url(partes[2]),
      assinado
    );

    return ok ? (corpo.email || 'desconhecido') : null;
  } catch {
    return null;
  }
}

const json = (dados, status) => new Response(JSON.stringify(dados), {
  status: status || 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    /* Dado pessoal não pode ficar em cache de lugar nenhum. */
    'Cache-Control': 'no-store'
  }
});

export async function onPainel(request, env) {
  if (!env.DB) return json({ erro: 'banco indisponivel' }, 503);

  const email = await emailAutenticado(request, env);
  if (!email) return json({ erro: 'nao autorizado' }, 403);

  try {
    if (request.method === 'GET') {
      const { results } = await env.DB.prepare(
        `SELECT id, criado_em, empreendimento, nome, telefone, renda, planta, origem,
                gclid, utm_campaign, status, atendido_por
           FROM leads
          ORDER BY criado_em DESC
          LIMIT 200`
      ).all();

      return json({ eu: email, leads: results || [] });
    }

    if (request.method === 'POST') {
      const corpo = await request.json().catch(() => null);
      const id = corpo && Number(corpo.id);
      const acao = ACOES[corpo && corpo.acao];

      if (!id || !Number.isInteger(id) || !acao) {
        return json({ erro: 'requisicao invalida' }, 400);
      }

      /* Pegar só vale se ninguém pegou antes: a condição no WHERE resolve a
         corrida entre dois corretores clicando junto. Quem perde recebe
         "ja_atendido" e vê de quem é. */
      if (corpo.acao === 'pegar') {
        const r = await env.DB.prepare(
          `UPDATE leads
              SET status = ?, atendido_por = ?
            WHERE id = ? AND (atendido_por IS NULL OR atendido_por = ?)`
        ).bind(acao.status, email, id, email).run();

        if (!r.meta || r.meta.changes === 0) {
          const dono = await env.DB.prepare(
            'SELECT atendido_por FROM leads WHERE id = ?'
          ).bind(id).first();
          return json({ erro: 'ja_atendido', por: dono && dono.atendido_por }, 409);
        }

        return json({ ok: true, atendido_por: email });
      }

      await env.DB.prepare(
        `UPDATE leads SET status = ?, atendido_por = ? WHERE id = ?`
      ).bind(acao.status, acao.atribui ? email : null, id).run();

      return json({ ok: true });
    }

    return json({ erro: 'metodo nao permitido' }, 405);
  } catch (erro) {
    console.error('painel:', erro && erro.message);
    return json({ erro: 'falha interna' }, 500);
  }
}
