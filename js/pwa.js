/* DiOne PWA helper — shared by index.html and main.html.
   Policy:
   - Desktop  → use the website normally (no gate, no install button).
   - Mobile   → PWA ONLY: a browser tab shows a full-screen gate that asks
                the user to install the app (or open it if already installed).
   Also:
   - Registers the service worker (HTTPS or localhost only).
   - Polls version.json; when the website is updated (new version), the new
     service worker is fetched, pre-cached and the page reloads itself so the
     PWA always runs the latest version. */
(function(){
  "use strict";
  if (!("serviceWorker" in navigator)) return;         /* file:// or old browser */

  var CHECK_INTERVAL = 60 * 1000;                      /* poll version.json every 60 s */
  var currentVersion = null;
  var reloading = false;

  var deferredPrompt = null;
  var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
                 window.matchMedia("(max-width: 900px) and (pointer: coarse)").matches;
  var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  /* ---------- tiny UI (toast, install button, app gate) ---------- */
  var style = document.createElement("style");
  style.textContent =
    ".pwa-toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:10001;" +
    "display:flex;align-items:center;gap:10px;max-width:92vw;" +
    "background:#13284A;color:#fff;border-radius:12px;padding:12px 16px;" +
    "font:600 0.85rem 'Plus Jakarta Sans',system-ui,sans-serif;box-shadow:0 12px 30px rgba(10,28,56,.4);}" +
    ".pwa-toast .spin{width:14px;height:14px;border-radius:50%;flex:0 0 auto;" +
    "border:2px solid rgba(255,255,255,.3);border-top-color:#5AB2F0;animation:pwaspin .8s linear infinite;}" +
    "@keyframes pwaspin{to{transform:rotate(360deg)}}" +
    ".pwa-install{display:inline-flex;align-items:center;gap:8px;border:none;cursor:pointer;" +
    "background:linear-gradient(135deg,#5AB2F0,#0B3D91);color:#fff;border-radius:999px;" +
    "padding:12px 20px;font:700 0.9rem 'Plus Jakarta Sans',system-ui,sans-serif;" +
    "box-shadow:0 10px 24px rgba(11,61,145,.4);margin-top:10px;}" +
    ".pwa-gate{position:fixed;inset:0;z-index:10000;overflow:auto;" +
    "background:linear-gradient(200deg,#13284A 0%,#0A1C38 100%);color:#fff;" +
    "display:flex;flex-direction:column;align-items:center;justify-content:center;" +
    "gap:14px;text-align:center;padding:32px 24px;" +
    "font-family:'Plus Jakarta Sans',system-ui,sans-serif;}" +
    ".pwa-gate img{width:88px;height:88px;border-radius:50%;background:#fff;}" +
    ".pwa-gate h1{margin:8px 0 0;font-size:1.3rem;letter-spacing:-0.01em;}" +
    ".pwa-gate p{margin:0;font-size:0.9rem;color:#B9CDF2;max-width:420px;line-height:1.6;}" +
    ".pwa-gate .gate-hint{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);" +
    "border-radius:12px;padding:10px 16px;color:#DCEAFC;}";
  document.head.appendChild(style);

  function toast(msg, spinning, autoHideMs){
    var el = document.querySelector(".pwa-toast") || document.createElement("div");
    el.className = "pwa-toast";
    el.innerHTML = (spinning ? '<span class="spin"></span>' : "") + "<span></span>";
    el.lastChild.textContent = msg;
    document.body.appendChild(el);
    if (autoHideMs) setTimeout(function(){ if (el.parentNode) el.remove(); }, autoHideMs);
    return el;
  }
  function hideToast(){ var el = document.querySelector(".pwa-toast"); if (el) el.remove(); }

  /* ---------- install-state detection ----------
     - display-mode standalone / navigator.standalone → running INSIDE the app.
     - appinstalled event → just installed from this browser (remembered).
     - getInstalledRelatedApps() → Android Chrome can report the installed PWA
       from a browser tab (needs related_applications in the manifest once the
       production domain is known).
     - beforeinstallprompt firing means NOT installed → stale flag is cleared. */
  function isRunningAsApp(){
    return window.matchMedia("(display-mode: standalone)").matches ||
           window.navigator.standalone === true;   /* iOS Safari */
  }
  function markInstalled(){ try { localStorage.setItem("dione.pwa.installed", "1"); } catch(e){} }
  function clearInstalled(){ try { localStorage.removeItem("dione.pwa.installed"); } catch(e){} }

  function getInstallState(){
    return new Promise(function(resolve){
      var state = { runningAsApp: isRunningAsApp(), installed: "unknown", source: "none" };
      if (state.runningAsApp){
        markInstalled();
        state.installed = true; state.source = "display-mode";
        return resolve(state);
      }
      try {
        if (localStorage.getItem("dione.pwa.installed") === "1"){
          state.installed = true; state.source = "remembered";
          return resolve(state);
        }
      } catch(e){}
      if ("getInstalledRelatedApps" in navigator){
        navigator.getInstalledRelatedApps().then(function(apps){
          if (apps && apps.length){ markInstalled(); state.installed = true; state.source = "related-apps"; }
          resolve(state);
        }).catch(function(){ resolve(state); });
      } else resolve(state);
    });
  }
  /* callable from anywhere, e.g. the console:
     getDiOneInstallState().then(console.log) */
  window.getDiOneInstallState = getInstallState;

  /* ---------- mobile gate: the site is usable only inside the PWA ---------- */
  function showAppGate(installed){
    var gate = document.querySelector(".pwa-gate") || document.createElement("div");
    gate.className = "pwa-gate";
    var html = '<img src="sources/img/logo.png" alt="DiOne">';
    if (installed){
      html +=
        "<h1>Please open the DiOne app</h1>" +
        "<p>DiOne is installed on this device, so it can only be used from the app. " +
        "Open <strong>DiOne</strong> from your home screen to continue.</p>" +
        "<p>Demo build for YSSA group C only.</p>";
    } else {
      html +=
        "<h1>Install the DiOne app</h1>" +
        "<p>On mobile, DiOne runs as an app. Install it once and use it from your home screen.</p>" +
        "<p>Demo build for YSSA group C only.</p>" +
        (isIOS
          ? '<p class="gate-hint">iPhone / iPad: Click <strong>Share</strong> > Select <strong>Add to Home Screen</strong></p>'
          : '<button type="button" class="pwa-install" id="gateInstallBtn">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            "Install DiOne</button>");
    }
    gate.innerHTML = html;
    document.body.appendChild(gate);
    var btn = document.getElementById("gateInstallBtn");
    if (btn){
      btn.addEventListener("click", function(){
        if (!deferredPrompt){
          toast("Install is not ready yet — please try again in a moment.", false, 3000);
          return;
        }
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(function(){ deferredPrompt = null; });
      });
    }
  }

  /* apply the policy: desktop = website, mobile = PWA only */
  getInstallState().then(function(st){
    if (st.runningAsApp){
      /* inside the app — greet once per session */
      try {
        if (sessionStorage.getItem("dione.pwa.greeted")) return;
        sessionStorage.setItem("dione.pwa.greeted", "1");
      } catch(e){}
      toast("Running as installed app ✓", false, 2500);
      return;
    }
    if (!isMobile) return;                 /* desktop browser: use the website */
    showAppGate(st.installed === true);    /* mobile browser: blocked */
  });

  window.addEventListener("beforeinstallprompt", function(e){
    e.preventDefault();
    deferredPrompt = e;
    /* fires only when NOT installed — clear a stale flag (handles uninstall)
       and make sure the mobile gate is in "install" mode */
    clearInstalled();
    if (isMobile && !isRunningAsApp()) showAppGate(false);
  });

  window.addEventListener("appinstalled", function(){
    markInstalled();
    hideToast();
    toast("DiOne installed ✓ — open it from your home screen", false, 4000);
    if (isMobile) showAppGate(true);       /* browser tab stays blocked */
  });

  /* ---------- register the service worker ---------- */
  var swReg = null;
  navigator.serviceWorker.register("sw.js").then(function(reg){
    swReg = reg;
    reg.addEventListener("updatefound", function(){
      var nw = reg.installing;
      if (!nw) return;
      nw.addEventListener("statechange", function(){
        /* new version installed while an old one controls the page → switch over */
        if (nw.state === "installed" && navigator.serviceWorker.controller){
          toast("Updating DiOne to the latest version…", true);
          nw.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });
  }).catch(function(){ /* registration failed — page still works normally */ });

  /* when the new worker takes control, reload once so the fresh files show */
  navigator.serviceWorker.addEventListener("controllerchange", function(){
    if (reloading) return;
    reloading = true;
    setTimeout(function(){ window.location.reload(); }, 400);
  });

  /* ---------- version polling: website updated → PWA updates ---------- */
  function checkVersion(){
    fetch("version.json?t=" + Date.now(), { cache: "no-store" })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){
        if (!j || !j.version) return;
        if (currentVersion === null){ currentVersion = j.version; return; }
        if (j.version !== currentVersion){
          currentVersion = j.version;
          toast("New version " + j.version + " found — updating…", true);
          if (swReg) swReg.update();      /* fetches the new sw.js → updatefound → reload */
        }
      })
      .catch(function(){ /* offline — try again next tick */ });
  }
  checkVersion();
  setInterval(checkVersion, CHECK_INTERVAL);
  document.addEventListener("visibilitychange", function(){
    if (!document.hidden){ checkVersion(); if (swReg) swReg.update(); }
  });
})();
