# Home do Grupo Saitama — Minha Casa Minha Vida / busca por perfil

Landing page que capta **quem sabe quanto ganha mas ainda não escolheu
empreendimento**. A porta de entrada é a renda, não o prédio: a pessoa
diz o que tem, e o consultor devolve o que cabe.

Criada em 10/09/2026 a partir do layout aprovado (`projeto.png`, com as
artes `bg`, `mcmv` e `footer`). Assina **Grupo Saitama**, como o resto do
domínio — o layout entregue vinha com a marca Sebastiani, trocada em
10/09/2026.

---

## Onde ela é servida

| Endereço | O que acontece |
|---|---|
| `https://gruposaitama.com.br/` | **É a home do site.** O worker reescreve `/` para `/minha-casa-minha-vida/` — a URL que o visitante vê continua sendo a raiz |
| `https://gruposaitama.com.br/minha-casa-minha-vida/` | Mesma página, servida direto pelo caminho do repositório |

O `canonical` aponta sempre para a raiz, então o Google trata o segundo
endereço como cópia do primeiro — e só a raiz entra no `sitemap.xml`.

O roteamento está em [`worker/index.js`](../worker/index.js), em
`RAIZ_GRUPO`. É o mesmo mecanismo que já servia a LP de investidores na
raiz de `sebastianiimoveis.com.br`; agora os dois domínios passam pelo
mesmo bloco.

> **Por isso todo caminho de asset no HTML é absoluto**
> (`/minha-casa-minha-vida/assets/...`). Caminho relativo funcionaria em
> um dos dois endereços e quebraria no outro, em silêncio — a home
> chegaria sem CSS e sem formulário.

### O que aconteceu com a home antiga

A lista de empreendimentos, que era a raiz até 10/09/2026, foi movida
para **`/empreendimentos/`**. O arquivo é o mesmo; o que mudou:

- os caminhos relativos dele (`css/`, `js/`, `assets/images/`) viraram
  **absolutos** — os arquivos continuam na raiz do repositório, e sem
  isso a página passaria a procurá-los em `/empreendimentos/css/...`;
- `canonical` e `og:url` passaram a apontar para o endereço novo;
- os links rotulados "Empreendimentos" em `/equipe/` e `/simulacao/`
  passaram a apontar para lá. O `href="/"` da **marca** continua como
  estava em todas as páginas: ele significa "home do site", e a home do
  site agora é esta LP.

O rodapé desta página linka `/empreendimentos/`. Sem isso a lista
ficaria órfã: a home é a página que mais empurra rastreamento para
dentro do site.

---

## O que precisa ser resolvido antes de anunciar

Estão marcados no código com `PREENCHER` ou `FALTA`.

- [ ] **`og:image`** — falta um JPEG 1200×630 em
      `assets/images/og-image.jpg`. As quatro metas prontas estão
      comentadas no `<head>`; é só descomentar depois de subir o arquivo.
      Sem ele o WhatsApp mostra só título e descrição. **Não use render de
      empreendimento da Cury**: dá a impressão de que a página vende
      aquele prédio, e ela não vende nenhum.
- [x] ~~**CRECI**~~ Cadastrado em 18/09/2026: `CRECI-SP 334069`, no
      rodapé (`.rodape__creci`). A LP tinha um parágrafo legal maior com
      esse "PREENCHER" antes; ele foi removido a pedido em 14/09/2026,
      então o CRECI voltou como uma linha só, sem o resto do texto.
- [x] ~~**Ação de conversão própria no Google Ads.**~~ Cadastrada em
      14/09/2026: `AW-18388777321/0EzSCKr2xPccEOnyucBE`, em
      `ADS_CONVERSAO` no `assets/js/main.js`. Dispara em `converter()`,
      chamado só depois do POST em `/api/simulacao` voltar 204 — é o
      lead gravado que conta como conversão, não o clique no botão.
