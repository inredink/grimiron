# verify_file_mappings.py
# Verified mappings for all 73 Warhammer 40k symbol images

file_mappings = {
    # 1. Main Faction Emblems (16 files)
    "Adepta Sororitas symbol.jpg": {"id": "adepta-sororitas", "name": "Adepta Sororitas", "type": "faction", "army": "Adepta Sororitas (Sisters of Battle)"},
    "Adeptus Custodes Symbol.png": {"id": "adeptus-custodes", "name": "Adeptus Custodes", "type": "faction", "army": "Adeptus Custodes"},
    "Adeptus Mechanicus Symbol.png": {"id": "adeptus-mechanicus", "name": "Adeptus Mechanicus", "type": "faction", "army": "Adeptus Mechanicus (Tech-Priests)"},
    "Aeldari Symbol.png": {"id": "aeldari", "name": "Aeldari", "type": "faction", "army": "Aeldari (Craftworlds / Asuryani)"},
    "Astra Militarum Symbol.png": {"id": "astra-militarum", "name": "Astra Militarum", "type": "faction", "army": "Astra Militarum (Imperial Guard)"},
    "Chaos Daemons Symbol.jpg": {"id": "chaos-daemons", "name": "Chaos Daemons", "type": "faction", "army": "Chaos Daemons"},
    "Death Guard Symbol.png": {"id": "death-guard", "name": "Death Guard", "type": "faction", "army": "Death Guard"},
    "Genestealer Cult Symbol.png": {"id": "genestealer-cults", "name": "Genestealer Cults", "type": "faction", "army": "Genestealer Cults"},
    "Grey Knights Symbol.jpg": {"id": "grey-knights", "name": "Grey Knights", "type": "faction", "army": "Grey Knights"},
    "Heretic Astartes Symbol.png": {"id": "heretic-astartes", "name": "Heretic Astartes", "type": "faction", "army": "Heretic Astartes (Chaos Space Marines)"},
    "Imperial Knight symbol.png": {"id": "imperial-knights", "name": "Imperial Knights", "type": "faction", "army": "Imperial Knights"},
    "Necron Symbol.jpg": {"id": "necrons", "name": "Necrons", "type": "faction", "army": "Necrons"},
    "Ork Symbol.jpg": {"id": "orks", "name": "Orks", "type": "faction", "army": "Orks"},
    "Thousand Sons Symbol.png": {"id": "thousand-sons", "name": "Thousand Sons", "type": "faction", "army": "Thousand Sons"},
    "Tyranid Symbol.jpg": {"id": "tyranids", "name": "Tyranids", "type": "faction", "army": "Tyranids (The Great Devourer)"},
    "World Eaters Symbol.jpg": {"id": "world-eaters", "name": "World Eaters", "type": "faction", "army": "World Eaters"},

    # 2. Adeptus Astartes (10 Subfactions)
    "Ultramarines symbol.jpg": {"id": "ultramarines", "name": "Ultramarines", "type": "subfaction", "army": "Adeptus Astartes (Space Marines)"},
    "Blood Angels Symbol.jpg": {"id": "blood-angels", "name": "Blood Angels", "type": "subfaction", "army": "Adeptus Astartes (Space Marines)"},
    "Space Wolves Symbol.jpg": {"id": "space-wolves", "name": "Space Wolves", "type": "subfaction", "army": "Adeptus Astartes (Space Marines)"},
    "Dark Angels Symbol.png": {"id": "dark-angels", "name": "Dark Angels", "type": "subfaction", "army": "Adeptus Astartes (Space Marines)"},
    "Imperial Fists Symbol.jpg": {"id": "imperial-fists", "name": "Imperial Fists", "type": "subfaction", "army": "Adeptus Astartes (Space Marines)"},
    "Black Templars symbol.png": {"id": "black-templars", "name": "Black Templars", "type": "subfaction", "army": "Adeptus Astartes (Space Marines)"},
    "Salamanders Symbol.png": {"id": "salamanders", "name": "Salamanders", "type": "subfaction", "army": "Adeptus Astartes (Space Marines)"},
    "Iron Hands Symbol.png": {"id": "iron-hands", "name": "Iron Hands", "type": "subfaction", "army": "Adeptus Astartes (Space Marines)"},
    "Raven Guard Symbol.jpg": {"id": "raven-guard", "name": "Raven Guard", "type": "subfaction", "army": "Adeptus Astartes (Space Marines)"},
    "White Scars Symbol.png": {"id": "white-scars", "name": "White Scars", "type": "subfaction", "army": "Adeptus Astartes (Space Marines)"},

    # 3. Astra Militarum (4 Subfactions)
    "Cadian Shock Troops Symbol.png": {"id": "cadian-shock-troops", "name": "Cadian Shock Troops", "type": "subfaction", "army": "Astra Militarum (Imperial Guard)"},
    "Catachan Jungle Fighters symbol.png": {"id": "catachan-jungle-fighters", "name": "Catachan Jungle Fighters", "type": "subfaction", "army": "Astra Militarum (Imperial Guard)"},
    "Armageddon Steel Legion Symbol.png": {"id": "armageddon-steel-legion", "name": "Armageddon Steel Legion", "type": "subfaction", "army": "Astra Militarum (Imperial Guard)"},
    "Tanith First and Only Symbol.png": {"id": "tanith-first-and-only", "name": "Tanith First and Only", "type": "subfaction", "army": "Astra Militarum (Imperial Guard)"},

    # 4. Adepta Sororitas (5 Subfactions)
    "Order of Our Martyred Lady Symbol.png": {"id": "our-martyred-lady", "name": "Order of Our Martyred Lady", "type": "subfaction", "army": "Adepta Sororitas (Sisters of Battle)"},
    "Order of the Valorous Heart Symbol.png": {"id": "valorous-heart", "name": "Order of the Valorous Heart", "type": "subfaction", "army": "Adepta Sororitas (Sisters of Battle)"},
    "Order of the Bloody Rose Symbol.png": {"id": "bloody-rose", "name": "Order of the Bloody Rose", "type": "subfaction", "army": "Adepta Sororitas (Sisters of Battle)"},
    "Order of the Ebon Chalice Symbol.png": {"id": "ebon-chalice", "name": "Order of the Ebon Chalice", "type": "subfaction", "army": "Adepta Sororitas (Sisters of Battle)"},
    "Order of the Argent Shroud Symbol.png": {"id": "argent-shroud", "name": "Order of the Argent Shroud", "type": "subfaction", "army": "Adepta Sororitas (Sisters of Battle)"},

    # 5. Heretic Astartes (5 Subfactions)
    "Black Legion Symbol.jpg": {"id": "black-legion", "name": "Black Legion", "type": "subfaction", "army": "Heretic Astartes (Chaos Space Marines)"},
    "Iron Warriors Symbol.jpg": {"id": "iron-warriors", "name": "Iron Warriors", "type": "subfaction", "army": "Heretic Astartes (Chaos Space Marines)"},
    "Night Lords Symbol.jpg": {"id": "night-lords", "name": "Night Lords", "type": "subfaction", "army": "Heretic Astartes (Chaos Space Marines)"},
    "Word Bearers Symbol.png": {"id": "word-bearers", "name": "Word Bearers", "type": "subfaction", "army": "Heretic Astartes (Chaos Space Marines)"},
    "Alpha Legion Symbol.jpg": {"id": "alpha-legion", "name": "Alpha Legion", "type": "subfaction", "army": "Heretic Astartes (Chaos Space Marines)"},

    # 6. Chaos Daemons (4 Subfactions)
    "Blood Legions of Khorne Symbol.png": {"id": "khorne-legion", "name": "Blood Legions of Khorne", "type": "subfaction", "army": "Chaos Daemons"},
    "Plague Hosts of Nurgle Symbol.png": {"id": "nurgle-plague-host", "name": "Plague Hosts of Nurgle", "type": "subfaction", "army": "Chaos Daemons"},
    "Changehosts of Tzeentch Symbol.jpg": {"id": "tzeentch-changehost", "name": "Changehosts of Tzeentch", "type": "subfaction", "army": "Chaos Daemons"},
    "Hosts of Slaanesh Symbol.jpg": {"id": "slaanesh-excess", "name": "Hosts of Slaanesh", "type": "subfaction", "army": "Chaos Daemons"},

    # 7. Aeldari (5 Subfactions)
    "Ulthwé Symbol.jpg": {"id": "ulthwe", "name": "Ulthwé", "type": "subfaction", "army": "Aeldari (Craftworlds / Asuryani)"},
    "Biel-Tan Symbol.png": {"id": "biel-tan", "name": "Biel-Tan", "type": "subfaction", "army": "Aeldari (Craftworlds / Asuryani)"},
    "Saim-Hann Symbol.png": {"id": "saim-hann", "name": "Saim-Hann", "type": "subfaction", "army": "Aeldari (Craftworlds / Asuryani)"},
    "Iyanden Symbol.jpg": {"id": "iyanden", "name": "Iyanden", "type": "subfaction", "army": "Aeldari (Craftworlds / Asuryani)"},
    "Alaitoc Symbol.png": {"id": "alaitoc", "name": "Alaitoc", "type": "subfaction", "army": "Aeldari (Craftworlds / Asuryani)"},

    # 8. Drukhari (3 Subfactions)
    "Kabal of the Black Heart Symbol.png": {"id": "kabal-black-heart", "name": "Kabal of the Black Heart", "type": "subfaction", "army": "Drukhari (Dark Eldar)"},
    "Cult of Strife Symbol.jpg": {"id": "cult-of-strife", "name": "Cult of Strife", "type": "subfaction", "army": "Drukhari (Dark Eldar)"},
    "The Prophets of Flesh Symbol.jpg": {"id": "prophets-of-flesh", "name": "The Prophets of Flesh", "type": "subfaction", "army": "Drukhari (Dark Eldar)"},

    # 9. Necrons (4 Subfactions)
    "Sautekh Dynasty Symbol.png": {"id": "sautekh", "name": "Sautekh Dynasty", "type": "subfaction", "army": "Necrons"},
    "Mephrit Dynasty Symbol.png": {"id": "mephrit", "name": "Mephrit Dynasty", "type": "subfaction", "army": "Necrons"},
    "Novokh Dynasty Symbol.PNG": {"id": "novokh", "name": "Novokh Dynasty", "type": "subfaction", "army": "Necrons"},
    "Nihilakh Dynasty Symbol.jpg": {"id": "nihilakh", "name": "Nihilakh Dynasty", "type": "subfaction", "army": "Necrons"},

    # 10. Orks (5 Subfactions)
    "Bad Moons Symbol.jpg": {"id": "bad-moons", "name": "Bad Moons", "type": "subfaction", "army": "Orks"},
    "Evil Sunz Symbol.jpg": {"id": "evil-sunz", "name": "Evil Sunz", "type": "subfaction", "army": "Orks"},
    "Deathskulls Symbol.jpg": {"id": "deathskulls", "name": "Deathskulls", "type": "subfaction", "army": "Orks"},
    "Snakebites Symbol.jpg": {"id": "snakebites", "name": "Snakebites", "type": "subfaction", "army": "Orks"},
    "Blood Axes Symbol.png": {"id": "blood-axes", "name": "Blood Axes", "type": "subfaction", "army": "Orks"},

    # 11. T'au Empire (5 Subfactions)
    "T'au Sept Symbol.png": {"id": "tau-sept", "name": "T'au Sept", "type": "subfaction", "army": "T'au Empire"},
    "Vior'la Sept Symbol.png": {"id": "viorla", "name": "Vior'la Sept", "type": "subfaction", "army": "T'au Empire"},
    "Farsight Enclaves Symbol.png": {"id": "farsight-enclaves", "name": "Farsight Enclaves", "type": "subfaction", "army": "T'au Empire"},
    "Sa'cea Sept Symbol.png": {"id": "sacea", "name": "Sa'cea Sept", "type": "subfaction", "army": "T'au Empire"},
    "Bork'an Sept Symbol.png": {"id": "borkan", "name": "Bork'an Sept", "type": "subfaction", "army": "T'au Empire"},

    # 12. Genestealer Cults (3 Subfactions)
    "The Hivecult Symbol.jpg": {"id": "hivecult", "name": "The Hivecult", "type": "subfaction", "army": "Genestealer Cults"},
    "The Bladed Cog Symbol.png": {"id": "bladed-cog", "name": "The Bladed Cog", "type": "subfaction", "army": "Genestealer Cults"},
    "The Pauper Princes Symbol.jpg": {"id": "pauper-princes", "name": "The Pauper Princes", "type": "subfaction", "army": "Genestealer Cults"},

    # 13. Leagues of Votann (4 Subfactions)
    "Greater Thurian League Symbol.png": {"id": "greater-thurian-league", "name": "Greater Thurian League", "type": "subfaction", "army": "Leagues of Votann (Kin)"},
    "Trans-Hyperian Alliance Symbol.jpg": {"id": "trans-hyperian-alliance", "name": "Trans-Hyperian Alliance", "type": "subfaction", "army": "Leagues of Votann (Kin)"},
    "Kronus Hegemony Symbol.jpg": {"id": "kronus-hegemony", "name": "Kronus Hegemony", "type": "subfaction", "army": "Leagues of Votann (Kin)"},
    "Ymyr Conglomerate Symbol.jpg": {"id": "ymyr-conglomerate", "name": "Ymyr Conglomerate", "type": "subfaction", "army": "Leagues of Votann (Kin)"}
}
