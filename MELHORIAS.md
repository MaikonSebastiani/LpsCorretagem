# Melhorias — Urban Vila Guilherme e Mérito Ipiranga

Backlog de trabalho das duas landing pages. Vem da auditoria de conversão feita
em 22/08/2026 (12 achados) mais os itens que surgiram da reestruturação da
equipe na mesma data.

**Contexto que muda tudo daqui para frente:** os sites deixaram de ser de um
corretor individual. A equipe se uniu para operar como uma imobiliária própria
dentro da Cury, centralizada no nome e no CRECI do gestor (apelido *Saitama*),
com os leads divididos igualmente entre todos conforme chegam. As campanhas do
Google Ads estão **pausadas** por causa dessa transição — que é justamente a
melhor janela para fazer as mudanças estruturais sem sujar dado de campanha
ativa.

---

## Concluído

- [x] **01 — Pergunta única de qualificação antes do WhatsApp** *(crítico)*
      Um toque, uma pergunta (renda familiar em 4 faixas), só nos 3 CTAs
      principais de cada site. Os demais continuam diretos. A última opção
      ("Prefiro falar sem informar") deixa passar sem responder — ninguém fica
      bloqueado. Interruptor de emergência: remover o atributo `data-qualify`
      do CTA.
      Eventos novos: `qualification_shown`, `qualification_answered`,
      `qualification_abandoned`.

- [x] **GA4 instalado nos dois sites** — `G-VF9K820XDQ`, junto do Google Ads
      `AW-18388777321` na mesma tag. Verificado em tráfego real: os eventos
      chegam com os parâmetros corretos. Propriedade única para o site inteiro;
      separar os empreendimentos nos relatórios por **caminho da página**.

- [x] **GA4 vinculado ao Google Ads.**

---

## Aguardando decisão de vocês

Nada aqui é trabalho técnico parado — é decisão que precisa ser tomada antes de
o código fazer sentido.

### A. Para onde vai o lead ✅ *decidido em 23/08/2026*

**Formulário em modal gravando no Cloudflare D1** (banco `leads`,
`3163576c-8b86-4d00-b586-2861cc2dbb9e`). O formulário **não abre o WhatsApp** —
ele é o fim do caminho. Nome e telefone são obrigatórios, renda é opcional.

Resolve os itens 02, 13 e 16 de uma vez.

#### O que ainda falta para funcionar em produção

1. Aplicar o schema: `npx wrangler d1 execute leads --remote --file=schema.sql`
2. Criar o binding `DB` no painel do Pages (Settings → Bindings → D1), se o
   deploy for automático pelo GitHub.
3. Criar a caixa `privacidade@gruposaitama.com.br`, citada na política.

### A.1 — Todos os CTAs viraram formulário ✅ *feito em 23/08/2026*

Os 18 do Urban e os 19 do Mérito abrem o formulário. Não existe mais caminho
direto para o WhatsApp.

### A.2 — Histórico: o que era o problema

Só os 3 CTAs com `data-qualify` abrem o formulário. Os demais (plantas, lazer,
localização, consultor, header) continuam abrindo o WhatsApp direto — ou seja,
**a maior parte dos cliques ainda não vira registro no banco**, e o lead cai no
celular de uma pessoa só.

Além disso, a mesma página passa a ter dois comportamentos para "falar com
vocês", o que confunde. **Decisão pendente:** converter todos para formulário,
ou manter o WhatsApp nos CTAs de intenção específica.

Hoje os dois sites apontam para **um número só**, cravado no `SITE_CONFIG`.
Isso é incompatível com "dividir igualmente conforme for chegando": o lead
existe apenas no celular de quem atendeu, e não dá para dividir o que ninguém
consegue ver.

Caminho recomendado: **gravar o lead num destino compartilhado e só então abrir
o WhatsApp.** Mantém a conversa começando na hora (que é o que converte) e o
time inteiro enxergando tudo. Detalhado no item 13.

### B. Nome da marca e domínio ✅ *decidido em 22/08/2026*

**`gruposaitama.com.br`** — marca **Grupo Saitama**.

As URLs canônicas, Open Graph e Twitter dos dois sites já apontam para lá.
Falta a troca do nome visível nas páginas (item 15) e a Redirect Rule do
domínio antigo (item 14).

### C. CRECI do gestor

Combinado que entra depois. Destrava metade do item 05.

---

## Crítico

### 02 — WhatsApp é o único caminho, sem plano B ✅ *resolvido em 23/08/2026*

*urban · mérito*

Não existe formulário, e-mail ou "me avise" em nenhuma das duas páginas. Quem
está no trabalho, sem o WhatsApp à mão, ou simplesmente não quer entregar o
telefone agora, não tem como deixar contato. Esse tráfego é pago e vai embora
sem rastro.

