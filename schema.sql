-- Banco de leads das landing pages — Cloudflare D1.
--
-- Para aplicar (uma vez, e de novo sempre que este arquivo mudar):
--   npx wrangler d1 execute leads --remote --file=schema.sql
--
-- Para ler os leads, use o wrangler ou o painel do Cloudflare:
--   npx wrangler d1 execute leads --remote --command "SELECT * FROM leads ORDER BY criado_em DESC LIMIT 50"
--
-- NÃO criar endpoint público de leitura: a tabela tem dado pessoal e
-- qualquer URL sem autenticação exporia a base inteira.

CREATE TABLE IF NOT EXISTS leads (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,

  -- ISO 8601 em UTC, gravado pelo servidor (não confiar em data do cliente)
  criado_em      TEXT    NOT NULL,

  -- 'urban-vila-guilherme' ou 'merito-ipiranga'
  empreendimento TEXT    NOT NULL,

  nome           TEXT    NOT NULL,

  -- Só dígitos, como veio do formulário (ex.: 11987654321). Formatar é
  -- problema de quem lê, não de quem grava.
  telefone       TEXT    NOT NULL,

  -- Opcional de propósito: exigir a faixa de renda aumentaria o abandono.
  renda          TEXT,

  -- Metragem do card de planta que abriu o formulário, quando foi por ali.
  -- Diz ao corretor o que a pessoa estava olhando antes de pedir contato.
  planta         TEXT,

  -- data-source do CTA que abriu o formulário (hero, final, mobile_fixed…)
  origem         TEXT,

  -- Texto do botão em que a pessoa clicou, exatamente como estava escrito
  -- ("Receber proposta", "Falar com um corretor"…). O `origem` diz de que
  -- SEÇÃO veio; este diz qual PROMESSA converteu — é o que permite trocar
  -- a copy de um CTA e medir se a troca funcionou.
  cta            TEXT,

  -- Atribuição do Google Ads. As LPs são exclusivas de Ads, então o gclid
  -- é o que liga o lead de volta à campanha que o trouxe.
  gclid          TEXT,
  utm_source     TEXT,
  utm_medium     TEXT,
  utm_campaign   TEXT,
  utm_term       TEXT,
  utm_content    TEXT,

  pagina         TEXT,

  -- LGPD: registro de que a pessoa marcou o aceite.
  consentimento  INTEGER NOT NULL DEFAULT 0,

  -- Divisão do lead na equipe. Preenchidos por vocês, não pelo site.
  atendido_por   TEXT,
  status         TEXT    NOT NULL DEFAULT 'novo'
);

-- Fila de atendimento: o que chegou primeiro e ainda não foi pego.
CREATE INDEX IF NOT EXISTS idx_leads_fila
  ON leads (status, criado_em);

-- Relatório por campanha.
CREATE INDEX IF NOT EXISTS idx_leads_campanha
  ON leads (empreendimento, criado_em);
