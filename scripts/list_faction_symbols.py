import re
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

with open('src/content/warhammer40k/factions.ts', 'r', encoding='utf-8') as f:
    text = f.read()

with open('src/assets/factionSymbols.ts', 'r', encoding='utf-8') as f:
    symbols_text = f.read()

catalog_keys = set(re.findall(r"'([^']+)':\s*require", symbols_text))
fallbacks = dict(re.findall(r"'([^']+)':\s*'([^']+)'", symbols_text))

sections = re.split(r'\n\s*\{\s*\n\s*id:\s*\'', text)
for sec in sections[1:]:
    fid = sec.split("'")[0]
    fname_match = re.search(r"name:\s*'([^']+)'", sec)
    fname = fname_match.group(1) if fname_match else fid
    
    subfactions_match = re.search(r"subfactions:\s*\[(.*?)\]", sec, re.DOTALL)
    sub_items = []
    if subfactions_match:
        sub_items = re.findall(r"id:\s*'([^']+)',\s*factionId:\s*'[^']+',\s*name:\s*'([^']+)'", subfactions_match.group(1))
    
    faction_symbol = None
    if fid in catalog_keys:
        faction_symbol = fid
    elif fid in fallbacks and fallbacks[fid] in catalog_keys:
        faction_symbol = f"{fallbacks[fid]} (default for {fid})"
    else:
        faction_symbol = "NONE"
        
    print(f"\n==================================================================")
    print(f"FACTION: {fname} [{fid}]")
    print(f"  Faction Symbol: {faction_symbol}")
    print(f"==================================================================")
    for sid, sname in sub_items:
        if sid in catalog_keys:
            print(f"  + [OWN SYMBOL] {sname} ({sid}) -> {sid}")
        elif fid in catalog_keys:
            print(f"  > [INHERITED] {sname} ({sid}) -> {fid}")
        elif fid in fallbacks and fallbacks[fid] in catalog_keys:
            print(f"  > [FALLBACK] {sname} ({sid}) -> {fallbacks[fid]}")
        else:
            print(f"  x [MISSING] {sname} ({sid}) -> NONE")
