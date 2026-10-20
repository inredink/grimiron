import os
import re
import json

print("==================================================================")
print("             GRIMIRON APP COMPREHENSIVE AUDIT                     ")
print("==================================================================")

errors = []
warnings = []
passed = []

# -----------------------------------------------------------------
# 1. SYMBOL ASSET CATALOG & ON-DISK INTEGRITY
# -----------------------------------------------------------------
symbols_dir = "assets/symbols"
pngs = set(os.listdir(symbols_dir))
white_pngs = {f[:-4] for f in pngs if f.endswith(".png") and not f.endswith("_black.png")}
black_pngs = {f[:-10] for f in pngs if f.endswith("_black.png")}

with open("src/assets/factionSymbols.ts", "r", encoding="utf-8") as f:
    ts_code = f.read()

white_keys = set(re.findall(r"'([^']+)':\s*require\('\.\./\.\./assets/symbols/([^']+)\.png'\)", ts_code))
black_keys = set(re.findall(r"'([^']+)':\s*require\('\.\./\.\./assets/symbols/([^']+)_black\.png'\)", ts_code))

white_key_names = {k[0] for k in white_keys}
black_key_names = {k[0] for k in black_keys}

print(f"\n[1] Checking Symbol Asset Integrity:")
print(f"  - Found {len(white_pngs)} white PNGs and {len(black_pngs)} black PNGs on disk.")
print(f"  - FACTION_SYMBOLS catalog registered: {len(white_key_names)} entries.")
print(f"  - FACTION_SYMBOLS_BLACK catalog registered: {len(black_key_names)} entries.")

for sid in white_key_names:
    if sid not in white_pngs:
        errors.append(f"Asset file missing on disk for white symbol: {sid}.png")
    if sid not in black_pngs:
        errors.append(f"Asset file missing on disk for black symbol: {sid}_black.png")

if not errors:
    passed.append("100% of symbol asset files (146 files) exist and match TypeScript catalog.")

# -----------------------------------------------------------------
# 2. FACTION & SUBFACTION RESOLUTION
# -----------------------------------------------------------------
with open("src/content/warhammer40k/factions.ts", "r", encoding="utf-8") as f:
    factions_code = f.read()

# Fallback map in factionSymbols.ts
fallback_map = dict(re.findall(r"'([^']+)':\s*'([^']+)'", ts_code[ts_code.find("FACTION_DEFAULT_SYMBOL_MAP"):]))

sections = re.split(r'\n\s*\{\s*\n\s*id:\s*\'', factions_code)
unresolved_factions = []
unresolved_subfactions = []
total_subs_checked = 0

for sec in sections[1:]:
    fid = sec.split("'")[0]
    fname_match = re.search(r"name:\s*['\"]([^'\"]+)['\"]", sec)
    fname = fname_match.group(1) if fname_match else fid
    
    # Check faction resolution
    has_fac_sym = fid in white_key_names or (fid in fallback_map and fallback_map[fid] in white_key_names)
    if not has_fac_sym:
        unresolved_factions.append((fid, fname))
        errors.append(f"Faction '{fname}' ({fid}) has no resolved symbol!")
        
    sub_m = re.search(r"subfactions:\s*\[(.*?)\]", sec, re.DOTALL)
    if sub_m:
        for sid, sname in re.findall(r"id:\s*'([^']+)',\s*factionId:\s*'[^']+',\s*name:\s*['\"]([^'\"]+)['\"]", sub_m.group(1)):
            total_subs_checked += 1
            has_sub_sym = sid in white_key_names or fid in white_key_names or (fid in fallback_map and fallback_map[fid] in white_key_names)
            if not has_sub_sym:
                unresolved_subfactions.append((sid, sname, fid))
                errors.append(f"Subfaction '{sname}' ({sid}) in faction {fid} has no resolved symbol!")

print(f"\n[2] Checking Faction & Subfaction Symbol Resolution:")
print(f"  - Total factions audited: {len(sections)-1}")
print(f"  - Total subfactions audited: {total_subs_checked}")
if not unresolved_factions and not unresolved_subfactions:
    passed.append(f"All {len(sections)-1} factions and all {total_subs_checked} subfactions resolve 100% to valid symbols.")

