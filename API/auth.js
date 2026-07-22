import {
  ler,
  gravar,
  criarHashSenha,
  conferirSenha,
  criarToken,
  definirCookie,
  limparCookie,
  buscarUsuario,
  listaUsuarios,
  usuarioLogado,
  exigirLogin,
  bancoConfigurado,
  corpo,
  erro,
  protegido,
  novoId,
} from "./_lib.js";
import { tarefasPadrao } from "./_seed.js";

export default protegido(async function handler(req, res) {
  /* ---------- GET: quem sou eu / precisa configurar? ---------- */
  if (req.method === "GET") {
    if (!bancoConfigurado()) {
      return res.json({ banco: false });
    }
    const usuarios = await listaUsuarios();
    const usuario = await usuarioLogado(req);
    return res.json({
      banco: true,
      instalado: usuarios.length > 0,
      usuario,
    });
  }

  if (req.method !== "POST") return erro(res, 405, "Método não permitido.");

  const { acao } = corpo(req);

  /* ---------- primeiro acesso: cria o administrador ---------- */
  if (acao === "instalar") {
    const usuarios = await listaUsuarios();
    if (usuarios.length > 0) {
      return erro(res, 409, "O sistema já foi configurado.");
    }
    const { login, nome, senha } = corpo(req);
    const erroValidacao = validar(login, senha, nome);
    if (erroValidacao) return erro(res, 400, erroValidacao);

    const chave = login.trim().toLowerCase();
    const { sal, hash } = criarHashSenha(senha);
    await gravar(`user:${chave}`, {
      login: chave,
      nome: nome.trim(),
      papel: "admin",
      sal,
      hash,
      criadoEm: new Date().toISOString(),
    });
    await gravar("userlist", [chave]);
    await gravar(`tasks:${chave}`, tarefasPadrao(novoId));

    definirCookie(res, criarToken(chave));
    return res.json({
      ok: true,
      usuario: { login: chave, nome: nome.trim(), papel: "admin" },
    });
  }

  /* ---------- login ---------- */
  if (acao === "entrar") {
    const { login, senha } = corpo(req);
    if (!login || !senha) return erro(res, 400, "Informe usuário e senha.");
    const usuario = await buscarUsuario(login.trim());
    const generico = "Usuário ou senha incorretos.";
    if (!usuario) return erro(res, 401, generico);
    if (!conferirSenha(senha, usuario.sal, usuario.hash)) {
      return erro(res, 401, generico);
    }
    definirCookie(res, criarToken(usuario.login));
    return res.json({
      ok: true,
      usuario: {
        login: usuario.login,
        nome: usuario.nome,
        papel: usuario.papel,
      },
    });
  }

  /* ---------- logout ---------- */
  if (acao === "sair") {
    limparCookie(res);
    return res.json({ ok: true });
  }

  /* ---------- trocar a própria senha ---------- */
  if (acao === "trocar-senha") {
    const sessao = await exigirLogin(req, res);
    if (!sessao) return;
    const { senhaAtual, senhaNova } = corpo(req);
    const usuario = await buscarUsuario(sessao.login);
    if (!conferirSenha(senhaAtual || "", usuario.sal, usuario.hash)) {
      return erro(res, 401, "Senha atual incorreta.");
    }
    if (!senhaNova || senhaNova.length < 6) {
      return erro(res, 400, "A nova senha precisa ter ao menos 6 caracteres.");
    }
    const { sal, hash } = criarHashSenha(senhaNova);
    await gravar(`user:${usuario.login}`, { ...usuario, sal, hash });
    return res.json({ ok: true });
  }

  return erro(res, 400, "Ação desconhecida.");
});

function validar(login, senha, nome) {
  if (!login || !/^[a-zA-Z0-9._-]{3,20}$/.test(login.trim())) {
    return "Usuário deve ter de 3 a 20 caracteres (letras, números, ponto, hífen).";
  }
  if (!nome || nome.trim().length < 2) return "Informe o nome da pessoa.";
  if (!senha || senha.length < 6) {
    return "A senha precisa ter ao menos 6 caracteres.";
  }
  return null;
}
