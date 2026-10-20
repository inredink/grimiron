import os
import numpy as np
from PIL import Image
from scipy.ndimage import label

app_assets_dir = r"C:\Users\patri\.gemini\antigravity\scratch\grimiron\assets\symbols"
from verify_file_mappings import file_mappings

print("Checking all 60 symbols for component count and framing...")

for filename, meta in file_mappings.items():
    sym_id = meta["id"]
    png_path = os.path.join(app_assets_dir, f"{sym_id}.png")
    if not os.path.exists(png_path):
        continue
    
    im = Image.open(png_path)
    alpha = np.array(im)[:, :, 3] > 0
    lbl, n = label(alpha)
    
    # Check if any component surrounds another or forms a bounding frame
    if n > 1:
        # Check component bounding boxes
        areas = [np.sum(lbl == i) for i in range(1, n+1)]
        # Check if the largest or any component has a huge bounding box containing the others
        for i in range(1, n+1):
            comp_mask = lbl == i
            ymin, ymax = np.where(np.any(comp_mask, axis=1))[0][[0, -1]]
            xmin, xmax = np.where(np.any(comp_mask, axis=0))[0][[0, -1]]
            h = ymax - ymin
            w = xmax - xmin
            # Check if this component has empty center and touches bounds
            if h > 450 and w > 450 and np.sum(comp_mask) < (h * w * 0.3):
                # Potential hollow frame!
                print(f"SUSPECT FRAME: {sym_id} ({filename}) -> Comp {i}: area={np.sum(comp_mask)}, bbox=({xmin},{ymin},{xmax},{ymax})")
