import re
import os

with open('src/content/warhammer40k/factions.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Match factions
# Each faction starts with { id: '...', universeId: 'warhammer40k', allegiance: '...', name: '...' ... subfactions: [ ... ]
pattern = re.compile(r"id:\s*'([a-z0-9\-]+)',\s*universeId:\s*'warhammer40k',\s*allegiance:\s*'([a-z]+)',\s*name:\s*'([^']+)'", re.MULTILINE)

faction_pos = [m.start() for m in pattern.finditer(text)]
faction_pos.append(len(text))

symbols_folder = r"c:\Users\patri\Pictures\Warhammer Art\Symbols"
symbol_files = os.listdir(symbols_folder) if os.path.exists(symbols_folder) else []

factions_data = []
for i in range(len(faction_pos) - 1):
    chunk = text[faction_pos[i]:faction_pos[i+1]]
    m = pattern.search(chunk)
    fid, allegiance, fname = m.groups()
    
    sub_chunk_match = re.search(r"subfactions:\s*\[(.*?)\]", chunk, re.DOTALL)
    subs = []
    if sub_chunk_match:
        sub_raw = sub_chunk_match.group(1)
        sub_matches = re.finditer(r"id:\s*'([a-z0-9\-]+)',\s*factionId:\s*'[^']+',\s*name:\s*'([^']+)'", sub_raw)
        for sm in sub_matches:
            subs.append({'id': sm.group(1), 'name': sm.group(2)})
            
    factions_data.append({
        'id': fid,
        'allegiance': allegiance,
        'name': fname,
        'subfactions': subs
    })

print(f"Total Factions: {len(factions_data)}")
total_subs = sum(len(f['subfactions']) for f in factions_data)
print(f"Total Subfactions: {total_subs}")

print("\n--- MATCHING SYMBOL FILES ---")
print(f"Total symbol files provided by user: {len(symbol_files)}")

# Check matching
def normalize(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())

for f in factions_data:
    print(f"\n[{f['allegiance'].upper()}] {f['name']} (ID: {f['id']})")
    # check faction symbol
    matched_f_symbol = None
    for sf in symbol_files:
        sf_clean = normalize(sf.replace("Symbol", "").replace(".png", "").replace(".jpg", "").replace(".jpeg", ""))
        f_clean = normalize(f['name'])
        f_id_clean = normalize(f['id'])
        if sf_clean in f_clean or f_id_clean in sf_clean or sf_clean in f_id_clean:
            matched_f_symbol = sf
            break
    print(f"  Faction Symbol: {matched_f_symbol if matched_f_symbol else 'NOT FOUND'}")
    
    for s in f['subfactions']:
        matched_s_symbol = None
        for sf in symbol_files:
            sf_clean = normalize(sf.replace("Symbol", "").replace(".png", "").replace(".jpg", "").replace(".jpeg", ""))
            s_clean = normalize(s['name'])
            s_id_clean = normalize(s['id'])
            if sf_clean == s_clean or sf_clean == s_id_clean or sf_clean in s_clean or s_clean in sf_clean:
                matched_s_symbol = sf
                break
        status = f"FOUND: {matched_s_symbol}" if matched_s_symbol else "MISSING -> Will use faction symbol"
        print(f"    - {s['name']} (ID: {s['id']}): {status}")
