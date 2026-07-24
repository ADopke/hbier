# Como usar a base-processos-hbier e ligá-la no app

O arquivo `base-processos-hbier.xlsx` é o que saiu dos 20 cartões do Trello.
São **duas tabelas**, e cada uma alimenta uma funcionalidade diferente do app.

---

# PARTE 1 — O que tem dentro

## Aba `Parâmetros de Processo` — 91 linhas

Todo número de referência da fábrica. Colunas: **Código · Processo · Parâmetro ·
Tipo · Mínimo · Máximo · Unidade · Aplicação · Observação · Origem**

**O que o app faz com ela:** quando uma tarefa é de medição e você preenche o
campo *Código do parâmetro*, o app busca aqui o Mínimo, o Máximo e a Unidade —
e avisa na hora quando a leitura sai da faixa.

## Aba `Procedimentos` — 158 linhas

O passo a passo dos POPs e das máquinas. Colunas: **Código · Procedimento ·
Categoria · Seção · Ordem · Instrução · Criticidade · Origem**

**O que o app faz com ela:** quando você preenche o campo *Procedimento (POP)*
de uma tarefa, aparece um link nela. Um toque abre os passos na ordem, com
IMPORTANTE / ATENÇÃO / PROIBIDO destacados.

---

# PARTE 2 — Importar para o Google Sheets

⚠️ **Não substitua a planilha inteira.** Sua `base-referencia-hbier` já tem
tanques, produtos e as tarefas com código. Estas duas abas entram *ao lado*
delas.

1. Abra a **base-referencia-hbier** no Google Sheets
2. **Arquivo → Importar → Fazer upload** → escolha `base-processos-hbier.xlsx`
3. Em *Local de importação*, escolha **INSERIR NOVAS PLANILHAS**
4. Importar
5. **Apague a aba `COMO USAR`** que veio junto — é só instrução

Você deve ficar com duas abas novas: `Parâmetros de Processo` e `Procedimentos`.

> **Não renomeie essas abas.** O app procura por esses nomes exatos, com acento.

---

# PARTE 3 — Publicar e ligar no app

## 3.1 Publicar cada aba

Para cada uma das duas:

1. **Arquivo → Compartilhar → Publicar na Web**
2. Primeiro seletor: a aba (`Parâmetros de Processo`)
3. Segundo seletor: **Valores separados por vírgula (.csv)**
4. **Publicar** → copiar o link

Confira que o link termina em `output=csv` e que o `gid` é diferente entre as
duas.

## 3.2 Acrescentar à variável

Na Vercel: projeto → **Settings → Environments → Production** → variável
`BASE_CSV_URLS`.

**Acrescente ao que já está lá**, separando com `;`:

```
...o que já existe...;Parâmetros de Processo=<link1>;Procedimentos=<link2>
```

### O nome antes do `=` precisa ser exatamente este

| Escreva assim | Por quê |
|---|---|
| `Parâmetros de Processo` | com acento no “â” e no “ô” |
| `Procedimentos` | simples, no plural |

É o texto que o app usa para achar a tabela. Um acento errado e a funcionalidade
some sem avisar.

## 3.3 Redeploy

**Deployments → ⋯ → Redeploy.** Sem isso a variável nova não vale.

## 3.4 Conferir

Abra o app → aba **Base**. O seletor de tabelas deve mostrar as duas novas.
Busque por `cloro` ou `caldeira` e veja se traz resultado.

---

# PARTE 4 — Usar de verdade nas tarefas

Publicar não muda nada sozinho. É preciso ligar tarefa por tarefa.

## 4.1 Ligar um procedimento

Aba **Minhas tarefas** → *editar* na tarefa → campo **Procedimento (POP)**.
Depois de publicar a aba, esse seletor vem preenchido com os 21 processos:

```
Banco de CO2 · Bomba de água do reservatório · Brassagem · Caldeira ·
Carbonatação · Chiller · Clarificante · Coleta de fermento · Compressor ·
Despressurização · Enfardadora · Envasadora · Fermentação · Filtros de água ·
Ink jet Markem Imaje 9018 · Lavadora de barris · Lavadora de piso ·
Maturação · Moinho · Pressurização · Purgas
```

