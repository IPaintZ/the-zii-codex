/* Keizaal Smithy — catalog backup (v1), saved before swapping in the extracted
   Keizaal database. This is the ORIGINAL hand-built DEFAULT catalog + PACK.
   Kept for reference/rollback; not loaded by the app. */

// ----- DEFAULT catalog (materials / intermediates / recipes) -----
  materials: [
    { id:uid(), name:"Flax",       price:0, stock:0 },
    { id:uid(), name:"Wool",       price:0, stock:0 },
    { id:uid(), name:"Cotton",     price:0, stock:0 },
    { id:uid(), name:"Linen Wrap", price:0, stock:0 },
    { id:uid(), name:"Fine Silk",  price:0, stock:0 },
    { id:uid(), name:"Leather",    price:0, stock:0 },
    { id:uid(), name:"Dye",        price:0, stock:0 }
  ],
  intermediates: [
    { id:uid(), name:"Thread",        yield:4, labor:0, stock:0, lines:[ L("Flax",1) ] },
    { id:uid(), name:"Linen Cloth",   yield:1, labor:0, stock:0, lines:[ L("Linen Wrap",2), L("Thread",1) ] },
    { id:uid(), name:"Woolen Cloth",  yield:1, labor:0, stock:0, lines:[ L("Wool",3), L("Thread",1) ] },
    { id:uid(), name:"Cotton Cloth",  yield:1, labor:0, stock:0, lines:[ L("Cotton",3), L("Thread",1) ] },
    { id:uid(), name:"Silk Bolt",     yield:1, labor:0, stock:0, lines:[ L("Fine Silk",3), L("Thread",1) ] },
    { id:uid(), name:"Leather Strip", yield:4, labor:0, stock:0, lines:[ L("Leather",1) ] },
    { id:uid(), name:"Padded Lining", yield:1, labor:0, stock:0, lines:[ L("Cotton Cloth",1), L("Woolen Cloth",1) ] }
  ],
  // Placeholder tailoring database — swap for your server's real recipes anytime.
  // Same shape as the Smithy: variant families can share a base recipe; demand nudges luxury pieces.
  recipes: [
    { id:uid(), name:"Commoner's Tunic", value:null, labor:null, demand:1, lines:[ L("Linen Cloth",2), L("Thread",1) ] },
    { id:uid(), name:"Belted Tunic", value:null, labor:null, demand:1, lines:[ L("Linen Cloth",2), L("Leather Strip",1), L("Thread",1) ] },
    { id:uid(), name:"Farmer's Clothes", value:null, labor:null, demand:1, lines:[ L("Linen Cloth",2), L("Woolen Cloth",1), L("Thread",1) ] },
    { id:uid(), name:"Barkeep's Clothes", value:null, labor:null, demand:1, lines:[ L("Linen Cloth",2), L("Cotton Cloth",1), L("Thread",1) ] },
    { id:uid(), name:"Laborer's Clothes", value:null, labor:null, demand:1, lines:[ L("Linen Cloth",1), L("Woolen Cloth",1), L("Thread",1) ] },
    { id:uid(), name:"Hooded Robes", value:null, labor:null, demand:1, lines:[ L("Linen Cloth",3), L("Thread",2), L("Dye",1) ] },
    { id:uid(), name:"Monk's Robes", value:null, labor:null, demand:1, lines:[ L("Woolen Cloth",3), L("Thread",2) ] },
    { id:uid(), name:"Novice Robes", value:null, labor:null, demand:1.1, lines:[ L("Woolen Cloth",2), L("Cotton Cloth",1), L("Thread",2), L("Dye",1) ] },
    { id:uid(), name:"Adept Robes", value:null, labor:null, demand:1.15, lines:[ L("Silk Bolt",1), L("Woolen Cloth",2), L("Thread",2), L("Dye",1) ] },
    { id:uid(), name:"Mage Robes", value:null, labor:null, demand:1.2, lines:[ L("Silk Bolt",2), L("Woolen Cloth",1), L("Thread",2), L("Dye",1) ] },
    { id:uid(), name:"Archmage's Robes", value:null, labor:null, demand:1.4, lines:[ L("Silk Bolt",3), L("Cotton Cloth",1), L("Dye",2), L("Thread",2) ] },
    { id:uid(), name:"Fine Clothes", value:null, labor:null, demand:1.1, lines:[ L("Woolen Cloth",3), L("Silk Bolt",1), L("Dye",1) ] },
    { id:uid(), name:"Merchant's Clothes", value:null, labor:null, demand:1, lines:[ L("Cotton Cloth",2), L("Woolen Cloth",1), L("Dye",1) ] },
    { id:uid(), name:"Noble's Robe", value:null, labor:null, demand:1.3, lines:[ L("Silk Bolt",3), L("Dye",1), L("Thread",2) ] },
    { id:uid(), name:"Wedding Dress", value:null, labor:null, demand:1.5, lines:[ L("Silk Bolt",4), L("Linen Cloth",1), L("Thread",2) ] },
    { id:uid(), name:"Traveler's Cloak", value:null, labor:null, demand:1, lines:[ L("Woolen Cloth",2), L("Leather Strip",1), L("Thread",1) ] },
    { id:uid(), name:"Hooded Cloak", value:null, labor:null, demand:1, lines:[ L("Woolen Cloth",2), L("Linen Cloth",1), L("Thread",1) ] },
    { id:uid(), name:"Fur-lined Cloak", value:null, labor:null, demand:1.2, lines:[ L("Woolen Cloth",2), L("Leather",2), L("Thread",1) ] },
    { id:uid(), name:"Hood", value:null, labor:null, demand:1, lines:[ L("Linen Cloth",1), L("Thread",1) ] },
    { id:uid(), name:"Woolen Hood", value:null, labor:null, demand:1, lines:[ L("Woolen Cloth",1), L("Thread",1) ] },
    { id:uid(), name:"Cap", value:null, labor:null, demand:1, lines:[ L("Cotton Cloth",1), L("Thread",1) ] },
    { id:uid(), name:"Wide-brim Hat", value:null, labor:null, demand:1, lines:[ L("Woolen Cloth",1), L("Leather Strip",1), L("Thread",1) ] },
    { id:uid(), name:"Mittens", value:null, labor:null, demand:1, lines:[ L("Woolen Cloth",1), L("Thread",1) ] },
    { id:uid(), name:"Leather Gloves", value:null, labor:null, demand:1, lines:[ L("Leather Strip",2), L("Thread",1) ] },
    { id:uid(), name:"Fine Gloves", value:null, labor:null, demand:1.1, lines:[ L("Silk Bolt",1), L("Leather Strip",1), L("Thread",1) ] },
    { id:uid(), name:"Shoes", value:null, labor:null, demand:1, lines:[ L("Leather Strip",2), L("Linen Cloth",1) ] },
    { id:uid(), name:"Leather Boots", value:null, labor:null, demand:1, lines:[ L("Leather Strip",3), L("Thread",1) ] },
    { id:uid(), name:"Fine Boots", value:null, labor:null, demand:1.1, lines:[ L("Leather Strip",2), L("Silk Bolt",1), L("Thread",1) ] },
    { id:uid(), name:"Sash", value:null, labor:null, demand:1, lines:[ L("Linen Cloth",1), L("Dye",1) ] },
    { id:uid(), name:"Scarf", value:null, labor:null, demand:1, lines:[ L("Woolen Cloth",1), L("Thread",1) ] },
    { id:uid(), name:"Apron", value:null, labor:null, demand:1, lines:[ L("Linen Cloth",1), L("Leather Strip",1) ] },
    { id:uid(), name:"Padded Gambeson", value:null, labor:null, demand:1.1, lines:[ L("Padded Lining",2), L("Leather Strip",2), L("Thread",2) ] }
  ],

// ----- PACK -----
const PACK = [
  ["Linen Shirt",         [["Linen Cloth",2],["Thread",1]]],
  ["Wool Leggings",       [["Woolen Cloth",2],["Thread",1]]],
  ["Quilted Vest",        [["Padded Lining",1],["Linen Cloth",1],["Thread",1]]],
  ["Patched Cloak",       [["Woolen Cloth",1],["Linen Cloth",1],["Thread",1]]],
  ["Fur Hood",            [["Woolen Cloth",1],["Leather",1],["Thread",1]]],
  ["Winter Cloak",        [["Woolen Cloth",3],["Leather",2],["Thread",2]]],
  ["Riding Boots",        [["Leather Strip",3],["Woolen Cloth",1],["Thread",1]]],
  ["Silk Gloves",         [["Silk Bolt",1],["Thread",1]]],
  ["Ceremonial Sash",     [["Silk Bolt",1],["Dye",1]]],
  ["Apprentice Hood",     [["Cotton Cloth",1],["Dye",1],["Thread",1]]],
  ["Embroidered Robes",   [["Silk Bolt",2],["Cotton Cloth",1],["Dye",2],["Thread",2]]]
];
