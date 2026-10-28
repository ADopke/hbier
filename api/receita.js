// api/receita.js — CRUD de receitas de cerveja
// GET  /api/receita?lista=1          → lista todas as receitas (resumo)
// GET  /api/receita?id=<id>          → carrega receita completa
// POST /api/receita  { id?, dados }  → cria (sem id) ou atualiza (com id)
// POST /api/receita  { id, deletar:true } → remove receita

import {
  ler, gravar, apagar, lerVarios, bancoConfigurado,
  exigirLogin, corpo, erro, protegido, novoId
} from "./_lib.js";

export default protegido(async function(req, res) {
  if (!bancoConfigurado())
    return erro(res, 503, "Banco não configurado.");

  const usuario = await exigirLogin(req, res);
  if (!usuario) return;

  /* ── GET importação temporária Brewfather ── */
  if (req.method === "GET" && req.query.importar === "hbier2026v2") {
    const M = [{nome:"Estágio 1 - Descanso Proteico",temperatura:55,tempo:1},{nome:"Estágio 2 - Sacarificação Beta",temperatura:62,tempo:30},{nome:"Estágio 3 - Sacarificação Alfa",temperatura:72,tempo:20},{nome:"Estágio 4 - Mash Out",temperatura:78,tempo:2}];
    const RR=[
      {nome:"HBier Oktoberfest 1000L",estilo:"German-Style Oktoberfest/Wiesn",og:"1.057",fg:"1.011",abv:"6.1",volume:"1000",fermentaveis:[{nome:"Malte Pilsen",tipo:"Grãos",fornecedor:"Agraria",potencial:81.20,ebc:3.6,quantidade:183},{nome:"Malte Munich II",tipo:"Grãos",fornecedor:"Weyermann",potencial:80.50,ebc:25.0,quantidade:23},{nome:"Caramunich",tipo:"Grãos",fornecedor:"Weyerman",potencial:76.00,ebc:124.0,quantidade:2}],lupulos:[{nome:"Hallertauer Perle",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ALEMANHA",aa:9.00,quantidade:0.800,tempo:60},{nome:"Saaz",momento:"Fervura",forma:"Pellet",tipo:"Aroma",origem:"REPÚBLICA TCHECA",aa:2.80,quantidade:1.000,tempo:0}],leveduras:[{nome:"Fermentis Saflager® W-34/70",forma:"Lama",tipo:"Lager",fornecedor:"BWS®",atenuacao:79,quantidade:"20 L"}],diversos:[{nome:"Ácido Lático",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.200 kg"},{nome:"Cloreto de Cálcio Mostura",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.150 kg"}],mostura:M},
      {nome:"HBier Oktoberfest 1400L",estilo:"German-Style Oktoberfest/Wiesn",og:"1.059",fg:"1.012",abv:"6.2",volume:"1400",fermentaveis:[{nome:"Malte Munich II",tipo:"Grãos",fornecedor:"Weyermann",potencial:80.50,ebc:25.0,quantidade:30},{nome:"Malte Pilsen",tipo:"Grãos",fornecedor:"Agraria",potencial:81.20,ebc:3.6,quantidade:275},{nome:"Malte Caramunich Tipo II",tipo:"Grãos",fornecedor:"Weyermann",potencial:0.00,ebc:120.0,quantidade:3}],lupulos:[{nome:"Saaz",momento:"Fervura",forma:"Pellet",tipo:"Aroma",origem:"REPÚBLICA TCHECA",aa:2.80,quantidade:1.450,tempo:0},{nome:"Amira",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ALEMANHA",aa:11.40,quantidade:0.235,tempo:45}],leveduras:[{nome:"Fermentis Saflager® W-34/70",forma:"Lama",tipo:"Lager",fornecedor:"BWS®",atenuacao:79,quantidade:"60 L"}],diversos:[{nome:"StarMax Beer Super",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.050 kg"},{nome:"LowFoam - Antiespumante",tipo:"Outros",momento:"Fervura",quantidade:"0.020 kg"},{nome:"Cloreto de Cálcio Fervura",tipo:"Aditivo na água",momento:"Fervura",quantidade:"0.150 kg"},{nome:"Ácido Láctico Mostura",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.280 kg"}],mostura:M},
      {nome:"HBier Oktoberfest 1500L",estilo:"German-Style Oktoberfest/Wiesn",og:"1.053",fg:"1.011",abv:"5.6",volume:"1500",fermentaveis:[{nome:"Malte Pilsen",tipo:"Grãos",fornecedor:"Agraria",potencial:81.20,ebc:3.6,quantidade:275},{nome:"Malte Munich II",tipo:"Grãos",fornecedor:"Weyermann",potencial:80.50,ebc:25.0,quantidade:35},{nome:"Caramunich",tipo:"Grãos",fornecedor:"Weyerman",potencial:76.00,ebc:124.0,quantidade:3}],lupulos:[{nome:"Hallertauer Perle",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ALEMANHA",aa:9.00,quantidade:1.240,tempo:60},{nome:"Saaz",momento:"Fervura",forma:"Pellet",tipo:"Aroma",origem:"REPÚBLICA TCHECA",aa:2.80,quantidade:1.550,tempo:0}],leveduras:[{nome:"Fermentis Saflager® W-34/70",forma:"Lama",tipo:"Lager",fornecedor:"BWS®",atenuacao:79,quantidade:"31 L"}],diversos:[{nome:"Ácido Lático",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.310 kg"},{nome:"Cloreto de Cálcio Mostura",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.233 kg"}],mostura:M},
      {nome:"HBier Irish Red Ale 1000L",estilo:"Irish-Style Red Ale",og:"1.061",fg:"1.017",abv:"5.8",volume:"1000",fermentaveis:[{nome:"Malte Weyermann® Carared®",tipo:"Grãos",fornecedor:"Weyermann",potencial:80.00,ebc:45.0,quantidade:25},{nome:"Malte Pale Ale",tipo:"Grãos",fornecedor:"Agrária",potencial:79.00,ebc:5.5,quantidade:200},{nome:"Malte Weyermann® Carafa® Tipo 3",tipo:"Grãos",fornecedor:"Weyermann",potencial:65.00,ebc:999.0,quantidade:4}],lupulos:[{nome:"Hallertau Magnum",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ALEMANHA",aa:11.80,quantidade:0.830,tempo:60}],leveduras:[{nome:"London ESB",forma:"Líquido",tipo:"Ale",fornecedor:"Bio4",atenuacao:71,quantidade:"5 L"}],diversos:[{nome:"StarMax Beer Super",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.050 kg"},{nome:"Cloreto de Cálcio Fervura",tipo:"Aditivo na água",momento:"Fervura",quantidade:"0.150 kg"},{nome:"Ácido Láctico Mostura",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.250 kg"}],mostura:M},
      {nome:"HBier Irish Red Ale 1500L",estilo:"Irish-Style Red Ale",og:"1.062",fg:"1.017",abv:"6.0",volume:"1500",fermentaveis:[{nome:"Malte Pale Ale",tipo:"Grãos",fornecedor:"Agraria",potencial:80.50,ebc:6.0,quantidade:325},{nome:"Malte Weyermann® Carared®",tipo:"Grãos",fornecedor:"Weyermann",potencial:80.00,ebc:45.0,quantidade:37.5},{nome:"Malte Weyermann® Carafa® Especial Tipo 2",tipo:"Grãos",fornecedor:"Weyermann",potencial:65.00,ebc:999.0,quantidade:6}],lupulos:[{nome:"Hallertau Hallertauer Magnum",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ALEMANHA",aa:13.20,quantidade:0.900,tempo:30}],leveduras:[{nome:"London ESB",forma:"Líquido",tipo:"Ale",fornecedor:"Bio4",atenuacao:71,quantidade:"20 L"}],diversos:[{nome:"LowFoam - Antiespumante",tipo:"Outros",momento:"Fervura",quantidade:"0.020 kg"},{nome:"Cloreto de Cálcio Mostura",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.150 kg"},{nome:"Ácido Láctico",tipo:"Aditivo na água",momento:"Fervura",quantidade:"0.200 kg"}],mostura:M},
      {nome:"HBier American India Pale Ale 1000L",estilo:"American-Style India Pale Ale",og:"1.059",fg:"1.017",abv:"5.6",volume:"1000",fermentaveis:[{nome:"Malte Pilsen",tipo:"Grãos",fornecedor:"Agraria",potencial:81.20,ebc:3.6,quantidade:200},{nome:"Malte Weyermann® Trigo Claro",tipo:"Grãos",fornecedor:"Weyermann",potencial:82.00,ebc:4.0,quantidade:15}],lupulos:[{nome:"Columbus/Tomahawk (CTZ)",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ESTADOS UNIDOS DA AMÉRICA",aa:14.00,quantidade:2.500,tempo:0},{nome:"Citra Hop Extract",momento:"Dry Hopping",forma:"Extrato",tipo:"Ambos",origem:"ESTADOS UNIDOS DA AMÉRICA",aa:50.29,quantidade:0.118}],leveduras:[{nome:"London ESB",forma:"Líquido",tipo:"Ale",fornecedor:"Bio4",atenuacao:71,quantidade:"2.5 L"}],diversos:[{nome:"StarMax Beer Super",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.050 kg"},{nome:"Cloreto de Cálcio Fervura",tipo:"Aditivo na água",momento:"Fervura",quantidade:"0.150 kg"},{nome:"Ácido Láctico Mostura",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.250 kg"}],mostura:M},
      {nome:"HBier American India Pale Ale 1500L",estilo:"American-Style India Pale Ale",og:"1.057",fg:"1.016",abv:"5.4",volume:"1500",fermentaveis:[{nome:"Malte Pilsen",tipo:"Grãos",fornecedor:"Agraria",potencial:81.20,ebc:3.6,quantidade:310},{nome:"Malte Weyermann® Trigo Claro",tipo:"Grãos",fornecedor:"Weyermann",potencial:82.00,ebc:4.0,quantidade:23.25}],lupulos:[{nome:"Columbus/Tomahawk (CTZ)",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ESTADOS UNIDOS DA AMÉRICA",aa:14.00,quantidade:3.750,tempo:0},{nome:"Citra® BRAND",momento:"Dry Hopping",forma:"Pellet",tipo:"Aroma",origem:"ESTADOS UNIDOS DA AMÉRICA",aa:11.40,quantidade:3.750}],leveduras:[{nome:"London ESB",forma:"Líquido",tipo:"Ale",fornecedor:"Bio4",atenuacao:71,quantidade:"3.875 L"}],diversos:[{nome:"StarMax Beer Super",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.078 kg"},{nome:"Cloreto de Cálcio Fervura",tipo:"Aditivo na água",momento:"Fervura",quantidade:"0.233 kg"},{nome:"Ácido Láctico Mostura",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.388 kg"}],mostura:M},
      {nome:"HBier English India Pale Ale 1000L",estilo:"English-Style India Pale Ale",og:"1.068",fg:"1.019",abv:"6.5",volume:"1000",fermentaveis:[{nome:"Malte Pale Ale",tipo:"Grãos",fornecedor:"Agraria",potencial:80.50,ebc:6.0,quantidade:220},{nome:"Malte Weyermann® Carared®",tipo:"Grãos",fornecedor:"Weyermann",potencial:80.00,ebc:45.0,quantidade:30}],lupulos:[{nome:"Hallertau Hallertauer Magnum",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ALEMANHA",aa:13.20,quantidade:1.720,tempo:15},{nome:"East Kent Golding",momento:"Fervura",forma:"Pellet",tipo:"Ambos",origem:"REINO UNIDO",aa:6.50,quantidade:1.350,tempo:50},{nome:"Slovenia Styrian Gold",momento:"Fervura",forma:"Pellet",tipo:"Ambos",origem:"REINO UNIDO",aa:4.10,quantidade:1.350,tempo:50},{nome:"East Kent Golding",momento:"Dry Hopping",forma:"Pellet",tipo:"Ambos",origem:"REINO UNIDO",aa:6.50,quantidade:1.200},{nome:"Slovenia Styrian Gold",momento:"Dry Hopping",forma:"Pellet",tipo:"Ambos",origem:"REINO UNIDO",aa:4.10,quantidade:1.200}],leveduras:[{nome:"London ESB",forma:"Líquido",tipo:"Ale",fornecedor:"Bio4",atenuacao:71,quantidade:"2.5 L"}],diversos:[{nome:"StarMax Beer Super",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.050 kg"},{nome:"Cloreto de Cálcio Fervura",tipo:"Aditivo na água",momento:"Fervura",quantidade:"0.150 kg"},{nome:"Ácido Láctico Mostura",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.250 kg"}],mostura:M},
      {nome:"HBier American Pale Ale 1500L",estilo:"American-Style Pale Ale",og:"1.058",fg:"1.016",abv:"5.6",volume:"1500",fermentaveis:[{nome:"Malte Pale Ale",tipo:"Grãos",fornecedor:"Agraria",potencial:80.50,ebc:6.0,quantidade:345}],lupulos:[{nome:"Amarillo®",momento:"Fervura",forma:"Pellet",tipo:"Aroma",origem:"ESTADOS UNIDOS DA AMÉRICA",aa:6.30,quantidade:1.000,tempo:60},{nome:"Centennial",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ESTADOS UNIDOS DA AMÉRICA",aa:8.30,quantidade:0.750,tempo:60},{nome:"Amarillo®",momento:"Fervura",forma:"Pellet",tipo:"Aroma",origem:"ESTADOS UNIDOS DA AMÉRICA",aa:6.30,quantidade:0.800,tempo:15},{nome:"Centennial",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ESTADOS UNIDOS DA AMÉRICA",aa:8.30,quantidade:0.525,tempo:15},{nome:"Amarillo®",momento:"Fervura",forma:"Pellet",tipo:"Aroma",origem:"ESTADOS UNIDOS DA AMÉRICA",aa:6.30,quantidade:0.800,tempo:0},{nome:"Centennial",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ESTADOS UNIDOS DA AMÉRICA",aa:8.30,quantidade:0.525,tempo:0},{nome:"Citra® BRAND",momento:"Dry Hopping",forma:"Pellet",tipo:"Aroma",origem:"ESTADOS UNIDOS DA AMÉRICA",aa:11.40,quantidade:5.000}],leveduras:[{nome:"London ESB",forma:"Líquido",tipo:"Ale",fornecedor:"Bio4",atenuacao:71,quantidade:"2.5 L"}],diversos:[{nome:"StarMax Beer Super",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.050 kg"},{nome:"Cloreto de Cálcio Fervura",tipo:"Aditivo na água",momento:"Fervura",quantidade:"0.150 kg"},{nome:"Ácido Láctico Mostura",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.250 kg"}],mostura:M},
      {nome:"HBier Saaz Hop Lager 1000L Lavagem 550/250",estilo:"International-Style Pilsener",og:"1.046",fg:"1.009",abv:"4.9",volume:"1000",fermentaveis:[{nome:"Malte Pilsen",tipo:"Grãos",fornecedor:"Agraria",potencial:81.20,ebc:3.6,quantidade:271.25}],lupulos:[{nome:"Hallertauer Perle",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ALEMANHA",aa:5.60,quantidade:1.705,tempo:60},{nome:"Saaz",momento:"Fervura",forma:"Pellet",tipo:"Aroma",origem:"REPÚBLICA TCHECA",aa:2.80,quantidade:1.550,tempo:0}],leveduras:[{nome:"Fermentis Saflager® W-34/70",forma:"Lama",tipo:"Lager",fornecedor:"BWS®",atenuacao:79,quantidade:"31 L"}],diversos:[{nome:"Ácido Lático",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.310 kg"},{nome:"Cloreto de Cálcio Mostura",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.233 kg"}],mostura:M},
      {nome:"HBier Saaz Hop Lager 1000L Lavagem 280/100",estilo:"International-Style Pilsener",og:"1.048",fg:"1.010",abv:"5.0",volume:"1000",fermentaveis:[{nome:"Malte Pilsen",tipo:"Grãos",fornecedor:"Agraria",potencial:81.20,ebc:3.6,quantidade:175}],lupulos:[{nome:"Hallertauer Perle",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ALEMANHA",aa:5.60,quantidade:1.100,tempo:60},{nome:"Saaz",momento:"Fervura",forma:"Pellet",tipo:"Aroma",origem:"REPÚBLICA TCHECA",aa:2.80,quantidade:1.000,tempo:0}],leveduras:[{nome:"Fermentis Saflager® W-34/70",forma:"Lama",tipo:"Lager",fornecedor:"BWS®",atenuacao:79,quantidade:"20 L"}],diversos:[{nome:"Ácido Lático",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.200 kg"},{nome:"Cloreto de Cálcio Mostura",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.150 kg"}],mostura:M},
      {nome:"HBier Irish Dry Stout",estilo:"Classic Irish-Style Dry Stout",og:"1.058",fg:"1.016",abv:"5.6",volume:"1000",fermentaveis:[{nome:"Malte Weyermann® Carared®",tipo:"Grãos",fornecedor:"Weyermann",potencial:80.00,ebc:45.0,quantidade:24},{nome:"Malte Pilsen",tipo:"Grãos",fornecedor:"Agraria",potencial:81.20,ebc:3.6,quantidade:170},{nome:"Malte Weyermann® Carafa® Especial Tipo 2",tipo:"Grãos",fornecedor:"Weyermann",potencial:65.00,ebc:999.0,quantidade:20}],lupulos:[{nome:"Hallertau Hallertauer Magnum",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ALEMANHA",aa:11.60,quantidade:1.000,tempo:60}],leveduras:[{nome:"London ESB",forma:"Líquido",tipo:"Ale",fornecedor:"Bio4",atenuacao:71,quantidade:"2.5 L"}],diversos:[{nome:"StarMax Beer Super",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.050 kg"},{nome:"Cloreto de Cálcio Fervura",tipo:"Aditivo na água",momento:"Fervura",quantidade:"0.150 kg"},{nome:"Ácido Láctico Mostura",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.250 kg"}],mostura:M},
      {nome:"HBier Gose Manga",estilo:"Contemporary-Style Gose",og:"1.045",fg:"1.013",abv:"4.2",volume:"1000",fermentaveis:[{nome:"Malte Trigo Claro",tipo:"Grãos",fornecedor:"Agrária Malte",potencial:76.60,ebc:3.0,quantidade:40},{nome:"Malte Pilsen",tipo:"Grãos",fornecedor:"Agraria",potencial:81.20,ebc:3.6,quantidade:125}],lupulos:[{nome:"Hallertauer Perle",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ALEMANHA",aa:5.30,quantidade:0.450,tempo:50}],leveduras:[{nome:"London ESB",forma:"Líquido",tipo:"Ale",fornecedor:"Bio4",atenuacao:71,quantidade:"2.5 L"}],diversos:[{nome:"StarMax Beer Super",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.050 kg"},{nome:"Cloreto de Cálcio Fervura",tipo:"Aditivo na água",momento:"Fervura",quantidade:"0.150 kg"},{nome:"Ácido Láctico Mostura",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.250 kg"}],mostura:M},
      {nome:"HBier Tripel Zanzibar 1000L",estilo:"Belgian-Style Tripel",og:"1.077",fg:"1.017",abv:"8.0",volume:"1000",fermentaveis:[{nome:"Malte Pilsen",tipo:"Grãos",fornecedor:"Agraria",potencial:81.20,ebc:3.6,quantidade:180},{nome:"Malte Munich II",tipo:"Grãos",fornecedor:"Weyermann",potencial:80.50,ebc:25.0,quantidade:50},{nome:"Malte Weyermann® Trigo Claro",tipo:"Grãos",fornecedor:"Weyermann",potencial:82.00,ebc:4.0,quantidade:50}],lupulos:[{nome:"Hallertau Hallertauer Magnum",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ALEMANHA",aa:13.20,quantidade:0.600,tempo:60},{nome:"Cascade",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ESTADOS UNIDOS DA AMÉRICA",aa:4.50,quantidade:1.200,tempo:30}],leveduras:[{nome:"Belgian Abbey",forma:"Seco",tipo:"Ale",fornecedor:"Mangrove Jack's",atenuacao:77,quantidade:"0 kg"}],diversos:[{nome:"Ácido Lático",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.310 kg"},{nome:"Casca de laranja",tipo:"Especiaria",momento:"Fervura",quantidade:"0.600 kg"},{nome:"Semente de coentro",tipo:"Especiaria",momento:"Fervura",quantidade:"0.600 kg"},{nome:"Açúcar Cristal",tipo:"Aditivo na água",momento:"Fervura",quantidade:"15.000 kg"}],mostura:M},
      {nome:"HBier Helles Sem 1000L",estilo:"Non-Alcohol Malt Beverage",og:"1.021",fg:"1.017",abv:"0.5",volume:"1000",fermentaveis:[{nome:"Malte Pilsen",tipo:"Grãos",fornecedor:"Agraria",potencial:81.20,ebc:3.6,quantidade:45},{nome:"Flakes de Milho",tipo:"Outro",fornecedor:"Agrária Malte",potencial:50.00,ebc:3.9,quantidade:25},{nome:"Malte Vienna",tipo:"Grãos",fornecedor:"Agrária",potencial:81.90,ebc:9.8,quantidade:15},{nome:"Malte Weyermann® Carafa® Tipo 3",tipo:"Grãos",fornecedor:"Weyermann",potencial:65.00,ebc:999.0,quantidade:0.350}],lupulos:[{nome:"Hallertauer Hersbrucker",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ALEMANHA",aa:5.00,quantidade:1.500,tempo:85},{nome:"Hallertauer Hersbrucker",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ALEMANHA",aa:5.00,quantidade:0.500,tempo:20},{nome:"Amira",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ALEMANHA",aa:11.40,quantidade:0.100,tempo:60}],leveduras:[{nome:"Lalbrew LoNa",forma:"Seco",tipo:"Hibrido",fornecedor:"Lallemand",atenuacao:16,quantidade:"0.300 kg"}],diversos:[{nome:"Ácido Lático",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.200 kg"},{nome:"Clearmax PVPP",tipo:"Clarificador",momento:"Whirlpool",quantidade:"0.600 kg"},{nome:"Cloreto de Cálcio Fervura",tipo:"Aditivo na água",momento:"Fervura",quantidade:"0.110 kg"},{nome:"Matufast",tipo:"Aditivo na água",momento:"Fermentação",quantidade:"0.015 kg"}],mostura:[{nome:"Arriada/Sacarificação",temperatura:74,tempo:60},{nome:"Inativação enzimática",temperatura:78,tempo:30}]},
      {nome:"HBier CrocOldAle",estilo:"Old Ale",og:"1.125",fg:"1.036",abv:"11.8",volume:"1000",fermentaveis:[{nome:"Malte Weyermann® Carared®",tipo:"Grãos",fornecedor:"Weyermann",potencial:80.00,ebc:45.0,quantidade:50},{nome:"Malte Pilsen",tipo:"Grãos",fornecedor:"Agraria",potencial:81.20,ebc:3.6,quantidade:400},{nome:"Malte Caramunich Tipo II",tipo:"Grãos",fornecedor:"Weyermann",potencial:0.00,ebc:120.0,quantidade:12},{nome:"Malte Weyermann® Carafa® Tipo 1",tipo:"Grãos",fornecedor:"Weyermann",potencial:65.00,ebc:800.0,quantidade:8}],lupulos:[{nome:"Hallertau Hallertauer Magnum",momento:"Fervura",forma:"Pellet",tipo:"Amargor",origem:"ALEMANHA",aa:13.20,quantidade:1.860,tempo:0}],leveduras:[{nome:"London ESB",forma:"Líquido",tipo:"Ale",fornecedor:"Bio4",atenuacao:71,quantidade:"2.5 L"}],diversos:[{nome:"StarMax Beer Super",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.050 kg"},{nome:"Cloreto de Cálcio Fervura",tipo:"Aditivo na água",momento:"Fervura",quantidade:"0.150 kg"},{nome:"Ácido Láctico Mostura",tipo:"Aditivo na água",momento:"Mostura",quantidade:"0.250 kg"}],mostura:M},
    ];
    // Limpa índice existente antes de reimportar
    await gravar("receitas:index",[]);
    const resultados=[]; let okC=0,errC=0;
    for(const dados of RR){
      try{
        const id=novoId();
        dados.meta={atualizadoEm:new Date().toISOString(),atualizadoPor:"import-brewfather-v2"};
        await gravar(`receita:${id}`,dados);
        const idx2=(await ler("receitas:index"))||[];
        idx2.push(id); await gravar("receitas:index",idx2);
        resultados.push({nome:dados.nome,id,status:"ok"});okC++;
      }catch(e){resultados.push({nome:dados.nome,erro:e.message,status:"erro"});errC++;}
    }
    return res.json({ok:okC,erros:errC,total:RR.length,resultados});
  }

  /* ── GET lista todas as receitas ── */
  if (req.method === "GET" && req.query.lista === "1") {
    const idx = (await ler("receitas:index")) || [];
    if (!idx.length) return res.json({ receitas: [] });

    const chaves = idx.map(id => `receita:${id}`);
    const valores = await lerVarios(chaves);
    const receitas = idx.map((id, i) => {
      const r = valores[i];
      if (!r) return null;
      return {
        id,
        nome:       r.nome       || "—",
        estilo:     r.estilo     || "—",
        og:         r.og         || "",
        fg:         r.fg         || "",
        abv:        r.abv        || "",
        volume:     r.volume     || "",
        atualizadoEm: r.meta?.atualizadoEm || null,
      };
    }).filter(Boolean);
    return res.json({ receitas });
  }

  /* ── GET carrega receita completa ── */
  if (req.method === "GET") {
    const id = (req.query.id || "").trim();
    if (!id) return erro(res, 400, "Parâmetro id obrigatório.");
    const receita = await ler(`receita:${id}`);
    return res.json({ receita: receita || null });
  }

  /* ── POST salva / atualiza / deleta ── */
  if (req.method === "POST") {
    const { id: idExistente, dados, deletar } = corpo(req);

    /* -- DELETE -- */
    if (deletar) {
      const id = (idExistente || "").trim();
      if (!id) return erro(res, 400, "id obrigatório para deletar.");
      await apagar(`receita:${id}`);
      const idx = (await ler("receitas:index")) || [];
      const novo = idx.filter(x => x !== id);
      await gravar("receitas:index", novo);
      return res.json({ ok: true });
    }

    /* -- CREATE / UPDATE -- */
    if (!dados || typeof dados !== "object")
      return erro(res, 400, "Campo dados obrigatório.");

    const id = (idExistente || "").trim() || novoId();

    dados.meta = {
      ...(dados.meta || {}),
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: usuario.login,
    };

    await gravar(`receita:${id}`, dados);

    const idx = (await ler("receitas:index")) || [];
    if (!idx.includes(id)) {
      idx.unshift(id);
      await gravar("receitas:index", idx);
    }

    return res.json({ ok: true, id, atualizadoEm: dados.meta.atualizadoEm });
  }

  erro(res, 405, "Método não permitido.");
});
