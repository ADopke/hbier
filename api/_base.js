// _base.js — leitura da Base de Referência publicada no Google Sheets.
// Usado por api/base.js (aba Base do app) e por api/sync.js (sincronização
// das tarefas). Ficar num arquivo só garante que os dois leem igual.

import { ler, gravar } from "./_lib.js";

const CACHE_MIN = 5;

export function baseConfigurada() {
  return Boolean((process.env.BASE_CSV_URLS || "").trim());
}

/** Busca todas as abas publicadas, com cache de 5 minutos. */
export async function carregarTabelas(forcar = false) {
  const bruto = process.env.BASE_CSV_URLS || "";
  if (!bruto.trim()) return { configurado: false, tabelas: {} };

  const cache = await ler("base:cache");
  if (!forcar && cache && Date.now() - cache.em < CACHE_MIN * 60000) {
    return {
      configurado: true,
      tabelas: cache.tabelas,
      atualizadoEm: cache.em,
      doCache: true,
    };
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
    const erro = new Error(
      "Nenhuma aba pôde ser lida. " +
        (falhas.join(" · ") || "Confira se a planilha está publicada na web.")
    );
    erro.status = 502;
    throw erro;
  }

  const agora = Date.now();
  await gravar("base:cache", { em: agora, tabelas });
  return { configurado: true, tabelas, atualizadoEm: agora, falhas };
}

/* ------------------------------------------------------------------ */
/*  Leitor de CSV                                                      */
/* ------------------------------------------------------------------ */
export function lerCSV(texto) {
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

  // O cabeçalho é a primeira linha com 2 ou mais células preenchidas.
  // Assim o título e o subtítulo da planilha (uma célula só) são ignorados.
  const idxCab = linhas.findIndex(
    (l) => l.filter((v) => v !== "").length > 1
  );
  if (idxCab < 0) return { colunas: [], linhas: [] };

  const colunas = linhas[idxCab].map((c) => c.trim());

  // Toda linha com QUALQUER célula preenchida vira um registro.
  // (Antes exigia-se a primeira coluna preenchida, o que descartava em
  // silêncio linhas com o código em branco.)
  const dados = linhas
    .slice(idxCab + 1)
    .filter((l) => l.some((v) => v !== ""))
    .map((l) => {
      const linhaCompleta = l.slice(0, colunas.length);
      while (linhaCompleta.length < colunas.length) linhaCompleta.push("");
      return linhaCompleta;
    });

  return { colunas, linhas: dados };
}

/* ------------------------------------------------------------------ */
/*  Conversão de uma linha da aba "Tarefas Padrão" em tarefa           */
/* ------------------------------------------------------------------ */

const MAPA_FREQ = {
  diaria: "diaria",
  diária: "diaria",
  semanal: "semanal",
  quinzenal: "quinzenal",
  "conforme demanda": "demanda",
  demanda: "demanda",
  lembrete: "lembrete",
  "lembrete programado": "lembrete",
};

const MAPA_DIA = {
  segunda: "seg",
  "segunda-feira": "seg",
  terca: "ter",
  terça: "ter",
  "terça-feira": "ter",
  quarta: "qua",
  "quarta-feira": "qua",
  quinta: "qui",
  "quinta-feira": "qui",
  sexta: "sex",
  "sexta-feira": "sex",
  sabado: "sab",
  sábado: "sab",
};

export function normalizar(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Índice de uma coluna pelo nome, aceitando variações de acento/caixa. */
function col(colunas, ...nomes) {
  for (const n of nomes) {
    const i = colunas.findIndex((c) => normalizar(c) === normalizar(n));
    if (i > -1) return i;
  }
  return -1;
}

/**
 * Lê a aba de tarefas e devolve a lista normalizada.
 * A coluna "Código" é opcional: quando existe, ela é a chave de
 * sincronização (permite renomear a tarefa sem perder o vínculo).
 * Sem ela, a chave é o próprio nome.
 */
export function tarefasDaPlanilha(tabelas) {
  const tab =
    tabelas["Tarefas Padrão"] ||
    tabelas["Tarefas Padrao"] ||
    tabelas["Tarefas"] ||
    null;
  if (!tab || !tab.colunas.length) return null;

  const c = tab.colunas;
  const iCod = col(c, "Código", "Codigo");
  const iNome = col(c, "Tarefa", "Nome", "Nome da tarefa");
  const iDesc = col(c, "Descrição", "Descricao");
  const iFreq = col(c, "Frequência", "Frequencia");
  const iDia = col(c, "Dia fixo", "Dia");
  const iLemb = col(c, "Lembrete ao executar", "Lembrete");
  const iVinc = col(c, "Vincular à base", "Vinculo", "Vínculo");
  const iVCampo = col(c, "Coluna a exibir", "Campo do vínculo");
  const iData = col(c, "Mês do lembrete", "Mes do lembrete", "Data");
  const iPop = col(c, "Procedimento", "POP");
  const iMed = col(c, "Registrar leitura", "Medição", "Medicao");
  const iUni = col(c, "Unidade");
  const iParam = col(c, "Código do parâmetro", "Codigo do parametro", "Parâmetro");
  const iCrit = col(c, "Crítica", "Critica");

  if (iNome < 0 || iFreq < 0) return null;

  const saida = [];
  for (const l of tab.linhas) {
    const nome = (l[iNome] || "").trim();
    const freq = MAPA_FREQ[normalizar(l[iFreq])];
    if (!nome || !freq) continue;

    const codigo = iCod > -1 ? (l[iCod] || "").trim() : "";
    saida.push({
      chave: normalizar(codigo || nome),
      codigoBase: codigo,
      nome,
      desc: iDesc > -1 ? (l[iDesc] || "").trim() : "",
      freq,
      dia: iDia > -1 ? MAPA_DIA[normalizar(l[iDia])] || "" : "",
      data:
        iData > -1 && /^\d{4}-\d{2}$/.test((l[iData] || "").trim())
          ? l[iData].trim()
          : freq === "lembrete"
          ? "2027-02"
          : "",
      lembrete: iLemb > -1 ? (l[iLemb] || "").trim() : "",
      vinculo: iVinc > -1 ? (l[iVinc] || "").trim() : "",
      vinculoCampo: iVCampo > -1 ? (l[iVCampo] || "").trim() : "",
      pop: iPop > -1 ? (l[iPop] || "").trim() : "",
      medicao: iMed > -1 ? /^(sim|s|x|true|1)$/i.test((l[iMed] || "").trim()) : false,
      unidade: iUni > -1 ? (l[iUni] || "").trim() : "",
      paramCodigo: iParam > -1 ? (l[iParam] || "").trim() : "",
      critica: iCrit > -1 ? /^(sim|s|x|true|1)$/i.test((l[iCrit] || "").trim()) : false,
    });
  }
  return saida;
}
