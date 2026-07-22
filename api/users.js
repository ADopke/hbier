import {
  ler,
  gravar,
  apagar,
  criarHashSenha,
  buscarUsuario,
  listaUsuarios,
  exigirLogin,
  corpo,
  erro,
  protegido,
} from "./_lib.js";

export default protegido(async function handler(req, res) {
  const sessao = await exigirLogin(req, res);
  if (!sessao) return;

  /* ---------- listar ---------- */
  if (req.method === "GET") {
    const logins = await listaUsuarios();
    // colaborador enxerga apenas nome e login dos colegas (para nada mais)
    const lista = [];
    for (const login of logins) {
      const u = await buscarUsuario(login);
      if (u) lista.push({ login: u.login, nome: u.nome, papel: u.papel });
    }
    return res.json({ usuarios: lista });
  }

  if (req.method !== "POST") return erro(res, 405, "Método não permitido.");
  if (sessao.papel !== "admin") {
    return erro(res, 403, "Somente o administrador pode gerenciar usuários.");
  }

  const dados = corpo(req);

  /* ---------- criar ---------- */
  if (dados.acao === "criar") {
    const login = (dados.login || "").trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,20}$/.test(login)) {
      return erro(res, 400, "Usuário inválido (3 a 20 caracteres, sem espaços).");
    }
    if (!dados.nome || dados.nome.trim().length < 2) {
      return erro(res, 400, "Informe o nome da pessoa.");
    }
    if (!dados.senha || dados.senha.length < 6) {
      return erro(res, 400, "A senha precisa ter ao menos 6 caracteres.");
    }
    if (await buscarUsuario(login)) {
      return erro(res, 409, "Já existe um usuário com esse nome de acesso.");
    }

    const { sal, hash } = criarHashSenha(dados.senha);
    await gravar(`user:${login}`, {
      login,
      nome: dados.nome.trim(),
      papel: dados.papel === "admin" ? "admin" : "colaborador",
      sal,
      hash,
      criadoEm: new Date().toISOString(),
    });
    const logins = await listaUsuarios();
    if (!logins.includes(login)) {
      logins.push(login);
      await gravar("userlist", logins);
    }
    await gravar(`tasks:${login}`, []);
    return res.json({ ok: true });
  }

  /* ---------- redefinir senha ---------- */
  if (dados.acao === "senha") {
    const usuario = await buscarUsuario(dados.login);
    if (!usuario) return erro(res, 404, "Usuário não encontrado.");
    if (!dados.senha || dados.senha.length < 6) {
      return erro(res, 400, "A senha precisa ter ao menos 6 caracteres.");
    }
    const { sal, hash } = criarHashSenha(dados.senha);
    await gravar(`user:${usuario.login}`, { ...usuario, sal, hash });
    return res.json({ ok: true });
  }

  /* ---------- remover ---------- */
  if (dados.acao === "remover") {
    const login = (dados.login || "").trim().toLowerCase();
    if (login === sessao.login) {
      return erro(res, 400, "Você não pode remover o próprio acesso.");
    }
    const usuario = await buscarUsuario(login);
    if (!usuario) return erro(res, 404, "Usuário não encontrado.");

    await apagar(`user:${login}`);
    await apagar(`tasks:${login}`);
    await apagar(`ciclos:${login}`);
    const logins = (await listaUsuarios()).filter((l) => l !== login);
    await gravar("userlist", logins);
    return res.json({ ok: true });
  }

  return erro(res, 400, "Ação desconhecida.");
});
