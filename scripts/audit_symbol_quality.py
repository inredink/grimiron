import os
import numpy as np
from PIL import Image

output_dir = r"C:\Users\patri\.gemini\antigravity\brain\e910d1e9-1ede-4284-bc3b-d608b1bf3c62\vectorized"
app_assets_dir = r"C:\Users\patri\.gemini\antigravity\scratch\grimiron\assets\symbols"

from verify_file_mappings import file_mappings

print("Auditing all 60 symbols for edge touches / frame borders...")
border_issues = []

for filename, meta in file_mappings.items():
    sym_id = meta["id"]
    png_path = os.path.join(app_assets_dir, f"{sym_id}.png")
    if not os.path.exists(png_path):
        print(f"Missing {sym_id}.png")
        continue
    
    im = Image.open(png_path)
    arr = np.array(im) # (512, 512, 4)
    alpha = arr[:, :, 3]
    
    # Check if alpha touches the 4 outer edges of the 512x512 canvas
    top = np.any(alpha[0, :] > 0)
    bottom = np.any(alpha[-1, :] > 0)
    left = np.any(alpha[:, 0] > 0)
    right = np.any(alpha[:, -1] > 0)
    
    # Also check border coverage (if > 10% of pixels at the margin are filled, it's a frame!)
    margin_pixels = np.concatenate([alpha[:5, :].ravel(), alpha[-5:, :].ravel(), alpha[:, :5].ravel(), alpha[:, -5:].ravel()])
    border_fill_pct = np.mean(margin_pixels > 0) * 100
    
    coverage = np.mean(alpha > 0) * 100
    
    if top or bottom or left or right or border_fill_pct > 0:
        border_issues.append((sym_id, filename, border_fill_pct, coverage))
        print(f"BORDER DETECTED: {sym_id} ({filename}) -> border_fill: {border_fill_pct:.1f}%, total coverage: {coverage:.1f}%")
    else:
        # Check if coverage is suspiciously high (>60%) or suspiciously low (<2%)
        if coverage > 60 or coverage < 2:
            print(f"WARNING (Coverage): {sym_id} ({filename}) -> coverage: {coverage:.1f}%")

print(f"\nTotal with border issues: {len(border_issues)}")