- [ ] **Depoimentos.** A seção `#depoimentos` existe no HTML com `hidden`
      e um roteiro de ativação de 5 passos no comentário acima dela. Os
      nomes lá dentro são marcadores, **não clientes**. Ver "Depoimentos"
      abaixo.
- [ ] **Favicon definitivo** — o monograma "S" de Saitama, dourado sobre
      marinho. Como esta página virou a home, ele passou a ser o ícone
      principal do domínio (a home antiga não tinha nenhum). Faltam os PNG
      (16, 32, 192, 512) e o `apple-touch-icon`: SVG cobre os navegadores
      atuais, mas não o atalho de tela inicial no iOS.

---

## Para onde vai o lead

**Para o banco, não para o WhatsApp.** O formulário faz `POST` em
`/api/simulacao` e o lead entra na tabela `leads` com `empreendimento`
nulo — score, deduplicação, distribuição e histórico funcionam como nas
LPs de lançamento. Decisão de 10/09/2026.

Nenhuma linha do backend precisou mudar para esta página existir:
`/api/simulacao` já era o endpoint de quem é captado **antes** de
escolher o que comprar, e é exatamente esse o público daqui.

Consequência prática, para não ser descoberta depois: **o formulário é o
fim do caminho.** Não existe WhatsApp abrindo atrás para salvar o
contato, então uma gravação que falhe em silêncio perde o lead de vez.
Por isso o `main.js` espera a resposta do servidor e mostra a tela de
erro quando ela não vem — nunca uma tela de sucesso otimista. Se um dia
alguém "simplificar" isso para responder na hora, é esse o dano.

A LP de investidores faz o contrário (CTA direto para o WhatsApp) porque
lá o público é outro; ver `investidores/README.md`.

### Onde o formulário fica

**Dentro do hero, na primeira dobra** (13/09/2026). No desktop ele é a
segunda coluna da grade, ao lado do texto; no celular vem logo depois da
headline. A seção `#perfil`, que existia entre o hero e o "Como
funciona", deixou de existir — ela era um clique a mais entre a pessoa e
a primeira pergunta.

Os CTAs que sobraram (cabeçalho, MCMV, fechamento, barra fixa) não levam
mais a uma seção: no desktop rolam de volta ao hero; no celular reabrem
**o mesmo** `<dialog>` como modal, preservando o que já foi respondido,
porque é o mesmo DOM.

> **O retorno do formulário ao hero não depende do evento `close` do**
> **`<dialog>`.** Quem observa é um `MutationObserver` no atributo `open`.
> O Esc fecha sem passar por código nosso, e o `close` não é confiável em
> todo lugar — no navegador embutido usado para testar esta página ele
> simplesmente não chega. Um formulário que some da home é caro demais
> para depender de um evento que pode não vir.

### O quiz e as listas fechadas

**Três etapas, quatro perguntas** (13/09/2026). As perguntas são as
mesmas de antes; o que mudou é que vêm agrupadas duas a duas, porque o
que trava o preenchimento é o tamanho APARENTE do formulário, não o
número de cliques. Cada resposta é uma chave, nunca o rótulo: o valor em
reais de cada faixa é reajustado pelo programa, e um lead de hoje
precisa continuar significando a faixa vigente na data em que entrou.

| Etapa | Perguntas | Listas canônicas em `worker/config.js` |
|---|---|---|
| 1 — Perfil | renda + entrada | `RENDAS` (6), `ENTRADAS` (5) |
| 2 — Preferências | regiao + momento | `REGIOES` (6), `MOMENTOS` (5) |
| 3 — Contato | nome + WhatsApp + consentimento | — |

Cada pergunta é um `[data-campo]` dentro da etapa, e as opções são fichas
que quebram em linha (`.quiz__chips`): com 11 botões de largura inteira a
etapa 1 não caberia na primeira dobra.

**O "Continuar" não exige resposta.** Toda pergunta tem uma saída honesta
("Prefiro não dizer", "Ainda não sei"), mas quem quer só chegar ao fim
passa direto e o campo vai nulo. Bloquear ali seria trocar contato por
dado na etapa em que a pessoa ainda não investiu nada.

