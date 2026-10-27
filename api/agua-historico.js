// api/agua-historico.js — histórico de tratamento de água por produção
// GET  /api/agua-historico                 → retorna todos os registros
// GET  /api/agua-historico?receita=Helles  → filtra por receita (parcial, case-insensitive)
// POST /api/agua-historico  { registro }   → adiciona um registro ao histórico
//
// Estrutura de cada registro:
// {
//   id:         string (timestamp + lote),
//   lote:       string,
//   receita:    string,
//   data:       string (ISO),
//   grist:      [{ malte: string, kg: number, pct: number }],
//   volAgua:    number (L),
//   phBruto:    number,
//   phAlvo:     string  (ex: "5.2–5.4"),
//   lacticoMl:  number,
//   phFinal:    number,
//   obs:        string,
//   gravadoPor: string,
// }

import {
  ler, gravar, bancoConfigurado,
  exigirLogin, corpo, erro, protegido
} from "./_lib.js";

const CHAVE = "agua:historico";

export default protegido(async function(req, res) {
  if (!bancoConfigurado())
    return erro(res, 503, "Banco não configurado.");

  const usuario = await exigirLogin(req, res);
  if (!usuario) return;

  /* ── GET ── */
  if (req.method === "GET") {
    const historico = (await ler(CHAVE)) || [];
    const filtroReceita = req.query.receita || "";

    let resultado = historico;
    if (filtroReceita) {
      const fl = filtroReceita.toLowerCase();
      resultado = historico.filter(r =>
        (r.receita || "").toLowerCase().includes(fl)
      );
    }

    // ordena mais recente primeiro
    resultado = resultado.slice().sort((a, b) =>
      (b.data || "").localeCompare(a.data || "")
    );

    return res.json({ historico: resultado, total: historico.length });
  }

  /* ── POST ── */
  if (req.method === "POST") {
    const body = await corpo(req);
    const registro = body?.registro;

    if (!registro || !registro.lote) {
      return erro(res, 400, "Campo 'registro.lote' obrigatório.");
    }

    // validações mínimas
    const vol  = parseFloat(registro.volAgua);
    const lact = parseFloat(registro.lacticoMl);
    if (!vol || vol <= 0)    return erro(res, 400, "volAgua inválido.");
    if (!lact || lact <= 0)  return erro(res, 400, "lacticoMl inválido.");

    const historico = (await ler(CHAVE)) || [];

    // evita duplicata do mesmo lote + batelada
    const idNovo = `${registro.lote}__${registro.numBatelada || "1"}`;
    const jaExiste = historico.findIndex(r =>
      (r.id || "") === idNovo
    );

    const novoRegistro = {
      id:         idNovo,
      lote:       String(registro.lote || ""),
      receita:    String(registro.receita || ""),
      data:       registro.data || new Date().toISOString(),
      grist:      Array.isArray(registro.grist) ? registro.grist : [],
      volAgua:    vol,
      phBruto:    parseFloat(registro.phBruto)  || null,
      phAlvo:     String(registro.phAlvo || "5.2–5.4"),
      lacticoMl:  lact,
      phFinal:    parseFloat(registro.phFinal)  || null,
      obs:        String(registro.obs || ""),
      gravadoPor: String(usuario.login || ""),
    };

    if (jaExiste >= 0) {
      historico[jaExiste] = novoRegistro; // atualiza
    } else {
      historico.push(novoRegistro);
    }

    await gravar(CHAVE, historico);
    return res.json({ ok: true, id: idNovo, total: historico.length });
  }

  return erro(res, 405, "Método não permitido.");
});
