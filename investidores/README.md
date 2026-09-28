# LP de investidores — Sebastiani Imóveis

Landing page que capta **quem compra imóvel para investir**, e não quem
compra para morar. Oferece dois caminhos no mesmo lugar:

1. **Lançamento na planta**, nas unidades **R2V** dos empreendimentos da
   Cury — a categoria de mercado, sem o enquadramento das unidades HIS;
2. **Assessoria em leilão** de imóvel, do garimpo à imissão na posse.

É a única página do repositório que assina a marca **Sebastiani
Imóveis**. As demais são do Grupo Saitama.

---

## Onde ela é servida

| Endereço | O que acontece |
|---|---|
| `https://sebastianiimoveis.com.br/investidores/` | **Endereço oficial desde 23/09/2026.** Até então esta LP era a raiz do domínio; a raiz agora serve a `/estrategia/` |
| `https://gruposaitama.com.br/investidores/` | Mesma página, servida direto pelo caminho do repositório |

O `canonical` aponta sempre para `https://sebastianiimoveis.com.br/investidores/`,
então o Google trata o segundo endereço como cópia do primeiro.

O roteamento está em `worker/index.js`. Antes desta LP, o domínio
`sebastianiimoveis.com.br` inteiro fazia 301 para `gruposaitama.com.br`;
agora só os caminhos que **não** são desta página fazem — a lista está
em `CAMINHOS_SEBASTIANI`.

> **Se você criar um arquivo novo fora de `/investidores/`, `/shared/`
> ou `/privacidade/` e a página passar a precisar dele, acrescente o
> caminho em `CAMINHOS_INVESTIDORES`.** Sem isso ele será redirecionado
> para o outro domínio e a página quebra em silêncio, só no domínio de
> produção — nunca em `localhost`.

Por isso **todos os caminhos de asset no HTML são absolutos**
(`/investidores/assets/...`). Caminho relativo funcionaria em
`/investidores/` e quebraria na raiz do domínio.

---

## O que precisa ser preenchido antes de anunciar

Estão marcados no código com `PREENCHER` ou `FALTA`:

- [ ] **`og:image`** — falta um JPEG 1200×630 em
      `assets/images/og-image.jpg`. As quatro metas prontas estão
      comentadas no `<head>`; é só descomentar depois de subir o
      arquivo. Sem ele o WhatsApp mostra só título e descrição.
      Não use render de empreendimento da Cury: dá a impressão de que a
      página vende aquele prédio.
- [ ] **CRECI da pessoa jurídica.** Ia na faixa de confiança (hoje com o
      texto genérico "Atendimento com corretor registrado") e na linha
      legal do rodapé. Como essa linha foi removida em 14/09/2026, hoje
      só resta a faixa de confiança — e o rodapé, que é onde o mercado
      espera encontrar o registro, ficou sem lugar para ele.
- [ ] **Ancorar "a maior construtora de São Paulo".** A página de prêmios
      da Cury não faz essa afirmação — o mais forte que ela traz é
      *"entre as 10 maiores do Brasil"* (Ranking ITC, 2021) e *5º lugar*
      em 2024. A frase aparece em três pontos desta LP e é o único
      superlativo dela. Se um concorrente contestar, é bom ter a fonte à
      mão.

> **Nota sobre as outras LPs, que não é pendência desta página.** Ao
> conferir `cury.net/sobre-a-cury/premios` em 09/09/2026, os números
> ficaram assim, palavra por palavra: *Top Imobiliário* em 13 anos
> (2008–2012, 2017–2023 e 2025, em três categorias, em São Paulo),
> *Master Imobiliário* 11 vezes, *ADEMI* por 10 anos — e a ADEMI é a do
> Rio de Janeiro. As LPs de empreendimento e o `PADRAO-LP.md` trazem
> **33x / 13x / 14x**, que a página oficial da Cury não sustenta hoje.
> Fica registrado para quem for mexer naqueles arquivos.
- [x] ~~**Ação de conversão própria no Google Ads.**~~ Cadastrada em
      10/09/2026: `AW-18388777321/bzB-CI2f2vIcEOnyucBE`, em
      `ADS_CONVERSAO` no `assets/js/main.js`. É uma ação **separada** da
      das outras LPs, e precisa continuar sendo: aqui a conversão é o
      clique no WhatsApp, que não significa a mesma coisa que o lead
      gravado delas. Somar as duas na mesma ação faria o Smart Bidding
      otimizar dois eventos de valor diferente como se fossem um.
      Dispara uma vez por clique, nos sete CTAs, com
      `transport_type: 'beacon'` — sem o beacon, o navegador cancelaria
      a requisição ao trocar de aba para o WhatsApp e a conversão se
      perderia justamente nos cliques que converteram.
