// api/ficha.js — salvar e carregar fichas de produção por lote
// GET  /api/ficha?lote=HELLES59/2BT05          → retorna ficha salva (ou null)
// POST /api/ficha  { lote, dados }              → salva/atualiza ficha
// GET  /api/ficha?lista=1                       → lista todos os lotes com ficha

import {
  ler, gravar, lerVarios, bancoConfigurado, travar, soltar,
  exigirLogin, corpo, erro, protegido
} from "./_lib.js";

export default protegido(async function(req, res) {
  if (!bancoConfigurado())
    return erro(res, 503, "Banco não configurado.");

  const usuario = await exigirLogin(req, res);
  if (!usuario) return;

  /* ── GET lista todos os lotes ── */
  if (req.method === "GET" && req.query.lista === "1") {
    const idx = (await ler("fichas:index")) || [];
    if (!idx.length) return res.json({ lotes: [] });

    // busca dados resumidos de cada ficha (lote, estilo, dataInicio, status)
    const chaves = idx.map(l => `ficha:${l}`);
    const valores = await lerVarios(chaves);
    const lotes = idx.map((lote, i) => {
      const f = valores[i];
      return {
        lote,
        estilo:     f?.cabecalho?.estilo     || "—",
        dataInicio: f?.cabecalho?.dataInicio || null,
        status:     f?.meta?.status          || "em andamento",
        salvoEm:    f?.meta?.salvoEm         || null,
        salvoPor:   f?.meta?.salvoPor        || null,
      };
    }).sort((a, b) => (b.salvoEm || "").localeCompare(a.salvoEm || ""));
    return res.json({ lotes });
  }

  /* ── 🧬 Fermentos (v3.18.0): geração de cada lote, origem e coletas ── */
  if (req.method === "GET" && req.query.fermentos === "1") {
    const idx = (await ler("fichas:index")) || [];
    const fichas = idx.length ? await lerVarios(idx.map((l) => `ficha:${l}`)) : [];
    const recIds = [...new Set(fichas.map((f) => f?.cabecalho?.receitaId).filter(Boolean))];
    const recs = recIds.length ? await lerVarios(recIds.map((id) => `receita:${id}`)) : [];
    const cepaRec = {};
    recIds.forEach((id, i) => { const lv = recs[i]?.levedura || {}; cepaRec[id] = [lv.linhagem, lv.fabricante ? `(${lv.fabricante})` : ""].filter(Boolean).join(" "); });
    const num = (v) => { const m = String(v || "").match(/\d+/); return m ? Number(m[0]) : null; };
    const lotes = idx.map((lote, i) => {
      const f = fichas[i]; if (!f) return null;
      const fe = f.fermento || {}, lev = (f.adicoesTanque && f.adicoesTanque.lev) || {}, col = f.coleta || {};
      return {
        lote, estilo: f.cabecalho?.estilo || "", tanque: f.cabecalho?.tanque || "", status: f.meta?.status || "",
        cepa: fe.cepa || cepaRec[f.cabecalho?.receitaId] || "",
        geracao: fe.geracao != null && fe.geracao !== "" ? Number(fe.geracao) : num(lev.geracao),
        origem: fe.origem || "", origemLote: fe.origemLote || "", fornecedorLote: fe.fornecedorLote || "",
        inoculadoEm: lev.data || "",
        coleta: { realizada: !!col.realizada, em: col.realizadaEm || "", por: col.realizadaPor || "", destino: col.destino || "", prevista: col.dataPrevista || "" },
      };
    }).filter(Boolean);
    const usos = {};
    lotes.forEach((l) => { if (l.origemLote) (usos[l.origemLote] = usos[l.origemLote] || []).push(l.lote); });
    lotes.forEach((l) => { l.usadoEm = usos[l.lote] || []; });
    const cfg = { limites: { "W-34/70": 18, "London ESB": 8, "Lona": 1 }, diasMax: 15, ...((await ler("fermentos:cfg")) || {}) };
    return res.json({ ok: true, lotes, cfg });
  }
  if (req.method === "POST" && corpo(req).acao === "fermentosCfg") {
    if (!["admin", "gestor"].includes(usuario.papel)) return erro(res, 403, "Apenas admin ou gestor.");
    const c = corpo(req).cfg || {};
    const limites = {};
    Object.keys(c.limites || {}).slice(0, 30).forEach((k) => { const n = Number(c.limites[k]); if (String(k).trim() && n > 0) limites[String(k).trim().slice(0, 40)] = Math.round(n); });
    const cfg = { limites, diasMax: Math.max(1, Math.min(90, Number(c.diasMax) || 15)) };
    await gravar("fermentos:cfg", cfg);
    return res.json({ ok: true, cfg });
  }

  /* ── GET versões anteriores de uma ficha ── */
  if (req.method === "GET" && req.query.historico === "1") {
    const lote = (req.query.lote || "").trim();
    if (!lote) return erro(res, 400, "Parâmetro lote obrigatório.");
    const hist = (await ler(`ficha:hist:${lote}`)) || [];
    const atualF = await ler(`ficha:${lote}`);
    if (req.query.idx != null) {
      const h = hist[parseInt(req.query.idx, 10)];
      return res.json({ ficha: h ? h.ficha : null });
    }
    return res.json({ versaoAtual: (atualF && atualF.meta && atualF.meta.versao) || 0, versoes: hist.map((h, i) => ({ idx: i, guardadoEm: h.guardadoEm,
      versao: h.ficha && h.ficha.meta && h.ficha.meta.versao, salvoPor: h.ficha && h.ficha.meta && h.ficha.meta.salvoPor,
      salvoEm: h.ficha && h.ficha.meta && h.ficha.meta.salvoEm, bateladas: (h.ficha && h.ficha.bateladas || []).length })) });
  }

  /* ── GET carrega ficha de um lote ── */
  if (req.method === "GET") {
    const lote = (req.query.lote || "").trim();
    if (!lote) return erro(res, 400, "Parâmetro lote obrigatório.");
    const ficha = await ler(`ficha:${lote}`);
    return res.json({ ficha: ficha || null });
  }

  /* ── POST presença: quem está com a ficha aberta + versão atual (a cada 30 s) ── */
  if (req.method === "POST" && corpo(req).acao === "presenca") {
    const lote = String(corpo(req).lote || "").trim();
    if (!lote) return erro(res, 400, "lote obrigatório.");
    const agora = Date.now();
    const pres = (await ler(`presenca:${lote}`)) || {};
    Object.keys(pres).forEach((k) => { if (agora - pres[k] > 75000) delete pres[k]; });
    if (corpo(req).saindo) delete pres[usuario.login]; else pres[usuario.login] = agora;
    await gravar(`presenca:${lote}`, pres);
    const f = await ler(`ficha:${lote}`);
    return res.json({ ok: true, outros: Object.keys(pres).filter((k) => k !== usuario.login),
      versao: (f && f.meta && f.meta.versao) || 0, salvoPor: f && f.meta && f.meta.salvoPor, salvoEm: f && f.meta && f.meta.salvoEm });
  }

  /* ── POST salva ficha ── */
  if (req.method === "POST") {
    let { lote, dados } = corpo(req);
    if (!lote || typeof lote !== "string" || !lote.trim())
      return erro(res, 400, "Campo lote obrigatório.");
    if (!dados || typeof dados !== "object")
      return erro(res, 400, "Campo dados obrigatório.");

    const chave = lote.trim();
    // uma gravação por vez nesta ficha: a próxima espera a anterior terminar e já lê a versão nova
    const dono = await travar(`ficha:${chave}`);
    if (!dono) return erro(res, 503, "Ficha ocupada por outra gravação — tente salvar de novo em alguns segundos.");
    try {
    const atual = await ler(`ficha:${chave}`);
    const versaoAtual = (atual && atual.meta && atual.meta.versao) || 0;
    const esperada = Number(corpo(req).versaoEsperada);

    // ── Proteção contra sobrescrever trabalho de outra pessoa ──
    // Se a ficha foi salva por alguém depois que esta tela a abriu, junta as duas:
    // o que veio agora vale, mas nada que já estava gravado é apagado
    // (campos vazios são completados, bateladas/leituras a mais são mantidas).
    let mesclado = false, mescladoDe = null;
    if (atual && isFinite(esperada) && esperada < versaoAtual) {
      const alt = corpo(req).alteracoes;
      dados = Array.isArray(alt) ? aplicarAlteracoes(atual, alt, dados) : mesclarFicha(dados, atual);
      mesclado = true;
      mescladoDe = { salvoPor: atual.meta && atual.meta.salvoPor, salvoEm: atual.meta && atual.meta.salvoEm, versao: versaoAtual };
    }

    // histórico das versões anteriores (para recuperar dados)
    if (atual) {
      const hist = (await ler(`ficha:hist:${chave}`)) || [];
      hist.unshift({ guardadoEm: new Date().toISOString(), ficha: atual });
      await gravar(`ficha:hist:${chave}`, hist.slice(0, 30));
    }

    // adiciona metadados
    dados.meta = {
      ...(dados.meta || {}),
      salvoEm:  new Date().toISOString(),
      salvoPor: usuario.login,
      versao:   Math.max(versaoAtual, dados.meta?.versao || 0) + 1,
    };

    await gravar(`ficha:${chave}`, dados);

    // mantém índice global de lotes com ficha
    const idx = (await ler("fichas:index")) || [];
    if (!idx.includes(chave)) {
      idx.unshift(chave);
      await gravar("fichas:index", idx);
    }

    return res.json({ ok: true, salvoEm: dados.meta.salvoEm, versao: dados.meta.versao, mesclado, mescladoDe });
    } finally {
      await soltar(`ficha:${chave}`, dono);
    }
  }

  erro(res, 405, "Método não permitido.");
});