**O campo de e-mail saiu** em 13/09/2026: o WhatsApp é o canal, e um campo
opcional a mais na etapa que já pede nome e telefone só pesa.

**A autoridade é `worker/config.js`.** O servidor recusa qualquer valor
que não esteja lá, e o projeto não tem build — as opções estão repetidas
à mão no HTML. Ao mexer numa lista, mexa nos dois lugares.

Como o projeto não tem teste automatizado, a conferência é esta, rodada
da raiz do repositório:

```bash
node --input-type=module -e "import('./worker/config.js').then(async c=>{const fs=await import('node:fs');const h=fs.readFileSync('minha-casa-minha-vida/index.html','utf8');const p={};for(const m of h.matchAll(/data-campo=\"(\w+)\"([\s\S]*?)<\/div>\s*<\/div>/g))p[m[1]]=[...m[2].matchAll(/data-valor=\"([^\"]+)\"/g)].map(x=>x[1]);for(const[k,v]of Object.entries({renda:c.RENDAS,entrada:c.ENTRADAS,regiao:c.REGIOES,momento:c.MOMENTOS})){const fora=(p[k]||[]).filter(x=>!v.includes(x));console.log(k,fora.length?'FORA DA LISTA: '+fora:'ok')}})"
```

A validação de telefone (11 dígitos, DDD real da Anatel, o 9 do
assinante) está duplicada entre `assets/js/main.js` e `worker/campos.js`
pelo mesmo motivo. **Se um mudar, o outro muda junto** — a lista de DDDs
tem buracos que "dois dígitos quaisquer" deixava passar.

---

## Rastreamento

`shared/origem.js` cuida de UTM, `gclid`, `fbclid` e referrer: guarda na
sessão na primeira visita e anexa a cada evento. **Nada disso entra no
corpo da mensagem** — vai só para o GA4 e para as colunas de origem.

Eventos:

| Evento | Quando |
|---|---|
| `view_minha_casa_minha_vida` | carregou a página |
| `lead_form_shown` | clique em qualquer CTA, com `source` |
| `lead_form_started` | primeira resposta marcada |
| `lead_form_step` | cada resposta, com `step` |
| `lead_submit` | **gravou no banco — é esta a conversão do Ads** |
| `lead_generated` | idem, com `tipo` |
| `lead_form_error` | com `motivo`: `validacao` ou `rede` |
| `section_view` | `perfil`, `mcmv`, `cta_final` — uma vez por sessão |
| `faq_open` | com `question` |

`data-source` em inglês, como manda o `PADRAO-LP.md`:
`header` · `mobile_menu` · `mcmv` · `final` · `mobile_fixed`. O `hero` saiu
quando o formulário subiu para dentro do hero: não existe mais CTA ali, o
formulário é a própria ação. O `section_view` perdeu a chave `perfil` pelo
mesmo motivo — a seção deixou de existir; continuam `mcmv` e `cta_final`.

> **As chaves do observador em `main.js` são ids de seção.** Se um `id`
> mudar no HTML, o `section_view` correspondente para de disparar em
> silêncio — nada quebra, o número só some do relatório.

---

## A voz do texto: primeira pessoa do PLURAL

"Comparamos as opções", "acompanhamos você", "Atendimento direto com
consultor". O layout entregue vinha em primeira pessoa do singular ("Eu
comparo", "Atendimento direto comigo"), que é a voz natural de uma marca
pessoal — e a marca virou o Grupo Saitama em 10/09/2026.

A troca foi deliberada e alinha esta página com `/simulacao/` e
`/empreendimentos/`, que já falavam "nossa equipe". **Se voltar ao
singular, volte em todos os lugares**: são 20 trechos entre o HTML (copy,
`<title>`, `description`, `og:description`) e o `main.js` (as três
mensagens de erro e a tela de "pronto"). Meia troca deixa a página
falando como duas pessoas diferentes.

---

## Regras de conteúdo desta página

