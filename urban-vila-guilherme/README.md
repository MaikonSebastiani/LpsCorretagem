# Urban Vila Guilherme — Landing page

Landing page estática de conversão para WhatsApp (tráfego Google Ads).
HTML + CSS + JavaScript puro. Sem build, sem dependências, sem backend.

```
index.html
css/style.css
js/main.js
assets/
  images/          hero, localizacao, living, skyline
  images/plantas/  6 plantas
  images/lazer/    8 imagens de lazer
  icons/favicon.svg
```

---

## 1. Número do WhatsApp — ALTERE ANTES DE PUBLICAR

Um único lugar: **`js/main.js`**, no topo do arquivo.

```js
var SITE_CONFIG = {
  whatsapp: '55XXXXXXXXXXX',      // <- AQUI. DDI + DDD + número, só dígitos
  consultantName: 'Sebastiani Imóveis',
  creci: '',                      // ex.: '123456-F' (aparece no card do consultor)
  legalText: '',                  // texto jurídico completo do rodapé
  appendCampaignToMessage: false
};
```

Exemplo para **(11) 91234-5678** → `'5511912345678'`.

Todos os 15 CTAs do site montam o link sozinhos a partir daí. Enquanto o
número não for configurado, aparece um aviso no console do navegador.

Cada CTA tem sua própria mensagem no atributo `data-message` do HTML —
inclusive uma mensagem específica por planta.

---

## 2. Imagens a substituir

Hoje todas são **placeholders SVG** (menos de 1 KB cada), só para o site abrir
funcionando. Substitua por fotos reais em **WebP**.

> **Prioridade 1 — o banner.** `assets/images/hero.svg` é um esboço com a mesma
> geometria e proporção da arte final (1656×951): painel de concreto à
> esquerda, chevron verde, fachada à direita. Salve a arte definitiva como
> `assets/images/hero.webp` e troque a extensão no `<img>` do `.hero__bg` e no
> `<link rel="preload">` do `<head>`. **Mantenha a proporção 1656×951** — o
> posicionamento do texto sobre o painel claro foi calculado em cima dela.

| Arquivo atual | Trocar por | Proporção sugerida | O que é |
|---|---|---|---|
| `assets/images/hero.svg` | `hero.webp` | **1656×951 (obrigatório)** | Arte completa do banner |
| `assets/images/localizacao.svg` | `localizacao.webp` | ~800×620 | Mapa ou aérea da região |
| `assets/images/living.png` | já é a imagem real | — | Living decorado (seção "Não é só escolher a planta"; ver nota abaixo) |
| `assets/images/mcmv-photo.svg` | `mcmv-photo.webp` | ~900×600, **fundo transparente** | Foto da seção Minha Casa Minha Vida, já com a ponta do chevron recortada nela |
| `assets/images/texture.svg` | `texture.webp` ou `.png` | pequeno e **tileable** (o placeholder é 240×240) | Textura de fundo da seção MCMV, repetida via CSS |
| `assets/images/skyline.jpg` | já é a imagem real | — | Fundo do CTA final (ver nota abaixo) |
| `assets/images/plantas/*.png` | já são as imagens reais | — | As 6 plantas (ver nota abaixo) |
| `assets/images/lazer/*.jpg` (8 arquivos) | já são as imagens reais | — | Piscina, fitness, coworking, beach tennis, pet place, salão, churrasqueira, brinquedoteca |

**Como trocar:** coloque o arquivo `.webp` na mesma pasta e, no `index.html`,
mude só a extensão no `src`. Os comentários `<!-- SUBSTITUIR: ... -->` marcam
cada bloco. Mantenha os atributos `width` e `height` batendo com a proporção
real da imagem — é o que segura o CLS em zero.

> ⚠️ **O hero é trocado em DOIS lugares**: o `<img>` dentro de `.hero__bg` **e**
> o `<link rel="preload" as="image">` no `<head>`. Se esquecer o preload, ele
> aponta para um arquivo que não existe (404) e a imagem principal deixa de ser
> pré-carregada — o LCP piora.

### Peso das imagens — PNG não serve

Exporte **sempre em WebP**, qualidade 80–85. PNG é formato sem perdas: um render
fotográfico em PNG passa fácil de 2 MB, e o do banner é a imagem que define o
LCP da página.

