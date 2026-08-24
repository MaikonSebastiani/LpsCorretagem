# Leads — como funciona e como operar

Captura, armazenamento e distribuição dos leads das landing pages.

```
Formulário na LP  →  POST /api/lead  →  D1 "leads"  →  CRM
                                            ↓
                                   e-mail para a equipe (opcional)
```

O formulário **não abre o WhatsApp**. Ele é o fim do caminho: a pessoa
preenche, vê a confirmação, e a equipe entra em contato pelo CRM.

---

## Arquitetura — leia antes de mexer

O projeto no Cloudflare (`lpscorretagem`) é um **Worker com assets estáticos**,
**não** um projeto Pages. Isso muda três coisas:

1. **Não existe pasta `functions/`.** Aquela convenção — um arquivo por rota,
   roteamento automático — é exclusiva do Pages. Aqui há um script de entrada
   só, `worker/index.js`, que roteia à mão.
2. **Bindings vêm do `wrangler.toml`**, não do painel. A partir do momento em
   que esse arquivo existe no repositório, ele é a fonte da verdade e as
   configurações do painel deixam de valer.
3. **Deploy é manual.** Não há integração com o GitHub — `git push` não
   publica nada.

```
worker/
├── index.js    roteador: /api/lead aqui, todo o resto vai para os assets
└── lead.js     POST /api/lead — grava no D1
```

### `.assetsignore`

O diretório de assets é a **raiz do repositório**. Sem esse arquivo, o código
do Worker, a documentação interna e o `schema.sql` ficariam acessíveis por URL.

