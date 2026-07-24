# Por que marcar na Semana não refletia no Hoje

Você notou certo, inclusive a assimetria: funcionava num sentido e não no
outro. Isso é a assinatura do problema.

---

# A causa

As duas abas mostram **o mesmo estado** — não são listas independentes. A
diferença estava em quem redesenhava o quê depois de uma marcação:

| Onde você marcava | O que era redesenhado |
|---|---|
| **Aba Hoje** | `renderTudo()` — tudo, inclusive a Semana |
| **Aba Semana** | só a própria lista (`renderDiarias()`, `renderSemanais()`…) |

Marcando pela Semana, o dado era gravado corretamente — só a tela Hoje ficava
desenhada com a informação antiga. Trocando de aba, ela continuava mostrando o
estado anterior até algo forçar um redesenho (recarregar a página, trocar de
semana, uma sincronização).

Por isso o inverso funcionava: a aba Hoje já redesenhava as duas.

---

# A correção

Todos os pontos de marcação passam a redesenhar as duas abas. São nove no
total: diárias, semanais, quinzenais, lembretes e contadores, nos dois painéis.

Optei por unificar em vez de acrescentar só a chamada que faltava. Redesenhar
parcialmente era exatamente o que abria espaço para esse tipo de bug — cada
funcionalidade nova precisaria lembrar de atualizar todos os lugares onde
aparece. Com todos chamando a mesma função, isso deixa de ser possível.

---

# Um segundo bug, da mesma família

Investigando, encontrei outro: **escolher o item da base pela aba Hoje não
salvava nada.**

O tratamento de *escolher o tanque* e *confirmar o lembrete* estava preso ao
painel da Semana. Como a aba Hoje também mostra esses controles, mexer neles
por lá simplesmente não gravava — sem erro, sem aviso.

Corrigido junto: medição, vínculo e confirmação de lembrete agora são tratados
num listener único, válido em qualquer aba.

---

# O que subir

| Arquivo | Situação |
|---|---|
| `index.html` | alterado |
| `sw.js` | 1.6.2 |
| `package.json` | 1.6.2 |

Os arquivos de `api/` não mudaram.

---

# Como confirmar

1. Publique e confirme **Versão 1.6.2** no rodapé
2. Aba **Semana** → marque uma tarefa diária de hoje
3. Aba **Hoje** → ela deve aparecer marcada, com o carimbo de horário
4. Faça o inverso, para garantir que continua funcionando

**Teste também o vínculo:** numa tarefa ligada à aba Tanques, escolha o tanque
**pela aba Hoje**, troque de aba e volte. A escolha deve estar lá. Antes desta
versão, sumiria.

---

# Sobre o ritmo

Esta é a terceira correção seguida (1.6.1 e 1.6.2 saíram de problemas que você
encontrou usando). Isso é bom sinal do seu lado — você está testando de
verdade, e cada um desses bugs teria aparecido pior com a equipe inteira
usando.

Do meu lado, os três tiveram a mesma raiz: funcionalidade nova acrescentada sem
verificar todos os lugares onde ela aparece. As mudanças estruturais da 1.6.1
(a planilha declara o que governa) e desta (um único ponto de redesenho)
existem justamente para fechar essa porta.

Sugiro rodar alguns dias só com o que existe antes de acrescentar coisa nova —
se aparecer mais alguma coisa, é melhor descobrir agora.
