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

## CTAs de WhatsApp

Todos os botões levam direto para a conversa — não há modal de qualificação.

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

A conversão segue o snippet oficial: dispara o evento e só abre o WhatsApp no
`event_callback`, com timeout de segurança de 300ms caso o gtag não responda
e queda para a mesma aba se o navegador bloquear o pop-up. Sem tag instalada
(`adsConversionLabel` vazio) o WhatsApp abre na hora, sem esperar nada.

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
