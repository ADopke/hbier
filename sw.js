const VERSAO = "3.16.0";
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

// PUSH (v3.16.0) — avisos em horário marcado (programação do dia, semana, alertas)
self.addEventListener("push", function(ev){
  var d = {};
  try { d = ev.data ? ev.data.json() : {}; } catch(e){ d = { title: "HBier", body: ev.data ? ev.data.text() : "" }; }
  ev.waitUntil(self.registration.showNotification(d.title || "HBier", {
    body: d.body || "", icon: "/icon.svg", badge: "/icon.svg", tag: d.tag || "hbier",
    data: { url: d.url || "/" }, renotify: true
  }));
});
self.addEventListener("notificationclick", function(ev){
  ev.notification.close();
  var url = (ev.notification.data && ev.notification.data.url) || "/";
  ev.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(lista){
    for (var i = 0; i < lista.length; i++){
      var c = lista[i];
      if (c.url.indexOf(self.location.origin) === 0 && "focus" in c){
        c.postMessage({ tipo: "abrirWa", url: url });
        return c.focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});