- [ ] **Favicon definitivo** — hoje existe só um monograma provisório em
      SVG (`assets/icons/favicon.svg`). Falta o conjunto de PNG e o
      `apple-touch-icon`, como nas LPs de empreendimento.
- [ ] **Conferir a regra de remuneração do leilão.** A página afirma, na
      seção `#remuneracao` e no FAQ, que o percentual é *combinado por
      escrito antes do primeiro lance* e que *só existe remuneração se
      houver arrematação*. Se a sua prática for outra (honorário de
      análise cobrado à parte, por exemplo), corrija **nos dois lugares**.

---

## Contato: WhatsApp direto

**Esta é a única LP do repositório em que o CTA vai direto para o
WhatsApp.** Decisão do cliente, em 09/09/2026. As LPs de empreendimento
abrem um formulário que grava no banco, porque lá o lead é dividido
entre a equipe e um lead fora do painel não chega a ninguém — aqui o
público é investidor, o volume é menor e a conversa começa antes.

O que isso custa, para não ser descoberto depois:

- **O lead não entra na tabela `leads`.** Sem score, sem deduplicação,
  sem histórico no CRM. O registro do contato passa a ser a própria
  conversa no WhatsApp.
- **A conversão do Google Ads passa a ser o clique**, não o lead
  gravado. Clique é sinal mais fraco: alguém pode abrir o WhatsApp e
  nunca enviar a mensagem. Se um dia o custo por lead desta campanha
  parecer bom demais comparado ao das outras, é aqui que está a
  explicação — os números não medem a mesma coisa.

**Todos os botões mandam a mesma mensagem**, por decisão de 09/09/2026:
a pessoa abre o WhatsApp com uma frase só, independente de onde clicou.
Antes cada CTA tinha um texto próprio, e quem atendia sabia pela
mensagem se o clique veio do cartão do leilão ou do lançamento. Essa
informação não se perdeu, continua no GA4 em `source` e `cta` do evento
`whatsapp_click`, mas deixou de chegar em quem responde. Se um dia isso
incomodar no atendimento, é voltar a diferenciar o `data-message` por
seção.

O texto vive em **dois lugares**: o `data-message` de cada botão no HTML
e a constante `PADRAO` em `assets/js/main.js`, que é o texto usado
quando um botão não tem `data-message`. Se mudar, mude nos dois.

**UTM, `gclid` e `fbclid` nunca entram na mensagem** — vão só para o
GA4, junto do evento `whatsapp_click`.

O número (`5511953713310`) aparece em **dois lugares**: a constante
`WHATSAPP` em `assets/js/main.js` e o `href` de cada botão no HTML. Ele
está nos dois de propósito — o `href` é a rede de segurança para quem
estiver sem JavaScript. **Se o número mudar, mude nos dois**, senão quem
está sem JS continua caindo na linha antiga.

Para reverter para formulário, o padrão está em
`novo-mundo-carrao/assets/js/main.js`. Nada no backend precisou mudar
para esta LP existir.

---

## Área de atuação: os dois caminhos não cobrem o mesmo mapa

- **Lançamento na planta: só São Paulo capital**, porque depende de onde
  a Cury constrói.
- **Leilão: todo o Brasil**, porque a análise é feita sobre matrícula,
  edital e certidões, e os leilões são eletrônicos.

Essa assimetria é argumento de venda, não ressalva escondida: para quem
mora fora de São Paulo, é ela que mantém um caminho aberto em vez de
fechar a página. Por isso ela aparece em **seis lugares**, e se a
atuação mudar, todos precisam mudar juntos:

1. a `<meta name="description">` e a `og:description`, no `<head>`;
2. os dois primeiros selos do hero ("São Paulo" e "Todo o Brasil");
3. a faixa de confiança, logo abaixo do hero;
4. a linha `.via__onde` de cada cartão em `#caminhos` ("SÓ EM SÃO PAULO"
   e "EM TODO O BRASIL");