- Formulários no site: **0**
- Campos de entrada de qualquer tipo: **0**

**Correção.** Absorvido pelo item 13 — a captura passa a acontecer no próprio
gate de qualificação, com o dado indo para um destino compartilhado.

### 03 — Você não enxerga onde o lead desiste ✅ *feito em 23/08/2026*

Eventos `section_view` (com `section`: `preco`, `plantas`, `cta_final`) e
`faq_open` (com `question`) nos dois sites. Cada um dispara uma vez por sessão.

*urban · mérito*

A página inteira dispara poucos eventos. Não há evento de rolagem, de seção
vista, de FAQ aberto. Quando uma campanha performa mal, não há dado para dizer
se o problema é o anúncio, a primeira dobra ou o preço — só o resultado final.

- Eventos de engajamento (scroll, seção, FAQ): **0**

**Correção.** Marcar quatro momentos: chegou nas plantas, chegou no preço,
abriu uma pergunta do FAQ, chegou no CTA final. Com isso a campanha ganha
micro-conversões para otimizar, em vez de esperar o lead final — que é raro
demais para o algoritmo aprender rápido.

> Ganhou urgência agora que o GA4 existe: sem ele, esses eventos não tinham
> para onde ir. Agora têm.

### 04 — Nada rastreado fora do Google ❌ *descartado em 23/08/2026*

As LPs são exclusivas de Google Ads. As redes sociais terão ação própria, fora
deste site, então o pixel da Meta não entra.

*urban · mérito*

Só existe Google. O Instagram já é trabalhado — inclusive com lista de
transmissão — e todo esse tráfego chega sem identificação e sai sem virar
público de remarketing. Quem visitou e não converteu hoje é inalcançável amanhã.

- Pixel Meta: **ausente**

**Correção.** Instalar o pixel da Meta nas duas páginas. Mesmo sem anúncio pago
no Instagram agora, ele começa a acumular público desde já — e público leva
tempo para encher.

> Com a centralização, o pixel deve ser criado no Business Manager da nova
> marca, não numa conta pessoal.

---

## Alto

### 05 — Zero prova social nas duas páginas

*urban · mérito*

Não há depoimento, número de famílias atendidas, print de conversa ou avaliação.
A única credibilidade é a marca Cury — que é do incorporador, não de vocês. Para
quem vai comprar na planta e entregar dinheiro antes de existir apartamento, a
confiança no corretor é parte do produto.

- Depoimentos: **0** · Números de atendimento: **0**
- Campo CRECI: existe no HTML, com atributo `hidden`, e está vazio no
  `SITE_CONFIG`

**Correção.** Preencher o CRECI do gestor (é um valor só, no `SITE_CONFIG`) e
acrescentar de 2 a 3 depoimentos reais, com nome e primeira letra do sobrenome.
Sem inventar número que não existe.

> Melhorou com a equipe: agora dá para somar o atendimento de todo mundo num
> número só, que é verdadeiro e maior do que o de qualquer um sozinho.

### 06 — Nenhum vídeo, num produto que ainda não existe ✅ *resolvido em 25/08/2026*

As duas LPs têm a apresentação oficial da Cury em `#video`, com fachada de
capa: o iframe só entra no clique. Urban `6axzV4gheEU`, Mérito
`2a6CZsaKMu4`.

O que mudou em relação ao plano original: **não é vídeo de decorado.** O
vídeo apresenta o empreendimento, e o decorado ficou para a visita
presencial — que é o que o CTA da seção agenda. Prometer decorado e
entregar institucional custaria mais confiança do que a seção rende.

A capa é o frame oficial do próprio vídeo, convertido para webp (88 KB) e
servido do nosso domínio. Puxar a thumbnail do `i.ytimg.com` entregaria o
IP de quem apenas passou pela página ao Google, sem play nenhum.


**Área pronta no Urban desde 22/08/2026** — falta só o vídeo. Ver item 26.

*urban · mérito*

As duas páginas são 100% imagem estática. Em lançamento na planta o comprador
não pode visitar nada — o vídeo é o que substitui a visita.

- Vídeos, tours 360° ou embeds: **0** nas duas páginas

**Correção.** O de maior retorno pelo menor esforço é um vídeo vertical curto
explicando como funciona a entrada de R$ 800. Serve na landing page e no
Instagram, e é conteúdo que nenhum concorrente copia.

> Com a equipe, dá para dividir: quem tem mais desenvoltura na câmera grava.

### 07 — A urgência real do lançamento não está sendo usada ✅ *feito em 23/08/2026*

Linha na seção de lançamento e pergunta no FAQ dos dois sites: a tabela é
corrigida todo mês, padrão em todos os empreendimentos. Sem promessa de
valorização.

