/**
 * Worker das landing pages.
 *
 * O projeto no Cloudflare é um **Worker com assets estáticos**, não um projeto
 * Pages. Isso muda o roteamento: em Pages, cada arquivo em /functions vira uma
 * rota sozinho; num Worker existe um script de entrada só, e o roteamento é
 * feito aqui na mão.
 *
 * Tudo que não for /api/* cai nos assets — as próprias landing pages, o
 * painel, a política de privacidade.
 */

import { onLead } from './lead.js';
import { onPainel } from './painel.js';

const ROTAS = {
  '/api/lead': onLead,
  '/api/painel': onPainel
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const handler = ROTAS[url.pathname];
    if (handler) return handler(request, env, ctx);

    /* Qualquer outro caminho é arquivo estático. O binding ASSETS também
       aplica o _headers e o _redirects que estão na raiz. */
    return env.ASSETS.fetch(request);
  }
};
