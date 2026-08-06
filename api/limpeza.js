import { ler, gravar, exigirLogin, corpo, erro, protegido, novoId } from "./_lib.js";

// GET  /api/limpeza?setor=brassagem          → últimos 60 registros do setor
// GET  /api/limpeza?resumo=1                 → último registro de cada setor (para status rápido)
// POST /api/limpeza  {acao:"registrar", ...} → registra um item de limpeza
// POST /api/limpeza  {acao:"remover", id, setor} → remove um registro

const SETORES_VALIDOS = [
  "brassagem", "adega", "envase", "recebimento_barris", "recebimento_mp"
];
const ITENS_VALIDOS = ["piso", "parede", "teto", "equipamentos"];
const PERIODICIDADES = ["diaria", "semanal", "eventual"];

function chaveSetor(setor) { return `limpeza:${setor}`; }

export default protegido(async function handler(req, res) {
  const sessao = await exigirLogin(req, res);
  if (!sessao) return;

  /* ---------- GET: resumo de todos os setores ---------- */
  if (req.method === "GET" && req.query.resumo === "1") {
    const resultado = {};
    for (const setor of SETORES_VALIDOS) {
      const registros = (await ler(chaveSetor(setor))) || [];
      // último registro de cada setor (mais recente por item)
      const ultimoPorItem = {};
      registros.forEach((r) => {
        if (!ultimoPorItem[r.item] || r.em > ultimoPorItem[r.item].em) {
          ultimoPorItem[r.item] = r;
        }
      });
      resultado[setor] = ultimoPorItem;
    }
    return res.json({ ok: true, resumo: resultado });
  }

  /* ---------- GET: registros de um setor ---------- */
  if (req.method === "GET") {
    const setor = (req.query.setor || "").trim();
    if (!SETORES_VALIDOS.includes(setor))
      return erro(res, 400, "Setor inválido.");
    const registros = (await ler(chaveSetor(setor))) || [];
    // ordenar do mais recente para o mais antigo
    registros.sort((a, b) => (b.em > a.em ? 1 : -1));
    return res.json({ ok: true, setor, registros });
  }

  /* ---------- POST ---------- */
  const dados = corpo(req);

  /* -- registrar limpeza -- */
  if (dados.acao === "registrar") {
    const setor = (dados.setor || "").trim();
    const item  = (dados.item  || "").trim();
    const periodicidade = (dados.periodicidade || "eventual").trim();
    const obs   = (dados.obs   || "").trim();

    if (!SETORES_VALIDOS.includes(setor)) return erro(res, 400, "Setor inválido.");
    if (!ITENS_VALIDOS.includes(item))    return erro(res, 400, "Item inválido.");
    if (!PERIODICIDADES.includes(periodicidade)) return erro(res, 400, "Periodicidade inválida.");

    const registros = (await ler(chaveSetor(setor))) || [];
    const novo = {
      id:           novoId(),
      setor,
      item,
      periodicidade,
      obs,
      feitoPor:     sessao.login,
      nomeFeitoPor: sessao.nome || sessao.login,
      em:           new Date().toISOString(),
    };
    registros.push(novo);

    // manter só os últimos 200 por setor para não crescer indefinidamente
    if (registros.length > 200) registros.splice(0, registros.length - 200);

    await gravar(chaveSetor(setor), registros);
    return res.json({ ok: true, registro: novo });
  }

  /* -- remover registro -- */
  if (dados.acao === "remover") {
    const setor = (dados.setor || "").trim();
    const id    = (dados.id    || "").trim();
    if (!SETORES_VALIDOS.includes(setor)) return erro(res, 400, "Setor inválido.");
    if (!["admin", "gestor"].includes(sessao.papel))
      return erro(res, 403, "Apenas admin ou gestor podem remover.");
    const registros = (await ler(chaveSetor(setor))) || [];
    const filtrado  = registros.filter((r) => r.id !== id);
    await gravar(chaveSetor(setor), filtrado);
    return res.json({ ok: true });
  }

  return erro(res, 400, "Ação desconhecida.");
});