*urban · mérito*

As páginas não têm escassez inventada, e isso está certo. Mas lançamento tem uma
urgência verdadeira: **a tabela sobe conforme a obra avança.** Quem compra na
fase inicial paga menos que quem compra seis meses depois — e a página não diz
isso em lugar nenhum.

**Correção.** Uma linha na seção de lançamento explicando que o valor acompanha
o avanço da obra. É factual, verificável e cria motivo real para agir agora —
sem cronômetro nem "últimas unidades".

**Regra permanente: não inventar escassez.**

### 08 — Falta a conta que converte quem paga aluguel ✅ *feito em 23/08/2026*

Bloco aluguel × parcela dentro de `#como-comprar` nos dois, com números
ilustrativos e ressalva. O FGTS, que faltava no Mérito, entrou junto.

*urban · mérito*

O público principal são pessoas de 35+ pagando aluguel. A página apresenta preço
e entrada, mas nunca faz o comparativo que essa pessoa faz de cabeça: quanto ela
já pagou de aluguel e como isso se compara à parcela.

- Comparativo aluguel × parcela: **ausente** nos dois
- Menção ao FGTS como entrada: presente no Urban, **ausente no Mérito**

**Correção.** Um bloco curto do tipo "você paga R$ 1.800 de aluguel há 8 anos —
isso é R$ 172 mil que não voltam", com convite para simular. E levar a menção ao
FGTS para o Mérito.

---

## Médio

### 09 — O Urban carrega fontes externas; o Mérito não

*urban*

O Urban faz 4 requisições ao Google Fonts, que bloqueiam a renderização do
texto. O Mérito usa fonte de sistema e não faz nenhuma. Em tráfego pago vindo de
celular, isso é atraso na primeira dobra — exatamente onde está o preço.

**Correção.** Hospedar as duas fontes no próprio servidor, com
`font-display: swap`.

### 10 — O Mérito pesa quase o dobro em imagens ⚠️ *revisto em 23/08/2026*

**Achado praticamente sem ação.** Medi as larguras reais de exibição a 1440px e
comparei com os arquivos: as imagens do Mérito já estão dimensionadas para 2x.
A piscina exibe a 797px com arquivo de 1400px; as fotos de lazer exibem a 285px
com 700px; o fundo do CTA final exibe em largura cheia com 1600px, que é até
**menor** que o ideal para retina. Não há gordura para cortar sem perder
qualidade.

O único ganho real foi remover o `implantacao.webp` (97 KB), que ficou sem uso
quando o mapa saiu.

*mérito*

1,95 MB em 26 arquivos, contra 1,07 MB em 20 do Urban, para uma página de
estrutura parecida. A diferença está nas fotos de lazer e nas plantas.

**Correção.** Reprocessar as fotos de lazer do Mérito nas mesmas larguras de
exibição usadas no Urban.

### 11 — O Mérito não mostra apartamento decorado ✅ *resolvido em 25/08/2026*

Resolvido pelo outro lado, sem foto de interior. A seção estava com
`hidden` justamente porque não havia o que mostrar; agora ela promete a
apresentação do projeto e entrega exatamente isso.

Saiu junto a `figure` que apontava para `decorado.webp` — arquivo que nunca
existiu e que teria virado imagem quebrada na publicação.

Continua valendo pegar fotos do decorado no material da Cury quando
houver: elas entram como seção própria, não dentro desta.


**Virou bloqueio:** a seção `#decorado` está pronta mas oculta até existir foto de interior ou vídeo.

*mérito*

Há fachada, portaria, implantação e lazer — mas nenhuma foto do interior. O
Urban tem duas. Quem compra na planta quer ver como se mora, não só onde fica.

**Correção.** Pegar as fotos de decorado no material oficial da Cury e
acrescentar à seção de plantas.

### 12 — O botão do topo some justamente no celular ✅ *resolvido em 22/08/2026*

O Mérito ganhou a barra fixa mobile do Urban, com texto e os dois valores.

*mérito*

O CTA "Consultar unidades" do cabeçalho é ocultado abaixo de 640px. No Urban
existe a barra fixa inferior que cobre esse papel; no Mérito sobra apenas o
botão flutuante circular, sem texto.

**Correção.** Avaliar a barra fixa inferior do Urban também no Mérito.

---

## Itens novos — vindos da reestruturação da equipe

### 13 — Registrar o lead num destino compartilhado ✅ *feito em 24/08/2026*

Cloudflare D1 + `/painel/` + CRM em Next.js. Em produção e verificado.

*urban · mérito* — **crítico para o modelo de equipe**

