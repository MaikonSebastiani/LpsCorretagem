/**
 * Cadastro dos consultores do Grupo Saitama.
 *
 * ESTE É O ÚNICO ARQUIVO QUE PRECISA SER EDITADO PARA ADICIONAR OU REMOVER
 * ALGUÉM DA PÁGINA /equipe. A página se monta a partir daqui.
 *
 * =====================================================================
 * ESTÁ VAZIO DE PROPÓSITO.
 *
 * Não inventei nenhum integrante, CRECI, região de atuação ou
 * especialidade — nada aqui pode ser suposição. Enquanto a lista estiver
 * vazia, a página mostra só a apresentação do grupo e NÃO é indexada
 * (ver a meta `robots` em equipe/index.html).
 *
 * AO CADASTRAR O PRIMEIRO CONSULTOR DE VERDADE, faça as três coisas:
 *   1. preencha a lista abaixo;
 *   2. troque `noindex` por `index` em equipe/index.html;
 *   3. acrescente /equipe/ ao sitemap.xml.
 *
 * A ordem importa. Uma página de equipe vazia indexada é conteúdo raso, e
 * conteúdo raso sobre assunto financeiro derruba a confiança que a página
 * existe para construir.
 * =====================================================================
 *
 * SOBRE O CRECI
 *
 * O campo existe e é renderizado, mas fica opcional no código porque hoje
 * o número do gestor ainda não está definido.
 *
 * Ele não é enfeite: conteúdo sobre financiamento, renda e subsídio é
 * tratado pelo Google como assunto que afeta a vida financeira das pessoas,
 * e nessa categoria o buscador cobra autoria demonstrável — profissional
 * identificável, com credencial verificável. Sem CRECI exibido, o material
 * educativo sobre Minha Casa Minha Vida tende a não ranquear, por melhor
 * que seja.
 *
 * Ou seja: preencher `creci` destrava a estratégia de conteúdo, não só a
 * formalidade. Enquanto não houver, a página omite a linha inteira em vez
 * de mostrar rótulo vazio.
 *
 * FORMATO DE CADA CONSULTOR
 *
 *   {
 *     nome:      'Nome Sobrenome',        // obrigatório
 *     foto:      'assets/fulano.webp',    // opcional; sem foto vira inicial
 *     creci:     'CRECI-SP 000000-F',     // opcional — ver acima
 *     regioes:   ['Zona Norte'],          // opcional, texto livre
 *     especialidades: ['MCMV', 'FGTS'],   // opcional
 *     apresentacao: 'Uma ou duas frases.',// opcional
 *     whatsapp:  '5511999999999'          // opcional; sem ele, o cartão
 *   }                                     // aponta para a análise de perfil
 *
 * As `regioes` aqui são texto para leitura humana. Não confundir com as
 * chaves de região usadas na distribuição de leads (tabela `corretores`,
 * coluna `regioes`, valores de worker/config.js) — aquilo é dado, isto é
 * apresentação.
 */
window.CONSULTORES = [];
