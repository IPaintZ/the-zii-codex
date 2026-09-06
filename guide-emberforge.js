/* ============================================================================
   Zii Codex — Emberforge (smithy) guidance config
   Consumes the tool-agnostic engine in guide-core.js. Load AFTER it:
       <script src="guide-core.js"></script>
       <script src="guide-emberforge.js"></script>
   Everything here is Emberforge-specific copy + DOM targets. The shared glossary
   and workshop list live in the core (ZiiGuide.SHARED_GLOSS / SHARED_WORKSHOPS)
   and are used automatically when omitted below.
   ========================================================================== */
(function () {
  if (!window.ZiiGuide || !window.ZiiGuide.register) {
    console.error("guide-emberforge.js: guide-core.js must load first");
    return;
  }
  // DOM helpers from the core, for tip/step resolvers.
  const { box, row, lbl, lblRow, firstBox, byText } = window.ZiiGuide.helpers;

  // First-time hint per tab: [icon, title, body, showTourLink]
  const hints = {
    craft:     ["🔨","This is the Craft desk — your day-to-day.","Build a customer's order, get a price, take the sale, and see the raw materials you'll need to gather. New here? The guided tour walks the whole loop.", true],
    database:  ["📖","Every item you can make, with live costs.","Browse or search the whole catalog. Filter by material or slot, click a column to sort, and see your price next to what each item costs to make.", false],
    inventory: ["📦","Your stockroom — and where you set material prices.","Type each material's price in the Materials list, record real buys and sells as prices float, and smelt ore into ingots. Hit → to adopt the average you've actually paid.", false],
    sales:     ["💰","Your takings, at a glance.","Every checkout lands here. The Till shows running totals, Insights spots your best sellers, and the Sales Log is the full history.", false],
    buyers:    ["🧑‍🤝‍🧑","Who you sell to, and what they want.","Give regulars their own profile so their rate and buyback stick. Demand & prices is built from your real sales.", false],
    add:       ["➕","Add items the catalog doesn't have yet.","Paste a whole list at once, add one at a time, generate variants, or install a verified recipe pack. Most players never need this — the catalog ships full.", false],
    recipes:   ["🧪","The building blocks behind every item.","Define the raw materials, the components made from them, and the items made from those. Material prices live in Inventory now — this is about structure.", false],
    settings:  ["⚙️","Set this up once — then forget it.","Your prices, customer profiles, and bulk discounts live here, saved in this browser only. Do the Pricing section first — it's what every quote is built on.", true],
  };

  // Per-tab "How it works": { h: heading, s: subhead, steps: [[title, body], ...] }
  const how = {
    craft:{h:"How the Craft desk works", s:"Turn an order into a price, a sale, and a shopping list.",
      steps:[["Add items to an order","Type a finished item or raw material, set quantity, then <b>+ Add</b>."],
             ["Choose who's buying","The <b>buyer</b> and <b>rate</b> decide the markup. Walk-ins pay Standard ×2; regulars less."],
             ["Let them bring parts (optional)","<b>Buyback</b> credits customers for materials they supply."],
             ["Checkout","Logs the sale to <b>Sales</b> and draws down your <b>Inventory</b>."],
             ["Gather what's short","<b>Materials to Buy</b> lists every raw part beyond what you hold."]]},
    database:{h:"How the Database works", s:"A live, searchable catalog of everything you can make.",
      steps:[["Browse or search","Filter by material or slot, or type in the search box."],
             ["Sort by any column","Click a header — e.g. by <b>Your price</b> or <b>Can make</b>."],
             ["Read the costs","<b>Materials</b> + <b>Labor</b> = your price. <b>Can make</b> uses current stock."]]},
    inventory:{h:"How Inventory works", s:"Set material prices, track real stock, and smelt.",
      steps:[["Set material prices","Type a price in the <b>Materials</b> list, or hit <b>→</b> to adopt the average you've actually paid."],
             ["Record a trade","Pick a material, Buy or Sell, quantity, and the real unit price — prices float trade to trade."],
             ["Smelt ore into ingots","Use <b>Smelting</b> to convert raw ore + fuel into components."]]},
    sales:{h:"How Sales works", s:"Everything you sell is tracked here automatically.",
      steps:[["Watch the Till","Running revenue, cost, and <b>profit</b> since the last reset."],
             ["Read Insights","Your best sellers and where the margin is."],
             ["Review or clear the log","Full history; clear it when you reset the week."]]},
    buyers:{h:"How Buyers works", s:"Remember your regulars and read real demand.",
      steps:[["Add a buyer","Save a profile so their rate and buyback stick."],
             ["Read Demand & prices","Built from your own sales — what's actually moving."]]},
    add:{h:"How Add works", s:"Extend the catalog when you need something custom.",
      steps:[["Bulk import","Paste many items at once, one per line."],
             ["Add single items or variants","One at a time, or generate material variants."],
             ["Install verified packs","Load recipes pulled from the mod's real data."]]},
    recipes:{h:"How Recipes works", s:"The structure behind every item: raw → component → item.",
      steps:[["Define components","Ingots and strips made from raw materials."],
             ["Define items","Finished goods made from components and raws."],
             ["Prices come from Inventory","Set each material's price in <b>Inventory</b>; costs cascade up automatically."]]},
    settings:{h:"How Settings works", s:"Set up once; saved in this browser only.",
      steps:[["Set your pricing","Shop rate, default buyback, rounding — do this first."],
             ["Add customer profiles & tiers","Reusable rates and bulk discounts."],
             ["Back up your data","Export before switching devices."]]},
  };

  // Inline dotted-underline tooltips: wrap the real WORD in the app with a dotted
  // term + gloss. root() returns the element to search within; word is the text.
  const tips = [
    { root:()=> box("buybackRate"), word:"Buyback",
      html:"<b>Buyback</b> — the discount a customer gets for bringing their own materials. 0.75× credits them 75% of what those parts would have cost you." },
    { root:()=> lbl("custSel"), word:"Rate",
      html:"<b>Rate</b> — the markup multiplier on this order. Standard ×2 charges double the parts cost; regulars get lower rates." },
    { root:()=> lbl("buyerSel"), word:"Buyer",
      html:"<b>Buyer</b> — pick a saved customer to apply their remembered rate and buyback, or leave it on walk-in." },
    { root:()=> document.querySelector('#buybackSeg [data-base="cost"]'), word:"material cost",
      html:"<b>Material cost</b> — what the raw parts cost <b>you</b> to source. The floor under any price." },
    { root:()=> document.querySelector('#buybackSeg [data-base="retail"]'), word:"retail value",
      html:"<b>Retail value</b> — the sticker price at the base rate, before haggling or discounts." },
    { root:()=> byText("#tab-database", "th", "Can make"), word:"Can make",
      html:"<b>Can make</b> — how many you could craft right now from the materials you hold in Inventory." },
    { root:()=> byText("#tab-database", "th", "Labor"), word:"Labor",
      html:"<b>Labor</b> — value added on top of raw material cost: your time and skill, set by the rate." },
    { root:()=> byText("#tab-sales", "h3", "Till"), word:"Till",
      html:"<b>Till</b> — your running money counter since the last reset: revenue taken, cost spent, profit kept." },
    { root:()=> byText("#tab-inventory", "h3", "Smelting"), word:"Smelting",
      html:"<b>Smelting</b> — turn raw ore into ingots. The recipe shows how much ore and fuel each batch consumes." },
  ];

  // Guided tour — targets resolve against the REAL app DOM. Spotlight a SMALL
  // representative element (a row, a box), never a huge panel.
  const steps = [
    { tab:"settings",  resolve:()=> firstBox("settings"),
      title:"Start here: set your rates",
      body:"Your shop rate and buyback live in Settings — the markup you add on top of cost. Set them once; they save in this browser only." },
    { tab:"craft",     resolve:()=> box("addItem"),
      title:"Build an order",
      body:"On the Craft desk, type any item or raw material, set the quantity, and press + Add. Stack as many lines as you like." },
    { tab:"craft",     resolve:()=> lblRow("custSel"),
      title:"Set who is buying",
      body:"The buyer and Rate decide the markup. A walk-in pays Standard ×2; give regulars a friendlier rate here." },
    { tab:"craft",     resolve:()=> row("buybackRate"),
      title:"Let them bring parts",
      body:"Buyback credits a customer for materials they supply — charge for craft, not raw cost. Hover any ⓘ for a reminder." },
    { tab:"craft",     resolve:()=> box("orderTbl"),
      title:"Checkout",
      body:"When the order looks right, Checkout logs the sale and draws the goods out of your inventory." },
    { tab:"craft",     resolve:()=> box("needBody"),
      title:"Know what to gather",
      body:"Materials to Buy is your shopping list — every raw part the order still needs after your held stock." },
    { tab:"database",  resolve:()=> firstBox("database"),
      title:"Look anything up",
      body:"The Database is every item you can make with live costs. Filter, search, and sort by price or what you can make now." },
    { tab:"inventory", resolve:()=> document.querySelector("#invBody tr:not(.catrow)") || box("invBody") || firstBox("inventory"),
      title:"Set prices & track stock",
      body:"This is your stockroom — and where you set prices. Type a material's price in the Price column, or hit → to adopt the average you've actually paid. Record real buys and sells below to build price history." },
    { tab:"sales",     resolve:()=> firstBox("sales"),
      title:"Watch your takings",
      body:"Every checkout lands in Sales. The Till keeps a running profit total; Insights shows your best earners." },
    { tab:"buyers",    resolve:()=> firstBox("buyers"),
      title:"Remember your regulars",
      body:"Save buyer profiles so rates stick, and read demand built from your real sales. That's the whole loop — happy forging!" },
  ];

  // Instructional empty states injected into the real app's own empty containers.
  const emptyStates = {
    orderEmpty:
      '<div class="zg-es"><div class="zg-es-ic">🧾</div><div class="zg-es-t">Your order is empty</div>'+
      '<ol class="zg-es-steps"><li>Type an item in <b>New Order</b> above</li>'+
      '<li>Pick a <b>buyer</b> and a <b>rate</b></li>'+
      '<li>Hit <b>Checkout</b> — the sale is logged and stock adjusts</li></ol></div>',
    needEmpty:
      '<div class="zg-es"><div class="zg-es-ic">⛏</div><div class="zg-es-t2">Add items to see what you’ll need to gather.</div></div>',
  };

  window.ZiiGuide.register({
    id:   "emberforge",
    tool: "Emberforge",
    hints, how, tips, steps, emptyStates,
    // gloss and workshops default to the shared lists in the core.
  });
})();