O gate de qualificação passa a gravar o lead antes de abrir o WhatsApp. Resolve
o item 02 e, principalmente, resolve a divisão de leads: o time inteiro vê o que
chegou, em ordem, com uma coluna de quem pegou.

**Campos: nome + renda. Não pedir telefone nem e-mail.**

- O **telefone é redundante** — no segundo em que a pessoa manda mensagem, o
  número aparece. Pedir antes gera a objeção justa: *"por que você quer meu
  número se eu vou te chamar agora?"*
- O **e-mail** é o campo de menor valor para esse público e o de maior atrito.
- Se depois o `qualification_answered` for muito maior que o número de conversas
  que chegaram de fato, aí sim vale acrescentar o telefone para perseguir quem
  abandonou. **Deixar o dado decidir, não o palpite** — a medição já está
  instalada.

**Destino sugerido:** planilha do Google via Apps Script. Grátis, o time vê ao
vivo, dá para ordenar por data e ter a coluna "quem pegou" — que é literalmente
o processo de divisão de vocês. Migrar para CRM quando o volume justificar.

### 14 — Troca de marca e de domínio

*urban · mérito* — **parcialmente feito em 22/08/2026**

- [x] `canonical` dos dois sites → `gruposaitama.com.br`. O do Urban era o
      placeholder `https://SEUDOMINIO.com.br/`; o do Mérito apontava para o
      domínio antigo.
- [x] `og:url`, `og:image`, `twitter:image` e `author` atualizados.
- [x] **Prévia de compartilhamento corrigida nos dois.** O Urban referenciava
      um `og-image.jpg` que **não existia** — quem mandava o link no WhatsApp
      não via imagem nenhuma. O Mérito tinha `og:image` em **caminho
      relativo** (Open Graph exige URL absoluta) e em WebP, formato que a
      prévia do WhatsApp trata de forma instável. Gerados dois JPEG de
      1200×630 a partir dos heroes.
- [ ] **Redirect Rule do domínio antigo** — `sebastianiimoveis.com.br` →
      `gruposaitama.com.br`, com 301. Isso **não** se faz no `_redirects`,
      que casa caminho e não domínio: é regra no painel do Cloudflare, na zona
      do domínio antigo.
- [ ] Nome visível nas páginas → item 15.
- Ao usar o nome *Saitama*: o nome é uma província real do Japão, o que o torna
  defensável e profissional para quem não conhece o anime. **Não usar a imagem
  do personagem, a capa vermelha, o logo ou o traço do mangá** — isso é
  propriedade da Shueisha. O nome, por ser topônimo real, é tranquilo.

### 15 — Centralizar o nome da marca no código

*urban · mérito*

"Sebastiani Imóveis" está fixo em **6 pontos do HTML** dos dois sites, além do
`SITE_CONFIG`. Hoje a troca de nome não é uma linha só.

**Correção.** Consolidar para que a mudança de marca vire um valor único. Fazer
junto com o item 14, para não mexer duas vezes.

### 16 — LGPD ✅ *feito em 23/08/2026*

Política em `/privacidade/`, aceite obrigatório no formulário e gravado na
coluna `consentimento`. Falta criar a caixa de e-mail que a política cita.

*urban · mérito* — **obrigatório a partir do item 13**

No instante em que os sites começarem a guardar nome e contato, passa a ser
exigência legal: aviso de privacidade e consentimento no formulário. Barato
fazer junto, caro consertar depois.

### 17 — Ação de conversão própria do Mérito no Google Ads

*mérito*

Os dois sites usam hoje o mesmo rótulo
`AW-18388777321/7T_mCNngruEcEOnyucBE`. Funciona, mas mistura Urban e Mérito no
mesmo número — não dá para saber qual empreendimento gerou o quê.

**Correção.** Criar uma ação de conversão só do Mérito e trocar o
`adsConversionLabel` no `SITE_CONFIG`. É o único lugar com esse dado.

### 18 — Importar `qualification_answered` como conversão no Ads

*urban · mérito*

Agora que o GA4 está vinculado, dá para otimizar a campanha para **lead que
respondeu**, e não para clique.

**Só faz sentido com volume.** Abaixo de ~30 conversões/mês o algoritmo não
aprende. Reavaliar quando as campanhas voltarem.

---

## Estado da publicação — 24/08/2026

As duas LPs estão **no ar** em `sebastianiimoveis.com.br`, com o formulário
gravando no D1. Deploy feito por `wrangler deploy` (não há integração com o
GitHub — `git push` não publica).

### Descoberta que mudou a arquitetura

O projeto no Cloudflare é um **Worker com assets estáticos**, não um projeto
Pages. A pasta `functions/` — convenção exclusiva do Pages — não funcionava:
`/api/lead` daria 404 e nenhum lead seria gravado. Reescrito como Worker,
com roteamento à mão em `worker/index.js`.