| | PNG | WebP q82 (esperado) |
|---|---|---|
| `hero` (1656×951) | ~2,2 MB | ~180–250 KB |
| `localizacao` (mapa) | ~900 KB | ~90–130 KB |

Numa conexão 4G típica (~1,5 MB/s real), 2,2 MB no caminho crítico são ~4–6 s
só para o banner aparecer. Isso sozinho derruba a meta de LCP < 2,5 s e a nota
de Performance, por melhor que o código esteja.

A seção Minha Casa Minha Vida já evita esse problema: em vez de uma arte única
mesclada (foto + textura + chevron em um arquivo só, que chegou a pesar
2,4 MB), ela usa dois arquivos pequenos — a foto sozinha
(`mcmv-photo.webp`, algumas dezenas de KB) e uma textura minúscula e
**tileable** (`texture.webp`, poucos KB) repetida via `background-repeat` no
CSS. A textura é baixada **uma única vez** e o navegador a replica sem custo
de rede — bem mais leve do que uma imagem cobrindo a seção inteira.

### Hero com AVIF + WebP (opcional, quando tiver os arquivos)

```html
<picture>
  <source srcset="assets/images/hero.avif" type="image/avif">
  <source srcset="assets/images/hero.webp" type="image/webp">
  <img src="assets/images/hero.jpg" width="1656" height="951"
       alt="Perspectiva ilustrada da fachada do Urban Vila Guilherme"
       fetchpriority="high" decoding="async">
</picture>
```

Se fizer isso, atualize também o `<link rel="preload" as="image">` no `<head>`.

### Ainda faltam

- `assets/images/og-image.jpg` — 1200×630, para compartilhamento em redes/WhatsApp
- `assets/icons/apple-touch-icon.png` — 180×180 (a linha está comentada no `<head>`)

---

## 3. Antes de publicar — checklist

1. ~~`SITE_CONFIG.whatsapp` preenchido em `js/main.js`~~ — feito (`5511953713310`)
2. Substituir `https://SEUDOMINIO.com.br/` no `<head>` (canonical, `og:url`, `og:image`, `twitter:image`) — 4 ocorrências
3. Trocar as imagens placeholder
4. ~~Rodapé: Instagram e Facebook~~ — feito. Instagram aponta para
   `instagram.com/sebastiani.imoveis`; Facebook foi removido (ícone e link)
   a pedido
5. `SITE_CONFIG.legalText` com o texto jurídico completo (incorporadora, registro de incorporação, CRECI) — ele aparece sozinho no rodapé quando preenchido
6. Se quiser dados estruturados, há um bloco JSON-LD comentado no `<head>` — só habilite com informações confirmadas

---

## 4. Tracking (GA4 / GTM / Google Ads)

Nada está instalado. A estrutura está pronta:

- `trackEvent(nome, dados)` em `js/main.js` — envia para `dataLayer` (GTM) e/ou
  `gtag` (GA4) **se existirem**. Sem nada instalado, não faz nada e não dá erro.
- Todo clique em CTA dispara `whatsapp_click` com `source`:
  `hero`, `location`, `mcmv`, `floorplans`, `leisure`, `profile`, `consultant`,
  `final`, `footer`, `mobile_fixed`.