/* ── Junta a ficha recebida (mais nova) com a gravada, sem perder dados ── */
function vazio(v) {
  return v === undefined || v === null || v === "" ||
         (Array.isArray(v) && v.every(vazio)) ||
         (typeof v === "object" && !Array.isArray(v) && Object.keys(v).every((k) => vazio(v[k])));
}
function completar(novo, velho) {
  if (vazio(novo)) return vazio(velho) ? novo : velho;
  if (Array.isArray(novo) && Array.isArray(velho)) {
    const n = Math.max(novo.length, velho.length), out = [];
    for (let i = 0; i < n; i++) out.push(i < novo.length ? completar(novo[i], velho[i]) : velho[i]);
    return out;
  }
  if (novo && velho && typeof novo === "object" && typeof velho === "object" && !Array.isArray(novo) && !Array.isArray(velho)) {
    const out = { ...velho, ...novo };
    Object.keys(velho).forEach((k) => { out[k] = completar(novo[k], velho[k]); });
    return out;
  }
  return novo;
}
function unirLog(novo, velho) {
  // leituras: une pelas linhas (data/hora + valores), mantendo as duas listas
  const chaveL = (r) => JSON.stringify(Array.isArray(r) ? r.slice(0, 8) : r);
  const out = Array.isArray(novo) ? novo.slice() : [];
  const vistos = new Set(out.map(chaveL));
  (Array.isArray(velho) ? velho : []).forEach((r) => { const k = chaveL(r); if (!vistos.has(k)) { out.push(r); vistos.add(k); } });
  out.sort((a, b) => String((a || [])[0] || "").localeCompare(String((b || [])[0] || "")));
  return out;
}
/* ── "Só o que mudou": parte da versão gravada (da outra pessoa) e aplica apenas os
   campos que esta tela alterou. Leituras e auditoria continuam sendo unidas linha a linha. ── */
