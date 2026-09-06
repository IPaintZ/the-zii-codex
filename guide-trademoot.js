/* ============================================================================
   Zii Codex — Trademoot (trader) guidance config
   Consumes the tool-agnostic engine in guide-core.js. Load AFTER it:
       <script src="guide-core.js"></script>
       <script src="guide-trademoot.js"></script>
   Everything here is Trademoot-specific copy + DOM targets. Trademoot is a
   buy-low / sell-high trading tool, not a crafting workshop: its views are
   desk / market / arb / ledger / settings and it uses the default tab() nav.
   The shared glossary and workshop list live in the core; only the trading
   terms below are added on top of the shared set.
   ========================================================================== */
(function () {
  if (!window.ZiiGuide || !window.ZiiGuide.register) {
    console.error("guide-trademoot.js: guide-core.js must load first");
    return;
  }
  // DOM helpers from the core, for tip/step resolvers.
  const { box, firstBox, byText, gid } = window.ZiiGuide.helpers;

  // First-time hint per tab: [icon, title, body, showTourLink]
  const hints = {
    desk:     ["⚖","This is the Trade Desk — where you build a deal.","Pick Sell or Buy, add goods and quantities, choose a customer, and the desk prices every line and tallies your profit. New here? The guided tour walks the whole loop.", true],
    market:   ["📈","Every good's price, here and now.","See what you'd buy and sell each good for in this hold, its margin, this week's move (Δ) and its recent trend. Click a column to sort.", false],
    arb:      ["🗺","Buy low in one hold, sell high in another.","For each good, the cheapest place to buy and the dearest to sell — and the profit per unit for hauling between them. Best hauls first.", false],
    ledger:   ["📒","Your trading history and running totals.","Coffers show what you've sold, spent on stock, and booked as profit. The Deal Ledger is every recorded buy and sell.", false],
    settings: ["⚙️","Set this up once — then trade.","Tune each hold's price levels, your customers' rates and reputations, import goods, and back up your book — all saved in this browser only. Start with Locations.", true],
  };

  // Per-tab "How it works": { h: heading, s: subhead, steps: [[title, body], ...] }
  const how = {
    desk:{h:"How the Trade Desk works", s:"Turn goods into a priced deal and your profit at a glance.",
      steps:[["Choose a side","<b>Sell</b> to a customer, or <b>Buy / restock</b> to refill your own stock."],
             ["Add goods","Type a good, set the quantity, then <b>+ Add</b>. Stack as many lines as you like."],
             ["Pick your customer","Their <b>rate</b> and <b>reputation</b> set the price and how far you can haggle."],
             ["Haggle a line","Click a line's <b>Price</b> to type a custom number within the customer's band."],
             ["Read the summary","Revenue, your cost, <b>profit</b> and <b>margin</b> update as you build the deal."]]},
    market:{h:"How the Market board works", s:"A live price board for the hold you're standing in.",
      steps:[["Pick a hold","Use the location selector up top — prices tilt by hold and category."],
             ["Scan buy vs sell","The <b>You buy</b> and <b>You sell</b> columns, with the <b>margin</b> between them."],
             ["Watch the move","<b>Δ wk</b> is this week's price change; the <b>trend</b> sparkline shows recent weeks."],
             ["Sort and filter","Click any column to sort, filter by category, or search by name."]]},
    arb:{h:"How Arbitrage works", s:"Find where to buy cheap and sell dear.",
      steps:[["Read each haul","For every good, the cheapest hold to <b>buy</b> and the dearest to <b>sell</b>."],
             ["Check the return","<b>Haul / unit</b> is the profit per unit; <b>Return</b> is that as a percent of cost."],
             ["Chase the top rows","Best hauls are listed first — that's where the coin is."]]},
    ledger:{h:"How the Ledger works", s:"Every recorded deal and what it added up to.",
      steps:[["Read your coffers","Sold, spent on stock, and <b>booked profit</b> across recorded deals."],
             ["Scan the deal log","Each buy and sell with its counterparty, quantity and unit price."],
             ["Advance the market","Use <b>↻ Advance market</b> up top to drift prices into a new week."]]},
    settings:{h:"How Settings works", s:"Set up once; saved in this browser only.",
      steps:[["Tune your holds","Each hold's price multiplier per category — under 1 is cheap, over 1 is dear."],
             ["Add customers","Set each customer's <b>rate</b> and <b>reputation</b> band."],
             ["Import goods","Add craftable goods in bulk, then price them in the Market tab."],
             ["Back up your data","Export before switching devices or clearing cache."]]},
  };

  // Inline dotted-underline tooltips: wrap the real WORD in the app with a dotted
  // term + gloss. root() returns the element to search within; word is the text.
  // Every root here is a STABLE element (a static th / h3 / hint), not a
  // re-rendered table body, so the wrap survives the app's render() cycles.
  const tips = [
    { root:()=> gid("deskTip"), word:"haggle",
      html:"<b>Haggle</b> — click a line's price to type your own number, so long as it stays inside the customer's reputation band." },
    { root:()=> byText("#tab-market", "th", "Margin"), word:"Margin",
      html:"<b>Margin</b> — the gap between a good's buy and sell price, as a percent of the buy price. Higher margin, more profit per coin." },
    { root:()=> byText("#tab-arb", "h3", "Arbitrage"), word:"Arbitrage",
      html:"<b>Arbitrage</b> — buy a good where it's cheap and sell where it's dear, pocketing the gap between holds." },
    { root:()=> byText("#tab-arb", "th", "Haul"), word:"Haul",
      html:"<b>Haul</b> — the profit from carrying a good between two holds: the dearest sell price minus the cheapest buy price." },
    { root:()=> byText("#tab-arb", "th", "Return"), word:"Return",
      html:"<b>Return</b> — a haul as a percent of what you paid; how hard each coin is working." },
    { root:()=> byText("#tab-ledger", "h3", "Coffers"), word:"Coffers",
      html:"<b>Coffers</b> — your running trade totals: what you've sold, spent on stock, and booked as profit." },
    { root:()=> byText("#tab-settings", "p.hint", "Rate"), word:"Rate",
      html:"<b>Rate</b> — the multiplier on your list price for a customer. ×1 is the sticker price; loyal buyers get a friendlier rate." },
    { root:()=> byText("#tab-settings", "p.hint", "Rate"), word:"Rep",
      html:"<b>Reputation</b> — how well a customer knows you. A wider band lets you haggle the price further before it's a hard sell." },
  ];

  // Guided tour — targets resolve against the REAL app DOM. Spotlight a SMALL
  // representative element (a row, a box, a control), never a huge panel.
  // Flow: set up holds & customers → find a deal on Market / Arbitrage →
  // build it on the Desk → track it in the Ledger.
  const steps = [
    { tab:"settings",  resolve:()=> firstBox("settings"),
      title:"Start with your holds",
      body:"Each hold tilts prices per category — under 1 means goods there are cheap to buy, over 1 means dear to sell. This is what drives every arbitrage." },
    { tab:"settings",  resolve:()=> box("custBody"),
      title:"Know your customers",
      body:"A customer's rate multiplies your list price, and their reputation sets the haggle band — how far you can push the price before it's a hard sell." },
    { tab:"market",    resolve:()=> document.querySelector("#mkBody tr") || firstBox("market"),
      title:"Read the market",
      body:"The Market board shows what you'd buy and sell each good for in this hold, its margin, this week's move (Δ) and its recent trend. Click a column to sort." },
    { tab:"arb",       resolve:()=> document.querySelector("#arbBody tr") || firstBox("arb"),
      title:"Find the best haul",
      body:"Arbitrage pairs the cheapest hold to buy each good with the dearest to sell it. The haul is your profit per unit for carrying it between them." },
    { tab:"desk",      resolve:()=> gid("sideSeg"),
      title:"Start a deal",
      body:"On the Trade Desk, choose Sell to sell to a customer, or Buy / restock to refill your own stock." },
    { tab:"desk",      resolve:()=> gid("addItem"),
      title:"Add your goods",
      body:"Type a good, set the quantity, and press + Add. Stack as many lines as the deal needs." },
    { tab:"desk",      resolve:()=> gid("custSel"),
      title:"Pick who's buying",
      body:"The customer's rate and reputation set the price and your haggle band. Click any line's Price to haggle within it." },
    { tab:"desk",      resolve:()=> box("summaryRow"),
      title:"Watch the numbers",
      body:"The Deal Summary tallies revenue, your cost, profit and margin as you go — so you always know what a deal is really worth." },
    { tab:"ledger",    resolve:()=> firstBox("ledger"),
      title:"Track your coffers",
      body:"Every recorded deal lands in the Ledger. Coffers keep your running sold, spent and booked profit. That's the whole loop — happy trading!" },
  ];

  // Instructional empty state injected into the real app's own empty container.
  // renderDesk only toggles this element's display, never its innerHTML, so the
  // teaching copy persists and reappears whenever the deal is cleared.
  const emptyStates = {
    deskEmpty:
      '<div class="zg-es"><div class="zg-es-ic">⚖️</div><div class="zg-es-t">No deal yet</div>'+
      '<ol class="zg-es-steps"><li>Pick <b>Sell</b> or <b>Buy / restock</b></li>'+
      '<li>Type a good and quantity, then <b>+ Add</b></li>'+
      '<li>Choose a <b>customer</b> and haggle the <b>Price</b></li></ol></div>',
  };

  // Shared glossary + Trademoot's own trading terms (keep the shared set intact).
  const gloss = [
    ...window.ZiiGuide.SHARED_GLOSS,
    ["Margin","The gap between a good's buy and sell price, as a percent of the buy price. Higher margin, more profit per coin."],
    ["Spread","The raw difference between what you buy a good for and what you sell it for."],
    ["Arbitrage","Buying a good where it's cheap and selling where it's dear — profiting on the gap between holds."],
    ["Haul","The profit from carrying a good between two holds: the dearest sell price minus the cheapest buy price."],
    ["Return","A haul expressed as a percent of what you paid — how hard your coin is working."],
    ["Tilt","A hold's price multiplier for a category. Under 1 means goods there are cheap to buy; over 1 means dear to sell."],
    ["Reputation","How well a customer knows you. A wider reputation band lets you haggle the price further before it's a hard sell."],
    ["Coffers","Your running trade totals: what you've sold, spent on stock, and booked as profit."],
  ];

  window.ZiiGuide.register({
    id:   "trademoot",
    tool: "Trademoot",
    hints, how, tips, steps, emptyStates, gloss,
    // workshops default to the shared list in the core; default tab() nav (no override).
  });
})();
