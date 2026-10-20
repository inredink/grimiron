import re
import json

with open('src/content/warhammer40k/factions.ts', 'r', encoding='utf-8') as f:
    text = f.read()

with open('src/assets/factionSymbols.ts', 'r', encoding='utf-8') as f:
    symbols_text = f.read()

catalog_keys = set(re.findall(r"'([^']+)':\s*require", symbols_text))
fallbacks = dict(re.findall(r"'([^']+)':\s*'([^']+)'", symbols_text))

sections = re.split(r'\n\s*\{\s*\n\s*id:\s*\'', text)
data = []

for sec in sections[1:]:
    fid = sec.split("'")[0]
    fname_match = re.search(r"name:\s*['\"]([^'\"]+)['\"]", sec)
    fname = fname_match.group(1) if fname_match else fid
    
    subfactions_match = re.search(r"subfactions:\s*\[(.*?)\]", sec, re.DOTALL)
    sub_items = []
    if subfactions_match:
        sub_items = re.findall(r"id:\s*'([^']+)',\s*factionId:\s*'[^']+',\s*name:\s*['\"]([^'\"]+)['\"]", subfactions_match.group(1))
    
    faction_sym_id = None
    faction_status = "none"
    if fid in catalog_keys:
        faction_sym_id = fid
        faction_status = "dedicated"
    elif fid in fallbacks and fallbacks[fid] in catalog_keys:
        faction_sym_id = fallbacks[fid]
        faction_status = "default_fallback"
        
    subs_data = []
    for sid, sname in sub_items:
        sub_sym_id = None
        sub_status = "none"
        if sid in catalog_keys:
            sub_sym_id = sid
            sub_status = "dedicated"
        elif fid in catalog_keys:
            sub_sym_id = fid
            sub_status = "inherited_faction"
        elif fid in fallbacks and fallbacks[fid] in catalog_keys:
            sub_sym_id = fallbacks[fid]
            sub_status = "inherited_fallback"
            
        subs_data.append({
            "id": sid,
            "name": sname,
            "symbolId": sub_sym_id,
            "status": sub_status
        })
        
    data.append({
        "id": fid,
        "name": fname,
        "symbolId": faction_sym_id,
        "status": faction_status,
        "subfactions": subs_data
    })

print(f"Total factions: {len(data)}")
dedicated_subs = sum(len([s for s in f['subfactions'] if s['status'] == 'dedicated']) for f in data)
inherited_subs = sum(len([s for s in f['subfactions'] if 'inherited' in s['status']]) for f in data)
missing_subs = sum(len([s for s in f['subfactions'] if s['status'] == 'none']) for f in data)
print(f"Subfactions -> Dedicated: {dedicated_subs}, Inherited: {inherited_subs}, Missing: {missing_subs}")

with open('scripts/faction_symbols_summary.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)
print("Saved scripts/faction_symbols_summary.json")
