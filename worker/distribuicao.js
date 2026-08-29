/**
 * Distribuição de leads entre corretores.
 *
 * A estratégia é uma string em config.js (DISTRIBUICAO). Hoje está em
 * 'manual' por decisão da equipe — o lead entra sem dono e alguém pega no
 * CRM. As outras estratégias já funcionam; trocar é editar aquela linha,
 * sem mexer em nada aqui.
 *
 * Nenhuma delas lança erro: se não houver corretor cadastrado, o lead fica
 * sem dono e vai para a fila comum. **Distribuir jamais pode derrubar a
 * captura** — lead sem corretor alguém pega; lead que não gravou some.
 */

import { DISTRIBUICAO } from './config.js';

/**
 * Escolhe o corretor de um lead novo.
 *
 * @returns {Promise<number|null>} id do corretor, ou null para fila comum
 */
export async function escolherCorretor(db, lead) {
  try {
    if (DISTRIBUICAO === 'manual') return null;

    const { results: corretores } = await db
      .prepare('SELECT id, regioes FROM corretores WHERE ativo = 1 ORDER BY id')
      .all();

    if (!corretores || corretores.length === 0) return null;

    if (DISTRIBUICAO === 'regiao') {
      const escolhido = porRegiao(corretores, lead.regiao);
      /* Ninguém cobre a região: cai no rodízio em vez de ficar sem dono. */
      if (escolhido) return escolhido;
    }

    return await porRodizio(db, corretores);
  } catch (erro) {
    console.error('falha ao distribuir lead:', erro && erro.message);
    return null;
  }
}

/** Primeiro corretor ativo que atua na região pedida. */
function porRegiao(corretores, regiao) {
  if (!regiao || regiao === 'nao-sei') return null;

  const candidatos = corretores.filter((c) => {
    try {
      return JSON.parse(c.regioes || '[]').includes(regiao);
    } catch {
      /* JSON quebrado num cadastro não pode derrubar a distribuição
         inteira — este corretor só não é considerado. */
      return false;
    }
  });

  if (candidatos.length === 0) return null;

  /* Entre os que cobrem a região, o de menor carga. Sem isso, o primeiro
     da lista levaria todos os leads daquela região. */
  return candidatos[Math.floor(Math.random() * candidatos.length)].id;
}

/**
 * Rodízio por menor carga.
 *
 * Round-robin clássico guarda "de quem foi a vez" em algum lugar. Aqui a
 * ordem é derivada da própria contagem de leads: quem tem menos, recebe.
 * Chega no mesmo resultado (distribuição igual ao longo do tempo) sem
 * precisar de estado para manter em sincronia — e se corrige sozinho
 * quando alguém entra, sai ou fica inativo no meio do caminho.
 */
async function porRodizio(db, corretores) {
  const { results } = await db
    .prepare(
      `SELECT corretor_id, COUNT(*) AS total
         FROM leads
        WHERE corretor_id IS NOT NULL
        GROUP BY corretor_id`
    )
    .all();

  const carga = new Map((results || []).map((r) => [r.corretor_id, r.total]));

  let escolhido = corretores[0].id;
  let menor = Infinity;

  for (const c of corretores) {
    const total = carga.get(c.id) || 0;
    if (total < menor) {
      menor = total;
      escolhido = c.id;
    }
  }

  return escolhido;
}
