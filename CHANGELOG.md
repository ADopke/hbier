# Registro de versões — HBier Rotina da Fábrica

A versão aparece em dois lugares do app: no rodapé (dentro do sistema) e abaixo
do formulário de login. Sempre que pedir suporte, informe esse número — ele diz
exatamente qual versão está rodando na sua URL.

---

## Como numerar

O formato é `MAIOR.MENOR.CORREÇÃO` — por exemplo, `1.2.3`.

| Parte | Quando aumenta | Exemplo |
|---|---|---|
| **MAIOR** (1.x.x) | mudança grande, que altera o jeito de usar | painel de acompanhamento da equipe |
| **MENOR** (x.1.x) | função nova, sem quebrar nada do que existe | listas suspensas puxando da planilha |
| **CORREÇÃO** (x.x.1) | conserto de erro ou ajuste visual | corrigir cálculo de pendência no sábado |

Ao aumentar uma parte, as seguintes voltam a zero: depois da `1.2.3`, uma função
nova vira `1.3.0`, e uma mudança grande vira `2.0.0`.

---

## Como publicar uma nova versão

1. Abra `index.html` e localize o bloco **VERSÃO DO APP**, logo no começo do
   `<script>` (por volta da linha 485):

```javascript
var VERSAO = "1.0.0";
var DATA_VERSAO = "22/07/2026";
```

2. Altere as duas linhas
3. Acrescente uma entrada neste arquivo, no topo do histórico
4. Suba os arquivos no GitHub (`Add file` → `Upload files`) e faça o commit
5. A Vercel publica sozinha em ~1 minuto
6. Confira: abra a URL com **Ctrl + F5** e olhe o rodapé

> Atualize também o campo `"version"` do `package.json`, para manter os dois
> iguais. Ele não aparece na tela, mas evita confusão no futuro.

---

# Histórico

## 3.19.2 — 26/11/2026

- Corrigido: ficha aberta pelo bloco "Próximo" do tanque recusava "+ Adicionar
  batelada" ("Marque Moagem Malte e CIP Tanque…") mesmo com os dois marcados na
  Programação — o app considerava sempre "não marcado" para brassagem prevista.
  Agora lê os checks reais da brassagem (e confere na Programação ao abrir)

---

## 3.19.1 — 26/11/2026

- Dose padrão de ácido lático: 250 mL por batelada (aviso de excesso acima de 300 mL).
  Receita com dose própria em Tratamento de Água continua valendo a da receita

---

## 3.19.0 — 26/11/2026

**🧪 Ácido lático e pH da mostura por batelada**

- Ficha › Batelada › Mostura: bloco "Ácido lático (junto com o malte)" com
  dose já preenchida (150 mL, ou a dose da receita em Tratamento de Água),
  "Ácido extra (mL)" e "pH após correção"
- O "pH após 5 min" passa a ser controlado: faixa 5,0 a 5,2. Fora da faixa:
  pH alto → orientação para ácido extra em etapas e medir de novo; pH baixo →
  avisar o responsável
- 🔒 O Lauter da batelada fica travado (campos cinza) até o pH estar na faixa,
  e a próxima batelada não abre enquanto a anterior estiver pendente
- 🟠 "Liberar com justificativa": destrava com o motivo, nome e hora; aparece
  na batelada, no dossiê e nos alertas do Painel (últimos 7 dias)
- ⚠️ Aviso se o total de ácido passar de 20% acima do padrão (mais de 180 mL)
- Insumos × estoque passa a contar o ácido lático (mL por batelada programada)
- Bateladas salvas antes desta versão não são travadas

---

## 3.18.1 — 26/11/2026

- 🧬 Fermentos saiu do Painel e foi para a aba Tanques (logo abaixo da Busca de
  Lotes), recolhível; o cabeçalho mostra quantas coletas estão disponíveis e
  quantas têm alerta. Todos veem; só admin/gestor editam os limites

---

## 3.18.0 — 26/11/2026

**🧬 Geração do fermento calculada pelo app**

- Ficha › Inoculação de levedura: novo campo "Origem do fermento" —
  🆕 fermento novo (G1, com lote do fornecedor) ou ♻️ reaproveitar a coleta de
  um lote (lista as coletas confirmadas com cepa, geração, data e dias guardado;
  mesma cepa da receita primeiro). A geração é preenchida sozinha (origem + 1).
  "✏️ Informar manualmente" fica como reserva
- Avisos na escolha: 🚫 passa do limite de gerações da cepa, 🚫 coleta guardada há
  mais de 15 dias, ⚠️ cepa diferente da receita, ⚠️ última geração permitida
- Limites iniciais: W-34/70 = 18, London ESB = 8, Lona = 1 (não é coletada);
  máximo 15 dias guardado — editáveis no Painel
- Painel › 🧬 Fermentos: por cepa, geração atual com barra até o limite, árvore
  (G1 lote → G2 lote → …), coletas disponíveis com idade, alertas, lista de lotes
- Card do tanque: a linha da Levedura mostra cepa e geração ("🧬 W-34/70 · G6")
- Lotes antigos: a geração digitada antes ("12ª") vira 12 e conta normalmente
- Novo `GET /api/ficha?fermentos=1` e `POST {acao:"fermentosCfg"}`; ficha ganha `fermento`

---

## 3.17.1 — 26/11/2026

- Corrigido: botão "📄 Dossiê" (aba Lotes e ficha) não fazia nada — a função
  não estava acessível pelo botão. Mesma correção para outros botões que
  tinham o mesmo problema: "🕘 Versões" da ficha, recalcular eficiência das
  bateladas, filtro da aba Lotes, cálculo de barris, troca de tanque no
  lançamento, fechar observação e recarregar Leituras

---

## 3.17.0 — 26/11/2026

**🔥 Purga da caldeira**

- Em dia com brassagem na Programação, a partir do horário marcado (padrão
  07:30), o app dos operadores fica coberto por uma tela vermelha "LIGAR A PURGA
  DA CALDEIRA" até alguém segurar "✅ Liguei a purga" por 2 s. Registra quem e
  a que horas; confirmou uma vez, some para todos. O app confere a cada minuto e
  ao voltar para a tela
- Admin/gestor não são bloqueados: veem "🔥 Purga NÃO confirmada" nos alertas do
  Painel e o registro dos últimos 7 dias em Painel › Purga da caldeira, onde
  também se liga/desliga e se muda o horário
- Opcional: lembrete no celular em Painel › Avisos ("🔥 Lembrete da purga", só
  dispara em dia de brassagem e se ainda não foi confirmada; desligado)
- Começa a valer em 27/11/2026

---

## 3.16.1 — 26/11/2026

- Corrigido: "Teste iodo" das bateladas não era salvo na ficha (o campo é uma
  lista de opções e o app só gravava as caixas de digitação da batelada).
  Agora vai em `bateladas[].iodoTeste` e volta ao reabrir. Testes marcados
  antes desta versão não foram gravados e precisam ser marcados de novo

---

## 3.16.0 — 26/11/2026

**📲 WhatsApp + 🔔 avisos no celular**

- Botão "📲" em cada dia da Programação e "📲 Semana no WhatsApp" na barra:
  monta a mensagem (brassagens com tanque/volume/bateladas/lote, envases com
  formato/qtd/tanque, barris, ✅ no que já tem resultado, "Atenção" com os
  alertas dos tanques) e abre o WhatsApp para escolher contato ou grupo.
  Dá para editar o texto ou só copiar
- Botão "📲 WhatsApp" nos alertas dos tanques (leitura atrasada, sem Clearmax
  Pro/L, sem levedura): cobrança pronta do tanque
- Painel › 🔔 Avisos no celular: ativar notificações no aparelho, teste, e
  configurar 3 avisos (programação do dia, da semana, alertas dos tanques) —
  liga/desliga, hora (5h a 22h), dias da semana e quem recebe. Tocar no aviso
  abre o app com a mensagem pronta para o WhatsApp
