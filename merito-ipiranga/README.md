# Mérito Ipiranga - Landing Page

Versão criada a partir da estrutura de conversão do site Urban Vila Guilherme e adaptada à identidade visual e às informações do book digital do Mérito Ipiranga.

## Antes de publicar

1. Confira o `SITE_CONFIG` no topo de `assets/js/main.js` (número do WhatsApp).
   É o único lugar com esse dado.
2. Publique a pasta inteira em `/merito-ipiranga/`.
3. Se a URL final for diferente, altere a tag `canonical` no `<head>` do `index.html`.

## Rastreamento

Instalados no `<head>` do `index.html`, na mesma tag do `gtag.js`:

- **GA4** — `G-VF9K820XDQ`
- **Google Ads** — `AW-18388777321`

Um loader só atende os dois IDs. O rótulo da conversão fica no
`adsConversionLabel`, dentro do `SITE_CONFIG` do `main.js`.

A propriedade GA4 é a mesma do Urban Vila Guilherme: cobre o site inteiro.
Nos relatórios, separe os dois empreendimentos por caminho da página
(`/merito-ipiranga/` e `/urban-vila-guilherme/`).

No momento o Mérito usa a **mesma** ação de conversão do Urban Vila
Guilherme. Isso funciona, mas mistura os dois empreendimentos no mesmo
número dentro do Google Ads. Quando as campanhas forem separadas, vale criar
uma ação de conversão própria do Mérito e trocar só o `adsConversionLabel` —
é o único lugar com esse dado.

Se o `adsConversionLabel` ficar vazio, nada é disparado e o WhatsApp abre
normalmente: a instrumentação fica inerte, nunca atrapalha o lead.

## CTAs de WhatsApp

- Qualquer elemento com a classe `.js-open-lead` vira um link de WhatsApp.
- A mensagem de cada CTA vem do próprio `data-message`, contextual por seção
  (localização, plantas, categorias, consultor etc.).
- Nos cards de planta, o `data-planta` entra na mensagem e no evento.
- O `href` é montado no carregamento, então os botões funcionam mesmo sem
  JavaScript.
- UTMs e `gclid` são guardados na sessão e vão nos eventos de rastreamento,
  mas nunca dentro da mensagem enviada ao cliente.

### Eventos preparados

`whatsapp_click` (com `source` e `planta`) e, quando houver tag instalada, a
conversão do Google Ads.

A conversão sai junto com o clique, sem `event_callback`: o link é um `<a>`
de verdade com `target="_blank"`, então a aba de origem continua viva e o
`transport_type: 'beacon'` garante o envio mesmo quando o app do WhatsApp
assume a tela. Segurar o clique esperando o gtag responder só criava atraso
e, na versão antiga, chegou a abrir o WhatsApp duas vezes.

## Atualização mensal dos valores

A tabela sobe conforme a obra avança — é o argumento honesto de urgência da
página, e a consequência é que **os valores envelhecem sozinhos**. Preço
desatualizado em página de tráfego pago não é detalhe: é lead chegando com
expectativa errada e tempo do time gasto à toa.

Os valores estão cravados no HTML de propósito. Injetar por JavaScript faria
o preço aparecer depois do carregamento — e ele é o maior elemento da
primeira dobra (o LCP). A troca é manual, mas é segura, porque cada valor é
uma string única.

### Como trocar

Substituir a string inteira, incluindo "R$" e "mil", em **todo o arquivo**:

| Onde | O que trocar |
|------|--------------|
| `index.html` | `R$ 230 mil` → o valor novo |
| `index.html` | `R$ 800` → o valor novo, se a entrada mudar |

**`R$ 230 mil` — 4 lugares:** `meta name="description"`, hero, seção de
plantas e CTA final.

**`R$ 800` — 5 lugares:** `meta name="description"`, hero, seção de
lançamento, FAQ e CTA final.

> O `grep` acusa uma ocorrência a mais de `R$ 800`: existe uma dentro de um
> comentário HTML, explicando por que a linha de apoio é obrigatória. Essa
> não precisa ser trocada.

### Conferir depois de trocar

```bash
grep -c "R\$ 230 mil" index.html
```

Se voltar algo diferente de zero depois da troca, sobrou valor antigo em
algum lugar.

> A `meta name="description"` também carrega o preço. É ela que aparece no
> Google — esquecer dela deixa o valor velho no resultado de busca mesmo com
> a página certa.

## Ordem das seções

Mesma ordem canônica do padrão (ver `PADRAO-LP.md`), com as duas seções
próprias do Mérito encaixadas por afinidade de conteúdo.

