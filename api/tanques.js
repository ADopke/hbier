import { ler, gravar, exigirLogin, corpo, erro, protegido } from "./_lib.js";

/* ==================================================================
   /api/tanques
   Gerencia o estado dos tanques da cervejaria HBier.
   Os tanques são fixos no código; apenas observações e dados extras
   são persistidos no Redis.
   ================================================================== */

const CHAVE_OBS    = "tanques:obs";      // { tq01: { obs, atualizadoPor, em }, ... }
const CHAVE_MANUAL = "tanques:manual";   // sobrescritas manuais de situação (raro)

// Cadastro fixo dos tanques
export const TANQUES = [
  { id: "tq01", nome: "TQ01", capacidade: 8000  },
  { id: "tq02", nome: "TQ02", capacidade: 8000  },
  { id: "tq03", nome: "TQ03", capacidade: 8000  },
  { id: "tq04", nome: "TQ04", capacidade: 9000  },
  { id: "tq05", nome: "TQ05", capacidade: 14000 },
  { id: "tq06", nome: "TQ06", capacidade: 2000  },
  { id: "tq07", nome: "TQ07", capacidade: 3000  },
  { id: "tq08", nome: "TQ08", capacidade: 1000  },
];

// Mapa para lookup rápido por nome (ex: "TQ01" → objeto)
const TANQUES_POR_NOME = {};
TANQUES.forEach(t => { TANQUES_POR_NOME[t.nome.toUpperCase()] = t; });

