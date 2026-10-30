import { ler, gravar, lerVarios, exigirLogin, corpo, erro, protegido } from "./_lib.js";

/* ==================================================================
   /api/tanques
   Gerencia o estado dos tanques da cervejaria HBier.
   Os tanques são fixos no código; apenas observações e dados extras
   são persistidos no Redis.
   ================================================================== */

const CHAVE_OBS    = "tanques:obs";      // { tq01: { obs, atualizadoPor, em }, ... }
const CHAVE_MANUAL = "tanques:manual";   // sobrescritas manuais de situação (raro)
const CHAVE_HIST   = (id) => `tanques:historico:${id}`;  // array de lotes encerrados por tanque
const CHAVE_AUDIT  = "tanques:auditoria"; // log de ações críticas (zerado, desfazerZerado, marcarLivre)

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

    // Buscar 26 semanas para trás + 12 semanas para frente (~3 meses futuros)
    const semanas = [];
    const hoje = new Date();
    // segunda-feira da semana atual
    const dowHoje = hoje.getDay();
    const diffHoje = dowHoje === 0 ? -6 : 1 - dowHoje;
    const segAtual = new Date(hoje);
    segAtual.setDate(segAtual.getDate() + diffHoje);

    for (let i = -12; i < 26; i++) {   // negativo = futuro, positivo = passado
      const d = new Date(segAtual);
      d.setDate(d.getDate() - i * 7);
      const ch = d.toISOString().slice(0, 10);
      semanas.push(ch);
    }

    // Importar dinamicamente para não criar dependência circular em prod
    // (prog.js já exporta sua lógica via Redis; aqui lemos diretamente)
    const CHAVE_PROG        = (sem) => `prog:${sem}`;
    const CHAVE_PROG_BARRIL = (sem) => `prog:barril-${sem}`;

    // Coletar todos os itens de brassagem, envase e barril
    const brassagens = []; // { tanque, lote, estilo, em, volume, og, tanqueFinalizado, semana }
    const envases    = []; // { tanqueOrigem, lote, estilo, formato, qtd, em, semana }
    const movimentos = []; // histórico completo: { tipo, tanque, lote, estilo, em, dataISO, descricao, semana }

    await Promise.all(semanas.map(async (sem) => {
      try {
        // Lê itens de programação e barreis em paralelo
        const [dados, dadosBarreis] = await Promise.all([
          ler(CHAVE_PROG(sem)),
          ler(CHAVE_PROG_BARRIL(sem)),
        ]);
        const itens = Array.isArray(dados) ? dados : (dados && dados.itens ? dados.itens : []);
        // dadosBarreis pode ser:
        //   - array direto de registros
        //   - objeto { "barril-{sem}": [...] }   (formato retornado pela API /prog)
        //   - null/undefined (semana sem barreis)
        let barreisSem = [];
        if (Array.isArray(dadosBarreis)) {
          barreisSem = dadosBarreis;
        } else if (dadosBarreis && typeof dadosBarreis === "object") {
          // pega todos os arrays dentro do objeto
          barreisSem = Object.values(dadosBarreis).flat();
        }

        itens.forEach(it => {
          if (it.tipo === "brassagem") {
            const temResultado = it.resultado && it.resultado.em;
            // Sempre usa a data prevista (dataISO) como referência para contagem de dias
            const dataRef = it.dataISO || sem;
            if (!it.tanque) return;
            const tanqueNorm = (it.tanque || "").toUpperCase().replace(/[-\s]/g, "");
            const dataISO = (it.dataISO || sem);
            const hoje = new Date().toISOString().slice(0, 10);
            const ehFutura = dataISO > hoje;
            const ehHoje   = dataISO === hoje;
            const planejada     = !temResultado && ehFutura;
            const previstahoje  = !temResultado && ehHoje;
            brassagens.push({
              id:               it.id        || "",
              tanque:           tanqueNorm,
              lote:             it.lote      || "",
              estilo:           it.estilo    || "",
              em:               dataRef,
              volume:           temResultado ? (it.resultado.volume || it.volPrev || "") : (it.volPrev || ""),
              og:               temResultado ? (it.resultado.og || "") : "",
              tanqueFinalizado: temResultado ? !!it.resultado.tanqueFinalizado : false,
              planejada,
              previstahoje,
              semana:           sem,
            });
            // Adiciona brassagem ao histórico de movimentos
            if (temResultado || ehHoje || !ehFutura) {
              movimentos.push({
                tipo:      "brassagem",
                tanque:    tanqueNorm,
                lote:      it.lote    || "",
                estilo:    it.estilo  || "",
                em:        dataRef,
                dataISO:   dataISO,
                volume:    temResultado ? (it.resultado.volume || it.volPrev || "") : (it.volPrev || ""),
                semana:    sem,
              });
            }
          }
          if (it.tipo === "envase") {
            const tanqueNorm = (it.tanqueOrigem || "").toUpperCase().replace(/[-\s]/g, "");
            const emEnvase = it.dataISO || sem;
            // Inclui mesmo sem resultado para mostrar previsões; filtramos depois no histórico
            const temResultado = !!(it.resultado && (it.resultado.qtdEnvasada || it.resultado.litrosFim));
            if (temResultado) {
              envases.push({
                tanqueOrigem:  tanqueNorm,
                lote:          it.lote          || "",
                estilo:        it.estilo        || "",
                formato:       it.formato       || "",
                qtd:           it.resultado.qtdEnvasada || it.qtd || "",
                litrosInicio:  it.resultado.litrosInicio  || "",
                litrosFim:     it.resultado.litrosFim     || "",
                litrosUsadosPET: it.resultado.litrosUsadosPET ?? "",
                excessoMl:     it.resultado.excessoMl     ?? "",
                em:            it.resultado.em  || it.resultado.emReal || "",
                semana:        sem,
              });
            }
            movimentos.push({
              tipo:        "envase",
              tanque:      tanqueNorm,
              lote:        it.lote    || "",
              estilo:      it.estilo  || "",
              em:          emEnvase,
              dataISO:     emEnvase,
              formato:     it.formato || "",
              qtd:         it.resultado ? (it.resultado.qtdEnvasada || it.qtd || "") : "",
              litrosInicio:it.resultado ? (it.resultado.litrosInicio || "") : "",
              litrosFim:   it.resultado ? (it.resultado.litrosFim    || "") : "",
              litrosUsadosPET: it.resultado ? (it.resultado.litrosUsadosPET ?? "") : "",
              excessoMl:   it.resultado ? (it.resultado.excessoMl    ?? "") : "",
              temResultado,
              semana:      sem,
            });
          }
        });

        // Barreis — chave separada `prog:barril-{sem}` → array de registros
        barreisSem.forEach(reg => {
          const tanqueNorm = (reg.tanque || "").toUpperCase().replace(/[-\s]/g, "");
          if (!tanqueNorm) return;
          // Determinar dataISO a partir do campo dataISO ou do dia da semana
          let dataISO = reg.dataISO || "";
          if (!dataISO && reg.dia) {
            const DIAS = {"Segunda":0,"Terça":1,"Quarta":2,"Quinta":3,"Sexta":4,"Sábado":5,"Domingo":6};
            const off = DIAS[reg.dia];
            if (off !== undefined) {
              const d = new Date(sem + "T00:00:00");
              d.setDate(d.getDate() + off);
              dataISO = d.toISOString().slice(0, 10);
            }
          }
          if (!dataISO) dataISO = sem;
          const linhasDesc = (reg.linhas || []).map(l =>
            `${l.formato} × ${l.qtd}`
          ).join(", ");
          movimentos.push({
            tipo:      "barril",
            tanque:    tanqueNorm,
            lote:      reg.lote    || "",
            estilo:    reg.produto || "",
            em:        dataISO,
            dataISO:   dataISO,
            linhas:    reg.linhas  || [],
            totalL:    reg.total   || 0,
            descricao: linhasDesc,
            semana:    sem,
          });
        });
      } catch (_) { /* semana sem dados */ }
    }));

    // Ler fichas dos lotes ativos para determinar se há log de maturação
    // (fonte de verdade: a presença de linhas em maturLog na ficha)
    const lotesAtivos = [...new Set(
      brassagens
        .filter(b => !b.planejada && !b.previstahoje && b.lote)
        .map(b => b.lote)
    )];
    const fichasAtivas = {};
    if (lotesAtivos.length) {
      const chavesFichas = lotesAtivos.map(l => `ficha:${l}`);
      const valoresFichas = await lerVarios(chavesFichas);
      lotesAtivos.forEach((lote, i) => {
        fichasAtivas[lote] = valoresFichas[i] || null;
      });
    }

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

      // brassagem com resultado mais recente = o que está no tanque agora
      // (nova brassagem substitui automaticamente a anterior — sem precisar "finalizar")
      const brass = brassagens
        .filter(b => b.tanque === nomeUp && !b.planejada && !b.previstahoje)
        .sort((a, b) => b.em.localeCompare(a.em))[0] || null;

      // brassagem prevista para hoje (sem resultado ainda)
      const brassHoje = brassagens
        .filter(b => b.tanque === nomeUp && b.previstahoje)
        .sort((a, b) => a.em.localeCompare(b.em))[0] || null;

      // próxima brassagem planejada (ainda não realizada, futura) — info adicional
      const proximaBrass = brassagens
        .filter(b => b.tanque === nomeUp && b.planejada)
        .sort((a, b) => a.em.localeCompare(b.em))[0] || null;

      // brassagem finalizada mais recente (para histórico)
      const brassFinalizada = brassagens
        .filter(b => b.tanque === nomeUp && b.tanqueFinalizado)
        .sort((a, b) => b.em.localeCompare(a.em))[0] || null;

      // Estágio — baseado no estado atual
      // Fluxo: maturando → pronto (manual) → livre (manual "zerado")
      // Override "livre/zerado" cede para brassagem real ou prevista hoje
      const overrideAtivo = manual[tq.id] && manual[tq.id].estagio;
      const overrideEhLivre = overrideAtivo && (manual[tq.id].estagio === "livre");
      const overrideEhPronto = overrideAtivo && (manual[tq.id].estagio === "pronto");
      const overrideEhZerado = overrideEhLivre && !!(manual[tq.id].zerado);
      // "pronto" sempre tem prioridade; "zerado" sobrepõe brassagens antigas mas cede para brassagem de hoje;
      // "livre manual" cede se há brassagem ativa
      const usarOverride = overrideEhPronto || (overrideEhZerado && !brassHoje) || (overrideEhLivre && !brass && !brassHoje);

      let estagio, estagioLabel, estagioIcone, estagioCorBg, estagioCorBorda;
      let maturacaoInicio = null; // declarado aqui para ficar acessível fora do bloco else
      if (usarOverride) {
        estagio       = manual[tq.id].estagio;
        estagioLabel  = manual[tq.id].estagioLabel  || estagio;
        estagioIcone  = manual[tq.id].estagioIcone  || "📌";
        if (estagio === "pronto") {
          estagioCorBg  = "#DCFCE7";
          estagioCorBorda = "#4ADE80";
        } else if (estagio === "livre") {
          estagioCorBg  = "#F0FDF4";
          estagioCorBorda = "#22C55E";
        } else {
          estagioCorBg  = "#F5F5F5";
          estagioCorBorda = "#999";
        }
      } else if (brassHoje) {
        // brassagem de hoje tem prioridade máxima — substitui qualquer brassagem anterior
        estagio       = "brassagem";
        estagioLabel  = "Brassagem prevista";
        estagioIcone  = "🔥";
        estagioCorBg  = "#FEF3C7";
        estagioCorBorda = "#B45309";
      } else if (!brass) {
        estagio       = "livre";
        estagioLabel  = "Livre";
        estagioIcone  = "✅";
        estagioCorBg  = "#F0FDF4";
        estagioCorBorda = "#22C55E";
      } else {
        const dias = diasDesde(brass.em);
        const DIAS_CRITICO = 15;
        // Fonte de verdade: ficha do lote atual tem linhas de maturação?
        const fichaLote = brass.lote ? (fichasAtivas[brass.lote] || null) : null;
        const maturLog  = fichaLote && Array.isArray(fichaLote.maturLog) ? fichaLote.maturLog : [];
        const temMaturacao = maturLog.length > 0;
        // Data de início de maturação = data/hora da 1ª linha do maturLog (col 0)
        maturacaoInicio = temMaturacao && maturLog[0] && maturLog[0][0]
          ? maturLog[0][0]   // datetime-local da primeira linha: "YYYY-MM-DDTHH:mm"
          : (manual[tq.id] && manual[tq.id].maturacaoInicioISO ? manual[tq.id].maturacaoInicioISO : null);
        if (dias !== null && dias >= DIAS_CRITICO && !temMaturacao) {
          estagio       = "critico";
          estagioLabel  = "Maturando — atenção";
          estagioIcone  = "🚨";
          estagioCorBg  = "#FEF2F2";
          estagioCorBorda = "#DC2626";
        } else if (temMaturacao) {
          estagio       = "maturando";
          estagioLabel  = "Maturando";
          estagioIcone  = "🧊";
          estagioCorBg  = "#EFF6FF";
          estagioCorBorda = "#3B82F6";
        } else {
          estagio       = "fermentando";
          estagioLabel  = "Fermentando";
          estagioIcone  = "🍺";
          estagioCorBg  = "#FFFBEB";
          estagioCorBorda = "#F59E0B";
        }
      }

      // referência de conteúdo: brassagem de hoje tem prioridade sobre anterior em maturação
      // quando o tanque foi zerado, ignorar brassagens antigas — mas brassagem de hoje sempre aparece
      const refBrass = overrideEhZerado ? (brassHoje || null) : (brassHoje || brass || null);
      const ref = refBrass;

      // envases vinculados ao lote da brassagem atual (para exibição)
      const envase = brass && !brassHoje && !overrideEhZerado
        ? envases
            .filter(e => e.lote && brass.lote && e.lote === brass.lote)
            .sort((a, b) => b.em.localeCompare(a.em))[0] || null
        : null;

      const diasTanque = brass && !brassHoje && !overrideEhZerado ? diasDesde(brass.em) : null;

      // Cálculo de dias separados: fermentação vs maturação
      // maturacaoInicio já foi calculado acima a partir da ficha (1ª linha do maturLog)
      let diasFermentando = null, diasMaturando = null;
      if (brass && !brassHoje && !overrideEhZerado) {
        if (maturacaoInicio) {
          // Fermentação: do brassado ao início de maturação
          const maturDate = new Date(maturacaoInicio);
          const brassDate = new Date(brass.em + "T00:00:00");
          diasFermentando = Math.max(0, Math.floor((maturDate - brassDate) / 86400000));
          // Maturação: do início de maturação até hoje
          diasMaturando = diasDesde(maturDate.toISOString().slice(0, 10));
        } else {
          // Apenas fermentando — ainda não entrou em maturação
          diasFermentando = diasTanque;
          diasMaturando   = null;
        }
      }

      return {
        id:           tq.id,
        nome:         tq.nome,
        capacidade:   tq.capacidade,
        estagio,
        estagioLabel,
        estagioIcone,
        estagioCorBg,
        estagioCorBorda,
        lote:         ref ? ref.lote   : "",
        estilo:       ref ? ref.estilo : "",
        volume:       ref ? ref.volume : "",
        volExtra:     mapa[tq.id] ? (parseFloat(mapa[tq.id].volExtra) || 0) : 0,
        volExtraLog:  mapa[tq.id] ? (mapa[tq.id].volExtraLog || []) : [],
        og:           ref && !brassHoje ? (brass ? brass.og : "") : "",
        diasTanque,
        diasFermentando,
        diasMaturando,
        maturacaoInicioISO: maturacaoInicio || null,
        brassadoEm:   ref ? ref.em     : "",
        brassadoSem:  ref ? ref.semana : "",
        brassadoId:   ref ? ref.id     : "",
        proximaBrass: proximaBrass ? {
          id:      proximaBrass.id,
          estilo:  proximaBrass.estilo,
          lote:    proximaBrass.lote,
          semana:  proximaBrass.semana,
          dataISO: proximaBrass.em,
          volPrev: proximaBrass.volume,
        } : null,
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

    // Montar histórico por tanque (movimentos ordenados do mais recente para o mais antigo)
    // Inclui cálculo de "dias no tanque" no momento de cada envase/barril
    function diasEntreIso(dataInicio, dataFim) {
      if (!dataInicio || !dataFim) return null;
      const a = new Date(dataInicio + "T00:00:00");
      const b = new Date(dataFim   + "T00:00:00");
      return Math.max(0, Math.floor((b - a) / 86400000));
    }

    // Para cada movimento de envase/barril, encontrar a brassagem do mesmo lote+tanque
    // para calcular quantos dias a cerveja tinha no tanque naquele momento
    movimentos.forEach(mov => {
      if (mov.tipo === "brassagem") return;
      const brass = brassagens
        .filter(b => b.lote && mov.lote && b.lote === mov.lote && b.tanque === mov.tanque)
        .sort((a, b) => b.em.localeCompare(a.em))[0] || null;
      mov.diasNoBrassar = brass ? diasEntreIso(brass.em, mov.dataISO) : null;
      mov.brassadoEm    = brass ? brass.em : null;
    });

    // Agrupar movimentos por tanque
    const historicoPorTanque = {};
    movimentos.forEach(mov => {
      if (!mov.tanque) return;
      if (!historicoPorTanque[mov.tanque]) historicoPorTanque[mov.tanque] = [];
      historicoPorTanque[mov.tanque].push(mov);
    });
    // Ordenar cada lista do mais recente para o mais antigo
    Object.values(historicoPorTanque).forEach(lista => {
      lista.sort((a, b) => b.dataISO.localeCompare(a.dataISO));
    });

    // Associar histórico a cada tanque
    tanquesEstado.forEach(tq => {
      const nomeNorm = tq.nome.toUpperCase().replace(/[-\s]/g, "");
      tq.historico = historicoPorTanque[nomeNorm] || [];
    });

    // Rota especial: ?acao=historico&tanqueId=tqXX
    const url = new URL(req.url, "http://x");
    if (url.searchParams.get("acao") === "historico") {
      const tanqueId = url.searchParams.get("tanqueId") || "";
      if (!TANQUES.find(t => t.id === tanqueId)) return erro(res, 400, "Tanque inválido.");
      const hist = (await ler(CHAVE_HIST(tanqueId))) || [];
      return res.json({ ok: true, historico: hist });
    }

    // Rota especial: ?acao=auditoria  (admin/gestor)
    if (url.searchParams.get("acao") === "auditoria") {
      if (!["admin", "gestor"].includes(sessao.papel))
        return erro(res, 403, "Apenas admin ou gestor.");
      const audit = (await ler(CHAVE_AUDIT)) || [];
      return res.json({ ok: true, auditoria: audit });
    }

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

    /* -- marcarPronto (pronto para envase) -- */
    if (dados.acao === "marcarPronto") {
      if (!["admin", "gestor"].includes(sessao.papel))
        return erro(res, 403, "Apenas admin ou gestor.");
      const { tanqueId } = dados;
      if (!TANQUES.find(t => t.id === tanqueId)) return erro(res, 400, "Tanque inválido.");
      const mapa = (await ler(CHAVE_MANUAL)) || {};
      mapa[tanqueId] = {
        estagio:      "pronto",
        estagioLabel: "Pronto para envase",
        estagioIcone: "🟢",
        por:          sessao.usuario || sessao.login,
        em:           new Date().toISOString(),
      };
      await gravar(CHAVE_MANUAL, mapa);
      return res.json({ ok: true });
    }

    /* -- marcarLivre (sobrescrever manualmente) -- */
    if (dados.acao === "marcarLivre") {
      if (!["admin", "gestor"].includes(sessao.papel))
        return erro(res, 403, "Apenas admin ou gestor.");
      const { tanqueId } = dados;
      if (!TANQUES.find(t => t.id === tanqueId)) return erro(res, 400, "Tanque inválido.");
      const mapa = (await ler(CHAVE_MANUAL)) || {};
      const agora = new Date().toISOString();
      mapa[tanqueId] = {
        estagio:      "livre",
        estagioLabel: "Livre (manual)",
        estagioIcone: "✅",
        por:          sessao.usuario || sessao.login,
        em:           agora,
      };
      await gravar(CHAVE_MANUAL, mapa);
      // Auditoria
      const audit = (await ler(CHAVE_AUDIT)) || [];
      audit.unshift({ acao: "marcarLivre", tanqueId, por: sessao.usuario || sessao.login, em: agora });
      if (audit.length > 500) audit.splice(500);
      await gravar(CHAVE_AUDIT, audit);
      return res.json({ ok: true });
    }

    /* -- marcarZerado (tanque esvaziado — disponível para nova brassagem) -- */
    if (dados.acao === "marcarZerado") {
      if (!["admin", "gestor"].includes(sessao.papel))
        return erro(res, 403, "Apenas admin ou gestor.");
      const { tanqueId, snapshot } = dados;
      if (!TANQUES.find(t => t.id === tanqueId)) return erro(res, 400, "Tanque inválido.");
      const agora = new Date().toISOString();

      // Salvar snapshot do lote encerrado no histórico do tanque
      if (snapshot && snapshot.lote) {
        const hist = (await ler(CHAVE_HIST(tanqueId))) || [];
        hist.unshift({
          ...snapshot,
          encerradoPor: sessao.usuario || sessao.login,
          encerradoEm:  agora,
        });
        await gravar(CHAVE_HIST(tanqueId), hist);
      }

      const mapa = (await ler(CHAVE_MANUAL)) || {};
      mapa[tanqueId] = {
        estagio:      "livre",
        estagioLabel: "Livre (zerado)",
        estagioIcone: "✅",
        zerado:       true,   // flag: sobrepõe brassagens antigas
        por:          sessao.usuario || sessao.login,
        em:           agora,
      };
      await gravar(CHAVE_MANUAL, mapa);
      // Auditoria
      const audit = (await ler(CHAVE_AUDIT)) || [];
      audit.unshift({
        acao:  "marcarZerado",
        tanqueId,
        lote:  snapshot?.lote || null,
        por:   sessao.usuario || sessao.login,
        em:    agora,
      });
      if (audit.length > 500) audit.splice(500);
      await gravar(CHAVE_AUDIT, audit);
      return res.json({ ok: true });
    }

    /* -- desfazerZerado (reverter zerado removendo override + último snapshot) -- */
    if (dados.acao === "desfazerZerado") {
      if (!["admin", "gestor"].includes(sessao.papel))
        return erro(res, 403, "Apenas admin ou gestor.");
      const { tanqueId } = dados;
      if (!TANQUES.find(t => t.id === tanqueId)) return erro(res, 400, "Tanque inválido.");

      // Remover override manual (tanque volta ao estado automático da brassagem)
      const mapa = (await ler(CHAVE_MANUAL)) || {};
      const override = mapa[tanqueId];
      if (!override || !override.zerado)
        return erro(res, 400, "Tanque não está zerado — nada a desfazer.");

      // Capturar info do zerado original antes de remover (para log)
      const zeradoPor = override.por || null;
      const zeradoEm  = override.em  || null;

      delete mapa[tanqueId];
      await gravar(CHAVE_MANUAL, mapa);

      // Remover o snapshot mais recente do histórico (o que foi gravado ao zerar)
      const hist = (await ler(CHAVE_HIST(tanqueId))) || [];
      let loteDesfeito = null;
      if (hist.length && hist[0].encerradoEm) {
        loteDesfeito = hist[0].lote || null;
        hist.shift();
        await gravar(CHAVE_HIST(tanqueId), hist);
      }

      // Auditoria — registra o desfazer com referência ao zerado original
      const agora = new Date().toISOString();
      const audit = (await ler(CHAVE_AUDIT)) || [];
      audit.unshift({
        acao:        "desfazerZerado",
        tanqueId,
        lote:        loteDesfeito,
        por:         sessao.usuario || sessao.login,
        em:          agora,
        zeradoPor,
        zeradoEm,
      });
      if (audit.length > 500) audit.splice(500);
      await gravar(CHAVE_AUDIT, audit);

      return res.json({ ok: true });
    }

    /* -- marcarMaturando (registrar início de maturação — chamado automaticamente ao adicionar 1ª linha do log de maturação) -- */
    if (dados.acao === "marcarMaturando") {
      const { tanqueId, maturacaoInicioISO: mISOInput } = dados;
      if (!TANQUES.find(t => t.id === tanqueId)) return erro(res, 400, "Tanque inválido.");
      const mapa = (await ler(CHAVE_MANUAL)) || {};
      // Preservar override de estágio existente (pronto, livre etc) se houver, só adiciona maturacaoInicioISO
      const existente = mapa[tanqueId] || {};
      // Se já tem maturacaoInicioISO, não sobrescreve (preserva o registro original)
      if (!existente.maturacaoInicioISO) {
        mapa[tanqueId] = {
          ...existente,
          maturacaoInicioISO: mISOInput || new Date().toISOString(),
          maturacaoRegistradoPor: sessao.usuario || sessao.login,
          maturacaoRegistradoEm:  new Date().toISOString(),
        };
        await gravar(CHAVE_MANUAL, mapa);
      }
      return res.json({ ok: true, maturacaoInicioISO: (mapa[tanqueId] || {}).maturacaoInicioISO });
    }

    /* -- limparMaturando (remover registro de início de maturação) -- */
    if (dados.acao === "limparMaturando") {
      // Qualquer usuário logado pode desfazer maturação (corrige bug de status incorreto)
      const { tanqueId } = dados;
      if (!TANQUES.find(t => t.id === tanqueId)) return erro(res, 400, "Tanque inválido.");
      const mapa = (await ler(CHAVE_MANUAL)) || {};
      if (mapa[tanqueId]) {
        delete mapa[tanqueId].maturacaoInicioISO;
        delete mapa[tanqueId].maturacaoRegistradoPor;
        delete mapa[tanqueId].maturacaoRegistradoEm;
        // Se não sobrou nada no override, remover completamente
        if (!mapa[tanqueId].estagio) delete mapa[tanqueId];
        await gravar(CHAVE_MANUAL, mapa);
      }
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

    /* -- adicionarVolume (volume extra por maior rendimento) -- */
    if (dados.acao === "adicionarVolume") {
      if (!["admin", "gestor"].includes(sessao.papel))
        return erro(res, 403, "Apenas admin ou gestor.");
      const { tanqueId, volExtra, beersalesConfirmado } = dados;
      if (!TANQUES.find(t => t.id === tanqueId)) return erro(res, 400, "Tanque inválido.");
      if (!volExtra || isNaN(parseFloat(volExtra)) || parseFloat(volExtra) <= 0)
        return erro(res, 400, "Volume inválido.");
      if (!beersalesConfirmado)
        return erro(res, 400, "Confirme que o volume foi adicionado no BeerSales.");
      const agora = new Date().toISOString();
      const por = sessao.usuario || sessao.login;
      const mapa = (await ler(CHAVE_MANUAL)) || {};
      if (!mapa[tanqueId]) mapa[tanqueId] = {};
      // acumula (pode haver mais de uma adição)
      const anterior = parseFloat(mapa[tanqueId].volExtra) || 0;
      mapa[tanqueId].volExtra = anterior + parseFloat(volExtra);
      mapa[tanqueId].volExtraLog = mapa[tanqueId].volExtraLog || [];
      mapa[tanqueId].volExtraLog.unshift({ vol: parseFloat(volExtra), por, em: agora, beersales: true });
      await gravar(CHAVE_MANUAL, mapa);
      // auditoria
      const audit = (await ler(CHAVE_AUDIT)) || [];
      audit.unshift({ acao: "adicionarVolume", tanqueId, vol: parseFloat(volExtra), por, em: agora });
      if (audit.length > 500) audit.splice(500);
      await gravar(CHAVE_AUDIT, audit);
      return res.json({ ok: true, volExtra: mapa[tanqueId].volExtra });
    }

    return erro(res, 400, "Ação desconhecida.");
  }

  return erro(res, 405, "Método não permitido.");
});
