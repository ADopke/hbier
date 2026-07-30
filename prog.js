import {
  ler, gravar, exigirLogin, corpo, erro, protegido,
} from "./_lib.js";

// Programação de produção semanal.
//
// GET  /api/prog?semana=AAAA-MM-DD   → lê a programação da semana
// POST /api/prog                     → salva / edita / remove / lança resultado
//
// Estrutura de cada item:
//   Programação: { id, tipo, dia, obs, criadaPor, em, ...campos por tipo }
//   Resultado:   { ...prog, resultado: { ...campos por tipo } }
//
// Tipo "brassagem": estilo, tanque, og, volume
// Tipo "envase": produto, lote, tanqueOrigem, formato, qtd,
//                litrosInicio, litrosFim, sleevePerdidos, petPerdidos, tampasPerdidas

function chave(semana) { return `prog:${semana}`; }
function novoId() { return Math.random().toString(36).slice(2, 10); }

// colaborador pode lançar resultado mas não pode criar/editar/remover programação
function podeProgramar(papel) { return ["admin","gestor"].includes(papel); }

export default protegido(async function handler(req, res) {
  const sessao = await exigirLogin(req, res);
  if (!sessao) return;

  if (req.method === "GET") {
    const semana = (req.query.semana || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(semana))
      return erro(res, 400, "Semana inválida (AAAA-MM-DD).");
    const itens = (await ler(chave(semana))) || [];
    return res.json({ ok: true, semana, itens });
  }

  const dados = corpo(req);
  const semana = (dados.semana || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(semana))
    return erro(res, 400, "Semana inválida (AAAA-MM-DD).");

  const itens = (await ler(chave(semana))) || [];

  /* ---------- criar ---------- */
  if (dados.acao === "criar") {
    if (!podeProgramar(sessao.papel))
      return erro(res, 403, "Apenas admin ou gestor podem programar.");

    // LOG TEMPORÁRIO DE DEBUG
    console.log("[prog criar] dados.tipo recebido:", JSON.stringify(dados.tipo));
    console.log("[prog criar] body completo:", JSON.stringify(dados));

    const item = {
      id: novoId(),
      tipo: dados.tipo === "envase" ? "envase" : "brassagem",
      dia: (dados.dia || "").trim(),
      obs: (dados.obs || "").trim(),
      criadaPor: sessao.login,
      em: new Date().toISOString(),
    };

    if (item.tipo === "brassagem") {
      item.estilo = (dados.estilo || "").trim();
      item.tanque  = (dados.tanque  || "").trim();
    } else {
      item.produto      = (dados.produto      || "").trim();
      item.lote         = (dados.lote         || "").trim();
      item.tanqueOrigem = (dados.tanqueOrigem || "").trim();
      item.formato      = (dados.formato      || "").trim();
      item.qtd          = (dados.qtd          || "").trim();
    }

    itens.push(item);
    await gravar(chave(semana), itens);
    return res.json({ ok: true, itens });
  }

  /* ---------- editar ---------- */
  if (dados.acao === "editar") {
    if (!podeProgramar(sessao.papel))
      return erro(res, 403, "Apenas admin ou gestor podem editar.");

    const idx = itens.findIndex((x) => x.id === dados.id);
    if (idx < 0) return erro(res, 404, "Item não encontrado.");

    const it = itens[idx];
    it.dia = (dados.dia || "").trim();
    it.obs = (dados.obs || "").trim();

    if (it.tipo === "brassagem") {
      it.estilo = (dados.estilo || "").trim();
      it.tanque  = (dados.tanque  || "").trim();
    } else {
      it.produto      = (dados.produto      || "").trim();
      it.lote         = (dados.lote         || "").trim();
      it.tanqueOrigem = (dados.tanqueOrigem || "").trim();
      it.formato      = (dados.formato      || "").trim();
      it.qtd          = (dados.qtd          || "").trim();
    }

    await gravar(chave(semana), itens);
    return res.json({ ok: true, itens });
  }

  /* ---------- remover ---------- */
  if (dados.acao === "remover") {
    if (!podeProgramar(sessao.papel))
      return erro(res, 403, "Apenas admin ou gestor podem remover.");

    const filtrado = itens.filter((x) => x.id !== dados.id);
    await gravar(chave(semana), filtrado);
    return res.json({ ok: true, itens: filtrado });
  }

  /* ---------- lançar resultado ---------- */
  // Qualquer papel pode lançar — é o operador registrando o que aconteceu
  if (dados.acao === "resultado") {
    const idx = itens.findIndex((x) => x.id === dados.id);
    if (idx < 0) return erro(res, 404, "Item não encontrado.");

    const it = itens[idx];

    if (it.tipo === "brassagem") {
      it.resultado = {
        og:       (dados.og       || "").trim(),
        volume:   (dados.volume   || "").trim(),
        obsReal:  (dados.obsReal  || "").trim(),
        lancadoPor: sessao.login,
        em: new Date().toISOString(),
      };
    } else {
      // envase — cálculos de perdas e totais
      const litrosInicio   = parseFloat((dados.litrosInicio   || "0").replace(",",".")) || 0;
      const litrosFim      = parseFloat((dados.litrosFim      || "0").replace(",",".")) || 0;
      const qtdEnvasada    = parseFloat((dados.qtdEnvasada    || "0").replace(",",".")) || 0;
      const sleevePerd     = parseFloat((dados.sleevePerd     || "0").replace(",",".")) || 0;
      const petPerd        = parseFloat((dados.petPerd        || "0").replace(",",".")) || 0;
      const tampasPerd     = parseFloat((dados.tampasPerd     || "0").replace(",",".")) || 0;

      const litrosUsados   = litrosInicio - litrosFim;
      const sleeveTotal    = qtdEnvasada + sleevePerd;
      const petTotal       = qtdEnvasada + petPerd;
      const tampasTotal    = qtdEnvasada + tampasPerd;

      it.resultado = {
        litrosInicio,
        litrosFim,
        litrosUsados:  Math.round(litrosUsados * 10) / 10,
        tanqueFinalizado: dados.tanqueFinalizado === "sim",
        qtdEnvasada,
        sleevePerd,  sleeveTotal,
        petPerd,     petTotal,
        tampasPerd,  tampasTotal,
        obsReal: (dados.obsReal || "").trim(),
        lancadoPor: sessao.login,
        em: new Date().toISOString(),
      };
    }

    await gravar(chave(semana), itens);
    return res.json({ ok: true, item: itens[idx] });
  }

  return erro(res, 400, "Ação desconhecida.");
});
