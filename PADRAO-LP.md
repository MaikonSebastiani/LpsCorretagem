# Padrão de landing page — Grupo Saitama

Estrutura fechada em 22/08/2026, validada no Urban Vila Guilherme. Vale como
referência para toda LP de lançamento nova.

A regra que rege tudo: **padronizar o esqueleto, personalizar a pele.** A LP
mantém a identidade visual do empreendimento que vende — quem clica no anúncio
está comprando o empreendimento, não a imobiliária. O que se repete é a
estrutura, os CTAs, o rastreamento e os textos legais.

**São 12 áreas. Sempre as mesmas 12.** Nenhuma LP inventa seção nova: se
aparecer conteúdo que não cabe em nenhuma delas, ele entra na área cuja
pergunta ele responde — não numa seção própria. Conteúdo e pele mudam; o
conjunto de áreas, não.

---

## Ordem das seções

A ordem não é estética. Ela responde as perguntas de quem chega na sequência em
que elas aparecem.

| # | Seção | `id` | Pergunta que responde |
|---|-------|------|----------------------|
| 1 | Hero | — | O que é e quanto custa? |
| 2 | Faixa de confiança | — | Quem está vendendo? |
| 3 | Lançamento | `#lancamento` | Não está pronto? Como assim? |
| 4 | Localização | `#localizacao` | Onde fica? |
| 5 | Aluguel × parcela | `#aluguel` | Quanto estou perdendo hoje? |
| 6 | Como comprar | `#como-comprar` | Eu consigo comprar isso? |
| 7 | Decorado | `#decorado` | Como é o apartamento? |
| 8 | Plantas | `#plantas` | Qual unidade? |
| 9 | Lazer + implantação | `#lazer` | E o condomínio? |
| 10 | Construtora + consultor + números | `#construtora` | Posso confiar? |
| 11 | FAQ | `#faq` | Ainda tenho dúvidas |
| 12 | CTA final | `#contato` | Falar agora |

**Três decisões que valem registro:**

- **Lançamento na posição 3.** Avisar cedo que é obra na planta economiza o
  tempo de quem quer imóvel pronto e converte "não está pronto" de objeção em
  argumento. Descobrir isso na metade da página soa a isca.
- **Como comprar antes do decorado e das plantas.** Para este público o bloqueio
  é "eu consigo comprar?", não "eu quero?". Dinheiro antes do desejo.
- **Aluguel antes de "como comprar".** Primeiro a pessoa vê quanto está
  queimando por mês, depois vê como parar. O argumento saiu de dentro de
  "como comprar" em 23/08/2026 porque empurrava aquela seção para perto de
  1.500px — e é forte o bastante para ocupar espaço próprio.
- **Decorado antes das plantas.** Planta é desenho técnico e só ganha sentido
  depois de a pessoa ter visto o espaço.

O FAQ não tem CTA próprio de propósito: o CTA final vem imediatamente abaixo.

A **faixa de confiança** é um `<div>`, não uma `<section>`: não tem título
próprio, e `<section>` sem nome acessível não ajuda leitor de tela.

### Conteúdo que costuma pedir seção própria — e não deve ganhar uma

- **Mapa de implantação** → normalmente **não entra**. A lista de conveniências
  que vem junto repete o que as fotos de lazer já mostram, e a planta em si
  costuma ser um arquivo em retrato e altíssimo: a do Mérito tinha 754×1500, o
  que dava quase 1800px de altura na página. Só vale incluir se existir um
  recorte em paisagem, e aí dentro do `#lazer`.
- **Números do empreendimento** (torres, unidades, pavimentos, elevadores) →
  entram no `#construtora`. São reforço de confiança, não gancho de entrada:
  a pergunta "quantas torres?" só aparece quando a pessoa já está avaliando
  a sério.

---

## Hero — o que é obrigatório

