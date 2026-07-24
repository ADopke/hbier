# Versão 1.3.0 — as cinco melhorias de adoção

Aplicadas: offline, tela Hoje, registro de leitura, procedimento na tarefa e
escalonamento do crítico. A de turnos ficou de fora, como você pediu.

---

# PARTE 1 — Publicar

## Arquivos

| Arquivo | Situação |
|---|---|
| `index.html` | alterado |
| `sw.js` | **novo — na raiz, não dentro de `api/`** |
| `package.json` | versão 1.3.0 |
| `api/tasks.js` · `api/_base.js` · `api/sync.js` | alterados |

⚠️ **O `sw.js` precisa ficar na raiz do repositório**, ao lado do
`index.html`. Se cair dentro de uma pasta, o navegador limita o alcance dele e
a abertura offline não funciona.

## Como subir

GitHub → **Add file → Upload files** → arraste `index.html`, `sw.js`,
`package.json` e a **pasta `api` inteira** → Commit.

Confira no rodapé: **Versão 1.3.0**.

## Um detalhe do service worker

O `sw.js` guarda o app em cache com o número da versão na chave. **Toda vez que
publicar uma versão nova, altere a linha `const VERSAO` dentro do `sw.js`** para
o mesmo número do `index.html`. É isso que faz o navegador jogar fora o cache
velho — sem isso, a equipe pode continuar abrindo a versão antiga por dias.

Já deixei as três em 1.3.0.

---

# PARTE 2 — O que mudou na prática

## 1. Funciona sem internet

A marcação agora **grava no aparelho primeiro** e sobe depois. O clique nunca
espera a rede.

- No topo aparece um indicador discreto: *sem rede* ou *3 pendentes*
- Quando o sinal volta, tudo sobe sozinho e o indicador some
- Com o service worker, o app **abre** mesmo sem sinal, mostrando a última
  versão salva no aparelho

Simulei perda de sinal no meio do turno, marcações durante a queda e retorno da
conexão: nenhuma marcação se perde em nenhum momento.

**O que continua exigindo rede:** entrar pela primeira vez, trocar de semana,
relatórios e a aba Base.

## 2. Tela Hoje — agora é a aba inicial

Abre direto no dia: só as tarefas de hoje, em cartões grandes, sem grade.

- Pendências de dias anteriores aparecem agrupadas à parte, sem poluir
- Itens críticos sobem para o topo
- A grade da semana continua ali, na aba **Semana**

## 3. Registro de leitura

Na criação da tarefa há agora **"Registrar leitura numérica"**. Marcando isso,
a tarefa deixa de ser um check e passa a pedir um número.

Preencha também:

| Campo | Para quê |
|---|---|
| **Unidade** | °C, kgf/cm², ppm, vol |
| **Código do parâmetro** | Ex.: `MAT-06` — traz a faixa aceitável da planilha |

Com o código preenchido, o app mostra *"faixa aceitável: 0,8 a 1,5"* embaixo do
campo e acende **⚠ FORA DA FAIXA** na hora, se o valor sair dela.

**Sugestões de onde usar**, com os códigos que já existem na sua base:

- Cloro da brassagem e da caldeira
- Pressão de maturação → `MAT-06`
- Carbonatação antes do envase → `CAR-01` a `CAR-04`
- Densidade e pressão de fermentação → `FER-04`, `FER-05`

Essa é a melhoria que mais muda a natureza do app: um quadradinho marcado não
prova nada, um número medido vira registro.

## 4. Procedimento dentro da tarefa

Na tarefa há o campo **Procedimento (POP)**, com a lista vinda da aba
*Procedimentos*. Escolhendo um, aparece um link na tarefa — um toque abre os
passos na ordem, com IMPORTANTE, ATENÇÃO e PROIBIDO destacados em vermelho.

É o que tira o "não lembro como faz" do caminho.

## 5. Escalonamento do crítico

Na tarefa há **Crítica: sim/não**. O que muda:

- Críticos em aberto viram um alerta vermelho no topo da tela Hoje
- Sobem para o começo da lista do dia
- Entram destacados no resumo do WhatsApp

**Sendo honesto sobre o limite:** não há notificação por push nem e-mail. Isso
exigiria serviço externo, conta e chave de API — o mesmo motivo pelo qual, na
1.1.0, entregamos o resumo copiável em vez do disparo automático. O
escalonamento aqui é dentro do app.

---

# PARTE 3 — Três bugs que encontrei e corrigi

Parte deste trabalho já estava no projeto de conversas anteriores, mas
incompleta. Ao revisar, achei três coisas que teriam quebrado o uso:

1. **A tela Hoje não entrava na troca de abas** — ficava visível em cima de
   todas as outras
2. **`renderHoje()` nunca era chamada** — a aba abriria vazia
3. **O `sw.js` existia mas nunca era registrado** — ou seja, o app não abriria
   offline, que era justamente o ponto principal da melhoria nº 1

Todas corrigidas e testadas.

---

# PARTE 4 — Configurar as tarefas

Nada disso funciona sozinho: os campos novos começam vazios. Sugestão de ordem,
sem fazer tudo de uma vez:

**Hoje (10 minutos)** — marque como **críticas** as 3 ou 4 tarefas que
realmente não podem passar. Verificação de lotes, conferência do chope e cloro
são bons candidatos. Crítico demais é o mesmo que crítico nenhum.

**Esta semana** — ligue o **registro de leitura** em duas tarefas de medição,
com o código do parâmetro. Veja como a equipe reage antes de espalhar.

**Semana que vem** — vincule o **procedimento** nas tarefas de máquina
(caldeira, lavadora de barris, envasadora). É onde o passo a passo faz mais
falta.

> Se preferir configurar tudo de uma vez, dá para fazer pela planilha: acrescente
> as colunas `Medição`, `Unidade`, `Código do parâmetro`, `Procedimento` e
> `Crítico` na aba *Tarefas Padrão* e rode a sincronização. O backend já
> reconhece essas colunas.

---

# Como testar que funcionou

**Offline:** abra o app no celular, ative o modo avião, marque duas tarefas —
deve aparecer *2 pendentes* no topo. Desative o modo avião: em segundos o
indicador some e aparece *"Marcações sincronizadas"*.

**Abertura offline:** com o app já aberto uma vez, feche tudo, ative o modo
avião e abra de novo. Deve carregar normalmente.

**Leitura:** crie uma tarefa de teste com registro de leitura e código
`MAT-06`. Digite `1.2` (dentro) e depois `0.5` (fora) e veja o aviso mudar.

---

# Se algo der errado

**Deployments → deploy anterior → Promote to Production.** Os dados não são
afetados.

Um detalhe só do service worker: depois de voltar a versão, quem já abriu a
1.3.0 pode continuar com ela em cache. Peça um **Ctrl + Shift + R** — ou, no
celular, feche e reabra o app.
