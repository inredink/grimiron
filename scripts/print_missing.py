import json

with open('scripts/faction_symbols_summary.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for fac in data:
    if fac['status'] == 'none':
        print(f"Faction without symbol: {fac['name']} ({fac['id']}) - {len(fac['subfactions'])} subfactions")
        for s in fac['subfactions']:
            print(f"    - {s['name']} ({s['id']})")
    else:
        inherited = [s for s in fac['subfactions'] if 'inherited' in s['status']]
        if inherited:
            print(f"Faction {fac['name']} has inherited subfactions:")
            for s in inherited:
                print(f"    - {s['name']} ({s['id']}) -> using {s['symbolId']}")