- Servidor: `api/avisos.js` (Web Push com chaves geradas e guardadas no banco),
  dependência `web-push`, 18 crons diários (um por hora, 5h–22h de Brasília);
  na Vercel Hobby cada um dispara dentro da hora marcada
- `sw.js` 3.16.0: recebe os avisos e abre o app ao tocar

---

## 3.15.3 — 26/11/2026

- Desenho do tanque mais estreito (60 px) e textos ao lado sem quebra de linha
  ("8.400 L", "79% de 8.300 L", "já saíram 1.720 L" ficam inteiros)

---

## 3.15.2 — 26/11/2026

**Tanques: nível estimado em desenho de tanque**

- A barra do "Nível estimado" virou um desenho de tanque cilindrocônico com a
  cerveja no nível (âmbar; vermelho abaixo de 15%), régua ao lado e o nome do tanque
- Ao lado: litros restantes, % da capacidade e quanto já saiu (barris + PET/garrafa)

---

## 3.15.1 — 26/11/2026

**Painel do gestor: escolher o mês**

- Setas ‹ mês › ao lado do título do Painel
- Mês já fechado: barras mostram o resultado final × meta ("✔ meta batida" /
  "✖ faltaram X"), sem a marca de ritmo; pendências = tudo do mês sem resultado
- Alertas e tanques continuam mostrando a situação de agora (marcados "(agora)")

---

## 3.15.0 — 26/11/2026

**Nova aba 📊 Painel (admin e gestor)**

- **Painel do gestor**: brassado, envasado e barris do mês × meta, com marca de
  "onde deveria estar hoje" (ritmo do mês); tanques ocupados por estágio;
  alertas (leitura atrasada, Clearmax/levedura sem registro, tanque em atenção,
  lançamentos pendentes, erros do app, insumos a comprar); pendências de
  lançamento (brassagens/envases de dias anteriores sem resultado); tabela com a
  situação de cada tanque
- **Relatório de quebra** (mês, 3, 6 ou 12 meses): por formato e por mês —
  unidades, litros calculados, litros pela régua, diferença régua − calculado
  (L e %), sleeves/PET/tampas perdidos (qtd e %); por lote zerado — volume,
  envasado, quebra (L e %, em vermelho acima de 5%); lista de envases com o
  motivo informado para a diferença de régua
- **Insumos × estoque**: soma o que as brassagens programadas (próximas 2/4/6
  semanas, sem resultado) vão consumir pela receita de cada estilo (malte em
  kg/batelada, lúpulo e enzimas em g/batelada, sais em g/HL) e compara com o
  estoque cadastrado ali mesmo (quantidade, unidade, mínimo). Mostra saldo
  depois das brassagens e quanto comprar
- Toda segunda-feira, ao abrir o app, admin/gestor recebem aviso se houver
  insumo para comprar/conferir
- Novo `api/estoque.js` (chave `estoque`)
- Dossiê: lote que ainda está no tanque mostra "Restante no tanque (estimado)"
  em vez de quebra

---

## 3.14.0 — 26/11/2026

**📄 Dossiê do lote (imprimir / salvar em PDF)**

- Botão "📄 Dossiê" na barra de baixo da ficha e "📄" ao lado de cada lote na aba Lotes
- Uma página só com: resumo de envase e fechamento (tanque, volume inicial,
  envasado em PET/garrafa, barris, total, quebra em L e %, data/quem zerou),
  tabela dos envases (formato, qtd, régua início → fim, litros) e barris,
  a ficha inteira (receita, sais, fermentáveis, lúpulos, mosturação, bateladas,
  volumes, OG, leituras de fermentação/maturação, Clearmax/levedura, dry hop,
  aprovação, coleta), o gráfico, e o registro de preenchimento (quem gravou o
  quê e quando)
- "🖨 Imprimir / salvar PDF" usa a impressão do navegador (A4); no celular, escolha "Salvar como PDF"

---

## 3.13.3 — 26/11/2026

**Ficha: salva só o que você alterou**

- Ao abrir, o app guarda uma "fotografia" da ficha. Ao salvar, envia junto a
  lista de campos que você realmente mudou
- Se outra pessoa salvou no meio, o servidor parte da versão dela e aplica só os
  seus campos — antes, valores antigos da sua tela podiam voltar por cima do que
  ela tinha corrigido
- Leituras (fermentação/maturação) continuam unidas linha a linha
- Corrigido: na junção antiga, o histórico de auditoria dos campos (quem
  preencheu/alterou) podia ser perdido

---

## 3.13.2 — 26/11/2026

**Ficha: aviso de quem está editando**

- Com a ficha aberta, o app avisa a cada 30 s: "👤 @rhafael também está com
  esta ficha aberta agora"
- Se outra pessoa salvar enquanto a ficha está aberta: faixa amarela
  "🔄 @pablo salvou esta ficha às 10:41 (v12) — O que você vê está
  desatualizado" com botão "Atualizar ficha" (ou "Salvar e atualizar" se
  houver alterações — o servidor junta as duas versões)
- `POST /api/ficha {acao:"presenca"}` (presença expira em 75 s)

---

## 3.13.1 — 26/11/2026

**Alerta de leitura atrasada**

- Tanque em fermentação/maturação/pronto sem leitura de temperatura há mais
  de 24 h (ou sem nenhuma leitura com 1+ dia no tanque) mostra faixa vermelha
  "⏱ LEITURA ATRASADA — há 30 h sem leitura (última: 25/11 08:10)" no card
- Resumo no topo da aba Tanques: "⏱ SEM LEITURA +24h: TQ03, TQ05"
- Aba Leituras: selo vermelho no tanque atrasado; nos demais, "última leitura
  há X h"
- Servidor calcula `ultimaLeitura` (data e horas) pelo fermLog/maturLog da
  ficha do lote

---

## 3.13.0 — 26/11/2026

**Backup diário do banco e registro de erros**

- **💾 Backups** (Relatórios, só admin): cópia automática de todo o banco
  todo dia às 03:00 (Vercel Cron → `/api/backup`), compactada, guardando 7
  dias + os 5 manuais mais recentes. Botões: fazer backup agora, ⬇ baixar
  (JSON, para guardar no Drive) e ↩ restaurar (pede "RESTAURAR"; antes faz
  um backup do estado atual)
- **🐞 Erros na tela dos usuários** (Relatórios, só admin): erros de tela,
  falhas 5xx do servidor e quedas de conexão são registrados com usuário,
  versão, aba e navegador (`/api/logs`, últimos 400)

---

## 3.12.4 — 25/11/2026

**Ficha de Produção: rascunho local, salvamento automático, trava e versões**

- **Rascunho no aparelho**: cada alteração na ficha fica guardada no próprio
  navegador (1 s após digitar). Se o app fechar, recarregar ou cair a
  internet, ao reabrir a ficha aparece "Há alterações NÃO SALVAS… Recuperar?"
- **Salvamento automático**: 15 s depois da última alteração a ficha é salva
  sozinha ("✓ Salvo automaticamente às 10:42"); ao fechar a ficha com
  alterações, salva antes. Sem internet: mantém o rascunho e tenta de novo
  em 30 s. SG inválida impede só o automático (avisa no rodapé)
- **Uma gravação por vez** (servidor): trava curta por ficha no banco — duas
  gravações simultâneas não leem mais a mesma versão; a segunda espera a
  primeira e é juntada com ela
- **🕘 Versões** (admin/gestor) no rodapé da ficha: lista as versões
  anteriores (data, quem, nº de bateladas); "Abrir esta versão" carrega na
  ficha e "Salvar Ficha" restaura
- Corrigido: salvar a ficha sem botão (ex.: ao desfazer maturação) dava erro

---

## 3.12.3 — 25/11/2026