5. a primeira linha do comparativo, "Onde atuamos";
6. o FAQ, na resposta sobre qual caminho faz mais sentido.

## Regras de conteúdo desta página

Ela vende investimento, o que muda o que pode e o que não pode ser dito.

- **O argumento da planta é a diferença entre a tabela de lançamento e o
  preço de imóvel pronto** — comprar barato e sair no preço cheio. Não é
  "parcela que cabe no bolso": esse é o discurso das LPs de
  empreendimento, para quem vai morar, e aqui ele enfraquece a página. O
  parcelamento aparece só onde é resposta de comparação (capital
  imobilizado), nunca como promessa.
- **Nunca prometer rentabilidade, valorização ou prazo de retorno.** A
  diferença de preço é descrita como *mecanismo* — a incorporadora
  reajusta a tabela conforme a obra avança —, nunca como resultado
  garantido. A página diz explicitamente, em quatro pontos, que não há
  garantia. Se alguém pedir para tirar essas ressalvas, elas são
  exatamente o que faz o texto poder existir.
- **Toda descrição de leilão é geral.** Praça, valor mínimo, débitos que
  acompanham o imóvel e prazos mudam conforme a modalidade e o edital —
  o texto diz isso em vários pontos, e essas ressalvas não devem virar
  afirmação categórica.
- **A seção de riscos existe nos dois caminhos, de propósito.** Quem
  investe compara risco; página que só lista vantagem é lida como
  propaganda, e isso derruba justamente a confiança de que ela depende.
- **O risco nº 1 da planta é o ATRASO DA OBRA**, não a correção do saldo
  nem a análise de crédito. Para quem investe, prazo é o que trava a
  saída e mantém o capital parado. E é essa linha que sustenta o
  argumento seguinte, em destaque: **é por isso que trabalhamos com a
  Cury** — em investimento na planta, quem constrói pesa mais do que o
  desconto. Os dois aparecem juntos na tabela e no bloco de riscos; se
  mexer em um, mexa no outro.
- **A análise do leilão é NOSSA, não do investidor.** Matrícula, edital,
  ocupação, débitos e a conta de viabilidade são o serviço que se está
  vendendo — a linha "Trabalho da sua parte" diz "Baixo" nos dois
  caminhos por causa disso. Não reescreva a coluna do leilão como se
  fosse o cliente quem lê documento: isso descreve o problema, não a
  solução, e é o contrário do que a página oferece.
- **Sem vitrine de empreendimento** (decisão de 09/09/2026). A página não
  lista prédio, não mostra foto de lançamento e não linka para as LPs do
  Grupo Saitama. Dois motivos: card com nome e foto define o tamanho da
  oferta na cabeça de quem lê — quem procura a Zona Oeste conclui "não
  tem o que eu quero" e sai —, e lista publicada envelhece a cada tabela.
  O que a página vende é **acesso à carteira da Cury na capital
  inteira**; o estoque real vem na conversa. Não reintroduza cards sem
  confirmar.
- **Sem preço de unidade**, pela mesma razão. Os valores mudam a cada
  tabela; repetir aqui criaria mais um lugar para atualizar, que é
  exatamente onde aparece preço vencido.
- **Sem lista de prêmios da Cury** (decisão de 09/09/2026), ao contrário
  das LPs de empreendimento. Contagem de troféu é linguagem de quem vende
  apartamento para morar; para quem investe, o que responde "posso
  confiar?" é escala de entrega e cumprimento de prazo. A faixa de
  confiança carrega três fatos — com quem trabalhamos, onde atuamos e
  quem atende — e o argumento da construtora aparece onde ele resolve
  alguma coisa: ao lado do risco de atraso da obra.
- **Sem contagem de estoque** ("últimas unidades R2V", número de
  unidades). Vira manutenção a cada venda.

---

## Sistema visual

Alinhado ao layout aprovado da Sebastiani: **marinho profundo + dourado,
sobre creme**. Duas cores e um fundo, mais nada.

- Títulos em **serifada de sistema** (`Georgia`), texto em sem serifa. O
  layout pede o ar de serifa alta; carregar uma fonte externa custaria
  uma requisição na frente do LCP, que aqui é o próprio `<h1>`.
