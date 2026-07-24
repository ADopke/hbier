# Versão 1.6.0 — prioridade, ordem A–Z e volta para a semana

As três coisas que você pediu — mais uma correção que apareceu no caminho e
que provavelmente explica algo que você já tinha estranhado.

---

# O que subir

| Arquivo | Situação |
|---|---|
| `index.html` | alterado |
| `sw.js` | versão 1.6.0 |
| `package.json` | 1.6.0 |
| `api/tasks.js` · `api/_base.js` · `api/sync.js` | alterados |

Arraste `index.html`, `sw.js`, `package.json` e a **pasta `api` inteira**.

---

# 1. Prioridade

Ao criar ou editar uma tarefa há agora o campo **Prioridade**. Marcando
*Prioritária*, ela ganha:

- **ponto vermelho** ao lado do nome
- **barra vermelha** na lateral do item
- **primeira posição** nas telas Hoje e Semana

Vale em todas as listas: diárias, semanais e quinzenais.

## Prioritária × Crítica — são coisas diferentes

Vale entender a distinção, porque agora existem as duas:

| | O que significa | O que o app faz |
|---|---|---|
| **Prioritária** | ordem de execução — faça esta primeiro | ponto vermelho, sobe para o topo |
| **Crítica** | consequência de atrasar é grave | alerta no topo da tela Hoje, destaque no resumo do WhatsApp |

Uma tarefa pode ser as duas. Mas se você marcar tudo como as duas, nenhuma das
duas significa nada — 3 ou 4 prioritárias por pessoa é o limite útil.

**Também dá para definir pela planilha:** acrescente uma coluna `Prioridade` na
aba *Tarefas Padrão* e preencha com `sim`. A sincronização traz junto.

---

# 2. Ordenação alfabética

Botão **A–Z** na barra do topo, ao lado das setas de semana.

- Clicou uma vez: lista em ordem alfabética
- Clicou de novo: volta à ordem de cadastro
- A escolha fica salva no aparelho — cada pessoa tem a sua

**Duas coisas cuidadas:**

As **prioritárias continuam no topo** nos dois modos. O ponto vermelho promete
"esta vem primeiro", e a ordenação não quebra essa promessa — ela ordena dentro
de cada grupo.

A ordenação **respeita acentuação portuguesa**: *Álcool* vem antes de *Lançar*,
que vem antes de *Órgão*. Ordenação comum jogaria as palavras acentuadas para
o fim da lista.

---

# 3. Voltar para a semana atual

Botão **↩ semana atual** ao lado das setas. Aparece só quando você está em
outra semana — na semana atual ele some, e no lugar fica a etiqueta
*Semana atual*, como antes.

---

# 4. A correção que apareceu no caminho

Ao ligar o campo de prioridade, descobri que **os campos criados na 1.3.0 nunca
eram salvos**:

- Registrar leitura numérica
- Unidade
- Código do parâmetro
- Procedimento (POP)
- Criticidade

Os campos existiam na tela, você podia preencher, clicar em salvar — e nada era
enviado ao servidor. O formulário montava a requisição só com os campos
antigos.

**Isso explica** por que configurar medição ou procedimento numa tarefa parecia
não surtir efeito.

Agora os cinco são enviados, recarregados quando você edita a tarefa e limpos
ao criar uma nova.

> **Vale reconfigurar:** se você já tinha tentado ligar medição, POP ou
> criticidade em alguma tarefa, refaça — aquilo não chegou a ser gravado.

---

# Como testar

**Prioridade:** edite uma tarefa diária, marque *Prioritária*, salve. Ela deve
subir para o topo na tela Hoje com o ponto vermelho.

**A–Z:** clique no botão e veja a lista reordenar. Confira que a prioritária
continua em primeiro.

**Semana atual:** clique em ‹ duas vezes, veja o botão ↩ aparecer, clique nele.
Deve voltar direto, e o botão sumir.

**Campos salvos:** edite uma tarefa, ligue *Registrar leitura numérica*, ponha
`kgf/cm²` e o código `MAT-06`, salve. Abra a edição de novo — os valores devem
estar lá. Antes desta versão, voltariam vazios.

---

# Uma observação sobre o formulário

Ele já está com onze campos, e nem todos fazem sentido ao mesmo tempo — unidade
e código do parâmetro só importam se a medição estiver ligada, dia fixo só em
tarefas semanais.

Alguns já se escondem sozinhos conforme a frequência. Se na prática ficar
confuso para você ou para quem for cadastrar, dá para reorganizar em duas
seções — *o básico* e *avançado*, recolhido por padrão. Vale ver como fica no
uso antes de mexer.
