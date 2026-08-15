# Mérito Ipiranga - Landing Page

Versão criada a partir da estrutura de conversão do site Urban Vila Guilherme e adaptada à identidade visual e às informações do book digital do Mérito Ipiranga.

## Antes de publicar

1. Confira o `SITE_CONFIG` no topo de `assets/js/main.js` (número do WhatsApp).
   É o único lugar com esse dado.
2. Publique a pasta inteira em `/merito-ipiranga/`.
3. Se a URL final for diferente, altere a tag `canonical` no `<head>` do `index.html`.

## Rastreamento (ainda desativado)

Esta página **não tem tag do Google Ads / GA4 instalada** no momento, de
propósito — o Mérito não compartilha o tagueamento do Urban Vila Guilherme.

Toda a instrumentação já está pronta e inerte: sem tag na página, as funções
de rastreamento simplesmente não fazem nada e o WhatsApp abre normalmente.

Para ativar depois:

1. Cole a tag do `gtag.js` no `<head>` do `index.html` (há um comentário
   marcando o lugar).
2. Preencha `adsConversionLabel` no `SITE_CONFIG`, no formato
   `AW-XXXXXXXXX/XXXXXXXXXXXXXXXX`. Use uma ação de conversão **própria do
   Mérito**, não a do Urban.

## Modal de qualificação

Mesma lógica do Urban Vila Guilherme: 3 perguntas de múltipla escolha
(renda, FGTS/entrada, prazo de compra) antes de abrir o WhatsApp, sem
formulário nem envio para servidor — tudo no front-end.

- Qualquer elemento com a classe `.js-open-lead` abre o modal.
- Nos cards de planta, o atributo `data-planta` entra na mensagem do WhatsApp.
- UTMs e `gclid` são guardados na sessão e vão nos eventos de rastreamento,
  mas nunca dentro da mensagem enviada ao cliente.

### Eventos preparados

`qualification_modal_open` → `qualification_step_1/2/3` →
`qualification_complete` (com `income_range`, `entry_status`, `purchase_timing`)
→ `whatsapp_click`.

Enquanto não houver tag na página, esses eventos não são enviados a lugar
nenhum e o WhatsApp abre imediatamente.

## Conteúdo incorporado

- 1 e 2 dormitórios.
- Plantas: 26,39 m²; 36,80 m²; 36,83 m²; 40,94 m²; 41,84 m²; 45,59 m²; 45,66 m².
- Terraço, opção de suíte e vaga.
- 2 torres, 672 unidades, térreo + 24 pavimentos, 5 elevadores por torre.
- 552 unidades HIS-2 e 120 R2V.
- Lazer e conveniências do material oficial.
- Tempos de deslocamento informados no book.
- Informações institucionais da Cury divulgadas no book.

## Observação

A página evita afirmar preço atual ou disponibilidade fixa. Esses dados devem ser consultados no momento do atendimento.
