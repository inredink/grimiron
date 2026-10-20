import json
import os

manifest_path = r"C:\Users\patri\.gemini\antigravity\brain\e910d1e9-1ede-4284-bc3b-d608b1bf3c62\vectorized\vectorization_manifest.json"
with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

from verify_file_mappings import file_mappings

# Group by faction
by_faction = {}
for item in manifest:
    sid = item["id"]
    meta = file_mappings.get(item["filename"], {})
    fid = meta.get("factionId", "other")
    if fid not in by_faction:
        by_faction[fid] = []
    by_faction[fid].append({
        **item,
        **meta
    })

artifact_md = []
artifact_md.append("# Official Warhammer 40,000 Vectorized Symbols Gallery")
artifact_md.append("")
artifact_md.append("> [!NOTE]")
artifact_md.append("> All 60 candidate symbol images provided from your collection have been cleanly extracted, vectorized using Potrace curve-tracing, standardized to 512x512 high-resolution monochrome formats (both SVG and transparent PNGs), and integrated directly into the live application.")
artifact_md.append("")
artifact_md.append("## Integration Summary")
artifact_md.append(f"- **Total Vectorized Symbols**: {len(manifest)}")
artifact_md.append("- **Formats Generated**: Clean Vector SVG (`.svg`), White on Transparent PNG (`.png`), Black on Transparent PNG (`_black.png`), and Dark Sci-Fi Preview (`_preview.png`).")
artifact_md.append("- **Application Locations Updated**:")
artifact_md.append("  1. **Character Portrait**: [PlaceholderPortrait.tsx](file:///C:/Users/patri/.gemini/antigravity/scratch/grimiron/src/components/PlaceholderPortrait.tsx) displays the official verified emblem of your selected subfaction or faction.")
artifact_md.append("  2. **Faction Codex**: [factions.tsx](file:///C:/Users/patri/.gemini/antigravity/scratch/grimiron/app/(tabs)/factions.tsx) displays the verified emblem on every army header, subfaction chip, and detail dossier.")
artifact_md.append("  3. **Symbol Asset Catalog**: [factionSymbols.ts](file:///C:/Users/patri/.gemini/antigravity/scratch/grimiron/src/assets/factionSymbols.ts) provides seamless fallback to parent faction emblems for any subfaction without an individual emblem.")
artifact_md.append("")

faction_titles = {
    "adeptus-astartes": "Adeptus Astartes (Space Marines)",
    "astra-militarum": "Astra Militarum (Imperial Guard)",
    "adepta-sororitas": "Adepta Sororitas (Sisters of Battle)",
    "imperial-knights": "Imperial Knights",
    "heretic-astartes": "Heretic Astartes (Chaos Space Marines)",
    "death-guard": "Death Guard",
    "chaos-daemons": "Chaos Daemons",
    "aeldari": "Aeldari (Craftworlds)",
    "drukhari": "Drukhari (Dark Eldar)",
    "necrons": "Necrons",
    "orks": "Orks",
    "tau-empire": "T'au Empire",
    "genestealer-cults": "Genestealer Cults",
    "leagues-of-votann": "Leagues of Votann"
}

artifact_md.append("---")
artifact_md.append("")

for fid, title in faction_titles.items():
    items = by_faction.get(fid, [])
    if not items:
        continue
    artifact_md.append(f"## {title} ({len(items)} Symbols)")
    artifact_md.append("")
    artifact_md.append("| Symbol Preview | Name | Type | Curves | Source Image |")
    artifact_md.append("| :---: | :--- | :---: | :---: | :--- |")
    for it in items:
        sid = it["id"]
        img_path = f"/C:/Users/patri/.gemini/antigravity/brain/e910d1e9-1ede-4284-bc3b-d608b1bf3c62/vectorized/{sid}_preview.png"
        artifact_md.append(f"| ![{it['name']}]({img_path}) | **{it['name']}** (`{sid}`) | `{it['entityType']}` | {it['curves']} | `{it['filename']}` |")
    artifact_md.append("")

output_md_path = r"C:\Users\patri\.gemini\antigravity\brain\e910d1e9-1ede-4284-bc3b-d608b1bf3c62\vectorized_symbols_gallery.md"
with open(output_md_path, "w", encoding="utf-8") as f:
    f.write("\n".join(artifact_md))

print(f"Artifact successfully written to {output_md_path} ({len(artifact_md)} lines)")