Era também a explicação do binding de D1 que "não fazia nada" no painel: não
havia código publicado para conectar ao banco.

### Falta para ficar completo

- [ ] **Cloudflare Access** no `/painel/` e `/api/painel`. Hoje o painel
      carrega para qualquer um; nenhum dado vaza porque a API falha fechada,
      mas isso não é proteção. Passo a passo no `LEADS.md`.
- [ ] **Domínio novo.** `gruposaitama.com.br` não está registrado. Tudo
      aponta para `sebastianiimoveis.com.br`, que é o que resolve.
- [ ] **Notificação por e-mail** (Resend) e a caixa `privacidade@`.
- [ ] **Ação de conversão do Ads** apontando para `lead_submit`, que passou
      a ser a conversão — não é mais o clique no WhatsApp.

---

## Tecnologia e organização do projeto

A meta é manter tudo leve — HTML, CSS e JavaScript puro, sem build e sem
dependência — mas parar de operar como dois sites soltos e passar a operar como
uma frota.

### Premissa que define a arquitetura: LP é descartável

Uma landing page de lançamento tem prazo de validade. Quando as vendas
terminam, ela sai do ar ou é redirecionada — não faz sentido manter no ar a
página de um lançamento que não existe mais.

Isso significa que **o ativo permanente é o código comum, não o site**. Cada LP
é um inquilino temporário. Toda decisão abaixo sai dessa premissa.

### 19 — Peso morto no repositório ✅ *feito em 22/08/2026*

- [x] `urban-vila-guilherme/assets/images/_originais/` — 4,3 MB
- [x] `merito-ipiranga/assets/images/_nao-usadas/` — 14 MB

Eram 42 arquivos versionados que nenhuma página referenciava. Verificadas as 64
referências de imagem dos dois sites antes de mexer: nenhuma apontava para lá.

Não deixavam o site lento para o visitante (ninguém requisitava esses arquivos),
mas subiam em todo deploy, entravam em todo `git clone` e ficavam publicamente
acessíveis. O `clone` passou a importar agora que a equipe cresceu.

**Resultado: 22,6 MB → 3,5 MB.** Os originais foram preservados em
`../LpsCorretagem-originais/`, fora do repositório.

- [x] `.gitignore` criado, para o lixo não voltar.
- [x] `.gitattributes` criado, com `* text=auto eol=lf`.

### 20 — Extrair o código comum para `/shared/`

O mesmo código está escrito duas vezes, em dois dialetos diferentes de
JavaScript. **Nove funções duplicadas:** `trackEvent`, `getWhatsAppUrl`,
`readCampaign`, `reportLead`, `reportWhatsAppConversion`, `setupWhatsAppLinks`,
`setupQualifier`, `setupMobileMenu`, `init`.

O Urban está em ES5 (`var`, `function`, IIFE); o Mérito em ES moderno (`const`,
arrow functions). Não são cópias iguais — são traduções. Toda correção precisa
ser feita duas vezes, e uma hora alguém esquece um lado.

**Solução sem build.** Como é um repositório só, servido num domínio só por
subpastas, dá para usar **módulos ES nativos**:

```
/shared/tracking.js     trackEvent, campanha, UTM/gclid
/shared/whatsapp.js     getWhatsAppUrl, reportLead, conversão
/shared/qualifier.js    o gate de qualificação
/shared/base.css        estrutura, botões, utilitários
```

Cada LP importa com `<script type="module">` e define só o que é dela.
Zero dependência, zero ferramenta nova.

> Ressalva: módulos ES não funcionam abrindo o arquivo com `file://` — o
> navegador bloqueia por CORS. Passa a ser necessário um servidor local para
> testar.

### 21 — Padronizar o esqueleto, personalizar a pele

**Cada LP mantém a identidade visual do empreendimento que vende.** Quem clica
no anúncio está comprando o Mérito Ipiranga, não a imobiliária: já viu o
material da Cury, a placa, o post. Página fora dessa identidade gera dúvida — e
em venda na planta, dúvida sobre legitimidade é cara.

**Padronizar** (o que o visitante não percebe como "design"):
ordem e função das seções · posição e comportamento dos CTAs · gate de
qualificação · eventos e parâmetros de rastreamento · barra fixa mobile, FAQ,
lightbox, animação de entrada · rodapé e textos legais · padrões de copy.

**Personalizar:** paleta, tipografia, imagens, composição do hero.

O ganho real não é economia de tempo: é que **o aprendizado de conversão passa a
acumular**. Uma melhoria no funil aplica em todos os lançamentos de uma vez,
inclusive nos próximos. A objeção "vai ficar tudo igual" não se sustenta —
nenhum comprador vê duas LPs suas lado a lado.

