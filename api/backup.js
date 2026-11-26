// api/backup.js — cópia de segurança do banco inteiro
// GET  /api/backup                (Vercel Cron, diário)          → cria backup do dia
// GET  /api/backup?lista=1        (admin)                        → lista backups
// GET  /api/backup?baixar=AAAA-MM-DD (admin)                     → baixa o backup em JSON
// POST /api/backup {acao:"agora"} (admin)                        → cria backup agora
// POST /api/backup {acao:"restaurar", data, confirmar:"RESTAURAR"} (admin)
//      → faz um backup do estado atual e depois regrava todas as chaves do backup escolhido
import zlib from "node:zlib";
import { usuarioLogado, corpo, erro, protegido, comandoBanco, PREFIXO_BANCO, bancoConfigurado } from "./_lib.js";

const P = PREFIXO_BANCO;
const K_LISTA = `${P}:backup:lista`;
const MANTER = 7;               // dias guardados
const PEDACO = 600 * 1024;      // tamanho de cada parte gravada (limite de requisição do banco)

function hojeSP() {
  return new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 10);
}
function ignorar(k) {
  return k.startsWith(`${P}:backup:`) || k.startsWith(`${P}:lock:`) || k.startsWith(`${P}:presenca:`) || k.startsWith("hbier-teste:");
}

async function lerTudo() {
  let cursor = "0"; const dados = {};
  do {
    const [prox, chaves] = await comandoBanco(["SCAN", cursor, "MATCH", `${P}:*`, "COUNT", "500"]);
    cursor = String(prox);
    const alvo = (chaves || []).filter((k) => !ignorar(k));
    for (let i = 0; i < alvo.length; i += 100) {
      const bloco = alvo.slice(i, i + 100);
      const vals = await comandoBanco(["MGET", ...bloco]);
      bloco.forEach((k, j) => { if (vals[j] !== null && vals[j] !== undefined) dados[k] = vals[j]; });
    }
  } while (cursor !== "0");
  return dados;
}

async function criarBackup(motivo, por) {
  const dados = await lerTudo();
  const json = JSON.stringify(dados);
  const gz = zlib.gzipSync(Buffer.from(json, "utf8")).toString("base64");
  const id = motivo === "diario" ? hojeSP() : `${hojeSP()}_${new Date().toISOString().slice(11, 19).replace(/:/g, "")}`;
  const partes = Math.ceil(gz.length / PEDACO) || 1;
  for (let i = 0; i < partes; i++) await comandoBanco(["SET", `${P}:backup:${id}:${i}`, gz.slice(i * PEDACO, (i + 1) * PEDACO)]);
  let lista = []; try { lista = JSON.parse((await comandoBanco(["GET", K_LISTA])) || "[]"); } catch (e) {}
  lista = lista.filter((b) => b.id !== id);
  lista.unshift({ id, em: new Date().toISOString(), motivo, por: por || "automático", chaves: Object.keys(dados).length, bytesJson: json.length, bytesGz: gz.length, partes });
  // remove os mais antigos (mantém MANTER diários + os 5 manuais/pré-restauração mais recentes)
  const diarios = lista.filter((b) => b.motivo === "diario"), outros = lista.filter((b) => b.motivo !== "diario");
  const ficar = new Set([...diarios.slice(0, MANTER), ...outros.slice(0, 5)].map((b) => b.id));
  for (const b of lista.filter((b) => !ficar.has(b.id)))
    for (let i = 0; i < (b.partes || 1); i++) await comandoBanco(["DEL", `${P}:backup:${b.id}:${i}`]);
  lista = lista.filter((b) => ficar.has(b.id));
  await comandoBanco(["SET", K_LISTA, JSON.stringify(lista)]);
  return lista[0];
}

async function lerBackup(id) {
  let lista = []; try { lista = JSON.parse((await comandoBanco(["GET", K_LISTA])) || "[]"); } catch (e) {}
  const b = lista.find((x) => x.id === id); if (!b) return null;
  let gz = "";
  for (let i = 0; i < (b.partes || 1); i++) gz += (await comandoBanco(["GET", `${P}:backup:${id}:${i}`])) || "";
  return JSON.parse(zlib.gunzipSync(Buffer.from(gz, "base64")).toString("utf8"));
}

export default protegido(async function (req, res) {
  if (!bancoConfigurado()) return erro(res, 500, "Banco não configurado.");
  const ehCron = !!req.headers["x-vercel-cron"] ||
    (process.env.CRON_SECRET && req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`);

  if (req.method === "GET" && ehCron && !req.query.lista && !req.query.baixar) {
    const b = await criarBackup("diario", "automático");
    return res.json({ ok: true, backup: b });
  }

  const u = await usuarioLogado(req);
  if (!u) return erro(res, 401, "Sessão expirada. Entre novamente.");
  if (u.papel !== "admin") return erro(res, 403, "Apenas admin.");

  if (req.method === "GET" && req.query.lista) {
    let lista = []; try { lista = JSON.parse((await comandoBanco(["GET", K_LISTA])) || "[]"); } catch (e) {}
    return res.json({ ok: true, backups: lista });
  }
  if (req.method === "GET" && req.query.baixar) {
    const dados = await lerBackup(String(req.query.baixar));
    if (!dados) return erro(res, 404, "Backup não encontrado.");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="hbier-backup-${req.query.baixar}.json"`);
    return res.send(JSON.stringify(dados));
  }
  if (req.method === "POST") {
    const d = corpo(req);
    if (d.acao === "agora") return res.json({ ok: true, backup: await criarBackup("manual", u.login) });
    if (d.acao === "restaurar") {
      if (d.confirmar !== "RESTAURAR") return erro(res, 400, "Digite RESTAURAR para confirmar.");
      const dados = await lerBackup(String(d.data || ""));
      if (!dados) return erro(res, 404, "Backup não encontrado.");
      const seguranca = await criarBackup("pre-restauracao", u.login);   // estado atual guardado antes
      const ks = Object.keys(dados).filter((k) => k.startsWith(`${P}:`) && !ignorar(k));
      for (const k of ks) await comandoBanco(["SET", k, dados[k]]);
      return res.json({ ok: true, restauradas: ks.length, backupAntes: seguranca.id });
    }
  }
  return erro(res, 405, "Método não permitido.");
});