const LOGS = ["fermLog", "maturLog", "audit"];
// auditoria é { chave: [{por, em, val}] } — junta as duas, sem repetir registros
function unirAudit(novo, velho) {
  const ehObj = (v) => v && typeof v === "object" && !Array.isArray(v);
  if (!ehObj(velho)) return ehObj(novo) ? novo : {};
  if (!ehObj(novo)) return velho;
  const out = { ...velho };
  Object.keys(novo).forEach((k) => {
    const a = Array.isArray(novo[k]) ? novo[k] : [], b = Array.isArray(out[k]) ? out[k] : [];
    const vistos = new Set(a.map((x) => JSON.stringify(x)));
    out[k] = a.concat(b.filter((x) => !vistos.has(JSON.stringify(x))))
      .sort((x, y) => String((x && x.em) || "").localeCompare(String((y && y.em) || "")));
  });
  return out;
}
function aplicarAlteracoes(atual, alteracoes, novo) {
  const out = JSON.parse(JSON.stringify(atual));
  delete out.meta;
  alteracoes.forEach((a) => {
    if (!Array.isArray(a) || !Array.isArray(a[0]) || !a[0].length) return;
    const cam = a[0];
    if (cam[0] === "meta" || LOGS.includes(cam[0])) return;
    let o = out;
    for (let i = 0; i < cam.length - 1; i++) {
      const k = cam[i];
      if (o[k] === null || typeof o[k] !== "object") o[k] = typeof cam[i + 1] === "number" ? [] : {};
      o = o[k];
    }
    o[cam[cam.length - 1]] = a[1];
  });
  LOGS.forEach((k) => {
    if (k === "audit") out.audit = unirAudit(novo.audit, atual.audit);
    else out[k] = unirLog(novo[k], atual[k]);
  });
  out.meta = { ...(novo.meta || {}) };
  return out;
}
function mesclarFicha(novo, velho) {
  const out = { ...novo };
  Object.keys(velho).forEach((k) => {
    if (k === "meta") return;
    if (k === "audit") out[k] = unirAudit(novo[k], velho[k]);
    else if (k === "fermLog" || k === "maturLog") out[k] = unirLog(novo[k], velho[k]);
    else out[k] = completar(novo[k], velho[k]);
  });
  return out;
}
