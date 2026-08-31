/**
 * Configuração central da plataforma.
 *
 * Tudo que é "lista fechada de valores" vive aqui: renda, entrada, região,
 * status do funil, pesos do score, estratégia de distribuição. O objetivo é
 * que mudar uma regra de negócio seja editar UM arquivo, não caçar string
 * espalhada por sete lugares.
 *
 * ESTE ARQUIVO É A AUTORIDADE. O navegador manda o que quiser; o servidor só
 * aceita valor que esteja aqui. As páginas repetem os rótulos no HTML porque
 * o projeto não tem build — quando mexer numa lista aqui, confira o HTML
 * correspondente (a seção de cada lista diz qual é).
 */

/* ------------------------------------------------------------------
   Renda familiar

   As 4 faixas oficiais do Minha Casa Minha Vida, mais "acima do teto" e
   "prefiro não dizer". Faixa 4 corresponde à "Classe Média" na
   classificação oficial (R$ 9.600,01 a R$ 13.000) — o rótulo não entra
   na chave nem no formulário porque não muda a experiência de quem
   escolhe, só a nomenclatura interna do programa.

   A coluna guarda a chave, nunca o rótulo: o valor em reais de cada faixa
   é reajustado pelo programa, e um lead de hoje precisa continuar
   significando a faixa vigente na data em que entrou.

   HTML: simulacao/index.html (etapa 1) e o modal das duas LPs.
------------------------------------------------------------------ */
export const RENDAS = [
  'ate-3200',
  '3200-5000',
  '5000-9600',
  '9600-13000',
  'acima-13000',
  'nao-informado'
];

/* HTML: simulacao/index.html (etapa 2) */
export const ENTRADAS = [
  'sem-entrada',
  'ate-5k',
  '5k-15k',
  '15k-30k',
  'acima-30k'
];

/* HTML: simulacao/index.html (etapa 3) */
export const FGTS = ['sim', 'nao', 'nao-sei'];

/* Regiões. Cada uma vira rota própria (/imoveis/zona-norte) quando as
   páginas por região entrarem — por isso a chave já é o slug da URL.
   HTML: simulacao/index.html (etapa 4) e a seção de regiões da home.

   Sem "grande-sp": a Cury (a única incorporadora que o grupo representa
   hoje) constrói só na capital e no ABC — Grande São Paulo é mais amplo
   que isso e prometeria atendimento em cidade onde não há o que oferecer. */
export const REGIOES = [
  'zona-norte',
  'zona-sul',
  'zona-leste',
  'zona-oeste',
  'centro',
  'nao-sei'
];

/* HTML: simulacao/index.html (etapa 5) */
export const MOMENTOS = [
  'agora',
  'ate-3-meses',
  '3-a-6-meses',
  'mais-para-frente',
  'pesquisando'
];

/* Múltipla escolha. HTML: simulacao/index.html (etapa 6) */
export const PREFERENCIAS = [
  '1-dorm',
  '2-dorm',
  '3-dorm',
  'com-vaga',
  'sem-preferencia'
];

/* Empreendimentos com landing page própria. Lead da /simulacao entra com
   `empreendimento` nulo — ainda não escolheu, e é esse justamente o
   público que a /simulacao existe para captar. */
export const EMPREENDIMENTOS = [
  'urban-vila-guilherme',
  'merito-ipiranga',
  'novo-mundo-carrao'
];

/* ------------------------------------------------------------------
   Funil

   Ordem importa: é a sequência mostrada no CRM. `novo` é o padrão da
   coluna no banco — mudar a primeira posição aqui exige mudar o DEFAULT
   da tabela junto.
------------------------------------------------------------------ */
export const STATUS = [
  'novo',
  'tentativa_contato',
  'em_atendimento',
  'qualificado',
  'simulacao',
  'visita_agendada',
  'visitou',
  'negociacao',
  'documentacao',
  'venda',
  'perdido',
  'nutricao'
];

/* Tipos de evento do histórico (tabela lead_eventos). */
export const EVENTOS = [
  'lead_criado',
  'lead_reentrada',
  'lead_atribuido',
  'corretor_alterado',
  'status_alterado',
  'contato_realizado',
  'nota_adicionada'
];

/* ------------------------------------------------------------------
   Score — 0 a 100

   Serve para ordenar a fila, não para julgar a pessoa. NUNCA é exibido ao
   visitante (nem o número, nem a classificação).

   Os pesos são deliberadamente editáveis: o que faz um lead ser bom muda
   com a experiência da equipe, e a única forma de calibrar é mexer no
   número e comparar com o que fechou de verdade.

   Momento pesa mais que renda de propósito: renda alta com intenção de
   "só pesquisando" rende menos conversa hoje do que renda modesta com
   "quero comprar agora".
------------------------------------------------------------------ */
export const PESOS = {
  momento: {
    'agora': 35,
    'ate-3-meses': 28,
    '3-a-6-meses': 15,
    'mais-para-frente': 5,
    'pesquisando': 2
  },

  /* Faixa do meio pontua mais: é onde o MCMV ainda ajuda e a parcela cabe.
     Abaixo de R$ 3.200 o subsídio é maior mas a aprovação é mais difícil;
     acima do teto a pessoa sai do programa e vira outro tipo de conversa. */
  renda: {
    'ate-3200': 12,
    '3200-5000': 18,
    '5000-9600': 22,
    '9600-13000': 18,
    'acima-13000': 12,
    'nao-informado': 4
  },

  entrada: {
    'sem-entrada': 4,
    'ate-5k': 10,
    '5k-15k': 16,
    '15k-30k': 20,
    'acima-30k': 22
  },

  /* "Não sei quanto tenho" ainda pontua: quem tem dúvida costuma ter saldo,
     e descobrir isso é justamente parte do atendimento. */
  fgts: {
    'sim': 13,
    'nao-sei': 7,
    'nao': 2
  },

  /* Região definida vale ponto porque encurta o atendimento e permite
     direcionar para o corretor certo. */
  regiaoDefinida: 8,

  /* Quem preencheu dentro da página de um empreendimento já escolheu o
     produto — intenção mais avançada do que quem ainda está descobrindo o
     que cabe no bolso. Sem este peso, o lead da LP pontuaria sempre menos
     que o da /simulacao só por responder menos perguntas, o que inverteria
     a ordem da fila justamente contra quem está mais perto de comprar. */
  empreendimentoDefinido: 10,

  /* Sinais de contato mais fácil. */
  temEmail: 4,
  preferenciaDefinida: 3
};

/* Faixas de classificação. Mexer aqui muda quantos leads aparecem como
   quentes sem precisar tocar no cálculo. */
export const CLASSIFICACAO = [
  { ate: 100, nome: 'hot' },
  { ate: 54, nome: 'warm' },
  { ate: 34, nome: 'nurture' }
];

/* ------------------------------------------------------------------
   Distribuição entre corretores

   'manual'      — ninguém recebe automaticamente; o lead entra sem dono e
                   alguém pega no CRM. É o padrão HOJE, por decisão da
                   equipe ("conseguimos nos virar no manual").
   'round_robin' — reveza entre os corretores ativos.
   'regiao'      — direciona pela região escolhida na /simulacao; cai no
                   rodízio quando ninguém cobre aquela região.

   Trocar de estratégia é trocar esta string. Ver worker/distribuicao.js.
------------------------------------------------------------------ */
export const DISTRIBUICAO = 'manual';

/** Aceita só valor de lista fechada; qualquer outra coisa vira null. */
export function daLista(valor, lista) {
  return typeof valor === 'string' && lista.includes(valor) ? valor : null;
}