Ela fala de um programa do governo, o que muda o que pode ser dito.

- **Nada de "você tem direito a X".** Enquadramento é decisão do agente
  financeiro. A página diz isso na última linha da lista do `#mcmv` e no
  FAQ, e a tela final do formulário não promete enquadramento a quem
  ficou fora das faixas ou preferiu não dizer a renda.
- **Nenhum número cravado de subsídio.** O valor depende de renda, região
  e da faixa vigente, e muda por portaria — cravar aqui é criar uma
  promessa que envelhece sozinha. Por isso o texto fala em "subsídio que
  pode reduzir o valor financiado", não em reais.
- **Sem preço, sem "a partir de", sem parcela.** A página não vende
  unidade, qualifica perfil. E o `PADRAO-LP.md` é explícito: *nunca
  publicar "parcelas a partir de R$ X"* — estaria errado para quase todo
  mundo.
- **Sem vitrine de empreendimento.** A seção `#apartamento` lista
  critérios, não prédios. Card com nome e foto define o tamanho da oferta
  na cabeça de quem lê — quem procura a Zona Leste conclui "não tem o que
  eu quero" e sai — e lista publicada envelhece a cada tabela. É a mesma
  decisão da LP de investidores. Não reintroduza cards sem confirmar.
- **Não inventar escassez.** Nada de cronômetro ou "últimas unidades".
- **Nunca bloquear o lead.** Toda pergunta tem saída para quem não quer
  responder ("Prefiro não dizer", "Ainda não sei").
- **Se uma regra do programa mudar**, a lista do `#mcmv` e a resposta
  correspondente no FAQ mudam **juntas**.

### Depoimentos

A seção está pronta e **oculta**. Publicar depoimento inventado é
propaganda enganosa e destrói exatamente a confiança que a seção existe
para construir. Para ativar, na ordem:

1. Colete **de 2 a 3 casos reais**. O `PADRAO-LP.md` pede o mínimo de 2 —
   com um só, a página lê como "eles têm exatamente um cliente".
2. Cada caso precisa de **autorização de uso de imagem por escrito**,
   assinada junto com o resto da papelada. Verbal não sustenta.
3. Troque as frases, os nomes (primeiro nome + inicial) e a região. Com
   menos de três casos, apague os cards que sobrarem em vez de repetir.
4. Remova o `hidden` da `<section id="depoimentos">`.
5. Acrescente `<a href="#depoimentos">Depoimentos</a> ` ao menu do
   cabeçalho e ao rodapé — hoje o link não existe justamente porque a
   seção está oculta.

---

## Sistema visual

A pele é a mesma da LP de investidores — **marinho profundo + dourado
sobre creme**, títulos em serifada de sistema (Georgia), nenhuma fonte
externa. O arquivo é próprio (`assets/css/styles.css`), não um import: as
duas páginas falam com públicos opostos e vão divergir, e um arquivo
compartilhado faria um ajuste de conversão aqui mexer na página que já
está no ar com campanha ativa. **As variáveis de cor precisam continuar
iguais nas duas** — se a marca mudar de tom, os dois arquivos mudam
juntos.

Duas diferenças deliberadas:

- **`--ground` é `#fcf8f2`**, não o `#faf7f2` da outra página: é a cor
  exata do creme desenhado dentro das artes. Com o outro tom aparecia uma
  emenda visível na borda esquerda das imagens, justamente onde a arte
  deveria se dissolver no fundo.
- **Não existe véu sobre o hero.** Na LP de investidores a foto cobre a
  seção inteira e o texto precisa de um gradiente para ser legível. Aqui a
  arte **já vem com o creme e a curva desenhados à esquerda**: o texto não
  fica sobre a foto, fica sobre a parte creme da própria imagem.

O cabeçalho é transparente e `position: absolute`, não `fixed`: barra
fixa no topo rouba altura de primeira dobra no celular, e a página já tem
a barra de CTA fixa embaixo.

---

## As imagens

