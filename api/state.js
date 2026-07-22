import {
  ler,
  gravar,
  exigirLogin,
  corpo,
  erro,
  protegido,
} from "./_lib.js";

// Estado de uma semana:  { d: {tarefa:{seg:true}}, w: {tarefa:true},
//                          c: {tarefa:2}, l: {tarefa:true} }
// Ciclos (fora da semana): { tarefa: "2026-07-20" }  → última execução

export default protegido(async function handler(req, res) {
  const sessao = await exigirLogin(req, res);
  if (!sessao) return;

  if (req.method === "GET") {
    const semana = req.query.semana;
    const alvo = (req.query.usuario || sessao.login).toLowerCase();
    if (alvo !== sessao.login && sessao.papel !== "admin") {
      return erro(res, 403, "Sem permissão.");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(semana || "")) {
      return erro(res, 400, "Semana inválida.");
    }
    const estado = (await ler(`state:${alvo}:${semana}`)) || {
      d: {},
      w: {},
      c: {},
      l: {},
    };
    const ciclos = (await ler(`ciclos:${alvo}`)) || {};
    return res.json({ estado, ciclos });
  }

  if (req.method !== "POST") return erro(res, 405, "Método não permitido.");

  const dados = corpo(req);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dados.semana || "")) {
    return erro(res, 400, "Semana inválida.");
  }

  if (dados.estado) {
    await gravar(`state:${sessao.login}:${dados.semana}`, dados.estado);
  }
  if (dados.ciclos) {
    await gravar(`ciclos:${sessao.login}`, dados.ciclos);
  }
  return res.json({ ok: true });
});