**Ficha de Produção: nunca mais apagar o que outra pessoa salvou**

Causa do sumiço da Batelada 4 do HELLES 74/26T03: o app enviava a versão
da ficha que tinha aberto, mas o servidor **ignorava** essa informação e
gravava a ficha inteira por cima. Quem estava com a ficha aberta desde antes
e salvou depois apagou o que tinha sido gravado nesse meio-tempo.

- **Servidor junta as versões**: se a ficha foi salva por outra pessoa depois
  que a tela foi aberta, o que chega agora vale, mas nada que já estava
  gravado é apagado — campos vazios são completados com o gravado, bateladas
  a mais são mantidas e leituras (fermentação/maturação) das duas versões
  são unidas. A ficha é recarregada na tela com aviso "🔀 … juntadas"
- **Histórico de versões**: cada gravação guarda a versão anterior
  (últimas 30) em `ficha:hist:<lote>` — `GET /api/ficha?historico=1&lote=`
  lista e `&idx=N` devolve a versão
- **Atualização automática do app** não recarrega mais a tela com ficha ou
  outra janela aberta / alterações não salvas: avisa e espera fechar

---

## 3.12.2 — 24/11/2026

**Envase e barril: check único "BeerSales lançado"**

- Envases PET e barris trocam "BeerSales Prog." + "BeerSales Conc." por um
  único check "BeerSales lançado" (lista semanal, painel do dia e barris)
- Usa o mesmo campo do antigo "Conc." (lancadoBeerSales): envases já
  marcados como Conc. aparecem como lançados; relatórios mantidos
- Brassagem continua com os checks separados

---

## 3.12.1 — 24/11/2026

**Painel de Produções: status e fim do lote pelo tanque**

- Status de cada lote vem da aba Tanques: lote no tanque agora = estágio do
  tanque (fermentando / maturando / pronto); lote zerado = Encerrado. Antes
  vinha do campo status da ficha, quase sempre vazio → tudo "Fermentando"
- Sem tanque nem zerado: usa o status da ficha; lote com mais de 40 dias sem
  registro vira Encerrado ("sem zerado")
- Barra termina no **zerado do tanque** (fim real); lote ainda no tanque vai
  até hoje; sem zerado, até o último envase (antes: +28 dias fixos)
- Abaixo do status: tanque e data do zerado (ex.: "TQ05 · zerado 21/11")
- "Ativos" passa a contar só lotes realmente no tanque
- Nova rota `GET /api/tanques?acao=lotesStatus`

---

## 3.12.0 — 24/11/2026

**Programação (semana): layout compacto**

1. **Barra fixa no topo** com os dias (SEG 23 · 3 itens, ⏳ pendentes,
   ⚠ atrasados); clique leva direto ao dia. Hoje em verde
2. **Cards compactos**: estilo, lote, tanque e volume + resumo
   (✔ 4/7 checks · ⏳ sem resultado / ✔ resultado lançado) e atalho
   "Lançar resultado"; checks, tarefas, resultado e botões aparecem ao
   clicar no card ("detalhes ▾")
3. **Dias passados sem pendência recolhidos** (clique no cabeçalho abre);
   dia de hoje destacado; ao abrir a semana atual a tela rola até hoje
4. **Filtros**: Todos / 🍺 Brassagem / 📦 Envase / 🛢 Barril e
   ⏳ Só pendentes; "⤢ Expandir tudo"
- Botão **☰ Layout clássico** volta à lista anterior (e "▤ Layout compacto"
  retorna); preferência salva no navegador de cada usuário
- Implementado por cima da lista existente (`_progAplicarLayout`), sem mudar
  dados nem a montagem dos cards

---

## 3.11.3 — 24/11/2026

**Planejador: ciclo mínimo e antecipação (sextas-feiras)**

- Novo parâmetro "Ciclo mínimo no tanque (dias)" — padrão 10, editável
- Quando o ciclo máximo vence no fim de semana/feriado ou num dia sem
  bateladas livres, a brassagem é **antecipada** (do dia mais tarde ao mais
  cedo, sem passar do mínimo) antes de ser adiada — ex.: vence no sábado →
  sexta. Antes, tudo ia para segunda e as sextas ficavam vazias
- Resumo dos parâmetros mostra o ciclo como faixa (ex.: "ciclo 10–12d")
- Tanque de dois dias (TQ05) só usa dias seguidos de calendário — não começa
  na sexta e termina na segunda

---

## 3.11.2 — 24/11/2026

**Lote nas brassagens da Programação**

- Card de brassagem da lista semanal mostra "Lote: HELLES 77/26T03" antes do
  tanque e do volume previsto (também na busca por lote)

---

## 3.11.1 — 23/11/2026

**OG do resultado da brassagem calculada das bateladas**

- No Resultado da brassagem, a OG vem preenchida com a média das OG reais das
  bateladas da ficha, **ponderada pelo volume** de cada uma
  (ex.: Bat.1: 1.048 (1100 L) + Bat.2: 1.046 (1150 L) → média 1.047)
- Com todas as bateladas com OG, o campo fica travado como o volume; se
  faltar OG em alguma, preenche com as disponíveis, avisa qual falta e deixa
  editar
- Ficha passa a gravar `ogReal` em cada batelada (fichas antigas: a OG é
  localizada entre os campos da batelada)

---

## 3.11.0 — 19/11/2026

**Sigla do lote por estilo (Munich Helles → HELLES)**

- Estilo (nome técnico da receita) e sigla do lote passam a ser coisas
  separadas. Nova tabela "Sigla do lote por estilo" em ⚙ Parâmetros do
  planejador, preenchida automaticamente com a sigla mais usada nos lotes das
  fichas daquele estilo (ou sugestão: HELLES, RED ALE, IPA, SEM ALCOOL,
  EXPORT…); editável e salva (admin/gestor)
- Lotes gerados pelo planejador e pela Nova brassagem usam a sigla e seguem a
  numeração existente: HELLES 77/26T01 (antes MUNICH HELLES 01/26T01)
- A sigla vale como apelido do estilo: "Helles" é reconhecido como
  "Munich Helles" (validação da brassagem, planejador, insumos)
- Planejador: brassagens já programadas com outro nome do mesmo estilo são
  descontadas da necessidade certa
- Resumo da visão mês agrupa brassagens pela sigla (Helles + Munich Helles =
  HELLES)
- Correção: não mostra mais "Faltam X L" quando o previsto já passa da meta;
  se só algum estilo ficou sem cobertura, lista qual

---

## 3.10.12 — 19/11/2026

**Gráfico da Ficha de Produção igual ao dos Registros**

- Aba Gráficos da ficha passa a usar o mesmo gráfico dos Registros de
  Fermentação e Maturação: temperatura real/set, pressão, SG (ferm) e CO₂
  (matur), com as escalas fixas, faixas ideais (lager/ale), tooltip com SG
  de 3 casas e aviso de escala ampliada
- Usa as leituras da ficha aberta, inclusive as ainda não salvas
- Substitui o gráfico desenhado à mão (fundo escuro)

---

## 3.10.11 — 19/11/2026

**Busca por lote nos Registros de Fermentação e Maturação**

- Campo "🔎 Buscar lote…" ao lado do filtro de datas, com sugestões dos lotes
  das fichas; aceita parte do lote (ex.: "66/26", "T05", "RED ALE")
- Mostra só os lotes encontrados (tabela + gráfico), ignorando o período —
  busca também lotes antigos, fora das 30 fichas mais recentes
- Faixa informativa com os lotes encontrados e "limpar busca"
- Enter busca; limpar o campo volta à visão por período

---

## 3.10.10 — 19/11/2026

**Ficha de Produção: SG só com ponto**

- SG do acompanhamento da fermentação e OG real das bateladas aceitam só
  valores entre 0.980 e 1.200 (ex.: 1.010)