- **Dois tons de dourado com papéis distintos**, e não é preciosismo:
  `--acento` (`#96682a`) é o de botão, escurecido até passar 4.5:1 com
  texto branco; `--acento-claro` (`#c9a15c`) é o de texto sobre marinho,
  onde a relação se inverte. O dourado do layout, mais claro, não atinge
  contraste AA com branco — em botão, o rótulo sumiria no celular ao sol.
- **O recurso de destaque é o título bicolor**: metade em marinho, metade
  em dourado, via `<em class="ouro">`. Sempre dentro de um `.titulo` ou
  `.hero__titulo`, nunca solto.
- **O cabeçalho é transparente** e fica em `position: absolute` sobre o
  creme do hero, não `fixed`: barra fixa no topo rouba altura de
  primeira dobra no celular, e a página já tem a barra de CTA fixa
  embaixo. Como o fundo é claro, o texto do menu é escuro. Se um dia a
  barra voltar a ser marinho, são quatro regras de cor em `.topo`.
- **O hero copia a referência**: texto à esquerda sobre creme, foto à
  direita sangrando até a borda da janela, com a borda esquerda
  esfumada para a imagem se dissolver no fundo em vez de cortar reto.
  A margem negativa que produz a sangria depende de `--largura`; se o
  container mudar de largura, ela acompanha sozinha.
- Verde e terracota, que codificavam os dois caminhos na versão
  anterior, **saíram** — eram um terceiro e um quarto sistema de cor
  competindo com a marca. Os caminhos continuam distinguíveis dentro da
  paleta: **planta = dourado, leilão = marinho**, repetido em selo,
  borda e coluna da tabela.

## Estrutura

Sete áreas. Eram dez até 09/09/2026 — a revisão de conversão cortou
três e encolheu o resto.

| # | Seção | `id` | Pergunta que responde |
|---|-------|------|----------------------|
| 1 | Hero | — | Qual é a vantagem? |
| 2 | Faixa de confiança | — | Com quem estou falando? |
| 3 | Os dois caminhos | `#caminhos` | Qual deles é o meu caso? |
| 4 | Comparativo | `#comparar` | E na hora de decidir? |
| 5 | Remuneração | `#remuneracao` | Quanto vocês cobram? |
| 6 | FAQ | `#faq` | Travei em uma coisa só |
| 7 | Fechamento | `#contato` | Falar agora |

Não segue as 12 áreas do `PADRAO-LP.md` porque aquele padrão descreve LP
**de lançamento** — não existe aqui decorado, planta, localização nem
"aluguel × parcela". Mantidos do padrão: um CTA por seção, `data-source`
em inglês, barra fixa no celular e as ressalvas legais. Quebrado de
propósito: o CTA vai para o WhatsApp em vez do formulário.

`data-source` usados: `header` · `mobile_menu` · `hero` · `launches` · `auction` ·
`final` · `mobile_fixed`.

Eventos: `whatsapp_click` (com `source` e `cta`), `section_view`
(`caminhos`, `comparativo`, `remuneracao`, `cta_final`), `faq_open` e
`view_investidores`. Os de rolagem disparam uma vez por sessão. **As
chaves do observador em `main.js` são ids de seção** — se um id mudar no
HTML, o observador para de disparar em silêncio.

### O que foi cortado, e por quê

A página vendia bem e ensinava demais. Investidor não lê uma aula antes
de chamar: quer ver a vantagem, sentir que existe algo que ele ainda não
sabe, e perguntar. Cada bloco removido tirava um motivo de conversar.

- **"Por que estas duas e não comprar um pronto"** (3 cartões) — virou
  meia linha no hero ("abaixo do mercado"). Ninguém precisa de três
  cartões para entender que vitrine é caro.
- **As duas caixas "O que pode dar errado"** (9 itens) — eram o bloco
  mais didático e o que mais esfriava a leitura. O risco não sumiu:
  virou **uma linha na tabela**, e cada lado vem com a virada de
  argumento colada (a Cury de um lado, a nossa análise do outro). Risco
  que se resolve na frente do leitor vende; risco em lista assusta.