**A marca do Grupo Saitama vive na mobília constante:** card do consultor,
rodapé, credibilidade, CRECI, prova social. O visitante lê "Mérito Ipiranga,
atendimento Grupo Saitama" — não uma página do Mérito pintada de Saitama.

**No código:** os dois sites já definem tokens em `:root`, mas com nomes
próprios (`--urban-green`, `--navy`). Um CSS comum não consegue referenciar
`--urban-green`. Renomear para papéis semânticos — `--accent`, `--accent-ink`,
`--surface`, `--ink` — e cada LP preenche os papéis com as cores dela.

Depois disso, lançamento novo é: copiar o esqueleto, trocar o bloco de tokens,
trocar as imagens.

> **A confirmar com a Cury:** se existe manual de marca ou exigência sobre como
> os empreendimentos podem ser apresentados por terceiros. Melhor descobrir
> antes de padronizar.

### 22 — Estrutura de pastas por ciclo de vida

Os dois sites têm layouts diferentes sem motivo: o Urban usa `css/` e `js/` na
raiz, o Mérito usa `assets/css/` e `assets/js/`.

Aproveitando a troca de domínio (custo zero agora, alto depois):

```
/                          institucional Grupo Saitama (permanente)
/shared/                   código comum (permanente)
/lancamentos/urban-vila-guilherme/
/lancamentos/merito-ipiranga/
```

**Problema com data marcada:** hoje o `index.html` da raiz redireciona para
`/urban-vila-guilherme/`. No dia em que o Urban encerrar, a raiz do domínio
aponta para um lançamento morto. A raiz precisa ser a página institucional.

Com o prefixo `/lancamentos/`, aposentar uma LP vira uma regra só.

### 23 — Configuração do Cloudflare

*parcialmente feito em 22/08/2026*

- [x] `_headers` criado na raiz.
- [x] `_redirects` criado na raiz.
- [ ] Deploy de preview por branch.
- [ ] Cloudflare Web Analytics.

**Sobre o cache que ficou no `_headers`:** nenhum arquivo tem hash no nome
(não há build), então `immutable` só entrou onde o conteúdo realmente nunca
muda — ícones e fontes. Imagens ficaram em 30 dias, porque já foram trocadas no
mesmo nome (recompressão). CSS e JS revalidam sempre: com ETag a resposta é um
304 vazio quando nada mudou, e o deploy chega na hora em quem já visitou. Se
fossem cacheados por muito tempo, todo ajuste ficaria invisível para quem já
tinha entrado no site.

**Sem Content-Security-Policy de propósito:** as páginas usam script inline (a
tag do gtag e o script da classe `.js`). Uma CSP com `'unsafe-inline'` não
protegeria de quase nada, e uma restritiva quebraria o rastreamento.

> **VERIFICAR ANTES DE RELIGAR AS CAMPANHAS:** o redirecionamento da raiz
> precisa preservar a query string. Testar `gruposaitama.com.br/?gclid=teste`
> e confirmar que o `gclid` chega em `/urban-vila-guilherme/`. Se ele se
> perder, a atribuição do Google Ads quebra na raiz. O `index.html` da raiz
> foi mantido de propósito como rede de segurança: se o `_redirects` não
> pegar, o redirecionamento por JavaScript ainda funciona e já preserva
> `search` e `hash`.

O que ainda não existe:

**`_redirects`** — três usos:

1. O redirecionamento da raiz hoje é **via JavaScript**: carrega a página
   inteira, executa o script, e só então redireciona. Para quem vem de anúncio,
   é latência à toa. Na borda é instantâneo.
2. **Troca de domínio** — sem 301 do antigo para o novo, perde-se a indexação.
3. **Aposentadoria de LP** — nunca deixar virar 404. A URL vai continuar
   existindo em posts, prints e conversas salvas. Quem chega procurando o Urban
   seis meses depois cai no que vocês estão vendendo agora:
   ```
   /lancamentos/urban-vila-guilherme/*  /  301
   ```

**`_headers`** — cache longo e imutável para imagens, CSS e JS. É o ganho de
performance mais barato que existe num site estático.

**Deploy de preview por branch** — o Pages gera URL própria para cada branch.
Hoje existe só o `master`. Com equipe, é o que separa trabalho organizado de
todo mundo commitando direto e torcendo.

**Cloudflare Web Analytics** — grátis, sem cookie, e por isso **não exige banner
de consentimento**. Não substitui o GA4; dá número real de visita sem depender
de quem bloqueia rastreador.

### 24 — Aposentar uma LP: procedimento

Quando as vendas de um lançamento terminarem:

1. `git tag encerrado/<nome-da-lp>` antes de remover a pasta — o código fica
   recuperável sem pesar no deploy.