Se acrescentar arquivo que não deve ser público, inclua ali. Para conferir:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://sebastianiimoveis.com.br/schema.sql
```

`404` é o resultado correto.

---

## Publicar

```bash
npx wrangler deploy
```

Para testar antes sem afetar quem está no site:

```bash
npx wrangler versions upload
npx wrangler versions deploy
```

O primeiro devolve uma URL de preview; o segundo promove para produção.

> Em terminal não interativo o wrangler trava esperando confirmação. Canalize
> um stdin vazio: `echo "" | npx wrangler ...`

Se algo quebrar, `npx wrangler rollback` volta para a versão anterior.

---

## Banco

```bash
npx wrangler d1 migrations apply leads --remote
```

As migrations moram no **repositório do CRM** (`saitama-crm/drizzle/`), que é
quem evoluiu o schema. O `schema.sql` daqui é a referência da tabela base.

Consultar:

```bash
npx wrangler d1 execute leads --remote --command "SELECT criado_em, nome, telefone, status FROM leads ORDER BY criado_em DESC LIMIT 30"
```

**Não crie rota pública de leitura.** A tabela tem dado pessoal; qualquer URL
sem autenticação expõe a base inteira.

---

## O CRM

`crm.sebastianiimoveis.com.br` — projeto `saitama-crm`, Next.js, mesmo banco.

Existia também um `/painel/` em HTML puro dentro deste repositório, feito antes
do CRM. **Foi aposentado em 24/08/2026**: fazia a mesma coisa, e manter duas
interfaces sobre o mesmo banco significava toda mudança feita duas vezes.

Elas já tinham divergido — só o CRM gravava `atendido_em`, então lead pego pelo
painel antigo nunca mostrava tempo de resposta, que é justamente a métrica que
a equipe combinou perseguir.

`/painel/` agora redireciona (302) para o CRM, para quem tiver o link salvo.

> **Falta tirar do Access** as destinations `painel` e `api/painel`. Enquanto
> estiverem lá, o redirecionamento pede login antes de acontecer — funciona,
> mas é um passo a mais sem motivo.

---

## Cloudflare Access ✅ configurado

Uma aplicação só, `sebastianiimoveis.com.br`, com o CRM como destination. O AUD
é por aplicação, então os dois Workers usam o mesmo — uma política, um login,
uma sessão.

| Onde | Valor |
|---|---|
| Team domain | `plain-grass-964d.cloudflareaccess.com` |
| Login | One-time PIN (código por e-mail, sem conta) |

As variáveis `ACCESS_TEAM_DOMAIN` e `ACCESS_AUD` estão no `wrangler.toml` de
cada projeto. Não são segredos — aparecem na URL de redirecionamento do login.

**Sem elas, `/api/painel` e o CRM recusam tudo.** Falhar fechado é intencional:
um painel aberto por engano vaza a base inteira de dados pessoais.

### Dois erros que quebram tudo

⚠️ **Destination só com o domínio e Path vazio** protegeria o site inteiro, e
quem viesse do Google Ads cairia numa tela de PIN em vez da landing page.
(Vale para as LPs; no CRM o Path vazio é correto, porque lá não há página
pública.)

⚠️ **`Enforce cookie path attribute` ligado** faz o cookie valer só para o
caminho da destination. Uma chamada a outro caminho chega sem autenticação, e a
tela mostra "sem permissão" para sempre.

---

## O que ainda falta

### Domínio novo

`gruposaitama.com.br` não está registrado. As canônicas, o Open Graph e a
política apontam para `sebastianiimoveis.com.br`, que é o que está no ar.

Quando o novo entrar: trocar em `urban-vila-guilherme/index.html`,
`merito-ipiranga/index.html`, `privacidade/index.html`, `worker/lead.js` e no
`_redirects`, e criar uma **Redirect Rule 301** do domínio antigo para o novo —
senão a indexação se perde.

### Notificação por e-mail

Sem ela, o CRM só funciona para quem lembra de abrir. Com uma conta no Resend
(3.000/mês grátis), configure `RESEND_API_KEY`, `NOTIFY_FROM` e `NOTIFY_TO`.
Faltando qualquer uma, o lead é gravado do mesmo jeito e ninguém é avisado —
**notificar jamais pode derrubar a captura**.

### Caixa de privacidade

A política manda escrever para `privacidade@sebastianiimoveis.com.br`. A caixa
precisa existir e ser lida: a LGPD dá 15 dias para responder.

### Conversão do Google Ads

Precisa apontar para **`lead_submit`**. Não é mais o clique no WhatsApp — se
religar campanha com a ação antiga, ela nunca dispara.

---

## LGPD

- Base legal: **consentimento**, marcado no formulário e gravado na coluna
  `consentimento`.
- Coletamos nome, telefone e (opcional) faixa de renda. **Nada de CPF, RG ou
  documento** — a política diz isso explicitamente, para reduzir risco de golpe
  usando o nome de vocês.
- Retenção declarada: **24 meses** após o último contato. Alguém precisa
  efetivamente apagar o que passar disso.

```bash
npx wrangler d1 execute leads --remote --command "DELETE FROM leads WHERE id = 123"
```

---

## Rastreamento

| Evento | Quando |
|---|---|
| `lead_form_shown` | o modal abriu |
| `lead_submit` | gravou com sucesso — **é esta a conversão do Ads** |
| `lead_form_error` | falhou ao gravar |
| `lead_form_abandoned` | fechou sem enviar |
| `section_view` | chegou no preço, nas plantas ou no CTA final |
| `faq_open` | abriu uma pergunta |

---

## Verificado em produção (24/08/2026)

- Formulário das duas LPs gravando no D1, com telefone normalizado para
  dígitos, planta, origem, `gclid` e consentimento
- Acentuação íntegra (`João Conceição`, `44,73 m²`)
- `/api/lead` sem nome → 400 · método errado → 405
- Código-fonte, docs e SQL → 404
- LPs e política de privacidade abertas; CRM pedindo código do Access
- **O redirecionamento da raiz preserva a query string** — `?gclid=...` chega
  inteiro na LP, então a atribuição do Ads sobrevive

---

## Ainda não resolvido

**Não há limite de envios por IP.** A armadilha de robô no formulário pega o
básico, mas um ataque dirigido enche a tabela. Resolve-se com uma Rate Limiting
Rule no Cloudflare, sem mexer no código.

**O CRM lista 100 leads por vez.** Suficiente por bastante tempo; paginar
quando fizer falta.