| # | Seção | `id` | Pergunta que responde |
|---|-------|------|----------------------|
| 1 | Hero | — | O que é e quanto custa? |
| 2 | Faixa da história | — | Quem está vendendo? |
| 3 | Lançamento | `#lancamento` | Não está pronto? Como assim? |
| 4 | Localização | `#localizacao` | Onde fica? |
| 5 | Como comprar | `#como-comprar` | Eu consigo comprar isso? |
| 6 | Decorado | `#decorado` | Como é o apartamento? *(oculta)* |
| 7 | Plantas | `#plantas` | Qual unidade? |
| 8 | Lazer | `#lazer` | E o condomínio? |
| 9 | Implantação | `#implantacao` | Como tudo se organiza? |
| 10 | O empreendimento | `#o-empreendimento` | Que porte tem isso? |
| 11 | Construtora | `#construtora` | Posso confiar? |
| 12 | FAQ | `#faq` | Ainda tenho dúvidas |
| 13 | CTA final | `#contato` | Falar agora |

**Onde as duas seções próprias foram parar, e por quê:**

- **Implantação** ficou colada no lazer — é o mapa do mesmo assunto, e a
  lista de conveniências dela conversa direto com as fotos de lazer.
- **O empreendimento** (672 apartamentos, 2 torres, 4.336 m²) desceu da
  posição 4 para o bloco de credibilidade, junto da Cury. Número de torres é
  reforço de confiança, não gancho de entrada: a pergunta "quantas torres?"
  só aparece quando a pessoa já está avaliando a sério.

### A seção de decorado está oculta

O `<section id="decorado">` existe na estrutura mas tem `hidden`. O Mérito
**não tem nenhuma foto de interior** — só fachada, aérea, lazer e plantas
(achado 11 da auditoria). Uma seção chamada "Como é morar no Mérito"
mostrando o prédio por fora quebra a própria promessa.

Para publicar, basta **uma** das duas coisas:

1. **Foto** — pegar as imagens do decorado no material oficial da Cury,
   salvar como `assets/images/decorado.webp`, remover o `hidden` do
   `<section>` e repor o link "Decorado" no menu.
2. **Vídeo** — os 4 passos estão no comentário HTML acima da seção.

O menu **não** tem link para `#decorado` justamente porque âncora para
elemento oculto não rola.

### Barra fixa no lugar do botão flutuante

O antigo `.whatsapp-float` (círculo dourado) foi substituído pela barra fixa
`.mobile-cta`, igual à do Urban. O círculo não carregava texto nenhum, e este
é o espaço de CTA mais visto da página — agora ele carrega os dois valores,
com o preço primeiro. O CSS órfão do float foi removido.

## Pergunta de qualificação

Três CTAs passam por uma pergunta antes de abrir o WhatsApp: o do hero, o
do CTA final e o botão flutuante. Todos os outros (plantas, seções, header,
consultor) continuam indo direto para a conversa.

A regra é uma pergunta, um toque, e ninguém bloqueado: a última opção
("Prefiro falar sem informar") deixa passar sem responder, e nesse caso a
renda não entra na mensagem.

Para mudar quem passa pela pergunta, é só pôr ou tirar o atributo
`data-qualify` no CTA — nada mais precisa ser tocado. As opções de resposta
ficam em `QUALIFIER_OPTIONS`, no `main.js`.

### Eventos da pergunta

- `qualification_shown` — a pergunta apareceu (com `source`).
- `qualification_answered` — respondeu (com `source` e `income_range`).
- `qualification_abandoned` — fechou sem responder (com `source`).

Os três existem para medir o custo da porteira. Se `shown` for muito maior
que `answered`, a pergunta está espantando mais gente do que qualificando —
e aí basta remover o `data-qualify` dos CTAs.

A conversão do Google Ads dispara junto com `whatsapp_click`, uma vez só,
seja o CTA direto ou com pergunta.

## Conteúdo incorporado

- 1 e 2 dormitórios.
- Plantas: 26,39 m²; 36,80 m²; 36,83 m²; 40,94 m²; 41,84 m²; 45,59 m²; 45,66 m².
- Terraço, opção de suíte e vaga.
- 2 torres, 672 unidades, térreo + 24 pavimentos, 5 elevadores por torre.
- 552 unidades HIS-2 e 120 R2V.
- Lazer e conveniências do material oficial.
- Tempos de deslocamento informados no book.
- Informações institucionais da Cury divulgadas no book.

## Lançamento / imóvel na planta

A página deixa claro em quatro pontos que o empreendimento é vendido na planta:
selo na hero, seção própria (`#lancamento`), pergunta no FAQ e meta description.

O argumento comercial é o valor de entrada menor que o de um imóvel pronto.
De propósito, a página **não** promete valorização (seria promessa de
investimento) e **não** cita prazo de entrega — o texto remete ao prazo
previsto em contrato. Se o prazo oficial for divulgado, vale acrescentá-lo na
seção e no FAQ.

## Observação

O preço exibido (a partir de R$ 230 mil) é valor de referência e aparece
sempre acompanhado de disclaimer. Disponibilidade e condições devem ser
consultadas no momento do atendimento.