2. Regra 301 no `_redirects` apontando para a raiz.
3. **Pausar, não excluir**, a ação de conversão no Google Ads — o histórico
   serve de referência para o próximo lançamento.
4. Acrescentar o empreendimento à seção "já vendemos" do institucional.

> O passo 4 resolve parte do achado 05: lançamento encerrado vira **prova
> social**. O histórico se constrói sozinho conforme os lançamentos rodam, sem
> precisar inventar número.

> O GA4 é uma propriedade só para o site inteiro, e é por isso que essa decisão
> estava certa: os lançamentos encerrados mantêm o histórico no mesmo lugar, e
> dá para **comparar desempenho entre lançamentos** — qual converteu melhor,
> qual teve custo por lead menor. Com propriedade por LP, esse dado morreria
> junto com o site.

### 26 — Padronização das seções ✅ *Urban feito em 22/08/2026*

Ordem canônica definida, respondendo as perguntas de quem chega na sequência
em que elas aparecem: hero → confiança → lançamento → localização → como
comprar → decorado → plantas → lazer → Cury/consultor → FAQ → CTA final.

**Feito no Urban:**

- [x] `#lancamento` subiu da posição 5 para a 3.
- [x] **Fusão de duas seções redundantes.** "Minha Casa Minha Vida" e "Não é
      só escolher a planta" diziam a mesma coisa (categorias diferentes,
      depende de renda/enquadramento/crédito, eu analiso), tinham as duas uma
      foto de decorado e terminavam no mesmo CTA. Viraram uma seção só,
      `#como-comprar`.
- [x] **Seção `#decorado` criada**, com área de vídeo preparada e oculta até
      existir vídeo. Recupera a foto `living.webp`, que antes era só
      decoração de seção.
- [x] Navegação reordenada para acompanhar a página (6 itens).
- [x] Evento `video_play` instrumentado.

**Pendente:**

- [ ] Gravar/obter o vídeo do decorado e ativar a área (4 passos comentados
      no `index.html`).
- [x] **Mérito reestruturado em 22/08/2026.** Lançamento subiu da posição 6
      para a 3; implantação ficou colada no lazer; os números do
      condomínio desceram para o bloco de credibilidade; seção de decorado
      criada (oculta, ver abaixo); barra fixa mobile no lugar do botão
      flutuante; `id` nas 6 seções que não tinham; CTA acrescentado ao
      lazer; `data-source` normalizado (`floating` → `mobile_fixed`,
      `tour` e `leisure` acrescentados).
- [x] **Mérito reduzido às mesmas 11 áreas do Urban** (23/08/2026): o mapa de
      implantação entrou no lazer e os números do condomínio entraram na seção
      da construtora. As duas seções extras deixaram de existir. A faixa sem
      título virou `<div>`, como no Urban.
- [x] **Urban ganhou os prêmios da Cury** — os cinco adjetivos genéricos da
      seção da construtora viraram 33x Top Imobiliário, 13x Master
      Imobiliário e 14x Destaque ADEMI, que são verificáveis. Ataca em parte
      o achado 05.
- [x] **Mapa de implantação retirado do Mérito** (23/08/2026). O arquivo é
      754x1500 (retrato) e ocupava quase 1800px de altura na página. O
      `implantacao.webp` continua na pasta mas não é referenciado por nada —
      se não voltar a ser usado, sai do repositório junto com o próximo
      arrastão de peso morto.
- [ ] **Números do empreendimento no Urban** — a área existe (dentro de
      `#construtora`), mas faltam os dados: torres, unidades, pavimentos.
- [ ] **Decorado do Mérito continua oculto** — depende do achado 11: não há
      nenhuma foto de interior no projeto.
- [ ] **Prova social** — é a área de maior valor ainda ausente, mas depende de
      conteúdo que vocês não têm: 2 a 3 depoimentos reais. Sem eles, criar a
      área só produziria uma caixa vazia. Ver achado 05.

> O `source` de rastreamento `mcmv` deixou de existir com a fusão. O CTA
> sobrevivente usa `profile`.

### 25 — Padronizações menores

- **CSS do Mérito tem uma linha de 1372 caracteres** — está minificado no fonte.
  Ninguém revisa isso num diff. O do Urban é legível (máximo 117). Minificação,
  se quiserem, é etapa de deploy, não de código-fonte.
- **Unificar o dialeto de JavaScript** no ES moderno do Mérito. O ES5 do Urban é
  legado sem motivo — nenhum navegador que interessa aqui precisa disso.
- **`SITE_CONFIG` com o mesmo formato** nos dois.
- **Conjunto de ícones** — o Urban tem só `favicon.svg`; o Mérito tem o conjunto
  completo (`apple-touch-icon`, `favicon.ico`, 16/32/48/192). Igualar.

