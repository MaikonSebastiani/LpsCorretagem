# LP de estratégia — Sebastiani | Estratégia Imobiliária

Landing page do **reposicionamento da marca**: o produto vendido aqui não
é um imóvel, é a decisão de compra. A frase que rege tudo:

> Eu não começo pelo imóvel. Eu começo pela estratégia da compra.

É a segunda página do repositório a assinar **Sebastiani** (a outra é
`/investidores/`). As demais são do Grupo Saitama.

---

## AINDA NÃO PUBLICADA

A página existe só no repositório. Antes de subir, ver
**"Antes de publicar"** no fim deste arquivo — em especial a migração do
banco, que precisa rodar **antes** do deploy do worker.

Para ver localmente:

```bash
npx --yes http-server . -p 8790 -c-1
```

E abrir `http://localhost:8790/estrategia/`. O formulário só grava de
verdade com o worker no ar (`npx wrangler dev`), porque depende de
`/api/simulacao` e do D1.

---

## Estrutura

Nove áreas. Não segue as 12 do `PADRAO-LP.md` porque aquele padrão
descreve LP **de lançamento** — aqui não existe decorado, planta,
localização nem "aluguel × parcela". Mantidos do padrão: um CTA por
seção, `data-source` em inglês, barra fixa no celular e as ressalvas
legais.

| # | Seção | `id` | Pergunta que responde |
|---|-------|------|----------------------|
| 1 | Hero | `#inicio` | O que você faz? |
| 2 | Posicionamento | `#metodo` | Por que isso é diferente? |
| 3 | Estratégias | `#estrategias` | Quais caminhos existem? |
| 4 | Como funciona | `#como-funciona` | Como é o processo? |
| 5 | Diferencial | `#diferencial` | Por que confiar? |
| 6 | Casos | `#casos` | **Desligada** — ver abaixo |
| 7 | FAQ | `#duvidas` | Ainda tenho dúvidas |
| 8 | Fechamento | `#contato` | Qual é o próximo passo? |
| 9 | Rodapé | — | — |

A ordem responde as perguntas na sequência em que elas aparecem na
cabeça de quem chega. **Posicionamento antes de estratégias**, de
propósito: apresentar os três caminhos antes de explicar que existe um
método transforma a página em cardápio de produto, que é exatamente o
que o reposicionamento saiu de.

---

## O CTA é um só

**"Analisar meu cenário"**, em todos os pontos da página. Não alternar
entre CTAs diferentes: a página tem uma ação principal só, e cada
variação de rótulo dilui a que importa.

O WhatsApp aparece como alternativa (botão vazado, nunca dourado) para
quem prefere contato direto. Ele **não pode competir visualmente** com o
CTA principal — se um dia virar botão sólido, o formulário perde volume
e o lead deixa de entrar no CRM.

`data-source` usados, sempre em inglês:

`header` · `mobile_menu` · `hero` · `hero_whatsapp` · `process` ·
`modal_lancamentos` · `modal_leiloes` · `modal_tradicional` · `final` ·
`final_whatsapp` · `mobile_fixed` · `form_success` · `form_error`

---

## O formulário

Modal de **4 etapas**, em `<dialog>`, gravando em **`/api/simulacao`** —
o mesmo endpoint da `/simulacao` e da home. Nada de backend novo: o que
mudou foi um campo (ver adiante).

| Etapa | Pergunta | Campo |
|---|---|---|
| 1 | O que pretende fazer | `objetivo` |
| 2 | Renda e entrada disponível | `renda`, `entrada` |
| 3 | Momento e FGTS | `momento`, `fgts` |
| 4 | Nome, WhatsApp e região | `nome`, `telefone`, `regiao` |

