// api/avisos.js — notificações no celular (Web Push) em horários marcados (v3.16.0)
// GET  /api/avisos?vapid=1                 → chave pública para o aparelho se inscrever
// POST /api/avisos {acao:"inscrever", sub} → guarda a inscrição deste aparelho (usuário logado)
// POST /api/avisos {acao:"cancelar", endpoint}
// POST /api/avisos {acao:"teste"}          → manda um aviso de teste para os aparelhos do usuário
// GET  /api/avisos?cfg=1                   → admin/gestor: configuração + quem tem aparelho inscrito
// POST /api/avisos {acao:"cfg", cfg}       → admin/gestor: grava a configuração
// GET  /api/avisos?h=HH (cron da Vercel, 1x/dia por hora) → envia os avisos marcados para aquela hora
import webpush from "web-push";
import { ler, gravar, usuarioLogado, corpo, erro, protegido, bancoConfigurado } from "./_lib.js";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const CFG_PADRAO = {
  dia:     { ativo: true,  hora: 6, dias: [1, 2, 3, 4, 5, 6], para: [] },
  semana:  { ativo: true,  hora: 7, dias: [1], para: [] },
  alertas: { ativo: false, hora: 8, dias: [1, 2, 3, 4, 5, 6], para: [] },
};

async function vapid() {
  let k = await ler("push:vapid");
  if (!k || !k.publicKey) { k = webpush.generateVAPIDKeys(); await gravar("push:vapid", k); }
  webpush.setVapidDetails("https://atividadesproducaohbier.vercel.app", k.publicKey, k.privateKey);
  return k;
}
function agoraSP() {
  const d = new Date(Date.now() - 3 * 3600000);              // São Paulo (UTC−3, sem horário de verão)
  return { iso: d.toISOString().slice(0, 10), hora: d.getUTCHours(), dow: d.getUTCDay() };
}
function segundaISO(iso) {
  const d = new Date(iso + "T12:00:00Z"); const dow = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - ((dow + 6) % 7)); return d.toISOString().slice(0, 10);
}
async function lerCfg() {
  const c = (await ler("avisos:cfg")) || {};
  const out = {};
  Object.keys(CFG_PADRAO).forEach((k) => { out[k] = { ...CFG_PADRAO[k], ...(c[k] || {}) }; });
  return out;
}
async function enviar(logins, payload) {
  const subs = (await ler("push:subs")) || {};
  let enviados = 0, mudou = false;
  for (const login of logins) {
    const lista = subs[login] || [];
    const vivos = [];
    for (const s of lista) {
      try { await webpush.sendNotification(s.sub, JSON.stringify(payload), { TTL: 6 * 3600 }); enviados++; vivos.push(s); }
      catch (e) { if (e.statusCode === 404 || e.statusCode === 410) mudou = true; else vivos.push(s); }
    }
    if (vivos.length !== lista.length) { subs[login] = vivos; mudou = true; }
  }
  if (mudou) await gravar("push:subs", subs);
  return enviados;
}
function destinatarios(av, subs) {
  if (av.para && av.para.length) return av.para;
  return Object.keys(subs).filter((l) => (subs[l] || []).some((s) => ["admin", "gestor"].includes(s.papel)));
}
async function textoDia(iso, dow) {
  const itens = ((await ler(`prog:${segundaISO(iso)}`)) || [])
    .filter((it) => (it.dataISO ? it.dataISO === iso : it.dia === DIAS[dow]));
  const b = itens.filter((i) => i.tipo === "brassagem").length;
  const e = itens.filter((i) => i.tipo === "envase").length;
  const r = itens.filter((i) => i.tipo === "barril").length;
  const partes = [b && `${b} brassagem${b > 1 ? "ns" : ""}`, e && `${e} envase${e > 1 ? "s" : ""}`, r && `${r} barril${r > 1 ? "is" : ""}`].filter(Boolean);
  return partes.length ? partes.join(", ") : "nada programado";
}

