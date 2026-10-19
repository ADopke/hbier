// api/receita.js — CRUD de receitas de cerveja
// GET  /api/receita?lista=1          → lista todas as receitas (resumo)
// GET  /api/receita?id=<id>          → carrega receita completa
// POST /api/receita  { id?, dados }  → cria (sem id) ou atualiza (com id)
// POST /api/receita  { id, deletar:true } → remove receita

import {
  ler, gravar, apagar, lerVarios, bancoConfigurado,
  exigirLogin, corpo, erro, protegido, novoId
} from "./_lib.js";

export default protegido(async function(req, res) {
  if (!bancoConfigurado())
    return erro(res, 503, "Banco não configurado.");

  const usuario = await exigirLogin(req, res);
  if (!usuario) return;

  /* ── GET lista todas as receitas ── */
  if (req.method === "GET" && req.query.lista === "1") {
    const idx = (await ler("receitas:index")) || [];
    if (!idx.length) return res.json({ receitas: [] });

    const chaves = idx.map(id => `receita:${id}`);
    const valores = await lerVarios(chaves);
    const receitas = idx.map((id, i) => {
      const r = valores[i];
      if (!r) return null;
      return {
        id,
        nome:       r.nome       || "—",
        estilo:     r.estilo     || "—",
        og:         r.og         || "",
        fg:         r.fg         || "",
        abv:        r.abv        || "",
        volume:     r.volume     || "",
        atualizadoEm: r.meta?.atualizadoEm || null,
      };
    }).filter(Boolean);
    return res.json({ receitas });
  }

  /* ── GET carrega receita completa ── */
  if (req.method === "GET") {
    const id = (req.query.id || "").trim();
    if (!id) return erro(res, 400, "Parâmetro id obrigatório.");
    const receita = await ler(`receita:${id}`);
    return res.json({ receita: receita || null });
  }

  /* ── POST salva / atualiza / deleta ── */
  if (req.method === "POST") {
    const { id: idExistente, dados, deletar } = corpo(req);

    /* -- DELETE -- */
    if (deletar) {
      const id = (idExistente || "").trim();
      if (!id) return erro(res, 400, "id obrigatório para deletar.");
      await apagar(`receita:${id}`);
      const idx = (await ler("receitas:index")) || [];
      const novo = idx.filter(x => x !== id);
      await gravar("receitas:index", novo);
      return res.json({ ok: true });
    }

    /* -- CREATE / UPDATE -- */
    if (!dados || typeof dados !== "object")
      return erro(res, 400, "Campo dados obrigatório.");

    const id = (idExistente || "").trim() || novoId();

    dados.meta = {
      ...(dados.meta || {}),
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: usuario.login,
    };

    await gravar(`receita:${id}`, dados);

    const idx = (await ler("receitas:index")) || [];
    if (!idx.includes(id)) {
      idx.unshift(id);
      await gravar("receitas:index", idx);
    }

    return res.json({ ok: true, id, atualizadoEm: dados.meta.atualizadoEm });
  }

  erro(res, 405, "Método não permitido.");
});
