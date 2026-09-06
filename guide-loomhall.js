/* ============================================================================
   Zii Codex — Loomhall (tailor) guidance config
   Consumes the tool-agnostic engine in guide-core.js. Load AFTER it:
       <script src="guide-core.js"></script>
       <script src="guide-loomhall.js"></script>
   Everything here is Loomhall-specific copy + DOM targets. The shared glossary
   and workshop list live in the core (ZiiGuide.SHARED_GLOSS / SHARED_WORKSHOPS)
   and are used automatically when omitted below.
   ========================================================================== */
(function () {
  if (!window.ZiiGuide || !window.ZiiGuide.register) {
    console.error("guide-loomhall.js: guide-core.js must load first");
    return;
  }
  // DOM helpers from the core, for tip/step resolvers.
  const { box, row, lbl, lblRow, firstBox, byText } = window.ZiiGuide.helpers;

  // First-time hint per tab: [icon, title, body, showTourLink]
  const hints = {
    craft:     ["🧵","This is the Craft desk — your day-to-day.","Build a customer's order, get a price, take the sale, and see the cloth and thread you'll need to gather. New here? The guided tour walks the whole loop.", true],
    database:  ["📖","Every garment you can make, with live costs.","Browse or search the whole catalog. Filter by cloth or slot, click a column to sort, and see your price next to what each garment costs to make.", false],
    inventory: ["📦","Your stockroom — cloth, thread and takings.","Record real buys and sells as prices float, hit → to adopt the average you've actually paid, and keep an eye on the woven cloth and strips you're holding.", false],
    sales:     ["💰","Your takings, at a glance.","Every checkout lands here. The Till shows running totals, Insights spots your best sellers, and the Sales Log is the full history.", false],
    buyers:    ["🧑‍🤝‍🧑","Who you sell to, and what they want.","Give regulars their own profile so their rate and buyback stick. Demand & prices is built from your real sales.", false],
    add:       ["➕","Add garments the catalog doesn't have yet.","Paste a whole list at once, add one at a time, generate cosmetic variants, or install a tailoring recipe pack. Most players never need this — the catalog ships full.", false],
    recipes:   ["🪡","The building blocks behind every garment.","Define the raw fibres, the cloth and strips woven from them, and the garments made from those. Prices per unit live here — costs cascade upward.", false],
    settings:  ["⚙️","Set this up once — then forget it.","Your labor, customer markups, and bulk discounts live here, saved in this browser only. Do the Pricing section first — it's what every quote is built on.", true],
  };

  // Per-tab "How it works": { h: heading, s: subhead, steps: [[title, body], ...] }
  const how = {
    craft:{h:"How the Craft desk works", s:"Turn an order into a price, a sale, and a shopping list.",
      steps:[["Add garments to an order","Type a finished garment or raw fibre, set quantity, then <b>+ Add</b>."],
             ["Choose who's buying","The <b>buyer</b> and <b>rate</b> decide the markup. Walk-ins pay Standard ×2; regulars less."],
             ["Let them bring cloth (optional)","<b>Buyback</b> credits customers for materials they supply."],
             ["Checkout","Logs the sale to <b>Sales</b> and draws down your <b>Inventory</b>."],
             ["Gather what's short","<b>Materials Needed</b> lists every raw fibre beyond what you hold."]]},
    database:{h:"How the Database works", s:"A live, searchable catalog of every garment you can make.",
      steps:[["Browse or search","Filter by cloth or slot, or type in the search box."],
             ["Sort by any column","Click a header — e.g. by <b>Your price</b> or <b>Can make</b>."],
             ["Read the costs","<b>Materials</b> + <b>Labor</b> = your price. <b>Can make</b> uses current stock."]]},
    inventory:{h:"How Inventory works", s:"Track real cloth prices and the stock you're holding.",
      steps:[["Record a trade","Pick a fibre or component, Buy or Sell, quantity, and the real unit price — prices float trade to trade."],
             ["Adopt what you paid","Hit <b>→</b> on a material to set its calc price to the average you've actually paid."],
             ["Watch woven stock","<b>Crafted Components</b> shows the cloth, thread and strips you've already woven and are holding."]]},
    sales:{h:"How Sales works", s:"Everything you sell is tracked here automatically.",
      steps:[["Watch the Till","Running revenue, cost, and <b>profit</b> since the last reset."],
             ["Read Insights","Your best sellers and where the margin is."],
             ["Review or clear the log","Full history; clear it when you reset the week."]]},
    buyers:{h:"How Buyers works", s:"Remember your regulars and read real demand.",
      steps:[["Add a buyer","Save a profile so their rate and buyback stick."],
             ["Read Demand & prices","Built from your own sales — what's actually moving."]]},
    add:{h:"How Add works", s:"Extend the catalog when you need something custom.",
      steps:[["Bulk import","Paste many garments at once, one per line."],
             ["Add single garments or variants","One at a time, or generate cosmetic variants that share a base recipe."],
             ["Install a recipe pack","Load a starter set of extra garments — adds only what's missing."]]},
    recipes:{h:"How Recipes works", s:"The structure behind every garment: fibre → cloth → garment.",
      steps:[["Set raw material prices","Each fibre's <b>price / unit</b> is the floor under every cost."],
             ["Define components","Cloth, thread and strips woven from raw fibres, with a <b>yield</b> per batch."],
             ["Define garments","Finished goods made from components and raw fibres; costs cascade up automatically."]]},
    settings:{h:"How Settings works", s:"Set up once; saved in this browser only.",
      steps:[["Set your pricing","Default labor, rounding, cost basis — do this first."],
             ["Add customer markups & tiers","Reusable per-customer rates and bulk discounts."],
             ["Back up your data","Export before switching devices."]]},
  };

  // Inline dotted-underline tooltips: wrap the real WORD in the app with a dotted
  // term + gloss. root() returns the element to search within; word is the text.
  const tips = [
    { root:()=> box("buybackRate"), word:"Buyback",
      html:"<b>Buyback</b> — the discount a customer gets for bringing their own cloth. 0.75× credits them 75% of what those parts would have cost you." },
    { root:()=> lbl("custSel"), word:"Rate",
      html:"<b>Rate</b> — the markup multiplier on this order. Standard ×2 charges double the parts cost; regulars get lower rates." },
    { root:()=> lbl("buyerSel"), word:"Buyer",
      html:"<b>Buyer</b> — pick a saved customer to apply their remembered rate and buyback, or leave it on walk-in." },
    { root:()=> document.querySelector('#buybackSeg [data-base="cost"]'), word:"material cost",
      html:"<b>Material cost</b> — what the raw cloth costs <b>you</b> to source. The floor under any price." },
    { root:()=> document.querySelector('#buybackSeg [data-base="retail"]'), word:"retail value",
      html:"<b>Retail value</b> — the sticker price at the base rate, before haggling or discounts." },
    { root:()=> byText("#tab-database", "th", "Can make"), word:"Can make",
      html:"<b>Can make</b> — how many you could sew right now from the cloth and thread you hold in Inventory." },
    { root:()=> byText("#tab-database", "th", "Labor"), word:"Labor",
      html:"<b>Labor</b> — value added on top of raw material cost: your time and skill at the loom, set by the rate." },
    { root:()=> byText("#tab-sales", "h3", "Till"), word:"Till",
      html:"<b>Till</b> — your running money counter since the last reset: revenue taken, cost spent, profit kept." },
    { root:()=> byText("#tab-inventory", "th", "Calc price"), word:"Calc price",
      html:"<b>Calc price</b> — the fixed cost basis a garment is priced from. The <b>→</b> button adopts the average you've actually paid." },
  ];

  // Guided tour — targets resolve against the REAL app DOM. Spotlight a SMALL
  // representative element (a row, a box), never a huge panel.
  const steps = [
    { tab:"settings",  resolve:()=> firstBox("settings"),
      title:"Start here: set your pricing",
      body:"Your default labor and customer markups live in Settings — the value you add on top of cost. Set them once; they save in this browser only." },
    { tab:"craft",     resolve:()=> box("addItem"),
      title:"Build an order",
      body:"On the Craft desk, type any garment or raw fibre, set the quantity, and press + Add. Stack as many lines as you like." },
    { tab:"craft",     resolve:()=> lblRow("custSel"),
      title:"Set who is buying",
      body:"The buyer and Rate decide the markup. A walk-in pays Standard ×2; give regulars a friendlier rate here." },
    { tab:"craft",     resolve:()=> row("buybackRate"),
      title:"Let them bring cloth",
      body:"Buyback credits a customer for materials they supply — charge for the tailoring, not the raw cloth. Set it per line with the ⛏ brought button." },
    { tab:"craft",     resolve:()=> box("orderTbl"),
      title:"Checkout",
      body:"When the order looks right, Checkout logs the sale and draws the cloth and thread out of your inventory." },
    { tab:"craft",     resolve:()=> box("needBody"),
      title:"Know what to gather",
      body:"Materials Needed is your shopping list — every raw fibre the order still needs after your held stock." },
    { tab:"database",  resolve:()=> firstBox("database"),
      title:"Look anything up",
      body:"The Database is every garment you can make with live costs. Filter, search, and sort by price or what you can make now." },
    { tab:"inventory", resolve:()=> document.querySelector("#invBody tr:not(.catrow)") || box("invBody") || firstBox("inventory"),
      title:"Track prices & stock",
      body:"This is your stockroom. Record real buys and sells as prices float, or hit → to adopt the average you've actually paid to build price history." },
    { tab:"sales",     resolve:()=> firstBox("sales"),
      title:"Watch your takings",
      body:"Every checkout lands in Sales. The Till keeps a running profit total; Insights shows your best earners." },
    { tab:"buyers",    resolve:()=> firstBox("buyers"),
      title:"Remember your regulars",
      body:"Save buyer profiles so rates stick, and read demand built from your real sales. That's the whole loop — happy weaving!" },
  ];

  // Instructional empty states injected into the real app's own empty containers.
  const emptyStates = {
    orderEmpty:
      '<div class="zg-es"><div class="zg-es-ic">🧾</div><div class="zg-es-t">Your order is empty</div>'+
      '<ol class="zg-es-steps"><li>Type a garment in <b>New Order</b> above</li>'+
      '<li>Pick a <b>buyer</b> and a <b>rate</b></li>'+
      '<li>Hit <b>Checkout</b> — the sale is logged and stock adjusts</li></ol></div>',
    needEmpty:
      '<div class="zg-es"><div class="zg-es-ic">🧶</div><div class="zg-es-t2">Add garments to see what cloth you’ll need to gather.</div></div>',
  };

  window.ZiiGuide.register({
    id:   "loomhall",
    tool: "Loomhall",
    hints, how, tips, steps, emptyStates,
    // gloss and workshops default to the shared lists in the core.
  });
})();