- Selo de **Lançamento** na primeira dobra.
- **Preço a partir de** e **entrada a partir de**, lado a lado. A entrada
  precisa de uma linha de apoio ("e o restante parcelado durante a obra") —
  sem ela, "entrada de R$ 800" soa como se o apartamento saísse por esse valor.

  > **Urban, Mérito e WL Boa Vista não seguem mais este item** (Urban em
  > 20/09/2026, Mérito em 28/09): os valores saíram da página inteira. No
  > lugar deles ficaram as condições de compra e um CTA que pergunta pela
  > renda. O motivo, e o que repõe a qualificação que o preço fazia, estão em
  > `urban-vila-guilherme/README.md`, seção 5.
  >
  > **O que repõe a qualificação muda por empreendimento** — é o que decide
  > quem pode comprar o quê ali: no Urban é o MCMV; no Mérito é a categoria
  > da unidade (HIS-2 com limite de renda, R2V sem limitador). Copiar a lista
  > do Urban para uma LP que não sustenta aquelas condições (o Mérito não
  > afirma FGTS nem subsídio) troca preço vencido por promessa falsa, que é
  > pior.
  >
  > Só o Novo Mundo Carrão ainda tem preço. **Antes de repetir o padrão numa
  > LP nova, leia aquela seção e decida** — não copie por inércia.
  >
  > **30/09/2026 — a entrada voltou com número, e o FGTS entrou.** Em todas
  > as LPs de empreendimento: **"Entrada a partir de R$ 800"** e **"Use seu
  > FGTS"** (hero, #como-comprar, FAQ e barra fixa). Decisão do dono do
  > negócio, pelas frases que mais puxam o público de lançamento. O
  > argumento contra o número (ancorar numa unidade que acaba) não vale
  > aqui: R$ 800 é condição de todos os empreendimentos Cury que a equipe
  > vende, não de uma planta. Três regras continuam:
  >
  > - a ressalva **"e o restante parcelado durante a obra"** viaja sempre
  >   junto do R$ 800, inclusive na barra fixa;
  > - o **preço do apartamento** continua fora (menos no Novo Mundo, onde a
  >   entrada fica menor que o preço);
  > - FGTS sempre com **"conforme as regras"** e uma pergunta própria no FAQ
  >   com as regras do fundo. **Subsídio** só onde há MCMV confirmado (Urban).
  >
  > Frases que **não** entram: "Financiamento de até 100%" (o financiamento
  > vai a ~80%; o resto vem de FGTS/subsídio) e "Só paga quando pegar as
  > chaves" (contradiz a entrada parcelada durante a obra).
- Tipologia e metragem em selos curtos.
- Um CTA que abre o WhatsApp.
- Nota de rodapé com as ressalvas de valor, disponibilidade e análise de
  crédito.
- Imagem com `width`/`height` e `fetchpriority="high"` — é o LCP.

---

## CTAs

Um por seção, mais um por card de planta — 18 no Urban, 19 no Mérito.

**Todos abrem o WhatsApp direto** (desde 30/09/2026), com **uma mensagem
só** por LP: "Oi gostaria de mais informações sobre o empreendimento
[nome]". O número é o 5511953713310. O formulário de lead saiu de todas as
LPs de empreendimento, por decisão do dono do negócio.

Consequência que precisa ficar clara: **lead de LP não chega mais ao CRM**
(nem é dividido com a equipe pelo painel) — nome, renda e campanha de
origem só existem na conversa do WhatsApp. O único rastro no site é o
evento `whatsapp_click` no GA4, com `source`, e a conversão do Ads onde a
LP tem rótulo próprio (Urban e Mérito).

O clique não é interceptado: quem abre o WhatsApp é o próprio link (`href`
+ `target="_blank"`), e o JavaScript só registra evento e conversão.

Toda LP deve ter a **barra fixa no mobile**: no celular é o CTA sempre visível.

### `data-source` — sempre em inglês

`hero` · `launch` · `location` · `aluguel` · `profile` · `tour` ·
`floorplans` · `leisure` · `consultant` · `final` · `footer` · `mobile_fixed`

Uma LP pode ter fontes a mais quando tem seções a mais — o Mérito usa
`header` e `implantation`. O que não pode é renomear as da lista acima nem
misturar idioma.

