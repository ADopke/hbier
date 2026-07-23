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
