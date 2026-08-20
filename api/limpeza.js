import { ler, gravar, exigirLogin, corpo, erro, protegido, novoId } from "./_lib.js";

// Setores e itens conforme Checklist_Limpeza_Setores_HBier.xlsx
// 11 setores, 77 itens no total
export const SETORES = {
  sala_malte:         { nome: "Sala de Malte",                 responsavel: "Matheus"   },
  deposito_chopeiras: { nome: "Depósito Chopeiras/Cilindros",  responsavel: "Jefferson" },
  deposito:           { nome: "Depósito",                      responsavel: "Jefferson" },
  sala_barris:        { nome: "Sala de Limpeza de Barris",     responsavel: "Alex"      },
  brassagem:          { nome: "Brassagem",                     responsavel: "Rhafael"   },
  adega:              { nome: "Adega",                         responsavel: "Pablo"     },
  envase:             { nome: "Envase",                        responsavel: "Leonardo"  },
  enfardamento:       { nome: "Enfardamento",                  responsavel: "Alex"      },
  sleeve:             { nome: "Sleeve",                        responsavel: "Bruno"     },
  camara_fria:        { nome: "Câmara Fria",                   responsavel: "Alex"      },
  container:          { nome: "Container",                     responsavel: "Alex"      },
};

// Itens por setor com frequência conforme planilha
export const ITENS_POR_SETOR = {
  sala_malte: [
    { id:"piso",        nome:"Piso",              freq:"semanal"    },
    { id:"paredes",     nome:"Paredes",            freq:"mensal"     },
    { id:"pia",         nome:"Pia",                freq:"semanal"    },
    { id:"grades_piso", nome:"Grades do piso",     freq:"quinzenal"  },
    { id:"ralo",        nome:"Ralo",               freq:"quinzenal"  },
    { id:"maq_funil",   nome:"Máquina (Funil)",    freq:"a_cada_uso" },
    { id:"maq_carcaca", nome:"Máquina (Carcaça)",  freq:"a_cada_uso" },
  ],
  deposito_chopeiras: [
    { id:"piso",     nome:"Piso",      freq:"quinzenal" },
    { id:"paredes",  nome:"Paredes",   freq:"mensal"    },
    { id:"bancadas", nome:"Bancadas",  freq:"quinzenal" },
  ],
  deposito: [
    { id:"piso",     nome:"Piso",      freq:"quinzenal" },
    { id:"paredes",  nome:"Paredes",   freq:"mensal"    },
    { id:"mesas",    nome:"Mesas",     freq:"quinzenal" },
    { id:"armarios", nome:"Armários",  freq:"quinzenal" },
  ],
  sala_barris: [
    { id:"piso",          nome:"Piso",                          freq:"semanal"    },
    { id:"paredes",       nome:"Paredes",                       freq:"quinzenal"  },
    { id:"teto",          nome:"Teto",                          freq:"anual"      },
    { id:"grades_piso",   nome:"Grades do piso",                freq:"quinzenal"  },
    { id:"ralo",          nome:"Ralo",                          freq:"quinzenal"  },
    { id:"maq_soda",      nome:"Máquina (Tanque Soda)",         freq:"a_cada_uso" },
    { id:"maq_perac",     nome:"Máquina (Tanque Peracético)",   freq:"a_cada_uso" },
    { id:"maq_bocal",     nome:"Máquina (Bocal de acoplamento)",freq:"a_cada_uso" },
    { id:"maq_carcaca",   nome:"Máquina (Carcaça)",             freq:"semanal"    },
  ],
  brassagem: [
    { id:"piso",        nome:"Piso",                     freq:"semanal"    },
    { id:"paredes",     nome:"Paredes",                   freq:"mensal"     },
    { id:"pia",         nome:"Pia",                       freq:"quinzenal"  },
    { id:"geladeira",   nome:"Geladeira (Interno/Externo)",freq:"quinzenal" },
    { id:"grades_piso", nome:"Grades do piso",            freq:"quinzenal"  },
    { id:"ralo",        nome:"Ralo",                      freq:"semanal"    },
    { id:"maquinas",    nome:"Máquinas",                  freq:"a_cada_uso" },
    { id:"tubulacoes",  nome:"Tubulações externas",       freq:"quinzenal"  },
    { id:"bancada",     nome:"Bancada",                   freq:"quinzenal"  },
  ],
  adega: [
    { id:"piso",        nome:"Piso",                   freq:"semanal"    },
    { id:"paredes",     nome:"Paredes",                 freq:"mensal"     },
    { id:"grades_piso", nome:"Grades do piso",          freq:"quinzenal"  },
    { id:"ralo",        nome:"Ralo",                    freq:"quinzenal"  },
    { id:"tanques",     nome:"Tanques",                 freq:"a_cada_uso" },
    { id:"saca_amostra",nome:"Saca amostra / Escotilha",freq:"a_cada_uso" },
    { id:"calota",      nome:"Calota dos tanques",      freq:"anual"      },
    { id:"tubulacoes",  nome:"Tubulações externas",     freq:"quinzenal"  },
  ],
  envase: [
    { id:"piso",          nome:"Piso",                  freq:"semanal"    },
    { id:"paredes",       nome:"Paredes",                freq:"mensal"     },
    { id:"grades_piso",   nome:"Grades do piso",         freq:"quinzenal"  },
    { id:"ralo",          nome:"Ralo",                   freq:"quinzenal"  },
    { id:"maq_bicos",     nome:"Máquina (Bicos)",        freq:"a_cada_uso" },
    { id:"maq_assoalho",  nome:"Máquina (Assoalho)",    freq:"a_cada_uso" },
    { id:"maq_cip",       nome:"Máquina (CIP)",          freq:"a_cada_uso" },
    { id:"tubulacoes",    nome:"Tubulações externas",    freq:"quinzenal"  },
    { id:"bancada",       nome:"Bancada de Apoio",       freq:"semanal"    },
    { id:"forno_vapor",   nome:"Forno Vapor",            freq:"quinzenal"  },
    { id:"mesa_acum",     nome:"Mesa Acumuladora",       freq:"a_cada_uso" },
  ],
  enfardamento: [
    { id:"piso",       nome:"Piso",                     freq:"semanal"    },
    { id:"paredes",    nome:"Paredes",                   freq:"mensal"     },
    { id:"grades_piso",nome:"Grades do piso",            freq:"quinzenal"  },
    { id:"ralo",       nome:"Ralo",                      freq:"quinzenal"  },
    { id:"maq_esteira",nome:"Máquinas (Esteira)",        freq:"a_cada_uso" },
    { id:"maq_cabine", nome:"Máquinas (Cabine do Forno)",freq:"a_cada_uso" },
    { id:"maq_mesa",   nome:"Máquina (Mesa Acumuladora)",freq:"a_cada_uso" },
  ],
  sleeve: [
    { id:"piso",         nome:"Piso",              freq:"semanal"    },
    { id:"paredes",      nome:"Paredes",            freq:"mensal"     },
    { id:"grades_piso",  nome:"Grades do piso",     freq:"quinzenal"  },
    { id:"ralo",         nome:"Ralo",               freq:"quinzenal"  },
    { id:"maq_esteira",  nome:"Máquina (Esteira)",  freq:"a_cada_uso" },
    { id:"maq_cabine",   nome:"Máquina (Cabine)",   freq:"a_cada_uso" },
    { id:"maq_sensores", nome:"Máquina (Sensores)", freq:"a_cada_uso" },
    { id:"maq_torpedo",  nome:"Máquina (Torpedo)",  freq:"a_cada_uso" },
    { id:"maq_facas",    nome:"Máquina (Facas)",    freq:"a_cada_uso" },
    { id:"bancada",      nome:"Bancada",            freq:"semanal"    },
  ],
  camara_fria: [
    { id:"piso",   nome:"Piso",    freq:"mensal" },
    { id:"paredes",nome:"Paredes", freq:"mensal" },
    { id:"teto",   nome:"Teto",    freq:"mensal" },
    { id:"porta",  nome:"Porta",   freq:"mensal" },
    { id:"rampa",  nome:"Rampa",   freq:"mensal" },
  ],
  container: [
    { id:"piso",   nome:"Piso",    freq:"mensal" },
    { id:"paredes",nome:"Paredes", freq:"mensal" },
    { id:"teto",   nome:"Teto",    freq:"mensal" },
    { id:"porta",  nome:"Porta",   freq:"mensal" },
  ],
};

