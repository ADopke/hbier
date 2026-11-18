import {
  ler, gravar, exigirLogin, corpo, erro, protegido,
} from "./_lib.js";

// GET  /api/metas?ano=2026&mes=8   → lê a meta do mês (mes = 1-12)
// POST /api/metas                  → salva a meta do mês
//
// Estrutura salva:
//   { brass, envTotal, formatos: { "Garrafa 355ml": N, "PET 500ml": N, ... }, barris: { "Helles": N, ... } }
//
// Qualquer papel autenticado pode ler.
// Apenas admin e gestor podem salvar.

const CHAVE_CFG = "config:planejamento";
const CFG_PADRAO = { cicloDias: 15, intervaloDias: 1, bateladasDia: 6, litrosBatelada: 1450, brassaSabado: false };
function chaveDemanda(ano, mes) { return `plan:demanda:${ano}-${String(mes).padStart(2, "0")}`; }

function chave(ano, mes) {
  return `meta:${ano}-${String(mes).padStart(2, "0")}`;
}

export default protegido(async function handler(req, res) {
  const sessao = await exigirLogin(req, res);
  if (!sessao) return;

  // ── Configuração do planejamento de brassagens (vale para o app todo) ──
  //   GET  /api/metas?config=1
  //   POST /api/metas { acao:"config", cicloDias, intervaloDias, bateladasDia, litrosBatelada, brassaSabado }
  // ── Necessidade por estilo do mês ──
  //   GET  /api/metas?demanda=1&ano=2026&mes=12
  //   POST /api/metas { acao:"demanda", ano, mes, estilos:{ "Helles": 80000, "Red Ale": 8000 } }
  if (req.method === "GET" && req.query.config === "1") {
    const cfg = (await ler(CHAVE_CFG)) || {};
    return res.json({ ok: true, config: { ...CFG_PADRAO, ...cfg } });
  }
  if (req.method === "GET" && req.query.demanda === "1") {
    const ano = parseInt(req.query.ano, 10), mes = parseInt(req.query.mes, 10);
    if (!ano || !mes) return erro(res, 400, "ano e mes obrigatórios.");
    const d = (await ler(chaveDemanda(ano, mes))) || {};
    return res.json({ ok: true, estilos: d.estilos || {} });
  }
  if (req.method === "POST") {
    const dd = corpo(req);
    if (dd && (dd.acao === "config" || dd.acao === "demanda")) {
      if (!["admin", "gestor"].includes(sessao.papel))
        return erro(res, 403, "Apenas admin ou gestor podem alterar o planejamento.");
      if (dd.acao === "config") {
        const n = (v, min, max, pad) => { const x = Number(v); return isFinite(x) && x >= min && x <= max ? x : pad; };
        const cfg = {
          cicloDias:      n(dd.cicloDias, 5, 60, CFG_PADRAO.cicloDias),
          intervaloDias:  n(dd.intervaloDias, 0, 10, CFG_PADRAO.intervaloDias),
          bateladasDia:   n(dd.bateladasDia, 1, 20, CFG_PADRAO.bateladasDia),
          litrosBatelada: n(dd.litrosBatelada, 100, 10000, CFG_PADRAO.litrosBatelada),
          brassaSabado:   !!dd.brassaSabado,
          atualizadoPor:  sessao.login,
          em:             new Date().toISOString(),
        };
        await gravar(CHAVE_CFG, cfg);
        return res.json({ ok: true, config: cfg });
      }
      const ano = parseInt(dd.ano, 10), mes = parseInt(dd.mes, 10);
      if (!ano || !mes) return erro(res, 400, "ano e mes obrigatórios.");
      const estilos = {};
      Object.entries(dd.estilos || {}).forEach(([k, v]) => { const x = Number(v); if (k.trim() && x > 0) estilos[k.trim()] = x; });
      await gravar(chaveDemanda(ano, mes), { estilos, atualizadoPor: sessao.login, em: new Date().toISOString() });
      return res.json({ ok: true, estilos });
    }
  }

  if (req.method === "GET") {
    const ano = parseInt(req.query.ano, 10);
    const mes = parseInt(req.query.mes, 10); // 1-12
    if (!ano || !mes || mes < 1 || mes > 12)
      return erro(res, 400, "Parâmetros ano e mes obrigatórios (mes = 1-12).");
    const meta = (await ler(chave(ano, mes))) || {};
    return res.json({ ok: true, ano, mes, meta });
  }

  if (req.method === "POST") {
    if (!["admin", "gestor"].includes(sessao.papel))
      return erro(res, 403, "Apenas admin ou gestor podem definir metas.");

    const dados = corpo(req);
    const ano = parseInt(dados.ano, 10);
    const mes = parseInt(dados.mes, 10);
    if (!ano || !mes || mes < 1 || mes > 12)
      return erro(res, 400, "Parâmetros ano e mes obrigatórios (mes = 1-12).");

    const meta = {
      brass:    dados.brass    != null ? Number(dados.brass)    : undefined,
      envTotal: dados.envTotal != null ? Number(dados.envTotal) : undefined,
      formatos: {},
      barris:   {},
      atualizadoPor: sessao.login,
      em: new Date().toISOString(),
    };

    if (dados.formatos && typeof dados.formatos === "object") {
      for (const [fmt, val] of Object.entries(dados.formatos)) {
        const n = Number(val);
        if (n > 0) meta.formatos[fmt] = n;
      }
    }

    if (dados.barris && typeof dados.barris === "object") {
      for (const [prod, val] of Object.entries(dados.barris)) {
        const n = Number(val);
        if (n > 0) meta.barris[prod] = n;
      }
    }

    // manter campos null (significa "sem meta definida")
    // só apagar se explicitamente null/0 para limpar
    if (meta.brass    === null || meta.brass    === 0) delete meta.brass;
    if (meta.envTotal === null || meta.envTotal === 0) delete meta.envTotal;

    await gravar(chave(ano, mes), meta);
    return res.json({ ok: true, meta });
  }

  return erro(res, 405, "Método não permitido.");
});
