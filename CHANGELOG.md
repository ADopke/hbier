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