- Ao sair do campo com 1010 (ou similar), o campo fica vermelho e aparece
  "SG inválida: use ponto e 3 casas — Ex.: 1.010 em vez de 1010"
- "Salvar Ficha" é bloqueado enquanto houver SG fora do padrão; a tela rola
  até o primeiro campo errado

---

## 3.10.9 — 19/11/2026

**SG com 3 casas nos registros**

- Tabela, tooltip e eixo do gráfico mostram a densidade com 3 casas e ponto
  (1.048, 1.010) — antes 1.04 / 1.01
- SG digitada como 1048 é exibida como 1.048

---

## 3.10.8 — 19/11/2026

**Gráfico de registros mais alto**

- Altura fixa de 320 a 460 px (≈ metade da tela), em vez de proporcional à
  largura — escalas, marcas de 0,2 kgf e faixas ideais ficam legíveis

---

## 3.10.7 — 19/11/2026

**Faixa ideal de fermentação por família do estilo**

- Lagers: 10–14 °C · Ales: 18–24 °C (faixa pintada no gráfico de registros)
- Família pelo estilo do lote: Helles, Pilsen, Export, Dortmunder, Bock,
  Märzen, Vienna, Dunkel, Keller… = lager; Ale, IPA, APA, Stout, Porter,
  Weiss/Weizen, Saison, Kölsch… = ale
- Estilo sem pista no nome: usa a temperatura de set da fermentação
  (mediana ≥ 16 °C = ale; senão lager)

---

## 3.10.6 — 19/11/2026

**Gráfico de Registros de Fermentação e Maturação com escala fixa**

- Escalas fixas, iguais para todos os estilos e lotes:
  temperatura −2 a 30 °C (a cada 2), pressão 0 a 3 kgf/cm² (a cada 0,2),
  densidade 1,000 a 1,060 (a cada 0,010), CO₂ 0 a 3,5 vol (a cada 0,5)
- Valor fora da faixa: a escala abre só naquele lote, com aviso
  "⚠ Escala ampliada neste lote"
- Faixas ideais pintadas no fundo: fermentação 10–14 °C, pressão 0,8–1,2,
  CO₂ 2,4–2,7 (valores iniciais, ajustáveis em FAIXAS_GRAFICO)

---

## 3.10.5 — 18/11/2026

**Planejador: desfazer um lançamento**

- Cada "Programar selecionadas" vira um lançamento identificado (planId) e
  fica listado no planejador em "📜 Lançamentos do planejador neste mês"
  (data/hora, quem, brassagens, litros)
- "↩ Desfazer" (admin/gestor) remove da programação todas as brassagens
  daquele lançamento que ainda não têm resultado; as já brassadas são
  mantidas e listadas
- Encontra também brassagens do lançamento que tenham sido movidas de semana
  dentro do mês
- Novas ações: `remover_plano` (api/prog.js); `planLanc`, `planLancDesfeito`
  e `?lancamentos=1` (api/metas.js)

---

## 3.10.4 — 18/11/2026

**Planejador: bateladas por tanque**

- Novo parâmetro "Bateladas para encher cada tanque" (⚙ Parâmetros): TQ05
  vem com 9; os demais usam capacidade ÷ L/batelada arredondado, sem passar de
  ~1.600 L por batelada (TQ01–04 = 6, TQ06 2.000 L = 2, TQ07 3.000 L = 2)
- Volume parcial usa bateladas proporcionais ao tanque (ex.: 6.000 L no TQ01
  = 5 bat.)
- Tanque com mais bateladas que o dia (TQ05: 9 > 6) ocupa dois dias seguidos
  (6 + 3); os demais terminam no mesmo dia (substitui a folga de 10% da 3.10.3)

---

## 3.10.3 — 18/11/2026

**Planejador: tanque termina no mesmo dia**

- Brassagem que cabe num dia de produção (bateladas/dia × L/batelada, com 10%
  de folga — ex.: 9.000 L em 6 bateladas) é programada inteira num único dia;
  se o dia já tem bateladas ocupadas e não sobra o suficiente, vai para o
  próximo dia com espaço
- Só tanques maiores que um dia de produção (ex.: TQ05 14.000 L) continuam
  ocupando dias seguidos

---

## 3.10.2 — 18/11/2026

**Estilos vêm das receitas cadastradas**

- Lista única de estilos montada a partir das receitas (campo Estilo; sem
  repetir — várias receitas de Helles viram um único "Helles")
- Planejador: necessidade por estilo e estilo de cada brassagem sugerida
  passam a ser escolhidos nessa lista (estilos repetidos se somam)
- Nova brassagem: o campo Estilo sugere os estilos cadastrados; ao salvar,
  corrige a grafia para a cadastrada ("helles" → "Helles") e bloqueia estilo
  sem receita (admin/gestor podem confirmar)
- Insumos: a receita é localizada primeiro pelo estilo exato

---

## 3.10.1 — 18/11/2026

**Planejador: volume e tanque certos para estilos menores**

- Antes, todo estilo enchia o tanque inteiro e o estilo era escolhido sem
  olhar o tamanho do tanque (ex.: Sem Álcool 1.000 L sugerido com 3.000 L;
  American IPA 2.000 L num tanque de 8.000 L)
- Agora os estilos menores entram primeiro, com o volume da necessidade (até
  a capacidade), no **menor tanque que comporta**; o estilo principal enche
  os tanques que sobram, e a última brassagem dele usa só o que falta
- Capacidade diária em **bateladas** (6/dia): dá para brassar mais de um lote
  no mesmo dia (ex.: 1 bat. de Sem Álcool + 5 de Helles); lote maior que o
  dia continua no dia útil seguinte
- Coluna de volume mostra bateladas e capacidade do tanque; campo de lote mais largo

---

## 3.10.0 — 18/11/2026

**🧠 Planejador de brassagens (aba Programação)**

- Sugere as brassagens do mês escolhido (atual + 2 seguintes): para cada
  tanque calcula quando fica livre (última brassagem/fila + ciclo + CIP) e
  ocupa o primeiro dia útil livre, sempre com o tanque que libera primeiro
- Dias úteis: segunda a sexta (sábado opcional), sem feriados; pontos
  facultativos aparecem marcados (◐); dias que já têm brassagem são respeitados
- Tanque maior que um dia de produção (bateladas/dia × L/batelada) ocupa dias
  seguidos (ex.: TQ05 14.000 L = 2 dias)
- Necessidade por estilo do mês (Helles + outros estilos), salva por mês;
  sem necessidade cadastrada usa a meta de brassagem da aba Metas
- Resumo: previsto × meta, já programado, capacidade máxima e o que falta,
  com o gargalo explicado
- Lotes numerados na sequência do estilo/ano (ex.: HELLES 81/26T01);
  estilo, volume e lote editáveis antes de programar
- "✅ Programar selecionadas" cria as brassagens marcadas (admin/gestor)
- **Parâmetros da fábrica** editáveis (admin/gestor): ciclo máximo no tanque
  (15 d), intervalo p/ CIP (1 d), bateladas por dia (6), litros finais por
  batelada (1.450), brassar aos sábados. O ciclo passa a valer para o app
  todo: limite dos cards de tanque, alerta amarelo (ciclo − 3), estágio
  "atenção" no servidor e avisos de conflito
- Config e necessidade gravadas via api/metas.js (`?config=1`, `?demanda=1`)

---

## 3.9.0 — 18/11/2026

**Programação: sete melhorias**

1. **Tanque e lote do envase** — no painel do dia (visão mês) o tanque do
   envase passa a ser escolhido numa lista e o lote vem do tanque; salvar
   exige tanque e lote. Envases antigos sem tanque/lote mostram
   "⚠️ Sem tanque/lote — não desconta do tanque"
