import {
  ler,
  gravar,
  buscarUsuario,
  listaUsuarios,
  exigirLogin,
  corpo,
  erro,
  protegido,
  novoId,
} from "./_lib.js";

const FREQS = ["diaria", "semanal", "quinzenal", "demanda", "lembrete"];

export default protegido(async function handler(req, res) {
  const sessao = await exigirLogin(req, res);
  if (!sessao) return;

  /* ---------- listar tarefas de um usuário ---------- */
  if (req.method === "GET") {
    const alvo = (req.query.usuario || sessao.login).toLowerCase();
    if (alvo !== sessao.login && sessao.papel !== "admin") {
      return erro(res, 403, "Sem permissão para ver tarefas de outra pessoa.");
    }
    const tarefas = (await ler(`tasks:${alvo}`)) || [];
    return res.json({ tarefas });
  }

  if (req.method !== "POST") return erro(res, 405, "Método não permitido.");

  const dados = corpo(req);

  /* ---------- criar ---------- */
  if (dados.acao === "criar") {
    const validacao = validarTarefa(dados);
    if (validacao) return erro(res, 400, validacao);

    // destinatários: admin pode atribuir a qualquer um ou a todos
    let destinos = [sessao.login];
    if (dados.para && dados.para !== sessao.login) {
      if (sessao.papel !== "admin") {
        return erro(res, 403, "Somente o administrador atribui tarefas a outros.");
      }
      destinos = dados.para === "__todos__"
        ? await listaUsuarios()
        : [dados.para.toLowerCase()];
    }

    for (const destino of destinos) {
      if (!(await buscarUsuario(destino))) continue;
      const tarefas = (await ler(`tasks:${destino}`)) || [];
      tarefas.push({
        id: novoId(),
        nome: dados.nome.trim(),
        desc: (dados.desc || "").trim(),
        freq: dados.freq,
        dia: dados.dia || "",
        data: dados.data || "",
        lembrete: (dados.lembrete || "").trim(),
        origem:
          sessao.papel === "admin" && destino !== sessao.login
            ? "admin"
            : "proprio",
        criadaPor: sessao.login,
      });
      await gravar(`tasks:${destino}`, tarefas);
    }
    return res.json({ ok: true, destinos: destinos.length });
  }

  /* ---------- editar ---------- */
  if (dados.acao === "editar") {
    const alvo = (dados.usuario || sessao.login).toLowerCase();
    if (alvo !== sessao.login && sessao.papel !== "admin") {
      return erro(res, 403, "Sem permissão.");
    }
    const validacao = validarTarefa(dados);
    if (validacao) return erro(res, 400, validacao);

    const tarefas = (await ler(`tasks:${alvo}`)) || [];
    const i = tarefas.findIndex((t) => t.id === dados.id);
    if (i < 0) return erro(res, 404, "Tarefa não encontrada.");
    if (tarefas[i].origem === "admin" && sessao.papel !== "admin") {
      return erro(res, 403, "Tarefa definida pelo administrador.");
    }
    tarefas[i] = {
      ...tarefas[i],
      nome: dados.nome.trim(),
      desc: (dados.desc || "").trim(),
      freq: dados.freq,
      dia: dados.dia || "",
      data: dados.data || "",
      lembrete: (dados.lembrete || "").trim(),
    };
    await gravar(`tasks:${alvo}`, tarefas);
    return res.json({ ok: true });
  }

  /* ---------- excluir ---------- */
  if (dados.acao === "excluir") {
    const alvo = (dados.usuario || sessao.login).toLowerCase();
    if (alvo !== sessao.login && sessao.papel !== "admin") {
      return erro(res, 403, "Sem permissão.");
    }
    const tarefas = (await ler(`tasks:${alvo}`)) || [];
    const alvoTarefa = tarefas.find((t) => t.id === dados.id);
    if (!alvoTarefa) return erro(res, 404, "Tarefa não encontrada.");
    if (alvoTarefa.origem === "admin" && sessao.papel !== "admin") {
      return erro(
        res,
        403,
        "Esta tarefa foi definida pelo administrador e não pode ser excluída."
      );
    }
    await gravar(
      `tasks:${alvo}`,
      tarefas.filter((t) => t.id !== dados.id)
    );
    return res.json({ ok: true });
  }

  return erro(res, 400, "Ação desconhecida.");
});

function validarTarefa(d) {
  if (!d.nome || d.nome.trim().length < 2) return "Informe o nome da tarefa.";
  if (!FREQS.includes(d.freq)) return "Frequência inválida.";
  if (d.freq === "lembrete" && !/^\d{4}-\d{2}$/.test(d.data || "")) {
    return "Informe o mês do lembrete (ex.: 2027-02).";
  }
  return null;
}
