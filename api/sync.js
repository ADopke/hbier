import {
  ler, gravar, listaUsuarios, buscarUsuario,
  exigirLogin, corpo, erro, protegido,
} from "./_lib.js";
import { carregarTabelas, tarefasDaPlanilha, normalizar } from "./_base.js";

// Sincroniza as tarefas vindas da planilha com o conteúdo atual dela.
//
// GET  /api/sync                       → prévia, sem gravar
// POST /api/sync                       → aplica na própria conta
// POST /api/sync {usuario:"__todos__"} → aplica na equipe (admin)
// POST /api/sync {adotar:true}         → vincula também tarefas antigas que
//                                        nunca receberam carimbo de origem
//
// Invariantes: o ID da tarefa nunca muda (é ele que amarra o histórico);
// linha nova é relatada, não criada; linha removida é relatada, não apagada.

const CAMPOS = [
  "nome", "desc", "freq", "dia", "data", "lembrete",
  "vinculo", "vinculoCampo",
  "medicao", "unidade", "paramCodigo", "pop", "critica",
];

/**
 * Dois índices — é isto que conserta o problema principal.
 *
 * Ao acrescentar a coluna "Código", a chave da planilha passa a ser o código.
 * Mas as tarefas já atribuídas foram carimbadas quando a chave era o NOME, e
 * as duas pontas deixavam de se encontrar: acrescentar a coluna desligava em
 * silêncio tudo o que já estava vinculado.
 *
 * Agora o pareamento tenta o código e, não achando, cai no nome — carimbando
 * o código na tarefa. A partir daí, renomear na planilha funciona.
 */
function indices(doSheet) {
  const porCodigo = new Map();
  const porNome = new Map();
  for (const s of doSheet) {
    if (s.codigoBase) porCodigo.set(normalizar(s.codigoBase), s);
    porNome.set(normalizar(s.nome), s);
  }
  return { porCodigo, porNome };
}

function acharPar(t, idx) {
  if (t.codigoBase) {
    const c = idx.porCodigo.get(normalizar(t.codigoBase));
    if (c) return { alvo: c, via: "codigo" };
  }
  const n = idx.porNome.get(normalizar(t.nome));
  if (n) return { alvo: n, via: "nome" };
  return null;
}

function veioDaPlanilha(t) {
  return t.fonte === "planilha" || t.origem === "admin";
}

function aplicar(tarefas, doSheet, adotar) {
  const idx = indices(doSheet);
  const usadas = new Set();
  const atualizadas = [], adotadas = [], semPar = [];
  let carimbadas = 0;

  for (const t of tarefas) {
    const par = acharPar(t, idx);

    // Tarefa antiga, sem carimbo, mas presente na planilha pelo nome.
    // Só é adotada quando o administrador pede explicitamente.
    if (!veioDaPlanilha(t)) {
      if (!(par && adotar)) {
        if (par) {
          semPar.push({ id: t.id, nome: t.nome, motivo: "sem vínculo — use Vincular tarefas antigas" });
        }
        continue;
      }
      adotadas.push(t.nome);
    }

    if (!par) {
      semPar.push({
        id: t.id,
        nome: t.nome,
        motivo: t.codigoBase
          ? "código " + t.codigoBase + " não existe mais na planilha"
          : "nome não encontrado na planilha",
      });
      continue;
    }

    const alvo = par.alvo;
    usadas.add(alvo.chave);

    const mudou = [];
    for (const campo of CAMPOS) {
      const novo = alvo[campo] === undefined ? "" : alvo[campo] || "";
      const atual = t[campo] === undefined ? "" : t[campo] || "";
      if (String(novo) !== String(atual)) {
        t[campo] = alvo[campo] || "";
        mudou.push(campo);
      }
    }

    // Pareando pelo nome, é aqui que a tarefa ganha o código e passa a
    // sobreviver a renomeações.
    const codigoNovo = alvo.codigoBase || "";
    if (t.fonte !== "planilha" || (t.codigoBase || "") !== codigoNovo) {
      t.fonte = "planilha";
      t.codigoBase = codigoNovo;
      carimbadas++;
    }

    if (mudou.length) atualizadas.push({ nome: alvo.nome, campos: mudou, via: par.via });
  }

  const novas = doSheet
    .filter((s) => !usadas.has(s.chave))
    .map((s) => ({
      chave: s.codigoBase || s.nome,
      rotulo: s.codigoBase ? s.codigoBase + " · " + s.nome : s.nome,
    }));

  return { atualizadas, adotadas, semPar, novas, carimbadas };
}

