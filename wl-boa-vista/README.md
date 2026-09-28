# WL Boa Vista — Landing page

`https://gruposaitama.com.br/wl-boa-vista/`

Criada em 28/09/2026 sobre o esqueleto do Urban Vila Guilherme: mesmas
seções, mesmas classes, mesmo formulário de lead e o mesmo `main.js`
(com o que é próprio do empreendimento trocado). A pele — cores, fontes,
logo — saiu do book digital do WL Boa Vista.

```
index.html
css/style.css        cópia do Urban, com paleta e tipografia do WL
js/main.js           cópia do Urban (slug, sessão, mensagens, conversão)
assets/images/       tudo recortado do book; nada gerado
assets/icons/        monograma WL do logo oficial
```

## Pendências antes de subir campanha

1. **Rótulo de conversão do Google Ads.** `ADS_CONVERSION` em `js/main.js`
   está vazio de propósito: Urban e Mérito têm ação de conversão própria, e
   reaproveitar o rótulo de outra LP mistura os resultados. Crie a ação no
   Ads e cole o rótulo (`AW-18388777321/xxxx`). Enquanto estiver vazio, o
   `lead_submit` continua indo para o GA4.
2. **Vídeo.** A área está pronta e escondida; os 4 passos para ativar estão
   no comentário acima de `#video` no `index.html`.
3. **Card na lista de empreendimentos** (`/empreendimentos/`) — não foi
   feito.

## Por que a página não mostra preço — e onde aparece `R$`

Mesma decisão do Urban (ver `urban-vila-guilherme/README.md`, seção 5).
No WL, quem qualifica no lugar do preço são as **categorias HIS** (HIS-1 até
3 salários mínimos, HIS-2 até 6), que estão na lei e não vencem todo mês.

`grep -n 'R\$' index.html` **não** volta vazio, e está certo assim:

- as faixas de renda do formulário (iguais às do Urban);
- os **tetos de valor** das unidades HIS-1 e HIS-2 no rodapé legal. Eles
  são aviso obrigatório da incorporadora (Decreto nº 64.895/2026), vêm da
  última página do book e não são preço de venda. Se o decreto for
  corrigido pelo INCC, atualize o rodapé.

## De onde veio cada imagem

Páginas do PDF renderizadas em 3840×2160 e recortadas sem os selos de
legenda e sem as molduras/arcos da diagramação:

| Arquivo | Página do book |
|---|---|
| `hero*` (e `og-image.jpg`) | 6 — fachada |
| `localizacao*` | 5 — foto aérea com as etiquetas (inteira; o clique amplia) |
| `portaria*` | 27 — portaria |
| `lazer/*` (16 fotos, 800×600) | 9 a 24 |
| `plantas/*` | 29 a 32 |
| `logo.png` / `logo-claro.png` | PNG oficial, recolorido sobre fundo transparente |

WebP + AVIF para hero, mapa, portaria e plantas; lazer só WebP (como no
Urban).

## Diferenças em relação ao Urban

- **Header em barra própria**, não sobreposto ao hero: a fachada do WL é
  céu e prédio, o menu não teria contraste por cima dela.
- **"Como comprar" sem foto**: o book não tem decorado. A coluna da imagem
  virou o quadro das 3 categorias (HIS-1, HIS-2, R2V).
- **Preload do hero em AVIF** (corrigido no Urban também em 28/09/2026). O preload do WebP com `<picture>`
  servindo AVIF baixava a foto duas vezes (o console avisava
  "preloaded but not used").
- **FAQ próprio**: vaga (80 vagas para 684 aptos), revenda/locação de HIS,
  mercadinho e lavanderia pay per use.
