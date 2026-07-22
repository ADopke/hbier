// _lib.js — utilidades compartilhadas pelas funções serverless
// Arquivos iniciados com "_" não viram rotas na Vercel.

import crypto from "node:crypto";

/* ------------------------------------------------------------------ */
/*  Banco de dados — Upstash Redis via API REST (sem dependências)     */
/* ------------------------------------------------------------------ */

const REDIS_URL =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export function bancoConfigurado() {
  return Boolean(REDIS_URL && REDIS_TOKEN);
}

async function redis(comando) {
  if (!bancoConfigurado()) {
    throw new Error(
      "Banco não configurado. Defina KV_REST_API_URL e KV_REST_API_TOKEN nas variáveis de ambiente."
    );
  }
  const resp = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(comando),
  });
  if (!resp.ok) {
    const texto = await resp.text();
    throw new Error(`Erro no banco (${resp.status}): ${texto}`);
  }
  const dados = await resp.json();
  return dados.result;
}

const PREFIXO = "hbier";

export async function ler(chave) {
  const valor = await redis(["GET", `${PREFIXO}:${chave}`]);
  if (valor === null || valor === undefined) return null;
  try {
    return typeof valor === "string" ? JSON.parse(valor) : valor;
  } catch {
    return null;
  }
}

export async function gravar(chave, valor) {
  return redis(["SET", `${PREFIXO}:${chave}`, JSON.stringify(valor)]);
}

export async function apagar(chave) {
  return redis(["DEL", `${PREFIXO}:${chave}`]);
}

/* ------------------------------------------------------------------ */
/*  Senhas — PBKDF2 (nativo do Node, sem bibliotecas externas)          */
/* ------------------------------------------------------------------ */

const ITERACOES = 120000;

export function criarHashSenha(senha) {
  const sal = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(senha, sal, ITERACOES, 32, "sha256")
    .toString("hex");
  return { sal, hash };
}

export function conferirSenha(senha, sal, hash) {
  const teste = crypto.pbkdf2Sync(senha, sal, ITERACOES, 32, "sha256");
  const guardado = Buffer.from(hash, "hex");
  if (teste.length !== guardado.length) return false;
  return crypto.timingSafeEqual(teste, guardado);
}

/* ------------------------------------------------------------------ */
/*  Sessão — cookie assinado com HMAC (não precisa guardar no banco)   */
/* ------------------------------------------------------------------ */

const SEGREDO = process.env.AUTH_SECRET || "";
const DURACAO_DIAS = 30;

function assinar(texto) {
  return crypto
    .createHmac("sha256", SEGREDO)
    .update(texto)
    .digest("base64url");
}

export function criarToken(usuario) {
  const dados = Buffer.from(
    JSON.stringify({
      u: usuario,
      exp: Date.now() + DURACAO_DIAS * 86400000,
    })
  ).toString("base64url");
  return `${dados}.${assinar(dados)}`;
}

export function lerToken(token) {
  if (!token || !SEGREDO) return null;
  const partes = token.split(".");
  if (partes.length !== 2) return null;
  const [dados, assinatura] = partes;
  const esperada = assinar(dados);
  if (
    assinatura.length !== esperada.length ||
    !crypto.timingSafeEqual(Buffer.from(assinatura), Buffer.from(esperada))
  ) {
    return null;
  }
  try {
    const conteudo = JSON.parse(Buffer.from(dados, "base64url").toString());
    if (!conteudo.exp || conteudo.exp < Date.now()) return null;
    return conteudo.u;
  } catch {
    return null;
  }
}

export function definirCookie(res, token) {
  const partes = [
    `hb_sess=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${DURACAO_DIAS * 86400}`,
  ];
  if (process.env.VERCEL) partes.push("Secure");
  res.setHeader("Set-Cookie", partes.join("; "));
}

export function limparCookie(res) {
  res.setHeader("Set-Cookie", "hb_sess=; Path=/; HttpOnly; Max-Age=0");
}

function lerCookies(req) {
  const bruto = req.headers.cookie || "";
  const mapa = {};
  bruto.split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > -1) mapa[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  });
  return mapa;
}

/* ------------------------------------------------------------------ */
/*  Usuários                                                           */
/* ------------------------------------------------------------------ */

export async function listaUsuarios() {
  return (await ler("userlist")) || [];
}

export async function buscarUsuario(login) {
  if (!login) return null;
  return ler(`user:${login.toLowerCase()}`);
}

/** Retorna o usuário logado a partir do cookie, ou null. */
export async function usuarioLogado(req) {
  const login = lerToken(lerCookies(req).hb_sess);
  if (!login) return null;
  const usuario = await buscarUsuario(login);
  if (!usuario) return null;
  const { sal, hash, ...publico } = usuario;
  return publico;
}

/** Exige sessão válida; responde 401 e devolve null se não houver. */
export async function exigirLogin(req, res) {
  const usuario = await usuarioLogado(req);
  if (!usuario) {
    res.status(401).json({ erro: "Sessão expirada. Entre novamente." });
    return null;
  }
  return usuario;
}

/* ------------------------------------------------------------------ */
/*  Auxiliares de resposta                                             */
/* ------------------------------------------------------------------ */

export function corpo(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export function erro(res, status, mensagem) {
  res.status(status).json({ erro: mensagem });
}

/** Envolve o handler para transformar exceções em JSON legível. */
export function protegido(handler) {
  return async (req, res) => {
    try {
      if (!SEGREDO) {
        return erro(
          res,
          500,
          "AUTH_SECRET não configurado nas variáveis de ambiente do projeto."
        );
      }
      await handler(req, res);
    } catch (e) {
      console.error(e);
      erro(res, 500, e.message || "Erro interno.");
    }
  };
}

export function novoId() {
  return crypto.randomBytes(6).toString("hex");
}