// Limite em dias por frequência para calcular status
export const LIMITE_DIAS = {
  semanal:    7,
  quinzenal:  15,
  mensal:     30,
  anual:      365,
  a_cada_uso: 3,   // alerta se passou 3 dias sem registrar
  eventual:   30,
};

function chaveSetor(setor) { return `limpeza:${setor}`; }

export default protegido(async function handler(req, res) {
  const sessao = await exigirLogin(req, res);
  if (!sessao) return;

  /* ---------- GET: resumo geral ---------- */
  if (req.method === "GET" && req.query.resumo === "1") {
    const resultado = {};
    for (const setor of Object.keys(SETORES)) {
      const registros = (await ler(chaveSetor(setor))) || [];
      const ultimoPorItem = {};
      registros.forEach((r) => {
        if (!ultimoPorItem[r.item] || r.em > ultimoPorItem[r.item].em)
          ultimoPorItem[r.item] = r;
      });
      resultado[setor] = ultimoPorItem;
    }
    return res.json({ ok: true, resumo: resultado, setores: SETORES, itensPorSetor: ITENS_POR_SETOR, limiteDias: LIMITE_DIAS });
  }

  /* ---------- GET: registros de um setor ---------- */
  if (req.method === "GET") {
    const setor = (req.query.setor || "").trim();
    if (!SETORES[setor]) return erro(res, 400, "Setor inválido.");
    const registros = (await ler(chaveSetor(setor))) || [];
    registros.sort((a, b) => (b.em > a.em ? 1 : -1));
    return res.json({ ok: true, setor, registros, itens: ITENS_POR_SETOR[setor] || [], limiteDias: LIMITE_DIAS });
  }

  /* ---------- POST ---------- */
  const dados = corpo(req);

  /* -- registrar -- */
  if (dados.acao === "registrar") {
    const setor    = (dados.setor || "").trim();
    const item     = (dados.item  || "").trim();
    const freq     = (dados.periodicidade || "eventual").trim();
    const obs      = (dados.obs   || "").trim();
    const feitoPor = (dados.feitoPor || sessao.login).trim();

    if (!SETORES[setor]) return erro(res, 400, "Setor inválido.");
    if (!item)           return erro(res, 400, "Item obrigatório.");

    const registros = (await ler(chaveSetor(setor))) || [];
    const novo = {
      id: novoId(),
      setor, item,
      periodicidade: freq,
      obs,
      feitoPor,
      nomeFeitoPor: sessao.nome || sessao.login,
      em: new Date().toISOString(),
    };
    registros.push(novo);
    if (registros.length > 300) registros.splice(0, registros.length - 300);
    await gravar(chaveSetor(setor), registros);
    return res.json({ ok: true, registro: novo });
  }

  /* -- remover -- */
  if (dados.acao === "remover") {
    const setor = (dados.setor || "").trim();
    const id    = (dados.id    || "").trim();
    if (!SETORES[setor]) return erro(res, 400, "Setor inválido.");
    if (!["admin","gestor"].includes(sessao.papel))
      return erro(res, 403, "Apenas admin ou gestor podem remover.");
    const registros = (await ler(chaveSetor(setor))) || [];
    await gravar(chaveSetor(setor), registros.filter((r) => r.id !== id));
    return res.json({ ok: true });
  }

  /* -- config_get: retornar configuração editável dos setores -- */
  if (dados.acao === "config_get") {
    if (!["admin","gestor"].includes(sessao.papel))
      return erro(res, 403, "Sem permissão.");
    const cfg = (await ler("limp:config")) || {};
    return res.json({ ok: true, config: cfg });
  }

  /* -- config_set: salvar responsável ou frequência de um item -- */
  if (dados.acao === "config_set") {
    if (!["admin","gestor"].includes(sessao.papel))
      return erro(res, 403, "Apenas admin ou gestor podem alterar configurações.");
    // dados.config = { setor: { responsavel, itens: { itemId: { freq } } } }
    const configAtual = (await ler("limp:config")) || {};
    const novaCfg = dados.config || {};
    // Merge: sobrescrever só o que veio
    for (const setorId of Object.keys(novaCfg)) {
      if (!configAtual[setorId]) configAtual[setorId] = {};
      if (novaCfg[setorId].responsavel !== undefined)
        configAtual[setorId].responsavel = novaCfg[setorId].responsavel;
      if (novaCfg[setorId].itens) {
        if (!configAtual[setorId].itens) configAtual[setorId].itens = {};
        for (const itemId of Object.keys(novaCfg[setorId].itens)) {
          if (!configAtual[setorId].itens[itemId]) configAtual[setorId].itens[itemId] = {};
          Object.assign(configAtual[setorId].itens[itemId], novaCfg[setorId].itens[itemId]);
        }
      }
    }
    await gravar("limp:config", configAtual);
    return res.json({ ok: true, config: configAtual });
  }

  return erro(res, 400, "Ação desconhecida.");
});