**Todas as perguntas são obrigatórias.** As saídas honestas ("Ainda
estou avaliando", "Não sei") continuam nas opções por transparência, mas
precisam ser clicadas.

**O formulário NÃO abre o WhatsApp ao enviar.** Ele é o fim do caminho:
se a gravação falhar em silêncio, o lead se perde de vez. Por isso o
cliente espera o 204 e mostra a tela de erro quando ele não vem — nunca
uma tela de sucesso otimista.

O modal é o **mesmo DOM** sempre: quem desiste na etapa 3, fecha e
reabre, encontra o que já respondeu ainda marcado.

### As listas de valores vivem em dois lugares

Os `data-valor` do HTML espelham `worker/config.js` (`OBJETIVOS`,
`RENDAS`, `ENTRADAS`, `MOMENTOS`, `FGTS`, `REGIOES`). **A autoridade é o
servidor**: ele recusa qualquer valor fora da lista, e o campo chega
vazio no banco sem erro nenhum. Mexer numa lista aqui sem mexer lá é uma
falha silenciosa — o lead entra, só que incompleto.

Para conferir que não divergiram:

```bash
node --input-type=module -e "import {readFileSync} from 'node:fs'; const c=await import('./worker/config.js'); const h=readFileSync('estrategia/index.html','utf8'); for (const [campo,nome] of Object.entries({objetivo:'OBJETIVOS',renda:'RENDAS',entrada:'ENTRADAS',momento:'MOMENTOS',fgts:'FGTS'})) { const t=h.split('data-campo=\"'+campo+'\"')[1].split('</div>')[0]; const v=[...t.matchAll(/data-valor=\"([^\"]+)\"/g)].map(m=>m[1]); const fora=v.filter(x=>!c[nome].includes(x)); console.log((fora.length?'ERRO ':'ok   ')+campo+' '+(fora.length?fora:'')); }"
```

### Região é lista fechada, não campo livre

O conteúdo original pedia "Região de interesse" como texto livre. Virou
`<select>` porque `regiao` é validada contra `REGIOES` no servidor:
texto livre seria **descartado**, o lead entraria sem região e ninguém
perceberia. A opção vazia ("Prefiro falar sobre isso na conversa") vai
como `null`, para o `COALESCE` do servidor não apagar uma região que a
pessoa já tenha informado em outro formulário.

As regiões de hoje são só da capital. Se o atendimento passar a cobrir
outras praças de verdade (o leilão é nacional), a lista precisa crescer
em `worker/config.js` primeiro.

---

## O que mudou no backend

Tudo **aditivo**: nenhuma LP existente muda de comportamento.

1. **`objetivo`, coluna nova** (`drizzle/0004_objetivo_do_lead.sql`).
   Quatro valores em `OBJETIVOS`. É a primeira pergunta desta página —
   sem o objetivo não existe estratégia para recomendar. Não pontua no
   score: objetivo não diz se o lead está perto de comprar, diz que
   conversa ter com ele.
2. **Duas faixas de entrada novas**: `30k-100k` e `acima-100k`. São um
   recorte **dentro** de `acima-30k`, que continua válido e continua
   sendo o que a `/simulacao` usa — lead antigo não muda de significado,
   e um relatório que queira o agregado soma as duas.
   Os pesos das duas são iguais ao de `acima-30k` de propósito:
   `tetoDaConfiguracao()` em `scoring.js` soma o maior peso de cada
   grupo, então um peso maior levantaria o teto e rebaixaria em silêncio
   o score de todo mundo que já está no banco.

> **ORDEM DO DEPLOY.** `worker/leads.js` cita `objetivo` no INSERT. Se o
> worker subir antes da migração rodar, **todo lead do site passa a
> falhar** — não só os desta LP. A migração primeiro, sempre.

---

## A seção de casos está desligada

`#casos` nasce com `hidden`. A regra da marca é **não inventar
depoimento, número, economia nem nome de cliente**, e um carrossel com
caso fictício é exatamente o tipo de prova que destrói a confiança que a
página inteira tenta construir.

O passo a passo para ligar está num comentário dentro do próprio HTML,
acima da seção. O resumo: **2 a 3 casos reais** (com um só, a página lê
como "ele tem exatamente um cliente"), preencher os `<article
class="caso">`, tirar o `hidden` e acrescentar `casos` ao objeto
`SECOES` em `assets/js/main.js` para o `section_view` passar a ser
medido.

---

## Regras de conteúdo desta página

- **Nada de clichê de corretor.** Fora: "realize o sonho da casa
  própria", "o imóvel dos seus sonhos", "oportunidade imperdível", "não
  perca essa chance", "transforme seus sonhos em realidade".
- **Não prometer lucro, valorização nem oportunidade garantida.** O
  leilão é descrito como *análise*, nunca como desconto certo — a
  ressalva viaja junto da promessa, dentro do próprio modal, e não só no
  rodapé.
- **Não listar imóvel, preço nem empreendimento.** A página não é
  vitrine: o que ela vende é a análise. Card com nome e foto define o
  tamanho da oferta na cabeça de quem lê, e lista publicada envelhece a
  cada tabela.
- **Não inventar escassez.** Nada de cronômetro ou "últimas unidades".
- **Toda seção institucional começa pelo cenário do cliente**, nunca
  pelo produto. A ordem mental é: situação → diagnóstico → estratégia →
  imóvel → ação.

---

## Sistema visual

Preto e dourado, **sem terceira cor**. A paleta está em `:root`, no topo
do CSS.

- **O dourado é destaque, nunca superfície.** Aparece em CTA, ícone,
  linha, número e palavra grifada. Grande área dourada faz a página
  parecer anúncio de ostentação, que é o oposto do posicionamento.
- **Dourado sólido leva texto PRETO**, não branco: `#c9a54b` com branco
  não chega a 4.5:1 e o rótulo sumiria no celular sob sol. Com preto a
  relação passa de 8:1.
- **O recurso de destaque é o título bicolor**, via `<em class="ouro">`,
  sempre dentro de um `.titulo` ou `.hero__titulo`, nunca solto.
- **Sem fonte externa, de propósito.** Georgia faz o papel da serifada.
  O LCP desta página é o próprio `<h1>` — uma requisição de fonte na
  frente dele atrasaria justamente o elemento medido. Se um dia entrar
  uma Cormorant ou DM Serif, ela precisa vir com `font-display: swap` e
  `preload`, senão o título pisca.

### A primeira dobra não tem imagem

Decisão de projeto, não pendência. Render de prédio na primeira dobra diz
"esta página vende aquele prédio", que é o contrário do posicionamento —
e foi justamente por isso que a foto da LP de investidores (a torre da
Cury ao entardecer) **não** foi reaproveitada aqui. O peso visual vem da
tipografia, do brilho radial e do painel da direita.

Efeito colateral bom: o LCP é texto, sem requisição nenhuma na frente
dele.

**Se um dia entrar a foto profissional do Sebastiani** (ambiente
executivo, preto e dourado, como na referência), ela vira o fundo do
hero e precisa: entrar como `<img>` dentro de `<picture>` (nunca
`background-image`, que só começa a baixar depois do CSS e não aceita
`fetchpriority`), ter `preload` no `<head>`, `width`/`height` no HTML, e
variantes AVIF/WebP geradas. O padrão está em
`investidores/README.md`, "A foto do hero".

### Duas armadilhas já encontradas aqui

- **`backdrop-filter` aninhado.** O painel do menu do celular é filho de
  `.topo`, que tem `backdrop-filter` quando rolado. Com um
  `backdrop-filter` próprio, o filho amostra o backdrop do **pai** em vez
  da página, e o hero aparecia legível atrás dos itens do menu mesmo com
  98% de opacidade. O painel usa cor **sólida** e nenhum filtro.
- **O evento `close` do `<dialog>` não chega em todo navegador** — não
  chega no embutido usado para testar esta página, e o mesmo já tinha
  sido descoberto na home. Quem detecta o fechamento é um
  `MutationObserver` no atributo `open`, e é ele que solta a trava de
  rolagem do `<html>`. Com o evento, a página ficava **sem rolar** depois
  que a pessoa fechava o modal. Não trocar de volta.

---

## Rastreamento

Eventos: `view_estrategia`, `section_view` (`metodo`, `estrategias`,
`processo`, `cta_final`), `strategy_modal_open`, `faq_open`,
`whatsapp_click`, `lead_form_shown`, `lead_form_started`,
`lead_form_step`, `lead_form_error`, `lead_form_abandoned`,
`lead_submit`, `lead_generated`.

Os de rolagem disparam **uma vez por sessão**. **As chaves do observador
em `main.js` são ids de seção** — se um id mudar no HTML, o evento para
de disparar em silêncio.

UTM, `gclid` e `fbclid` são lidos da URL, guardados na sessão por
`/shared/origem.js` e anexados aos eventos e ao lead. **Nunca entram na
mensagem do WhatsApp.**

---

## Antes de publicar

- [ ] **Rodar a migração 0004** (ver "ORDEM DO DEPLOY" acima). É a única
      pendência que quebra o site inteiro se for esquecida.
- [ ] **Ação de conversão própria no Google Ads.** `ADS_CONVERSAO` está
      **vazio** em `assets/js/main.js`, então nenhuma conversão é
      disparada hoje. Precisa de rótulo próprio, no formato
      `AW-18388777321/XXXXXXXXXXXX`: aqui a conversão é o **lead
      gravado**, que não significa a mesma coisa que o clique no WhatsApp
      da LP de investidores. Somar as duas na mesma ação faria o Smart
      Bidding otimizar dois eventos de valor diferente como se fossem um.
- [x] ~~**Decidir o endereço.**~~ Raiz de `sebastianiimoveis.com.br` desde
      23/09/2026: `RAIZ_SEBASTIANI` em `worker/index.js`, canonical e og:url
      na raiz, robots `index, follow`. `/estrategia/` faz 301 para `/`.
      Ficou pendente: sitemap (o `sitemap.xml` é do gruposaitama) e a
      regra de `Cache-Control` em `_headers`.
- [ ] **`og:image`** — JPEG 1200×630 em `assets/images/og-image.jpg`. As
      quatro metas prontas estão comentadas no `<head>`. Sem ele o
      WhatsApp mostra só título e descrição. Não usar render de
      empreendimento: dá a impressão de que a página vende aquele prédio.
- [x] ~~**CRECI no rodapé.**~~ CRECI-SP 334069, acrescentado em
      20/09/2026. Aparece também na faixa de confiança do Urban — se o
      número mudar, os dois mudam juntos.
- [ ] **Razão social e CNPJ**, se o atendimento passar a ser por pessoa
      jurídica. Marcado com `PREENCHER` no HTML.
- [ ] **Favicon definitivo** — hoje há só um monograma provisório em SVG.
      Falta o conjunto de PNG e o `apple-touch-icon`.
- [ ] **Casos reais**, se e quando houver (ver acima).