**Sugestões pelas suas tarefas atuais:**

| Tarefa | Procedimento |
|---|---|
| Verificar materiais da impressora Markem Imaje | `Ink jet Markem Imaje 9018` |
| Solicitar medição de cloro — condensado da caldeira | `Caldeira` |
| Conferir chope no tanque × BeerSales | `Maturação` |
| Lançar envases | `Envasadora` |

## 4.2 Ligar uma medição

Na mesma tela de edição:

1. Marque **Registrar leitura numérica**
2. **Unidade**: `kgf/cm²`, `°C`, `vol`, `ppm`
3. **Código do parâmetro**: comece a digitar e o campo sugere os códigos da
   planilha

**Códigos prontos para usar:**

| Código | O que mede | Faixa |
|---|---|---|
| `MAT-06` | Pressão do tanque na maturação | 0,8 a 1,5 kgf/cm² |
| `FER-04` | Pressão do tanque na fermentação | 1 kgf/cm² |
| `FER-05` | Pressão máxima em fermentação | até 2 kgf/cm² |
| `CAR-01` | Carbonatação — lata | 2,35 a 2,5 vol |
| `CAR-04` | Carbonatação — barril | 2,3 a 2,5 vol |
| `MAT-04` | Temperatura do Tanque 5 | 2,5 °C |
| `CHI-01` | Set point do chiller | −3 °C |

Feito isso, a tarefa deixa de ser um quadradinho: a pessoa digita o valor, vê a
faixa aceitável embaixo do campo e recebe **⚠ FORA DA FAIXA** na hora se sair
dela.

---

# PARTE 5 — Uma decisão que você precisa tomar

Você vai ficar com **duas abas de parâmetros**:

| Aba | Situação |
|---|---|
| `Parâmetros de Qualidade` | da planilha original — praticamente vazia, só com a linha de exemplo |
| `Parâmetros de Processo` | esta agora, com 91 linhas preenchidas |

**O app só lê a segunda.** Então:

- Não publique a `Parâmetros de Qualidade`
- Os limites de cloro que você for definir devem ir para a
  `Parâmetros de Processo`, com código próprio (ex.: `CLO-BRA`, `CLO-CAL`)

**Isso importa para o seu caso:** as medições de cloro são duas das suas tarefas
de rotina, e os cartões do Trello **não traziam limite numérico** para elas. Sem
uma linha na `Parâmetros de Processo`, o app aceita a leitura mas não tem como
dizer se está boa. Definir esses dois limites é o passo que falta para as
medições de cloro ficarem completas.

---

# PARTE 6 — Um bug que corrigi agora (versão 1.4.2)

Ao revisar para escrever isto, encontrei o campo **Procedimento (POP)** com
apenas a opção "Nenhum" — ele nunca era preenchido com a lista de processos.
Ou seja, mesmo publicando a aba, não haveria o que escolher.

Corrigido: o seletor agora se preenche sozinho ao carregar a base, e o campo
**Código do parâmetro** ganhou sugestões enquanto você digita.

**Suba junto:** `index.html`, `sw.js` e `package.json` — versão **1.4.2**.

---

# Ordem sugerida

```
⬜ Importar as duas abas no Google Sheets (Inserir novas planilhas)
⬜ Apagar a aba COMO USAR
⬜ Publicar as duas em CSV
⬜ Acrescentar à BASE_CSV_URLS com os nomes exatos
⬜ Publicar a versão 1.4.2 e fazer Redeploy
⬜ Conferir na aba Base do app
⬜ Ligar o procedimento em 3 ou 4 tarefas de máquina
⬜ Ligar a medição em 2 tarefas (comece por MAT-06 e CAR-01)
⬜ Definir os limites de cloro na aba Parâmetros de Processo
```

Sugiro parar depois de ligar duas medições e ver como a equipe reage antes de
espalhar para todas. Se todo mundo achar chato digitar número, é melhor
descobrir com duas tarefas do que com dez.