2. **Conflito de tanque** — ao programar ou mover uma brassagem, avisa se o
   lote atual do tanque ainda não terá completado o ciclo (~15 d) na data, ou
   se já há outra brassagem prevista no mesmo tanque a menos de 15 dias
3. **Atrasados** — itens com data passada e sem resultado ficam com borda
   vermelha e "⚠️ Atrasado Xd"; quadro no topo lista os atrasados das últimas
   6 semanas (clique leva à semana); na visão mês o traço fica contornado
4. **Sugestão de quantidade no envase** — mostra o volume no tanque, os
   envases já programados do lote e quantas unidades cabem no formato
   (com excedente), com botão "usar"
5. **🧾 Insumos** — soma fermentáveis, lúpulos e levedura das brassagens sem
   resultado da semana em tela + seguinte, pelas receitas cadastradas
   (qtd por batelada × volume previsto ÷ volume da receita); botão copiar
6. **Feriado** — brassagem, envase ou "mover" em feriado/ponto facultativo
   pedem confirmação
7. **📅 Mover** — botão em cada brassagem/envase sem resultado para trocar o
   dia sem editar o resto (nova ação `mover` em api/prog.js)

---

## 3.8.41 — 18/11/2026

**Bateladas sobrepostas: volume pendente em vez de bloqueio**

- "+ Adicionar batelada" volta a funcionar mesmo sem o volume da anterior
  (a próxima batelada começa antes do volume final da anterior)
- A batelada sem volume fica com os campos em vermelho e aparece o aviso
  "⏳ Volume pendente: Batelada 1, 2…" abaixo da lista
- A obrigatoriedade continua no resultado da brassagem: sem todos os
  volumes, o operador não salva (admin/gestor com confirmação)

---

## 3.8.40 — 18/11/2026

**Volumes das bateladas obrigatórios**

- Ficha do Lote: "+ Adicionar batelada" só abre a próxima quando a anterior
  tem Vol. inicial e Vol. final preenchidos (campos vazios ficam em vermelho)
- Resultado da brassagem: operador não consegue salvar se faltar volume em
  alguma batelada da ficha, ou se a ficha não tiver bateladas
- Admin/gestor pode salvar mesmo assim, com confirmação
- Resultados de brassagem já lançados podem ser editados sem o bloqueio

---

## 3.8.39 — 18/11/2026

**Ano na visualização mês da Programação**

- Título grande acima do calendário: "NOVEMBRO DE 2026"
- Navegação de mês mostra "Novembro 2026" (‹ ›), inclusive ao passar de
  dezembro para janeiro do ano seguinte
- Correção: ‹ › de mês podia ficar no mesmo mês quando a semana começava no
  mês anterior (ex.: a partir de 02/11 ia para 30/11 e continuava em novembro);
  agora sempre vai para a primeira segunda-feira do mês seguinte/anterior

---

## 3.8.38 — 18/11/2026

**Feriados na Programação — visualização mês**

- Cada dia de feriado aparece com o nome (🎌) e fundo vermelho claro; pontos
  facultativos (◐ Carnaval, Cinzas, Corpus Christi) em laranja claro
- Calendário: nacionais fixos (inclui Consciência Negra 20/11), Sexta-feira
  Santa calculada pela Páscoa e Revolução Farroupilha (RS, 20/09)
- Ao clicar no dia, o título do detalhe mostra o feriado
- Legenda do calendário ganhou "Feriado" e "Ponto facultativo"

---

## 3.8.37 — 18/11/2026

**Correção: brassagem de hoje aparecia em AGORA e em PRÓXIMO ao mesmo tempo**

Em tanque zerado, a brassagem prevista para hoje era mostrada no bloco
AGORA ("Brassagem prevista") e também como Fila 1º em PRÓXIMO (ex.: TQ05,
HELLES 71/26T05). Agora ela fica só em AGORA; PRÓXIMO começa na brassagem
seguinte.

---

## 3.8.36 — 17/11/2026

**Alertas de Clearmax L e levedura nos tanques**

- O aviso do card passa a ter três linhas, lidas da Ficha de Produção:
  Clearmax Pro, Clearmax L e Levedura
- Registrado: linha verde com data/hora, dose (ou geração/temperatura da
  levedura) e quem lançou
- Não registrado: faixa vermelha grande piscando
  ("SEM CLEARMAX L REGISTRADO", "SEM LEVEDURA REGISTRADO"…)
- Resumo no topo: um aviso vermelho por item faltante, com os tanques
  ("🚫 SEM LEVEDURA: TQ03")

---

## 3.8.35 — 17/11/2026

**Alerta de Clearmax Pro nos tanques (garantia de glúten)**

- Cada card de tanque com lote mostra um aviso grande, lido da Ficha de
  Produção do lote:
  - 🌾 **CLEARMAX PRO APLICADO** (verde): data/hora, dose e quem aplicou
  - 🚫 **SEM CLEARMAX PRO REGISTRADO** (vermelho, piscando): lote sem
    garantia de glúten; pede para confirmar na Ficha do Lote
- Resumo no topo da aba: "🚫 N lotes SEM Clearmax Pro: TQxx…" ou
  "🌾 Clearmax Pro OK em todos os lotes"
- Tanques livres e brassagem prevista para hoje não mostram o aviso

---

## 3.8.34 — 16/11/2026

**Correção: nível início pegava o envase errado quando havia dois no mesmo dia**

- Com mais de um envase do lote na mesma data, o nível início usava o fim do
  primeiro (ex.: TQ05 veio 12.157,2 L em vez de partir de 9.956,8 L). Agora
  usa o de menor nível fim, que é sempre o último (a régua só desce)
- Barris do mesmo dia do envase anterior: passa a comparar o horário de
  lançamento do barril com o horário do resultado do envase, para descontar
  só os barris lançados depois dele

---

## 3.8.33 — 13/11/2026

**Correção: barris não chegavam ao histórico dos tanques**

`api/tanques.js` lia os barris na chave `prog:barril-AAAA-MM-DD`, mas
`api/prog.js` grava em `prog:barril:AAAA-MM-DD`. O histórico de cada tanque
nunca recebia barris, então o nível início automático do envase não os
descontava (TQ05 seguia em 14.200 L). Chave corrigida; os barris também
passam a aparecer no histórico do tanque.

---

## 3.8.32 — 13/11/2026

**Correção: nível início não descontava barris lançados depois da data do envase**

O nível início automático só descontava barris com data até a data
programada do envase. Barris lançados hoje para um envase programado em dia
anterior ficavam de fora (ex.: TQ05 mostrava 14.200 L em vez de 13.460 L).
Agora o limite é a data do envase ou hoje, o que for maior.

---

## 3.8.31 — 12/11/2026

**Diferença régua × calculado com validação do gestor**

No resultado do envase, quando o consumo pela régua (início − fim) difere em
1 L ou mais do calculado (unidades × (capacidade + excedente)):

- Aparece o quadro *Régua × calculado* com os dois volumes, a diferença e o
  excedente por frasco equivalente
- O motivo da diferença passa a ser obrigatório para salvar
- Admin/gestor vê a opção *Validar: usar o volume da régua na baixa do tanque*
- Validado, o nível, o saldo e a quebra do tanque usam o volume da régua
  naquele envase; sem validação, continuam usando o calculado
- Se início, fim, quantidade ou excedente forem alterados depois, a validação
  cai e precisa ser feita de novo
- O resultado na programação e o histórico do tanque mostram
  "⏳ aguardando gestor" ou "✔ régua validada"

---

## 3.8.30 — 12/11/2026

**Nível início da régua preenchido automaticamente no envase**

Ao lançar o resultado de um envase, o *Nível início (régua)* vem calculado:

- Envase anterior do mesmo lote e tanque: usa o *nível fim* que foi lançado nele,
  menos os barris do lote registrados depois daquele envase