Misturar idioma aqui se propaga para todas as LPs seguintes e quebra
comparação entre lançamentos no GA4.

---

## Rastreamento

Eventos disparados por toda LP:

- `lead_form_shown` — o modal abriu, com `source`
- `lead_submit` — gravou no banco. **É esta a conversão do Ads.**
- `lead_form_error` / `lead_form_abandoned`
- `section_view` — com `section`: `preco`, `plantas`, `cta_final`
- `faq_open` — com `question`
- `plan_zoom` — com `area`
- `video_play` — com `video`

Os eventos de rolagem disparam **uma vez por sessão**.

UTM e `gclid` são lidos da URL, guardados na sessão e anexados aos eventos —
**nunca dentro da mensagem enviada ao cliente**.

---

## Área de vídeo (decorado)

Obrigatória na estrutura, opcional no conteúdo.

Em lançamento na planta o comprador não pode visitar nada: o vídeo é o que
substitui a visita. Enquanto não houver vídeo, a área fica com `hidden` e uma
foto do decorado segura a seção. **Nunca publicar caixa vazia.**

O vídeo usa **fachada**: a capa é só uma imagem e o `<iframe>` só entra no
clique. Um embed de YouTube carregado de saída custa perto de 1 MB e derrubaria
a primeira dobra no celular — em tráfego pago, isso é dinheiro jogado fora.
Usar sempre `youtube-nocookie.com`.

As instruções de ativação (4 passos) ficam num comentário HTML acima da seção.

---

## Credibilidade da construtora: prêmios, não adjetivos

"Tradição e experiência", "Qualidade comprovada", "Compromisso com os
clientes" não provam nada — qualquer concorrente escreve o mesmo. Os prêmios
da Cury são verificáveis e vêm de terceiro:

**33x Top Imobiliário · 13x Master Imobiliário · 14x Destaque ADEMI**

Como a construtora é a mesma em todos os lançamentos, esse bloco vale para
qualquer LP nova. Só o que for factual e verificável entra ao lado dele
(anos de história, número de cidades).

---

## Prova social — a vaga que ainda está aberta

É a área de maior valor **ausente** do padrão. Não foi criada porque depende de
conteúdo: com um depoimento só, a página lê como "eles têm exatamente um
cliente". **Mínimo de 2 a 3 casos** antes de publicar.

Formato de cada caso:

- Foto (rosto visível, 3:4 ou quadrada) — **documento fechado ou fora do
  quadro**, porque foto de assinatura costuma pegar CPF, valor e endereço
- Primeiro nome + inicial do sobrenome
- Empreendimento e tipologia
- Frase curta nas palavras da pessoa (gravar áudio e transcrever sai mais
  natural que pedir para escrever)
- Mês/ano

**Exige autorização de uso de imagem por escrito**, assinada junto com o resto
da papelada. Verbal não sustenta.

Quando as obras forem entregues, acrescentar fotos de **entrega de chaves** —
é a prova definitiva e serve para todos os lançamentos seguintes.

---

## Valores

Quando a LP mostrar valores, eles ficam cravados no HTML, nunca injetados por
JavaScript — o preço é o maior elemento da primeira dobra (o LCP) e não pode
aparecer depois do carregamento.

**Revisão mensal obrigatória.** A tabela sobe conforme a obra avança; os
valores envelhecem sozinhos. O passo a passo está no README de cada LP.

> Essa revisão mensal é o custo real de publicar preço, e foi ela que não se
> sustentou: o Urban passou um mês com "Tabela vigente — agosto de 2026" no
> ar antes de os valores serem removidos, em 20/09/2026. **Se ninguém tem a
> rotina de atualizar todo mês, não publique o valor** — página de tráfego
> pago com preço vencido custa mais do que página sem preço.

Cuidados de equilíbrio, aprendidos no Urban:

- **O preço e a entrada competem.** Com o mesmo tamanho e a mesma cor, quem
  vence é o número menor — e ele é o menos acreditável. Contar quantas vezes
  cada um aparece na página: se a entrada aparecer muito mais, a página está
  amplificando justamente o que tensiona a credibilidade.
