/**
 * Persistência de lead — a única porta de entrada da tabela `leads`.
 *
 * Os dois formulários do site passam por aqui: a /simulacao (perfil
 * completo, sem empreendimento) e o modal das landing pages (perfil curto,
 * com empreendimento). Ter um caminho só garante que deduplicação, score,
 * distribuição e histórico valham igual para ambos — se cada endpoint
 * tivesse a sua cópia, uma regra corrigida num lugar ficaria errada no outro.
 */

import { calcularScore } from './scoring.js';
import { escolherCorretor } from './distribuicao.js';

/**
 * Grava um lead, ou atualiza a pessoa que já existia.
 *
 * @param {object} db        binding do D1
 * @param {object} perfil    campos já validados contra as listas de config
 * @param {object} origem    saída de campos.origemDo()
 * @param {object} extra     { empreendimento, planta, consentimento }
 * @returns {Promise<{ id: number, reentrada: boolean, score: number }>}
 */
export async function salvarLead(db, perfil, origem, extra = {}) {
  const agora = new Date().toISOString();

  const existente = await procurarExistente(db, perfil.telefone, perfil.email);

  /* O score sai do perfil COMPLETO: o que já estava salvo mais o que acabou
     de chegar.
     Calcular só sobre o envio novo rebaixava quem sabemos mais a respeito —
     alguém que respondeu as 7 perguntas da /simulacao e depois preenchia o
     formulário curto de uma landing page caía de 86 para 51, porque a LP
     não pergunta entrada, FGTS nem região. Mais informação derrubando a
     nota é o contrário do que a nota quer dizer. */
  const completo = mesclar(existente, perfil, extra);

  const { score, classificacao } = calcularScore({
    ...completo,
    /* A coluna guarda JSON; o score raciocina sobre a lista. */
    preferencia: completo.preferencia ? JSON.parse(completo.preferencia) : []
  });

  if (existente) {
    await registrarReentrada(db, existente, perfil, origem, extra, score, classificacao, agora);
    return { id: existente.id, reentrada: true, score };
  }

  const id = await criarLead(db, perfil, origem, extra, score, classificacao, agora);
  return { id, reentrada: false, score };
}

/**
 * Junta o que está no banco com o que chegou agora.
 *
 * A resposta nova vence quando existe; o que veio em branco não apaga o que
 * a pessoa já tinha informado. Mesma regra do COALESCE do UPDATE — aqui só
 * aplicada em memória, para o score enxergar o mesmo perfil que vai ficar
 * gravado.
 */
function mesclar(existente, perfil, extra) {
  const campos = [
    'renda', 'entrada', 'fgts', 'regiao', 'momento', 'preferencia', 'email'
  ];

  const completo = { empreendimento: extra.empreendimento || null };

  for (const campo of campos) {
    completo[campo] = perfil[campo] || (existente ? existente[campo] : null);
  }

  if (!completo.empreendimento && existente) {
    completo.empreendimento = existente.empreendimento;
  }

  return completo;
}

/**
 * Procura a mesma pessoa por telefone ou e-mail.
 *
 * O telefone é a chave forte: é obrigatório nos dois formulários e é por
 * onde o atendimento acontece. O e-mail entra como segunda tentativa
 * porque a pessoa pode trocar de número entre uma visita e outra.
 */
async function procurarExistente(db, fone, mail) {
  /* Traz também os campos de qualificação: eles alimentam o mesclar() que
     recalcula o score sobre o perfil inteiro, não só sobre o envio novo. */
  const COLUNAS = `id, corretor_id, origem, empreendimento, criado_em,
                   email, renda, entrada, fgts, regiao, momento, preferencia`;

  const porTelefone = await db
    .prepare(`SELECT ${COLUNAS} FROM leads WHERE telefone = ? LIMIT 1`)
    .bind(fone)
    .first();

  if (porTelefone) return porTelefone;
  if (!mail) return null;

  return db
    .prepare(`SELECT ${COLUNAS} FROM leads WHERE email = ? LIMIT 1`)
    .bind(mail)
    .first();
}

