// api/estoque.js — estoque de insumos (cadastro manual) para o cálculo Insumos × estoque
// GET  /api/estoque                 → { itens:[{nome, unidade, qtd, minimo}], atualizadoEm, atualizadoPor }
// POST /api/estoque { itens:[...] } → admin/gestor: grava a lista inteira
import { ler, gravar, exigirLogin, corpo, erro, protegido } from "./_lib.js";

const CHAVE = "estoque";
const UNIDADES = ["kg", "g", "un", "L", "mL"];

export default protegido(async function (req, res) {
  const u = await exigirLogin(req, res);
  if (!u) return;
  if (req.method === "GET") {
    const e = (await ler(CHAVE)) || { itens: [] };
    return res.json({ ok: true, ...e });
  }
  if (req.method !== "POST") return erro(res, 405, "Método não permitido.");
  if (!["admin", "gestor"].includes(u.papel)) return erro(res, 403, "Apenas admin ou gestor.");
  const itens = (Array.isArray(corpo(req).itens) ? corpo(req).itens : []).slice(0, 300).map((i) => ({
    nome:    String(i.nome || "").trim().slice(0, 80),
    unidade: UNIDADES.includes(i.unidade) ? i.unidade : "kg",
    qtd:     Number(String(i.qtd ?? "").replace(",", ".")) || 0,
    minimo:  Number(String(i.minimo ?? "").replace(",", ".")) || 0,
  })).filter((i) => i.nome);
  const dados = { itens, atualizadoEm: new Date().toISOString(), atualizadoPor: u.login };
  await gravar(CHAVE, dados);
  return res.json({ ok: true, ...dados });
});