- **A ressalva viaja junto com a promessa.** "Entrada a partir de R$ 800"
  sem a linha "e o restante parcelado durante a obra" lê como preço do
  apartamento. E a ressalva não pode ser um sussurro ao lado de um número
  gritado: mínimo 13px e peso 500.
- **A barra fixa carrega os dois números**, com o preço primeiro. Sozinha, a
  entrada vira a mensagem permanente da página.
- **Cuidado com o "a partir de".** Ele ancora na menor planta. Se o estoque
  real não tiver mais essa unidade, quem chegar ancorado nesse número vai
  ouvir outro na conversa — e perder a confiança na pior hora.

## O CTA do hero fala de parcela, não de preço

O público paga aluguel. A pergunta dele não é "consigo juntar R$ 255 mil?",
é **"a parcela é maior ou menor que o meu aluguel?"**.

O hero entrega o preço total (abstrato) e a entrada (pequena demais para ser
crível), e nada no meio. Por isso o CTA principal é **"Simular minha
parcela"** — fala com a dúvida real sem prometer número nenhum, porque a
parcela depende de subsídio, renda, prazo e análise de crédito.

**Nunca publicar "parcelas a partir de R$ X"** — estaria errado para quase
todo mundo.

## Regras de conteúdo que não mudam

- **Não inventar escassez.** Nada de cronômetro ou "últimas unidades". A
  urgência real é a tabela subir conforme a obra avança — essa é factual e
  verificável.
- **Não prometer valorização** — seria promessa de investimento.
- **Não citar prazo de entrega** que não esteja em contrato.
- **Nunca bloquear o lead.** Toda qualificação tem saída para quem não quer
  responder.
- Preço sempre acompanhado de disclaimer.

---

## Checagem técnica antes de publicar uma LP nova

Tudo abaixo foi verificado no Urban e deve valer para as próximas.

- [ ] Um único `<h1>`, sem salto de nível entre títulos
- [ ] Todo `aria-labelledby` aponta para um id existente
- [ ] Nenhum id duplicado
- [ ] Toda seção tem `id` — seção sem âncora é seção que ninguém consegue linkar
- [ ] Todo link do menu resolve
- [ ] Toda imagem com `alt`, `width` e `height` (evita CLS)
- [ ] Os `width`/`height` batem com o arquivo real — atributo errado não só
      falha em evitar CLS como distorce a imagem
- [ ] A regra base de `img` tem **`height: auto`** — sem ela, os atributos
      `width`/`height` do HTML travam a altura e a imagem distorce (o Mérito
      renderizava a foto do decorado em 539×1086 em vez de 539×484)
- [ ] Só a imagem do hero sem `loading="lazy"`
- [ ] **Nenhum `<img src="">`** — string vazia faz o navegador requisitar o
      próprio HTML como imagem. Omitir o atributo.
- [ ] Diálogos (`<dialog>`) com a guarda `event.target !== dialog` antes da
      checagem de coordenada — sem ela, Enter num botão focado fecha o diálogo
- [ ] Sem scroll horizontal a 375px
- [ ] Sem erro no console
- [ ] `canonical`, `og:url` e `og:image` com **URL absoluta** do domínio real
- [ ] `og:image` em **JPEG 1200×630** — a prévia do WhatsApp é instável com WebP
- [ ] Conversão do Ads dispara **uma vez** por lead

---

## O que ainda não está no padrão

Pendências conhecidas, registradas em `MELHORIAS.md`:

- **Prova social** (achado 05) — depende de conteúdo
- **Eventos de engajamento** (achado 03) — scroll, seção vista, FAQ aberto
- **Pixel da Meta** (achado 04)
- **Comparativo aluguel × parcela** (achado 08)
- **Código comum em `/shared/`** (item 20) — hoje cada LP tem sua cópia do JS
- **Aplicar esta ordem no Mérito Ipiranga** (item 26)
