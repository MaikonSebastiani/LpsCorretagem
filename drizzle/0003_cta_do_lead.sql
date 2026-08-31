-- Qual CTA converteu.
--
-- `origem` (data-source) já dizia de que SEÇÃO da página o lead veio, mas
-- não qual botão: as sete plantas do Mérito e as seis do Urban compartilham
-- origem='floorplans', e trocar a copy de um CTA não deixava rastro nenhum.
-- Esta coluna guarda o texto do botão como estava escrito na tela.
--
-- Como aplicar (uma vez):
--   npx wrangler d1 execute leads --remote --file=drizzle/0003_cta_do_lead.sql
--
-- Só adiciona coluna anulável: nenhum dado existente é tocado, e lead
-- antigo simplesmente fica com cta NULL (a interface mostra "—").

ALTER TABLE leads ADD COLUMN cta TEXT;