export default protegido(async function (req, res) {
  if (!bancoConfigurado()) return erro(res, 500, "Banco não configurado.");
  const ehCron = !!req.headers["x-vercel-cron"] ||
    (process.env.CRON_SECRET && req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`);

  /* ── cron: uma entrada por hora no vercel.json, cada uma 1x por dia ── */
  if (req.method === "GET" && ehCron) {
    await vapid();
    const t = agoraSP();
    const horaCron = req.query.h != null && req.query.h !== "" ? (Number(req.query.h) + 21) % 24 : t.hora; // h = hora UTC
    const cfg = await lerCfg(), subs = (await ler("push:subs")) || {};
    const feitos = [];
    for (const tipo of Object.keys(cfg)) {
      const av = cfg[tipo];
      if (!av.ativo || Number(av.hora) !== horaCron || !(av.dias || []).includes(t.dow)) continue;
      const marca = `avisos:enviado:${tipo}:${t.iso}`;
      if (await ler(marca)) continue;
      let payload;
      if (tipo === "dia") payload = { title: `📲 Programação de ${DIAS[t.dow].toLowerCase()} ${t.iso.slice(8, 10)}/${t.iso.slice(5, 7)}`,
        body: `${await textoDia(t.iso, t.dow)} — toque para enviar no WhatsApp`, url: `/?wa=dia&data=${t.iso}`, tag: "wa-dia" };
      if (tipo === "semana") payload = { title: "📲 Programação da semana", body: "Toque para enviar o resumo da semana no WhatsApp", url: `/?wa=semana&data=${t.iso}`, tag: "wa-semana" };
      if (tipo === "alertas") payload = { title: "🔔 Alertas dos tanques", body: "Toque para ver os alertas e mandar as cobranças no WhatsApp", url: "/?wa=alertas", tag: "wa-alertas" };
      const n = await enviar(destinatarios(av, subs), payload);
      await gravar(marca, { em: new Date().toISOString(), n });
      feitos.push({ tipo, n });
    }
    return res.json({ ok: true, hora: horaCron, feitos });
  }

  const u = await usuarioLogado(req);
  if (req.method === "GET" && req.query.vapid) {
    const k = await vapid();
    return res.json({ ok: true, chave: k.publicKey });
  }
  if (!u) return erro(res, 401, "Sessão expirada. Entre novamente.");
  const gestor = ["admin", "gestor"].includes(u.papel);

  if (req.method === "GET" && req.query.cfg) {
    if (!gestor) return erro(res, 403, "Apenas admin ou gestor.");
    const subs = (await ler("push:subs")) || {};
    const inscritos = Object.keys(subs).filter((l) => (subs[l] || []).length)
      .map((l) => ({ login: l, aparelhos: subs[l].length, papel: subs[l][0].papel || "" }));
    return res.json({ ok: true, cfg: await lerCfg(), inscritos });
  }
  if (req.method !== "POST") return erro(res, 405, "Método não permitido.");
  const d = corpo(req);

  if (d.acao === "inscrever") {
    if (!d.sub || !d.sub.endpoint) return erro(res, 400, "Inscrição inválida.");
    const subs = (await ler("push:subs")) || {};
    const lista = (subs[u.login] || []).filter((s) => s.sub.endpoint !== d.sub.endpoint);
    lista.unshift({ sub: d.sub, papel: u.papel, em: new Date().toISOString(), aparelho: String(d.aparelho || "").slice(0, 80) });
    subs[u.login] = lista.slice(0, 5);
    await gravar("push:subs", subs);
    return res.json({ ok: true });
  }
  if (d.acao === "cancelar") {
    const subs = (await ler("push:subs")) || {};
    subs[u.login] = (subs[u.login] || []).filter((s) => s.sub.endpoint !== d.endpoint);
    await gravar("push:subs", subs);
    return res.json({ ok: true });
  }
  if (d.acao === "teste") {
    await vapid();
    const n = await enviar([u.login], { title: "✅ Avisos HBier funcionando", body: "Toque para abrir o resumo de hoje no WhatsApp", url: `/?wa=dia&data=${agoraSP().iso}`, tag: "wa-teste" });
    return res.json({ ok: true, enviados: n });
  }
  if (d.acao === "cfg") {
    if (!gestor) return erro(res, 403, "Apenas admin ou gestor.");
    const atual = await lerCfg(), novo = {};
    Object.keys(CFG_PADRAO).forEach((k) => {
      const c = (d.cfg || {})[k] || atual[k];
      novo[k] = { ativo: !!c.ativo, hora: Math.max(5, Math.min(22, Number(c.hora) || CFG_PADRAO[k].hora)),
        dias: (Array.isArray(c.dias) ? c.dias : []).map(Number).filter((x) => x >= 0 && x <= 6),
        para: (Array.isArray(c.para) ? c.para : []).map(String).slice(0, 30) };
    });
    await gravar("avisos:cfg", novo);
    return res.json({ ok: true, cfg: novo });
  }
  return erro(res, 400, "Ação inválida.");
});
