/* ═══════════════════════════════════════════════════════════════════════
   Keizaal Cook — cooking catalog (materials / intermediates / recipes)
   Extracted from cook-app.html so the app file stays small to edit.
   Loaded via <script src="cook-catalog.js"> BEFORE the app script, which
   reads it as window.COOK_CATALOG.

   Real Keizaal cooking catalog (Cookpot/Oven/Grain Mill), extracted from
   the mod. Prices/values are left blank; each user fills their own.
   ═══════════════════════════════════════════════════════════════════════ */
window.COOK_CATALOG = (function(){
  const uid = () => Math.random().toString(36).slice(2,9);
  const L = (ingredient, qty) => ({ ingredient, qty });
  return {
  materials:[
    { id:uid(), name:"Ale", price:0, stock:0 },
    { id:uid(), name:"Ash Yam", price:0, stock:0 },
    { id:uid(), name:"Bread", price:0, stock:0 },
    { id:uid(), name:"Cabbage", price:0, stock:0 },
    { id:uid(), name:"Carrot", price:0, stock:0 },
    { id:uid(), name:"Chicken's Egg", price:0, stock:0 },
    { id:uid(), name:"Clam Meat", price:0, stock:0 },
    { id:uid(), name:"Garlic", price:0, stock:0 },
    { id:uid(), name:"Green Apple", price:0, stock:0 },
    { id:uid(), name:"Honeycomb", price:0, stock:0 },
    { id:uid(), name:"Horker Meat", price:0, stock:0 },
    { id:uid(), name:"Horse Meat", price:0, stock:0 },
    { id:uid(), name:"Jazbay Grapes", price:0, stock:0 },
    { id:uid(), name:"Jug of Milk", price:0, stock:0 },
    { id:uid(), name:"Juniper Berries", price:0, stock:0 },
    { id:uid(), name:"Lavender", price:0, stock:0 },
    { id:uid(), name:"Leek", price:0, stock:0 },
    { id:uid(), name:"Leg of Goat", price:0, stock:0 },
    { id:uid(), name:"Mammoth Snout", price:0, stock:0 },
    { id:uid(), name:"Moon Sugar", price:0, stock:0 },
    { id:uid(), name:"Mudcrab Legs", price:0, stock:0 },
    { id:uid(), name:"Pheasant Breast", price:0, stock:0 },
    { id:uid(), name:"Potato", price:0, stock:0 },
    { id:uid(), name:"Raw Beef", price:0, stock:0 },
    { id:uid(), name:"Raw Rabbit Leg", price:0, stock:0 },
    { id:uid(), name:"Red Apple", price:0, stock:0 },
    { id:uid(), name:"Salmon Meat", price:0, stock:0 },
    { id:uid(), name:"Salt Pile", price:0, stock:0 },
    { id:uid(), name:"Snowberries", price:0, stock:0 },
    { id:uid(), name:"Tomato", price:0, stock:0 },
    { id:uid(), name:"Wheat", price:0, stock:0 },
  ],
  // ── Intermediates (6): crafted & consumed by another recipe ──
  intermediates:[
    { id:uid(), name:"Butter", yield:1, labor:0, stock:0, lines:[ L("Jug of Milk",1) ] },
    { id:uid(), name:"Chicken Breast", yield:1, labor:0, stock:0, lines:[ L("Pheasant Breast",1) ] },
    { id:uid(), name:"Eidar Cheese Wheel", yield:1, labor:0, stock:0, lines:[ L("Jug of Milk",5) ] },
    { id:uid(), name:"Goat Cheese Wheel", yield:1, labor:0, stock:0, lines:[ L("Jug of Milk",5) ] },
    { id:uid(), name:"Sack of Flour", yield:1, labor:0, stock:0, lines:[ L("Wheat",2) ] },
    { id:uid(), name:"Venison", yield:1, labor:0, stock:0, lines:[ L("Raw Beef",1) ] },
  ],
  // ── Dishes (39) ──
  recipes:[
    { id:uid(), name:"Apple Cabbage Stew", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"keizaal", lines:[ L("Salt Pile",1), L("Red Apple",1), L("Cabbage",1) ] },
    { id:uid(), name:"Beef Stew", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"keizaal", lines:[ L("Salt Pile",1), L("Garlic",1), L("Carrot",1), L("Raw Beef",1) ] },
    { id:uid(), name:"Cabbage Potato Soup", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"keizaal", lines:[ L("Salt Pile",1), L("Cabbage",1), L("Potato",1), L("Leek",1) ] },
    { id:uid(), name:"Cabbage Soup", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"keizaal", lines:[ L("Salt Pile",1), L("Cabbage",1) ] },
    { id:uid(), name:"Clam Chowder", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"keizaal", lines:[ L("Potato",1), L("Clam Meat",1), L("Jug of Milk",1), L("Butter",1) ] },
    { id:uid(), name:"Cooked Beef", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"vanilla", lines:[ L("Salt Pile",1), L("Raw Beef",1) ] },
    { id:uid(), name:"Eidar Cheese Wedge", value:null, labor:null, demand:1, yield:6, bench:"Cookpot", src:"keizaal", lines:[ L("Eidar Cheese Wheel",1) ] },
    { id:uid(), name:"Elsweyr Fondue", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"keizaal", lines:[ L("Ale",1), L("Eidar Cheese Wheel",1), L("Moon Sugar",1) ] },
    { id:uid(), name:"Goat Cheese Wedge", value:null, labor:null, demand:1, yield:8, bench:"Cookpot", src:"keizaal", lines:[ L("Goat Cheese Wheel",1) ] },
    { id:uid(), name:"Grilled Chicken Breast", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"vanilla", lines:[ L("Salt Pile",1), L("Chicken Breast",1) ] },
    { id:uid(), name:"Honey", value:null, labor:null, demand:1, yield:2, bench:"Cookpot", src:"keizaal", lines:[ L("Honeycomb",1) ] },
    { id:uid(), name:"Horker Loaf", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"vanilla", lines:[ L("Salt Pile",1), L("Horker Meat",1) ] },
    { id:uid(), name:"Horker Stew", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"keizaal", lines:[ L("Garlic",1), L("Lavender",1), L("Tomato",1), L("Horker Meat",1) ] },
    { id:uid(), name:"Horker and Ash Yam Stew", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"keizaal", lines:[ L("Garlic",1), L("Horker Meat",1), L("Ash Yam",1) ] },
    { id:uid(), name:"Horse Haunch", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"vanilla", lines:[ L("Salt Pile",1), L("Horse Meat",1) ] },
    { id:uid(), name:"Leg of Goat Roast", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"vanilla", lines:[ L("Salt Pile",1), L("Leg of Goat",1) ] },
    { id:uid(), name:"Mammoth Steak", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"vanilla", lines:[ L("Salt Pile",1), L("Mammoth Snout",1) ] },
    { id:uid(), name:"Pheasant Roast", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"vanilla", lines:[ L("Salt Pile",1), L("Pheasant Breast",1) ] },
    { id:uid(), name:"Potato Soup", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"keizaal", lines:[ L("Salt Pile",1), L("Potato",1) ] },
    { id:uid(), name:"Rabbit Haunch", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"vanilla", lines:[ L("Salt Pile",1), L("Raw Rabbit Leg",1) ] },
    { id:uid(), name:"Salmon Steak", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"hearthfire", lines:[ L("Salt Pile",1), L("Salmon Meat",1) ] },
    { id:uid(), name:"Steamed Mudcrab Legs", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"keizaal", lines:[ L("Butter",1), L("Mudcrab Legs",1) ] },
    { id:uid(), name:"Tomato Soup", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"keizaal", lines:[ L("Salt Pile",1), L("Garlic",1), L("Tomato",1), L("Leek",1) ] },
    { id:uid(), name:"Vegetable Soup", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"keizaal", lines:[ L("Cabbage",1), L("Potato",1), L("Tomato",1), L("Leek",1) ] },
    { id:uid(), name:"Venison Chop", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"vanilla", lines:[ L("Salt Pile",1), L("Venison",1) ] },
    { id:uid(), name:"Venison Stew", value:null, labor:null, demand:1, yield:1, bench:"Cookpot", src:"keizaal", lines:[ L("Salt Pile",1), L("Potato",1), L("Venison",1), L("Leek",1) ] },
    { id:uid(), name:"Apple Dumpling", value:null, labor:null, demand:1, yield:1, bench:"Oven", src:"keizaal", lines:[ L("Red Apple",1), L("Green Apple",1), L("Sack of Flour",1) ] },
    { id:uid(), name:"Apple Pie", value:null, labor:null, demand:1, yield:1, bench:"Oven", src:"keizaal", lines:[ L("Chicken's Egg",1), L("Salt Pile",1), L("Red Apple",2), L("Green Apple",2), L("Sack of Flour",1), L("Butter",1) ] },
    { id:uid(), name:"Braided Bread", value:null, labor:null, demand:1, yield:1, bench:"Oven", src:"keizaal", lines:[ L("Salt Pile",1), L("Sack of Flour",1) ] },
    { id:uid(), name:"Bread", value:null, labor:null, demand:1, yield:1, bench:"Oven", src:"keizaal", lines:[ L("Chicken's Egg",1), L("Salt Pile",1), L("Jug of Milk",1), L("Sack of Flour",1) ] },
    { id:uid(), name:"Chicken Dumpling", value:null, labor:null, demand:1, yield:1, bench:"Oven", src:"keizaal", lines:[ L("Salt Pile",1), L("Garlic",1), L("Leek",1), L("Chicken Breast",1), L("Sack of Flour",1) ] },
    { id:uid(), name:"Garlic Bread", value:null, labor:null, demand:1, yield:2, bench:"Oven", src:"keizaal", lines:[ L("Garlic",1), L("Bread",1), L("Butter",1) ] },
    { id:uid(), name:"Hardtack Bread", value:null, labor:null, demand:1, yield:1, bench:"Oven", src:"keizaal", lines:[ L("Sack of Flour",1) ] },
    { id:uid(), name:"Jazbay Crostata", value:null, labor:null, demand:1, yield:1, bench:"Oven", src:"keizaal", lines:[ L("Jazbay Grapes",2), L("Sack of Flour",1), L("Butter",1) ] },
    { id:uid(), name:"Juniper Berry Crostata", value:null, labor:null, demand:1, yield:1, bench:"Oven", src:"keizaal", lines:[ L("Juniper Berries",3), L("Sack of Flour",1), L("Butter",1) ] },
    { id:uid(), name:"Lavender Dumpling", value:null, labor:null, demand:1, yield:1, bench:"Oven", src:"keizaal", lines:[ L("Snowberries",2), L("Lavender",1), L("Moon Sugar",1), L("Sack of Flour",1) ] },
    { id:uid(), name:"Potato Bread", value:null, labor:null, demand:1, yield:1, bench:"Oven", src:"keizaal", lines:[ L("Chicken's Egg",1), L("Salt Pile",1), L("Potato",1), L("Jug of Milk",1), L("Sack of Flour",1) ] },
    { id:uid(), name:"Snowberry Crostata", value:null, labor:null, demand:1, yield:1, bench:"Oven", src:"keizaal", lines:[ L("Snowberries",2), L("Sack of Flour",1), L("Butter",1) ] },
    { id:uid(), name:"Sweet Roll", value:null, labor:null, demand:1, yield:1, bench:"Oven", src:"keizaal", lines:[ L("Chicken's Egg",1), L("Salt Pile",1), L("Jug of Milk",1), L("Sack of Flour",1), L("Butter",1) ] },
  ],
  };
})();
