# Casa à venda na Vila Ester

Anúncio de imóvel de revenda, marca Sebastiani Imóveis.
Endereço: `https://sebastianiimoveis.com.br/casa-vila-ester/`.

**Status: em desenvolvimento, NÃO publicado** (23/09/2026).

## Decisões

- **Não segue o `PADRAO-LP.md`.** Aquele padrão é de lançamento na planta
  (12 áreas, obra, construtora). Aqui é casa pronta e habitada; a
  estrutura segue o layout aprovado: hero → ficha → sobre → fotos →
  diferenciais → localização → região → contato + FAQ.
- **CTA direto para o WhatsApp**, como na LP de investidores (mesma marca,
  mesmo domínio). O lead não entra no CRM. Ver o cabeçalho de `js/main.js`.
- **Sem endereço exato na página.** Casa habitada: o endereço vai para quem
  agenda a visita. Por isso o mapa é um SVG ilustrativo, não um embed.
- **Worker:** `/casa-vila-ester/` entrou em `CAMINHOS_INVESTIDORES`
  (`worker/index.js`). Sem isso, o domínio da Sebastiani redirecionaria a
  página para o domínio do grupo.

## Imagens: antes e depois

Desde 23/09/2026 a página só mostra ambientes que têm as duas versões: a
foto real e a ambientação feita com IA (originais em
`Downloads/dadosCasaVerde/revitalizado`). A galeria de fotos cruas saiu.

- `assets/images/comparar/<nome>-antes|depois-480|800|1200.avif|webp` + `<nome>-mini.webp`
  (AVIF q42, WebP q66). No celular o `sizes` pede 60vw de propósito: a
  tela densa escolhe a de 800px (~20 KB) em vez da de 1200px (~40 KB). Os
  outros ambientes são pré-carregados em fila quando a seção se aproxima.
  A lista de pares está em `PARES`, em `js/main.js`.
- A IA reenquadra a cena, então o `antes` é um RECORTE da foto original,
  achado por correlação de bordas para a linha do comparador cortar o mesmo
  ponto nas duas imagens. Se trocar uma imagem, refazer o recorte.
- `sala-escada` (a mesma ambientação do hero) entrou no comparador em
  23/09 a pedido do cliente, mas é o par de alinhamento mais fraco: a IA
  mudou a geometria do cômodo — pôs uma janela grande na parede da
  esquerda, que na casa real é parede lisa, e mudou a TV de parede. Aqui o
  recorte é da imagem NOVA (84%, deslocada 11% à direita), não da antiga.
  Se a ambientação for refeita sem a janela, trocar o hero e este par.
- `quintal` entrou em 23/09 a pedido do cliente. Alinhamento ótimo, mas a
  IA acrescentou uma churrasqueira de alvenaria (obra).
- **Aviso por ambiente:** o 4º campo de `PARES` (em `js/main.js`) é um aviso
  que aparece embaixo do comparador quando aquele ambiente está na tela.
  Usado em `sala-escada` (janela) e `quintal` (churrasqueira). Toda
  ambientação que mostrar obra, e não só decoração, precisa ter um.
- Ficou de fora uma ambientação sem foto real correspondente: um segundo
  dormitório.
- **Toda imagem de IA tem aviso junto** (hero, nota do comparador, rodapé).
  Não remover: anúncio que mostra acabamento que não vem com o imóvel sem
  dizer isso é publicidade enganosa.
- A fachada (`fachada`) é a foto tratada, com o número da casa coberto.

## Antes de publicar

- [ ] Confirmar os dados (150 m² confirmado pelo cliente em 23/09), 2 dormitórios, 2 banheiros, 2 vagas,
      dependência completa, R$ 850.000
- [ ] Confirmar que o piso é de madeira (tábua corrida) e não laminado —
      o texto do antes e depois afirma "piso de madeira"
- [ ] Confirmar se aceita financiamento/FGTS (a resposta do FAQ é genérica)
- [ ] Conferir os tempos de deslocamento (estimativa de carro)
- [ ] **CRECI no rodapé** — obrigatório em anúncio de imóvel
- [ ] Criar ação de conversão própria no Ads e preencher `ADS_CONVERSAO`
- [ ] Acrescentar ao `sitemap.xml`
- [ ] Ao vender: redirect 301 em `_redirects` e sair do sitemap
