import {
  ler, gravar, exigirLogin, corpo, erro, protegido,
} from "./_lib.js";

// Programação de produção semanal.
//
// GET  /api/prog?semana=AAAA-MM-DD   → lê a programação da semana
// POST /api/prog                     → salva / edita / remove / lança resultado
//
// Estrutura de cada item:
//   Programação: { id, tipo, dia, obs, criadaPor, em, ...campos por tipo }
//   Resultado:   { ...prog, resultado: { ...campos por tipo } }
//
// Tipo "brassagem": estilo, tanque, og, volume
// Tipo "envase": produto, lote, tanqueOrigem, formato, qtd,
//                litrosInicio, litrosFim, sleevePerdidos, petPerdidos, tampasPerdidas

function chave(semana) { return `prog:${semana}`; }
function novoId() { return Math.random().toString(36).slice(2, 10); }

// colaborador pode lançar resultado mas não pode criar/editar/remover programação
function podeProgramar(papel) { return ["admin","gestor"].includes(papel); }

export default protegido(async function handler(req, res) {
  const sessao = await exigirLogin(req, res);
  if (!sessao) return;

  if (req.method === "GET") {
    const semana = (req.query.semana || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(semana))
      return erro(res, 400, "Semana inválida (AAAA-MM-DD).");
    const itens = (await ler(chave(semana))) || [];

    // ?tarefas=1 — devolve também as tarefas vinculadas a cada item,
    // agrupadas por progId, buscando em todos os membros da equipe
    if (req.query.tarefas === "1") {
      const userlist = (await ler("userlist")) || [];
      const porProgId = {};   // { [progId]: [{login, nome, taskNome, taskId}] }

      for (const u of userlist) {
        const tasks = (await ler(`tasks:${u}`)) || [];
        for (const t of tasks) {
          if (!t.progId) continue;
          if (!porProgId[t.progId]) porProgId[t.progId] = [];
          porProgId[t.progId].push({
            login: u,
            taskId: t.id,
            taskNome: t.nome,
            freq: t.freq,
            data: t.data || "",
          });
        }
      }
      // buscar registros de barril:
      // 1. vinculados a itens específicos
      // 2. independentes (chave "barril-{semana}" — envase barril pelo botão principal)
      const barreis = {};
      for (const it of itens) {
        const regs = (await ler(`barril:${semana}:${it.id}`)) || [];
        if (regs.length) barreis[it.id] = regs;
      }
      const chaveBarrilIndep = `barril-${semana}`;
      const regsIndep = (await ler(`barril:${semana}:${chaveBarrilIndep}`)) || [];
      if (regsIndep.length) barreis[chaveBarrilIndep] = regsIndep;

      return res.json({ ok: true, semana, itens, tarefasVinculadas: porProgId, barreis });
    }

    return res.json({ ok: true, semana, itens });
  }

  const dados = corpo(req);
  const semana = (dados.semana || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(semana))
    return erro(res, 400, "Semana inválida (AAAA-MM-DD).");

  const itens = (await ler(chave(semana))) || [];

  /* ---------- criar ---------- */
  if (dados.acao === "criar") {
    if (!podeProgramar(sessao.papel))
      return erro(res, 403, "Apenas admin ou gestor podem programar.");

    const item = {
      id: novoId(),
      tipo: dados.tipo === "envase" ? "envase" : "brassagem",
      dia: (dados.dia || "").trim(),
      obs: (dados.obs || "").trim(),
      criadaPor: sessao.login,
      em: new Date().toISOString(),
    };

    if (item.tipo === "brassagem") {
      item.estilo   = (dados.estilo  || "").trim();
      item.tanque   = (dados.tanque  || "").trim();
      item.volPrev  = (dados.volPrev || "").trim();
    } else {
      item.produto      = (dados.produto      || "").trim();
      item.lote         = (dados.lote         || "").trim();
      item.tanqueOrigem = (dados.tanqueOrigem || "").trim();
      item.formato      = (dados.formato      || "").trim();
      item.qtd          = (dados.qtd          || "").trim();
    }

    itens.push(item);
    await gravar(chave(semana), itens);
    return res.json({ ok: true, itens });
  }

  /* ---------- editar ---------- */
  if (dados.acao === "editar") {
    if (!podeProgramar(sessao.papel))
      return erro(res, 403, "Apenas admin ou gestor podem editar.");

    const idx = itens.findIndex((x) => x.id === dados.id);
    if (idx < 0) return erro(res, 404, "Item não encontrado.");

    const it = itens[idx];
    it.dia = (dados.dia || "").trim();
    it.obs = (dados.obs || "").trim();

    if (it.tipo === "brassagem") {
      it.estilo   = (dados.estilo  || "").trim();
      it.tanque   = (dados.tanque  || "").trim();
      it.volPrev  = (dados.volPrev || "").trim();
    } else {
      it.produto      = (dados.produto      || "").trim();
      it.lote         = (dados.lote         || "").trim();
      it.tanqueOrigem = (dados.tanqueOrigem || "").trim();
      it.formato      = (dados.formato      || "").trim();
      it.qtd          = (dados.qtd          || "").trim();
    }

    await gravar(chave(semana), itens);
    return res.json({ ok: true, itens });
  }

  /* ---------- remover ---------- */
  if (dados.acao === "remover") {
    if (!podeProgramar(sessao.papel))
      return erro(res, 403, "Apenas admin ou gestor podem remover.");

    const filtrado = itens.filter((x) => x.id !== dados.id);
    await gravar(chave(semana), filtrado);
    return res.json({ ok: true, itens: filtrado });
  }

  /* ---------- remover resultado ---------- */
  if (dados.acao === "resultado_del") {
    const idx = itens.findIndex((x) => x.id === dados.id);
    if (idx < 0) return erro(res, 404, "Item não encontrado.");
    delete itens[idx].resultado;
    await gravar(chave(semana), itens);
    return res.json({ ok: true, item: itens[idx] });
  }

  /* ---------- lançar resultado ---------- */
  // Qualquer papel pode lançar — é o operador registrando o que aconteceu
  if (dados.acao === "resultado") {
    const idx = itens.findIndex((x) => x.id === dados.id);
    if (idx < 0) return erro(res, 404, "Item não encontrado.");

    const it = itens[idx];

    if (it.tipo === "brassagem") {
      it.resultado = {
        og:       (dados.og       || "").trim(),
        volume:   (dados.volume   || "").trim(),
        obsReal:  (dados.obsReal  || "").trim(),
        lancadoPor: sessao.login,
        em: new Date().toISOString(),
      };
    } else {
      // envase — cálculos de perdas e totais
      const litrosInicio   = parseFloat((dados.litrosInicio   || "0").replace(",",".")) || 0;
      const litrosFim      = parseFloat((dados.litrosFim      || "0").replace(",",".")) || 0;
      const qtdEnvasada    = parseFloat((dados.qtdEnvasada    || "0").replace(",",".")) || 0;
      const sleevePerd     = parseFloat((dados.sleevePerd     || "0").replace(",",".")) || 0;
      const petPerd        = parseFloat((dados.petPerd        || "0").replace(",",".")) || 0;
      const tampasPerd     = parseFloat((dados.tampasPerd     || "0").replace(",",".")) || 0;

      const litrosUsados   = litrosInicio - litrosFim;
      const sleeveTotal    = qtdEnvasada + sleevePerd;
      const petTotal       = qtdEnvasada + petPerd;
      const tampasTotal    = qtdEnvasada + tampasPerd;

      it.resultado = {
        litrosInicio,
        litrosFim,
        litrosUsados:  Math.round(litrosUsados * 10) / 10,
        tanqueFinalizado: dados.tanqueFinalizado === "sim",
        qtdEnvasada,
        sleevePerd,  sleeveTotal,
        petPerd,     petTotal,
        tampasPerd,  tampasTotal,
        obsReal: (dados.obsReal || "").trim(),
        lancadoPor: sessao.login,
        em: new Date().toISOString(),
      };
    }

    await gravar(chave(semana), itens);
    return res.json({ ok: true, item: itens[idx] });
  }

  /* ---------- check (toggle BeerSales / Beerbo) ---------- */
  if (dados.acao === "check") {
    const idx = itens.findIndex((x) => x.id === dados.id);
    if (idx < 0) return erro(res, 404, "Item não encontrado.");

    const camposPermitidos = ["lancadoBeerSales", "lancadoBeerbo"];
    if (!camposPermitidos.includes(dados.campo)) {
      return erro(res, 400, "Campo inválido.");
    }

    itens[idx].checks = itens[idx].checks || {};
    // toggle
    itens[idx].checks[dados.campo] = !itens[idx].checks[dados.campo];

    // registrar quem marcou e quando
    itens[idx].checks[dados.campo + "_por"] = sessao.login;
    itens[idx].checks[dados.campo + "_em"]  = new Date().toISOString();

    await gravar(chave(semana), itens);
    return res.json({ ok: true, item: itens[idx] });
  }

  /* ---------- barril (envase de barril) ---------- */
  if (dados.acao === "barril") {
    const progId = (dados.progId || "").trim();
    if (!progId) return erro(res, 400, "progId obrigatório.");

    const registros = (await ler(`barril:${semana}:${progId}`)) || [];
    registros.push({
      id: novoId(),
      produto: (dados.produto || "").trim(),
      tanque:  (dados.tanque  || "").trim(),
      lote:    (dados.lote    || "").trim(),
      dia:     (dados.dia     || "").trim(),
      dataISO: (dados.dataISO || "").trim(),
      linhas: Array.isArray(dados.linhas) ? dados.linhas : [],
      total: Number(dados.total) || 0,
      lancadoPor: sessao.login,
      em: new Date().toISOString(),
    });
    await gravar(`barril:${semana}:${progId}`, registros);
    return res.json({ ok: true, registros });
  }

  /* ---------- barril_check (toggle BeerSales no barril) ---------- */
  if (dados.acao === "barril_check") {
    const progId = (dados.progId || "").trim();
    const id     = (dados.id    || "").trim();
    const campo  = (dados.campo || "").trim();
    if (!progId || !id) return erro(res, 400, "progId e id obrigatórios.");
    if (campo !== "lancadoBeerSales") return erro(res, 400, "Campo inválido.");

    const registros = (await ler(`barril:${semana}:${progId}`)) || [];
    const idx = registros.findIndex((r) => r.id === id);
    if (idx < 0) return erro(res, 404, "Registro não encontrado.");

    registros[idx].checks = registros[idx].checks || {};
    registros[idx].checks[campo] = !registros[idx].checks[campo];
    registros[idx].checks[campo + "_por"] = sessao.login;
    registros[idx].checks[campo + "_em"]  = new Date().toISOString();

    await gravar(`barril:${semana}:${progId}`, registros);
    return res.json({ ok: true, item: registros[idx] });
  }

  /* ---------- barril_del (remover registro de barril) ---------- */
  if (dados.acao === "barril_del") {
    const progId = (dados.progId || "").trim();
    if (!progId) return erro(res, 400, "progId obrigatório.");
    if (!podeProgramar(sessao.papel))
      return erro(res, 403, "Apenas admin ou gestor podem remover.");
    const registros = (await ler(`barril:${semana}:${progId}`)) || [];
    const filtrado = registros.filter((r) => r.id !== dados.id);
    await gravar(`barril:${semana}:${progId}`, filtrado);
    return res.json({ ok: true, registros: filtrado });
  }

  return erro(res, 400, "Ação desconhecida.");
});
