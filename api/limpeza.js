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
  veiculos:           { nome: "Veículos",                      responsavel: "Lampiao"   },
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
    { id:"piso",          nome:"Piso",                      freq:"semanal"    },
    { id:"paredes",       nome:"Paredes",                    freq:"mensal"     },
    { id:"pia",           nome:"Pia",                        freq:"quinzenal"  },
    { id:"geladeira",     nome:"Geladeira (Interno/Externo)",freq:"quinzenal"  },
    { id:"grades_piso",   nome:"Grades do piso",             freq:"quinzenal"  },
    { id:"ralo",          nome:"Ralo",                       freq:"semanal"    },
    { id:"maquinas",      nome:"Máquinas",                   freq:"a_cada_uso" },
    { id:"tubulacoes",    nome:"Tubulações externas",        freq:"quinzenal"  },
    { id:"bancada",       nome:"Bancada",                    freq:"quinzenal"  },
    { id:"tq_agua_quente",nome:"Tanque de Água Quente",      freq:"quinzenal"  },
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
  veiculos: [
    { id:"expert",  nome:"Expert",  freq:"semanal" },
    { id:"courier", nome:"Courier", freq:"semanal" },
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

function chaveSetor(setor)        { return `limpeza:${setor}`; }
const CHAVE_RESPONSAVEIS = "limpeza:_responsaveis";
const CHAVE_FREQUENCIAS  = "limpeza:_frequencias";

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
    const responsaveis = (await ler(CHAVE_RESPONSAVEIS)) || {};
    const frequencias  = (await ler(CHAVE_FREQUENCIAS))  || {};
    return res.json({ ok: true, resumo: resultado, setores: SETORES, itensPorSetor: ITENS_POR_SETOR, limiteDias: LIMITE_DIAS, responsaveis, frequencias });
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

    // Data do registro: aceita data retroativa enviada pelo cliente (campo `em`)
    // Validações: deve ser ISO válida, não futura, máximo 90 dias atrás
    let emISO = new Date().toISOString();
    if (dados.em) {
      const dataEnviada = new Date(dados.em);
      if (isNaN(dataEnviada.getTime())) {
        return erro(res, 400, "Data inválida.");
      }
      const agora = Date.now();
      if (dataEnviada.getTime() > agora + 60_000) {
        return erro(res, 400, "Data não pode ser futura.");
      }
      const limitePasado = agora - 90 * 24 * 60 * 60 * 1000; // 90 dias
      if (dataEnviada.getTime() < limitePasado) {
        return erro(res, 400, "Data retroativa muito antiga (máximo 90 dias).");
      }
      emISO = dataEnviada.toISOString();
    }

    const registros = (await ler(chaveSetor(setor))) || [];
    const novo = {
      id: novoId(),
      setor, item,
      periodicidade: freq,
      obs,
      feitoPor,
      nomeFeitoPor: sessao.nome || sessao.login,
      em: emISO,
    };
    registros.push(novo);
    if (registros.length > 300) registros.splice(0, registros.length - 300);
    await gravar(chaveSetor(setor), registros);
    return res.json({ ok: true, registro: novo });
  }

  /* -- salvarFrequencias -- */
  if (dados.acao === "salvarFrequencias") {
    if (!["admin","gestor"].includes(sessao.papel))
      return erro(res, 403, "Apenas admin ou gestor podem alterar frequências.");
    const freqs = dados.frequencias;
    if (!freqs || typeof freqs !== "object") return erro(res, 400, "Dados inválidos.");
    const freqsValidas = ["diaria","semanal","quinzenal","mensal","anual","a_cada_uso","eventual"];
    // Validar e filtrar
    const mapaFiltrado = {};
    for (const [setor, itens] of Object.entries(freqs)) {
      if (!ITENS_POR_SETOR[setor]) continue;
      mapaFiltrado[setor] = {};
      for (const [itemId, freq] of Object.entries(itens)) {
        const itemValido = ITENS_POR_SETOR[setor].find(function(it){ return it.id === itemId; });
        if (itemValido && freqsValidas.includes(freq)) {
          mapaFiltrado[setor][itemId] = freq;
        }
      }
    }
    // Merge com frequências já salvas para não perder outros setores
    const existentes = (await ler(CHAVE_FREQUENCIAS)) || {};
    for (const [setor, itens] of Object.entries(mapaFiltrado)) {
      existentes[setor] = Object.assign(existentes[setor] || {}, itens);
    }
    await gravar(CHAVE_FREQUENCIAS, existentes);
    return res.json({ ok: true, frequencias: existentes });
  }

  /* -- salvarResponsaveis -- */
  if (dados.acao === "salvarResponsaveis") {
    if (!["admin","gestor"].includes(sessao.papel))
      return erro(res, 403, "Apenas admin ou gestor podem alterar responsáveis.");
    const mapa = dados.responsaveis;
    if (!mapa || typeof mapa !== "object") return erro(res, 400, "Dados inválidos.");
    // Aceitar apenas setores conhecidos
    const mapaFiltrado = {};
    for (const [setor, nome] of Object.entries(mapa)) {
      if (SETORES[setor] && typeof nome === "string" && nome.trim()) {
        mapaFiltrado[setor] = nome.trim();
      }
    }
    await gravar(CHAVE_RESPONSAVEIS, mapaFiltrado);
    return res.json({ ok: true, responsaveis: mapaFiltrado });
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

  return erro(res, 400, "Ação desconhecida.");
});
