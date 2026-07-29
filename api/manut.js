import {
  ler, gravar, exigirLogin, corpo, erro, protegido,
} from "./_lib.js";

// Histórico de manutenção por equipamento.
//
// GET  /api/manut?equip=CODIGO        → histórico do equipamento
// GET  /api/manut                     → todos os equipamentos com ocorrências
// POST /api/manut                     → registrar / editar / remover ocorrência
//
// Estrutura de cada ocorrência:
//   { id, equipCod, equipNome, data, desc, feitorPor, custo, em }

function novoId() {
  return Math.random().toString(36).slice(2, 10);
}

export default protegido(async function handler(req, res) {
  const sessao = await exigirLogin(req, res);
  if (!sessao) return;

  if (req.method === "GET") {
    const equip = (req.query.equip || "").trim();
    if (equip) {
      // histórico de um equipamento específico
      const lista = (await ler(`manut:${equip}`)) || [];
      return res.json({ ok: true, equip, lista });
    }
    // resumo: todos equipamentos que têm registro
    const indice = (await ler("manut:indice")) || [];
    const resumo = [];
    for (const cod of indice) {
      const lista = (await ler(`manut:${cod}`)) || [];
      if (lista.length) resumo.push({ cod, total: lista.length, ultima: lista[lista.length - 1] });
    }
    return res.json({ ok: true, resumo });
  }

  // Escrita
  if (!["admin", "gestor"].includes(sessao.papel)) {
    return erro(res, 403, "Apenas admin ou gestor podem registrar manutenções.");
  }

  const dados = corpo(req);
  const equipCod = (dados.equipCod || "").trim();
  if (!equipCod) return erro(res, 400, "Código do equipamento obrigatório.");

  const lista = (await ler(`manut:${equipCod}`)) || [];

  if (dados.acao === "registrar") {
    const reg = {
      id: novoId(),
      equipCod,
      equipNome: (dados.equipNome || "").trim(),
      data: (dados.data || new Date().toISOString().slice(0, 10)),
      desc: (dados.desc || "").trim(),
      feitorPor: (dados.feitorPor || sessao.login).trim(),
      custo: (dados.custo || "").trim(),
      em: new Date().toISOString(),
      registradoPor: sessao.login,
    };
    lista.push(reg);
    await gravar(`manut:${equipCod}`, lista);

    // manter índice de equipamentos com registro
    const indice = (await ler("manut:indice")) || [];
    if (!indice.includes(equipCod)) {
      indice.push(equipCod);
      await gravar("manut:indice", indice);
    }
    return res.json({ ok: true, reg, total: lista.length });
  }

  if (dados.acao === "editar") {
    const idx = lista.findIndex((x) => x.id === dados.id);
    if (idx < 0) return erro(res, 404, "Registro não encontrado.");
    lista[idx] = {
      ...lista[idx],
      data: (dados.data || lista[idx].data),
      desc: (dados.desc || "").trim(),
      feitorPor: (dados.feitorPor || lista[idx].feitorPor).trim(),
      custo: (dados.custo || "").trim(),
    };
    await gravar(`manut:${equipCod}`, lista);
    return res.json({ ok: true, lista });
  }

  if (dados.acao === "remover") {
    const filtrado = lista.filter((x) => x.id !== dados.id);
    await gravar(`manut:${equipCod}`, filtrado);
    return res.json({ ok: true, lista: filtrado });
  }

  return erro(res, 400, "Ação desconhecida.");
});
