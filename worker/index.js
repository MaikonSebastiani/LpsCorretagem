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

/* Os dois domínios.
 *
 * gruposaitama.com.br é o site do grupo. A raiz dele SERVE a LP de
 * Minha Casa Minha Vida — desde 10/09/2026 a home é ela, e não mais a
 * lista de empreendimentos, que passou a viver em /empreendimentos/.
 * Também aqui ficam /simulacao, /equipe e as LPs de empreendimento.
 *
 * sebastianiimoveis.com.br é a marca Sebastiani. Desde 23/09/2026 a raiz
 * dele SERVE a LP de estratégia (/estrategia/) — o reposicionamento da
 * marca: estratégia antes do imóvel. A LP de investidores, que era a
 * raiz até então, virou página interna em /investidores/. Todo o resto
 * do domínio continua sendo migração e segue para o domínio do grupo
 * com 301.
 *
 * O redirect fica fora do handler de rotas de propósito: precisa rodar
 * ANTES de qualquer outra coisa, inclusive do _redirects (que só é
 * processado dentro de ASSETS.fetch). Sem isso, alguém abrindo
 * /i/nome/urban no domínio antigo pularia direto para a LP sem o
 * utm_source, porque o _redirects rodaria no domínio errado. */
const DOMINIO_SEBASTIANI = 'sebastianiimoveis.com.br';
const DOMINIO_GRUPO = 'gruposaitama.com.br';

/* Onde cada LP de raiz mora no repositório. A raiz de cada domínio é
   REESCRITA para cá (o visitante continua vendo "/"), em vez de
   redirecionada: o endereço do anúncio é o domínio limpo.

   Como a mesma página responde nos dois endereços, o `canonical` dela
   aponta para a raiz — é assim que o Google sabe qual das duas URLs
   indexar. E é por isso que TODO caminho de asset dentro dessas páginas
   precisa ser absoluto: relativo funcionaria em um endereço e quebraria
   no outro, em silêncio. */
const RAIZ_SEBASTIANI = '/estrategia/';
const RAIZ_GRUPO = '/minha-casa-minha-vida/';
const PRIVACIDADE_SEBASTIANI = '/privacidade-sebastiani/';

/* O que o domínio da Sebastiani serve por conta própria. Tudo que não
   estiver aqui é caminho do site antigo e vai para o domínio do grupo.
 *
 * A pasta da raiz precisa estar na lista porque os assets da página
 * apontam para lá em caminho absoluto — sem isso o CSS e o JS da
 * própria LP seriam redirecionados e a página chegaria sem estilo.
 *
 * /api/ também: se um navegador ainda tiver uma página antiga carregada
 * e enviar o formulário, o lead continua sendo gravado. Nunca vale a
 * pena perder um lead por causa de redirect de domínio. */
const CAMINHOS_SEBASTIANI = [
  RAIZ_SEBASTIANI,
  /* LP de investidores: foi a raiz até 23/09/2026, agora é interna. */
  '/investidores/',
  /* Anúncio de imóvel de revenda, marca Sebastiani. */
  '/casa-vila-ester/',
  '/shared/',
  '/privacidade/',
  '/api/',
  /* Servido, não redirecionado: robots.txt atrás de 301 funciona, mas
     custa um salto em toda visita de rastreador. O arquivo é o mesmo
     dos dois domínios. */
  '/robots.txt'
];

/* A página da raiz também existe no caminho da pasta. Nesse endereço ela
   faz 301 para "/": uma página, uma URL. A query string vai junto — é
   nela que viajam utm_* e gclid de quem clicou num link antigo. */
const CAMINHOS_DA_RAIZ = [
  RAIZ_SEBASTIANI,
  RAIZ_SEBASTIANI.slice(0, -1),
  RAIZ_SEBASTIANI + 'index.html'
];

function ehDoDominioDaSebastiani(caminho) {
  if (caminho === '/') return true;
  /* Com a barra no fim, /investidores (sem barra) também casa com
     '/investidores/' — senão ele iria para o outro domínio. */
  const comBarra = caminho.endsWith('/') ? caminho : caminho + '/';
  return CAMINHOS_SEBASTIANI.some((prefixo) => comBarra.startsWith(prefixo));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    /* A pasta da política da Sebastiani não é endereço público (ver a
       reescrita de /privacidade/ mais abaixo). Quem chegar nela direto vai
       para o endereço certo, em um salto só — por isso fica antes de tudo. */
    if (url.pathname.startsWith(PRIVACIDADE_SEBASTIANI)) {
      return Response.redirect('https://' + DOMINIO_SEBASTIANI + '/privacidade/', 301);
    }

    if (url.hostname === DOMINIO_SEBASTIANI) {
      if (CAMINHOS_DA_RAIZ.includes(url.pathname)) {
        url.pathname = '/';
        return Response.redirect(url.toString(), 301);
      }
      if (!ehDoDominioDaSebastiani(url.pathname)) {
        url.hostname = DOMINIO_GRUPO;
        return Response.redirect(url.toString(), 301);
      }
    }

    const handler = ROTAS[url.pathname];
    if (handler) return handler(request, env, ctx);

    /* Raiz de qualquer um dos dois domínios: busca o arquivo da LP
       correspondente mantendo a URL como está. Request novo em vez de
       mexer no original porque Request tem propriedades imutáveis.

       Qualquer hostname que não seja o da Sebastiani cai no grupo —
       inclusive localhost, que é o que faz `wrangler dev` servir a home
       certa. */
    /* Política de privacidade por marca. O endereço é o mesmo nos dois
       domínios (/privacidade/, que é o link em todas as páginas), mas no
       da Sebastiani o arquivo servido é outro: a política do grupo diz
       "Grupo Saitama" do começo ao fim. */
    if (url.hostname === DOMINIO_SEBASTIANI &&
        ['/privacidade', '/privacidade/', '/privacidade/index.html'].includes(url.pathname)) {
      const interno = new URL(request.url);
      interno.pathname = PRIVACIDADE_SEBASTIANI;
      return env.ASSETS.fetch(new Request(interno, request));
    }

    if (url.pathname === '/') {
      const interno = new URL(request.url);
      interno.pathname = url.hostname === DOMINIO_SEBASTIANI
        ? RAIZ_SEBASTIANI
        : RAIZ_GRUPO;
      return env.ASSETS.fetch(new Request(interno, request));
    }

    /* Qualquer outro caminho é arquivo estático. O binding ASSETS também
       aplica o _headers e o _redirects que estão na raiz. */
    return env.ASSETS.fetch(request);
  }
};