- Primeiro envase do lote: usa o volume do lote, menos os barris já tirados
- Abaixo do campo aparece de onde veio o número
- Continua editável; se o operador digitar, o valor dele prevalece
- Resultados já salvos mantêm o nível início gravado

---

## 3.8.29 — 12/11/2026

**Correção: "Tanque zerado" voltava para Maturando**

Desde o envio de 12/11, o zerado era ignorado sempre que o tanque tinha
qualquer brassagem anterior, e o tanque voltava para Maturando/Fermentando.
Agora o zerado vale até que uma brassagem nova seja realizada no tanque
no mesmo dia do zerado ou depois dele. Brassagens anteriores ao zerado
(o lote que foi esvaziado) não desfazem mais o zerado.

---

## 3.8.28 — 12/11/2026

**Saldo e quebra do tanque pelo volume real envasado**

O saldo do tanque, a quebra calculada ao zerar e os litros de cada envase no
histórico do tanque passam a contar cada frasco PET pelo volume real
(capacidade + excedente), não mais pelo nominal.

- Usa o excedente gravado no lançamento
- Lançamentos antigos sem excedente, ou com os padrões antigos (5 / 10 / 20 ml),
  passam a usar o padrão medido: 500ml 34 ml · 1L 34 ml · 2L 12 ml
- Metas de envase continuam em unidades e litros nominais (volume vendido)

---

## 3.8.27 — 12/11/2026

**Excedente por frasco atualizado com a pesagem real**

O campo *Excedente por frasco (ml)* do resultado de envase passa a vir
preenchido com o enchimento medido na balança (frasco cheio − frasco vazio,
densidade 1,010):

| Formato | Volume real | Excedente padrão |
|---|---|---|
| PET 500ml | ~534 ml | 34 ml (antes 5) |
| PET 1L | ~1034 ml | 34 ml (antes 10) |
| PET 2L | ~2012 ml | 12 ml (antes 20) |

O valor continua editável em cada lançamento, e resultados já salvos mantêm
o excedente que foi gravado neles.

---

## 3.7.0 — 20/10/2026

**Sistema de auditoria de lançamentos na Ficha de Produção**

Cada campo preenchível na ficha agora registra quem fez o lançamento e quando.
As informações ficam disponíveis inline e em painéis de histórico por seção.

- Todo campo `input`, `select` e `textarea` da ficha recebe uma chave de auditoria
  única ao ser criado
- Ao confirmar uma alteração (ao sair do campo), o sistema registra o usuário
  logado, o horário (ISO 8601) e o valor informado
- Um *badge* compacto aparece abaixo de cada campo com o último editor e o horário
  relativo ("há 2 min", "ontem", etc.)
- Cada seção e cada batelada ganha um botão **Histórico de lançamentos** que abre
  um painel com todos os registros daquela área, em ordem cronológica decrescente
- As chaves de auditoria são salvas junto com os valores (`{vals, keys}` por linha)
  para sobreviver a ciclos de salvar e restaurar fichas
- Retrocompatível: fichas antigas no formato de array simples continuam abrindo
  normalmente

---

## 1.7.4 — 28/07/2026

**Correção: procedimento não abria no celular (mesmo na versão correta)**

A base de referência só era carregada automaticamente ao entrar se alguma
tarefa tivesse o campo *vínculo* preenchido. Tarefas com procedimento (POP)
ou código de parâmetro, mas sem vínculo, não disparavam o carregamento —
e a aba Procedimentos ficava vazia.

No PC a base era carregada por outro caminho (abrir a aba Banco de dados);
no celular isso não acontecia, causando a mensagem "A aba Procedimentos não
está publicada" mesmo estando configurada.

- A verificação de carregamento automático passa a incluir tarefas com
  `pop` ou `paramCodigo`, não só `vinculo`
- O botão "Ver procedimento" carrega a base sob demanda se ainda não estiver
  carregada, em vez de mostrar erro imediatamente
- Mensagem de erro melhorada para orientar o que fazer

---

## 1.7.3 — 27/07/2026

**Correção: celular ficava preso na versão antiga do app**

Quando uma versão nova era publicada, o PC atualizava normalmente mas o
celular continuava mostrando a versão antiga — porque o service worker antigo
permanecia ativo enquanto o app ficasse aberto em background (o Android raramente
fecha abas do navegador).

- O sw.js passa a aceitar a mensagem `PULAR_ESPERA`, que faz o novo service
  worker assumir imediatamente em vez de esperar o app ser fechado e reaberto
- O app detecta quando um sw novo terminou de instalar e envia essa mensagem
- Quando o sw novo assume o controle, a página recarrega automaticamente

Na prática: o celular vai atualizar sozinho assim que detectar que há uma versão
nova, sem precisar fechar e reabrir o app.

---

## 1.7.2 — 27/07/2026

**Correção: layout das tarefas de demanda no celular**

O botão "+ Adicionar" estava cortado, o contador ficou grande e desalinhado, e
os ícones de editar/remover estavam soltos. Reestruturado o HTML e o CSS:

- Nome, descrição e registros ocupam a largura total
- Contador pequeno e botão "+ Adicionar" ficam numa linha de rodapé,
  alinhados e sem corte
- Ícones ✏ e × agrupados dentro de cada registro, sem vazar para fora

---

## 1.7.1 — 27/07/2026

**Correção crítica: app travava em "Carregando..."**

O modal dos registros de demanda foi inserido depois do `</script>` em vez de
antes. O browser executa o script imediatamente ao encontrá-lo, antes de
renderizar o que vem depois — então `$("btnDemSalvar")` e os outros elementos
do modal não existiam ainda, causando erro de runtime que impedia o app de
iniciar.

- Modal movido para antes do `<script>`
- `dispatchEvent` na inicialização protegido com try/catch

---

## 1.7.0 — 27/07/2026

**Registros com data e observação nas tarefas de demanda**

Antes, as tarefas "conforme demanda" guardavam apenas o número de adições. Agora
cada clique em "+ Adicionar" abre um formulário com data/hora (pré-preenchida com
o momento atual) e um campo de observação livre.

- A lista de registros aparece dentro da tarefa, com a data e a observação de
  cada ocorrência
- Cada registro pode ser editado (✏) ou removido (×) individualmente
- O contador numérico é mantido em sincronia para compatibilidade com o
  relatório e a visão da equipe
- Tarefas com registros antigos (só o número) são migradas automaticamente —
  elas aparecem com "(sem data)" até que um novo registro seja adicionado
- A visão ampla do operador (aba Equipe) mostra a lista de registros com data

---

## 1.6.5 — 27/07/2026

**Correção: aba Equipe (e outras) invisível no celular**

Em telas estreitas a barra de abas não cabia numa linha, e os botões que
não coubessem simplesmente sumiam. No print: Hoje, Semana, Minhas Tarefas,
Banco de Dados, Relatórios eram visíveis — Equipe ficava fora da tela.

- A barra de abas agora rola horizontalmente (sem barra de rolagem visível)
- Ao trocar de aba, o botão ativo rola para o centro automaticamente
- Botões nunca quebram o texto nem comprimem abaixo do tamanho mínimo
- Os botões A–Z e ↩ semana atual foram movidos para uma linha separada,
  abaixo das abas, liberando espaço na barra

---

## 1.6.4 — 25/07/2026

**Mudança de papel sem perda de dados**
- Botão "papel" na lista de equipe (só para o administrador)
- Permite mudar qualquer pessoa entre Colaborador, Gestor e Administrador
- Tarefas, ciclos e histórico de marcações são preservados integralmente
- Não é permitido alterar o próprio papel

---

## 1.6.3 — 24/07/2026

**Novo papel: Gestor**

Nível intermediário entre colaborador e administrador.

O que o gestor **pode** (além do colaborador):
- Criar e editar tarefas para outras pessoas da equipe
- Importar tarefas da planilha para qualquer pessoa
- Ver o acompanhamento da equipe (percentual, pendências, visão ampla)
- Gerar o resumo para WhatsApp
- Sincronizar a equipe com a planilha