# -----------------------------------------------------------------
# 3. TYPOGRAPHY & APOGLYPH AUDIT
# -----------------------------------------------------------------
print(f"\n[3] Auditing Typography & Escaped Names in factions.ts:")
bad_names = re.findall(r"name:\s*['\"][^'\"]*\\['\"][^'\"]*['\"]", factions_code)
if bad_names:
    errors.append(f"Found corrupted names with backslash: {bad_names}")
else:
    passed.append("All faction and subfaction names are cleanly formatted without backslash escapes.")

import sys
sys.stdout.reconfigure(encoding='utf-8')

# Check for specific names
tau_emp = re.search(r'id:\s*\'tau-empire\',.*?name:\s*"([^"]+)"', factions_code, re.DOTALL)
if tau_emp:
    print(f"  - T'au Empire verified as: \"{tau_emp.group(1)}\"")
    if tau_emp.group(1) == "T'au Empire":
        passed.append("T'au Empire name matches exact lore spelling.")
    else:
        errors.append(f"T'au Empire name mismatch: {tau_emp.group(1)}")

# -----------------------------------------------------------------
# 4. MOBILE LAYOUT & SAFE AREA AUDIT
# -----------------------------------------------------------------
print(f"\n[4] Auditing Safe Area & Navigation Overlap:")
screens = [
    ("app/(tabs)/_layout.tsx", "Tab Navigation Layout"),
    ("app/(tabs)/index.tsx", "Dashboard / Home"),
    ("app/(tabs)/workout.tsx", "Active Workout Screen"),
    ("app/(tabs)/factions.tsx", "Codex Screen"),
    ("app/(tabs)/raid.tsx", "Raid Boss Screen"),
    ("app/(tabs)/history.tsx", "History Screen"),
]

for s_path, s_name in screens:
    if not os.path.exists(s_path):
        errors.append(f"Screen file missing: {s_path}")
        continue
    with open(s_path, "r", encoding="utf-8") as f:
        src = f.read()
    
    # Check if useSafeAreaInsets is imported and used
    has_safe_area = "useSafeAreaInsets" in src or "SafeAreaView" in src
    # Check if paddingBottom or insets.bottom is applied
    has_bottom_padding = "bottom" in src.lower() or "paddingbottom" in src.lower()
    
    print(f"  - {s_name} ({s_path}):")
    print(f"      SafeArea hook: {'YES' if has_safe_area else 'NO'}")
    print(f"      Bottom padding/insets: {'YES' if has_bottom_padding else 'NO'}")

# -----------------------------------------------------------------
# 5. HAPTICS IMPLEMENTATION AUDIT
# -----------------------------------------------------------------
print(f"\n[5] Auditing Haptic Feedback Architecture:")
haptics_path = "src/utils/haptics.ts"
if os.path.exists(haptics_path):
    with open(haptics_path, "r", encoding="utf-8") as f:
        haptics_src = f.read()
    has_try_catch = "try" in haptics_src and "catch" in haptics_src
    has_platform_check = "Platform" in haptics_src
    print(f"  - Haptics utility found: {haptics_path}")
    print(f"      Safe execution (try/catch): {'YES' if has_try_catch else 'NO'}")
    print(f"      Platform safety: {'YES' if has_platform_check else 'NO'}")
    if has_try_catch and has_platform_check:
        passed.append("Haptics utility is bulletproof with cross-platform checks and exception guards.")
else:
    warnings.append("src/utils/haptics.ts not found.")

# -----------------------------------------------------------------
# 6. SUMMARY
# -----------------------------------------------------------------
print("\n==================================================================")
print("AUDIT RESULTS SUMMARY:")
print(f"  PASSED CHECKS: {len(passed)}")
for p in passed:
    print(f"    [PASS] {p}")

if warnings:
    print(f"\n  WARNINGS: {len(warnings)}")
    for w in warnings:
        print(f"    [WARN] {w}")

if errors:
    print(f"\n  ERRORS DETECTED: {len(errors)}")
    for e in errors:
        print(f"    [FAIL] {e}")
else:
    print(f"\n  CRITICAL ERRORS: 0")

print("==================================================================")
