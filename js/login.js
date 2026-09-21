(function(){
  "use strict";

  /* Fallback demo accounts — kept in sync with sources/db_accounts.json.
     Used when the page is opened via file:// where fetch() is blocked. */
  var FALLBACK_ACCOUNTS = [
    {type:"dealer",    username:"dealer01",    password:"Dealer#2026", passcode:"123456", country:"Thailand",  fullname:"Mr.Saige Fuentes",   displayName:"Bangkok Air Service Co., Ltd."},
    {type:"dealer",    username:"dealer02",    password:"Dealer#2026", passcode:"222222", country:"Singapore", fullname:"Mr.Bowen Higgins",   displayName:"Merlion HVAC Solutions Pte. Ltd."},
    {type:"affiliate", username:"affiliate01", password:"Affil#2026",  passcode:"654321", country:"Viet Nam",  fullname:"Mr.Kylan Gentry",    displayName:"Daikin Airconditioning Vietnam JSC"},
    {type:"affiliate", username:"affiliate02", password:"Affil#2026",  passcode:"888888", country:"Australia", fullname:"Mr.Marceline Avila", displayName:"Daikin Australia Pty. Ltd."},
    {type:"employee",  sso:"okta", username:"aukit.k@dci.daikin.co.jp", country:"Thailand", fullname:"Mr.Aukit Karoon", displayName:"Daikin Employee (Okta SSO)"}
  ];

  var accounts = FALLBACK_ACCOUNTS;
  fetch("sources/db_accounts.json")
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){ if (j && j.accounts) accounts = j.accounts; })
    .catch(function(){ /* file:// or offline — fallback stays */ });

  var currentRole = "dealer";
  var tabs     = document.querySelectorAll(".roles button");
  var credForm = document.getElementById("credForm");
  var ssoPane  = document.getElementById("ssoPane");
  var credMsg  = document.getElementById("credMsg");
  var ssoMsg   = document.getElementById("ssoMsg");
  var signInBtn= document.getElementById("signInBtn");
  var oktaBtn  = document.getElementById("oktaBtn");

  /* role tabs */
  tabs.forEach(function(btn){
    btn.addEventListener("click", function(){
      currentRole = btn.dataset.role;
      tabs.forEach(function(b){
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      var employee = currentRole === "employee";
      credForm.classList.toggle("active", !employee);
      ssoPane.classList.toggle("active", employee);
      clearMsg(credMsg); clearMsg(ssoMsg);
    });
  });

  /* show / hide password */
  var pw = document.getElementById("password");
  document.getElementById("pwToggle").addEventListener("click", function(){
    var showing = pw.type === "text";
    pw.type = showing ? "password" : "text";
    this.textContent = showing ? "SHOW" : "HIDE";
    this.setAttribute("aria-label", showing ? "Show password" : "Hide password");
  });

  /* digits only in passcode */
  var passcode = document.getElementById("passcode");
  passcode.addEventListener("input", function(){
    this.value = this.value.replace(/\D/g, "").slice(0, 6);
  });

  function setMsg(el, text, kind){ el.textContent = text; el.className = "msg " + kind; }
  function clearMsg(el){ el.textContent = ""; el.className = "msg"; }

  function finishLogin(session){
    try { sessionStorage.setItem("dikonnect.session", JSON.stringify(session)); } catch(e){}
    setTimeout(function(){ try { window.location.href = "main.html"; } catch(e){} }, 900);
  }

  /* dealer / affiliate submit */
  credForm.addEventListener("submit", function(ev){
    ev.preventDefault();
    clearMsg(credMsg);

    var country = document.getElementById("country").value;
    var u = document.getElementById("username").value.trim();
    var p = pw.value;
    var c = passcode.value.trim();

    if (!country)            { setMsg(credMsg, "Please select your country / region.", "error"); return; }
    if (!u || !p)            { setMsg(credMsg, "Please enter your username and password.", "error"); return; }
    if (!/^\d{6}$/.test(c))  { setMsg(credMsg, "Passcode must be exactly 6 digits.", "error"); return; }

    signInBtn.disabled = true;
    signInBtn.textContent = "Verifying…";

    /* simulated auth latency */
    setTimeout(function(){
      var acc = accounts.find(function(a){
        return a.type === currentRole &&
               a.username === u && a.password === p && a.passcode === c;
      });
      signInBtn.disabled = false;
      signInBtn.textContent = "Sign in";

      if (!acc){
        var wrongRole = accounts.find(function(a){
          return a.username === u && a.password === p && a.passcode === c;
        });
        setMsg(credMsg, wrongRole
          ? "This account is registered as “" + wrongRole.type + "”. Switch to the " + wrongRole.type + " tab."
          : "Invalid username, password, or passcode. Please try again.", "error");
        return;
      }

      if (acc.country && acc.country !== country){
        setMsg(credMsg, "This account is registered in " + acc.country + ". Please select the matching country.", "error");
        return;
      }

      setMsg(credMsg, "Welcome, " + (acc.fullname || acc.displayName || acc.username) + "! Redirecting…", "ok");
      finishLogin({ role: acc.type, username: acc.username, fullname: acc.fullname, displayName: acc.displayName, country: acc.country, method: "credentials", at: Date.now() });
    }, 700);
  });

  /* employee Okta SSO (simulated for demo) */
  oktaBtn.addEventListener("click", function(){
    clearMsg(ssoMsg);
    oktaBtn.disabled = true;
    oktaBtn.lastChild.textContent = " Redirecting to Okta…";

    setTimeout(function(){
      oktaBtn.lastChild.textContent = " Authenticating…";
      setTimeout(function(){
        oktaBtn.disabled = false;
        oktaBtn.lastChild.textContent = " Sign in with Okta";
        var emp = accounts.find(function(a){ return a.type === "employee"; }) || {};
        setMsg(ssoMsg, "Okta SSO successful. Welcome back, " + (emp.fullname || "Daikin Employee") + "! Redirecting…", "ok");
        finishLogin({ role: "employee", username: emp.username || "employee@daikin", fullname: emp.fullname,
                      displayName: emp.displayName || "Daikin Employee", country: emp.country, method: "okta-sso", at: Date.now() });
      }, 1100);
    }, 900);
  });
})();
