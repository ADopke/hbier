# Versão 1.6.3 — papel Gestor

---

# O que subir

| Arquivo | Situação |
|---|---|
| `index.html` | alterado |
| `sw.js` | 1.6.3 |
| `package.json` | 1.6.3 |
| `api/users.js` · `api/tasks.js` · `api/sync.js` | alterados |

---

# O que o Gestor pode fazer

| | Colaborador | Gestor | Admin |
|---|:---:|:---:|:---:|
| Ver e marcar as próprias tarefas | ✓ | ✓ | ✓ |
| Trocar a própria senha | ✓ | ✓ | ✓ |
| Criar tarefa para si mesmo | ✓ | ✓ | ✓ |
| Importar da planilha para si | ✓ | ✓ | ✓ |
| **Criar tarefa para outros** | — | ✓ | ✓ |
| **Importar da planilha para outros** | — | ✓ | ✓ |
| **Ver acompanhamento da equipe** | — | ✓ | ✓ |
| **Gerar resumo para WhatsApp** | — | ✓ | ✓ |
| **Sincronizar equipe com a planilha** | — | ✓ | ✓ |
| **Ver tarefas detalhadas de outro** | — | ✓ | ✓ |
| Criar / remover / redefinir acesso | — | — | ✓ |
| Criar acesso de administrador | — | — | ✓ |
| Relatórios históricos | — | — | ✓ |
| Vincular tarefas antigas | — | — | ✓ |
| Diagnóstico da sincronização | — | — | ✓ |

---

# Como criar um gestor

**Aba Equipe → seção "Novo acesso":**

1. Nome, usuário e senha, como de costume
2. Perfil: **Gestor — cria tarefas para a equipe, sem acesso ao admin**
3. Criar acesso

Só o administrador pode criar acessos. O gestor não vê a seção "Novo acesso".

---

# O que cada papel vê na aba Equipe

**Administrador** vê tudo:
- Acompanhamento da semana + resumo WhatsApp
- Sincronizar com a planilha (incluindo "Vincular tarefas antigas")
- Diagnóstico da sincronização
- Lista de pessoas com botões de redefinir senha e remover
- Formulário de novo acesso

**Gestor** vê:
- Acompanhamento da semana + resumo WhatsApp
- Sincronizar com a planilha (sem o botão "Vincular tarefas antigas")
- Lista de pessoas com botão de tarefas (para gerenciar as de outros)
- **Sem** diagnóstico, **sem** redefinir senha, **sem** remover, **sem** criar acesso

**Colaborador** não vê a aba Equipe.

---

# Um detalhe sobre tarefas atribuídas pelo gestor

Tarefas que o gestor cria para outros ficam marcadas com a origem `"gestor"` —
isso serve para a sincronização reconhecê-las como vindas de alguém com
autoridade, não como tarefas criadas pela própria pessoa.

Na prática: se o gestor atribuir uma tarefa ao Marcos, ela não pode ser
excluída pelo Marcos (a não ser que o gestor ou o admin removam).

---

# Quem pode criar quem

| Criador | Pode criar |
|---|---|
| **Admin** | Colaborador, Gestor, Admin |
| **Gestor** | *(não tem acesso à criação de usuários)* |
| **Colaborador** | *(não tem acesso)* |

---

# Para transformar um colaborador em gestor

Não existe a mudança direta de papel. O caminho é:
1. Admin remove o acesso do colaborador
2. Cria um novo acesso com o mesmo login e senha, com o papel Gestor

Atenção: remover o acesso **apaga as tarefas** daquela pessoa. Se ela tiver
tarefas importantes, a alternativa é criar um novo login (ex.: `marcos-g`) e
deixar o antigo no ar até as tarefas serem migradas.

Uma opção mais limpa será disponibilizada quando houver demanda.
