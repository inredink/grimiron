import re
import os

with open('src/content/warhammer40k/factions.ts', 'r', encoding='utf-8') as f:
    text = f.read()

pattern = re.compile(r"id:\s*'([a-z0-9\-]+)',\s*universeId:\s*'warhammer40k',\s*allegiance:\s*'([a-z]+)',\s*name:\s*'([^']+)'", re.MULTILINE)
faction_pos = [m.start() for m in pattern.finditer(text)]
faction_pos.append(len(text))

factions = []
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
    factions.append({'id': fid, 'allegiance': allegiance, 'name': fname, 'subfactions': subs})

symbols_dir = r"c:\Users\patri\Pictures\Warhammer Art\Symbols"
files = sorted(os.listdir(symbols_dir))

print("=== USER'S 60 SYMBOL FILES ===")
for i, f in enumerate(files, 1):
    print(f"{i:2}. {f}")

print("\n=== APP'S 20 FACTIONS & SUBFACTIONS ===")
for f in factions:
    print(f"\nFaction: {f['id']} | '{f['name']}' ({len(f['subfactions'])} subfactions)")
    for s in f['subfactions']:
        print(f"  - {s['id']}: '{s['name']}'")
