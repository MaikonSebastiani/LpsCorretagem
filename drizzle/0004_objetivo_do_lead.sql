-- O que a pessoa quer com o imóvel.
--
-- Morar, investir, sair do aluguel ou ainda avaliando. Nasce com a LP
-- /estrategia/, onde é a PRIMEIRA pergunta do formulário: aquela página
-- parte do princípio de que a estratégia de compra vem antes do imóvel,
-- e sem o objetivo não há estratégia para recomendar.
--
-- Valores aceitos: worker/config.js, OBJETIVOS. O servidor recusa
-- qualquer outra coisa (daLista), então a coluna só recebe as quatro.
--
-- ATENÇÃO À ORDEM: worker/leads.js passa a citar esta coluna no INSERT.
-- Se o worker subir ANTES desta migração rodar, TODO lead do site passa
-- a falhar — não só os de /estrategia/. Rode isto primeiro:
--
--   npx wrangler d1 execute leads --remote --file=drizzle/0004_objetivo_do_lead.sql
--
-- Só adiciona coluna anulável: nenhum dado existente é tocado, e lead
-- antigo simplesmente fica com objetivo NULL.

ALTER TABLE leads ADD COLUMN objetivo TEXT;
