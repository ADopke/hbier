# HBier · Rotina da Fábrica

Checklist operacional da cervejaria com **login por usuário**, tarefas
individuais e sincronização entre todos os aparelhos.

---

## O que cada arquivo faz

```
index.html          Todo o app (login, checklist, tarefas, painel da equipe)
api/_lib.js         Banco de dados, senhas, sessões e permissões
api/_seed.js        Rotina padrão da fábrica (criada junto com o admin)
api/auth.js         Primeiro acesso, login, logout, troca de senha
api/users.js        Criar / remover pessoas e redefinir senhas (admin)
api/tasks.js        Criar, editar e excluir tarefas
api/state.js        Marcações da semana e ciclos quinzenais
api/base.js         Leitura da planilha de base de referência
base-referencia-hbier.xlsx
                    Planilha mestre: tanques, produtos, insumos, fornecedores,
                    equipamentos, parâmetros de qualidade e rotina padrão
vercel.json         Cache
package.json        Define o projeto como ESM (Node 20+)
manifest.json       Permite instalar na tela inicial do celular
```

Sem dependências externas — nenhum `npm install` é necessário.

---

## Instalação (uma vez só, ~10 minutos)

### 1. Suba o projeto

**Pelo site:** acesse `vercel.com/new` e arraste a pasta inteira. Framework:
**Other**.

**Pelo terminal:**

```bash
cd rotina-hbier-app
npx vercel
```

### 2. Crie o banco de dados

No painel do projeto na Vercel:

1. Aba **Storage** → **Create Database**
2. Escolha **Upstash for Redis** (plano gratuito atende de sobra)
3. **Connect** ao projeto

Isso injeta automaticamente as variáveis `KV_REST_API_URL` e
`KV_REST_API_TOKEN`.

> Se o painel oferecer nomes diferentes, o app também aceita
> `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`.

### 3. Crie a chave de sessão

Em **Settings → Environment Variables**, adicione:

| Nome | Valor |
|---|---|
| `AUTH_SECRET` | um texto aleatório longo (40+ caracteres) |

Para gerar um:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Guarde essa chave. Se ela mudar, todo mundo precisa entrar de novo.

### 4. Faça um novo deploy

Aba **Deployments** → menu do último deploy → **Redeploy**. As variáveis só
valem a partir daí.

### 5. Abra o site

Você verá a tela de **primeiro acesso**. Crie sua conta de administrador — ela
já nasce com a rotina completa da fábrica cadastrada (diárias, semanais,
quinzenais, sob demanda e o lembrete do filtro de água).

---

## Como funciona no dia a dia

### Perfis

| | Colaborador | Administrador |
|---|---|---|
| Marcar o próprio checklist | ✅ | ✅ |
| Criar tarefas para si | ✅ | ✅ |
| Editar/excluir tarefas do gestor | ❌ | ✅ |
| Criar acessos e redefinir senhas | ❌ | ✅ |
| Atribuir tarefas a outras pessoas | ❌ | ✅ |

Tarefas que você atribui aparecem para a pessoa com a etiqueta **"do gestor"** e
ela não consegue apagar — só marcar. As que ela mesma cria ficam sob o controle
dela.

### Tipos de tarefa

- **Diária** — uma coluna por dia na grade (seg–sex)
- **Semanal** — marca 1x por semana; aceita dia fixo (ex.: compra de insumos
  toda segunda), e aí a pendência acende já na terça
- **Quinzenal** — o app controla o ciclo de 14 dias sozinho: depois de marcada
  fica "em dia" e só volta a cobrar quando vencer
- **Conforme demanda** — contador (+/−) em vez de check
- **Lembrete programado** — dorme até o mês marcado e então acende sozinho

### Campo "lembrete ao executar"

Texto que aparece numa caixa dourada dentro da tarefa, com confirmação própria.
É o que faz a produção cobrar o **tanque na aba Análise de Equipamentos**: se a
tarefa for marcada sem confirmar o lembrete, um alerta vermelho aparece.

### Instalar no celular

Abra a URL no navegador e use **"Adicionar à tela de início"**. O app abre em
tela cheia, como aplicativo nativo.

---

## Base de referência (planilha)

O arquivo **`base-referencia-hbier.xlsx`** é a fonte única de verdade da fábrica:
tanques, produtos, insumos, fornecedores, equipamentos, parâmetros de qualidade,
colaboradores e a rotina padrão. O app lê essa base e mostra na aba **Base**,
com busca.

### Como conectar

1. Suba o arquivo para o Google Drive e abra com **Google Sheets**
2. **Arquivo → Compartilhar → Publicar na Web**
3. Escolha a aba, formato **CSV**, e clique em Publicar
4. Repita para cada aba que quiser disponível no app
5. Na Vercel, crie a variável de ambiente:

| Nome | Valor |
|---|---|
| `BASE_CSV_URLS` | `Tanques=<link>;Produtos=<link>;Insumos=<link>` |

6. Redeploy

A partir daí, quem editar a planilha atualiza o app — sem mexer em código. Os
dados ficam em cache por 5 minutos; o botão **"Atualizar da planilha"** busca na
hora.

> **Atenção:** publicar na web torna a aba acessível a quem tiver o link. Não
> coloque senhas nem dados pessoais na planilha.

### Regras de preenchimento

- A linha 5 de cada aba é um **exemplo** (fundo creme) — apague depois de entender
- Não renomeie nem reordene colunas: o app procura pelo nome
- Não deixe linhas em branco no meio dos dados
- Datas no formato `AAAA-MM-DD`
- Códigos únicos e sem espaços — são eles que ligam as abas entre si
  (um insumo aponta para o código do fornecedor, um tanque para o do produto)

Na aba **Equipamentos**, a próxima manutenção é calculada sozinha a partir da
última data e da frequência em dias.

---

## Segurança

- Senhas guardadas com **PBKDF2-SHA256**, 120 mil iterações e sal individual —
  nem você consegue ler a senha de alguém, só redefinir
- Sessão em **cookie HttpOnly assinado**, válido por 30 dias
- Toda rota da API confere a sessão antes de responder; ninguém acessa dados de
  outra pessoa pela URL

Se um colaborador sair da empresa, remova o acesso pela aba **Equipe**.

---

## Custos

Tudo cabe no plano gratuito: Vercel Hobby (projetos pessoais) + Upstash Redis
free (10 mil comandos/dia — uma equipe pequena usa uma fração disso).

---

## Perguntas frequentes

**Perdi a senha do admin.** Sem outro administrador, é preciso apagar a chave
`hbier:userlist` e `hbier:user:<seu-login>` pelo console do Upstash — o app volta
para a tela de primeiro acesso.

**Posso ver o checklist de um colaborador?** Hoje o admin vê e edita as *tarefas*
de cada pessoa, mas não as marcações dela. Se quiser um painel de
acompanhamento (quem marcou o quê na semana), é uma evolução natural — peça que
eu monto.

**Funciona offline?** A tela abre, mas marcar exige internet, já que tudo é
salvo no servidor para sincronizar.
