/* ============================================================================
   Zii Codex — guidance engine (tool-agnostic core)
   Self-contained. Attaches to the REAL running tool: welcome, guided tour,
   help drawer + glossary, first-time per-tab hints, inline term tooltips, and a
   tab-switch highlight. Knows nothing tool-specific — a per-tool config file
   (guide-<tool>.js) supplies TABS/HINTS/HOW/STEPS/TIPS via ZiiGuide.register().

   Load order (two <script> tags before </body>):
       <script src="guide-core.js"></script>
       <script src="guide-<tool>.js"></script>

   Config shape (see GUIDE-AUTHORING.md):
     ZiiGuide.register({
       id:    "emberforge",     // localStorage namespace + "you're here" workshop
       tool:  "Emberforge",     // display name
       hints: { <tab>: [icon, title, body, showTourLink] },
       how:   { <tab>: { h, s, steps:[[title, body], ...] } },
       tips:  [ { root:()=>el, word, html }, ... ],
       steps: [ { tab, resolve:()=>el, title, body }, ... ],
       emptyStates: { <elementId>: "<html>", ... },   // optional, app-specific
       gloss:     [ [term, def], ... ],   // optional; defaults to shared glossary
       workshops: [ [icon, name, desc], ... ],  // optional; defaults to shared
     });
   Resolvers in tips/steps build against the real DOM using ZiiGuide.helpers.
   ========================================================================== */
