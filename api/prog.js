import {
  ler, gravar, exigirLogin, corpo, erro, protegido,
} from "./_lib.js";

// Programação de produção semanal.
//
// GET  /api/prog?semana=AAAA-MM-DD   → lê a programação da semana
// POST /api/prog                     → salva / edita / remove um item
//
// Estrutura de cada item:
//   { id, estilo, tanque, dia, obs, criadaPor, em }

function chave(semana) { return `prog:${semana}`; }

function novoId() {
  return Math.random().toString(36).slice(2, 10);
}

export default protegido(async function handler(req, res) {
  const sessao = await exigirLogin(req, res);
  if (!sessao) return;

  // Leitura: qualquer papel pode ver a programação
  if (req.method === "GET") {
    const semana = (req.query.semana || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(semana)) {
      return erro(res, 400, "Semana inválida (AAAA-MM-DD).");
    }
    const itens = (await ler(chave(semana))) || [];
    return res.json({ ok: true, semana, itens });
  }

  // Escrita: só admin e gestor
  if (!["admin", "gestor"].includes(sessao.papel)) {
    return erro(res, 403, "Apenas admin ou gestor podem editar a programação.");
  }

  const dados = corpo(req);
  const semana = (dados.semana || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(semana)) {
    return erro(res, 400, "Semana inválida (AAAA-MM-DD).");
  }

  const itens = (await ler(chave(semana))) || [];

  if (dados.acao === "criar") {
    itens.push({
      id: novoId(),
      estilo: (dados.estilo || "").trim(),
      tanque: (dados.tanque || "").trim(),
      dia: (dados.dia || "").trim(),
      obs: (dados.obs || "").trim(),
      criadaPor: sessao.login,
      em: new Date().toISOString(),
    });
    await gravar(chave(semana), itens);
    return res.json({ ok: true, itens });
  }

  if (dados.acao === "editar") {
    const idx = itens.findIndex((x) => x.id === dados.id);
    if (idx < 0) return erro(res, 404, "Item não encontrado.");
    itens[idx] = {
      ...itens[idx],
      estilo: (dados.estilo || "").trim(),
      tanque: (dados.tanque || "").trim(),
      dia: (dados.dia || "").trim(),
      obs: (dados.obs || "").trim(),
    };
    await gravar(chave(semana), itens);
    return res.json({ ok: true, itens });
  }

  if (dados.acao === "remover") {
    const filtrado = itens.filter((x) => x.id !== dados.id);
    await gravar(chave(semana), filtrado);
    return res.json({ ok: true, itens: filtrado });
  }

  return erro(res, 400, "Ação desconhecida.");
});
