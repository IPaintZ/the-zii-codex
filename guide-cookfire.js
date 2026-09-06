/* ============================================================================
   Zii Codex — Cookfire (cook) guidance config
   Consumes the tool-agnostic engine in guide-core.js. Load AFTER it:
       <script src="guide-core.js"></script>
       <script src="guide-cookfire.js"></script>
   Everything here is Cookfire-specific copy + DOM targets. The shared glossary
   and workshop list live in the core (ZiiGuide.SHARED_GLOSS / SHARED_WORKSHOPS).

   NOTE: Cookfire's nav is NON-standard. It uses a global view() switch with
   #v-<view> buttons and #view-<view> panels (not tab()/#t-/#tab-), and it uses
   .panel containers (not .box) — so box()/firstBox() won't resolve here. The
   `nav` override below rebinds the engine; resolvers target real cook selectors.
   Views: kitchen, counter, pantry, sales, buyers, settings.
   ========================================================================== */
(function () {
  if (!window.ZiiGuide || !window.ZiiGuide.register) {
    console.error("guide-cookfire.js: guide-core.js must load first");
    return;
  }
  // DOM helpers from the core, for tip/step resolvers.
  const { $, gid, byText } = window.ZiiGuide.helpers;
  // Cookfire uses no .box class, so target its real .panel / .kv / table structure.
  const q = s => document.querySelector(s);
  // Find a <p class="note"> (or any el) inside a view whose text contains a word.
  const noteWith = (view, word) =>
    [...document.querySelectorAll("#view-" + view + " .note")].find(n => n.textContent.includes(word)) || null;

  // First-time hint per view: [icon, title, body, showTourLink]
  const hints = {
    kitchen:  ["🍳","This is the Kitchen — where you cook.","Pick a dish from the cookbook, price it, and queue servings. Hit Cook to turn a batch into finished stock you can sell. New here? The tour walks the whole loop.", true],
    counter:  ["🧾","The Counter — sell what you've cooked.","Add finished dishes to a sale for the buyer. If they bring their own ingredients, a trade-in credits coin off the bill and restocks your pantry.", false],
    pantry:   ["🥕","Your larder — ingredients, prep, and real prices.","Record what you actually pay, set each ingredient's Par (target stock), and mill or prep components like flour and butter. Trade-ins land here.", false],
    sales:    ["💰","Your takings, at a glance.","Every checkout lands here. The Till shows running revenue, cost and profit; Insights spots your best dishes and buyers; the Sales Log is the full history.", false],
    buyers:   ["🧑‍🤝‍🧑","Who you sell to, and what they want.","Each buyer is one markup — the top row sets the cookbook price. Give regulars their own trade-in rates, and read demand built from your real sales.", false],
    settings: ["⚙️","Set this up once — then forget it.","Currency, labor, rounding, trade-in rates and bulk discounts live here, saved in this browser only. Do Pricing first — it's what every quote is built on.", true],
  };

  // Per-view "How it works": { h: heading, s: subhead, steps: [[title, body], ...] }
  const how = {
    kitchen:{h:"How the Kitchen works", s:"Price a dish, queue servings, cook a batch into finished stock.",
      steps:[["Pick a dish","Search the <b>cookbook</b> and click a dish to see its ingredients and price."],
             ["Add servings","Set a quantity and add it to the <b>cook queue</b>."],
             ["Cook the batch","<b>Cook</b> turns the queue into <b>finished stock</b> and draws ingredients from the pantry."],
             ["Save a preset (optional)","Store a queue you cook often and reload the whole set at once."]]},
    counter:{h:"How the Counter works", s:"Sell finished dishes; take ingredient trade-ins for credit.",
      steps:[["Pick who's buying","The <b>buyer</b> up top sets the markup on the sale."],
             ["Add finished dishes","Click a dish in <b>finished stock</b>. Out-of-stock dishes are cooked to order at checkout."],
             ["Take a trade-in (optional)","If the buyer brings ingredients, add them — they credit coin and land in your pantry."],
             ["Complete the sale","Logs it to <b>Sales</b> and adjusts stock."]]},
    pantry:{h:"How the Pantry works", s:"Track real prices, set Par, and prep components.",
      steps:[["Record a trade","Pick an ingredient, Buy or Sell, quantity, and the real unit price — prices float trade to trade."],
             ["Set Par & buyback","<b>Par</b> is your target stock; <b>Buy?</b> lets a buyer trade an ingredient back in."],
             ["Mill & prep","Turn raw ingredients into components like <b>flour</b>, <b>butter</b> and <b>cheese</b>."]]},
    sales:{h:"How Sales works", s:"Everything you sell is tracked here automatically.",
      steps:[["Watch the Till","Running revenue, cost and <b>profit</b> since the last reset."],
             ["Read Insights","Your best-selling dishes and most valuable buyers."],
             ["Review or clear the log","Full history; clear it when you reset the week."]]},
    buyers:{h:"How Buyers works", s:"Remember your regulars and read real demand.",
      steps:[["Add a buyer","Each buyer is one <b>markup</b>. The top row sets the cookbook price."],
             ["Set trade-in overrides","Give a buyer their own restock/overstock rates, or leave blank to inherit."],
             ["Read Demand & prices","Built from your own sales — what's actually moving."]]},
    settings:{h:"How Settings works", s:"Set up once; saved in this browser only.",
      steps:[["Set pricing","Currency, default labor, rounding and cost basis — do this first."],
             ["Set trade-in rates","Restock rate (up to Par) and overstock rate (beyond it)."],
             ["Add bulk discount tiers","Discounts by total servings on a tray."],
             ["Back up your data","Export before switching devices."]]},
  };

  // Inline dotted-underline tooltips: wrap the real WORD in the app with a dotted
  // term + gloss. root() returns the element to search within; word is the text.
  const tips = [
    { root:()=> byText("#view-settings","h2","Trade-in"), word:"Trade-in",
      html:"<b>Trade-in</b> (buyback) — a buyer brings their own ingredients; you credit coin off the bill and the ingredients restock your pantry." },
    { root:()=> byText("#view-settings","label","Restock rate"), word:"Restock rate",
      html:"<b>Restock rate</b> — the % you credit for trade-in ingredients up to <b>Par</b> (what you're short). The higher of the two trade-in rates." },
    { root:()=> byText("#view-settings","label","Overstock rate"), word:"Overstock rate",
      html:"<b>Overstock rate</b> — the % you credit for trade-in ingredients past <b>Par</b> — surplus you don't really need." },
    { root:()=> noteWith("pantry","Par"), word:"Par",
      html:"<b>Par</b> — your target stock for an ingredient. Trade-ins pay the restock rate up to Par, the overstock rate beyond it." },
    { root:()=> byText("#view-pantry","th","Buy?"), word:"Buy?",
      html:"<b>Buy?</b> — whether a buyer may trade this ingredient back in. Cheap staples are usually switched off." },
    { root:()=> byText("#view-kitchen","label","Preset"), word:"Preset",
      html:"<b>Preset</b> — a saved cook queue you make often; load it to drop the whole batch in at once." },
    { root:()=> byText("#view-pantry","label","Component"), word:"Component",
      html:"<b>Component</b> — a prepped, half-made part (flour, butter, cheese) that finished dishes are built from." },
    { root:()=> byText("#view-sales","h2","Till"), word:"Till",
      html:"<b>Till</b> — your running money counter since the last reset: revenue taken, cost spent, profit kept." },
    { root:()=> byText("#view-buyers","th","Markup"), word:"Markup",
      html:"<b>Markup</b> — the multiplier on a dish's cost. The top buyer's markup sets the cookbook price; regulars can pay less." },
  ];

  // Guided tour — targets resolve against the REAL app DOM. Spotlight a SMALL
  // representative element (a row, a header, a card), never a huge panel.
  const steps = [
    { tab:"settings",  resolve:()=> q("#view-settings .panel-b .kv") || byText("#view-settings","h2","Pricing"),
      title:"Start here: set your prices",
      body:"Settings holds your currency, labor and rounding, plus the trade-in rates below. Set them once — they save in this browser only." },
    { tab:"kitchen",   resolve:()=> q("#cards .card") || gid("search"),
      title:"Browse the cookbook",
      body:"Search or filter dishes on the left, then click one. This is where every cook starts." },
    { tab:"kitchen",   resolve:()=> gid("detailTitle"),
      title:"Price a dish",
      body:"The detail panel shows a dish's ingredients and its price at the current buyer's markup. Set servings and add them to the cook queue." },
    { tab:"kitchen",   resolve:()=> byText("#view-kitchen","h2","Cook queue"),
      title:"Cook a batch",
      body:"The cook queue is what you're about to make. Hit Cook and the batch becomes finished stock, drawing ingredients from your pantry." },
    { tab:"counter",   resolve:()=> q("#stockList .card") || byText("#view-counter","h2","Finished stock"),
      title:"Sell off the shelf",
      body:"The Counter lists what you've precooked. Click a dish to add it to the sale; out-of-stock dishes are cooked to order at checkout." },
    { tab:"counter",   resolve:()=> byText("#view-counter","h2","Sale"),
      title:"Ring it up — and take trade-ins",
      body:"Add dishes for the buyer, then Complete sale. If they bring ingredients, a trade-in credits coin off the bill and restocks your pantry." },
    { tab:"pantry",    resolve:()=> q("#invBody tr") || byText("#view-pantry","h2","Ingredients"),
      title:"Stock your pantry",
      body:"Every ingredient with its price, stock and Par. Set Par to size trade-ins, and flip Buy? to let buyers trade one back in." },
    { tab:"sales",     resolve:()=> byText("#view-sales","h2","Till"),
      title:"Watch your takings",
      body:"Every checkout lands in Sales. The Till keeps a running profit total; Insights shows your best dishes and buyers." },
    { tab:"buyers",    resolve:()=> q("#buyersBody tr") || byText("#view-buyers","h2","Buyers"),
      title:"Remember your regulars",
      body:"Each buyer is one markup, with their own trade-in rates. Read demand built from your real sales. That's the whole loop — happy cooking!" },
  ];

  // Instructional empty states injected into the real app's own empty containers.
  // Toggled by display only (never innerHTML-rewritten), so this copy persists.
  const emptyStates = {
    trayEmpty:
      '<div class="zg-es"><div class="zg-es-ic">🍲</div><div class="zg-es-t">Nothing queued to cook yet</div>'+
      '<ol class="zg-es-steps"><li>Pick a dish from the <b>cookbook</b> on the left</li>'+
      '<li>Set servings and <b>+ Add</b> it to the queue</li>'+
      '<li>Hit <b>Cook</b> — the batch becomes finished stock</li></ol></div>',
    saleEmpty:
      '<div class="zg-es"><div class="zg-es-ic">🧾</div><div class="zg-es-t">No dishes on this sale</div>'+
      '<ol class="zg-es-steps"><li>Click a dish in <b>finished stock</b> to add it</li>'+
      '<li>Add a <b>trade-in</b> if the buyer brings ingredients</li>'+
      '<li>Hit <b>Complete sale</b> — it logs and adjusts stock</li></ol></div>',
    trEmpty:
      '<div class="zg-es"><div class="zg-es-ic">🪙</div><div class="zg-es-t2">No trades yet — record a buy or sell above to build real price history.</div></div>',
    salesEmpty:
      '<div class="zg-es"><div class="zg-es-ic">💰</div><div class="zg-es-t2">No sales yet — cook a batch, then sell it at the Counter.</div></div>',
    demandEmpty:
      '<div class="zg-es"><div class="zg-es-ic">📈</div><div class="zg-es-t2">No sales yet — demand fills in once dishes start moving.</div></div>',
  };

  // Cook-specific glossary terms added on top of the shared set (kept intact).
  const gloss = [
    ...window.ZiiGuide.SHARED_GLOSS,
    ["Par","Your target stock for an ingredient. Trade-ins pay the restock rate up to Par, the overstock rate for anything beyond it."],
    ["Restock / Overstock rate","The two trade-in rates: the higher restock rate for ingredients you're short of (up to Par), the lower overstock rate for surplus."],
    ["Finished stock","Dishes you've precooked and can sell straight off the Counter shelf."],
    ["Cook queue","The Kitchen's build list — dishes you're about to cook into finished stock."],
    ["Yield","How many servings one batch of a recipe makes. Price is figured per serving."],
  ];

  window.ZiiGuide.register({
    id:   "cookfire",
    tool: "Cookfire",
    nav:  { fn:"view", btnPrefix:"v-", panelPrefix:"view-" },
    hints, how, tips, steps, emptyStates, gloss,
    // workshops defaults to the shared list in the core.
  });
})();
