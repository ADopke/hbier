# Versão 1.5.0 — as quatro mudanças

Carimbo de data e hora, visão ampla por operador, aba renomeada e a ferramenta
de links enxuta.

---

# O que subir

| Arquivo | Situação |
|---|---|
| `index.html` | alterado |
| `sw.js` | versão 1.5.0 |
| `package.json` | 1.5.0 |
| `montar-base-csv-urls.html` | alterado — **não vai para o GitHub**, é local |

Os arquivos de `api/` **não mudaram** nesta versão.

⚠️ O `sw.js` precisa ir junto. Sem ele, a equipe continua abrindo a 1.4.2 do
cache.

---

# 1. Data e hora em cada marcação

Toda marcação agora guarda **quando** foi feita, e o horário aparece ao lado da
tarefa:

```
✓ marcada em 24/07 às 14:32
```

**Onde aparece:**

| Tela | Como |
|---|---|
| **Hoje** | linha verde embaixo da tarefa marcada |
| **Semana**, semanais e quinzenais | mesma linha verde |
| **Semana**, grade diária | a hora embaixo do ✓, e a data completa passando o mouse |

**Um detalhe que importa:** o horário registrado é o do **aparelho no momento
do clique**, não o de quando o registro chegou ao servidor. Marcando sem sinal
às 7h e sincronizando às 11h, fica registrado 7h — que é quando a tarefa foi
realmente feita.

Desmarcar apaga o carimbo. Marcar de novo grava o novo horário.

Semanas anteriores, que não têm esse campo, continuam abrindo normalmente — só
não mostram horário, porque ele não existia.

---

# 2. Visão ampla por operador

Aba **Equipe** → no acompanhamento de cada pessoa há agora
**"ver todas as tarefas"**.

Abre a lista completa da semana daquele operador — o que já fez e o que falta —
agrupada por frequência:

**Diárias** aparecem como uma faixa dos cinco dias:

```
Lançar envases
  SEG ✓   TER ✓   QUA —   QUI —   SEX —
  08:14   07:52
```

Cada dia mostra o ✓, a hora da marcação e, quando a tarefa é de medição, **o
valor lido** no lugar do ✓.

**Semanais, quinzenais e lembretes** mostram *em aberto* ou o horário em que
foram marcados. Quinzenal que está em dia é identificada como tal, em vez de
aparecer como pendência — é a mesma regra do cálculo de percentual.

**Sob demanda** mostra quantos registros houve na semana.

**Tarefas críticas** ficam sinalizadas em vermelho.

É a diferença entre saber que alguém está em 60% e saber **exatamente o que
está parado, desde quando**.

---

# 3. Aba Base → Banco de dados

Só o rótulo mudou. O conteúdo, os links e a variável `BASE_CSV_URLS` continuam
iguais — nada para reconfigurar.

---

# 4. Ferramenta de links, enxuta

O `montar-base-csv-urls.html` agora tem só as **quatro abas que o app realmente
lê**:

| Aba | Para que serve no app |
|---|---|
| **Tanques** | lista suspensa no vínculo das tarefas |
| **Tarefas Padrão** | sincronização das tarefas |
| **Parâmetros de Processo** | faixas aceitáveis das medições |
| **Procedimentos** | passo a passo aberto dentro da tarefa |

As outras (Produtos, Insumos, Fornecedores, Equipamentos, Parâmetros de
Qualidade, Colaboradores) saíram da ferramenta porque **o app não faz nada com
elas** — publicá-las só aumentava a exposição da planilha sem benefício.

> Se quiser consultá-las dentro do app na aba Banco de dados, é só acrescentar
> à mão na variável, com o nome que preferir. A ferramenta é um atalho, não uma
> limitação.

**Como usar:** abra o arquivo com dois cliques (roda no navegador, sem
internet), cole o link CSV de cada aba e clique em **Copiar linha**. Ela já
valida o formato e avisa se dois links apontarem para a mesma aba.

---

# Como testar

**Carimbo:** marque uma tarefa na tela Hoje. Deve aparecer *"✓ marcada em
… às …"* logo abaixo. Desmarque e o horário some.

**Offline:** ative o modo avião, marque uma tarefa, anote a hora. Desative e
sincronize — o horário registrado deve ser o do momento do clique, não o da
sincronização.

**Visão ampla:** aba Equipe → *ver todas as tarefas* em alguém. Confira se as
diárias mostram os cinco dias e se as horas batem.

---

# Uma sugestão sobre a próxima etapa

Com o carimbo funcionando, o dado que você passa a ter é bem mais rico:
não só *se* foi feito, mas *quando*. Depois de duas ou três semanas, vale olhar
os horários — eles costumam revelar coisas que o percentual esconde, como
tarefa que aparece sempre marcada às 17h50 (feita de qualquer jeito no fim do
expediente) ou várias marcadas no mesmo minuto.

Não é para cobrar ninguém por isso. É informação sobre a rotina: tarefa marcada
em bloco no fim do dia costuma estar no horário errado, não com a pessoa errada.
