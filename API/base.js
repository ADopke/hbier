import { ler, gravar, exigirLogin, erro, protegido } from "./_lib.js";

// Lê a Base de Referência publicada no Google Sheets.
//
// Variável de ambiente esperada (Vercel → Settings → Environment Variables):
//   BASE_CSV_URLS = Tanques=https://...;Produtos=https://...;Insumos=https://...
//
// Cada link vem de: Google Sheets → Arquivo → Compartilhar → Publicar na Web
//                   → escolher a aba → formato CSV.

const CACHE_MIN = 5;

export default protegido(async function handler(req, res) {
  const sessao = await exigirLogin(req, res);
  if (!sessao) return;

  const bruto = process.env.BASE_CSV_URLS || "";
  if (!bruto.trim()) {
    return res.json({ configurado: false, tabelas: {} });
  }

  const forcar = req.query.atualizar === "1";
  const cache = await ler("base:cache");
  if (!forcar && cache && Date.now() - cache.em < CACHE_MIN * 60000) {
    return res.json({
      configurado: true,
      tabelas: cache.tabelas,
      atualizadoEm: cache.em,
      doCache: true,
    });
  }

  const tabelas = {};
  const falhas = [];

  for (const parte of bruto.split(";")) {
    const corte = parte.indexOf("=");
    if (corte < 1) continue;
    const nome = parte.slice(0, corte).trim();
    const url = parte.slice(corte + 1).trim();
    if (!nome || !/^https:\/\//.test(url)) continue;
    try {
      const resp = await fetch(url, { redirect: "follow" });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      tabelas[nome] = lerCSV(await resp.text());
    } catch (e) {
      falhas.push(`${nome}: ${e.message}`);
    }
  }

  if (!Object.keys(tabelas).length) {
    return erro(
      res,
      502,
      "Nenhuma aba pôde ser lida. " +
        (falhas.join(" · ") || "Confira se a planilha está publicada na web.")
    );
  }

  const agora = Date.now();
  await gravar("base:cache", { em: agora, tabelas });
  res.json({ configurado: true, tabelas, atualizadoEm: agora, falhas });
});

/* ------------------------------------------------------------------ */
/*  Leitor de CSV (trata aspas, vírgulas e quebras de linha internas)  */
/* ------------------------------------------------------------------ */
function lerCSV(texto) {
  const linhas = [];
  let campo = "";
  let linha = [];
  let aspas = false;

  const limpo = texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < limpo.length; i++) {
    const c = limpo[i];
    if (aspas) {
      if (c === '"') {
        if (limpo[i + 1] === '"') {
          campo += '"';
          i++;
        } else aspas = false;
      } else campo += c;
    } else if (c === '"') {
      aspas = true;
    } else if (c === ",") {
      linha.push(campo.trim());
      campo = "";
    } else if (c === "\n") {
      linha.push(campo.trim());
      linhas.push(linha);
      linha = [];
      campo = "";
    } else campo += c;
  }
  if (campo.length || linha.length) {
    linha.push(campo.trim());
    linhas.push(linha);
  }

  // descarta linhas do cabeçalho decorativo (título/subtítulo) e vazias
  const uteis = linhas.filter((l) => l.filter((v) => v !== "").length > 1);
  if (!uteis.length) return { colunas: [], linhas: [] };

  const colunas = uteis[0];
  const dados = uteis.slice(1).filter((l) => l[0] !== "");
  return { colunas, linhas: dados };
}
