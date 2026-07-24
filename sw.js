// sw.js — permite o app abrir sem internet.
//
// IMPORTANTE: ao publicar uma versão nova, altere a linha VERSAO abaixo para
// o mesmo número que está em index.html. É isso que faz o navegador descartar
// o cache antigo e buscar os arquivos novos.

const VERSAO = "1.3.0";
const CACHE = "hbier-" + VERSAO;

// o mínimo para a tela abrir offline
const SHELL = ["/", "/index.html", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(
          chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const req = evento.request;

  // só GET entra no cache; envios nunca
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // a API precisa sempre da rede — dados velhos aqui seriam pior que erro
  if (url.pathname.startsWith("/api/")) return;

  const querHTML =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (querHTML) {
    // Rede primeiro: garante que uma versão nova do app chegue no primeiro
    // acesso com sinal. Sem rede, cai para o que está guardado.
    evento.respondWith(
      fetch(req)
        .then((resp) => {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
          return resp;
        })
        .catch(() =>
          caches
            .match(req)
            .then((r) => r || caches.match("/index.html"))
        )
    );
    return;
  }

  // demais arquivos (ícone, manifest, fontes): cache primeiro, rede depois
  evento.respondWith(
    caches.match(req).then((guardado) => {
      if (guardado) return guardado;
      return fetch(req)
        .then((resp) => {
          if (resp && (resp.ok || resp.type === "opaque")) {
            const copia = resp.clone();
            caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
          }
          return resp;
        })
        .catch(() => guardado);
    })
  );
});