export default protegido(async function handler(req, res) {
  const sessao = await exigirLogin(req, res);
  if (!sessao) return;

  /* ── GET: retorna estado atual de todos os tanques ─────────────── */
  if (req.method === "GET") {
    const obs    = (await ler(CHAVE_OBS))    || {};
    const manual = (await ler(CHAVE_MANUAL)) || {};

    // Buscar últimas 16 semanas de programação para deduzir estágios
    const semanas = [];
    const hoje = new Date();
    for (let i = 0; i < 16; i++) {
      const d = new Date(hoje);
      d.setDate(d.getDate() - i * 7);
      // segunda-feira da semana
      const dow = d.getDay();
      const diff = dow === 0 ? -6 : 1 - dow;
      d.setDate(d.getDate() + diff);
      const ch = d.toISOString().slice(0, 10);
      semanas.push(ch);
    }

    // Importar dinamicamente para não criar dependência circular em prod
    // (prog.js já exporta sua lógica via Redis; aqui lemos diretamente)
    const CHAVE_PROG = (sem) => `prog:${sem}`;

    // Coletar todos os itens de brassagem e envase com resultado
    const brassagens = []; // { tanque, lote, estilo, em, volume, og, tanqueFinalizado, semana }
    const envases    = []; // { tanqueOrigem, lote, estilo, formato, qtd, em, semana }

    await Promise.all(semanas.map(async (sem) => {
      try {
        const dados = (await ler(CHAVE_PROG(sem))) || {};
        const itens = dados.itens || [];
        itens.forEach(it => {
          if (it.tipo === "brassagem") {
            // Aceita tanto brassagens com resultado registrado quanto planejadas (sem resultado)
            // Para brassagens planejadas usa a dataISO prevista como referência de data
            const temResultado = it.resultado && it.resultado.em;
            const dataRef = temResultado
              ? it.resultado.em
              : (it.dataISO || sem); // fallback: data prevista ou início da semana
            if (!it.tanque && !it.lote) return; // ignora itens sem tanque e sem lote
            brassagens.push({
              tanque:           (it.tanque   || "").toUpperCase(),
              lote:             it.lote      || "",
              estilo:           it.estilo    || "",
              em:               dataRef,
              volume:           temResultado ? (it.resultado.volume || it.volPrev || "") : (it.volPrev || ""),
              og:               temResultado ? (it.resultado.og || "") : "",
              tanqueFinalizado: temResultado ? !!it.resultado.tanqueFinalizado : false,
              planejada:        !temResultado,
              semana:           sem,
            });
          }
          if (it.tipo === "envase" && it.resultado) {
            envases.push({
              tanqueOrigem: (it.tanqueOrigem || "").toUpperCase(),
              lote:         it.lote          || "",
              estilo:       it.estilo        || "",
              formato:      it.formato       || "",
              qtd:          it.resultado.qtdReal || it.qtd || "",
              em:           it.resultado.em  || it.resultado.emReal || "",
              semana:       sem,
            });
          }
        });
      } catch (_) { /* semana sem dados */ }
    }));

    // Para cada tanque, encontrar a brassagem mais recente não finalizada
    function diasDesde(isoStr) {
      if (!isoStr) return null;
      const d = new Date(isoStr);
      const h = new Date();
      d.setHours(0, 0, 0, 0);
      h.setHours(0, 0, 0, 0);
      return Math.floor((h - d) / 86400000);
    }

    const tanquesEstado = TANQUES.map(tq => {
      const nomeUp = tq.nome.toUpperCase();

      // brassagem mais recente para este tanque (não finalizada)
      const brass = brassagens
        .filter(b => b.tanque === nomeUp && !b.tanqueFinalizado)
        .sort((a, b) => b.em.localeCompare(a.em))[0] || null;

      // brassagem finalizada mais recente (para histórico)
      const brassFinalizada = brassagens
        .filter(b => b.tanque === nomeUp && b.tanqueFinalizado)
        .sort((a, b) => b.em.localeCompare(a.em))[0] || null;

      // envase mais recente vinculado ao lote deste tanque
      const envase = brass
        ? envases
            .filter(e => e.lote && brass.lote && e.lote === brass.lote)
            .sort((a, b) => b.em.localeCompare(a.em))[0] || null
        : null;

      // Estágio
      let estagio, estagioLabel, estagioIcone, estagioCorBg, estagioCorBorda;
      if (manual[tq.id] && manual[tq.id].estagio) {
        estagio       = manual[tq.id].estagio;
        estagioLabel  = manual[tq.id].estagioLabel  || estagio;
        estagioIcone  = manual[tq.id].estagioIcone  || "📌";
        estagioCorBg  = "#F5F5F5";
        estagioCorBorda = "#999";
      } else if (!brass) {
        estagio       = "livre";
        estagioLabel  = "Livre";
        estagioIcone  = "✅";
        estagioCorBg  = "#F0FDF4";
        estagioCorBorda = "#22C55E";
      } else if (brass.planejada) {
        // Brassagem planejada ainda não realizada
        estagio       = "planejado";
        estagioLabel  = "Brassagem prevista";
        estagioIcone  = "📅";
        estagioCorBg  = "#FFFBEB";
        estagioCorBorda = "#F59E0B";
      } else if (envase) {
        estagio       = "envasando";
        estagioLabel  = "Envasando";
        estagioIcone  = "📦";
        estagioCorBg  = "#EFF6FF";
        estagioCorBorda = "#3B82F6";
      } else {
        const dias = diasDesde(brass.em);
        const DIAS_CRITICO = 15;
        if (dias !== null && dias >= DIAS_CRITICO) {
          estagio       = "critico";
          estagioLabel  = "Maturando — atenção";
          estagioIcone  = "🚨";
          estagioCorBg  = "#FEF2F2";
          estagioCorBorda = "#DC2626";
        } else {
          estagio       = "maturando";
          estagioLabel  = "Fermentando / Maturando";
          estagioIcone  = "🍺";
          estagioCorBg  = "#F0FDF4";
          estagioCorBorda = "#16A34A";
        }
      }

      const diasTanque = (brass && !brass.planejada) ? diasDesde(brass.em) : null;

      return {
        id:           tq.id,
        nome:         tq.nome,
        capacidade:   tq.capacidade,
        estagio,
        estagioLabel,
        estagioIcone,
        estagioCorBg,
        estagioCorBorda,
        lote:         brass ? brass.lote   : "",
        estilo:       brass ? brass.estilo : "",
        volume:       brass ? brass.volume : "",
        og:           brass ? brass.og     : "",
        diasTanque,
        brassadoEm:   brass ? brass.em     : "",
        brassadoSem:  brass ? brass.semana : "",
        envase:       envase ? {
          lote:    envase.lote,
          estilo:  envase.estilo,
          formato: envase.formato,
          qtd:     envase.qtd,
          em:      envase.em,
        } : null,
        historicoBrass: brassFinalizada ? {
          lote:   brassFinalizada.lote,
          estilo: brassFinalizada.estilo,
          em:     brassFinalizada.em,
        } : null,
        obs:          obs[tq.id]    || null,
        manualOverride: manual[tq.id] || null,
      };
    });

    return res.json({
      ok: true,
      tanques: tanquesEstado,
      geradoEm: new Date().toISOString(),
    });
  }

  /* ── POST: salvar observação ou sobrescrever estágio manualmente ── */
  if (req.method === "POST") {
    const dados = corpo(req);

    /* -- salvarObs -- */
    if (dados.acao === "salvarObs") {
      const { tanqueId, obs } = dados;
      if (!TANQUES.find(t => t.id === tanqueId)) return erro(res, 400, "Tanque inválido.");
      const mapa = (await ler(CHAVE_OBS)) || {};
      mapa[tanqueId] = {
        obs:           (obs || "").trim(),
        atualizadoPor: sessao.usuario || sessao.login,
        em:            new Date().toISOString(),
      };
      await gravar(CHAVE_OBS, mapa);
      return res.json({ ok: true });
    }

    /* -- limparObs -- */
    if (dados.acao === "limparObs") {
      const { tanqueId } = dados;
      if (!TANQUES.find(t => t.id === tanqueId)) return erro(res, 400, "Tanque inválido.");
      const mapa = (await ler(CHAVE_OBS)) || {};
      delete mapa[tanqueId];
      await gravar(CHAVE_OBS, mapa);
      return res.json({ ok: true });
    }

    /* -- marcarLivre (sobrescrever manualmente) -- */
    if (dados.acao === "marcarLivre") {
      if (!["admin", "gestor"].includes(sessao.papel))
        return erro(res, 403, "Apenas admin ou gestor.");
      const { tanqueId } = dados;
      if (!TANQUES.find(t => t.id === tanqueId)) return erro(res, 400, "Tanque inválido.");
      const mapa = (await ler(CHAVE_MANUAL)) || {};
      mapa[tanqueId] = {
        estagio:      "livre",
        estagioLabel: "Livre (manual)",
        estagioIcone: "✅",
        por:          sessao.usuario || sessao.login,
        em:           new Date().toISOString(),
      };
      await gravar(CHAVE_MANUAL, mapa);
      return res.json({ ok: true });
    }

    /* -- limparManual (voltar ao automático) -- */
    if (dados.acao === "limparManual") {
      if (!["admin", "gestor"].includes(sessao.papel))
        return erro(res, 403, "Apenas admin ou gestor.");
      const { tanqueId } = dados;
      const mapa = (await ler(CHAVE_MANUAL)) || {};
      delete mapa[tanqueId];
      await gravar(CHAVE_MANUAL, mapa);
      return res.json({ ok: true });
    }

    return erro(res, 400, "Ação desconhecida.");
  }

  return erro(res, 405, "Método não permitido.");
});
