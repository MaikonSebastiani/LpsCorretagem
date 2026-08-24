# Leads — como funciona e como operar

Captura, armazenamento e distribuição dos leads das landing pages.

```
Formulário na LP  →  POST /api/lead  →  D1 "leads"  →  CRM
                                            ↓
                                   e-mail para a equipe (opcional)
```

O formulário **não abre o WhatsApp**. Ele é o fim do caminho: a pessoa
preenche, vê a confirmação, e a equipe entra em contato.

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
├── index.js    roteador: /api/* aqui, todo o resto vai para os assets
└── lead.js     POST /api/lead  — grava no D1
```

### `.assetsignore`

O diretório de assets é a **raiz do repositório**. Sem esse arquivo, o código
do Worker, a documentação interna e o `schema.sql` ficariam acessíveis por URL.

Se acrescentar arquivo que não deve ser público, inclua ali. Para conferir:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://sebastianiimoveis.com.br/schema.sql
# 404 = correto
```

---

## Publicar

```bash
npx wrangler deploy
```

Para testar antes sem afetar quem está no site:

```bash
npx wrangler versions upload      # devolve uma URL de preview
npx wrangler versions deploy      # promove para produção
```

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

## O que ainda falta configurar

### Cloudflare Access — o painel está desprotegido

`/painel/` carrega para qualquer um. **Nenhum dado vaza** — o `/api/painel`
recusa tudo enquanto `ACCESS_TEAM_DOMAIN` e `ACCESS_AUD` não existirem, e a
tela mostra "sem permissão". Mas isso é falhar fechado, não é proteção.

No **Zero Trust → Access → Applications → Self-hosted**, crie uma aplicação com
**duas** destinations:

| Subdomain | Domain | Path |
|---|---|---|
| *(vazio)* | `sebastianiimoveis.com.br` | `painel` |
| *(vazio)* | `sebastianiimoveis.com.br` | `api/painel` |

Política *Allow* → *Emails* da equipe. Login por One-time PIN não exige conta.

⚠️ **Nunca crie destination só com o domínio e Path vazio** — protegeria o site
inteiro, e quem viesse do Google Ads cairia numa tela de PIN em vez da LP.

⚠️ Em *Cookie settings*, **`Enforce cookie path attribute` DESLIGADO**. Ligado,
o cookie vale só para `/painel` e a chamada a `/api/painel` chega sem
autenticação — o painel loga e mostra "sem permissão" para sempre.

Depois, em **Workers & Pages → lpscorretagem → Settings → Variables**:

| Variável | Onde achar |
|---|---|
| `ACCESS_TEAM_DOMAIN` | Zero Trust → Settings → General |
| `ACCESS_AUD` | aba Overview da aplicação |

E republique — variável só entra no próximo deploy.

### Domínio novo

`gruposaitama.com.br` ainda não está registrado. As canônicas, o Open Graph e a
política de privacidade apontam para `sebastianiimoveis.com.br`, que é o que
está no ar.

Quando o novo entrar: trocar em `urban-vila-guilherme/index.html`,
`merito-ipiranga/index.html`, `privacidade/index.html` e `worker/lead.js`, e
criar uma **Redirect Rule 301** do domínio antigo para o novo — senão a
indexação se perde.

### Notificação por e-mail

Sem ela, o painel só funciona para quem lembra de abrir. Com uma conta no
Resend (3.000/mês grátis), configure `RESEND_API_KEY`, `NOTIFY_FROM` e
`NOTIFY_TO`. Faltando qualquer uma, o lead é gravado do mesmo jeito e ninguém é
avisado — **notificar jamais pode derrubar a captura**.

### Caixa de privacidade

A política manda escrever para `privacidade@sebastianiimoveis.com.br`. A caixa
precisa existir e ser lida: a LGPD dá 15 dias para responder.

---

## O CRM

 — projeto , Next.js, mesmo banco.

Existia também um  em HTML puro dentro deste repositório, feito
antes do CRM. **Foi aposentado em 24/08/2026**: fazia a mesma coisa, e manter
duas interfaces sobre o mesmo banco significava toda mudança feita duas vezes.

Elas já tinham divergido — só o CRM gravava , então lead pego
pelo painel antigo nunca mostrava tempo de resposta.

 agora redireciona (302) para o CRM, para quem tiver o link salvo.

> **Falta tirar do Access** as destinations  e . Enquanto
> estiverem lá, o redirecionamento pede login antes de acontecer — funciona,
> mas é um passo a mais sem motivo.

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
| `lead_submit` | gravou com sucesso — **é esta a conversão do Ads agora** |
| `lead_form_error` | falhou ao gravar |
| `lead_form_abandoned` | fechou sem enviar |
| `section_view` | chegou no preço, nas plantas ou no CTA final |
| `faq_open` | abriu uma pergunta |

A conversão do Google Ads dispara junto com `lead_submit`. **Não é mais o
clique no WhatsApp** — quando as campanhas voltarem, a ação de conversão
precisa apontar para este evento.

---

## Verificado em produção (24/08/2026)

- Formulário das duas LPs gravando no D1, com telefone normalizado para
  dígitos, planta, origem, `gclid` e consentimento
- Acentuação íntegra (`João Conceição`, `44,73 m²`)
- `/api/lead` sem nome → 400 · método errado → 405 · `/api/painel` sem
  Access → 403
- Código-fonte, docs e SQL → 404
- **O redirecionamento da raiz preserva a query string** — `?gclid=...` chega
  inteiro na LP, então a atribuição do Ads sobrevive

---

## Ainda não resolvido

**Não há limite de envios por IP.** A armadilha de robô no formulário pega o
básico, mas um ataque dirigido enche a tabela. Resolve-se com uma Rate Limiting
Rule no Cloudflare, sem mexer no código.

**A busca do `/painel/` cobre os últimos 200 leads**, que é o que a API
devolve. Quando a base passar disso, paginar — mas só quando fizer falta.