O que o gestor **não pode** (exclusivo do admin):
- Criar, remover ou redefinir senha de usuários
- Criar um acesso com papel de administrador
- Ver os relatórios históricos (cumprimento por semana)
- Usar o botão "Vincular tarefas antigas"

Para criar um gestor: aba Equipe → Novo acesso → Perfil: Gestor.
(Somente o administrador cria acessos de qualquer papel.)

---

## 1.6.2 — 24/07/2026

**Correção: marcar na aba Semana não atualizava a aba Hoje**

As duas abas mostram o mesmo estado, mas os handlers da Semana redesenhavam
apenas as próprias listas. O da aba Hoje já chamava `renderTudo()` — por isso
o sentido inverso funcionava.

- Todos os pontos de marcação passam a redesenhar as duas abas
- Vale para diárias, semanais, quinzenais, lembretes e contadores

**Correção: vínculo e lembrete não salvavam pela aba Hoje**

Encontrado no mesmo caminho. O tratamento de *escolher o item da base* e
*confirmar o lembrete* estava preso ao painel da Semana — escolher o tanque
pela tela Hoje não gravava nada.

- Medição, vínculo e lembrete agora são tratados num listener único, válido em
  qualquer aba

---

## 1.6.1 — 24/07/2026

**Correção: a sincronização apagava o que era configurado no app**

Marcar uma tarefa como prioritária funcionava, mas a configuração sumia poucos
segundos depois — na sincronização automática seguinte.

Causa: a sincronização sobrescrevia **todos** os campos da tarefa, inclusive os
que não têm coluna na planilha. Sem a coluna, a planilha era lida como se
dissesse "vazio", e o valor definido no app era apagado.

Afetava seis campos: prioridade, criticidade, medição, unidade, código do
parâmetro e procedimento (POP) — ou seja, praticamente tudo que veio da 1.3.0
e da 1.6.0.

- A planilha agora só governa os campos que **realmente têm coluna**. Coluna
  ausente significa que ela não opina, e o valor do app é preservado
- Criando a coluna correspondente, a planilha volta a mandar naquele campo
- O diagnóstico da aba Equipe passou a listar quais campos vêm da planilha e
  quais ficam por conta do app

---

## 1.6.0 — 24/07/2026

**Prioridade**
- Nova opção na tarefa: *Prioritária*
- Ponto vermelho ao lado do nome e barra vermelha na lateral
- Sobe para a primeira posição nas telas Hoje e Semana
- Diferente de *Crítica*: prioridade é ordem de execução, criticidade é
  consequência de atrasar (alerta e escalonamento). Podem ser usadas juntas

**Ordenação alfabética**
- Botão **A–Z** na barra do topo, ao lado da navegação de semanas
- Alterna entre a ordem de cadastro e a ordem alfabética
- Respeita acentuação portuguesa (Álcool antes de Lançar antes de Órgão)
- Prioritárias continuam no topo nos dois modos
- A escolha fica salva no aparelho

**Voltar para a semana atual**
- Botão **↩ semana atual** ao lado das setas
- Aparece só quando se está em outra semana

**Correção importante**
- Os campos de **medição, unidade, código do parâmetro, procedimento (POP) e
  criticidade** existiam no formulário desde a 1.3.0, mas **nunca eram
  enviados ao servidor** — preencher não surtia efeito. Agora são salvos,
  recarregados ao editar e limpos ao criar nova tarefa

---

## 1.5.0 — 24/07/2026

**Registro de data e hora nas marcações**
- Toda marcação passa a guardar quando foi feita, e o horário aparece ao lado
  da tarefa: *"✓ marcada em 24/07 às 14:32"*
- Na grade semanal, a hora aparece embaixo do check e o dia completo no
  tooltip
- A hora registrada é a do aparelho no momento do clique — não a de quando o
  registro chegou ao servidor. A diferença importa em marcação offline
- Semanas antigas, sem esse campo, continuam abrindo normalmente

**Visão ampla por operador** (aba Equipe)
- Botão *ver todas as tarefas* em cada pessoa, abrindo a lista completa da
  semana: feitas e por fazer, agrupadas por frequência
- Diárias aparecem como faixa de cinco dias, cada um com ✓, a leitura numérica
  quando houver, e a hora da marcação
- Semanais, quinzenais e lembretes mostram *em aberto* ou o horário
- Quinzenal em dia é identificada como tal, em vez de contar como pendência
- Sob demanda mostra a contagem de registros
- Tarefas críticas ficam sinalizadas

**Outros**
- Aba *Base* renomeada para **Banco de dados**
- Ferramenta `montar-base-csv-urls.html` reduzida às quatro abas que o app
  realmente lê: Tanques, Tarefas Padrão, Parâmetros de Processo e Procedimentos

---

## 1.4.2 — 24/07/2026

- O campo **Procedimento (POP)** nunca era preenchido: ficava só com "Nenhum",
  mesmo com a aba Procedimentos publicada. Agora carrega os processos da base
- O campo **Código do parâmetro** ganhou sugestões enquanto se digita,
  puxadas da aba Parâmetros de Processo

---

## 1.4.1 — 24/07/2026

**Correção da falha que eu mesmo introduzi na 1.4.0**

Recomendei acrescentar a coluna "Código" à planilha — e isso desligava em
silêncio todos os vínculos existentes. Motivo: com a coluna, a chave da
planilha passa a ser o código, enquanto as tarefas já atribuídas continuavam
carimbadas pelo nome. As duas pontas deixavam de se encontrar.

- O pareamento agora tenta o **código** e, não achando, cai no **nome** —
  carimbando o código na tarefa. Depois disso, renomear na planilha funciona
- **Vincular tarefas antigas**: adota de uma vez as tarefas importadas antes
  da 1.2.0, que nunca receberam carimbo de origem
- **Religação manual**: quando a tarefa perdeu o vínculo E o nome já mudou na
  planilha, não sobra chave nenhuma. O relatório agora lista essas tarefas com
  um seletor das linhas livres, para ligar à mão
- O diagnóstico passou a listar as tarefas sem par, com o motivo de cada uma

---

## 1.4.0 — 23/07/2026

**Por que a sincronização parecia não funcionar**

Dois motivos, corrigidos:

1. *A falha era invisível.* Se a aba "Tarefas Padrão" não estivesse publicada,
   ou faltasse uma coluna, a sincronização automática engolia o erro em
   silêncio — sem aviso, sem log, sem pista. Agora existe um diagnóstico na
   aba Equipe que diz em português o que está errado e o que fazer.
2. *Renomear a tarefa na planilha quebrava o vínculo.* Sem a coluna Código, o
   pareamento é feito pelo nome; mudou o nome, o app não reconhece mais.

**Sincroniza com mais frequência**
- Ao abrir o app, ao voltar para a aba, ao recuperar a conexão e a cada 4
  minutos com o app aberto
- Quando o **administrador** abre o app, a equipe inteira é sincronizada de
  uma vez — não é preciso esperar cada pessoa abrir

**Diagnóstico da sincronização** (aba Equipe, só admin)
- Quais abas estão publicadas e qual foi usada
- Quantas linhas foram lidas e quantas tarefas atribuídas acharam par
- Aviso quando há tarefas sem par (quase sempre nome alterado na planilha)
- Aviso quando falta a coluna Código

---

## 1.3.0 — 23/07/2026

Cinco melhorias de adoção. A ideia por trás de todas: tirar atrito de quem
executa e dar utilidade à tarefa, em vez de só cobrar.

**Funciona sem internet**
- Marcação grava no aparelho primeiro e sobe depois — o clique nunca depende
  da rede
- Indicador discreto no topo mostra "sem rede" ou quantas marcações estão
  pendentes de envio; some sozinho quando tudo sobe