(function () {
  if (window.ZiiGuide && window.ZiiGuide.__engine) return;   // core already present

  /* ------------------------------------------------ shared defaults (all tools) */
  // The five workshops of the suite. "you're here" is computed by matching the
  // active tool's display name, so every tool reuses this identical list.
  const SHARED_WORKSHOPS = [
    ["🔨","Emberforge","weapons, armour & ingots"],
    ["🧵","Loomhall","clothing, cloth & thread"],
    ["⚖","Trademoot","buy low, sell high, haul & haggle"],
    ["⚗","Elixirhall","potions, poisons & reagents"],
    ["🍳","Cookfire","food, drink & produce"],
  ];
  // Glossary — the same terms appear across every workshop; learn them once.
  const SHARED_GLOSS = [
    ["Rate","The markup multiplier on an order. Standard is ×2 (charge double the parts cost). Lower rates reward loyal buyers."],
    ["Buyback","Discount for a customer who brings their own materials. 0.75 = you credit 75% of those parts' cost."],
    ["Material cost","What the raw parts cost <i>you</i> to source. The floor under any price."],
    ["Retail value","The sticker price at the base rate, before haggling or buyer discounts."],
    ["Labor","The value added on top of material cost — your time and skill, set by the rate."],
    ["Intermediate / Component","A half-made part (ingot, strips) that finished items are built from."],
    ["Can make","How many you could craft right now from the materials you hold."],
    ["Till","Your running money counter since the last reset: revenue, cost, and profit."],
    ["Walk-in","An anonymous customer with no saved profile; pays the shop default rate."],
    ["Haggle","Click a line's price in an order to type a custom number for that one item."],
    ["Preset","A saved basket of items you sell often; load it to drop the whole set in at once."],
  ];

  /* ------------------------------------------------------------- DOM utils */
  const $  = (s, r=document) => r.querySelector(s);
  const el = (tag, attrs={}, html) => { const e=document.createElement(tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]); if (html!=null) e.innerHTML=html; return e; };
  function byText(scope, sel, text){
    const root = typeof scope==="string" ? $(scope) : scope; if(!root) return null;
    return [...root.querySelectorAll(sel)].find(n => n.textContent.trim().toLowerCase().startsWith(text.toLowerCase())) || null;
  }
  const gid = id => document.getElementById(id);
  const box = id => { const e=gid(id); return e ? e.closest(".box") : null; };
  const row = id => { const e=gid(id); return e ? (e.closest(".row")||e.closest(".box")) : null; };
  const lbl = id => { const e=gid(id); return e ? e.closest("label") : null; };
  const lblRow = id => { const e=gid(id); return e ? (e.closest(".row")||e.closest(".box")) : null; };
  const firstBox = tab => $("#"+NAV.panelPrefix+tab+" .box");
  // Helpers exposed to per-tool config files so their tip/step resolvers can
  // target the real DOM without re-implementing these lookups.
  const helpers = { $, el, byText, gid, box, row, lbl, lblRow, firstBox };

  /* ------------------------------------------------------- engine state / config */
  let CFG = null;    // normalized config from register()
  let LS  = null;    // localStorage keys, derived from CFG.id
  // Nav binding: the app's global view-switch fn + its button/panel id prefixes.
  // Defaults suit tab() with #t-<v> buttons and #tab-<v> panels; a tool can
  // override via config.nav (e.g. Cookfire uses view() / #v-<v> / #view-<v>).
  let NAV = { fn:"tab", btnPrefix:"t-", panelPrefix:"tab-" };
  // Review mode = the local mockup harness. On automatically for local hosts or ?review;
  // stays OFF on the live site so the shipped guide has no dev controls.
  const REVIEW = /[?&]review\b/.test(location.search) ||
                 /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) ||
                 location.protocol === "file:";
  const store = {
    get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
    set(k,v){ try { localStorage.setItem(k,v); } catch(e){} },
    del(k){ try { localStorage.removeItem(k); } catch(e){} },
  };

  function normalize(cfg){
    if (!cfg || !cfg.id || !cfg.tool) throw new Error("ZiiGuide: config needs id and tool");
    return {
      id:          cfg.id,
      tool:        cfg.tool,
      hints:       cfg.hints || {},
      how:         cfg.how || {},
      gloss:       cfg.gloss || SHARED_GLOSS,
      workshops:   cfg.workshops || SHARED_WORKSHOPS,
      tips:        cfg.tips || [],
      steps:       cfg.steps || [],
      emptyStates: cfg.emptyStates || null,
      nav:         Object.assign({ fn:"tab", btnPrefix:"t-", panelPrefix:"tab-" }, cfg.nav || {}),
    };
  }

  // Called once by the per-tool config file.
  function register(cfg){
    if (window.__ziiGuide) return;   // already registered/booted
    window.__ziiGuide = true;
    CFG = normalize(cfg);
    NAV = CFG.nav;
    LS = {
      welcome: "keizaal_guide_welcome_" + CFG.id,
      hint:    t => "keizaal_guide_hint_" + CFG.id + "_" + t,
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }

  /* ------------------------------------------------------------------ CSS */
  const CSS = `
  .zg-term{ border-bottom:1px dotted var(--gold-2); color:var(--gold); cursor:help; position:relative; }
  button .zg-term, .seg .zg-term, th .zg-term{ color:inherit; border-bottom-color:currentColor; opacity:.95; }
  .zg-tip{ position:absolute; left:0; bottom:150%; transform:translateY(4px);
    width:230px; background:#0d0b08; border:1px solid var(--gold-2); border-radius:7px; padding:8px 10px;
    color:var(--ink); font-size:11.5px; line-height:1.45; z-index:9000; box-shadow:0 8px 24px rgba(0,0,0,.5);
    opacity:0; pointer-events:none; transition:opacity .15s, transform .15s; text-align:left; font-weight:400; }
  .zg-tip.flip{ left:auto; right:0; }
  .zg-tip b{ color:var(--gold); }
  .zg-term:hover .zg-tip{ opacity:1; transform:translateY(0); }

  @keyframes zgNav{
    0%   { background:transparent; color:var(--gold); box-shadow:0 0 0 0 rgba(217,164,65,0); transform:translateY(0) scale(1); }
    25%  { background:var(--gold); color:#1c1710; box-shadow:0 0 0 4px rgba(217,164,65,.45), 0 0 18px 3px rgba(217,164,65,.7); transform:translateY(-1px) scale(1.08); }
    60%  { background:var(--gold-2); color:#1c1710; box-shadow:0 0 0 3px rgba(217,164,65,.30); transform:translateY(0) scale(1.02); }
    100% { background:transparent; color:var(--gold); box-shadow:0 0 0 10px rgba(217,164,65,0); transform:translateY(0) scale(1); }
  }
  nav button.zg-pulse{ animation:zgNav .62s ease-in-out 4; border-radius:6px; position:relative; z-index:2; font-weight:700; }
  /* a bright marker that drops onto the tab the tour just opened */
  .zg-tabflag{ position:fixed; z-index:9660; pointer-events:none; transform:translate(-50%,-4px);
    background:var(--gold); color:#1c1710; font-size:11px; font-weight:700; padding:3px 8px; border-radius:6px;
    box-shadow:0 6px 16px rgba(0,0,0,.5); white-space:nowrap; opacity:0; transition:opacity .15s, transform .25s; }
  .zg-tabflag::after{ content:""; position:absolute; left:50%; top:-5px; transform:translateX(-50%);
    border-left:5px solid transparent; border-right:5px solid transparent; border-bottom:5px solid var(--gold); }
  .zg-tabflag.on{ opacity:1; transform:translate(-50%,2px); }

  @keyframes zgTermFlash{
    0%   { background:var(--gold); color:#1c1710; box-shadow:0 0 0 3px rgba(217,164,65,.5); }
    100% { background:transparent; box-shadow:0 0 0 0 rgba(217,164,65,0); }
  }
  .zg-term.zg-flash{ animation:zgTermFlash 1s ease-out 3; border-radius:3px; }

  /* instructional empty states (re-injected into the real app) */
  .zg-es{ text-align:center; padding:14px 8px; }
  .zg-es-ic{ font-size:24px; opacity:.5; }
  .zg-es-t{ color:var(--ink); font-weight:600; margin-top:3px; }
  .zg-es-t2{ color:var(--dim); margin-top:6px; }
  .zg-es-steps{ display:inline-block; text-align:left; margin:8px 0 0; padding-left:18px; color:var(--dim); font-size:12px; }
  .zg-es-steps li{ margin:2px 0; }
  .zg-es-steps b{ color:var(--gold); }

  /* gentle "calm" compaction of the app's own chrome (toggle in the review dock) */
  body.zg-compact main{ padding:10px; }
  body.zg-compact .box{ padding:9px 12px; margin-bottom:9px; }
  body.zg-compact .box>h3{ margin-bottom:6px; }
  body.zg-compact nav button{ padding:8px 11px; }
  body.zg-compact input, body.zg-compact select{ padding:3px 6px; }
  body.zg-compact .top-in{ gap:12px; }

  .zg-hint{ display:flex; gap:10px; align-items:flex-start; background:linear-gradient(90deg,rgba(143,179,201,.13),rgba(143,179,201,.03));
    border:1px solid var(--steel); border-left-width:3px; border-radius:8px; padding:10px 12px; margin:0 0 12px; }
  .zg-hint .i{ font-size:16px; } .zg-hint .bd{ flex:1; } .zg-hint .bd b{ color:var(--steel); }
  .zg-hint .bd p{ margin:2px 0 0; color:var(--ink); font-size:12px; }
  .zg-hint .ac{ display:flex; flex-direction:column; gap:6px; align-items:flex-end; white-space:nowrap; }
  .zg-hint .x{ background:none; border:1px solid var(--steel); color:var(--steel); border-radius:5px; padding:3px 9px; cursor:pointer; font:inherit; font-size:11.5px; }
  .zg-hint .lk{ background:none; border:none; color:var(--steel); text-decoration:underline; cursor:pointer; font:inherit; font-size:11px; padding:0; }

  .zg-fab{ position:fixed; right:20px; bottom:20px; z-index:8000; width:46px; height:46px; border-radius:50%;
    background:var(--gold-2); color:#1c1710; border:1px solid var(--gold); font-size:22px; font-weight:700; cursor:pointer;
    box-shadow:0 8px 20px rgba(0,0,0,.5); }
  .zg-fab:hover{ background:var(--gold); }

  .zg-rev{ position:fixed; left:14px; bottom:14px; z-index:9999; background:#0d0b08; border:1px solid var(--gold-2);
    border-radius:10px; padding:9px 11px; box-shadow:0 12px 34px rgba(0,0,0,.65); width:224px; }
  .zg-rev .h{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; cursor:pointer; }
  .zg-rev .h b{ color:var(--gold); font-size:11px; letter-spacing:.6px; text-transform:uppercase; }
  .zg-rev .h .mn{ background:none; border:none; color:var(--dim); cursor:pointer; font:inherit; font-size:14px; line-height:1; }
  .zg-rev .btns{ display:flex; flex-wrap:wrap; gap:6px; }
  .zg-rev .btns button{ background:var(--panel-2); color:var(--ink); border:1px solid var(--line); border-radius:6px;
    padding:5px 9px; cursor:pointer; font:inherit; font-size:11.5px; }
  .zg-rev .btns button:hover{ border-color:var(--gold-2); color:var(--gold); }
  .zg-rev .note{ color:#6a6152; font-size:10px; margin-top:8px; line-height:1.35; }
  .zg-rev.min{ width:auto; }
  .zg-rev.min .btns, .zg-rev.min .note{ display:none; }
  .zg-rev.min .h{ margin-bottom:0; }

  .zg-scrim{ position:fixed; inset:0; background:rgba(8,6,4,.72); z-index:9500; display:none; align-items:center; justify-content:center; padding:20px; }
  .zg-scrim.on{ display:flex; }
  .zg-welcome{ background:var(--panel); border:1px solid var(--gold-2); border-radius:12px; max-width:560px; width:100%; padding:22px 24px; box-shadow:0 20px 60px rgba(0,0,0,.6); }
  .zg-welcome h2{ margin:0 0 2px; color:var(--gold); font-variant:small-caps; letter-spacing:.5px; font-size:22px; }
  .zg-welcome .sub{ color:var(--dim); font-style:italic; margin:0 0 16px; }
  .zg-welcome p.lead{ margin:0 0 12px; color:var(--dim); }
  .zg-grid{ display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px; }
  .zg-card{ border:1px solid var(--line); border-radius:8px; padding:9px 11px; background:var(--panel-2); }
  .zg-card.here{ border-color:var(--gold-2); }
  .zg-card .n{ color:var(--ink); font-weight:600; } .zg-card .n .em{ color:var(--gold); }
  .zg-card .d{ color:var(--dim); font-size:11px; margin-top:1px; }
  .zg-card .tag{ float:right; font-size:9px; text-transform:uppercase; letter-spacing:.5px; color:var(--gold); }
  .zg-foot{ display:flex; align-items:center; gap:12px; }
  .zg-foot label{ color:var(--dim); font-size:11.5px; display:inline-flex; gap:6px; align-items:center; cursor:pointer; }
  .zg-foot .ac{ margin-left:auto; display:flex; gap:10px; }
  .zg-btn{ background:var(--panel-2); color:var(--ink); border:1px solid var(--line); border-radius:5px; padding:6px 12px; cursor:pointer; font:inherit; font-size:12px; }
  .zg-btn:hover{ border-color:var(--gold-2); color:var(--gold); }
  .zg-btn.pri{ background:var(--gold-2); color:#1c1710; border-color:var(--gold); font-weight:600; }
  .zg-btn.pri:hover{ background:var(--gold); }

  .zg-block{ position:fixed; inset:0; z-index:9600; display:none; }
  .zg-block.on{ display:block; }
  .zg-spot{ position:absolute; border-radius:8px; border:3px solid var(--gold); pointer-events:none;
    transition:top .22s,left .22s,width .22s,height .22s; animation:zgSpot 1.5s ease-in-out infinite; }
  @keyframes zgSpot{
    0%,100%{ box-shadow:0 0 0 9999px rgba(8,6,4,.78), 0 0 14px 3px rgba(217,164,65,.45), inset 0 0 12px rgba(217,164,65,.25); }
    50%    { box-shadow:0 0 0 9999px rgba(8,6,4,.78), 0 0 30px 8px rgba(217,164,65,.85), inset 0 0 18px rgba(217,164,65,.45); }
  }
  .zg-coach{ position:fixed; left:50%; bottom:24px; transform:translateX(-50%); width:360px; max-width:calc(100vw - 32px);
    background:var(--panel); border:1px solid var(--gold-2); border-radius:10px; padding:14px 16px; box-shadow:0 16px 40px rgba(0,0,0,.7); }
  .zg-coach .sn{ color:var(--dim); font-size:10.5px; text-transform:uppercase; letter-spacing:.6px; }
  .zg-coach .sn .w{ color:var(--steel); }
  .zg-coach h4{ margin:3px 0 6px; color:var(--gold); font-size:14px; }
  .zg-coach p{ margin:0 0 12px; color:var(--ink); font-size:12.5px; line-height:1.5; }
  .zg-coach .nav{ display:flex; align-items:center; gap:8px; }
  .zg-coach .dots{ display:flex; gap:4px; flex:1; flex-wrap:wrap; }
  .zg-coach .dots i{ width:6px; height:6px; border-radius:50%; background:var(--line); }
  .zg-coach .dots i.on{ background:var(--gold); }
  .zg-coach .sk{ background:none; border:none; color:var(--dim); text-decoration:underline; cursor:pointer; font:inherit; font-size:11px; }

  .zg-dscrim{ position:fixed; inset:0; background:rgba(8,6,4,.5); z-index:9700; display:none; } .zg-dscrim.on{ display:block; }
  .zg-drawer{ position:fixed; top:0; right:0; height:100%; width:410px; max-width:92vw; background:var(--panel); border-left:1px solid var(--gold-2);
    z-index:9701; transform:translateX(100%); transition:transform .28s; display:flex; flex-direction:column; }
  .zg-drawer.on{ transform:translateX(0); }
  .zg-dh{ display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid var(--line); }
  .zg-dh h3{ margin:0; color:var(--gold); font-variant:small-caps; letter-spacing:.5px; font-size:16px; }
  .zg-db{ overflow:auto; padding:16px; flex:1; }
  .zg-cta{ display:flex; align-items:center; gap:10px; background:var(--panel-2); border:1px solid var(--gold-2); border-radius:8px; padding:10px 12px; margin-bottom:14px; }
  .zg-cta .t{ flex:1; } .zg-cta .t b{ color:var(--gold); } .zg-cta .t div{ color:var(--dim); font-size:11px; }
  .zg-seg{ display:flex; gap:2px; margin-bottom:14px; border:1px solid var(--line); border-radius:7px; overflow:hidden; }
  .zg-seg button{ flex:1; background:var(--panel-2); border:none; color:var(--dim); padding:7px; cursor:pointer; font:inherit; font-size:12px; }
  .zg-seg button.on{ background:var(--gold-2); color:#1c1710; font-weight:600; }
  .zg-flow{ list-style:none; margin:0; padding:0; counter-reset:s; }
  .zg-flow li{ position:relative; padding:0 0 14px 34px; counter-increment:s; }
  .zg-flow li::before{ content:counter(s); position:absolute; left:0; top:0; width:22px; height:22px; border-radius:50%; background:var(--gold-2); color:#1c1710; font-weight:700; display:flex; align-items:center; justify-content:center; font-size:12px; }
  .zg-flow li::after{ content:""; position:absolute; left:10px; top:24px; bottom:2px; width:1px; background:var(--line); }
  .zg-flow li:last-child::after{ display:none; }
  .zg-flow b{ color:var(--gold); } .zg-flow .d{ color:var(--dim); font-size:12px; }
  .zg-howh{ color:var(--gold); font-variant:small-caps; letter-spacing:.5px; margin:0 0 4px; font-size:15px; }
  .zg-hows{ color:var(--dim); font-size:11.5px; margin:0 0 12px; } .zg-hows b{ color:var(--steel); }
  .zg-gt{ border-bottom:1px solid var(--line); padding:9px 0; } .zg-gt dt{ color:var(--gold); font-weight:600; } .zg-gt dd{ margin:2px 0 0; color:var(--ink); font-size:12px; }
  .zg-dfoot{ border-top:1px solid var(--line); padding:12px 16px; display:flex; gap:10px; flex-wrap:wrap; }
  .zg-dfoot button{ background:none; border:none; color:var(--dim); text-decoration:underline; cursor:pointer; font:inherit; font-size:11.5px; padding:0; }
  .zg-dfoot button:hover{ color:var(--gold); }
  `;

  /* ---------------------------------------------------------------- build */
  function boot(){
    if (typeof window[NAV.fn] !== "function") { return setTimeout(boot, 60); } // app not ready yet
    document.head.appendChild(el("style", {}, CSS));
    document.body.classList.add("zg-compact");   // gentle app compaction (toggle in review dock)
    injectHints();
    injectTips();
    enhanceEmptyStates();
    buildWelcome();
    buildTour();
    buildDrawer();
    document.body.appendChild(mkFab());
    hookTab();
    if (REVIEW) buildReview();
    // show first-run welcome, else surface the current tab's first-time hint
    if (!store.get(LS.welcome)) openWelcome();
    showHintFor(currentTab());
  }

  function currentTab(){ const on=$("nav button.on");
    return on ? on.id.slice(NAV.btnPrefix.length) : (CFG && CFG.steps[0] ? CFG.steps[0].tab : ""); }

  /* ---- first-time hints ---- */
  function injectHints(){
    for (const t in CFG.hints){
      const host = gid(NAV.panelPrefix+t); if(!host) continue;
      const [ic,title,body,tour] = CFG.hints[t];
      const h = el("div",{class:"zg-hint", "data-hint":t});
      h.innerHTML = `<span class="i">${ic}</span><div class="bd"><b>${title}</b><p>${body}</p></div>`+
        `<div class="ac"><button class="x">Got it</button>${tour?'<button class="lk">Take the tour →</button>':''}</div>`;
      h.style.display = "none";
      h.querySelector(".x").onclick = ()=>{ store.set(LS.hint(t),"1"); h.style.display="none"; };
      const lk=h.querySelector(".lk"); if(lk) lk.onclick=startTour;
      host.insertBefore(h, host.firstChild);
    }
  }
  function showHintFor(t){
    const h=$('.zg-hint[data-hint="'+t+'"]'); if(!h) return;
    const tourOn = block && block.classList.contains("on");
    h.style.display = (tourOn || store.get(LS.hint(t))) ? "none" : "flex";
  }

  /* ---- inline dotted-underline tooltips ---- */
  function injectTips(){
    CFG.tips.forEach(tp=>{ try{ const root=tp.root(); if(root) dotWord(root, tp.word, tp.html); }catch(e){} });
  }
  function dotWord(container, word, tipHTML){
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())){
      if (node.parentElement && node.parentElement.closest(".zg-term")) continue;   // already wrapped
      const i = node.nodeValue.indexOf(word);
      if (i < 0) continue;
      const rest = node.splitText(i);
      rest.nodeValue = rest.nodeValue.slice(word.length);
      const span = el("span",{class:"zg-term"}, word);
      const tip  = el("span",{class:"zg-tip"}, tipHTML);
      span.appendChild(tip);
      span.addEventListener("mouseenter", ()=>{
        const br = span.getBoundingClientRect();
        tip.classList.toggle("flip", br.left > innerWidth * 0.5);
      });
      node.parentNode.insertBefore(span, rest);
      return true;
    }
    return false;
  }

  /* ---- instructional empty states (app-specific, from config) ---- */
  function enhanceEmptyStates(){
    if (!CFG.emptyStates) return;
    for (const id in CFG.emptyStates){ const n=gid(id); if(n) n.innerHTML = CFG.emptyStates[id]; }
  }

  /* ---- tab hook: pulse nav button + surface hint on switch ---- */
  function hookTab(){
    const orig = window[NAV.fn];
    window[NAV.fn] = function(n){
      const prev = currentTab();
      orig.apply(this, arguments);
      if (n !== prev){
        const btn = gid(NAV.btnPrefix+n);
        if (btn){ btn.classList.remove("zg-pulse"); void btn.offsetWidth; btn.classList.add("zg-pulse");
          setTimeout(()=>btn.classList.remove("zg-pulse"), 2700); }
        if (block && block.classList.contains("on")) flagTab(n);   // extra-obvious during the tour
      }
      showHintFor(n);
    };
  }

  /* ---- FAB ---- */
  function mkFab(){ const b=el("button",{class:"zg-fab", title:"Help & guided tour"},"?"); b.onclick=openDrawer; return b; }

  /* ---- review dock (local mockup only) ---- */
  function buildReview(){
    const bar = el("div",{class:"zg-rev"});
    bar.innerHTML =
      `<div class="h"><b>🧪 Mockup review</b><button class="mn" title="collapse">–</button></div>`+
      `<div class="btns">`+
        `<button data-a="welcome">Welcome</button>`+
        `<button data-a="tour">Guided tour</button>`+
        `<button data-a="help">Help panel</button>`+
        `<button data-a="hints">Show tab hints</button>`+
        `<button data-a="tips">Flash tooltips</button>`+
        `<button data-a="compact">Compact: ON</button>`+
      `</div>`+
      `<div class="note">Local review controls — not shipped. Each button triggers one friendliness feature so you can see them all.</div>`;
    document.body.appendChild(bar);
    const toggle = ()=> bar.classList.toggle("min");
    bar.querySelector(".mn").onclick = e=>{ e.stopPropagation(); toggle(); };
    bar.querySelector(".h").onclick = toggle;
    bar.querySelectorAll(".btns button").forEach(b=> b.onclick = ()=>{
      const a=b.dataset.a;
      if (a==="welcome"){ store.del(LS.welcome); openWelcome(); }
      else if (a==="tour") startTour();
      else if (a==="help") openDrawer();
      else if (a==="hints"){ for(const t in CFG.hints) store.del(LS.hint(t)); showHintFor(currentTab());
        window.scrollTo({top:0,behavior:"smooth"}); }
      else if (a==="tips") flashTips();
      else if (a==="compact"){ const on=document.body.classList.toggle("zg-compact");
        b.textContent = "Compact: " + (on?"ON":"OFF"); }
    });
  }
  function flashTips(){
    // flash the tooltips on the tab you're actually looking at
    let terms=[...document.querySelectorAll("#"+NAV.panelPrefix+currentTab()+" .zg-term")];
    if (!terms.length) terms=[...document.querySelectorAll(".zg-term")];
    if (!terms.length) return;
    terms[0].scrollIntoView({block:"center"});
    terms.forEach(t=>{ t.classList.remove("zg-flash"); void t.offsetWidth; t.classList.add("zg-flash");
      setTimeout(()=>t.classList.remove("zg-flash"), 3200); });
  }

  /* ---- bright marker dropped onto a tab when the tour opens it ---- */
  let tabFlag;
  function flagTab(n){
    const btn = gid(NAV.btnPrefix+n); if(!btn) return;
    if (!tabFlag){ tabFlag = el("div",{class:"zg-tabflag"}); document.body.appendChild(tabFlag); }
    const r = btn.getBoundingClientRect();       // viewport coords — flag is position:fixed
    tabFlag.textContent = "▲ " + btn.textContent.trim();
    tabFlag.style.left = (r.left + r.width/2) + "px";
    tabFlag.style.top  = (r.bottom + 2) + "px";
    tabFlag.classList.remove("on"); void tabFlag.offsetWidth; tabFlag.classList.add("on");
    clearTimeout(flagTab._t); flagTab._t = setTimeout(()=> tabFlag && tabFlag.classList.remove("on"), 2600);
  }

  /* ---- welcome ---- */
  let scrimW;
  function buildWelcome(){
    scrimW = el("div",{class:"zg-scrim"});
    const cards = CFG.workshops.map(([ic,nm,ds])=>{
      const here = nm === CFG.tool;
      return `<div class="zg-card ${here?'here':''}">${here?'<span class="tag">you’re here</span>':''}<div class="n">${ic} <span class="em">${here?nm:''}</span>${here?'':nm}</div><div class="d">${ds}</div></div>`;
    }).join("");
    scrimW.innerHTML =
      `<div class="zg-welcome"><h2>Welcome to the Zii Codex</h2><p class="sub">The soul of every recipe.</p>`+
      `<p class="lead">Each workshop is a little business calculator — price your goods, track stock, and log sales. You're in ${CFG.tool}:</p>`+
      `<div class="zg-grid">${cards}</div>`+
      `<div class="zg-foot"><label><input type="checkbox" id="zg-dontshow"> Don't show this again</label>`+
      `<div class="ac"><button class="zg-btn" id="zg-wskip">Skip for now</button><button class="zg-btn pri" id="zg-wtour">Show me around ${CFG.tool} →</button></div></div></div>`;
    document.body.appendChild(scrimW);
    $("#zg-wskip",scrimW).onclick = closeWelcome;
    $("#zg-wtour",scrimW).onclick = ()=>{ closeWelcome(); startTour(); };
    scrimW.addEventListener("click", e=>{ if(e.target===scrimW) closeWelcome(); });
  }
  function openWelcome(){ scrimW.classList.add("on"); }
  function closeWelcome(){ if ($("#zg-dontshow",scrimW)?.checked) store.set(LS.welcome,"1"); scrimW.classList.remove("on"); }

  /* ---- drawer ---- */
  let drawer, dscrim;
  function buildDrawer(){
    dscrim = el("div",{class:"zg-dscrim"});
    drawer = el("aside",{class:"zg-drawer"});
    const gloss = CFG.gloss.map(([t,d])=>`<div class="zg-gt"><dt>${t}</dt><dd>${d}</dd></div>`).join("");
    drawer.innerHTML =
      `<div class="zg-dh"><h3>${CFG.tool} — Help</h3><button class="zg-btn" id="zg-dclose">✕ Close</button></div>`+
      `<div class="zg-db">`+
        `<div class="zg-cta"><div class="t"><b>Guided tour</b><div>A short walk through the whole workshop.</div></div><button class="zg-btn pri" id="zg-dtour">▶ Take the tour</button></div>`+
        `<div class="zg-seg"><button class="on" data-p="how">How it works</button><button data-p="gloss">Glossary</button></div>`+
        `<div id="zg-how"></div>`+
        `<div id="zg-gloss" hidden><p class="zg-hows">Same terms appear across every workshop — learn them once.</p><dl style="margin:0">${gloss}</dl></div>`+
      `</div>`+
      `<div class="zg-dfoot"><button id="zg-replay">↺ Replay welcome</button><button id="zg-resethints">↺ Reset tab hints</button></div>`;
    document.body.appendChild(dscrim); document.body.appendChild(drawer);
    $("#zg-dclose",drawer).onclick = closeDrawer;
    $("#zg-dtour",drawer).onclick  = ()=>{ closeDrawer(); startTour(); };
    dscrim.onclick = closeDrawer;
    drawer.querySelectorAll(".zg-seg button").forEach(b=> b.onclick=()=>{
      drawer.querySelectorAll(".zg-seg button").forEach(x=>x.classList.remove("on")); b.classList.add("on");
      $("#zg-how",drawer).hidden   = b.dataset.p!=="how";
      $("#zg-gloss",drawer).hidden = b.dataset.p!=="gloss";
    });
    $("#zg-replay",drawer).onclick = ()=>{ store.del(LS.welcome); closeDrawer(); openWelcome(); };
    $("#zg-resethints",drawer).onclick = ()=>{ for(const t in CFG.hints) store.del(LS.hint(t)); closeDrawer(); showHintFor(currentTab()); };
  }
  function renderHow(){
    const t=currentTab(), d=CFG.how[t]||CFG.how.craft||Object.values(CFG.how)[0];
    if (!d){ $("#zg-how",drawer).innerHTML=""; return; }
    $("#zg-how",drawer).innerHTML =
      `<h4 class="zg-howh">${d.h}</h4><p class="zg-hows">Showing help for the <b>${t}</b> tab · ${d.s}</p>`+
      `<ol class="zg-flow">`+d.steps.map(s=>`<li><b>${s[0]}.</b> <div class="d">${s[1]}</div></li>`).join("")+`</ol>`;
  }
  function openDrawer(){ renderHow(); drawer.classList.add("on"); dscrim.classList.add("on"); }
  function closeDrawer(){ drawer.classList.remove("on"); dscrim.classList.remove("on"); }

  /* ---- tour ---- */
  let block, spot, coach, ti=0;
  function buildTour(){
    const STEPS = CFG.steps;
    block = el("div",{class:"zg-block"});
    spot  = el("div",{class:"zg-spot"});
    coach = el("div",{class:"zg-coach"});
    coach.innerHTML =
      `<div class="sn"><span id="zg-sn"></span> · <span class="w" id="zg-sw"></span></div>`+
      `<h4 id="zg-st"></h4><p id="zg-sb"></p>`+
      `<div class="nav"><div class="dots" id="zg-dots"></div><button class="sk" id="zg-skip">Skip</button>`+
      `<button class="zg-btn" id="zg-back">Back</button><button class="zg-btn pri" id="zg-next">Next</button></div>`;
    block.appendChild(spot); block.appendChild(coach); document.body.appendChild(block);
    $("#zg-dots",coach).innerHTML = STEPS.map(()=>"<i></i>").join("");
    $("#zg-next",coach).onclick = ()=> ti===STEPS.length-1 ? endTour() : showStep(ti+1);
    $("#zg-back",coach).onclick = ()=> showStep(ti-1);
    $("#zg-skip",coach).onclick = endTour;
    addEventListener("resize", ()=>{ if(block.classList.contains("on")) place(); });
  }
  const appTop = () => document.querySelector(".top");
  // Block user scrolling during the tour (programmatic scrollTo still works), and keep the
  // spot glued to its target if any scroll does slip through.
  const SCROLL_KEYS = new Set(["ArrowUp","ArrowDown","PageUp","PageDown","Home","End"," ","Spacebar"]);
  function noScroll(e){ if (e.target && e.target.closest && e.target.closest(".zg-coach")) return; e.preventDefault(); }
  function noScrollKeys(e){
    if (!SCROLL_KEYS.has(e.key)) return;
    const t = e.target;
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    e.preventDefault();
  }
  function onTourScroll(){ if (block.classList.contains("on")) place(); }
  function startTour(){ closeWelcome(); closeDrawer();
    const t=appTop(); if(t){ t.dataset.zgZ=t.style.zIndex||""; t.style.zIndex="9660"; } // lift nav above the dim
    addEventListener("wheel", noScroll, {passive:false});
    addEventListener("touchmove", noScroll, {passive:false});
    addEventListener("keydown", noScrollKeys, false);
    addEventListener("scroll", onTourScroll, {passive:true});
    block.classList.add("on"); showStep(0); }
  function endTour(){ block.classList.remove("on");
    removeEventListener("wheel", noScroll, {passive:false});
    removeEventListener("touchmove", noScroll, {passive:false});
    removeEventListener("keydown", noScrollKeys, false);
    removeEventListener("scroll", onTourScroll, {passive:true});
    const t=appTop(); if(t){ t.style.zIndex=t.dataset.zgZ||""; }
    if (tabFlag) tabFlag.classList.remove("on");
    showHintFor(currentTab()); }

  let curEl=null, curStep=null, gen=0;
  function fillCoach(){                             // coach text — always synchronous with the step
    const STEPS = CFG.steps;
    $("#zg-sn",coach).textContent = `Step ${ti+1} of ${STEPS.length}`;
    $("#zg-sw",coach).textContent = curStep.tab.charAt(0).toUpperCase()+curStep.tab.slice(1);
    $("#zg-st",coach).textContent = curStep.title;
    $("#zg-sb",coach).textContent = curStep.body;
    $("#zg-back",coach).style.visibility = ti===0 ? "hidden" : "visible";
    $("#zg-next",coach).textContent = ti===STEPS.length-1 ? "Done" : "Next";
    [...$("#zg-dots",coach).children].forEach((d,k)=>d.classList.toggle("on", k===ti));
  }
  function showStep(i){
    const STEPS = CFG.steps;
    ti = Math.max(0, Math.min(STEPS.length-1, i));
    curStep = STEPS[ti];
    const myGen = ++gen;                            // guard against rapid clicks racing
    window[NAV.fn](curStep.tab);                    // real switch (pulses nav)
    fillCoach();                                    // text in sync immediately — never lags the tab
    requestAnimationFrame(()=>{                     // let the tab paint, then position the spot
      if (myGen !== gen) return;                    // superseded by a newer step
      curEl = curStep.resolve();
      if (!curEl){ // resolver failed — advance rather than showing a broken frame
        if (ti < STEPS.length-1) return showStep(ti+1); else return endTour();
      }
      const y = curEl.getBoundingClientRect().top + scrollY - innerHeight*0.30;
      window.scrollTo({ top: Math.max(0, y), behavior:"auto" });  // instant; layout is synchronous
      if (myGen === gen) place();
    });
  }
  function place(){
    if (!curEl) return;
    // .zg-spot lives inside the fixed .zg-block, so it is positioned in VIEWPORT
    // coordinates — no scroll offset. A scroll listener re-runs this to keep it glued.
    const r = curEl.getBoundingClientRect(), pad=6;
    spot.style.top    = (r.top - pad) + "px";
    spot.style.left   = (r.left - pad) + "px";
    spot.style.width  = (r.width + pad*2) + "px";
    spot.style.height = (r.height + pad*2) + "px";
  }

  /* --------------------------------------------------------------- exports */
  window.ZiiGuide = {
    __engine: true,
    register,
    helpers,
    SHARED_GLOSS,
    SHARED_WORKSHOPS,
    // runtime API for console/testing (available after register())
    tour: () => startTour(),
    welcome: () => openWelcome(),
    help: () => openDrawer(),
    reset(){ if(!LS) return; store.del(LS.welcome); for(const t in CFG.hints) store.del(LS.hint(t)); },
  };
  // Back-compat alias: earlier prototype exposed window.ziiGuide.
  window.ziiGuide = window.ZiiGuide;
})();
