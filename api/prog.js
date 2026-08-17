import {
  ler, gravar, exigirLogin, corpo, erro, protegido,
} from "./_lib.js";

// Programação de produção semanal.
//
// GET  /api/prog?semana=AAAA-MM-DD[&tarefas=1]  → lê a programação da semana
// POST /api/prog                                 → salva / edita / remove / lança resultado / barril / checks

function chave(semana)       { return `prog:${semana}`; }
function chaveBarril(semana) { return `prog:barril:${semana}`; }
function novoId() { return Math.random().toString(36).slice(2, 10); }

function podeProgramar(papel) { return ["admin","gestor"].includes(papel); }

export default protegido(async function handler(req, res) {
  const sessao = await exigirLogin(req, res);
  if (!sessao) return;

  /* ================================================================
     GET — leitura da semana
     ================================================================ */
  if (req.method === "GET") {
    const semana = (req.query.semana || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(semana))
      return erro(res, 400, "Semana inválida (AAAA-MM-DD).");

    const itens   = (await ler(chave(semana)))       || [];
    const barreis = (await ler(chaveBarril(semana)))  || {};

    // tarefas=1 → enriquecer cada item com as tarefas vinculadas
    let tarefasVinculadas = {};
    if (req.query.tarefas === "1") {
      try {
        const usuarios = (await ler("usuarios")) || [];
        for (const u of usuarios) {
          const tarefas = (await ler(`tasks:${u.login}`)) || [];
          const estado  = (await ler(`state:${u.login}:${semana}`)) || {};
          for (const t of tarefas) {
            if (!t.progId) continue;
            for (const it of itens) {
              if (t.progId === it.id) {
                if (!tarefasVinculadas[it.id]) tarefasVinculadas[it.id] = [];
                tarefasVinculadas[it.id].push({
                  taskId: t.id, taskNome: t.nome, login: u.login,
                  feita: !!((estado.p || {})[t.id]),
                });
              }
            }
            // barreis
            const chB = `barril-${semana}`;
            const regsB = barreis[chB] || [];
            for (const r of regsB) {
              if (t.progId === r.id) {
                if (!tarefasVinculadas[r.id]) tarefasVinculadas[r.id] = [];
                tarefasVinculadas[r.id].push({
                  taskId: t.id, taskNome: t.nome, login: u.login,
                  feita: !!((estado.p || {})[t.id]),
                });
              }
            }
          }
        }
      } catch(e) { /* falha silenciosa */ }
    }

    return res.json({ ok: true, semana, itens, barreis, tarefasVinculadas });
  }

  /* ================================================================
     POST — escrita
     ================================================================ */
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
      id:        novoId(),
      tipo:      dados.tipo === "envase" ? "envase" : "brassagem",
      dia:       (dados.dia     || "").trim(),
      obs:       (dados.obs     || "").trim(),
      dataISO:   (dados.dataISO || "").trim(),
      criadaPor: sessao.login,
      em:        new Date().toISOString(),
    };

    if (item.tipo === "brassagem") {
      item.estilo  = (dados.estilo  || "").trim();
      item.tanque  = (dados.tanque  || "").trim();
      item.lote    = (dados.lote    || "").trim();
      item.volPrev = (dados.volPrev || "").trim();
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
    it.dia     = (dados.dia     || "").trim();
    it.obs     = (dados.obs     || "").trim();
    it.dataISO = (dados.dataISO || "").trim();

    if (it.tipo === "brassagem") {
      it.estilo  = (dados.estilo  || "").trim();
      it.tanque  = (dados.tanque  || "").trim();
      it.lote    = (dados.lote    || "").trim();
      it.volPrev = (dados.volPrev || "").trim();
    } else {
      it.produto      = (dados.produto      || "").trim();
      it.lote         = (dados.lote         || "").trim();
      it.tanqueOrigem = (dados.tanqueOrigem || "").trim();
      it.formato      = (dados.formato      || "").trim();
      it.qtd          = (dados.qtd          || "").trim();
    }

    // Se o dataISO cair em uma semana diferente da atual, mover o item
    if (it.dataISO) {
      const d = new Date(it.dataISO + "T00:00:00");
      const dow = d.getDay(); // 0=dom
      const diffSeg = (dow + 6) % 7; // dias até a segunda anterior
      const seg = new Date(d);
      seg.setDate(seg.getDate() - diffSeg);
      const novaChaveSem = seg.getFullYear() + "-" +
        String(seg.getMonth() + 1).padStart(2, "0") + "-" +
        String(seg.getDate()).padStart(2, "0");

      if (novaChaveSem !== semana) {
        // Remover da semana original
        const filtrado = itens.filter((x) => x.id !== dados.id);
        await gravar(chave(semana), filtrado);
        // Adicionar na semana nova
        const itensNovaSem = (await ler(chave(novaChaveSem))) || [];
        itensNovaSem.push(it);
        await gravar(chave(novaChaveSem), itensNovaSem);
        return res.json({ ok: true, itens: filtrado, movido: novaChaveSem });
      }
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

  /* ---------- lançar resultado ---------- */
  if (dados.acao === "resultado") {
    const idx = itens.findIndex((x) => x.id === dados.id);
    if (idx < 0) return erro(res, 404, "Item não encontrado.");

    const it = itens[idx];

    if (it.tipo === "brassagem") {
      it.resultado = {
        og:        (dados.og      || "").trim(),
        volume:    (dados.volume  || "").trim(),
        obsReal:   (dados.obsReal || "").trim(),
        lancadoPor: sessao.login,
        em: new Date().toISOString(),
      };
    } else {
      const litrosInicio = parseFloat((dados.litrosInicio || "0").replace(",",".")) || 0;
      const litrosFim    = parseFloat((dados.litrosFim    || "0").replace(",",".")) || 0;
      const qtdEnvasada  = parseFloat((dados.qtdEnvasada  || "0").replace(",",".")) || 0;
      const sleevePerd   = parseFloat((dados.sleevePerd   || "0").replace(",",".")) || 0;
      const petPerd      = parseFloat((dados.petPerd      || "0").replace(",",".")) || 0;
      const tampasPerd   = parseFloat((dados.tampasPerd   || "0").replace(",",".")) || 0;

      it.resultado = {
        litrosInicio,
        litrosFim,
        litrosUsados:    Math.round((litrosInicio - litrosFim) * 10) / 10,
        tanqueFinalizado: dados.tanqueFinalizado === "sim",
        qtdEnvasada,
        sleevePerd,  sleeveTotal:  qtdEnvasada + sleevePerd,
        petPerd,     petTotal:     qtdEnvasada + petPerd,
        tampasPerd,  tampasTotal:  qtdEnvasada + tampasPerd,
        obsReal:   (dados.obsReal || "").trim(),
        lancadoPor: sessao.login,
        em: new Date().toISOString(),
      };
    }

    await gravar(chave(semana), itens);
    return res.json({ ok: true, item: itens[idx] });
  }

  /* ---------- remover resultado ---------- */
  if (dados.acao === "resultado_del") {
    const idx = itens.findIndex((x) => x.id === dados.id);
    if (idx < 0) return erro(res, 404, "Item não encontrado.");
    delete itens[idx].resultado;
    await gravar(chave(semana), itens);
    return res.json({ ok: true, item: itens[idx] });
  }

  /* ---------- check de lançamento (BeerSales / Beerbo) ---------- */
  if (dados.acao === "check") {
    const idx = itens.findIndex((x) => x.id === dados.id);
    if (idx < 0) return erro(res, 404, "Item não encontrado.");

    const it    = itens[idx];
    it.checks   = it.checks || {};
    const campo = dados.campo;
    if (!campo) return erro(res, 400, "Campo não informado.");

    if (it.checks[campo]) {
      delete it.checks[campo];
      delete it.checks[campo + "_por"];
      delete it.checks[campo + "_em"];
    } else {
      it.checks[campo]          = true;
      it.checks[campo + "_por"] = sessao.login;
      it.checks[campo + "_em"]  = new Date().toISOString();
    }

    await gravar(chave(semana), itens);
    return res.json({ ok: true, item: it });
  }

  /* ================================================================
     Barreis — chave separada: prog:barril:AAAA-MM-DD
     ================================================================ */

  /* ---------- registrar barril ---------- */
  if (dados.acao === "barril") {

    const barreis = (await ler(chaveBarril(semana))) || {};
    const progId  = (dados.progId || `barril-${semana}`).trim();
    const lista   = barreis[progId] || [];

    const reg = {
      id:         novoId(),
      produto:    (dados.produto || "").trim(),
      tanque:     (dados.tanque  || "").trim(),
      lote:       (dados.lote    || "").trim(),
      dia:        (dados.dia     || "").trim(),
      dataISO:    (dados.dataISO || "").trim(),
      linhas:     dados.linhas   || [],
      total:      dados.total    || 0,
      lancadoPor: sessao.login,
      em:         new Date().toISOString(),
      checks:     {},
    };

    lista.push(reg);
    barreis[progId] = lista;
    await gravar(chaveBarril(semana), barreis);
    return res.json({ ok: true, barreis });
  }

  /* ---------- remover barril ---------- */
  if (dados.acao === "barril_del") {
    if (!podeProgramar(sessao.papel))
      return erro(res, 403, "Apenas admin ou gestor podem remover barreis.");

    const barreis = (await ler(chaveBarril(semana))) || {};
    const progId  = (dados.progId || `barril-${semana}`).trim();
    barreis[progId] = (barreis[progId] || []).filter((x) => x.id !== dados.id);
    await gravar(chaveBarril(semana), barreis);
    return res.json({ ok: true, barreis });
  }

  /* ---------- check do barril ---------- */
  if (dados.acao === "barril_check") {
    const barreis = (await ler(chaveBarril(semana))) || {};
    const progId  = (dados.progId || `barril-${semana}`).trim();
    const lista   = barreis[progId] || [];
    const idx     = lista.findIndex((x) => x.id === dados.id);
    if (idx < 0) return erro(res, 404, "Registro de barril não encontrado.");

    const reg   = lista[idx];
    reg.checks  = reg.checks || {};
    const campo = dados.campo;
    if (!campo) return erro(res, 400, "Campo não informado.");

    if (reg.checks[campo]) {
      delete reg.checks[campo];
      delete reg.checks[campo + "_por"];
      delete reg.checks[campo + "_em"];
    } else {
      reg.checks[campo]          = true;
      reg.checks[campo + "_por"] = sessao.login;
      reg.checks[campo + "_em"]  = new Date().toISOString();
    }

    barreis[progId] = lista;
    await gravar(chaveBarril(semana), barreis);
    return res.json({ ok: true, reg });
  }

  return erro(res, 400, "Ação desconhecida.");
});
