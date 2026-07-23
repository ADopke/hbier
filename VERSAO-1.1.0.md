# Versão 1.1.0 — o que mudou e como publicar

Cinco recursos novos. Antes de tudo: **o que subir e como voltar atrás se
precisar.**

---

# PARTE 1 — Publicar

## Arquivos que mudaram

| Arquivo | O que mudou |
|---|---|
| `index.html` | interface inteira — abas, relatórios, vínculo, importação |
| `api/_lib.js` | leitura em lote no banco |
| `api/tasks.js` | vínculo com a base + importação em massa |
| `api/report.js` | **arquivo novo** |
| `package.json` | versão 1.1.0 |

Os demais (`auth.js`, `users.js`, `state.js`, `base.js`, `vercel.json`,
`manifest.json`, `icon.svg`) **não mudaram** — não precisa subir.

## Como subir

1. `github.com/ADopke/hbier` → **Add file** → **Upload files**
2. Arraste o **`index.html`**, o **`package.json`** e a **pasta `api` inteira**
   - a pasta `api` precisa continuar em minúsculas
3. Descrição do commit: `versão 1.1.0 — relatórios, vínculo e importação`
4. **Commit changes**

A Vercel publica sozinha em ~1 minuto. Confira em **Deployments** se ficou
🟢 Ready.

## Como confirmar

Abra a URL e olhe o rodapé (ou a tela de login): deve mostrar
**Versão 1.1.0 · 23/07/2026**. Se ainda mostrar 1.0.0, force com
**Ctrl + Shift + R**.

## Se algo der errado

**Deployments** → localize o deploy da 1.0.0 → **⋯** → **Promote to
Production**. Em segundos você volta à versão anterior.

Seus dados não correm risco: usuários, tarefas e marcações ficam no banco, que
não é tocado por essa troca. A 1.1.0 também **não altera nada do que já está
salvo** — só acrescenta campos novos, que ficam vazios nas tarefas antigas.

---

# PARTE 2 — Os cinco recursos

## 1. Acompanhamento da equipe

**Onde:** aba *Equipe*, no topo (só administrador).

Mostra cada pessoa com o percentual da semana, uma barra colorida e a lista do
que está em aberto. Verde é 80% ou mais, âmbar entre 50 e 79, vermelho abaixo
disso.

Quem não tem tarefa cadastrada aparece como "sem tarefas" — não como 0%. A
diferença importa: um significa que falta configurar, o outro que a pessoa não
está cumprindo.

## 2. Resumo para WhatsApp

**Onde:** aba *Equipe* → botão **Gerar resumo p/ WhatsApp**.

Monta um texto pronto para colar no grupo:

```
📋 Rotina HBier — semana de 20 jul a 26 jul

Augusto: 95% (1 em aberto)
   • Cobrar contagem de estoque

Marcos: 60% (4 em aberto)
   • Lançar envases (2 dias)
   ...
```

O botão **Copiar texto** joga direto na área de transferência.

**Por que assim e não um aviso automático:** disparo automático precisaria de
um serviço de e-mail ou WhatsApp, conta nesse serviço, chave de API e uma tarefa
agendada no servidor — sai do "site + banco" e entra em dependência externa com
custo variável. Este botão entrega quase o mesmo resultado sem nada disso. Se
depois de algumas semanas o envio manual incomodar, aí vale automatizar.

## 3. Relatórios

**Onde:** aba *Relatórios* (nova).

Tabela de cumprimento por pessoa, semana a semana. Você escolhe o período — 4,
8, 12 ou 26 semanas — e vê o percentual de cada uma mais a média do período.

Abaixo, o **ranking das tarefas que mais ficam em aberto**. É o dado mais útil
da tela: tarefa que aparece toda semana no topo geralmente não é preguiça, é
sinal de que ela está mal colocada — no dia errado, com a pessoa errada, ou
simplesmente não faz mais sentido.

Colaborador também tem acesso, mas só ao próprio histórico.

**Sobre o traço (—):** aparece quando não havia tarefa naquela semana. Semana
sem tarefa não entra na média, para não puxar o número para baixo injustamente.

## 4. Vínculo com a base de referência

É o que você pediu lá atrás: em vez de digitar o tanque, escolher de uma lista.

**Como configurar:**

1. Aba *Minhas tarefas*
2. Crie ou edite uma tarefa (ex.: *Lançar programação de produção*)
3. No campo **Vincular à base**, escolha `Tanques`
4. Em **Coluna a exibir**, escolha qual coluna aparece na lista (ex.: `Código`)
5. Salvar

A partir daí, no checklist a tarefa mostra um seletor verde com todos os tanques
da planilha. Se você marcar a tarefa sem escolher o tanque, um alerta vermelho
aparece — mesma lógica do lembrete.

**Depende da planilha estar conectada** (variável `BASE_CSV_URLS`). Sem isso o
seletor avisa que a base não carregou.

**Não funciona em tarefas diárias** — a grade tem uma coluna por dia e não
comporta o seletor. Está disponível para semanal, quinzenal e sob demanda.

## 5. Importação em massa

**Onde:** aba *Minhas tarefas* → seção **📥 Importar da planilha**.

Lê a aba *Tarefas Padrão* da base e cadastra várias tarefas de uma vez.

1. **Buscar na planilha**
2. Confira a lista — o que já existe vem desmarcado e com a etiqueta "já existe"
3. **Importar selecionadas**

Serve principalmente para montar a rotina de alguém novo: você entra em *Equipe*
→ *tarefas* na pessoa, e importa o pacote inteiro em vez de digitar item a item.

Reimportar não duplica: nomes repetidos são ignorados.

**A planilha precisa ter as colunas** `Tarefa` e `Frequência`. As colunas
`Descrição`, `Dia fixo` e `Lembrete ao executar` são aproveitadas se existirem.

---

# PARTE 3 — Uma observação honesta

Você pediu tudo de uma vez, e está entregue. Mas vale dizer: **cinco recursos num
único release é bastante coisa para validar ao mesmo tempo.**

Sugestão de como usar isso nos próximos dias:

**Teste um por vez, na ordem:** vínculo → importação → acompanhamento →
relatórios. Se algo estiver estranho, você sabe onde olhar. Testando tudo junto,
um problema num canto contamina a leitura do resto.

**O relatório só fica interessante com histórico.** Hoje ele vai mostrar uma ou
duas semanas. O valor real aparece no segundo mês.

**Os recursos de equipe pressupõem equipe.** Acompanhamento e resumo só fazem
sentido depois que as outras pessoas tiverem acesso e estiverem marcando. Antes
disso, vão mostrar só você.

Ou seja: o que dá para avaliar de imediato é o **vínculo** e a **importação**. O
resto amadurece com o uso — e é bom que seja assim, porque aí você me diz o que
ajustar com base no que aconteceu de verdade, não no que a gente imaginou.

---

# Checklist de publicação

```
⬜ Subir index.html + package.json + pasta api no GitHub
⬜ Conferir Deployments → 🟢 Ready
⬜ Ctrl + Shift + R → rodapé mostra "Versão 1.1.0"
⬜ Testar: criar uma tarefa com vínculo a Tanques
⬜ Testar: importar da planilha
⬜ Depois da equipe cadastrada: acompanhamento e resumo
```