- Abrir uma planta no lightbox dispara `plan_zoom` com `area` (ex.: "32,03
  m²"). Não é um clique de WhatsApp, mas é um sinal de interesse por planta
  específica que vale a pena olhar no GA4 se um dia instalar.

Para instalar o GTM ou o gtag.js, cole a tag deles no `<head>` do `index.html`.
Para marcar conversão do Google Ads, descomente a linha `send_to: 'AW-...'`
dentro de `trackEvent`.

### UTM e gclid

`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` e `gclid`
são lidos da URL, guardados no `sessionStorage` e anexados automaticamente a
todo `trackEvent`. Nada aparece na tela.

Se um dia quiser que a origem da campanha vá junto na mensagem do WhatsApp,
mude `appendCampaignToMessage` para `true`.

---

## 5. Fontes

Barlow Condensed (títulos) + Inter (textos), carregadas do Google Fonts em uma
requisição, com `preconnect`, `preload` e `display=swap`. Há fallback local
(`Arial Narrow` / `Arial`) — se a fonte não carregar, o layout não quebra.

**Para performance máxima**, hospede localmente: baixe os `.woff2` dos 4 pesos
(Barlow Condensed 600/700, Inter 400/600), coloque em `assets/fonts/`, remova
os 4 `<link>` de fonts.googleapis/gstatic do `<head>` e declare `@font-face`
com `font-display: swap` no topo do `css/style.css`. Isso elimina duas
conexões externas do caminho crítico.

---

## 6. Publicar

O site é 100% estático. Não precisa de Node.js em produção.

- **Hostinger / hospedagem tradicional**: envie o conteúdo da pasta por FTP ou
  pelo gerenciador de arquivos para `public_html/`
- **Netlify / Cloudflare Pages**: arraste a pasta na interface, ou conecte o
  repositório — build command vazio, publish directory `/`
- **GitHub Pages**: suba a pasta na branch `main` e ative Pages na raiz
- **Apache / Nginx**: copie para o document root

### Testar localmente

Abrir o `index.html` direto pelo navegador funciona. Para testar igual ao
servidor real (caminhos, MIME types):

```bash
npx serve .
```

---

## 7. Notas de manutenção

- O `css/style.css` está dividido em blocos comentados na mesma ordem das
  seções da página, com o bloco `Responsive` no final.
- Cuidado com o shorthand `padding` em elementos que também têm a classe
  `.container` — ele anula o `padding-inline` lateral. Use `padding-block`.
- O FAQ usa `<details>`/`<summary>` nativos — sem JavaScript.
- O carrossel de plantas no mobile é `overflow-x` + `scroll-snap` — sem
  biblioteca.
- A textura de concreto dos fundos claros é feita com `radial-gradient` no CSS
  (`.section--texture`) — não baixa imagem nenhuma.
- Os ícones são um sprite SVG inline no início do `<body>` — sem biblioteca.
- O botão verde usa **texto branco**, como na arte de referência. Isso dá
  contraste de ~2,1:1, abaixo do mínimo WCAG AA (4,5:1). Se em algum momento
  a acessibilidade pesar mais que a fidelidade visual, troque uma linha em
  `.btn--green` no CSS: `color: var(--urban-white)` → `color: var(--urban-black)`.

### Paleta

As seis variáveis do briefing estão no `:root` e não foram alteradas. Além
delas há quatro variáveis de **superfície**, tiradas da arte:

```css
--surface-night: #1A1A1A;  /* lazer, rodapé, card do consultor, CTA mobile */
--surface-hero:  #131313;  /* painel escuro do banner */
--surface-cream: #F3F3F1;  /* seções claras com textura */
--surface-paper: #F7F7F5;  /* plantas e FAQ, mais limpo */
```

Os fundos escuros da arte são quase pretos — não o grafite esverdeado
`#252927`. O `--urban-dark` continua em uso na borda do botão outline.

### Hero

- O banner é **a arte inteira** (`.hero__bg > img`). Os chevrons verdes vêm na
  imagem — **não há nenhum desenhado em CSS**. Se um dia a arte mudar e os
  chevrons saírem dela, eles precisam voltar como elemento próprio.
- O header é **sobreposto** ao banner (`position: absolute`, fundo
  transparente). Por isso o `.hero__grid` tem `padding-block` maior no topo:
  mexer nesse valor desloca todo o conteúdo do banner.
- O logo e o texto do hero são **escuros**, porque ficam sobre o painel de
  concreto claro da arte. O menu continua branco: ele fica sobre o céu.
- No desktop a arte é `object-fit: cover` com `object-position: left center` —
  ancorada à esquerda, o painel claro sempre começa em x=0 e sua largura vira
  uma fração previsível da largura exibida.
- Por isso o `.hero__grid` usa `padding-left: max(--pad, 4.5vw)` e o
  `.hero__content` usa `width: min(600px, max(410px, 31vw))`, em vez da margem
  do container centralizado: em telas largas o container jogaria o texto para
  fora do painel claro, por cima do chevron.
- `.hero__title` é `min(3.02vw, 2.7rem)`. Aumentar esse valor faz o título
  encostar no chevron ou quebrar em 3 linhas em algumas larguras — foi medido
  de 900px a 2560px.
- No celular (<480px) a arte aparece **abaixo** do texto, num recorte quadrado
  ancorado à direita, para mostrar a fachada. Num recorte largo a arte
  apareceria inteira e minúscula; e recortada num retrato mostraria só o
  concreto. De 480px para cima a arte inteira aparece em 16:9.
- O traço verde no fim dos textos é `.dash-end`, aplicado na **última palavra**
  com `white-space: nowrap`, para o traço nunca quebrar sozinho numa linha.

### Minha Casa Minha Vida

- Fica entre "O melhor da região" e "Plantas", em `#minha-casa-minha-vida`.
- **Diferente do banner**: aqui são dois arquivos separados, não uma arte
  única mesclada. `.mcmv__media` é só a foto (com a ponta do chevron já
  recortada nela e fundo transparente — nenhum `clip-path` em CSS). O fundo da
  seção inteira é a textura, um tile pequeno repetido via
  `background-image` + `background-repeat: repeat` em `.mcmv`.
- Ajuste `background-size` em `.mcmv` para casar com a escala do tile real
  (o placeholder é 240×240 — provavelmente o tile definitivo terá outra
  proporção, já que a arte enviada era uma "faixa" larga e baixa).
- Como a foto não tem mais posicionamento condicionado à geometria de uma arte
  maior, o layout é o mais simples possível: `flex-direction: column` no
  mobile (foto acima, texto abaixo) e `row` a partir de 900px — o mesmo
  breakpoint que `.buy__grid`, `.loc__grid` e `.trust__grid` já usam.
- Título centralizado, parágrafo alinhado à esquerda no mobile; tudo alinhado
  à esquerda a partir de 900px.
- Textos deliberadamente condicionais ("pode compor", "conforme análise",
  "variam de acordo com"), mais a nota de rodapé sobre enquadramento. Nenhuma
  promessa de aprovação e nenhuma calculadora, conforme o briefing.
- `--green-ink: #558A1B` é o verde para **texto/ícone sobre fundo claro**. O
  `#86CD35` puro sobre off-white fica em ~2,6:1 e não é legível.

### Plantas — clique para ampliar

- Clicar na imagem de uma planta abre um `<dialog>` nativo com a imagem em
  tamanho maior (`#plan-lightbox`, no fim do `index.html`, montado por
  `setupPlanLightbox()` em `js/main.js`). Fechamento por Esc e foco preso
  dentro do modal são nativos do `<dialog>` — nenhum JS próprio para isso.
- O card virou dois alvos de clique separados: a **imagem** (botão que abre o
  lightbox) e um **link de WhatsApp próprio** logo abaixo ("Consultar esta
  planta"), com a mesma mensagem que cada planta já tinha. Antes o card
  inteiro era um único link para o WhatsApp; não dava mais para fazer as duas
  coisas com um clique só.
- Clique fora da imagem (no fundo escurecido) fecha o modal — é um cálculo
  manual de coordenadas em `setupPlanLightbox()` (`dialog.addEventListener
  ('click', ...)`), porque não dá para ouvir clique no `::backdrop` via CSS
  pseudo-elemento.
- **Nomes dos arquivos**: `assets/images/plantas/32m2.png`, `36.80m2.png`,
  `36.83m2.png`, `37.83m2.png`, `42m2.png`, `44m2.png`. Repare que o arquivo da
  planta de **37,86 m²** está nomeado `37.83m2.png` — provavelmente uma
  divergência de digitação na hora de salvar. O conteúdo da imagem bate com a
  planta certa (conferido visualmente), só o nome do arquivo está inconsistente
  com o número exibido no site. Não mexi no texto "37,86 m²" (a instrução
  original veda alterar metragens) nem renomeei o arquivo — se quiser, é só
  renomear o arquivo e ajustar o `src` correspondente no HTML.
- As imagens já são fotos reais (300–400 KB cada, ~600–750px de largura) — bem
  mais leves que os placeholders SVG que existiam antes. Não precisam de mais
  nenhuma conversão.

### Lazer — nomes de arquivo corrigidos

As 8 fotos que você adicionou tinham nomes com erro de digitação. Renomeei
para bater com o que o `index.html` já esperava (mesma convenção kebab-case
usada no resto do site) e conferi o **conteúdo** de cada uma (o selo/marca
d'água de cada render confirma o ambiente) antes de renomear, para não trocar
a foto errada de lugar:

| Nome que você enviou | Problema | Nome final |
|---|---|---|
| `cowork.png` | abreviado | `coworking.jpg` |
| `bechtenis.png` | faltava o "a" de "beach" | `beach-tennis.jpg` |
| `petplace.png` | sem hífen | `pet-place.jpg` |
| `salaodefestas.png` | sem hífens | `salao-de-festas.jpg` |
| `churrasqueria.png` | palavra errada (churrasqueria ≠ churrasqueira) | `churrasqueira.jpg` |
| `brinqudoteca.png` | faltava o "e" | `brinquedoteca.jpg` |
| `piscina.png` | já estava certo | `piscina.jpg` |
| `fitness.png` | já estava certo | `fitness.jpg` |

Também redimensionei e recomprimi todas: vieram em ~1270×715, entre 700 KB e
2 MB cada (10,1 MB no total) — muito acima do que o card de lazer realmente
exibe (`.leisure__card`, no máximo ~300px de largura em qualquer breakpoint,
ver `css/style.css`). Redimensionei para 700px de largura (folga para retina)
e salvei como JPEG qualidade 82 — são fotos sem transparência, então JPEG
comprime bem melhor que PNG. Resultado: **35–85 KB cada, ~443 KB no total**,
97% mais leve, com a mesma aparência.

### "Não é só escolher a planta" — living.png

`living.png` chegou **igual à foto do MCMV**: fundo transparente, com os
cantos arredondados e a ponta do chevron já recortados na própria imagem
(94,5% de largura útil dentro do canvas de 1536×1024 — só uma margem fina de
transparência ao redor).

O card antigo (`.buy__media img`) usava `object-fit: cover` com
`aspect-ratio` fixo — pensado para uma foto retangular comum. Aplicado direto
numa imagem já recortada em formato de bandeira/chevron, isso cortaria a
transparência dentro de um retângulo e abriria buracos estranhos no card
(revelando o fundo por trás em vez de uma foto limpa). Troquei para o mesmo
tratamento do banner e do MCMV: **sem** `object-fit`/`aspect-ratio`, a imagem
aparece inteira, no tamanho natural, flutuando sobre a textura de concreto
que a seção já tinha (`.section--texture`) — por isso o layout de duas
colunas (`.buy__grid`) não quebrou, só a forma como a imagem é exibida dentro
dela.

Redimensionei de 2,6 MB (1536×1024) para **1,6 MB (1100×733)**, mantendo o
canal alpha — o mesmo limite que expliquei para `mcmv-photo.png`: sem um
encoder de WebP/AVIF neste ambiente, PNG com transparência não comprime tanto
quanto uma foto opaca convertida para JPEG.

### CTA final — skyline.jpg

Essa imagem é diferente das outras: já vem **composta como arte finalizada**
(textura de concreto + chevrons verdes + skyline noturno de SP), pensada
exatamente para este bloco — não é uma foto solta.

O CSS antigo (`opacity: .45` na imagem + um véu escuro de 88–94% de opacidade
por cima) tinha sido calibrado para o placeholder genérico antigo. Numa
imagem que já é escura por natureza do lado esquerdo (onde o texto fica —
medi a luminância em vários pontos: ~20–40 de 255, quase preto, do início até
uns 60% da largura), aquele tratamento dobrado apagava quase tudo, inclusive
o verde vivo dos chevrons. Ajustei para:

- `opacity` removida da imagem (mostra em 100%, cor cheia);
- véu bem mais fraco (de ~90% para ~35–55% de opacidade) — reforço de
  contraste, não a fonte principal dele, já que a própria foto já é escura o
  suficiente;
- `object-position: left center` — ancora o lado com o chevron e o fundo
  escuro à esquerda (onde o texto sempre fica). Em telas estreitas, o recorte
  do `object-fit: cover` prioriza esse lado e corta o skyline; em telas
  largas, a imagem cabe quase inteira e o skyline aparece como um extra à
  direita.

Redimensionei de 2 MB (2172×724) para **131 KB (1920×640)** — sem
transparência, então virou JPEG qualidade 82, a mesma tratativa de
`texture.jpg`. Reduziu 93%.