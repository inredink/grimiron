import os
import sys

sys.path.append('scripts')
from verify_file_mappings import file_mappings

sym_ids = sorted(list(set(meta["id"] for meta in file_mappings.values())))

lines = [
    "import { ImageSourcePropType } from 'react-native';",
    "",
    "/**",
    f" * Typed catalog of all {len(sym_ids)} verified Warhammer 40,000 faction and subfaction symbols.",
    " * White monochrome variant on transparent background, optimized for dark terminal themes.",
    " */",
    "export const FACTION_SYMBOLS: Record<string, ImageSourcePropType> = {"
]

for sid in sym_ids:
    lines.append(f"  '{sid}': require('../../assets/symbols/{sid}.png'),")

lines.append("};")
lines.append("")
lines.append("/**")
lines.append(f" * Typed catalog of all {len(sym_ids)} verified Warhammer 40,000 faction and subfaction symbols.")
lines.append(" * Black monochrome variant on transparent background, for light/high-contrast UI.")
lines.append(" */")
lines.append("export const FACTION_SYMBOLS_BLACK: Record<string, ImageSourcePropType> = {")

for sid in sym_ids:
    lines.append(f"  '{sid}': require('../../assets/symbols/{sid}_black.png'),")

lines.append("};")
lines.append("")
lines.append("/**")
lines.append(" * Fallback main faction symbol mappings when an individual subfaction symbol")
lines.append(" * is not independently available.")
lines.append(" * All 20 armies in the 40k galaxy now map to their official verified insignia.")
lines.append(" */")
lines.append("export const FACTION_DEFAULT_SYMBOL_MAP: Record<string, string> = {")
lines.append("  'adeptus-astartes': 'ultramarines',")
lines.append("  'astra-militarum': 'astra-militarum',")
lines.append("  'adeptus-mechanicus': 'adeptus-mechanicus',")
lines.append("  'adepta-sororitas': 'adepta-sororitas',")
lines.append("  'adeptus-custodes': 'adeptus-custodes',")
lines.append("  'grey-knights': 'grey-knights',")
lines.append("  'imperial-knights': 'imperial-knights',")
lines.append("  'heretic-astartes': 'heretic-astartes',")
lines.append("  'death-guard': 'death-guard',")
lines.append("  'thousand-sons': 'thousand-sons',")
lines.append("  'world-eaters': 'world-eaters',")
lines.append("  'chaos-daemons': 'chaos-daemons',")
lines.append("  'aeldari': 'aeldari',")
lines.append("  'drukhari': 'kabal-black-heart',")
lines.append("  'necrons': 'necrons',")
lines.append("  'orks': 'orks',")
lines.append("  'tau-empire': 'tau-sept',")
lines.append("  'tyranids': 'tyranids',")
lines.append("  'genestealer-cults': 'genestealer-cults',")
lines.append("  'leagues-of-votann': 'greater-thurian-league',")
lines.append("};")
lines.append("")
lines.append("/**")
lines.append(" * Retrieves the official verified symbol for any faction and subfaction.")
lines.append(" * If the subfaction lacks an individual symbol, automatically falls back to")
lines.append(" * the parent faction's official symbol.")
lines.append(" */")
lines.append("export function getFactionSymbol(")
lines.append("  factionId?: string,")
lines.append("  subfactionId?: string,")
lines.append("  variant: 'white' | 'black' = 'white'")
lines.append("): ImageSourcePropType | null {")
lines.append("  const catalog = variant === 'black' ? FACTION_SYMBOLS_BLACK : FACTION_SYMBOLS;")
lines.append("")
lines.append("  // 1. Check if specific subfaction symbol exists")
lines.append("  if (subfactionId && catalog[subfactionId]) {")
lines.append("    return catalog[subfactionId];")
lines.append("  }")
lines.append("")
lines.append("  // 2. Check if direct parent faction symbol exists")
lines.append("  if (factionId && catalog[factionId]) {")
lines.append("    return catalog[factionId];")
lines.append("  }")
lines.append("")
lines.append("  // 3. Fallback to default symbol for the faction")
lines.append("  if (factionId && FACTION_DEFAULT_SYMBOL_MAP[factionId]) {")
lines.append("    const defaultSymId = FACTION_DEFAULT_SYMBOL_MAP[factionId];")
lines.append("    if (catalog[defaultSymId]) {")
lines.append("      return catalog[defaultSymId];")
lines.append("    }")
lines.append("  }")
lines.append("")
lines.append("  return null;")
lines.append("}")
lines.append("")

out_file = r"src/assets/factionSymbols.ts"
with open(out_file, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"Updated {out_file} with {len(sym_ids)} symbols.")
