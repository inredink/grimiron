import os
import json
import re
import base64
from xml.sax.saxutils import escape

svg_dir = r"C:\Users\patri\.gemini\antigravity\brain\e910d1e9-1ede-4284-bc3b-d608b1bf3c62\vectorized"
artifact_dir = r"C:\Users\patri\.gemini\antigravity\brain\e910d1e9-1ede-4284-bc3b-d608b1bf3c62"

with open("scripts/faction_symbols_summary.json", "r", encoding="utf-8") as f:
    factions_summary = json.load(f)

with open(os.path.join(svg_dir, "vectorization_manifest.json"), "r", encoding="utf-8") as f:
    manifest = json.load(f)

manifest_map = {item["id"]: item for item in manifest}

# Cache SVG content (both white and black)
svg_white_cache = {}
svg_black_cache = {}

for sym_id in manifest_map.keys():
    w_path = os.path.join(svg_dir, f"{sym_id}.svg")
    b_path = os.path.join(svg_dir, f"{sym_id}_black.svg")
    if os.path.exists(w_path):
        with open(w_path, "r", encoding="utf-8") as f:
            svg_white_cache[sym_id] = f.read()
    if os.path.exists(b_path):
        with open(b_path, "r", encoding="utf-8") as f:
            svg_black_cache[sym_id] = f.read()

# Generate HTML Verification Hub
html_path = os.path.join(artifact_dir, "symbol_verification_hub.html")

hub_data = []
for fac in factions_summary:
    f_sym = fac["symbolId"]
    fac_obj = {
        "id": fac["id"],
        "name": fac["name"],
        "symbolId": f_sym,
        "status": fac["status"],
        "sourceFile": manifest_map.get(f_sym, {}).get("filename", "") if f_sym else "",
        "subfactions": []
    }
    for sub in fac["subfactions"]:
        s_sym = sub["symbolId"]
        fac_obj["subfactions"].append({
            "id": sub["id"],
            "name": sub["name"],
            "symbolId": s_sym,
            "status": sub["status"],
            "sourceFile": manifest_map.get(s_sym, {}).get("filename", "") if s_sym else ""
        })
    hub_data.append(fac_obj)

svg_js_dict_white = json.dumps(svg_white_cache)
svg_js_dict_black = json.dumps(svg_black_cache)
hub_data_json = json.dumps(hub_data)

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Warhammer 40,000 Symbol Verification Hub</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    :root {{
      --bg-dark: #0a0d14;
      --card-dark: #111722;
      --border-dark: #1e293b;
      --text-dark: #e2e8f0;
      --muted-dark: #94a3b8;
    }}
    .dark-theme {{
      background-color: var(--bg-dark);
      color: var(--text-dark);
    }}
    .light-theme {{
      background-color: #f8fafc;
      color: #0f172a;
    }}
    .symbol-box svg {{
      width: 100%;
      height: 100%;
      object-fit: contain;
    }}
  </style>
