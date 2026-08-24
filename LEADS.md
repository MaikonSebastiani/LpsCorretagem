# Leads — como funciona e como colocar no ar

Captura, armazenamento e distribuição dos leads das landing pages.

```
Formulário na LP  →  POST /api/lead  →  D1 (tabela leads)  →  /painel/
                                              ↓
                                     e-mail para a equipe
```

O formulário **não abre o WhatsApp**. Ele é o fim do caminho: a pessoa preenche,
vê a confirmação, e a equipe entra em contato pelo painel.

---

## Por que D1 e não planilha

O D1 guarda; o painel é o que faz o processo funcionar. Um banco sem interface
seria inútil para a equipe — e uma planilha compartilhada tem dois problemas que
matam a divisão de leads:

- **Colisão.** Duas pessoas editando a mesma célula não se avisam. No painel, o
  "pegar" é uma condição no `UPDATE`: quem clica primeiro leva, e o segundo
  recebe um aviso de quem já pegou.
- **Fragilidade.** Qualquer um reordena a planilha e embaralha tudo, ou apaga
  uma linha sem querer.

---

## Colocar no ar — 5 passos

### 1. Criar a tabela

```bash
npx wrangler d1 execute leads --remote --file=schema.sql
```

### 2. Ligar o banco ao site

O `wrangler.toml` já declara o binding `DB`. Se o deploy for automático pelo
GitHub, ele também precisa ser criado no painel:

**Workers & Pages → o projeto → Settings → Bindings → D1** — variável `DB`,
banco `leads`.

### 3. Proteger o painel com Cloudflare Access

**Este passo não é opcional.** Sem ele o painel fica aberto na internet com nome
e telefone de todo mundo.

No **Zero Trust → Access → Applications**, crie uma aplicação *Self-hosted*:

- **Domínios:** `gruposaitama.com.br/painel` e `gruposaitama.com.br/api/painel`
- **Política:** *Allow* → *Emails* → os e-mails da equipe
- **Método de login:** One-time PIN (chega por e-mail, não exige conta) ou Google

O plano gratuito do Zero Trust cobre **até 50 usuários** — mais que suficiente.

Depois de criar, copie o **Application Audience (AUD) tag** e o **team domain**
(`suaequipe.cloudflareaccess.com`) e configure como variáveis do projeto:

| Variável | Valor |
|---|---|
| `ACCESS_TEAM_DOMAIN` | `suaequipe.cloudflareaccess.com` |
| `ACCESS_AUD` | o AUD tag da aplicação |

> Sem essas duas variáveis, `/api/painel` **recusa tudo**. Falhar fechado é de
> propósito: uma rota de leads aberta por engano vaza a base inteira.

### 4. Avisar a equipe por e-mail (opcional)

Sem isso, o painel só funciona para quem lembra de abrir. Com uma conta no
Resend (3.000 e-mails/mês grátis), configure:

| Variável | Exemplo |
|---|---|
| `RESEND_API_KEY` | `re_...` |
| `NOTIFY_FROM` | `leads@gruposaitama.com.br` (domínio verificado no Resend) |
| `NOTIFY_TO` | e-mails da equipe, separados por vírgula |

Se faltar qualquer uma, o lead é gravado do mesmo jeito e ninguém é avisado —
**notificar jamais pode derrubar a captura.**

### 5. Criar a caixa de privacidade

A política em `/privacidade/` manda o titular escrever para
`privacidade@gruposaitama.com.br`. A caixa precisa existir e ser lida: a LGPD dá
15 dias para responder.

---

## O painel

`/painel/` — feito para o celular, que é onde os corretores vão usar.

A distribuição é **manual de propósito**: não há rodízio automático nem regra de
atribuição. Quem está livre pega. O papel do painel é dar visão, não decidir.

**Visão de relance**, no topo: quantos leads entraram hoje, quantos nos últimos
7 dias, e quantos estão parados na fila agora (em vermelho).

**Lead esperando há mais de 30 minutos fica com o cartão vermelho.** O combinado
de vocês é atender assim que chega — o painel precisa deixar escancarado quando
isso não aconteceu.

**Busca** por nome ou telefone, e filtros por situação (com contagem em cada) e
por empreendimento — este último só aparece quando há mais de uma LP na base.

**Ações:** pegar, abrir no WhatsApp (link já com o 55), marcar como fechado,
devolver para a fila.

**Baixar CSV** do que está na tela, para quem preferir olhar em planilha.

Atualiza sozinho a cada 45 segundos, só com a aba visível.

### A corrida entre dois corretores

Se duas pessoas clicam em "pegar" ao mesmo tempo, o `UPDATE` só altera a linha
se `atendido_por` ainda estiver vazio. Quem perde recebe 409 e vê de quem é o
lead. É por isso que a atribuição fica no banco e não na interface.

---

## Consultar fora do painel

```bash
npx wrangler d1 execute leads --remote --command "SELECT criado_em, nome, telefone, empreendimento, status, atendido_por FROM leads ORDER BY criado_em DESC LIMIT 30"
```

**Não crie endpoint público de leitura.** A tabela tem dado pessoal; qualquer URL
sem autenticação expõe a base inteira.

---

## LGPD

- Base legal: **consentimento**, marcado no formulário e gravado na coluna
  `consentimento`.
- Coletamos nome, telefone e (opcional) faixa de renda. **Nada de CPF, RG ou
  documento** — a política diz isso explicitamente, para reduzir risco de golpe
  usando o nome de vocês.
- Retenção declarada: **24 meses** após o último contato. Alguém precisa
  efetivamente apagar o que passar disso.
- Pedido de exclusão:

```bash
npx wrangler d1 execute leads --remote --command "DELETE FROM leads WHERE id = 123"
```

---

## Eventos de rastreamento

| Evento | Quando |
|---|---|
| `lead_form_shown` | o modal abriu |
| `lead_submit` | gravou com sucesso — **é esta a conversão do Ads agora** |
| `lead_form_error` | falhou ao gravar |
| `lead_form_abandoned` | fechou sem enviar |

A conversão do Google Ads dispara junto com `lead_submit`. **Não é mais o clique
no WhatsApp.** Quando as campanhas voltarem, a ação de conversão precisa apontar
para este evento.

---

## O que ainda não foi resolvido

**Os outros 14 CTAs continuam abrindo o WhatsApp direto.** Só os 3 com
`data-qualify` (hero, CTA final e barra fixa) abrem o formulário. Ou seja, a
maior parte dos cliques ainda não vira registro no banco, cai no celular de uma
pessoa só, e a mesma página tem dois comportamentos diferentes para "falar com
vocês".

**A busca cobre os últimos 200 leads**, que é o que a API devolve. Quando a
base passar disso e alguém precisar procurar em histórico antigo, dá para
paginar ou buscar no servidor — mas só quando fizer falta.

**Não há limite de envios por IP.** A armadilha de robô no formulário pega o
básico, mas um ataque dirigido enche a tabela. Se acontecer, resolve-se com uma
Rate Limiting Rule no Cloudflare, sem mexer no código.