- Service worker permite ABRIR o app sem sinal, com a última versão salva
- Sem cópia local da semana, o app avisa em vez de mostrar tela vazia

**Tela Hoje** (agora é a aba inicial)
- Só as tarefas do dia, em cartões grandes, sem grade
- Pendências de dias anteriores aparecem agrupadas à parte
- Itens críticos sobem para o topo da lista
- A visão semanal continua na aba "Semana"

**Registro de leitura**
- Tarefas de medição ganham campo numérico em vez de um simples check
- Ligando a tarefa a um código da aba *Parâmetros de Processo*, o app mostra a
  faixa aceitável e avisa na hora quando o valor sai dela
- Aceita vírgula decimal e valores negativos

**Procedimento dentro da tarefa**
- Tarefa pode apontar para um POP da aba *Procedimentos*
- Um toque abre os passos na ordem, com IMPORTANTE / ATENÇÃO / PROIBIDO
  destacados

**Escalonamento do crítico**
- Tarefa pode ser marcada como crítica
- Críticos em aberto viram alerta no topo da tela Hoje e entram destacados no
  resumo do WhatsApp
- Sem notificação por push: isso exigiria serviço externo, conta e chave de API

**Correções**
- A tela Hoje não entrava na troca de abas e ficava visível em todas
- `renderHoje()` nunca era chamada — o painel abria vazio
- O service worker existia no projeto mas nunca era registrado

---

## 1.2.1 — 23/07/2026

- Relatórios passaram a ser exclusivos do administrador: a aba não aparece
  para colaboradores e o endpoint recusa o acesso, mesmo por URL direta
- Cada pessoa continua vendo o próprio percentual da semana na barra do topo

---

## 1.2.0 — 23/07/2026

**Sincronização com a planilha**

Antes, a importação copiava as tarefas: editar a planilha depois não mudava
nada para quem já as tinha atribuídas. Agora existe vínculo de verdade.

- Ao abrir o app, cada pessoa recebe automaticamente as alterações feitas na
  planilha desde o último acesso
- Aba *Equipe* ganhou **Ver o que mudaria** (prévia, sem gravar) e
  **Sincronizar equipe** (aplica em todos)
- O ID da tarefa nunca muda — **todo o histórico de marcações é preservado**
- Só mexe em tarefas vindas da planilha; o que a pessoa criou fica intacto
- Linha nova na planilha é relatada, não criada. Linha removida é relatada,
  nunca apagada — apagar levaria junto o histórico de quem já cumpriu
- Coluna **Código** passou a ser reconhecida (opcional): com ela, dá para
  renomear a tarefa na planilha sem perder o vínculo

**Correção — linhas sumindo da Base**

O leitor de CSV descartava em silêncio qualquer linha com a primeira coluna
vazia, e também as que tinham só um campo preenchido. Numa planilha com o
código em branco a partir de certo ponto, a aba Base parava de mostrar
registros sem avisar. Agora toda linha com qualquer célula preenchida é lida,
e as colunas são alinhadas ao cabeçalho.

**Por baixo do capô**

- Leitura da planilha movida para `api/_base.js`, compartilhada entre a aba
  Base e a sincronização — as duas não têm mais como divergir
- Novo endpoint `api/sync.js`

---

## 1.1.0 — 23/07/2026

Cinco melhorias que estavam no radar.

**Acompanhamento da equipe** (aba *Equipe*)
- Percentual da semana por pessoa, com barra colorida e lista do que está em
  aberto
- Botão que gera um resumo em texto pronto para colar no WhatsApp

**Relatórios** (aba nova)
- Tabela de cumprimento por pessoa nas últimas 4, 8, 12 ou 26 semanas
- Média do período e cores por faixa (verde ≥80%, âmbar 50-79%, vermelho <50%)
- Ranking das tarefas que mais ficam em aberto
- Colaborador vê o próprio histórico; administrador vê o da equipe

**Vínculo com a base de referência**
- Tarefas podem puxar uma lista suspensa de qualquer aba da planilha
- Marcar a tarefa sem escolher o item dispara alerta vermelho
- Disponível para semanal, quinzenal e sob demanda (a grade diária não comporta
  o seletor)

**Importação em massa** (aba *Minhas tarefas*)
- Lê a aba *Tarefas Padrão* da planilha e cadastra várias tarefas de uma vez
- Tela de conferência com seleção item a item antes de confirmar
- Tarefas de nome repetido são ignoradas — dá para reimportar sem duplicar

**Por baixo do capô**
- Novo endpoint `api/report.js`, com leitura em lote (MGET) para não fazer uma
  consulta por semana
- Cálculo de progresso unificado numa função só, usada pelo checklist e pelos
  relatórios — as duas telas não têm como divergir

---

## 1.0.0 — 22/07/2026

Primeira versão em produção.

**Estrutura**
- Login por usuário com senha criptografada (PBKDF2-SHA256, 120 mil iterações)
- Sessão em cookie assinado, válida por 30 dias
- Banco Upstash Redis — dados sincronizados entre todos os aparelhos
- Instalável na tela inicial do celular (PWA)

**Checklist**
- Grade semanal com navegação entre semanas e barra de progresso
- Cinco tipos de tarefa: diária, semanal, quinzenal, conforme demanda e lembrete
  programado
- Pendências destacadas em âmbar, com alerta específico para tarefas de dia fixo
- Ciclo de 14 dias das quinzenais controlado automaticamente
- Campo de lembrete próprio por tarefa, com confirmação separada — usado para
  cobrar o tanque na aba Análise de Equipamentos

**Rotina cadastrada de fábrica (16 tarefas)**
- 6 diárias: produções no Beerbo, envases, liberação de lotes, migração para
  câmara fria, aba Faturamento, conferência do chope no tanque × BeerSales
- 5 semanais: programação de produção, contagem de estoque, compra de insumos
  (segunda-feira), dados de produção no Beerbo, cloro da brassagem
- 2 quinzenais: cloro do condensado da caldeira, materiais da impressora Markem
  Imaje
- 2 conforme demanda: manutenções no BeerSales, criação de rótulos e produtos
- 1 lembrete programado: troca do filtro de água (fev/2027)

**Equipe**
- Perfis de administrador e colaborador
- Criação de acessos, redefinição de senhas e remoção pelo painel
- Atribuição de tarefas individual ou para toda a equipe
- Tarefas do gestor protegidas contra exclusão pelo colaborador

**Base de referência**
- Planilha mestre com 9 abas (tanques, produtos, insumos, fornecedores,
  equipamentos, parâmetros de qualidade, colaboradores, tarefas padrão)
- Leitura das abas publicadas em CSV, com cache de 5 minutos
- Aba *Base* dentro do app, com busca por qualquer coluna

---

# Próximas versões — ideias no radar

| Versão prevista | Melhoria |
|---|---|
| 1.2.0 | aviso automático de pendência por e-mail ou WhatsApp (exige serviço externo) |
| 1.3.0 | anexar foto ou observação a uma marcação (ex.: registro da medição) |
| 1.4.0 | exportar o relatório em PDF ou planilha |
| 1.5.0 | metas por pessoa e comparação mês a mês |

Sobre o **aviso automático**: é a única sugestão da lista original que não entrou
na 1.1.0, e por um motivo concreto — ela depende de coisas fora do app: um
serviço de disparo (e-mail ou WhatsApp), uma conta nesse serviço, uma chave de
API e uma tarefa agendada rodando no servidor. Isso muda o projeto de "site
estático + banco" para algo com dependência externa e custo variável.

O botão **Gerar resumo p/ WhatsApp** foi a alternativa: entrega quase o mesmo
resultado prático, sem nenhuma infraestrutura nova. Se depois de algumas semanas
o disparo manual incomodar, aí vale montar o automático — com o problema já bem
entendido.
