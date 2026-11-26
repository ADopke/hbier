// api/logs.js — registro de erros que acontecem na tela dos usuários
// POST /api/logs { erros:[{msg, stack, onde, url, versao, em}] }  → qualquer usuário logado (ou não)
// GET  /api/logs                                                → admin: lista (mais novos primeiro)
// POST /api/logs { acao:"limpar" }                              → admin
import { ler, gravar, usuarioLogado, corpo, erro, protegido } from "./_lib.js";

const CHAVE = "errlog";
const MAX = 400;

export default protegido(async function (req, res) {
  const u = await usuarioLogado(req);
  if (req.method === "GET") {
    if (!u || u.papel !== "admin") return erro(res, 403, "Apenas admin.");
    return res.json({ ok: true, erros: (await ler(CHAVE)) || [] });
  }
  if (req.method !== "POST") return erro(res, 405, "Método não permitido.");
  const d = corpo(req);
  if (d.acao === "limpar") {
    if (!u || u.papel !== "admin") return erro(res, 403, "Apenas admin.");
    await gravar(CHAVE, []);
    return res.json({ ok: true });
  }
  const novos = (Array.isArray(d.erros) ? d.erros : []).slice(0, 20).map((e) => ({
    em:     String(e.em || new Date().toISOString()).slice(0, 30),
    quem:   u ? u.login : "(sem login)",
    msg:    String(e.msg || "").slice(0, 400),
    stack:  String(e.stack || "").slice(0, 1200),
    onde:   String(e.onde || "").slice(0, 120),
    url:    String(e.url || "").slice(0, 200),
    versao: String(e.versao || "").slice(0, 20),
    nav:    String(req.headers["user-agent"] || "").slice(0, 160),
  })).filter((e) => e.msg);
  if (!novos.length) return res.json({ ok: true });
  const lista = (await ler(CHAVE)) || [];
  await gravar(CHAVE, novos.concat(lista).slice(0, MAX));
  return res.json({ ok: true });
});
