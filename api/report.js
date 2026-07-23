import {
  lerVarios,
  listaUsuarios,
  buscarUsuario,
  exigirLogin,
  erro,
  protegido,
} from "./_lib.js";

// Devolve, para cada pessoa, as tarefas + os ciclos + as marcações das semanas
// pedidas. O cálculo de percentual acontece no navegador, reaproveitando a
// mesma lógica do checklist — assim as duas telas nunca discordam.
//
// GET /api/report?semanas=2026-07-20,2026-07-13,...
//
// As semanas vêm prontas do navegador (e não calculadas aqui) porque o
// servidor roda em UTC: calcular a segunda-feira no servidor daria conflito
// com a semana que a pessoa vê na tela.

const LIMITE_SEMANAS = 26;

export default protegido(async function handler(req, res) {
  const sessao = await exigirLogin(req, res);
  if (!sessao) return;

  const semanas = String(req.query.semanas || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
    .slice(0, LIMITE_SEMANAS);

  if (!semanas.length) {
    return erro(res, 400, "Informe ao menos uma semana válida (AAAA-MM-DD).");
  }

  // admin enxerga a equipe inteira; colaborador enxerga apenas a si mesmo
  const logins =
    sessao.papel === "admin" ? await listaUsuarios() : [sessao.login];

  const usuarios = [];
  for (const login of logins) {
    const u = await buscarUsuario(login);
    if (!u) continue;

    const chaves = [
      `tasks:${login}`,
      `ciclos:${login}`,
      ...semanas.map((s) => `state:${login}:${s}`),
    ];
    const valores = await lerVarios(chaves);

    const estados = {};
    semanas.forEach((s, i) => {
      estados[s] = valores[i + 2] || { d: {}, w: {}, c: {}, l: {}, v: {} };
    });

    usuarios.push({
      login,
      nome: u.nome,
      papel: u.papel,
      tarefas: valores[0] || [],
      ciclos: valores[1] || {},
      estados,
    });
  }

  res.json({ semanas, usuarios });
});
