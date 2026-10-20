import os
import json
import base64
import sys

sys.path.append('scripts')
from verify_file_mappings import file_mappings

svg_dir = r"C:\Users\patri\.gemini\antigravity\brain\e910d1e9-1ede-4284-bc3b-d608b1bf3c62\vectorized"
artifact_dir = r"C:\Users\patri\.gemini\antigravity\brain\e910d1e9-1ede-4284-bc3b-d608b1bf3c62"
gallery_md_path = os.path.join(artifact_dir, "vectorized_symbols_gallery.md")

with open(os.path.join(svg_dir, "vectorization_manifest.json"), "r", encoding="utf-8") as f:
    manifest = json.load(f)

# Group by army using file_mappings
army_groups = {}
for item in manifest:
    filename = item["filename"]
    meta = file_mappings.get(filename, {})
    army = meta.get("army", "Other")
    if army not in army_groups:
        army_groups[army] = []
    
    item_copy = dict(item)
    item_copy["type"] = meta.get("type", "subfaction")
    army_groups[army].append(item_copy)

md_lines = [
    "# Official Warhammer 40,000 Vectorized Symbols Gallery",
    "",
    "> [!NOTE]",
    "> All 60 candidate symbol images provided from `c:\\Users\\patri\\Pictures\\Warhammer Art\\Symbols` have been cleanly extracted, vectorized into monochrome vector format, standardized to 512×512 resolution, and integrated into the GrimIron app.",
    "",
    "## Verification Highlights",
    "- **Total Vectorized Symbols**: 60",
    "- **Subfaction Fallback**: Subfactions without dedicated files inherit their parent army's symbol automatically.",
    "- **Interactive Viewer**: Also check out the interactive [`symbol_verification_hub.html`](file:///C:/Users/patri/.gemini/antigravity/brain/e910d1e9-1ede-4284-bc3b-d608b1bf3c62/symbol_verification_hub.html) with real-time search, filters, and Dark/Light preview toggling.",
    "",
    "---",
    ""
]

for army, items in army_groups.items():
    md_lines.append(f"## {army} ({len(items)} Symbols)")
    md_lines.append("")
    md_lines.append("| Preview | Name | Type | Curves | Source Image |")
    md_lines.append("| :---: | :--- | :---: | :---: | :--- |")
    
    for item in items:
        sym_id = item["id"]
        prev_path = os.path.join(svg_dir, f"{sym_id}_preview.png")
        if os.path.exists(prev_path):
            with open(prev_path, "rb") as f:
                b64_data = base64.b64encode(f.read()).decode("utf-8")
            img_tag = f'<img src="data:image/png;base64,{b64_data}" width="72" height="72" alt="{item["name"]}" />'
        else:
            img_tag = f"**{sym_id}**"
            
        md_lines.append(f'| {img_tag} | **{item["name"]}** (`{sym_id}`) | `{item["type"]}` | {item["curves"]} | `{item["filename"]}` |')
    md_lines.append("")

with open(gallery_md_path, "w", encoding="utf-8") as f:
    f.write("\n".join(md_lines))

print(f"Updated {gallery_md_path} ({os.path.getsize(gallery_md_path)/1024:.1f} KB)")
