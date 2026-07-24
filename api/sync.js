import {
  ler,
  gravar,
  listaUsuarios,
  buscarUsuario,
  exigirLogin,
  corpo,
  erro,
  protegido,
} from "./_lib.js";
import { carregarTabelas, tarefasDaPlanilha, normalizar } from "./_base.js";

// Sincroniza as tarefas que vieram da planilha com o conteúdo atual dela.
//
// GET  /api/sync            → prévia: o que mudaria, sem gravar nada
// POST /api/sync            → aplica na própria conta
// POST /api/sync {usuario}  → aplica em alguém (admin)
// POST /api/sync {usuario:"__todos__"} → aplica na equipe inteira (admin)
//
// Regras que valem sempre:
//  · o ID da tarefa NUNCA muda — é ele que amarra todo o histórico de
//    marcações e ciclos. Sincronizar atualiza o conteúdo, não recria.
//  · só toca em tarefas originadas da planilha. O que a pessoa criou por
//    conta própria fica intacto.
//  · linha nova na planilha é apenas relatada, não criada — quem decide
//    quem recebe a tarefa é o administrador, pela importação.
//  · linha removida da planilha também é só relatada, nunca apagada:
//    apagar levaria junto o histórico de quem já cumpriu a tarefa.

const CAMPOS = [
  "nome",
  "desc",
  "freq",
  "dia",
  "data",
  "lembrete",
  "vinculo",
  "vinculoCampo",
  "pop",
  "medicao",
  "unidade",
  "paramCodigo",
  "critica",
];

/** Chave de pareamento entre a linha da planilha e a tarefa já salva. */
function chaveDaTarefa(t) {
  return normalizar(t.codigoBase || t.nome);
}

/** Uma tarefa é candidata à sincronização se veio da planilha. */
function veioDaPlanilha(t) {
  // "planilha" é o carimbo novo; as importadas antes disso são reconhecidas
  // por terem sido definidas pelo gestor, e ganham o carimbo na primeira
  // sincronização.
  return t.fonte === "planilha" || t.origem === "admin";
}

function aplicar(tarefas, doSheet) {
  const porChave = new Map(doSheet.map((t) => [t.chave, t]));
  const usadas = new Set();

  const atualizadas = [];
  let carimbadas = 0;

  for (const t of tarefas) {
    if (!veioDaPlanilha(t)) continue;
    const alvo = porChave.get(chaveDaTarefa(t));
    if (!alvo) continue;

    usadas.add(alvo.chave);

    const mudou = [];
    for (const campo of CAMPOS) {
      const novo = alvo[campo] || "";
      const atual = t[campo] || "";
      if (novo !== atual) {
        t[campo] = novo;
        mudou.push(campo);
      }
    }

    // carimba a origem para as próximas sincronizações não dependerem do nome
    if (t.fonte !== "planilha" || t.codigoBase !== alvo.codigoBase) {
      t.fonte = "planilha";
      t.codigoBase = alvo.codigoBase || "";
      carimbadas++;
    }

    if (mudou.length) {
      atualizadas.push({ nome: alvo.nome, campos: mudou });
    }
  }

  // linhas da planilha que ninguém tem ainda
  const novas = doSheet
    .filter((t) => !usadas.has(t.chave))
    .map((t) => t.nome);

  // tarefas do app que não existem mais na planilha
  const orfas = tarefas
    .filter(
      (t) => t.fonte === "planilha" && !porChave.has(chaveDaTarefa(t))
    )
    .map((t) => t.nome);

  return { atualizadas, novas, orfas, carimbadas };
}

export default protegido(async function handler(req, res) {
  const sessao = await exigirLogin(req, res);
  if (!sessao) return;

  let tabelas;
  try {
    const r = await carregarTabelas(req.query.atualizar === "1");
    if (!r.configurado) {
      return res.json({ configurado: false, resultados: [] });
    }
    tabelas = r.tabelas;
  } catch (e) {
    return erro(res, e.status || 500, e.message);
  }

  const dados = corpo(req);
  const alvo = (dados.usuario || sessao.login).toLowerCase();
  const simular = req.method === "GET";

  // Diagnóstico: quando a sincronização não acha o que precisa, é essencial
  // dizer POR QUÊ. Antes isto virava um erro genérico que o app engolia em
  // silêncio, e não havia como descobrir o que estava errado.
  const abas = Object.keys(tabelas);
  const nomeAba = ["Tarefas Padrão", "Tarefas Padrao", "Tarefas"].find(
    (n) => tabelas[n]
  );
  const colunas = nomeAba ? tabelas[nomeAba].colunas : [];

  const doSheet = tarefasDaPlanilha(tabelas);

  if (!doSheet) {
    return res.json({
      configurado: true,
      ok: false,
      diagnostico: {
        abasPublicadas: abas,
        abaTarefas: nomeAba || null,
        colunas,
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

  const logins =
    alvo === "__todos__"
      ? sessao.papel === "admin"
        ? await listaUsuarios()
        : [sessao.login]
      : [alvo];

  const resultados = [];
  for (const login of logins) {
    const u = await buscarUsuario(login);
    if (!u) continue;

    const tarefas = (await ler(`tasks:${login}`)) || [];
    const r = aplicar(tarefas, doSheet);

    if (!simular && (r.atualizadas.length || r.carimbadas)) {
      await gravar(`tasks:${login}`, tarefas);
    }

    resultados.push({
      login,
      nome: u.nome,
      atualizadas: r.atualizadas,
      novas: r.novas,
      orfas: r.orfas,
      // quantas tarefas dessa pessoa vieram da planilha e acharam par
      pareadas: tarefas.filter(
        (t) =>
          (t.fonte === "planilha" || t.origem === "admin") &&
          doSheet.some((s) => s.chave === chaveDaTarefa(t))
      ).length,
      daPlanilha: tarefas.filter(
        (t) => t.fonte === "planilha" || t.origem === "admin"
      ).length,
    });
  }

  res.json({
    configurado: true,
    ok: true,
    simulacao: simular,
    linhasNaPlanilha: doSheet.length,
    diagnostico: {
      abasPublicadas: abas,
      abaTarefas: nomeAba,
      colunas,
      // sem a coluna Código, renomear a tarefa na planilha quebra o vínculo
      temCodigo: colunas.some(
        (c) => normalizar(c) === "codigo"
      ),
    },
    resultados,
  });
});