- **Os passo a passo** ("como a operação acontece", "como a assessoria
  funciona", 9 passos) — explicavam exatamente o que o consultor tem
  para explicar no WhatsApp. Viraram três bullets de vantagem por
  caminho.
- **"Quem somos"** (3 cartões) — o que provava já está na faixa de
  confiança, em uma linha.
- **Comparativo: de 7 linhas para 5.** Saíram "como você sai" e "faz
  mais sentido para" — descreviam mecânica sem mover ninguém.
- **FAQ: de 8 para 4.** Ficaram as que destravam; saíram as que
  ensinavam mercado.

**O que NÃO pode ser cortado**, mesmo em nome de enxugar: a ressalva de
retorno na primeira dobra e a resposta sobre remuneração. A primeira é o
que permite a página falar de investimento; a segunda é a primeira
pergunta de quem investe, e a resposta é boa demais para ficar escondida.

### O texto legal do rodapé foi removido

Em 14/09/2026, por decisão do cliente. Primeiro encurtado de onze linhas
para quatro, depois retirado por inteiro.

Duas consequências, registradas aqui e num comentário no HTML:

1. **A única ressalva que sobrou é a nota da primeira dobra**, dentro do
   hero, e ela fala só de retorno, prazo e liquidez. Não cobre contrato,
   edital nem disponibilidade de unidade — e a página faz afirmação de
   preço ("abaixo do mercado", "abaixo do valor de avaliação").
2. **O CRECI da pessoa jurídica perdeu o lugar.** Ele ia justamente
   nessa linha do rodapé. Continua pendente e continua precisando de um
   endereço na página.

---

## Comparativo: como editar sem quebrar o celular

A tabela de `#comparar` vira cartões empilhados abaixo de 860px, e o
rótulo da coluna reaparece pelo atributo `data-rotulo` de cada `<td>`.

**Ao acrescentar uma linha, o `data-rotulo` é obrigatório.** Sem ele, no
celular a resposta aparece sem dizer de qual caminho é — e a página
inteira existe para distinguir os dois.

---

## A foto do hero

Uma imagem só na página inteira: a torre ao entardecer, cobrindo o hero
inteiro como fundo, com a copy por cima e o cabeçalho transparente
flutuando no topo. **Ela é o LCP**, e por isso:

- entra como `<img>` dentro de um `<picture>`, nunca como
  `background-image` (background só começa a baixar depois de o CSS ser
  lido e não aceita `fetchpriority`);
- tem `<link rel="preload">` no `<head>`, apontando para o AVIF;
- tem `width`/`height` no HTML, para não causar CLS.

O original entregue tinha **2,2 MB em PNG**. As variantes ficaram assim:

| Largura | AVIF | WebP |
|---|---|---|
| 900 | 40 KB | 65 KB |
| 1400 | 80 KB | 127 KB |
| 1672 | 102 KB | 161 KB |

**Se a arte for trocada, gere as seis variantes de novo.** Publicar o
arquivo original direto devolve o LCP para a casa dos segundos, que em
tráfego pago é dinheiro jogado fora. O script usado está em
`scratchpad/img/gerar.mjs` (sharp, `resize` + `toFormat`); qualquer
compressor serve, desde que mantenha os mesmos nomes.

O `alt` é **vazio de propósito**: a foto é ambientação, não conteúdo.
Descrevê-la faria o leitor de tela anunciar um prédio que a página não
está vendendo.

### O véu

`.hero__veu` é a camada que fica entre a foto e o texto, e **existe por
legibilidade, não por estética**: o pôr do sol é claro demais para texto
branco. São dois gradientes empilhados: uma faixa escura no topo, que dá
contraste ao menu transparente, e um lateral denso à esquerda (onde fica
a copy) que abre a partir de 62% para a torre continuar aparecendo.

Duas armadilhas já encontradas aqui:

- **O gradiente lateral é `90deg` exato.** Com um ângulo inclinado
  (96deg, por exemplo) a linha do gradiente fica mais longa que a caixa
  e as paradas chegam comprimidas do lado direito, escurecendo
  justamente o que deveria ficar limpo.
- **Ao mexer nas paradas, confira a fila de selos.** Ela ocupa os 620px
  da coluna de texto, ou seja, até cerca de metade da largura da tela em
  desktop, e é o elemento que primeiro fica ilegível quando o véu é
  afrouxado. No celular o véu deixa de ser lateral e cobre a tela toda,
  senão a fila cai justamente sobre o céu claro.

O `og:image` (ver pendências) continua faltando. Ele não é carregado
pela página, só lido pelo WhatsApp e pelas redes, e precisa ser JPEG.