### O que NÃO fazer

**Não adotar framework nem build** (Astro, 11ty, Vite). "Mais profissional"
costuma ser lido como "adicionar React", e aqui seria o caminho errado:
acrescenta dependência, build e ponto de quebra, para resolver um problema que
ainda não existe.

Com 2 ou 3 sites, copiar o esqueleto custa menos que manter um build.
**Revisar no quarto ou quinto lançamento** — aí o template se paga. Como as LPs
têm ciclo de vida curto, esse número chega mais rápido do que parece.

### Ordem de execução — tecnologia

| # | Ação | Ganho | Esforço | Trava |
|---|------|-------|---------|-------|
| 19 | Limpar peso morto + `.gitignore` | Imediato | Baixo | ✅ feito |
| 23 | `_redirects` e `_headers` | Alto | Baixo | — |
| 23 | Deploy de preview por branch | Alto | Baixo | — |
| 25 | Desminificar CSS do Mérito, unificar dialeto | Médio | Baixo | — |
| 20 | Extrair `/shared/` | Alto | Médio | — |
| 21 | Papéis semânticos nos tokens | Alto | Médio | sai com o 20 |
| 22 | Reestruturar pastas por ciclo de vida | Alto | Médio | decisão B (domínio) |
| 24 | Documentar o procedimento de aposentadoria | Médio | Baixo | — |


---

## Ordem de execução

Ordenada por retorno sobre esforço, já considerando a reestruturação. Os itens
com decisão pendente estão marcados.

| # | Ação | Impacto | Esforço | Trava |
|---|------|---------|---------|-------|
| 03 | Eventos de engajamento (scroll, seções, FAQ) | Alto | Baixo | — |
| 04 | Instalar pixel da Meta | Alto | Baixo | conta da nova marca |
| 14 | Corrigir `canonical` e trocar domínio/marca | Alto | Baixo | decisão B |
| 07 | Linha sobre evolução do preço por fase de obra | Médio | Baixo | — |
| 17 | Ação de conversão própria do Mérito | Médio | Baixo | — |
| 13 | Gravar lead em destino compartilhado | Alto | Médio | decisão A |
| 16 | Aviso de privacidade e consentimento | Obrigatório | Baixo | sai com o 13 |
| 05 | CRECI do gestor + 2 a 3 depoimentos | Alto | Baixo | decisão C |
| 08 | Bloco aluguel × parcela + FGTS no Mérito | Alto | Médio | — |
| 15 | Centralizar nome da marca no código | Médio | Baixo | sai com o 14 |
| 11 | Fotos de decorado no Mérito | Médio | Baixo | — |
| 09 | Hospedar fontes do Urban localmente | Baixo | Baixo | — |
| 10 | Recomprimir fotos de lazer do Mérito | Baixo | Baixo | — |
| 12 | Barra fixa mobile no Mérito | Médio | Médio | — |
| 06 | Vídeo curto sobre a entrada facilitada | Alto | Alto | — |
| 18 | Importar qualificação como conversão no Ads | Alto | Baixo | volume |

---

## Princípios que não mudam

- **Não inventar escassez.** Nada de cronômetro ou "últimas unidades". A
  urgência do item 07 é real e verificável.
- **Não prometer valorização** — seria promessa de investimento.
- **Não citar prazo de entrega** que não esteja em contrato.
- **Nunca bloquear o lead.** Toda qualificação tem saída para quem não quer
  responder.
- **Sem frameworks nem dependências.** HTML, CSS e JavaScript puro, sem build,
  sem backend. As páginas precisam ser leves porque o tráfego é pago e vem de
  celular.
- **Rastreamento nunca quebra a página.** Toda instrumentação é inerte se a tag
  não existir.
- **UTM e `gclid`** vão nos eventos, nunca dentro da mensagem enviada ao
  cliente.

---

## Como medir se a qualificação vale a pena

O item 01 reduz o volume de contatos de propósito. Isso é uma decisão comercial,
não técnica, e agora dá para decidir com dado em vez de impressão:

- `qualification_shown` muito maior que `qualification_answered` → a pergunta
  está espantando gente. Remover o `data-qualify` dos CTAs.
- Muita resposta na faixa "Até R$ 4.000" → o problema está na segmentação da
  campanha, não na página.
- `qualification_answered` muito maior que o número de conversas que realmente
  chegaram → vale acrescentar o telefone no item 13.

Vale medir por **duas semanas** depois que as campanhas voltarem, antes de mexer.

> O GA4 envia eventos em lote: no DevTools a requisição para `/g/collect` pode
> demorar alguns segundos depois do clique. Não é erro. Para ver em tempo real,
> use o **DebugView** do GA4.