Quatro artes entregues em PNG, somando **5,3 MB**. Publicar o original
devolveria o LCP para a casa dos segundos, que em tráfego pago é dinheiro
jogado fora.

| Nome | Origem | O que é | Variantes |
|---|---|---|---|
| `hero-*` | `bg` (1672×941) | torre ao entardecer, com o creme e a curva à esquerda | 900 / 1400 / 1672 |
| `hero-mob-*` | `bg`, recorte `left:800 w:872` | **só a torre** | 560 / 840 |
| `familia-*` | `mcmv`, recorte `left:880 w:792` | a família, para o `#mcmv` | 520 / 792 |
| `faixa-*` | `footer` (2172×724) | faixa marinho com skyline em linha | 1200 / 2172 |
| `logo-mcmv.webp` | `minha-casa-minha-vida.webp` | logo oficial do programa | 340×340 |

Todas em **AVIF + WebP**. O hero saiu de 2,0 MB para **27 KB** (AVIF, 900)
a **66 KB** (AVIF, 1672).

**Por que existe um recorte separado de celular.** No desktop a metade
esquerda da arte é o creme onde o texto se apoia. No celular esse creme
vira área morta ocupando altura de primeira dobra, então o texto sobe
para cima do creme da *página* e a imagem vira uma faixa com só a torre.
São dois `<link rel="preload">` com `media` no `<head>` justamente para o
celular não baixar as duas versões.

**Se a arte for trocada, gere as variantes de novo.** O script está em
`scratchpad/img/mcmv.mjs` (sharp: `extract` + `resize` + `toFormat`);
qualquer compressor serve, desde que mantenha os mesmos nomes e as mesmas
proporções — os atributos `width`/`height` do HTML precisam bater com o
arquivo real, senão a imagem distorce em vez de só falhar em evitar CLS.

### O logo do Minha Casa Minha Vida

O arquivo entregue tinha o **xadrez de transparência achatado nos
pixels** (quadrados `#efefef` e `#ffffff` de verdade, não alpha) — como
se alguém tivesse salvo a captura de tela do editor. O tratamento
substituiu esse cinza neutro por branco puro e aparou a moldura; o logo
em si só tem cor saturada, preto e branco, então nada da arte foi
atingido. Ele fica sobre um cartão branco no `#mcmv`, que é onde essa
correção some.

---

## Antes de publicar

O checklist técnico completo é o do `PADRAO-LP.md`. O que foi verificado
em 10/09/2026, nesta página:

- [x] Um único `<h1>`, sem salto de nível entre títulos
- [x] Nenhum `id` duplicado; todo `aria-labelledby` aponta para id existente
- [x] Toda âncora do menu e do rodapé resolve
- [x] Toda imagem com `alt`, `width` e `height`; nenhum `<img src="">`
- [x] Só a imagem do hero sem `loading="lazy"`
- [x] Sem scroll horizontal a 375px
- [x] Sem erro no console
- [x] As 22 opções do quiz conferidas contra `worker/config.js`
- [x] Roteamento de raiz: `/` serve esta LP nos dois domínios certos,
      `sebastianiimoveis.com.br` continua servindo a LP de investidores e
      redirecionando o resto, e `/empreendimentos/` carrega com CSS e
      imagens depois da mudança de caminho
- [x] Validação: campo vazio, DDD inexistente (20) e telefone fixo recusados
- [x] Telas de sucesso e de erro do formulário, e o "tentar novamente"
- [ ] `og:image` — ver a pendência no topo (CRECI e conversão do Ads já resolvidos)

**A LP não foi testada contra o worker rodando.** `npx wrangler dev` fica
em laço de recarga neste repositório (o diretório de assets é a raiz, e o
próprio wrangler escreve em `.wrangler/`), então a verificação foi feita
com um servidor estático e o `fetch` do formulário observado com um duplo.
O payload enviado bate campo a campo com o que `worker/simulacao.js`
espera. **Confirme uma gravação de verdade antes de ligar a campanha** —
um lead de teste, e depois apague.
