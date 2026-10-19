// api/ficha.js — salvar e carregar fichas de produção por lote
// GET  /api/ficha?lote=HELLES59/2BT05          → retorna ficha salva (ou null)
// POST /api/ficha  { lote, dados }              → salva/atualiza ficha
// GET  /api/ficha?lista=1                       → lista todos os lotes com ficha

import {
  ler, gravar, lerVarios, bancoConfigurado,
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

  /* ── GET carrega ficha de um lote ── */
  if (req.method === "GET") {
    const lote = (req.query.lote || "").trim();
    if (!lote) return erro(res, 400, "Parâmetro lote obrigatório.");
    const ficha = await ler(`ficha:${lote}`);
    return res.json({ ficha: ficha || null });
  }

  /* ── POST salva ficha ── */
  if (req.method === "POST") {
    const { lote, dados } = corpo(req);
    if (!lote || typeof lote !== "string" || !lote.trim())
      return erro(res, 400, "Campo lote obrigatório.");
    if (!dados || typeof dados !== "object")
      return erro(res, 400, "Campo dados obrigatório.");

    const chave = lote.trim();

    // adiciona metadados
    dados.meta = {
      ...(dados.meta || {}),
      salvoEm:  new Date().toISOString(),
      salvoPor: usuario.login,
      versao:   ((dados.meta?.versao || 0) + 1),
    };

    await gravar(`ficha:${chave}`, dados);

    // mantém índice global de lotes com ficha
    const idx = (await ler("fichas:index")) || [];
    if (!idx.includes(chave)) {
      idx.unshift(chave);
      await gravar("fichas:index", idx);
    }

    return res.json({ ok: true, salvoEm: dados.meta.salvoEm, versao: dados.meta.versao });
  }

  erro(res, 405, "Método não permitido.");
});
