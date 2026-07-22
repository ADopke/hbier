// _seed.js — rotina padrão da fábrica HBier
// Usada para popular as tarefas do primeiro administrador.

export function tarefasPadrao(novoId) {
  const t = (dados) => ({
    id: novoId(),
    desc: "",
    origem: "admin",
    lembrete: "",
    ...dados,
  });

  return [
    /* ---- diárias ---- */
    t({
      nome: "Lançar produções no Beerbo",
      desc: "sincronizadas com o BeerSales",
      freq: "diaria",
    }),
    t({ nome: "Lançar envases", desc: "envases do dia", freq: "diaria" }),
    t({
      nome: "Verificar liberação de lotes",
      desc: "BeerSales — lotes liberados p/ faturar",
      freq: "diaria",
    }),
    t({
      nome: "Migrar estoque p/ câmara fria",
      desc: "tanques → câmara fria (baixa em barris)",
      freq: "diaria",
    }),
    t({
      nome: "Acompanhar aba Faturamento",
      desc: "está dando baixa no estoque ou só faturando?",
      freq: "diaria",
    }),
    t({
      nome: "Conferir chope no tanque × BeerSales",
      desc: "volume e lote batendo com o sistema",
      freq: "diaria",
    }),

    /* ---- semanais ---- */
    t({
      nome: "Lançar programação de produção e ajustar",
      desc: "Produções da semana lançadas e ajustadas",
      freq: "semanal",
      lembrete:
        "Atrelar o TANQUE que será usado — aba Análise de Equipamentos",
    }),
    t({
      nome: "Cobrar contagem de estoque",
      desc: "Contagem semanal cobrada e recebida",
      freq: "semanal",
    }),
    t({
      nome: "Comprar insumos para produção",
      desc: "Revisar o que falta para a semana atual + a seguinte",
      freq: "semanal",
      dia: "seg",
    }),
    t({
      nome: "Conferir dados de produção no Beerbo",
      desc: "Carbonatação, pressão do tanque e densidade lançados",
      freq: "semanal",
    }),
    t({
      nome: "Solicitar medição de cloro — água da brassagem",
      desc: "Medição semanal solicitada",
      freq: "semanal",
    }),

    /* ---- quinzenais ---- */
    t({
      nome: "Solicitar medição de cloro — condensado da caldeira",
      desc: "Tanque da água do condensado da caldeira",
      freq: "quinzenal",
    }),
    t({
      nome: "Verificar materiais da impressora Markem Imaje",
      desc: "Tinta, solvente e demais consumíveis em nível",
      freq: "quinzenal",
    }),

    /* ---- conforme demanda ---- */
    t({
      nome: "Lançar manutenções no BeerSales",
      desc: "Lançamentos feitos nesta semana",
      freq: "demanda",
    }),
    t({
      nome: "Criação de rótulos e produtos",
      desc: "Rótulos / produtos criados nesta semana",
      freq: "demanda",
    }),

    /* ---- lembrete programado ---- */
    t({
      nome: "Troca do filtro de água",
      desc: "Substituição programada do filtro de água da fábrica",
      freq: "lembrete",
      data: "2027-02",
    }),
  ];
}