</head>
<body class="dark-theme min-h-screen p-4 md:p-6 transition-colors duration-200">
  <div class="max-w-7xl mx-auto space-y-6">
    
    <!-- Top Header & Metrics Bar -->
    <header class="bg-[#111722] border border-[#1e293b] rounded-2xl p-6 shadow-xl header-card">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-6 mb-6">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              Verified Asset Codex
            </span>
            <span class="text-xs text-slate-400">GrimIron Core System &bull; 100% Symbol Coverage</span>
          </div>
          <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>Warhammer 40,000 Symbol Verification Matrix</span>
          </h1>
          <p class="text-sm text-slate-400 mt-1">
            Complete vector verification matrix for all 20 factions and 90 subfactions across the GrimIron system.
          </p>
        </div>

        <!-- Theme Controls -->
        <div class="flex items-center gap-3 self-start md:self-auto">
          <button id="themeToggle" onclick="toggleTheme()" class="px-4 py-2 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-2 transition-all">
            <span id="themeIcon">☀️</span>
            <span id="themeText">Parchment Mode</span>
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-3">
          <div class="text-xs font-medium text-cyan-400">Total Armies</div>
          <div class="text-xl font-bold text-white mt-1">20 Factions</div>
          <div class="text-[11px] text-cyan-400 mt-0.5">100% Armed with Emblems</div>
        </div>
        <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          <div class="text-xs font-medium text-slate-400">Total Subfactions</div>
          <div class="text-xl font-bold text-white mt-1">90 Total</div>
          <div class="text-[11px] text-slate-400 mt-0.5">Chapters, Orders, Septs, Klans</div>
        </div>
        <div class="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3">
          <div class="text-xs font-medium text-emerald-400">Dedicated Symbols</div>
          <div class="text-xl font-bold text-emerald-300 mt-1">57 Subfactions</div>
          <div class="text-[11px] text-emerald-400 mt-0.5">Individual Source Art</div>
        </div>
        <div class="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3">
          <div class="text-xs font-medium text-indigo-400">Inherited Fallbacks</div>
          <div class="text-xl font-bold text-indigo-300 mt-1">33 Subfactions</div>
          <div class="text-[11px] text-indigo-400 mt-0.5">Official Parent Army Mark</div>
        </div>
      </div>
    </header>

    <!-- Search & Filter Ribbon -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111722] border border-[#1e293b] rounded-xl p-3 filter-bar">
      <!-- Search -->
      <div class="relative flex-1">
        <input 
          type="text" 
          id="searchInput" 
          placeholder="Filter by army, subfaction, or ID..." 
          oninput="renderHub()"
          class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>

      <!-- Filter Buttons -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        <button onclick="setFilter('all')" class="filter-btn px-3 py-1.5 text-xs font-medium rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" data-filter="all">All (90)</button>
        <button onclick="setFilter('dedicated')" class="filter-btn px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700" data-filter="dedicated">Dedicated (57)</button>
        <button onclick="setFilter('inherited')" class="filter-btn px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700" data-filter="inherited">Inherited (33)</button>
      </div>
    </div>

    <!-- Main Verification Grid -->
    <div id="factionsContainer" class="space-y-6">
      <!-- Populated dynamically via JS -->
    </div>

  </div>

  <script>
    const hubData = {hub_data_json};
    const svgsWhite = {svg_js_dict_white};
    const svgsBlack = {svg_js_dict_black};
    
    let currentTheme = 'dark';
    let currentFilter = 'all';

    function toggleTheme() {{
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      const body = document.body;
      const themeIcon = document.getElementById('themeIcon');
      const themeText = document.getElementById('themeText');
      
      if (currentTheme === 'light') {{
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Grimdark Mode';
        document.querySelectorAll('.header-card, .filter-bar').forEach(el => {{
          el.style.backgroundColor = '#ffffff';
          el.style.borderColor = '#e2e8f0';
        }});
      }} else {{
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Parchment Mode';
        document.querySelectorAll('.header-card, .filter-bar').forEach(el => {{
          el.style.backgroundColor = '#111722';
          el.style.borderColor = '#1e293b';
        }});
      }}
      renderHub();
    }}

    function setFilter(filter) {{
      currentFilter = filter;
      document.querySelectorAll('.filter-btn').forEach(btn => {{
        if (btn.getAttribute('data-filter') === filter) {{
          btn.className = "filter-btn px-3 py-1.5 text-xs font-medium rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40";
        }} else {{
          btn.className = "filter-btn px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700";
        }}
      }});
      renderHub();
    }}

    function getSvg(symId) {{
      if (!symId) return null;
      const dict = currentTheme === 'dark' ? svgsWhite : svgsBlack;
      return dict[symId] || null;
    }}

    function renderHub() {{
      const query = document.getElementById('searchInput').value.toLowerCase().trim();
      const container = document.getElementById('factionsContainer');
      container.innerHTML = '';

      const isLight = currentTheme === 'light';

      hubData.forEach(fac => {{
        let filteredSubs = fac.subfactions.filter(sub => {{
          const matchQuery = !query || 
            fac.name.toLowerCase().includes(query) || 
            sub.name.toLowerCase().includes(query) || 
            sub.id.toLowerCase().includes(query) ||
            fac.id.toLowerCase().includes(query);

          let matchStatus = true;
          if (currentFilter === 'dedicated') matchStatus = sub.status === 'dedicated';
          else if (currentFilter === 'inherited') matchStatus = sub.status.includes('inherited');

          return matchQuery && matchStatus;
        }});

        if (filteredSubs.length === 0 && query && !fac.name.toLowerCase().includes(query)) {{
          return;
        }}

        const facSection = document.createElement('div');
        facSection.className = `border rounded-2xl p-5 shadow-lg transition-all ${{
          isLight ? 'bg-white border-slate-200' : 'bg-[#111722] border-[#1e293b]'
        }}`;

        const fSymSvg = getSvg(fac.symbolId);
        const fSymHtml = fSymSvg 
          ? `<div class="w-12 h-12 p-1.5 rounded-xl flex items-center justify-center shrink-0 ${{
              isLight ? 'bg-slate-100 border border-slate-300' : 'bg-slate-900 border border-slate-800 shadow-inner'
            }} symbol-box">${{fSymSvg}}</div>`
          : `<div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold bg-slate-800 text-slate-400">NONE</div>`;

        facSection.innerHTML = `
          <div class="flex items-center justify-between flex-wrap gap-4 border-b pb-4 mb-4 ${{isLight ? 'border-slate-200' : 'border-slate-800'}}">
            <div class="flex items-center gap-3">
              ${{fSymHtml}}
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-lg md:text-xl font-bold ${{isLight ? 'text-slate-900' : 'text-white'}}">${{fac.name}}</h2>
                  <span class="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">Official Army Emblem</span>
                </div>
                <div class="text-xs text-slate-400 font-mono mt-0.5">ID: ${{fac.id}} &bull; Source: ${{fac.sourceFile || fac.symbolId}} &bull; ${{fac.subfactions.length}} Subfactions</div>
              </div>
            </div>
            <div class="text-xs font-medium text-slate-400">
              Showing ${{filteredSubs.length}} of ${{fac.subfactions.length}}
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            ${{
              filteredSubs.map(sub => {{
                const sSvg = getSvg(sub.symbolId);
                const sBoxHtml = sSvg
                  ? `<div class="w-16 h-16 p-2 rounded-xl flex items-center justify-center shrink-0 ${{
                      isLight ? 'bg-slate-100 border border-slate-300' : 'bg-slate-900/80 border border-slate-800'
                    }} symbol-box">${{sSvg}}</div>`
                  : `<div class="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 text-center p-1 text-[10px] font-bold text-slate-500">NO SYMBOL</div>`;

                let subBadge = '';
                let note = '';
                if (sub.status === 'dedicated') {{
                  subBadge = `<span class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">✓ Dedicated</span>`;
                  note = `<span class="text-[11px] text-slate-400 truncate block">Src: ${{sub.sourceFile}}</span>`;
                }} else {{
                  subBadge = `<span class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">↳ Inherited</span>`;
                  note = `<span class="text-[11px] text-indigo-400/90 truncate block">Official ${{fac.name.split(' ')[0]}} Emblem</span>`;
                }}

                return `
                  <div class="border rounded-xl p-3 flex gap-3 items-center ${{
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  }} transition-colors">
                    ${{sBoxHtml}}
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5 mb-0.5">
                        <span class="text-sm font-semibold truncate ${{isLight ? 'text-slate-900' : 'text-white'}}">${{sub.name}}</span>
                      </div>
                      <div class="mb-1">${{subBadge}}</div>
                      ${{note}}
                      <div class="text-[10px] text-slate-500 font-mono truncate mt-0.5">${{sub.id}}</div>
                    </div>
                  </div>
                `;
              }}).join('')
            }}
          </div>
        `;

        container.appendChild(facSection);
      }});

      if (container.children.length === 0) {{
        container.innerHTML = `
          <div class="border rounded-2xl p-12 text-center ${{isLight ? 'bg-white border-slate-200' : 'bg-[#111722] border-[#1e293b]'}}">
            <div class="text-3xl mb-2">🔍</div>
            <div class="text-base font-semibold ${{isLight ? 'text-slate-800' : 'text-white'}}">No matching symbols found</div>
            <div class="text-xs text-slate-400 mt-1">Try clearing your search query or selecting a different status filter.</div>
          </div>
        `;
      }}
    }}

    renderHub();
  </script>
</body>
</html>
"""

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Generated HTML Verification Hub: {html_path} ({os.path.getsize(html_path)/1024:.1f} KB)")
