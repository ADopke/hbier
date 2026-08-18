const VERSAO = "2.7.4";
const CACHE  = "hbier-v" + VERSAO;

// Lista de arquivos para pré-cache
const ARQUIVOS = ["/", "/index.html", "/manifest.json", "/icon.svg"];

// INSTALL — pré-cacheia os arquivos estáticos
self.addEventListener("install", function(ev){
  ev.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ARQUIVOS); })
  );
  self.skipWaiting();  // ativa imediatamente, sem esperar fechar abas antigas
});

// ACTIVATE — apaga TODOS os caches antigos
self.addEventListener("activate", function(ev){
  ev.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

// FETCH — rede primeiro para HTML/API, cache para estáticos
self.addEventListener("fetch", function(ev){
  var url = new URL(ev.request.url);

  // API: sempre rede, nunca cache
  if (url.pathname.startsWith("/api/")) return;

  // index.html: rede primeiro (garante atualização), cache como fallback
  if (url.pathname === "/" || url.pathname === "/index.html"){
    ev.respondWith(
      fetch(ev.request).then(function(resp){
        var clone = resp.clone();
        caches.open(CACHE).then(function(c){ c.put(ev.request, clone); });
        return resp;
      }).catch(function(){
        return caches.match(ev.request);
      })
    );
    return;
  }

  // Demais recursos: cache primeiro, rede como fallback
  ev.respondWith(
    caches.match(ev.request).then(function(cached){
      var network = fetch(ev.request).then(function(resp){
        if (resp && resp.status === 200 && resp.type === "basic"){
          var clone = resp.clone();
          caches.open(CACHE).then(function(c){ c.put(ev.request, clone); });
        }
        return resp;
      });
      return cached || network;
    })
  );
});