export default protegido(async function handler(req, res) {
  const sessao = await exigirLogin(req, res);
  if (!sessao) return;

  let tabelas;
  try {
    const r = await carregarTabelas(req.query.atualizar === "1");
    if (!r.configurado) return res.json({ configurado: false, resultados: [] });
    tabelas = r.tabelas;
  } catch (e) {
    return erro(res, e.status || 500, e.message);
  }

  const dados = corpo(req);
  const alvo = (dados.usuario || sessao.login).toLowerCase();
  const simular = req.method === "GET";
  const adotar = dados.adotar === true || req.query.adotar === "1";
  const abas = Object.keys(tabelas);
  const nomeAba = ["Tarefas Padrão", "Tarefas Padrao", "Tarefas"].find((n) => tabelas[n]);
  const colunas = nomeAba ? tabelas[nomeAba].colunas : [];
  const doSheet = tarefasDaPlanilha(tabelas);

  if (!doSheet) {
    return res.json({
      configurado: true, ok: false,
      diagnostico: {
        abasPublicadas: abas, abaTarefas: nomeAba || null, colunas,
        problema: !nomeAba
          ? 'A aba "Tarefas Padrão" não está na variável BASE_CSV_URLS. Publique-a em CSV e acrescente à variável — o nome antes do "=" precisa ser exatamente "Tarefas Padrão".'
          : 'A aba foi encontrada, mas faltam as colunas obrigatórias "Tarefa" e "Frequência".',
      },
      resultados: [],
    });
  }

  if (alvo !== sessao.login && sessao.papel !== "admin") {
    return erro(res, 403, "Sem permissão para sincronizar outra pessoa.");
  }
  if (adotar && sessao.papel !== "admin") {
    return erro(res, 403, "Apenas o administrador pode vincular tarefas antigas.");
  }

  /* ---------- religar uma tarefa a uma linha específica da planilha ----------
     Necessário quando a tarefa perdeu o vínculo E o nome já foi alterado na
     planilha: aí não sobra nenhuma chave em comum, e só uma escolha humana
     resolve. Amarra pelo código e já aplica o conteúdo da linha. */
  if (dados.acao === "vincular") {
    if (sessao.papel !== "admin") {
      return erro(res, 403, "Apenas o administrador pode religar tarefas.");
    }
    const linha = doSheet.find(
      (s) => normalizar(s.codigoBase || s.nome) === normalizar(dados.chave)
    );
    if (!linha) return erro(res, 404, "Linha não encontrada na planilha.");

    const tarefas = (await ler("tasks:" + alvo)) || [];
    const t = tarefas.find((x) => x.id === dados.tarefaId);
    if (!t) return erro(res, 404, "Tarefa não encontrada.");

    for (const campo of CAMPOS) t[campo] = linha[campo] || "";
    t.fonte = "planilha";
    t.codigoBase = linha.codigoBase || "";
    await gravar("tasks:" + alvo, tarefas);

    return res.json({
      configurado: true,
      ok: true,
      vinculou: { tarefa: t.nome, codigo: t.codigoBase },
    });
  }

  const logins = alvo === "__todos__"
    ? (sessao.papel === "admin" ? await listaUsuarios() : [sessao.login])
    : [alvo];

  const resultados = [];
  for (const login of logins) {
    const u = await buscarUsuario(login);
    if (!u) continue;
    const tarefas = (await ler("tasks:" + login)) || [];
    const r = aplicar(tarefas, doSheet, adotar);

    if (!simular && (r.atualizadas.length || r.carimbadas || r.adotadas.length)) {
      await gravar("tasks:" + login, tarefas);
    }

    resultados.push({
      login, nome: u.nome,
      atualizadas: r.atualizadas,
      adotadas: r.adotadas,
      semPar: r.semPar,
      novas: r.novas,
      total: tarefas.length,
      vinculadas: tarefas.filter((t) => t.fonte === "planilha").length,
    });
  }

  res.json({
    configurado: true, ok: true,
    simulacao: simular, adotou: adotar,
    linhasNaPlanilha: doSheet.length,
    diagnostico: {
      abasPublicadas: abas, abaTarefas: nomeAba, colunas,
      temCodigo: colunas.some((c) => normalizar(c) === "codigo"),
      comCodigo: doSheet.filter((s) => s.codigoBase).length,
    },
    resultados,
  });
});
