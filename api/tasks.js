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
        vinculo: (dados.vinculo || "").trim(),
        vinculoCampo: (dados.vinculoCampo || "").trim(),
        // 1.3.0 — leitura numérica, procedimento vinculado e criticidade
        medicao: Boolean(dados.medicao),
        unidade: (dados.unidade || "").trim(),
        paramCodigo: (dados.paramCodigo || "").trim(),
        pop: (dados.pop || "").trim(),
        critica: Boolean(dados.critica),
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
      vinculo: (dados.vinculo || "").trim(),
      vinculoCampo: (dados.vinculoCampo || "").trim(),
      medicao: Boolean(dados.medicao),
      unidade: (dados.unidade || "").trim(),
      paramCodigo: (dados.paramCodigo || "").trim(),
      pop: (dados.pop || "").trim(),
      critica: Boolean(dados.critica),
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

  /* ---------- importar em lote (da planilha) ---------- */
  if (dados.acao === "importar") {
    const alvo = (dados.usuario || sessao.login).toLowerCase();
    if (alvo !== sessao.login && sessao.papel !== "admin") {
      return erro(res, 403, "Sem permissão.");
    }
    if (!Array.isArray(dados.tarefas) || !dados.tarefas.length) {
      return erro(res, 400, "Nenhuma tarefa para importar.");
    }
    if (!(await buscarUsuario(alvo))) {
      return erro(res, 404, "Usuário não encontrado.");
    }

    const tarefas = (await ler(`tasks:${alvo}`)) || [];
    // evita cadastrar duas vezes a mesma tarefa se a importação for repetida
    const jaExistem = new Set(
      tarefas.map((t) => (t.nome || "").trim().toLowerCase())
    );

    let criadas = 0;
    const ignoradas = [];

    for (const nova of dados.tarefas.slice(0, 100)) {
      const problema = validarTarefa(nova);
      if (problema) {
        ignoradas.push(`${nova.nome || "(sem nome)"}: ${problema}`);
        continue;
      }
      const chave = nova.nome.trim().toLowerCase();
      if (jaExistem.has(chave)) {
        ignoradas.push(`${nova.nome}: já cadastrada`);
        continue;
      }
      tarefas.push({
        id: novoId(),
        nome: nova.nome.trim(),
        desc: (nova.desc || "").trim(),
        freq: nova.freq,
        dia: nova.dia || "",
        data: nova.data || "",
        lembrete: (nova.lembrete || "").trim(),
        vinculo: (nova.vinculo || "").trim(),
        vinculoCampo: (nova.vinculoCampo || "").trim(),
        // marca a procedência para a sincronização saber o que atualizar
        fonte: "planilha",
        codigoBase: (nova.codigoBase || "").trim(),
        origem:
          sessao.papel === "admin" && alvo !== sessao.login
            ? "admin"
            : "proprio",
        criadaPor: sessao.login,
      });
      jaExistem.add(chave);
      criadas++;
    }

    await gravar(`tasks:${alvo}`, tarefas);
    return res.json({ ok: true, criadas, ignoradas });
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
