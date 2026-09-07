/* ============================================================================
   Zii Codex — Elixirhall (alchemy) guidance config
   Consumes the tool-agnostic engine in guide-core.js. Load AFTER it:
       <script src="guide-core.js"></script>
       <script src="guide-elixirhall.js"></script>
   Everything here is Elixirhall-specific copy + DOM targets. The shared glossary
   and workshop list live in the core (ZiiGuide.SHARED_GLOSS / SHARED_WORKSHOPS);
   here we KEEP the shared glossary intact and add alchemy terms on top.

   Domain note: Keizaal alchemy is a FIXED recipe book (KzlCraftingAlchemy) —
   potions come from set reagent recipes in tiers, NOT free effect-discovery.
   Pricing is markup + flat labor (no Rate / Buyback / Till / Buyer here), so a
   few shared-glossary tips simply no-op on this tool.
   ========================================================================== */
(function () {
  if (!window.ZiiGuide || !window.ZiiGuide.register) {
    console.error("guide-elixirhall.js: guide-core.js must load first");
    return;
  }
  // DOM helpers from the core, for tip/step resolvers.
  const { box, row, lbl, lblRow, firstBox, byText, gid } = window.ZiiGuide.helpers;

  // First-time hint per tab: [icon, title, body, showTourLink]
  const hints = {
    lab:       ["⚗","This is the Lab — where you brew.","Pick a recipe, see its price, gather what it needs, and stack a batch into the brew queue. New here? The guided tour walks the whole loop.", true],
    catalog:   ["📖","Every recipe you can brew, grouped by effect.","Browse or search all 46 alchemy recipes. Each effect shows its full tier ladder, with live costs from your ingredient prices.", false],
    reagents:  ["🧫","Craft the intermediates other potions need.","A few recipes turn raw materials into reagents — salts and gems — that stronger potions require. Keizaal's version of the smithy's smelter.", false],
    inventory: ["📦","Your stockroom — set ingredient prices here.","Edit each ingredient's buy price and stock inline; those prices flow into every recipe's cost across the app. The second list is potions you've brewed and can sell.", false],
    sales:     ["💰","What you've brewed and sold.","A sample log of recent sales — day, brew, buyer, and gold taken. Totals follow your current prices.", false],
    settings:  ["⚙️","Set this up once — then forget it.","Your shop markup and labor per brew live here, saved in this browser only. Every price in the app is built on these two numbers.", true],
  };

  // Per-tab "How it works": { h: heading, s: subhead, steps: [[title, body], ...] }
  const how = {
    lab:{h:"How the Lab works", s:"Turn a recipe into a price and a batch to brew.",
      steps:[["Find a recipe","Search, or filter by <b>kind</b> (potion, food, reagent) and <b>effect</b>, then click one in the list."],
             ["Read the price","The result card shows sale price, cost, <b>margin</b>, and how many you can brew from stock now."],
             ["Set a batch","Step the <b>Batch</b> count to scale ingredients, cost, and revenue together."],
             ["Add to the queue","<b>Add to queue</b> stacks brews; the queue totals cost and profit for the whole run."],
             ["Brew & log","In the real app this logs the batch as a sale and deducts ingredients from stock."]]},
    catalog:{h:"How the Catalog works", s:"A searchable book of every recipe, grouped by effect.",
      steps:[["Browse by effect","Recipes are grouped by what they do — Restore Health, Fortify Magicka, and so on."],
             ["Open a tier","Click any recipe to see its ingredients, quantities, and per-line cost."],
             ["Read the cost","<b>Ingredients + labor</b> = the brew cost your sale price is built on."]]},
    reagents:{h:"How Reagent Crafting works", s:"Make the intermediates stronger potions need.",
      steps:[["Craft a reagent","Some recipes turn raw materials into a <b>reagent</b> — a salt or gem — at the same station."],
             ["Mind the chain","Watch the ladder: Amethyst feeds Void Salts, which several Fortify/Resist potions require."],
             ["See who needs it","The lower table lists which potions each reagent is used by."]]},
    inventory:{h:"How Inventory works", s:"Set prices, track stock, and see brewed potions.",
      steps:[["Set ingredient prices","Type each ingredient's <b>buy</b> price; it flows into every recipe cost across the app."],
             ["Track stock","Edit how much you hold; <b>Shelf value</b> is stock × price."],
             ["Check brewed potions","The second list is finished potions you hold, ready to sell."]]},
    sales:{h:"How Sales works", s:"A running record of what you've sold.",
      steps:[["Read the log","Each row is a sale — day, brew, buyer, quantity, and gold taken."],
             ["Watch the total","The footer sums the gold; values follow your current prices."]]},
    settings:{h:"How Settings works", s:"Two numbers underpin every price.",
      steps:[["Set your markup","<b>Markup</b> multiplies cost + labor into your sale price — do this first."],
             ["Set labor per brew","A flat gold value added to every brew's cost for your time and skill."],
             ["It saves itself","Your edits auto-save in this browser only; nothing is shared."]]},
  };

  // Inline dotted-underline tooltips: wrap the real WORD in the app with a dotted
  // term + gloss. root() returns the element to search within; word is the text.
  // Targets are STATIC markup (hint paragraphs, headings, table headers) so they
  // survive the app's re-renders.
  const tips = [
    { root:()=> box("catalogList"), word:"effect",
      html:"<b>Effect</b> — what a potion does (Restore Health, Fortify Magicka…). Elixirhall groups every recipe by its effect." },
    { root:()=> box("catalogList"), word:"Tier",
      html:"<b>Tier</b> — how strong a recipe is. Effects come in ladders (Minor → Plentiful, Potion → Draught); higher tiers need pricier reagents." },
    { root:()=> box("reagentList"), word:"Reagent",
      html:"<b>Reagent</b> — a crafted intermediate (a salt or gem) made at the same station, then used inside other potions. Elixirhall's version of a smelted ingot." },
    { root:()=> lblRow("setMarkup"), word:"markup",
      html:"<b>Markup</b> — the multiplier on cost + labor. ×1.6 charges 1.6× what a brew costs you to make." },
    { root:()=> lblRow("setLabor"), word:"Labor",
      html:"<b>Labor</b> — a flat gold value added to every brew's cost: your time and skill on top of raw ingredients." },
    { root:()=> byText("#tab-inventory", "th", "Shelf value"), word:"Shelf value",
      html:"<b>Shelf value</b> — what your held stock of an ingredient is worth: quantity × its buy price." },
  ];

  // Guided tour — targets resolve against the REAL app DOM. Spotlight a SMALL
  // representative element (a row, a box), never a huge panel.
  const steps = [
    { tab:"settings",  resolve:()=> document.querySelector("#tab-settings .k") || firstBox("settings"),
      title:"Start here: set your prices",
      body:"Elixirhall builds every price from two numbers — your shop markup and labor per brew. Set them once; they save in this browser only." },
    { tab:"lab",       resolve:()=> document.querySelector("#recipeList .ritem") || box("recipeList"),
      title:"Pick a recipe",
      body:"In the Lab, filter by kind or effect and click a recipe. Or search any potion, food, or reagent up top." },
    { tab:"lab",       resolve:()=> document.querySelector("#result .val") || gid("result"),
      title:"Read the price",
      body:"The result card shows the sale price, the cost to brew, your margin, and how many you can make from stock right now." },
    { tab:"lab",       resolve:()=> document.querySelector("#result .step") || document.querySelector("#result .b.pri"),
      title:"Scale the batch",
      body:"Step the Batch count to brew several at once — ingredients, cost, and revenue all scale together. Then Add to queue." },
    { tab:"lab",       resolve:()=> document.querySelector("#queueBody tr") || box("queueTbl"),
      title:"Stack a brew run",
      body:"The Brew Queue collects everything you plan to make and totals its cost and profit before you commit." },
    { tab:"reagents",  resolve:()=> document.querySelector("#reagentList details") || firstBox("reagents"),
      title:"Craft the reagents",
      body:"Some potions need a crafted reagent — a salt or gem made here first. Mind the chain: one reagent can feed another." },
    { tab:"inventory", resolve:()=> document.querySelector("#invIngBody tr") || firstBox("inventory"),
      title:"Set prices & stock",
      body:"This is your stockroom, and where you set ingredient prices. Every price you type flows into every recipe's cost." },
    // Catalog groups start folded, so spotlight a visible group heading rather
    // than a <details> hidden inside one.
    { tab:"catalog",   resolve:()=> document.querySelector("#catalogList .grp-b:not(.folded) details")
                                  || document.querySelector("#catalogList .grp") || firstBox("catalog"),
      title:"Look anything up",
      body:"The Catalog is every recipe grouped by effect, with live costs. Click a group to open it, or search to jump straight to a recipe." },
    { tab:"sales",     resolve:()=> document.querySelector("#salesBody tr") || firstBox("sales"),
      title:"See your takings",
      body:"Every sale lands in the log with the gold it brought. That's the whole loop — happy brewing!" },
  ];

  // Instructional empty state injected into the real app's own empty container.
  const emptyStates = {
    queueEmpty:
      '<div class="zg-es"><div class="zg-es-ic">⚗</div><div class="zg-es-t">Your brew queue is empty</div>'+
      '<ol class="zg-es-steps"><li>Pick a recipe in the <b>Lab</b> list</li>'+
      '<li>Set a <b>Batch</b> count</li>'+
      '<li>Hit <b>Add to queue</b> to stack the run</li></ol></div>',
  };

  // Keep the shared glossary intact; append Elixirhall's own terms.
  const gloss = [
    ...window.ZiiGuide.SHARED_GLOSS,
    ["Effect","What a potion does — Restore Health, Fortify Magicka, and so on. Elixirhall groups every recipe by its effect."],
    ["Tier","How strong a recipe is. Effects come in ladders (Minor → Plentiful for potions, Potion → Draught), each tier needing pricier reagents."],
    ["Reagent","A crafted intermediate — a salt or gem made at the same station, then used inside other potions. Elixirhall's version of a smelted ingot."],
    ["Markup","Elixirhall's shop rate: your sale price is (ingredients + labor) × this multiplier."],
    ["Brew","One run of a recipe. A brew consumes its reagents and yields the recipe's output count of potions."],
  ];

  window.ZiiGuide.register({
    id:   "elixirhall",
    tool: "Elixirhall",
    hints, how, tips, steps, emptyStates, gloss,
    // workshops default to the shared list in the core.
  });
})();
