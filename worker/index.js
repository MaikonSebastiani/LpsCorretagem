/**
 * Worker das landing pages.
 *
 * O projeto no Cloudflare é um **Worker com assets estáticos**, não um projeto
 * Pages. Isso muda o roteamento: em Pages, cada arquivo em /functions vira uma
 * rota sozinho; num Worker existe um script de entrada só, e o roteamento é
 * feito aqui na mão.
 *
 * Tudo que não for /api/* cai nos assets — as landing pages e a política
 * de privacidade.
 */

import { onLead } from './lead.js';
import { onSimulacao } from './simulacao.js';

/* O antigo /painel/ foi aposentado: o CRM faz o mesmo e mais. Manter duas
   interfaces sobre o mesmo banco significava toda mudança feita duas vezes —
   e já tinha divergido, porque só o CRM gravava atendido_em. */
const ROTAS = {
  '/api/lead': onLead,
  '/api/simulacao': onSimulacao
};

/* Migração de domínio: sebastianiimoveis.com.br → gruposaitama.com.br.
   301 porque é definitiva — diferente dos redirects do _redirects (raiz,
   /painel/), que são 302 porque ainda podem trocar de destino.

   Fica fora do handler de rotas de propósito: precisa rodar ANTES de
   qualquer outra coisa, inclusive do _redirects (que só é processado
   dentro de ASSETS.fetch). Sem isso, alguém abrindo /i/nome/urban no
   domínio antigo pularia direto para a LP sem o utm_source, porque o
   _redirects rodaria no domínio errado.

   /api/* fica de fora: se um navegador ainda tiver a página antiga
   carregada (aba aberta antes da migração, cache) e enviar o formulário,
   o lead continua sendo gravado — nunca vale a pena perder um lead por
   causa de redirect de domínio. */
const DOMINIO_ANTIGO = 'sebastianiimoveis.com.br';
const DOMINIO_NOVO = 'gruposaitama.com.br';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.hostname === DOMINIO_ANTIGO && !url.pathname.startsWith('/api/')) {
      url.hostname = DOMINIO_NOVO;
      return Response.redirect(url.toString(), 301);
    }

    const handler = ROTAS[url.pathname];
    if (handler) return handler(request, env, ctx);

    /* Qualquer outro caminho é arquivo estático. O binding ASSETS também
       aplica o _headers e o _redirects que estão na raiz. */
    return env.ASSETS.fetch(request);
  }
};
