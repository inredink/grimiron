import re

with open('src/content/warhammer40k/factions.ts', 'r', encoding='utf-8') as f:
    text = f.read()

for m in re.finditer(r"name:\s*(['\"])(.*?)\1", text):
    raw_val = m.group(2)
    if "\\" in raw_val or "'" in raw_val:
        print(f"Matched name: {raw_val}")
