# Como confirmar que a versão 2.0.0 está rodando

O código no arquivo está correto desde a 1.9.7.
O problema é que o Vercel ou o service worker está servindo a versão antiga.

---

## Passo 1 — Subir os arquivos

Suba exatamente estes três arquivos para o GitHub:
- `index.html`
- `sw.js`
- `package.json`

---

## Passo 2 — Forçar redeploy limpo no Vercel

1. Abra o projeto no Vercel
2. Clique em **Settings** → **Functions** → botão **Invalidate Cache** (se disponível)
   OU
2. Vá em **Deployments** → clique no deploy mais recente → **⋯** → **Redeploy**
   Marque a opção **"Clear build cache"** se aparecer

---

## Passo 3 — Limpar o service worker no celular E no PC

### No Chrome do celular:
1. Abra o app
2. Barra de endereço → toque no 🔒 → **Configurações do site**
3. **Limpar dados** → confirmar
4. Reabra o app

### No Chrome do PC:
1. F12 → aba **Application**
2. **Service Workers** → clique em **Unregister**
3. **Clear storage** → **Clear site data**
4. Recarregue com **Ctrl+Shift+R**

---

## Passo 4 — Confirmar a versão

O rodapé deve mostrar: **VERSÃO 2.0.0**

Se ainda mostrar 1.9.x ou anterior, o cache não foi limpo.

---

## Como testar o envase

1. Aba **Programação** → botão **📦 Envase** (azul)
2. Deve abrir um modal com cabeçalho **azul escuro** e título "Novo Envase"
3. Preencha o produto e salve
4. Na lista, deve aparecer com etiqueta **Envase** (azul), não Brassagem

Se o modal abrir com cabeçalho verde e título "Nova Brassagem",
o cache ainda não foi limpo — repita o Passo 3.