/**
 * A pessoa já existia: enriquece o cadastro e registra a volta.
 *
 * O que NÃO é sobrescrito, de propósito:
 *
 *   - `criado_em`, `origem` e `cta` — a PRIMEIRA origem é o dado que diz
 *     qual canal realmente trouxe a pessoa. Sobrescrever com a origem da
 *     segunda visita daria todo o crédito ao último clique e apagaria o
 *     investimento que funcionou de verdade;
 *
 *   - `corretor_id` — quem já atendia continua atendendo. É a regra que
 *     evita dois corretores ligando para a mesma pessoa;
 *
 *   - `status` — alguém pode já ter movido esse lead no funil. Voltar para
 *     'novo' apagaria trabalho feito.
 *
 * COALESCE em cada campo: resposta em branco na segunda passagem não apaga
 * o que a pessoa já tinha informado na primeira.
 *
 * A origem nova não se perde — vai inteira no `detalhe` do evento.
 */
async function registrarReentrada(db, lead, perfil, origem, extra, score, classificacao, agora) {
  await db.batch([
    db
      .prepare(
        `UPDATE leads SET
           nome           = COALESCE(?, nome),
           email          = COALESCE(?, email),
           renda          = COALESCE(?, renda),
           entrada        = COALESCE(?, entrada),
           fgts           = COALESCE(?, fgts),
           regiao         = COALESCE(?, regiao),
           momento        = COALESCE(?, momento),
           preferencia    = COALESCE(?, preferencia),
           empreendimento = COALESCE(?, empreendimento),
           planta         = COALESCE(?, planta),
           score          = ?,
           classificacao  = ?,
           reentradas     = reentradas + 1
         WHERE id = ?`
      )
      .bind(
        perfil.nome, perfil.email, perfil.renda, perfil.entrada, perfil.fgts,
        perfil.regiao, perfil.momento, perfil.preferencia,
        extra.empreendimento || null, extra.planta || null,
        score, classificacao, lead.id
      ),

    evento(db, lead.id, agora, 'lead_reentrada', {
      origem_primeira: lead.origem,
      origem_agora: origem.origem,
      cta_agora: origem.cta,
      empreendimento_agora: extra.empreendimento || null,
      utm_source: origem.utm_source,
      utm_campaign: origem.utm_campaign,
      pagina: origem.pagina,
      score
    })
  ]);
}

/** Lead novo: insere, distribui e abre o histórico. */
async function criarLead(db, perfil, origem, extra, score, classificacao, agora) {
  const inserido = await db
    .prepare(
      `INSERT INTO leads (
         criado_em, nome, telefone, email,
         renda, entrada, fgts, regiao, momento, preferencia,
         empreendimento, planta,
         score, classificacao,
         origem, cta, pagina, referrer, gclid, fbclid,
         utm_source, utm_medium, utm_campaign, utm_term, utm_content,
         consentimento
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`
    )
    .bind(
      agora, perfil.nome, perfil.telefone, perfil.email,
      perfil.renda, perfil.entrada, perfil.fgts, perfil.regiao,
      perfil.momento, perfil.preferencia,
      extra.empreendimento || null, extra.planta || null,
      score, classificacao,
      origem.origem, origem.cta, origem.pagina, origem.referrer, origem.gclid, origem.fbclid,
      origem.utm_source, origem.utm_medium, origem.utm_campaign,
      origem.utm_term, origem.utm_content,
      extra.consentimento ? 1 : 0
    )
    .first();

  const leadId = inserido && inserido.id;
  if (!leadId) return null;

  const passos = [
    evento(db, leadId, agora, 'lead_criado', {
      score,
      classificacao,
      origem: origem.origem,
      empreendimento: extra.empreendimento || null
    })
  ];

  /* Distribuição roda DEPOIS do INSERT: o lead já está salvo, então
     qualquer problema aqui custa um lead sem dono — nunca um lead perdido. */
  const corretorId = await escolherCorretor(db, perfil);

  if (corretorId) {
    passos.push(
      db.prepare('UPDATE leads SET corretor_id = ? WHERE id = ?').bind(corretorId, leadId),
      evento(db, leadId, agora, 'lead_atribuido', { corretor_id: corretorId })
    );
  }

  await db.batch(passos);
  return leadId;
}

/** Uma linha do histórico. `detalhe` é JSON livre — ver migração 0002. */
function evento(db, leadId, agora, tipo, detalhe) {
  return db
    .prepare(
      `INSERT INTO lead_eventos (lead_id, criado_em, tipo, autor, detalhe)
       VALUES (?, ?, ?, 'sistema', ?)`
    )
    .bind(leadId, agora, tipo, JSON.stringify(detalhe));
}
