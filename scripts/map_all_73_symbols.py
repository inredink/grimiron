import os
import re

symbols_dir = r"c:\Users\patri\Pictures\Warhammer Art\Symbols"
files = sorted(os.listdir(symbols_dir))

# Let's read factions.ts to know all valid faction and subfaction IDs
with open('src/content/warhammer40k/factions.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Build dictionary of all subfactions and factions
factions = {}
subfactions = {}

sections = re.split(r'\n\s*\{\s*\n\s*id:\s*\'', text)
for sec in sections[1:]:
    fid = sec.split("'")[0]
    fname_m = re.search(r"name:\s*['\"]([^'\"]+)['\"]", sec)
    fname = fname_m.group(1) if fname_m else fid
    factions[fid] = fname
    
    sub_m = re.search(r"subfactions:\s*\[(.*?)\]", sec, re.DOTALL)
    if sub_m:
        for sid, sname in re.findall(r"id:\s*'([^']+)',\s*factionId:\s*'[^']+',\s*name:\s*['\"]([^'\"]+)['\"]", sub_m.group(1)):
            subfactions[sid] = (sname, fid)

print(f"Total factions: {len(factions)}, Total subfactions: {len(subfactions)}")

# Now map all 73 files
file_map = {}

# Dedicated manual mappings for files
manual_map = {
    # Main faction symbols
    "Adepta Sororitas symbol.jpg": ("adepta-sororitas", "Adepta Sororitas", "faction", "adepta-sororitas"),
    "Adeptus Custodes Symbol.png": ("adeptus-custodes", "Adeptus Custodes", "faction", "adeptus-custodes"),
    "Adeptus Mechanicus Symbol.png": ("adeptus-mechanicus", "Adeptus Mechanicus", "faction", "adeptus-mechanicus"),
    "Aeldari Symbol.png": ("aeldari", "Aeldari", "faction", "aeldari"),
    "Astra Militarum Symbol.png": ("astra-militarum", "Astra Militarum", "faction", "astra-militarum"),
    "Chaos Daemons Symbol.jpg": ("chaos-daemons", "Chaos Daemons", "faction", "chaos-daemons"),
    "Death Guard Symbol.png": ("death-guard", "Death Guard", "faction", "death-guard"),
    "Genestealer Cult Symbol.png": ("genestealer-cults", "Genestealer Cults", "faction", "genestealer-cults"),
    "Grey Knights Symbol.jpg": ("grey-knights", "Grey Knights", "faction", "grey-knights"),
    "Heretic Astartes Symbol.png": ("heretic-astartes", "Heretic Astartes", "faction", "heretic-astartes"),
    "Imperial Knight symbol.png": ("imperial-knights", "Imperial Knights", "faction", "imperial-knights"),
    "Necron Symbol.jpg": ("necrons", "Necrons", "faction", "necrons"),
    "Ork Symbol.jpg": ("orks", "Orks", "faction", "orks"),
    "Thousand Sons Symbol.png": ("thousand-sons", "Thousand Sons", "faction", "thousand-sons"),
    "Tyranid Symbol.jpg": ("tyranids", "Tyranids", "faction", "tyranids"),
    "World Eaters Symbol.jpg": ("world-eaters", "World Eaters", "faction", "world-eaters"),
    
    # Subfactions
    "Alaitoc Symbol.png": ("alaitoc", "Alaitoc", "subfaction", "aeldari"),
    "Alpha Legion Symbol.jpg": ("alpha-legion", "Alpha Legion", "subfaction", "heretic-astartes"),
    "Armageddon Steel Legion Symbol.png": ("armageddon-steel-legion", "Armageddon Steel Legion", "subfaction", "astra-militarum"),
    "Bad Moons Symbol.jpg": ("bad-moons", "Bad Moons", "subfaction", "orks"),
    "Biel-Tan Symbol.png": ("biel-tan", "Biel-Tan", "subfaction", "aeldari"),
    "Black Legion Symbol.jpg": ("black-legion", "Black Legion", "subfaction", "heretic-astartes"),
    "Black Templars symbol.png": ("black-templars", "Black Templars", "subfaction", "adeptus-astartes"),
    "Blood Angels Symbol.jpg": ("blood-angels", "Blood Angels", "subfaction", "adeptus-astartes"),
    "Blood Axes Symbol.png": ("blood-axes", "Blood Axes", "subfaction", "orks"),
    "Blood Legions of Khorne Symbol.png": ("khorne-legion", "Blood Legions of Khorne", "subfaction", "chaos-daemons"),
    "Bork'an Sept Symbol.png": ("borkan", "Bork'an Sept", "subfaction", "tau-empire"),
    "Cadian Shock Troops Symbol.png": ("cadian-shock-troops", "Cadian Shock Troops", "subfaction", "astra-militarum"),
    "Catachan Jungle Fighters symbol.png": ("catachan-jungle-fighters", "Catachan Jungle Fighters", "subfaction", "astra-militarum"),
    "Changehosts of Tzeentch Symbol.jpg": ("tzeentch-changehost", "Changehosts of Tzeentch", "subfaction", "chaos-daemons"),
    "Cult of Strife Symbol.jpg": ("cult-of-strife", "Cult of Strife", "subfaction", "drukhari"),
    "Dark Angels Symbol.png": ("dark-angels", "Dark Angels", "subfaction", "adeptus-astartes"),
    "Deathskulls Symbol.jpg": ("deathskulls", "Deathskulls", "subfaction", "orks"),
    "Evil Sunz Symbol.jpg": ("evil-sunz", "Evil Sunz", "subfaction", "orks"),
    "Farsight Enclaves Symbol.png": ("farsight-enclaves", "Farsight Enclaves", "subfaction", "tau-empire"),
    "Greater Thurian League Symbol.png": ("greater-thurian-league", "Greater Thurian League", "subfaction", "leagues-of-votann"),
    "Hosts of Slaanesh Symbol.jpg": ("slaanesh-excess", "Hosts of Slaanesh", "subfaction", "chaos-daemons"),
    "Imperial Fists Symbol.jpg": ("imperial-fists", "Imperial Fists", "subfaction", "adeptus-astartes"),
    "Iron Hands Symbol.png": ("iron-hands", "Iron Hands", "subfaction", "adeptus-astartes"),
    "Iron Warriors Symbol.jpg": ("iron-warriors", "Iron Warriors", "subfaction", "heretic-astartes"),
    "Iyanden Symbol.jpg": ("iyanden", "Iyanden", "subfaction", "aeldari"),
    "Kabal of the Black Heart Symbol.png": ("kabal-black-heart", "Kabal of the Black Heart", "subfaction", "drukhari"),
    "Kronus Hegemony Symbol.jpg": ("kronus-hegemony", "Kronus Hegemony", "subfaction", "leagues-of-votann"),
    "Mephrit Dynasty Symbol.png": ("mephrit", "Mephrit Dynasty", "subfaction", "necrons"),
    "Night Lords Symbol.jpg": ("night-lords", "Night Lords", "subfaction", "heretic-astartes"),
    "Nihilakh Dynasty Symbol.jpg": ("nihilakh", "Nihilakh Dynasty", "subfaction", "necrons"),
    "Novokh Dynasty Symbol.PNG": ("novokh", "Novokh Dynasty", "subfaction", "necrons"),
    "Order of Our Martyred Lady Symbol.png": ("our-martyred-lady", "Order of Our Martyred Lady", "subfaction", "adepta-sororitas"),
    "Order of the Argent Shroud Symbol.png": ("argent-shroud", "Order of the Argent Shroud", "subfaction", "adepta-sororitas"),
    "Order of the Bloody Rose Symbol.png": ("bloody-rose", "Order of the Bloody Rose", "subfaction", "adepta-sororitas"),
    "Order of the Ebon Chalice Symbol.png": ("ebon-chalice", "Order of the Ebon Chalice", "subfaction", "adepta-sororitas"),
    "Order of the Valorous Heart Symbol.png": ("valorous-heart", "Order of the Valorous Heart", "subfaction", "adepta-sororitas"),
    "Plague Hosts of Nurgle Symbol.png": ("nurgle-plague-host", "Plague Hosts of Nurgle", "subfaction", "chaos-daemons"),
    "Raven Guard Symbol.jpg": ("raven-guard", "Raven Guard", "subfaction", "adeptus-astartes"),
    "Sa'cea Sept Symbol.png": ("sacea", "Sa'cea Sept", "subfaction", "tau-empire"),
    "Saim-Hann Symbol.png": ("saim-hann", "Saim-Hann", "subfaction", "aeldari"),
    "Salamanders Symbol.png": ("salamanders", "Salamanders", "subfaction", "adeptus-astartes"),
    "Sautekh Dynasty Symbol.png": ("sautekh", "Sautekh Dynasty", "subfaction", "necrons"),
    "Snakebites Symbol.jpg": ("snakebites", "Snakebites", "subfaction", "orks"),
    "Space Wolves Symbol.jpg": ("space-wolves", "Space Wolves", "subfaction", "adeptus-astartes"),
    "Tanith First and Only Symbol.png": ("tanith-first-and-only", "Tanith First and Only", "subfaction", "astra-militarum"),
    "T'au Sept Symbol.png": ("tau-sept", "T'au Sept", "subfaction", "tau-empire"),
    "The Bladed Cog Symbol.png": ("bladed-cog", "The Bladed Cog", "subfaction", "genestealer-cults"),
    "The Hivecult Symbol.jpg": ("hivecult", "The Hivecult", "subfaction", "genestealer-cults"),
    "The Pauper Princes Symbol.jpg": ("pauper-princes", "The Pauper Princes", "subfaction", "genestealer-cults"),
    "The Prophets of Flesh Symbol.jpg": ("prophets-of-flesh", "The Prophets of Flesh", "subfaction", "drukhari"),
    "Trans-Hyperian Alliance Symbol.jpg": ("trans-hyperian-alliance", "Trans-Hyperian Alliance", "subfaction", "leagues-of-votann"),
    "Ulthwé Symbol.jpg": ("ulthwe", "Ulthwé", "subfaction", "aeldari"),
    "Ultramarines symbol.jpg": ("ultramarines", "Ultramarines", "subfaction", "adeptus-astartes"),
    "Vior'la Sept Symbol.png": ("viorla", "Vior'la Sept", "subfaction", "tau-empire"),
    "White Scars Symbol.png": ("white-scars", "White Scars", "subfaction", "adeptus-astartes"),
    "Word Bearers Symbol.png": ("word-bearers", "Word Bearers", "subfaction", "heretic-astartes"),
    "Ymyr Conglomerate Symbol.jpg": ("ymyr-conglomerate", "Ymyr Conglomerate", "subfaction", "leagues-of-votann")
}

print(f"Total manual mappings defined: {len(manual_map)}")
print(f"Actual files in directory: {len(files)}")

unmapped = [f for f in files if f not in manual_map]
if unmapped:
    print(f"UNMAPPED FILES: {unmapped}")
else:
    print("ALL 73 FILES ARE PERFECTLY MAPPED!")
