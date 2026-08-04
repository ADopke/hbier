import {
  ler, gravar, exigirLogin, corpo, erro, protegido,
} from "./_lib.js";

// GET  /api/metas?ano=2026&mes=8   → lê a meta do mês (mes = 1-12)
// POST /api/metas                  → salva a meta do mês
//
// Estrutura salva:
//   { brass, envTotal, formatos: { "Garrafa 355ml": N, "PET 500ml": N, ... } }
//
// Qualquer papel autenticado pode ler.
// Apenas admin e gestor podem salvar.

function chave(ano, mes) {
  return `meta:${ano}-${String(mes).padStart(2, "0")}`;
}

export default protegido(async function handler(req, res) {
  const sessao = await exigirLogin(req, res);
  if (!sessao) return;

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
      atualizadoPor: sessao.login,
      em: new Date().toISOString(),
    };

    if (dados.formatos && typeof dados.formatos === "object") {
      for (const [fmt, val] of Object.entries(dados.formatos)) {
        const n = Number(val);
        if (n > 0) meta.formatos[fmt] = n;
      }
    }

    // limpar campos undefined
    if (!meta.brass)    delete meta.brass;
    if (!meta.envTotal) delete meta.envTotal;

    await gravar(chave(ano, mes), meta);
    return res.json({ ok: true, meta });
  }

  return erro(res, 405, "Método não permitido.");
});
